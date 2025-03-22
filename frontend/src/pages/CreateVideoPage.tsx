import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { submitSpotifyLink, logout, getUserProfile, getVideoStatus, getVideoJob, VideoJob, VideoStatusResponse } from '../services/api';
// Import icons
import { CgProfile } from 'react-icons/cg';
import { IoHomeOutline } from 'react-icons/io5';
import { MdMusicNote, MdAdd, MdLogout } from 'react-icons/md';
import { FiUser } from 'react-icons/fi';

// Styled components for the create video page (matching profile page style)
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
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
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

const ContentWrapper = styled.div`
  width: 100%;
  min-height: calc(100vh - 90px);
`;

const Card = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 30px;
  width: 100%;
  max-width: 100%;
`;

const Title = styled.h1`
  font-size: 32px;
  font-weight: 600;
  margin-bottom: 20px;
  text-align: center;
  color: #333;
`;

const Subtitle = styled.p`
  text-align: center;
  color: #666;
  margin-bottom: 30px;
  font-size: 16px;
  line-height: 1.6;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
`;

const Form = styled.form`
  width: 100%;
  max-width: 800px;
  margin: 0 auto 40px;
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const InputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 15px;
  border: 1px solid #ddd;
  border-radius: 8px;
  background-color: #f9f9f9;
  color: #333;
  font-size: 16px;
  
  &:focus {
    outline: none;
    border-color: #1DB954;
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.1);
  }
  
  &::placeholder {
    color: #999;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 15px;
  font-size: 16px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  
  &:hover {
    background-color: #169c46;
  }
  
  &:active {
    transform: scale(0.98);
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
    transform: none;
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(233, 20, 41, 0.1);
  color: #e91429;
  padding: 15px;
  border-radius: 8px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;

  &::before {
    content: '⚠️';
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 18px;
  height: 18px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const SectionTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 20px;
  color: #333;
`;

const AdditionalInfo = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 20px;
  
  @media (max-width: 1200px) {
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  }
  
  @media (max-width: 768px) {
    grid-template-columns: 1fr;
  }
`;

const InfoCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 20px;
  height: 100%;
`;

const InfoTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 10px;
  color: #1DB954;
`;

const InfoText = styled.p`
  font-size: 14px;
  line-height: 1.5;
  color: #666;
`;

// Add a StatusSection component
const StatusSection = styled.div`
  margin-top: 30px;
  padding: 20px;
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  width: 100%;
`;

const StatusInfo = styled.div`
  margin-bottom: 20px;
`;

const StatusLabel = styled.p`
  font-size: 14px;
  color: #666;
  margin-bottom: 5px;
`;

const StatusValue = styled.p`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  margin-bottom: 20px;
  position: relative;
  overflow: hidden;
  
  &:after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    width: ${props => props.progress}%;
    background-color: #1DB954;
    border-radius: 4px;
    transition: width 0.5s ease;
  }
`;

const DownloadButton = styled.a`
  display: inline-block;
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 12px 15px;
  font-size: 16px;
  font-weight: 500;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
  transition: all 0.2s ease;
  width: 100%;
  
  &:hover {
    background-color: #169c46;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

// Add NotificationMessage styled component
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

const CreateVideoPage: React.FC = () => {
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState<any>(null);
  const [jobId, setJobId] = useState<string | null>(null);
  const [jobStatus, setJobStatus] = useState<VideoStatusResponse | null>(null);
  const [jobDetails, setJobDetails] = useState<VideoJob | null>(null);
  const [statusPolling, setStatusPolling] = useState(false);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const navigate = useNavigate();
  
  // Use a ref to store the interval ID
  const statusPollRef = useRef<number | null>(null);
  
  // Clear interval on unmount
  useEffect(() => {
    return () => {
      if (statusPollRef.current) {
        clearInterval(statusPollRef.current);
      }
    };
  }, []);
  
  // Fetch user data when component mounts
  useEffect(() => {
    fetchUser();
  }, []);
  
  // Fetch current user
  const fetchUser = async () => {
    try {
      const userData = await getUserProfile();
      setUserData(userData);
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };
  
  // Poll for status updates
  useEffect(() => {
    if (jobId) {
      setIsLoading(true);
      pollStatus();
    }
  }, [jobId]);

  const pollStatus = async () => {
    try {
      const status = await getVideoStatus(jobId!);
      setJobStatus(status);
      setIsLoading(false);
      
      // Fetch job details to get song title and artist
      try {
        const details = await getVideoJob(jobId!);
        setJobDetails(details);
      } catch (detailsError) {
        console.error('Error fetching job details:', detailsError);
      }
      
      // If the job is still in progress, poll again in 5 seconds
      if (status.status === 'pending' || status.status === 'processing') {
        // Clear previous interval if it exists
        if (statusPollRef.current) {
          clearInterval(statusPollRef.current);
        }
        
        // Set new interval
        statusPollRef.current = window.setInterval(pollStatus, 5000);
      } else {
        // Clear interval if job is complete or failed
        if (statusPollRef.current) {
          clearInterval(statusPollRef.current);
        }
      }
    } catch (error) {
      console.error('Error polling status:', error);
      setIsLoading(false);
      setError('Failed to get job status');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!spotifyUrl.includes('spotify.com/track/')) {
      setError('Please enter a valid Spotify track URL');
      return;
    }
    
    setIsLoading(true);
    setError('');
    
    try {
      const response = await submitSpotifyLink(spotifyUrl);
      // Instead of navigating, set the jobId and start polling
      setJobId(response.id);
      setJobStatus({
        status: 'pending',
        video_url: null,
        error: null
      });
      setStatusPolling(true);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  // Helper function to get progress percentage
  const getProgressPercentage = () => {
    if (!jobStatus) return 0;
    
    switch (jobStatus.status) {
      case 'pending':
        return 10;
      case 'processing':
        return 50;
      case 'completed':
        return 100;
      case 'failed':
        return 100;
      default:
        return 0;
    }
  };
  
  // Helper function to get status text
  const getStatusText = () => {
    if (!jobStatus) return '';
    
    switch (jobStatus.status) {
      case 'pending':
        return 'Waiting to start processing...';
      case 'processing':
        return 'Generating your lyric video...';
      case 'completed':
        return 'Your video is ready!';
      case 'failed':
        return 'Failed to generate video';
      default:
        return 'Unknown status';
    }
  };

  // Function to reset the form and status
  const handleReset = () => {
    setJobId(null);
    setJobStatus(null);
    setStatusPolling(false);
    setSpotifyUrl('');
  };

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

  // Add a new action when the video is completed
  useEffect(() => {
    // Check if the job status has changed to completed
    if (jobStatus?.status === 'completed') {
      // Show a success notification
      setNotification({
        message: 'Your video is ready! You can find it in your Songs collection.',
        type: 'success'
      });
      
      // Set a timeout to redirect to songs page after showing the notification
      const redirectTimer = setTimeout(() => {
        navigate('/songs');
      }, 5000); // Redirect after 5 seconds
      
      return () => clearTimeout(redirectTimer);
    }
  }, [jobStatus, navigate]);

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
          <NavItem to="/songs">
            <NavIcon>{MdMusicNote({ size: 18 })}</NavIcon> My Songs
          </NavItem>
          <NavItem to="/create" active>
            <NavIcon>{MdAdd({ size: 18 })}</NavIcon> Create Lyrics
          </NavItem>
        </NavMenu>
      </Sidebar>
      
      <MainContent>
        <PageHeader>
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
        
        <ContentWrapper>
          <Card>
            <Title>Create Your Lyric Video</Title>
            <Subtitle>
              Transform your favorite Spotify tracks into beautiful lyric videos.
              Just paste the link and let the magic happen!
            </Subtitle>
            
            {!jobId ? (
              <Form onSubmit={handleSubmit}>
                <InputContainer>
                  <Input
                    type="text"
                    placeholder="Paste your Spotify track link here..."
                    value={spotifyUrl}
                    onChange={(e) => setSpotifyUrl(e.target.value)}
                    disabled={isLoading}
                  />
                </InputContainer>
                <Button type="submit" disabled={isLoading || !spotifyUrl}>
                  {isLoading ? (
                    <>
                      Generating Video
                      <LoadingSpinner />
                    </>
                  ) : (
                    'Create Lyric Video'
                  )}
                </Button>
                {error && <ErrorMessage>{error}</ErrorMessage>}
              </Form>
            ) : (
              <StatusSection>
                <StatusInfo>
                  <StatusLabel>Status</StatusLabel>
                  <StatusValue>
                    {getStatusText()}
                    {(jobStatus?.status === 'pending' || jobStatus?.status === 'processing') && (
                      <LoadingSpinner />
                    )}
                  </StatusValue>
                  
                  <ProgressBar progress={getProgressPercentage()} />
                  
                  {jobStatus?.status === 'failed' && jobStatus.error && (
                    <ErrorMessage>{jobStatus.error}</ErrorMessage>
                  )}
                  
                  {jobStatus?.status === 'completed' && jobStatus.video_url && (
                    <DownloadButton 
                      href={jobStatus.video_url} 
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      Download Video
                    </DownloadButton>
                  )}
                  
                  <Button 
                    onClick={handleReset} 
                    style={{ marginTop: '20px', backgroundColor: '#666' }}
                  >
                    Create Another Video
                  </Button>
                </StatusInfo>
              </StatusSection>
            )}
            
            <SectionTitle>How It Works</SectionTitle>
            
            <AdditionalInfo>
              <InfoCard>
                <InfoTitle>1. Paste Spotify Link</InfoTitle>
                <InfoText>
                  Simply copy and paste the URL of any Spotify track into the input field above.
                  Our system will verify the link and prepare to extract the song's information
                  and lyrics.
                </InfoText>
              </InfoCard>
              
              <InfoCard>
                <InfoTitle>2. Generate Video</InfoTitle>
                <InfoText>
                  Our AI-powered system extracts lyrics from your Spotify track and creates a beautiful 
                  video with synchronized lyrics. The process takes just a few minutes, and you'll be 
                  notified when your video is ready to download.
                </InfoText>
              </InfoCard>
              
              <InfoCard>
                <InfoTitle>3. Download & Share</InfoTitle>
                <InfoText>
                  Once your video is ready, you can download it in high quality and share it with
                  friends and family. The generated video will include the song's artwork and
                  synchronized lyrics with beautiful animations.
                </InfoText>
              </InfoCard>
            </AdditionalInfo>
          </Card>
        </ContentWrapper>
      </MainContent>
    </AppLayout>
  );
};

export default CreateVideoPage; 