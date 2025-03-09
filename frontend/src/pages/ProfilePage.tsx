import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { getUserProfile, updateProfilePicture, UserProfile } from '../services/api';

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
  margin-top: 1rem;
  width: 100%;
  max-width: 300px;
`;

const FileInput = styled.input`
  margin-bottom: 1rem;
  width: 100%;
  padding: 0.5rem;
  background-color: #333;
  color: white;
  border: 2px solid #000;
  border-radius: 4px;
  cursor: pointer;
  
  &::file-selector-button {
    background: linear-gradient(to bottom, #535353, #333);
    color: white;
    border: 1px solid #000;
    border-radius: 4px;
    padding: 0.5rem;
    margin-right: 1rem;
    cursor: pointer;
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

const ProfilePage: React.FC = () => {
  const [profileData, setProfileData] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const data = await getUserProfile();
        setProfileData(data);
        setError(null);
      } catch (err) {
        setError('Failed to load profile data. Please try again later.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchProfile();
  }, []);
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedFile) return;
    
    try {
      setUploading(true);
      const updatedProfile = await updateProfilePicture(selectedFile);
      setProfileData(updatedProfile);
      alert("Profile picture updated successfully!");
    } catch (err) {
      alert("Failed to update profile picture. Please try again.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };
  
  const handleLogout = () => {
    if (window.confirm('Are you sure you want to log out?')) {
      // In a real app, you would handle logout logic here
      console.log('User logged out');
      navigate('/');
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
              <Button90s onClick={() => window.location.reload()}>Try Again</Button90s>
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
        </ProfileHeader>
        
        <ProfileContent>
          <ProfileTable>
            <tbody>
              <TableRow>
                <TableLabelCell>Name:</TableLabelCell>
                <TableValueCell>{profileData.name}</TableValueCell>
              </TableRow>
              <TableRow>
                <TableLabelCell>Role:</TableLabelCell>
                <TableValueCell>{profileData.role}</TableValueCell>
              </TableRow>
              <TableRow>
                <TableLabelCell>Email:</TableLabelCell>
                <TableValueCell>{profileData.email}</TableValueCell>
              </TableRow>
              <TableRow>
                <TableLabelCell>Last Login:</TableLabelCell>
                <TableValueCell>{profileData.last_login}</TableValueCell>
              </TableRow>
            </tbody>
          </ProfileTable>
          
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
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileChange} 
                  disabled={uploading}
                />
                <Button90s type="submit" disabled={!selectedFile || uploading}>
                  {uploading ? 'Uploading...' : 'Update Profile Picture'}
                </Button90s>
              </FileInputContainer>
            </form>
          </ProfileImageSection>
          
          <ButtonContainer>
            <Button90s as={Link} to="/edit-profile">Edit Profile</Button90s>
            <Button90s as={Link} to="/change-password">Change Password</Button90s>
            <LogoutButton onClick={handleLogout}>
              LOG OUT <BlinkingSpan>_</BlinkingSpan>
            </LogoutButton>
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