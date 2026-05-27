import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { logout } from '../services/api';
import { useProfileManager } from '../hooks/useProfileManager';
import { useProfileStats } from '../hooks/useProfileStats';
import { ProfileDropdown } from '../components/profile/ProfileDropdown';
import { ProfileEditForm } from '../components/profile/ProfileEditForm';
import { ProfileStatsCards } from '../components/profile/ProfileStatsCards';
import { AppSidebar } from '../components/layout/AppSidebar';
import { AppLayout } from '../styles/AppLayoutStyles';
import { APP_SIDEBAR_WIDTH } from '../constants/layout';

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

const MainContent = styled.main`
  flex: 1;
  margin-left: ${APP_SIDEBAR_WIDTH}px;
  padding: 30px;
  width: calc(100% - ${APP_SIDEBAR_WIDTH}px);
  height: 100vh;
  min-height: 0;
  overflow-y: auto;
  overflow-x: hidden;
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
          <AppSidebar
            isOpen={sidebarOpen}
            onToggle={() => setSidebarOpen(!sidebarOpen)}
            onClose={() => setSidebarOpen(false)}
          />
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
        <AppSidebar
          isOpen={sidebarOpen}
          onToggle={() => setSidebarOpen(!sidebarOpen)}
          onClose={() => setSidebarOpen(false)}
        />
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
      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onClose={() => setSidebarOpen(false)}
      />

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
