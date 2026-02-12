import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { getUserProfile, logout } from '../services/api';
// Import icons
import { CgProfile } from 'react-icons/cg';
import { IoHomeOutline } from 'react-icons/io5';
import { MdMusicNote, MdAdd, MdLogout } from 'react-icons/md';
import { BsMusicNoteList } from 'react-icons/bs';
import { RiRobot2Line } from 'react-icons/ri';

// Import custom hooks
import { useSongsManager, Song } from '../hooks/useSongsManager';
import { useLearningManager } from '../hooks/useLearningManager';
import { useVideoPlayer } from '../hooks/useVideoPlayer';

// Import components
import { SongCard } from '../components/songs/SongCard';
import { FilterBar } from '../components/songs/FilterBar';
import { LearningStatsCard } from '../components/songs/LearningStatsCard';
import { VideoPlayerModal } from '../components/songs/VideoPlayerModal';
import { DeleteConfirmationModal } from '../components/songs/DeleteConfirmationModal';

// Add global style to hide all scrollbars
const GlobalStyle = createGlobalStyle`
  body, div {
    /* Hide scrollbar for Chrome, Safari and Opera */
    &::-webkit-scrollbar {
      display: none;
    }
    
    /* Hide scrollbar for IE, Edge and Firefox */
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
`;

// Styled components for the songs page
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
  
  @media (max-width: 768px) {
    display: none;
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
`;

const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  flex: 1;
  width: 100%;
  align-items: center;
  gap: 12px;
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
`;

const NavIcon = styled.span`
  font-size: 28px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 100px;
  padding: 30px;
  width: calc(100% - 100px);
  transition: all 0.2s ease;
  overflow-y: auto;
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  
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
  grid-template-columns: 1fr 350px;
  gap: 30px;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
  }
`;

const SongsContainer = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  padding: 0;
  width: 100%;
  max-width: 100%;
  margin-bottom: 30px;
`;

const SongsHeader = styled.div`
  background: linear-gradient(90deg, #1DB954, #169c46);
  padding: 25px 30px;
  color: white;
`;

const SongsHeaderTitle = styled.h2`
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SongsList = styled.div`
  padding: 0;
  max-height: calc(100vh - 300px);
  overflow-y: auto;
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* Hide scrollbar for IE, Edge and Firefox */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
`;

const EmptyState = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  color: #ccc;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EmptyStateText = styled.p`
  font-size: 16px;
  color: #666;
  margin: 0;
  text-align: center;
`;

const Button = styled.button`
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 24px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 8px;
  transition: all 0.2s ease;
  text-decoration: none;
  
  &:hover {
    background-color: #169c46;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(29, 185, 84, 0.3);
  }
`;

const NotificationMessage = styled.div<{ type: 'success' | 'error' }>`
  background-color: ${props => props.type === 'success' ? '#4caf50' : '#f44336'};
  color: white;
  padding: 15px 20px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  font-weight: 500;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const SongsPage: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const [filter, setFilter] = useState<'all' | 'learned' | 'not-learned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();

  // Custom hooks
  const userId = userData?.id || null;
  const { 
    songs, 
    loading, 
    error, 
    notification, 
    deleteSong, 
    updateSong, 
    setNotification 
  } = useSongsManager(userId);

  const { 
    toggleLearnedStatus, 
    setDifficultyRating, 
    getLearningStats 
  } = useLearningManager({
    userId,
    onUpdate: updateSong,
    onNotification: (message, type) => {
      if (message) {
        setNotification({ message, type });
      } else {
        setNotification(null);
      }
    }
  });

  const { 
    playingSongId, 
    videoLoading, 
    videoRef, 
    playVideo, 
    closeVideo, 
    handleVideoLoaded 
  } = useVideoPlayer();

  // Fetch user profile data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getUserProfile();
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    
    fetchUserData();
  }, []);

  // Handle video playback effect
  useEffect(() => {
    if (playingSongId && videoRef.current) {
      const song = songs.find(s => s.id === playingSongId);
      if (song && song.video_file) {
        videoRef.current.src = song.video_file;
        
        const handleError = (e: Event) => {
          console.error('Error loading video:', e);
          handleVideoLoaded();
          setNotification({
            message: 'Error loading video. Please try again.',
            type: 'error'
          });
        };
        
        videoRef.current.addEventListener('loadeddata', handleVideoLoaded);
        videoRef.current.addEventListener('error', handleError);
        
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
          handleVideoLoaded();
          setNotification({
            message: 'Error playing video. Please try again.',
            type: 'error'
          });
        });
        
        return () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener('loadeddata', handleVideoLoaded);
            videoRef.current.removeEventListener('error', handleError);
          }
        };
      }
    }
  }, [playingSongId, songs, videoRef, handleVideoLoaded, setNotification]);

  // Filter songs
  const getFilteredSongs = () => {
    return songs.filter(song => {
      // Apply filter
      if (filter === 'all' && song.learned) return false;
      if (filter === 'learned' && !song.learned) return false;
      if (filter === 'not-learned' && song.learned) return false;
      
      // Apply search
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        return song.song_title.toLowerCase().includes(term) || 
               song.artist.toLowerCase().includes(term);
      }
      
      return true;
    });
  };

  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_id');
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  // Handle play/pause
  const handlePlayPause = (songId: string) => {
    if (playingSongId === songId) {
      closeVideo();
    } else {
      playVideo(songId);
    }
  };

  // Handle download
  const handleDownload = (song: Song) => {
    if (!song.video_file) {
      setNotification({
        message: `Error: No video file available for "${song.song_title}"`,
        type: 'error'
      });
      return;
    }
    
    const link = document.createElement('a');
    link.href = song.video_file;
    link.download = `${song.song_title} - ${song.artist}.mp4`;
    link.target = '_blank';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    setNotification({
      message: `Downloading "${song.song_title}"...`,
      type: 'success'
    });
    
    setTimeout(() => setNotification(null), 3000);
  };

  // Handle delete
  const handleDeleteClick = (song: Song) => {
    setSongToDelete(song);
  };

  const confirmDelete = async () => {
    if (!songToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteSong(songToDelete.id);
    } finally {
      setIsDeleting(false);
      setSongToDelete(null);
    }
  };

  const cancelDelete = () => {
    setSongToDelete(null);
  };

  // Get learning statistics
  const stats = getLearningStats(songs);
  const filteredSongs = getFilteredSongs();

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <GlobalStyle />
        <Sidebar>
          <Logo>🎵</Logo>
          <NavMenu>
            <NavItem to="/" data-tooltip="Home">
              <NavIcon>{IoHomeOutline({ size: 28 })}</NavIcon>
            </NavItem>
            <NavItem to="/profile" data-tooltip="Profile">
              <NavIcon>{CgProfile({ size: 28 })}</NavIcon>
            </NavItem>
            <NavItem to="/songs" active data-tooltip="My Songs">
              <NavIcon>{MdMusicNote({ size: 28 })}</NavIcon>
            </NavItem>
            <NavItem to="/agent" data-tooltip="AI Agent">
              <NavIcon>{RiRobot2Line({ size: 28 })}</NavIcon>
            </NavItem>
          </NavMenu>
        </Sidebar>
        <MainContent>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            {/* Loading state */}
          </div>
        </MainContent>
      </AppLayout>
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <GlobalStyle />
        <Sidebar>
          <Logo>🎵</Logo>
          <NavMenu>
            <NavItem to="/" data-tooltip="Home">
              <NavIcon>{IoHomeOutline({ size: 28 })}</NavIcon>
            </NavItem>
            <NavItem to="/profile" data-tooltip="Profile">
              <NavIcon>{CgProfile({ size: 28 })}</NavIcon>
            </NavItem>
            <NavItem to="/songs" active data-tooltip="My Songs">
              <NavIcon>{MdMusicNote({ size: 28 })}</NavIcon>
            </NavItem>
            <NavItem to="/agent" data-tooltip="AI Agent">
              <NavIcon>{RiRobot2Line({ size: 28 })}</NavIcon>
            </NavItem>
          </NavMenu>
        </Sidebar>
        <MainContent>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <h2>Error</h2>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </MainContent>
      </AppLayout>
    );
  }

  // Main render
  return (
    <AppLayout>
      <GlobalStyle />
      <Sidebar>
        <Logo>🎵</Logo>
        <NavMenu>
          <NavItem to="/" data-tooltip="Home">
            <NavIcon>{IoHomeOutline({ size: 28 })}</NavIcon>
          </NavItem>
          <NavItem to="/profile" data-tooltip="Profile">
            <NavIcon>{CgProfile({ size: 28 })}</NavIcon>
          </NavItem>
          <NavItem to="/songs" active data-tooltip="My Songs">
            <NavIcon>{MdMusicNote({ size: 28 })}</NavIcon>
          </NavItem>
          <NavItem to="/agent" data-tooltip="AI Agent">
            <NavIcon>{RiRobot2Line({ size: 28 })}</NavIcon>
          </NavItem>
        </NavMenu>
      </Sidebar>
      
      <MainContent>
        <PageHeader>
          <PageTitle>My Songs</PageTitle>
          <UserActions>
            {userData && (
              <UserInfo>
                <UserAvatar 
                  src={userData.profile_picture || "https://via.placeholder.com/40x40?text=User"} 
                  alt={userData.name} 
                />
                <UserName>{userData.name}</UserName>
              </UserInfo>
            )}
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
          <SongsContainer>
            <SongsHeader>
              <SongsHeaderTitle>
                {BsMusicNoteList({ size: 20 })} Your Song Collection
              </SongsHeaderTitle>
            </SongsHeader>
            
            {songs.length > 0 && (
              <FilterBar
                filter={filter}
                searchTerm={searchTerm}
                onFilterChange={setFilter}
                onSearchChange={setSearchTerm}
              />
            )}
            
            <SongsList>
              {songs.length === 0 ? (
                <EmptyState>
                  <EmptyStateIcon>
                    {MdMusicNote({ size: 48 })}
                  </EmptyStateIcon>
                  <EmptyStateText>You don't have any songs yet.</EmptyStateText>
                  <Button as={Link} to="/agent">
                    {MdAdd({ size: 18 })} Create Your First Video
                  </Button>
                </EmptyState>
              ) : filteredSongs.length === 0 ? (
                <EmptyState>
                  <EmptyStateText>No songs match your current filter.</EmptyStateText>
                  <Button onClick={() => { setFilter('all'); setSearchTerm(''); }}>
                    Clear Filters
                  </Button>
                </EmptyState>
              ) : (
                filteredSongs.map(song => (
                  <SongCard
                    key={song.id}
                    song={song}
                    isPlaying={playingSongId === song.id}
                    onToggleLearned={() => toggleLearnedStatus(song)}
                    onPlay={() => handlePlayPause(song.id)}
                    onDownload={() => handleDownload(song)}
                    onDelete={() => handleDeleteClick(song)}
                  />
                ))
              )}
            </SongsList>
          </SongsContainer>
          
          <div>
            <LearningStatsCard
              songs={songs}
              totalLearned={stats.totalLearned}
              learningProgress={stats.learningProgress}
              nextToLearn={stats.nextToLearn}
            />
          </div>
        </ContentGrid>
      </MainContent>

      {/* Video Player Modal */}
      {playingSongId && (
        <VideoPlayerModal
          song={songs.find(s => s.id === playingSongId) || null}
          videoRef={videoRef}
          isLoading={videoLoading}
          onClose={closeVideo}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmationModal
        song={songToDelete}
        isDeleting={isDeleting}
        onConfirm={confirmDelete}
        onCancel={cancelDelete}
      />
    </AppLayout>
  );
};

export default SongsPage;
