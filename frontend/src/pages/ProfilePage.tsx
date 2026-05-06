import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { logout } from '../services/api';
// Import icons
import { CgProfile } from 'react-icons/cg';
import { IoHomeOutline } from 'react-icons/io5';
import { MdMusicNote, MdMenu, MdClose } from 'react-icons/md';
import { RiRobot2Line } from 'react-icons/ri';

// Import custom hooks
import { useProfileManager } from '../hooks/useProfileManager';
import { useProfileStats } from '../hooks/useProfileStats';

// Import components
import { ProfileDropdown } from '../components/profile/ProfileDropdown';
import { ProfileEditForm } from '../components/profile/ProfileEditForm';
import { ProfileStatsCards } from '../components/profile/ProfileStatsCards';

// Global style for consistent styling across pages
const GlobalStyle = createGlobalStyle`
  @keyframes pulse {
    0%, 100% {
      opacity: 0.4;
    }
    50% {
      opacity: 0.8;
    }
  }
  
  @keyframes fadeIn {
    from {
      opacity: 0;
    }
    to {
      opacity: 1;
    }
  }
`;

// Styled components
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

const Sidebar = styled.div<{ isOpen?: boolean }>`
  width: 100px;
  background-color: #1DB954;
  color: white;
  padding: 24px 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  align-items: center;
  transition: transform 0.3s ease;
  
  @media (max-width: 768px) {
    width: 280px;
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
    align-items: stretch;
    padding: 20px 0;
  }
`;

const Logo = styled.div`
  font-size: 36px;
  font-weight: 700;
  padding: 0 0 24px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  
  @media (max-width: 768px) {
    padding: 0 20px 20px;
    justify-content: flex-start;
    font-size: 28px;
  }
`;

const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  align-items: center;
  gap: 24px;
  
  @media (max-width: 768px) {
    align-items: stretch;
    gap: 0;
  }
`;

const NavItem = styled(Link)<{ active?: boolean }>`
  padding: 16px;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: ${props => props.active ? '600' : '400'};
  background-color: ${props => props.active ? 'rgba(0, 0, 0, 0.2)' : 'transparent'};
  border-radius: 16px;
  transition: all 0.2s ease;
  position: relative;
  width: 60px;
  height: 60px;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
  }
  
  &:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    left: 85px;
    background-color: rgba(0, 0, 0, 0.9);
    color: white;
    padding: 10px 14px;
    border-radius: 8px;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;
    z-index: 1000;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
  }
  
  @media (max-width: 768px) {
    width: 100%;
    padding: 16px 20px;
    justify-content: flex-start;
    border-radius: 0;
    border-left: ${props => props.active ? '4px solid white' : '4px solid transparent'};
    
    &:hover::after {
      display: none;
    }
  }
`;

const NavIcon = styled.span`
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  @media (max-width: 768px) {
    margin-right: 15px;
    font-size: 22px;
  }
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 100px;
  padding: 30px;
  width: calc(100% - 100px);
  transition: all 0.2s ease;
  
  @media (max-width: 1200px) {
    padding: 30px 40px;
  }
  
  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    padding: 20px 16px;
  }
`;

const SidebarToggle = styled.button`
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 200;
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 50%;
  width: 48px;
  height: 48px;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.2);
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.05);
    background-color: #19a049;
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

const MobileOverlay = styled.div<{ visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 80;
  opacity: ${props => props.visible ? 1 : 0};
  visibility: ${props => props.visible ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease, visibility 0.3s ease;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const NavText = styled.span`
  display: none;
  font-size: 16px;
  
  @media (max-width: 768px) {
    display: inline;
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

const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
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

const Button = styled.button`
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #169c46;
  }
`;

const ProfilePage: React.FC = () => {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Custom hooks
  const {
    profileData,
    editableProfile,
    isEditMode,
    loading,
    error,
    notification,
    selectedFile,
    uploading,
    saving,
    filePreview,
    fileInputRef,
    handleFileSelect,
    handleSubmit,
    handleEditClick,
    handleCancelEdit,
    handleEditChange,
    handleSaveProfile,
    setNotification
  } = useProfileManager();

  const {
    songs,
    songsLoading,
    totalSongs,
    songsLearned,
    learningProgress
  } = useProfileStats(profileData?.id || null);

  // Helper functions
  const getAccountAge = () => {
    if (!profileData?.last_login) return 'N/A';
    
    const now = new Date();
    const joined = new Date(profileData.last_login);
    const months = (now.getFullYear() - joined.getFullYear()) * 12 + now.getMonth() - joined.getMonth();
    return months <= 0 ? 'Just joined' : `${months} ${months === 1 ? 'month' : 'months'}`;
  };

  const getMostRecentSong = () => {
    if (songs.length === 0) return null;
    return [...songs].sort((a, b) => 
      new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];
  };

  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Error logging out:', error);
        localStorage.removeItem('auth_token');
        navigate('/login');
      }
    }
  };

  // Loading state
  if (loading) {
    return (
      <>
        <GlobalStyle />
        <AppLayout>
          <Sidebar isOpen={sidebarOpen}>
            <Logo>{MdMusicNote({ size: 36 })}</Logo>
            <NavMenu>
              <NavItem to="/" data-tooltip="Home">
                <NavIcon>{IoHomeOutline({ size: 28 })}</NavIcon>
                <NavText>Home</NavText>
              </NavItem>
              <NavItem to="/profile" active data-tooltip="Profile">
                <NavIcon>{CgProfile({ size: 28 })}</NavIcon>
                <NavText>Profile</NavText>
              </NavItem>
              <NavItem to="/songs" data-tooltip="My Songs">
                <NavIcon>{MdMusicNote({ size: 28 })}</NavIcon>
                <NavText>My Songs</NavText>
              </NavItem>
              <NavItem to="/agent" data-tooltip="AI Agent">
                <NavIcon>{RiRobot2Line({ size: 28 })}</NavIcon>
                <NavText>Agent</NavText>
              </NavItem>
            </NavMenu>
          </Sidebar>
          <SidebarToggle onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? MdClose({ size: 24 }) : MdMenu({ size: 24 })}
          </SidebarToggle>
          <MobileOverlay visible={sidebarOpen} onClick={() => setSidebarOpen(false)} />
          <MainContent>
            <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
              {/* Loading state */}
            </div>
          </MainContent>
        </AppLayout>
      </>
    );
  }

  // Error state
  if (error || !profileData) {
    return (
      <>
        <GlobalStyle />
        <AppLayout>
        <Sidebar isOpen={sidebarOpen}>
          <Logo>{MdMusicNote({ size: 36 })}</Logo>
          <NavMenu>
            <NavItem to="/" data-tooltip="Home">
              <NavIcon>{IoHomeOutline({ size: 28 })}</NavIcon>
              <NavText>Home</NavText>
            </NavItem>
            <NavItem to="/profile" active data-tooltip="Profile">
              <NavIcon>{CgProfile({ size: 28 })}</NavIcon>
              <NavText>Profile</NavText>
            </NavItem>
            <NavItem to="/songs" data-tooltip="My Songs">
              <NavIcon>{MdMusicNote({ size: 28 })}</NavIcon>
              <NavText>My Songs</NavText>
            </NavItem>
            <NavItem to="/agent" data-tooltip="AI Agent">
              <NavIcon>{RiRobot2Line({ size: 28 })}</NavIcon>
              <NavText>Agent</NavText>
            </NavItem>
          </NavMenu>
        </Sidebar>
        <SidebarToggle onClick={() => setSidebarOpen(!sidebarOpen)}>
          {sidebarOpen ? MdClose({ size: 24 }) : MdMenu({ size: 24 })}
        </SidebarToggle>
        <MobileOverlay visible={sidebarOpen} onClick={() => setSidebarOpen(false)} />
        <MainContent>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <h2>Error</h2>
            <p>{error || 'Failed to load profile data'}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </MainContent>
      </AppLayout>
      </>
    );
  }

  // Main render
  const mostRecentSong = getMostRecentSong();

  return (
    <>
      <GlobalStyle />
      <AppLayout>
      <Sidebar isOpen={sidebarOpen}>
        <Logo>{MdMusicNote({ size: 36 })}</Logo>
        <NavMenu>
          <NavItem to="/" data-tooltip="Home">
            <NavIcon>{IoHomeOutline({ size: 28 })}</NavIcon>
            <NavText>Home</NavText>
          </NavItem>
          <NavItem to="/profile" active data-tooltip="Profile">
            <NavIcon>{CgProfile({ size: 28 })}</NavIcon>
            <NavText>Profile</NavText>
          </NavItem>
          <NavItem to="/songs" data-tooltip="My Songs">
            <NavIcon>{MdMusicNote({ size: 28 })}</NavIcon>
            <NavText>My Songs</NavText>
          </NavItem>
          <NavItem to="/agent" data-tooltip="AI Agent">
            <NavIcon>{RiRobot2Line({ size: 28 })}</NavIcon>
            <NavText>Agent</NavText>
          </NavItem>
        </NavMenu>
      </Sidebar>

      <SidebarToggle onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? MdClose({ size: 24 }) : MdMenu({ size: 24 })}
      </SidebarToggle>
      <MobileOverlay visible={sidebarOpen} onClick={() => setSidebarOpen(false)} />

      <MainContent>
        <PageHeader>
          <PageTitle>My Profile</PageTitle>
          <UserActions>
            <ProfileDropdown userData={profileData} />
          </UserActions>
        </PageHeader>

        {notification && (
          <NotificationMessage type={notification.type}>
            {notification.message}
          </NotificationMessage>
        )}

        <ContentGrid>
          <ProfileEditForm
            profileData={profileData}
            editableProfile={editableProfile}
            isEditMode={isEditMode}
            uploading={uploading}
            saving={saving}
            selectedFile={selectedFile}
            filePreview={filePreview}
            fileInputRef={fileInputRef}
            onFileChange={handleFileSelect}
            onFileSubmit={handleSubmit}
            onEditClick={handleEditClick}
            onCancelEdit={handleCancelEdit}
            onEditChange={handleEditChange}
            onSaveProfile={handleSaveProfile}
          />

          <ProfileStatsCards
            totalSongs={totalSongs}
            songsLearned={songsLearned}
            learningProgress={learningProgress}
            accountAge={getAccountAge()}
            mostRecentSong={mostRecentSong}
          />
        </ContentGrid>
      </MainContent>
    </AppLayout>
    </>
  );
};

export default ProfilePage;
