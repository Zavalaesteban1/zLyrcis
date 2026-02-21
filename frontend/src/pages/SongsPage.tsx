import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { useUser } from '../contexts/UserContext';
// Import icons
import { CgProfile } from 'react-icons/cg';
import { IoHomeOutline } from 'react-icons/io5';
import { MdMusicNote, MdAdd, MdMenu, MdClose } from 'react-icons/md';
import { BsMusicNoteList } from 'react-icons/bs';
import { RiRobot2Line } from 'react-icons/ri';

// Import custom hooks
import { useSongsManager, Song } from '../hooks/useSongsManager';
import { useLearningManager } from '../hooks/useLearningManager';
import { useVideoPlayer } from '../hooks/useVideoPlayer';

// Import components
import { FilterBar } from '../components/songs/FilterBar';
import { LearningStatsCard } from '../components/songs/LearningStatsCard';
import { VideoPlayerModal } from '../components/songs/VideoPlayerModal';
import { DeleteConfirmationModal } from '../components/songs/DeleteConfirmationModal';
import { HorizontalSongGallery } from '../components/songs/HorizontalSongGallery';
import { ProfileDropdown } from '../components/profile/ProfileDropdown';

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
  padding: 0 0 20px;
  width: 100%;
  max-width: 100%;
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

const SongsContent = styled.div`
  padding-top: 20px;
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
  const { userData } = useUser();
  const [filter, setFilter] = useState<'all' | 'learned' | 'not-learned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
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

  // Handle video playback effect
  useEffect(() => {
    if (playingSongId && videoRef.current) {
      const song = songs.find(s => s.id === playingSongId);
      if (song && song.video_file) {
        videoRef.current.src = song.video_file;
        
        // Set a timeout to remove loading state after 3 seconds regardless
        const loadingTimeout = setTimeout(() => {
          console.log('Video loading timeout - removing loading state');
          handleVideoLoaded();
        }, 3000);
        
        const handleError = (e: Event) => {
          console.error('Error loading video:', e);
          clearTimeout(loadingTimeout);
          handleVideoLoaded();
          setNotification({
            message: 'Error loading video. Please try again.',
            type: 'error'
          });
        };
        
        const handleCanPlay = () => {
          console.log('Video can play - removing loading state');
          clearTimeout(loadingTimeout);
          handleVideoLoaded();
        };
        
        // Add multiple event listeners for better reliability
        videoRef.current.addEventListener('loadeddata', handleCanPlay);
        videoRef.current.addEventListener('canplay', handleCanPlay);
        videoRef.current.addEventListener('playing', handleCanPlay);
        videoRef.current.addEventListener('error', handleError);
        
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
          clearTimeout(loadingTimeout);
          handleVideoLoaded();
          setNotification({
            message: 'Error playing video. Please try again.',
            type: 'error'
          });
        });
        
        return () => {
          clearTimeout(loadingTimeout);
          if (videoRef.current) {
            videoRef.current.removeEventListener('loadeddata', handleCanPlay);
            videoRef.current.removeEventListener('canplay', handleCanPlay);
            videoRef.current.removeEventListener('playing', handleCanPlay);
            videoRef.current.removeEventListener('error', handleError);
          }
        };
      } else {
        // No video file, clear loading immediately
        handleVideoLoaded();
      }
    }
  }, [playingSongId, songs, videoRef, handleVideoLoaded, setNotification]);

  // Filter songs by category
  const unlearnedSongs = songs.filter(song => !song.learned);
  const learnedSongs = songs.filter(song => song.learned);
  
  // Apply search filter
  const filterBySearch = (songList: Song[]) => {
    if (searchTerm.trim() === '') return songList;
    const term = searchTerm.toLowerCase();
    return songList.filter(song => 
      song.song_title.toLowerCase().includes(term) || 
      song.artist.toLowerCase().includes(term)
    );
  };
  
  const filteredUnlearnedSongs = filterBySearch(unlearnedSongs);
  const filteredLearnedSongs = filterBySearch(learnedSongs);

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
  
  // Determine which galleries to show based on filter
  const showUnlearned = filter === 'all' || filter === 'not-learned';
  const showLearned = filter === 'learned';

  // Loading state
  if (loading) {
    return (
      <AppLayout>
        <GlobalStyle />
        <Sidebar isOpen={sidebarOpen}>
          <Logo>🎵</Logo>
          <NavMenu>
            <NavItem to="/" data-tooltip="Home">
              <NavIcon>{IoHomeOutline({ size: 28 })}</NavIcon>
              <NavText>Home</NavText>
            </NavItem>
            <NavItem to="/profile" data-tooltip="Profile">
              <NavIcon>{CgProfile({ size: 28 })}</NavIcon>
              <NavText>Profile</NavText>
            </NavItem>
            <NavItem to="/songs" active data-tooltip="My Songs">
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
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <GlobalStyle />
        <Sidebar isOpen={sidebarOpen}>
          <Logo>🎵</Logo>
          <NavMenu>
            <NavItem to="/" data-tooltip="Home">
              <NavIcon>{IoHomeOutline({ size: 28 })}</NavIcon>
              <NavText>Home</NavText>
            </NavItem>
            <NavItem to="/profile" data-tooltip="Profile">
              <NavIcon>{CgProfile({ size: 28 })}</NavIcon>
              <NavText>Profile</NavText>
            </NavItem>
            <NavItem to="/songs" active data-tooltip="My Songs">
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
      <Sidebar isOpen={sidebarOpen}>
        <Logo>🎵</Logo>
        <NavMenu>
          <NavItem to="/" data-tooltip="Home">
            <NavIcon>{IoHomeOutline({ size: 28 })}</NavIcon>
            <NavText>Home</NavText>
          </NavItem>
          <NavItem to="/profile" data-tooltip="Profile">
            <NavIcon>{CgProfile({ size: 28 })}</NavIcon>
            <NavText>Profile</NavText>
          </NavItem>
          <NavItem to="/songs" active data-tooltip="My Songs">
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
          <PageTitle>My Songs</PageTitle>
          <UserActions>
            <ProfileDropdown userData={userData} />
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
            
            <SongsContent>
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
              ) : (
                <>
                  {showUnlearned && filteredUnlearnedSongs.length > 0 && (
                    <HorizontalSongGallery
                      title="Unlearned Songs"
                      songs={filteredUnlearnedSongs}
                      playingSongId={playingSongId}
                      onToggleLearned={toggleLearnedStatus}
                      onPlay={handlePlayPause}
                      onDownload={handleDownload}
                      onDelete={handleDeleteClick}
                    />
                  )}
                  
                  {showLearned && filteredLearnedSongs.length > 0 && (
                    <HorizontalSongGallery
                      title="Learned Songs"
                      songs={filteredLearnedSongs}
                      playingSongId={playingSongId}
                      onToggleLearned={toggleLearnedStatus}
                      onPlay={handlePlayPause}
                      onDownload={handleDownload}
                      onDelete={handleDeleteClick}
                    />
                  )}
                  
                  {((showUnlearned && filteredUnlearnedSongs.length === 0) && 
                    (showLearned && filteredLearnedSongs.length === 0)) && (
                    <EmptyState>
                      <EmptyStateText>No songs match your current filter.</EmptyStateText>
                      <Button onClick={() => { setFilter('all'); setSearchTerm(''); }}>
                        Clear Filters
                      </Button>
                    </EmptyState>
                  )}
                </>
              )}
            </SongsContent>
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
