import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { getVideoStatus } from '../services/api';

// Global styles to ensure full-screen coverage
const GlobalStyle = createGlobalStyle`
  * {
    margin: 0;
    padding: 0;
    box-sizing: border-box;
  }

  html, body, #root {
    height: 100%;
    width: 100%;
    overflow: hidden;
  }

  body {
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen,
      Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
  }
`;

const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

const StatusContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100vw;
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

const ContentWrapper = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  padding: 2rem;
  background: rgba(0, 0, 0, 0.4);
  backdrop-filter: blur(10px);
`;

const StatusCard = styled.div`
  background: rgba(18, 18, 18, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  padding: 3rem;
  width: 90%;
  max-width: 800px;
  transition: transform 0.3s ease;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);

  @media (max-width: 768px) {
    padding: 2rem;
    width: 95%;
  }
`;

const Title = styled.h1`
  font-size: clamp(2.5rem, 5vw, 4rem);
  margin-bottom: 1rem;
  text-align: center;
  background: linear-gradient(to right, #1DB954, #1ed760);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
  letter-spacing: -1px;
  line-height: 1.2;
`;

const Subtitle = styled.h2`
  text-align: center;
  color: #b3b3b3;
  margin-bottom: 3rem;
  font-size: clamp(1rem, 2vw, 1.2rem);
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const StatusInfo = styled.div`
  margin-bottom: 30px;
`;

const StatusLabel = styled.p`
  font-size: 1rem;
  color: #b3b3b3;
  margin-bottom: 5px;
`;

const StatusValue = styled.p`
  font-size: 1.2rem;
  font-weight: bold;
  margin-bottom: 20px;
`;

const ProgressBar = styled.div<{ progress: number }>`
  width: 100%;
  height: 8px;
  background-color: #535353;
  border-radius: 4px;
  margin-bottom: 30px;
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

const Button = styled.a`
  display: inline-block;
  padding: 1.5rem 2rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(45deg, #1DB954, #1ed760);
  color: white;
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  width: 100%;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 16px rgba(29, 185, 84, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #535353;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }

  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: linear-gradient(45deg, transparent, rgba(255, 255, 255, 0.1), transparent);
    transform: translateX(-100%);
  }

  &:hover::after {
    transform: translateX(100%);
    transition: transform 0.6s ease;
  }
`;

const BackLink = styled(Link)`
  margin-top: 20px;
  color: white;
  text-decoration: none;
  font-size: 1rem;
  transition: color 0.3s;
  
  &:hover {
    color: #1DB954;
    text-decoration: underline;
  }
`;

const ErrorMessage = styled.p`
  background-color: rgba(255, 82, 82, 0.1);
  color: #ff5252;
  padding: 1rem 1.5rem;
  border-radius: 8px;
  border-left: 4px solid #ff5252;
  font-size: clamp(0.875rem, 1.5vw, 1rem);
  display: flex;
  align-items: center;
  gap: 8px;

  &::before {
    content: '⚠️';
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 1.5rem;
  height: 1.5rem;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-left: 8px;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

interface StatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url: string | null;
  error: string | null;
}

const VideoStatusPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const data = await getVideoStatus(jobId as string);
        setStatus(data);
        setLoading(false);
        
        // If the video is still processing, poll for updates
        if (data.status === 'pending' || data.status === 'processing') {
          const timer = setTimeout(() => {
            setLoading(true);
          }, 5000); // Poll every 5 seconds
          
          return () => clearTimeout(timer);
        }
      } catch (err) {
        setError('Failed to fetch video status');
        setLoading(false);
        console.error(err);
      }
    };
    
    if (loading) {
      fetchStatus();
    }
  }, [jobId, loading]);
  
  const getProgressPercentage = () => {
    if (!status) return 0;
    
    switch (status.status) {
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
  
  const getStatusText = () => {
    if (!status) return 'Loading...';
    
    switch (status.status) {
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

  return (
    <>
      <GlobalStyle />
      <StatusContainer>
        <ContentWrapper>
          <StatusCard>
            <Title>Lyric Video Generator</Title>
            <Subtitle>Video Status</Subtitle>
            
            {loading && !status ? (
              <StatusInfo>
                <StatusLabel>Status</StatusLabel>
                <StatusValue>
                  Loading...
                  <LoadingSpinner />
                </StatusValue>
              </StatusInfo>
            ) : error ? (
              <ErrorMessage>{error}</ErrorMessage>
            ) : status ? (
              <>
                <StatusInfo>
                  <StatusLabel>Status</StatusLabel>
                  <StatusValue>{getStatusText()}</StatusValue>
                  
                  <ProgressBar progress={getProgressPercentage()} />
                  
                  {status.status === 'failed' && status.error && (
                    <ErrorMessage>{status.error}</ErrorMessage>
                  )}
                  
                  {status.status === 'completed' && status.video_url && (
                    <Button href={status.video_url} download>
                      Download Video
                    </Button>
                  )}
                </StatusInfo>
              </>
            ) : null}
            
            <BackLink to="/">← Back to Home</BackLink>
          </StatusCard>
        </ContentWrapper>
      </StatusContainer>
    </>
  );
};

export default VideoStatusPage; 