import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { getUserVideos, extractSpotifyTrackId, getSpotifyAlbumArtwork, VideoJob } from '../services/api';
import { useUser } from '../contexts/UserContext';
// Import icons
import { CgProfile } from 'react-icons/cg';
import { IoHomeOutline } from 'react-icons/io5';
import { MdMusicNote, MdAdd, MdCheckCircle, MdMenu, MdClose } from 'react-icons/md';
import { BsMusicNoteList, BsSpotify } from 'react-icons/bs';
import { FiTrendingUp } from 'react-icons/fi';
import { AiOutlineClockCircle } from 'react-icons/ai';
import { RiRobot2Line } from 'react-icons/ri';
// Import ProfileDropdown component
import { ProfileDropdown } from '../components/profile/ProfileDropdown';

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

// Styled components for the home page (matching profile page style)
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
  padding: 40px 60px;
  width: calc(100% - 100px);
  max-width: 100%;
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
  flex-wrap: wrap;
  gap: 15px;
  
  @media (max-width: 768px) {
    margin-bottom: 20px;
    padding-bottom: 15px;
  }
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const UserActions = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const HomeContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 100%;
  gap: 30px;
`;

const DashboardGrid = styled.div`
  display: grid;
  grid-template-columns: 3fr 1fr;
  gap: 30px;
  width: 100%;
  max-width: 100%;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
    gap: 20px;
  }
`;

const WelcomeCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 30px;
  width: 100%;
  max-width: 100%;
  background: linear-gradient(135deg, #1DB954, #169c46);
  color: white;
  
  @media (max-width: 768px) {
    padding: 24px;
  }
`;

const WelcomeTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 15px;
  
  @media (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 12px;
  }
`;

const WelcomeText = styled.p`
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 25px;
  opacity: 0.9;
  
  @media (max-width: 768px) {
    font-size: 15px;
    margin-bottom: 20px;
  }
`;

const ActionButton = styled(Link)`
  display: inline-block;
  background-color: white;
  color: #1DB954;
  border: none;
  border-radius: 8px;
  padding: 12px 20px;
  font-size: 16px;
  font-weight: 600;
  text-decoration: none;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }
  
  @media (max-width: 768px) {
    padding: 10px 18px;
    font-size: 15px;
  }
`;

const StatsCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 25px;
  width: 100%;
`;

const StatsTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const StatsIcon = styled.span`
  color: #1DB954;
  display: flex;
  align-items: center;
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

const RecentActivityCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 25px;
  grid-column: span 2;
  width: 100%;
  
  @media (max-width: 1200px) {
    grid-column: span 1;
  }
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const ActivityTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
  color: #333;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ActivityIcon = styled.span`
  color: #1DB954;
  display: flex;
  align-items: center;
`;

const ActivityList = styled.div`
  display: grid;
  grid-template-columns: repeat(1, 1fr);
  gap: 15px;
  width: 100%;
  
  @media (min-width: 1200px) {
    grid-template-columns: repeat(2, 1fr);
  }
`;

const ActivityItem = styled.div`
  display: flex;
  align-items: center;
  padding: 15px;
  border-radius: 8px;
  background-color: #f9f9f9;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f0f0f0;
  }
`;

const ActivityContent = styled.div`
  flex: 1;
  margin-left: 15px;
`;

const ActivityName = styled.h4`
  font-size: 16px;
  font-weight: 600;
  margin: 0 0 5px;
  color: #333;
`;

const ActivityMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const ActivityDate = styled.span`
  font-size: 14px;
  color: #666;
  display: flex;
  align-items: center;
  gap: 5px;
`;

const ActivityStatus = styled.span`
  font-size: 14px;
  color: #1DB954;
  font-weight: 500;
`;

const SongCover = styled.div`
  width: 50px;
  height: 50px;
  border-radius: 8px;
  overflow: hidden;
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 24px;
  flex-shrink: 0;
`;

const SongImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const QuickActionsCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 25px;
  width: 100%;
`;

const QuickActionsTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
  color: #333;
`;

const QuickActionsList = styled.div`
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  width: 100%;
  
  @media (min-width: 1400px) {
    grid-template-columns: repeat(4, 1fr);
  }
`;

const QuickActionButton = styled(Link)`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 20px;
  background-color: #f9f9f9;
  border-radius: 8px;
  text-decoration: none;
  color: #333;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f0f0f0;
    transform: translateY(-2px);
  }
`;

const QuickActionIcon = styled.div`
  font-size: 24px;
  color: #1DB954;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const QuickActionText = styled.span`
  font-size: 14px;
  font-weight: 500;
  text-align: center;
`;

const EmptyState = styled.div`
  padding: 30px;
  text-align: center;
  color: #999;
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  margin-bottom: 20px;
  color: #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
`;

const EmptyStateText = styled.p`
  font-size: 16px;
  margin: 0 0 20px;
`;

// Extended VideoJob interface with learning properties
interface SongWithLearningData extends VideoJob {
  learned: boolean;
  lastPracticed?: string | null;
  difficultyRating?: number | null;
}

const RecentActivityItem: React.FC<{ song: SongWithLearningData, albumCover: string | null }> = ({ song, albumCover }) => {
  return (
    <ActivityItem>
      <SongCover>
        {albumCover ? (
          <SongImage src={albumCover} alt={song.song_title} />
        ) : (
          MdMusicNote({ size: 24 })
        )}
      </SongCover>
      <ActivityContent>
        <ActivityName>{song.song_title}</ActivityName>
        <ActivityMeta>
          <ActivityDate>
            {AiOutlineClockCircle({ size: 14 })} {new Date(song.created_at).toLocaleDateString()}
          </ActivityDate>
          {song.learned && (
            <ActivityStatus>Learned</ActivityStatus>
          )}
        </ActivityMeta>
      </ActivityContent>
    </ActivityItem>
  );
};

const HomePage: React.FC = () => {
  const { userData } = useUser();
  const [songs, setSongs] = useState<SongWithLearningData[]>([]);
  const [loading, setLoading] = useState(true);
  const [albumCovers, setAlbumCovers] = useState<{[key: string]: string | null}>({});
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const navigate = useNavigate();

  // Fetch songs when component mounts
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch user's videos/songs
        const videosData = await getUserVideos();
        
        // Add learning data from localStorage
        const songsWithLearningData: SongWithLearningData[] = videosData.map(video => {
          const learningData = JSON.parse(localStorage.getItem(`song_learning_${video.id}`) || 'null');
          return {
            ...video,
            learned: learningData?.learned || false,
            lastPracticed: learningData?.lastPracticed || null,
            difficultyRating: learningData?.difficultyRating || null
          };
        });
        
        // Sort songs by creation date (newest first)
        const sortedSongs = songsWithLearningData.sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
        
        setSongs(sortedSongs);
        
        // Fetch album covers for the most recent songs
        const recentSongs = sortedSongs.slice(0, 4);
        const coverPromises = recentSongs.map(async (song) => {
          try {
            if (song.spotify_url) {
              const trackId = extractSpotifyTrackId(song.spotify_url);
              if (trackId) {
                const coverUrl = await getSpotifyAlbumArtwork(trackId);
                return { id: song.id, coverUrl };
              }
            }
            return { id: song.id, coverUrl: null };
          } catch (error) {
            console.error('Error fetching album cover:', error);
            return { id: song.id, coverUrl: null };
          }
        });
        
        const covers = await Promise.all(coverPromises);
        const coverMap = covers.reduce((acc, { id, coverUrl }) => {
          acc[id] = coverUrl;
          return acc;
        }, {} as {[key: string]: string | null});
        
        setAlbumCovers(coverMap);
        setLoading(false);
      } catch (error) {
        console.error('Error fetching data:', error);
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  
  // Calculate statistics from data
  const getVideosCreated = (): number => {
    return songs.length;
  };

  const getTotalDuration = (): number => {
    // Since we might not have duration, let's estimate 3 minutes per song
    return songs.length * 180; // 3 minutes in seconds
  };

  const getSongsLearned = (): number => {
    return songs.filter(song => song.learned).length;
  };

  const getLearningProgress = (): number => {
    if (songs.length === 0) return 0;
    return Math.round((getSongsLearned() / songs.length) * 100);
  };

  const getMemberSince = (): string => {
    if (!userData?.created_at) return 'N/A';
    return new Date(userData.created_at).toLocaleDateString();
  };

  // Format the date to show how long ago it was created
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    
    const diffMins = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? 's' : ''} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? 's' : ''} ago`;
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? 's' : ''} ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (loading) {
    return (
      <>
        <GlobalStyle />
        <AppLayout>
          <Sidebar isOpen={sidebarOpen}>
            <Logo>🎵</Logo>
            <NavMenu>
              <NavItem to="/" active data-tooltip="Home">
                <NavIcon>{IoHomeOutline({ size: 28 })}</NavIcon>
                <NavText>Home</NavText>
              </NavItem>
              <NavItem to="/profile" data-tooltip="Profile">
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

  return (
    <>
      <GlobalStyle />
      <AppLayout>
      <Sidebar isOpen={sidebarOpen}>
        <Logo>🎵</Logo>
          <NavMenu>
            <NavItem to="/" active data-tooltip="Home">
              <NavIcon>{IoHomeOutline({ size: 28 })}</NavIcon>
              <NavText>Home</NavText>
            </NavItem>
            <NavItem to="/profile" data-tooltip="Profile">
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
          <PageTitle>Dashboard</PageTitle>
          <UserActions>
            <ProfileDropdown userData={userData} />
          </UserActions>
        </PageHeader>
        
        <HomeContainer>
          <WelcomeCard>
            <WelcomeTitle>Welcome back, {userData?.name || 'User'}!</WelcomeTitle>
            <WelcomeText>
              {songs.length > 0 
                ? `You have created ${songs.length} lyric videos and learned ${getSongsLearned()} songs. Keep up the great work!` 
                : 'Create beautiful lyric videos from your favorite Spotify tracks with just a few clicks.'}
              {getLearningProgress() > 0 && ` Your learning progress is at ${getLearningProgress()}%.`}
            </WelcomeText>
            <ActionButton to="/create">Create New Video</ActionButton>
          </WelcomeCard>
          
          <DashboardGrid>
            <RecentActivityCard>
              <ActivityTitle>
                <ActivityIcon>{AiOutlineClockCircle({ size: 20 })}</ActivityIcon>
                Recent Activity
              </ActivityTitle>
              
              {songs.length > 0 ? (
                <ActivityList>
                  {songs.slice(0, 4).map(song => (
                    <RecentActivityItem 
                      key={song.id} 
                      song={song} 
                      albumCover={albumCovers[song.id] || null} 
                    />
                  ))}
                </ActivityList>
              ) : (
                <EmptyState>
                  <EmptyStateIcon>
                    {MdMusicNote({ size: 48 })}
                  </EmptyStateIcon>
                  <EmptyStateText>No recent activity yet</EmptyStateText>
                  <ActionButton to="/create" style={{ backgroundColor: '#1DB954', color: 'white' }}>
                    Create Your First Video
                  </ActionButton>
                </EmptyState>
              )}
            </RecentActivityCard>
            
            <StatsCard>
              <StatsTitle>
                <StatsIcon>{FiTrendingUp({ size: 20 })}</StatsIcon>
                Your Stats
              </StatsTitle>
              <StatsList>
                <StatItem>
                  <StatLabel>Videos Created</StatLabel>
                  <StatValue>{getVideosCreated()}</StatValue>
                </StatItem>
                <StatItem>
                  <StatLabel>Songs Learned</StatLabel>
                  <StatValue>{getSongsLearned()}</StatValue>
                </StatItem>
                <StatItem>
                  <StatLabel>Learning Progress</StatLabel>
                  <StatValue>{getLearningProgress()}%</StatValue>
                </StatItem>
                <StatItem>
                  <StatLabel>Member Since</StatLabel>
                  <StatValue>{getMemberSince()}</StatValue>
                </StatItem>
              </StatsList>
            </StatsCard>
            
            <QuickActionsCard>
              <QuickActionsTitle>Quick Actions</QuickActionsTitle>
              <QuickActionsList>
                <QuickActionButton to="/agent">
                  <QuickActionIcon>{RiRobot2Line({ size: 24 })}</QuickActionIcon>
                  <QuickActionText>AI Agent</QuickActionText>
                </QuickActionButton>
                <QuickActionButton to="/songs">
                  <QuickActionIcon>{BsMusicNoteList({ size: 24 })}</QuickActionIcon>
                  <QuickActionText>My Songs</QuickActionText>
                </QuickActionButton>
                <QuickActionButton to="/profile">
                  <QuickActionIcon>{CgProfile({ size: 24 })}</QuickActionIcon>
                  <QuickActionText>Edit Profile</QuickActionText>
                </QuickActionButton>
                <QuickActionButton to="https://spotify.com" target="_blank">
                  <QuickActionIcon>{BsSpotify({ size: 24 })}</QuickActionIcon>
                  <QuickActionText>Open Spotify</QuickActionText>
                </QuickActionButton>
              </QuickActionsList>
            </QuickActionsCard>
          </DashboardGrid>
        </HomeContainer>
      </MainContent>
    </AppLayout>
    </>
  );
};

export default HomePage; 