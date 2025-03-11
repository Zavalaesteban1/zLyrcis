import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { getUserProfile, updateProfilePicture, updateProfile, UserProfile, logout } from '../services/api';

// Define animations
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const blink = keyframes`
  0%, 100% { opacity: 1; }
  50% { opacity: 0; }
`;

const marqueeAnimation = keyframes`
  0% { transform: translate(0, 0); }
  100% { transform: translate(-100%, 0); }
`;

// Styled components for the profile page
const ProfileContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  padding: 2rem;
  background: linear-gradient(
    45deg,
    #1DB954,
    #191414,
    #535353,
    #1ed760
  );
  background-size: 400% 400%;
  animation: ${gradientAnimation} 15s ease infinite;
  color: white;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
`;

const ProfileCard = styled.div`
  background: rgba(18, 18, 18, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  border: 4px solid #333;
  width: 90%;
  max-width: 800px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  overflow: hidden;
`;

const ProfileHeader = styled.header`
  background: linear-gradient(45deg, #1DB954, #1ed760);
  padding: 1rem;
  text-align: center;
  border-bottom: 4px solid #333;
`;

const ProfileTitle = styled.h1`
  font-size: 2rem;
  font-weight: bold;
  color: white;
  margin: 0;
  
  &::after {
    content: '_';
    display: inline-block;
    animation: ${blink} 1s step-end infinite;
  }
`;

const ProfileContent = styled.div`
  padding: 2rem;
`;

const ProfileTable = styled.table`
  width: 100%;
  border-collapse: collapse;
  border: 2px solid #333;
`;

const TableRow = styled.tr`
  border-bottom: 2px solid #333;
  
  &:last-child {
    border-bottom: none;
  }
`;

const TableLabelCell = styled.td`
  padding: 1rem;
  font-weight: bold;
  background-color: rgba(83, 83, 83, 0.3);
  border-right: 2px solid #333;
  width: 30%;
`;

const TableValueCell = styled.td`
  padding: 1rem;
  color: #b3b3b3;
`;

const ProfileImageSection = styled.div`
  margin-top: 2rem;
  text-align: center;
  width: 100%;
`;

const ProfileImageContainer = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  margin: 0 auto;
`;

const ProfileImage = styled.img`
  width: 200px;
  height: 200px;
  object-fit: cover;
  border: 4px solid #333;
  border-radius: 10px;
`;

const Button90s = styled.button`
  background: linear-gradient(to bottom, #535353, #333);
  color: white;
  border: 2px solid #000;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-weight: bold;
  cursor: pointer;
  box-shadow: 3px 3px 0 #000;
  transition: all 0.2s;
  margin: 0.5rem;
  
  &:hover {
    background: linear-gradient(to bottom, #1DB954, #1ed760);
    transform: translateY(-2px);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: 1px 1px 0 #000;
  }
`;

const LogoutButton = styled(Button90s)`
  background: linear-gradient(to bottom, #ff5252, #b33939);
  
  &:hover {
    background: linear-gradient(to bottom, #ff3838, #eb2f06);
  }
`;

const ButtonContainer = styled.div`
  margin-top: 2rem;
  display: flex;
  justify-content: center;
  flex-wrap: wrap;
  gap: 1rem;
`;

const FileInputContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  max-width: 300px;
`;

const FileInput = styled.input`
  display: none; /* Hide the actual file input */
`;

const UploadButton = styled(Button90s)`
  background: linear-gradient(to bottom, #535353, #333);
  margin-top: 1rem;
  width: 100%;
  max-width: 250px;
  
  &:hover {
    background: linear-gradient(to bottom, #1DB954, #1ed760);
  }
`;

const Footer = styled.footer`
  background-color: rgba(83, 83, 83, 0.3);
  padding: 1rem;
  text-align: center;
  border-top: 4px solid #333;
  font-size: 0.875rem;
`;

const Marquee = styled.div`
  white-space: nowrap;
  overflow: hidden;
  box-sizing: border-box;
  
  & > span {
    display: inline-block;
    padding-left: 100%;
    animation: ${marqueeAnimation} 15s linear infinite;
  }
`;

const BlinkingSpan = styled.span`
  animation: ${blink} 1s step-end infinite;
`;

// New styled components for edit mode
const EditButton = styled(Button90s)`
  position: absolute;
  top: 1rem;
  right: 1rem;
  padding: 0.5rem 1rem;
  margin: 0;
`;

const EditableInput = styled.input`
  background-color: #333;
  border: 1px solid #1DB954;
  border-radius: 4px;
  color: white;
  padding: 0.5rem;
  width: 100%;
  font-size: 1rem;
  
  &:focus {
    outline: none;
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.3);
  }
`;

const EditActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  margin-top: 1rem;
`;

const SaveButton = styled(Button90s)`
  background: linear-gradient(to bottom, #1DB954, #1ed760);
  
  &:hover {
    background: linear-gradient(to bottom, #1ed760, #1DB954);
  }
`;

const CancelButton = styled(Button90s)`
  background: linear-gradient(to bottom, #535353, #333);
  
  &:hover {
    background: linear-gradient(to bottom, #777, #535353);
  }
`;

const NotificationMessage = styled.div<{ type: 'success' | 'error' }>`
  background-color: ${props => props.type === 'success' 
    ? 'rgba(29, 185, 84, 0.1)' 
    : 'rgba(255, 82, 82, 0.1)'};
  color: ${props => props.type === 'success' ? '#1DB954' : '#ff5252'};
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid ${props => props.type === 'success' ? '#1DB954' : '#ff5252'};
  margin-bottom: 1rem;
  font-size: 0.9rem;
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '${props => props.type === 'success' ? '✅' : '⚠️'}';
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
  const [showFileInput, setShowFileInput] = useState(false);
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
    // Trigger the hidden file input
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      
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
      
      setSelectedFile(file);
      // Clear any existing notifications
      setNotification(null);
      
      // Automatically submit the form after selecting a file
      handleSubmit();
    }
  };
  
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) {
      e.preventDefault();
    }
    
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      
      // Create a new FormData instance
      const formData = new FormData();
      formData.append('profile_picture', selectedFile);
      
      console.log('Uploading file:', selectedFile.name, selectedFile.type, selectedFile.size);
      
      const updatedProfile = await updateProfilePicture(selectedFile);
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
      <ProfileContainer>
        <ProfileCard>
          <ProfileContent>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h2>Loading profile data...</h2>
            </div>
          </ProfileContent>
        </ProfileCard>
      </ProfileContainer>
    );
  }
  
  if (error || !profileData) {
    return (
      <ProfileContainer>
        <ProfileCard>
          <ProfileContent>
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <h2>Error</h2>
              <p>{error || 'Failed to load profile data'}</p>
              <Button90s onClick={fetchProfile}>Try Again</Button90s>
            </div>
          </ProfileContent>
        </ProfileCard>
      </ProfileContainer>
    );
  }
  
  return (
    <ProfileContainer>
      <ProfileCard>
        <ProfileHeader>
          <ProfileTitle>Profile</ProfileTitle>
          {!isEditMode && (
            <EditButton onClick={handleEditClick}>Edit</EditButton>
          )}
        </ProfileHeader>
        
        <ProfileContent>
          {notification && (
            <NotificationMessage type={notification.type}>
              {notification.message}
            </NotificationMessage>
          )}
          
          <ProfileTable>
            <tbody>
              <TableRow>
                <TableLabelCell>Name:</TableLabelCell>
                <TableValueCell>
                  {isEditMode ? (
                    <EditableInput
                      name="name"
                      value={editableProfile?.name || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    profileData.name
                  )}
                </TableValueCell>
              </TableRow>
              <TableRow>
                <TableLabelCell>Role:</TableLabelCell>
                <TableValueCell>
                  {isEditMode ? (
                    <EditableInput
                      name="role"
                      value={editableProfile?.role || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    profileData.role
                  )}
                </TableValueCell>
              </TableRow>
              <TableRow>
                <TableLabelCell>Email:</TableLabelCell>
                <TableValueCell>
                  {isEditMode ? (
                    <EditableInput
                      name="email"
                      type="email"
                      value={editableProfile?.email || ''}
                      onChange={handleEditChange}
                    />
                  ) : (
                    profileData.email
                  )}
                </TableValueCell>
              </TableRow>
              <TableRow>
                <TableLabelCell>Last Login:</TableLabelCell>
                <TableValueCell>{profileData.last_login}</TableValueCell>
              </TableRow>
            </tbody>
          </ProfileTable>
          
          {isEditMode && (
            <EditActions>
              <CancelButton onClick={handleCancelEdit} disabled={saving}>
                Cancel
              </CancelButton>
              <SaveButton onClick={handleSaveProfile} disabled={saving}>
                {saving ? 'Saving...' : 'Save Changes'}
              </SaveButton>
            </EditActions>
          )}
          
          <ProfileImageSection>
            <ProfileImageContainer>
              <ProfileImage 
                src={profileData.profile_picture || "https://via.placeholder.com/200x200?text=Profile+Image"} 
                alt="Profile Picture" 
              />
            </ProfileImageContainer>
            
            <form onSubmit={handleSubmit}>
              <FileInputContainer>
                <FileInput 
                  ref={fileInputRef}
                  id="profilePicture"
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  disabled={uploading || isEditMode}
                />
              </FileInputContainer>
            </form>
          </ProfileImageSection>
          
          <ButtonContainer>
            <Button90s as={Link} to="/change-password">Change Password</Button90s>
            <LogoutButton onClick={handleLogout}>
              LOG OUT <BlinkingSpan>_</BlinkingSpan>
            </LogoutButton>
            <UploadButton 
              onClick={handleUploadClick} 
              disabled={uploading || isEditMode}
            >
              {uploading ? 'Uploading...' : 'Change Profile Picture'}
            </UploadButton>
          </ButtonContainer>
        </ProfileContent>
        
        <Footer>
          <Marquee>
            <span>Welcome to the zLyrics 🚗💨</span>
          </Marquee>
        </Footer>
      </ProfileCard>
    </ProfileContainer>
  );
};

export default ProfilePage; 