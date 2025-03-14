import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getUserProfile, updateProfilePicture, updateProfile, UserProfile, logout } from '../services/api';
// Import icons
import { CgProfile } from 'react-icons/cg';
import { IoSettingsOutline, IoHomeOutline } from 'react-icons/io5';
import { MdOutlineWorkspacePremium, MdMusicNote, MdAdd, MdEdit, MdLogout } from 'react-icons/md';
import { FiLogOut, FiUser } from 'react-icons/fi';
import { BiChevronDown } from 'react-icons/bi';
import { BsCamera } from 'react-icons/bs';

// Styled components for the redesigned profile page
const AppLayout = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  color: #333;
  max-width: 100vw;
  overflow-x: hidden;
  transition: opacity 0.2s ease;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Sidebar = styled.div`
  width: 240px;
  background-color: #1DB954;
  color: white;
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  padding: 0 20px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
`;

const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const NavItem = styled(Link)<{ active?: boolean }>`
  padding: 12px 20px;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  font-weight: ${props => props.active ? '600' : '400'};
  background-color: ${props => props.active ? 'rgba(0, 0, 0, 0.2)' : 'transparent'};
  border-left: ${props => props.active ? '4px solid white' : '4px solid transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border-left: 4px solid rgba(255, 255, 255, 0.7);
  }
`;

const NavIcon = styled.span`
  margin-right: 10px;
  font-size: 18px;
  display: flex;
  align-items: center;
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 240px;
  padding: 30px;
  width: calc(100% - 240px);
  transition: all 0.2s ease;
  
  @media (max-width: 1200px) {
    padding: 30px 40px;
  }
  
  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    padding: 20px;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const UserActions = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #1DB954;
`;

const UserName = styled.span`
  font-weight: 500;
`;

const LogoutButton = styled.button`
  background-color: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f0f0f0;
    color: #e91429;
  }
`;

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ProfileCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
`;

const ProfileHeader = styled.div`
  background: linear-gradient(90deg, #1DB954, #169c46);
  padding: 30px;
  color: white;
  position: relative;
`;

const ProfileHeaderContent = styled.div`
  display: flex;
  align-items: flex-start;
  gap: 20px;
`;

const ProfileImageContainer = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 10px;
`;

const ProfilePicture = styled.div`
  position: relative;
  width: 100px;
  height: 100px;
`;

const ProfileImage = styled.img`
  width: 100px;
  height: 100px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid white;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
`;

const ProfileImageOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100px;
  height: 100px;
  border-radius: 50%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  cursor: pointer;

  &:hover {
    opacity: 1;
  }
`;

const UploadIcon = styled.div`
  color: white;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const ProfileDetails = styled.div`
  flex: 1;
`;

const ProfileName = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin: 0 0 5px;
`;

const ProfileRole = styled.p`
  font-size: 16px;
  margin: 0;
  opacity: 0.9;
`;

const EditButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background-color: rgba(255, 255, 255, 0.2);
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 12px;
  font-size: 14px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.3);
  }
`;

const ProfileContent = styled.div`
  padding: 30px;
`;

const ProfileInfoGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 20px;
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const ProfileInfoItem = styled.div`
  margin-bottom: 20px;
`;

const ProfileInfoLabel = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
`;

const ProfileInfoValue = styled.p`
  font-size: 16px;
  color: #333;
  font-weight: 500;
  margin: 0;
`;

const EditableInput = styled.input`
  width: 100%;
  background-color: #f9f9f9;
  border: 1px solid #ddd;
  border-radius: 4px;
  color: #333;
  padding: 10px;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #1DB954;
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.1);
  }
`;

const ButtonsContainer = styled.div`
  display: flex;
  gap: 10px;
  margin-top: 20px;
`;

const Button = styled.button`
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  
  &:hover {
    background-color: #169c46;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const SecondaryButton = styled(Button)`
  background-color: #f0f0f0;
  color: #333;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const DangerButton = styled(Button)`
  background-color: #e91429;
  
  &:hover {
    background-color: #c01022;
  }
`;

const StatsCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 30px;
`;

const StatsTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
  color: #333;
`;

const StatsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const StatLabel = styled.span`
  font-size: 14px;
  color: #666;
`;

const StatValue = styled.span`
  font-size: 16px;
  font-weight: 600;
  color: #333;
`;

const ComingSoonCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 30px;
  margin-top: 30px;
  text-align: center;
`;

const ComingSoonTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 15px;
  color: #1DB954;
`;

const ComingSoonText = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
`;

const NotificationMessage = styled.div<{ type: 'success' | 'error' }>`
  background-color: ${props => props.type === 'success' 
    ? 'rgba(29, 185, 84, 0.1)' 
    : 'rgba(233, 20, 41, 0.1)'};
  color: ${props => props.type === 'success' ? '#1DB954' : '#e91429'};
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;

  &::before {
    content: '${props => props.type === 'success' ? '✅' : '⚠️'}';
  }
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 5px 10px;
  font-size: 12px;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  margin-top: 5px;
  
  &:hover {
    background-color: #169c46;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const ProfilePage: React.FC = () => {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [editableProfile, setEditableProfile] = useState<Partial<UserProfile> | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    fetchProfile();
  }, []);
  
  const fetchProfile = async () => {
    try {
      setLoading(true);
      const data = await getUserProfile();
      setProfileData(data);
      setError(null);
    } catch (err) {
      setError('Failed to load profile data. Please try again later.');
      console.error('Error fetching profile:', err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleUploadClick = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      console.log('File selected:', file.name, file.type, file.size);
      
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setNotification({
          message: "Please select an image file (JPEG, PNG, etc.)",
          type: 'error'
        });
        // Clear the file input
        e.target.value = '';
        return;
      }
      
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setNotification({
          message: "Image is too large. Maximum size is 5MB.",
          type: 'error'
        });
        // Clear the file input
        e.target.value = '';
        return;
      }
      
      // Create a preview of the selected image
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target && event.target.result) {
          setFilePreview(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
      
      setSelectedFile(file);
      // Clear any existing notifications
      setNotification(null);
      
      // Show a notification that a file was selected
      setNotification({
        message: `Selected file: ${file.name}. Click Upload to save.`,
        type: 'success'
      });
      
      // Don't automatically submit - let user click the upload button
    }
  };
  
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!selectedFile) {
      console.log('No file selected');
      return;
    }
    
    try {
      setUploading(true);
      
      console.log('Uploading file:', selectedFile.name, selectedFile.type, selectedFile.size);
      
      const updatedProfile = await updateProfilePicture(selectedFile);
      console.log('Profile updated successfully:', updatedProfile);
      setProfileData(updatedProfile);
      setNotification({
        message: "Profile picture updated successfully!",
        type: 'success'
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
      
      // Clear selected file
      setSelectedFile(null);
      // Reset the file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    } catch (err: any) {
      console.error('Error details:', err);
      const errorResponse = err.response || {};
      console.error('Error status:', errorResponse.status);
      console.error('Error data:', errorResponse.data);
      
      const errorMessage = err.response?.data?.error || "Failed to update profile picture. Please try again.";
      setNotification({
        message: errorMessage,
        type: 'error'
      });
      console.error('Error updating profile picture:', err);
    } finally {
      setUploading(false);
    }
  };
  
  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Error logging out:', error);
        // Force logout even if API call fails
        localStorage.removeItem('auth_token');
        navigate('/login');
      }
    }
  };
  
  const handleEditClick = () => {
    setIsEditMode(true);
    setEditableProfile({
      name: profileData?.name || '',
      role: profileData?.role || '',
      email: profileData?.email || ''
    });
  };
  
  const handleCancelEdit = () => {
    setIsEditMode(false);
    setEditableProfile(null);
  };
  
  const handleEditChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    if (editableProfile) {
      setEditableProfile({
        ...editableProfile,
        [name]: value
      });
    }
  };
  
  const handleSaveProfile = async () => {
    if (!editableProfile) return;
    
    try {
      setSaving(true);
      const updatedProfile = await updateProfile(editableProfile);
      setProfileData(updatedProfile);
      setIsEditMode(false);
      setNotification({
        message: "Profile updated successfully!",
        type: 'success'
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (err) {
      setNotification({
        message: "Failed to update profile. Please try again.",
        type: 'error'
      });
      console.error('Error updating profile:', err);
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <AppLayout>
        <Sidebar>
          <Logo>zLyrics</Logo>
          <NavMenu>
            <NavItem to="/" active>
              <NavIcon>{IoHomeOutline({ size: 18 })}</NavIcon> Home
            </NavItem>
            <NavItem to="/profile">
              <NavIcon>{CgProfile({ size: 18 })}</NavIcon> Profile
            </NavItem>
            <NavItem to="/songs">
              <NavIcon>{MdMusicNote({ size: 18 })}</NavIcon> My Songs
            </NavItem>
            <NavItem to="/create">
              <NavIcon>{MdAdd({ size: 18 })}</NavIcon> Create Video
            </NavItem>
          </NavMenu>
        </Sidebar>
        <MainContent>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          </div>
        </MainContent>
      </AppLayout>
    );
  }
  
  if (error || !profileData) {
    return (
      <AppLayout>
        <Sidebar>
          <Logo>zLyrics</Logo>
          <NavMenu>
            <NavItem to="/" active>
              <NavIcon>{IoHomeOutline({ size: 18 })}</NavIcon> Home
            </NavItem>
            <NavItem to="/profile">
              <NavIcon>{CgProfile({ size: 18 })}</NavIcon> Profile
            </NavItem>
            <NavItem to="/songs">
              <NavIcon>{MdMusicNote({ size: 18 })}</NavIcon> My Songs
            </NavItem>
            <NavItem to="/create">
              <NavIcon>{MdAdd({ size: 18 })}</NavIcon> Create Video
            </NavItem>
          </NavMenu>
        </Sidebar>
        <MainContent>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <h2>Error</h2>
            <p>{error || 'Failed to load profile data'}</p>
            <Button onClick={fetchProfile}>Try Again</Button>
          </div>
        </MainContent>
      </AppLayout>
    );
  }
  
  return (
    <AppLayout>
      <Sidebar>
        <Logo>zLyrics</Logo>
        <NavMenu>
          <NavItem to="/" active>
            <NavIcon>{IoHomeOutline({ size: 18 })}</NavIcon> Home
          </NavItem>
          <NavItem to="/profile">
            <NavIcon>{CgProfile({ size: 18 })}</NavIcon> Profile
          </NavItem>
          <NavItem to="/songs">
            <NavIcon>{MdMusicNote({ size: 18 })}</NavIcon> My Songs
          </NavItem>
          <NavItem to="/create">
            <NavIcon>{MdAdd({ size: 18 })}</NavIcon> Create Video
          </NavItem>
        </NavMenu>
      </Sidebar>
      
      <MainContent>
        <PageHeader>
          <PageTitle>My Profile</PageTitle>
          <UserActions>
            <UserInfo>
              <UserAvatar 
                src={filePreview || profileData.profile_picture || "https://via.placeholder.com/40x40?text=User"} 
                alt={profileData.name} 
              />
              <UserName>{profileData.name}</UserName>
            </UserInfo>
            <LogoutButton onClick={handleLogout}>
              {MdLogout({ size: 18 })} Logout
            </LogoutButton>
          </UserActions>
        </PageHeader>
        
        {notification && (
          <NotificationMessage type={notification.type}>
            {notification.message}
          </NotificationMessage>
        )}
        
        <ContentGrid>
          <ProfileCard>
            <ProfileHeader>
              <ProfileHeaderContent>
                <ProfileImageContainer>
                  <ProfilePicture>
                    <ProfileImage 
                      src={filePreview || profileData.profile_picture || "https://via.placeholder.com/100x100?text=Profile"} 
                      alt={profileData.name} 
                    />
                    <ProfileImageOverlay onClick={handleUploadClick}>
                      <UploadIcon>{BsCamera({ size: 24 })}</UploadIcon>
                    </ProfileImageOverlay>
                    <FileInput 
                      ref={fileInputRef}
                      type="file" 
                      accept="image/*" 
                      onChange={handleFileChange} 
                      disabled={uploading || isEditMode}
                      name="profile_picture"
                    />
                  </ProfilePicture>
                  {selectedFile && (
                    <UploadButton 
                      onClick={handleSubmit} 
                      disabled={uploading}
                    >
                      {uploading ? 'Uploading...' : 'Upload Picture'}
                    </UploadButton>
                  )}
                </ProfileImageContainer>
                <ProfileDetails>
                  <ProfileName>{profileData.name}</ProfileName>
                  <ProfileRole>{profileData.role}</ProfileRole>
                </ProfileDetails>
              </ProfileHeaderContent>
              {!isEditMode && (
                <EditButton onClick={handleEditClick}>
                  {MdEdit({ size: 16 })} Edit Profile
                </EditButton>
              )}
            </ProfileHeader>
            
            <ProfileContent>
              <ProfileInfoGrid>
                <ProfileInfoItem>
                  <ProfileInfoLabel>Name</ProfileInfoLabel>
                  {isEditMode ? (
                    <EditableInput
                      name="name"
                      value={editableProfile?.name || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <ProfileInfoValue>{profileData.name}</ProfileInfoValue>
                  )}
                </ProfileInfoItem>
                
                <ProfileInfoItem>
                  <ProfileInfoLabel>Role</ProfileInfoLabel>
                  {isEditMode ? (
                    <EditableInput
                      name="role"
                      value={editableProfile?.role || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    <ProfileInfoValue>{profileData.role}</ProfileInfoValue>
                  )}
                </ProfileInfoItem>
                
                {isEditMode && (
                  <ProfileInfoItem>
                    <ProfileInfoLabel>Email</ProfileInfoLabel>
                    <EditableInput
                      name="email"
                      type="email"
                      value={editableProfile?.email || ''}
                      onChange={handleEditChange}
                    />
                  </ProfileInfoItem>
                )}
              </ProfileInfoGrid>
              
              {isEditMode && (
                <ButtonsContainer>
                  <SecondaryButton onClick={handleCancelEdit} disabled={saving}>
                    Cancel
                  </SecondaryButton>
                  <Button onClick={handleSaveProfile} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Button>
                </ButtonsContainer>
              )}
            </ProfileContent>
          </ProfileCard>
          
          <div>
            <StatsCard>
              <StatsTitle>Account Statistics</StatsTitle>
              <StatsList>
                <StatItem>
                  <StatLabel>Member Since</StatLabel>
                  <StatValue>March 2023</StatValue>
                </StatItem>
                <StatItem>
                  <StatLabel>Videos Created</StatLabel>
                  <StatValue>0</StatValue>
                </StatItem>
                <StatItem>
                  <StatLabel>Songs Learned</StatLabel>
                  <StatValue>0</StatValue>
                </StatItem>
                <StatItem>
                  <StatLabel>Account Type</StatLabel>
                  <StatValue>Free</StatValue>
                </StatItem>
              </StatsList>
            </StatsCard>
            
            <ComingSoonCard>
              <ComingSoonTitle>Coming Soon</ComingSoonTitle>
              <ComingSoonText>
                Soon you'll be able to see all the songs you're learning right here in your profile.
                Stay tuned for more exciting features!
              </ComingSoonText>
            </ComingSoonCard>
          </div>
        </ContentGrid>
      </MainContent>
    </AppLayout>
  );
};

export default ProfilePage; 