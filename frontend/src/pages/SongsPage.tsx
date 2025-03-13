import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getUserProfile, logout } from '../services/api';
// Import icons
import { CgProfile } from 'react-icons/cg';
import { IoHomeOutline } from 'react-icons/io5';
import { MdMusicNote, MdAdd, MdLogout, MdDownload, MdPlayArrow, MdPause } from 'react-icons/md';
import { BsMusicNoteList } from 'react-icons/bs';

// Styled components for the songs page (matching profile page style)
const AppLayout = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  color: #333;
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
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  
  /* Custom scrollbar for better UX */
  &::-webkit-scrollbar {
    width: 10px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #1DB954;
  }
`;

const SongItem = styled.div`
  display: flex;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  
  @media (max-width: 768px) {
    padding: 15px 20px;
    flex-wrap: wrap;
  }
  
  &:hover {
    background-color: #f9f9f9;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const SongCover = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 25px;
  flex-shrink: 0;
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 28px;
  
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    margin-right: 20px;
  }
  
  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
    margin-right: 15px;
  }
`;

const SongImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const SongInfo = styled.div`
  flex: 1;
  min-width: 0; /* Prevents flex items from overflowing */
`;

const SongTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: 768px) {
    font-size: 16px;
    white-space: normal;
  }
`;

const SongArtist = styled.p`
  font-size: 15px;
  color: #666;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const SongDuration = styled.span`
  font-size: 15px;
  color: #999;
  margin-right: 30px;
  
  @media (max-width: 768px) {
    margin-right: 20px;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    margin-right: 10px;
  }
`;

const SongActions = styled.div`
  display: flex;
  gap: 20px;
  
  @media (max-width: 768px) {
    gap: 15px;
  }
  
  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const ActionButton = styled.button`
  background-color: transparent;
  border: none;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: all 0.2s ease;
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
  
  &:hover {
    background-color: #f0f0f0;
    color: #1DB954;
  }
`;

const DownloadButton = styled(ActionButton)`
  &:hover {
    color: #1DB954;
  }
`;

const PlayButton = styled(ActionButton)`
  background-color: ${props => props.className === 'playing' ? '#1DB954' : 'transparent'};
  color: ${props => props.className === 'playing' ? 'white' : '#666'};
  
  &:hover {
    background-color: ${props => props.className === 'playing' ? '#169c46' : '#f0f0f0'};
    color: ${props => props.className === 'playing' ? 'white' : '#1DB954'};
  }
`;

const EmptyState = styled.div`
  padding: 80px 30px;
  text-align: center;
  color: #999;
  
  @media (max-width: 768px) {
    padding: 50px 20px;
  }
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  margin-bottom: 20px;
  color: #ddd;
`;

const EmptyStateText = styled.p`
  font-size: 16px;
  margin: 0 0 20px;
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
  margin: 0 auto;
  
  &:hover {
    background-color: #169c46;
  }
  
  &:active {
    transform: scale(0.98);
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

const StatsCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 25px;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const StatsTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 18px;
    margin: 0 0 15px;
  }
`;

const StatsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  
  @media (max-width: 768px) {
    gap: 12px;
  }
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
  
  @media (max-width: 768px) {
    padding-bottom: 12px;
  }
`;

const StatLabel = styled.span`
  font-size: 16px;
  color: #666;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const StatValue = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

// Add ContentGrid styled component to match ProfilePage
const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
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

// Mock data for songs (replace with actual API call later)
const mockSongs = [
  {
    id: 1,
    title: 'Bohemian Rhapsody',
    artist: 'Queen',
    duration: '5:55',
    coverUrl: 'https://via.placeholder.com/60x60?text=BR',
  },
  {
    id: 2,
    title: 'Hotel California',
    artist: 'Eagles',
    duration: '6:30',
    coverUrl: 'https://via.placeholder.com/60x60?text=HC',
  },
  {
    id: 3,
    title: 'Imagine',
    artist: 'John Lennon',
    duration: '3:04',
    coverUrl: 'https://via.placeholder.com/60x60?text=IM',
  },
  {
    id: 4,
    title: 'Sweet Child O\' Mine',
    artist: 'Guns N\' Roses',
    duration: '5:56',
    coverUrl: 'https://via.placeholder.com/60x60?text=SC',
  },
  {
    id: 5,
    title: 'Billie Jean',
    artist: 'Michael Jackson',
    duration: '4:54',
    coverUrl: 'https://via.placeholder.com/60x60?text=BJ',
  }
];

interface Song {
  id: number;
  title: string;
  artist: string;
  duration: string;
  coverUrl: string;
}

const SongsPage: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [playingSongId, setPlayingSongId] = useState<number | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();
  
  useEffect(() => {
    // Fetch user profile data
    const fetchUserData = async () => {
      try {
        const data = await getUserProfile();
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    
    // Fetch songs (using mock data for now)
    const fetchSongs = async () => {
      try {
        setLoading(true);
        // In a real app, this would be an API call
        // const response = await getSongs();
        // setSongs(response.data);
        
        // Using mock data for now
        setSongs(mockSongs);
        setError(null);
      } catch (err) {
        setError('Failed to load songs. Please try again later.');
        console.error('Error fetching songs:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    fetchSongs();
  }, []);
  
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
  
  const handlePlayPause = (songId: number) => {
    if (playingSongId === songId) {
      setPlayingSongId(null);
    } else {
      setPlayingSongId(songId);
    }
  };
  
  const handleDownload = (song: Song) => {
    // This is where you would implement the actual download functionality
    // For now, we'll just show a notification
    setNotification({
      message: `Downloading "${song.title}" by ${song.artist}...`,
      type: 'success'
    });
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };
  
  if (loading) {
    return (
      <AppLayout>
        <Sidebar>
          <Logo>zLyrics</Logo>
          <NavMenu>
            <NavItem to="/">
              <NavIcon>{IoHomeOutline({ size: 18 })}</NavIcon> Home
            </NavItem>
            <NavItem to="/profile">
              <NavIcon>{CgProfile({ size: 18 })}</NavIcon> Profile
            </NavItem>
            <NavItem to="/songs" active>
              <NavIcon>{MdMusicNote({ size: 18 })}</NavIcon> My Songs
            </NavItem>
            <NavItem to="/create">
              <NavIcon>{MdAdd({ size: 18 })}</NavIcon> Create Video
            </NavItem>
          </NavMenu>
        </Sidebar>
        <MainContent>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <h2>Loading songs...</h2>
          </div>
        </MainContent>
      </AppLayout>
    );
  }
  
  if (error) {
    return (
      <AppLayout>
        <Sidebar>
          <Logo>zLyrics</Logo>
          <NavMenu>
            <NavItem to="/">
              <NavIcon>{IoHomeOutline({ size: 18 })}</NavIcon> Home
            </NavItem>
            <NavItem to="/profile">
              <NavIcon>{CgProfile({ size: 18 })}</NavIcon> Profile
            </NavItem>
            <NavItem to="/songs" active>
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
            <p>{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
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
          <NavItem to="/">
            <NavIcon>{IoHomeOutline({ size: 18 })}</NavIcon> Home
          </NavItem>
          <NavItem to="/profile">
            <NavIcon>{CgProfile({ size: 18 })}</NavIcon> Profile
          </NavItem>
          <NavItem to="/songs" active>
            <NavIcon>{MdMusicNote({ size: 18 })}</NavIcon> My Songs
          </NavItem>
          <NavItem to="/create">
            <NavIcon>{MdAdd({ size: 18 })}</NavIcon> Create Video
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
            
            <SongsList>
              {songs.length === 0 ? (
                <EmptyState>
                  <EmptyStateIcon>
                    {MdMusicNote({ size: 48 })}
                  </EmptyStateIcon>
                  <EmptyStateText>You don't have any songs yet.</EmptyStateText>
                  <Button as={Link} to="/create">
                    {MdAdd({ size: 18 })} Create Your First Video
                  </Button>
                </EmptyState>
              ) : (
                songs.map(song => (
                  <SongItem key={song.id}>
                    <SongCover>
                      {song.coverUrl ? (
                        <SongImage src={song.coverUrl} alt={song.title} />
                      ) : (
                        MdMusicNote({ size: 24 })
                      )}
                    </SongCover>
                    <SongInfo>
                      <SongTitle>{song.title}</SongTitle>
                      <SongArtist>{song.artist}</SongArtist>
                    </SongInfo>
                    <SongDuration>{song.duration}</SongDuration>
                    <SongActions>
                      <PlayButton 
                        onClick={() => handlePlayPause(song.id)}
                        className={playingSongId === song.id ? 'playing' : ''}
                      >
                        {playingSongId === song.id 
                          ? MdPause({ size: 22 })
                          : MdPlayArrow({ size: 22 })
                        }
                      </PlayButton>
                      <DownloadButton onClick={() => handleDownload(song)}>
                        {MdDownload({ size: 22 })}
                      </DownloadButton>
                    </SongActions>
                  </SongItem>
                ))
              )}
            </SongsList>
          </SongsContainer>
          
          <div>
            <StatsCard>
              <StatsTitle>Music Statistics</StatsTitle>
              <StatsList>
                <StatItem>
                  <StatLabel>Total Songs</StatLabel>
                  <StatValue>{songs.length}</StatValue>
                </StatItem>
                <StatItem>
                  <StatLabel>Last Added</StatLabel>
                  <StatValue>Today</StatValue>
                </StatItem>
                <StatItem>
                  <StatLabel>Most Played</StatLabel>
                  <StatValue>{songs[0]?.title || 'None'}</StatValue>
                </StatItem>
                <StatItem>
                  <StatLabel>Total Duration</StatLabel>
                  <StatValue>20:19</StatValue>
                </StatItem>
              </StatsList>
            </StatsCard>
            
            <ComingSoonCard>
              <ComingSoonTitle>Coming Soon</ComingSoonTitle>
              <ComingSoonText>
                Soon you'll be able to create playlists and share your favorite songs with friends.
                Stay tuned for more exciting features!
              </ComingSoonText>
            </ComingSoonCard>
          </div>
        </ContentGrid>
      </MainContent>
    </AppLayout>
  );
};

export default SongsPage; 