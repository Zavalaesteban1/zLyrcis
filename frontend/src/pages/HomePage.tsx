import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { logout, getUserProfile } from '../services/api';
// Import icons
import { CgProfile } from 'react-icons/cg';
import { IoHomeOutline } from 'react-icons/io5';
import { MdMusicNote, MdAdd, MdLogout } from 'react-icons/md';
import { BsMusicNoteList, BsSpotify } from 'react-icons/bs';
import { FiTrendingUp } from 'react-icons/fi';
import { AiOutlineClockCircle } from 'react-icons/ai';

// Styled components for the home page (matching profile page style)
const AppLayout = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  color: #333;
  max-width: 100vw;
  overflow-x: hidden;
  
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
  padding: 40px 60px;
  width: calc(100% - 240px);
  max-width: 100%;
  
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
  color: #333;
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
`;

const WelcomeTitle = styled.h2`
  font-size: 24px;
  font-weight: 600;
  margin-bottom: 15px;
`;

const WelcomeText = styled.p`
  font-size: 16px;
  line-height: 1.6;
  margin-bottom: 25px;
  opacity: 0.9;
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

const HomePage: React.FC = () => {
  const [userData, setUserData] = useState<any>(null);
  const navigate = useNavigate();

  // Mock data for recent activity
  const recentActivity = [
    {
      id: 1,
      title: 'Bohemian Rhapsody',
      artist: 'Queen',
      date: '2 hours ago',
      status: 'Completed',
      coverUrl: 'https://via.placeholder.com/50x50?text=BR'
    },
    {
      id: 2,
      title: 'Hotel California',
      artist: 'Eagles',
      date: 'Yesterday',
      status: 'Completed',
      coverUrl: 'https://via.placeholder.com/50x50?text=HC'
    }
  ];

  // Fetch current user when component mounts
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const userData = await getUserProfile();
        setUserData(userData);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      // Force logout even if API call fails
      localStorage.removeItem('auth_token');
      navigate('/login');
    }
  };

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
          <PageTitle>Dashboard</PageTitle>
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
        
        <HomeContainer>
          <WelcomeCard>
            <WelcomeTitle>Welcome back, {userData?.name || 'User'}!</WelcomeTitle>
            <WelcomeText>
              Create beautiful lyric videos from your favorite Spotify tracks with just a few clicks.
              Our AI-powered system extracts lyrics and generates synchronized videos automatically.
            </WelcomeText>
            <ActionButton to="/create">Create New Video</ActionButton>
          </WelcomeCard>
          
          <DashboardGrid>
            <RecentActivityCard>
              <ActivityTitle>
                <ActivityIcon>{AiOutlineClockCircle({ size: 20 })}</ActivityIcon>
                Recent Activity
              </ActivityTitle>
              
              {recentActivity.length > 0 ? (
                <ActivityList>
                  {recentActivity.map(activity => (
                    <ActivityItem key={activity.id}>
                      <SongCover>
                        {activity.coverUrl ? (
                          <SongImage src={activity.coverUrl} alt={activity.title} />
                        ) : (
                          MdMusicNote({ size: 24 })
                        )}
                      </SongCover>
                      <ActivityContent>
                        <ActivityName>{activity.title} - {activity.artist}</ActivityName>
                        <ActivityMeta>
                          <ActivityDate>
                            {AiOutlineClockCircle({ size: 14 })} {activity.date}
                          </ActivityDate>
                          <ActivityStatus>{activity.status}</ActivityStatus>
                        </ActivityMeta>
                      </ActivityContent>
                    </ActivityItem>
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
                  <StatValue>2</StatValue>
                </StatItem>
                <StatItem>
                  <StatLabel>Total Duration</StatLabel>
                  <StatValue>12:24</StatValue>
                </StatItem>
                <StatItem>
                  <StatLabel>Account Type</StatLabel>
                  <StatValue>Free</StatValue>
                </StatItem>
                <StatItem>
                  <StatLabel>Member Since</StatLabel>
                  <StatValue>March 2023</StatValue>
                </StatItem>
              </StatsList>
            </StatsCard>
            
            <QuickActionsCard>
              <QuickActionsTitle>Quick Actions</QuickActionsTitle>
              <QuickActionsList>
                <QuickActionButton to="/create">
                  <QuickActionIcon>{MdAdd({ size: 24 })}</QuickActionIcon>
                  <QuickActionText>Create Video</QuickActionText>
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
  );
};

export default HomePage; 