import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { getVideoStatus, VideoJob } from '../services/api';

// Define extended HTMLVideoElement with browser-specific properties
interface ExtendedHTMLVideoElement extends HTMLVideoElement {
  // Firefox
  mozHasAudio?: boolean;
  // Safari/Chrome
  webkitAudioDecodedByteCount?: number;
  // Standard future API
  audioTracks?: {
    length: number;
  };
}

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

const Button = styled.button`
  background: linear-gradient(to right, #1DB954, #1ed760);
  color: white;
  border: none;
  border-radius: 30px;
  padding: 12px 24px;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 10px;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 0, 0, 0.1);
  }
  
  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const VideoButton = styled.a`
  display: inline-block;
  padding: 12px 24px;
  border: 2px solid #1DB954;
  border-radius: 30px;
  background: transparent;
  color: #1DB954;
  font-size: 1rem;
  font-weight: 600;
  text-decoration: none;
  text-align: center;
  cursor: pointer;
  transition: all 0.3s ease;
  margin: 10px;
  
  &:hover {
    background: rgba(29, 185, 84, 0.1);
    transform: translateY(-2px);
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

const VideoPreviewContainer = styled.div`
  width: 100%;
  margin-bottom: 20px;
  border-radius: 8px;
  overflow: hidden;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
`;

const VideoPlayer = styled.video`
  width: 100%;
  border-radius: 8px;
  background-color: #000;
`;

const AudioIndicator = styled.div<{ hasAudio: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-top: 10px;
  margin-bottom: 20px;
  color: ${props => props.hasAudio ? '#1DB954' : '#ff5252'};
  
  &::before {
    content: ${props => props.hasAudio ? '"🔊"' : '"🔇"'};
  }
`;

const ButtonGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  width: 100%;
`;

// Add a small loading spinner variant
const SmallLoadingSpinner = styled(LoadingSpinner)`
  width: 16px;
  height: 16px;
  margin-right: 8px;
  border-width: 2px;
`;

interface StatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url: string | null;
  error: string | null;
  song_title?: string;
  artist?: string;
}

const VideoStatusPage: React.FC = () => {
  const { jobId } = useParams<{ jobId: string }>();
  const [status, setStatus] = useState<StatusResponse | null>(null);
  const [jobDetails, setJobDetails] = useState<VideoJob | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [hasAudio, setHasAudio] = useState<boolean | null>(null);
  const [isPreviewLoaded, setIsPreviewLoaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const videoRef = useRef<ExtendedHTMLVideoElement>(null);
  
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

  // Check if video has audio tracks when loaded
  const handleVideoLoaded = () => {
    setIsPreviewLoaded(true);
    if (videoRef.current) {
      // Check if video has audio tracks
      const video = videoRef.current as ExtendedHTMLVideoElement;
      
      // Method 1: Check audio tracks if available
      if (video.audioTracks && video.audioTracks.length > 0) {
        console.log("Audio detected via audioTracks property");
        setHasAudio(true);
        return;
      }
      
      // Method 2: Play video briefly to check if audio can be detected
      const originalVolume = video.volume;
      video.volume = 0.5; // Set higher volume to ensure audio detection works
      
      console.log("Attempting to play video to detect audio...");
      const playPromise = video.play();
      
      if (playPromise !== undefined) {
        playPromise.then(() => {
          // Video started playing
          setTimeout(() => {
            // Check if we can detect audio using multiple methods
            const usingMoz = typeof video.mozHasAudio !== 'undefined';
            const usingWebkit = typeof video.webkitAudioDecodedByteCount !== 'undefined';
            const usingTracks = video.audioTracks && video.audioTracks.length > 0;
            
            console.log("Audio detection details:", {
              mozHasAudio: video.mozHasAudio,
              webkitAudioDecodedByteCount: video.webkitAudioDecodedByteCount,
              audioTracks: video.audioTracks ? video.audioTracks.length : 'not available'
            });
            
            if (video.mozHasAudio || 
                Boolean(video.webkitAudioDecodedByteCount) || 
                Boolean(usingTracks)) {
              console.log("Audio detected through browser properties");
              setHasAudio(true);
            } else {
              // If using webkit and we've decoded some bytes
              if (usingWebkit) {
                const hasAudio = video.webkitAudioDecodedByteCount! > 0;
                console.log(`Webkit audio detection: ${hasAudio ? 'YES' : 'NO'} (${video.webkitAudioDecodedByteCount} bytes)`);
                setHasAudio(hasAudio);
              } else {
                // As a last resort, check if we're getting video duration updates
                // which often indicates there's some kind of track (usually audio)
                const initialTime = video.currentTime;
                console.log("Using last resort method - checking time updates");
                
                // Give it a bit more time and check again
                setTimeout(() => {
                  if (video.currentTime > initialTime + 0.5) {
                    console.log("Audio likely present - video is playing");
                    setHasAudio(true);
                  } else {
                    console.log("No audio detected by any method");
                    setHasAudio(false);
                  }
                }, 1000);
              }
            }
            
            // Pause the video and reset
            video.pause();
            video.currentTime = 0;
            video.volume = originalVolume;
          }, 2000); // Give it more time to decode audio
        })
        .catch(e => {
          console.error("Error trying to play video to check audio:", e);
          video.volume = originalVolume;
          // We still assume there might be audio but playback failed for other reasons
          setHasAudio(true); 
        });
      }
    }
  };
  
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

  // Modify handleDownload function in VideoStatusPage.tsx
  const handleDownload = async () => {
    if (!status?.video_url) return;

    try {
      // Show loading indicator
      setIsDownloading(true);
      
      // Open in new tab instead of trying to process the download
      window.open(status.video_url, '_blank');
      
      // Hide loading indicator after a brief delay
      setTimeout(() => {
        setIsDownloading(false);
      }, 1000);
    } catch (err) {
      console.error('Error downloading video:', err);
      setIsDownloading(false);
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
                    <>
                      <VideoPreviewContainer>
                        <VideoPlayer 
                          ref={videoRef}
                          controls
                          onLoadedData={handleVideoLoaded}
                          onCanPlay={handleVideoLoaded}
                          preload="metadata"
                          poster="/video-thumbnail.png"
                          onError={(e) => {
                            console.error("Video error:", e);
                            setHasAudio(false);
                          }}
                        >
                          <source src={`${status.video_url}?t=${new Date().getTime()}`} type="video/mp4" />
                          Your browser does not support the video tag.
                        </VideoPlayer>
                      </VideoPreviewContainer>
                      
                      {isPreviewLoaded && hasAudio !== null && (
                        <AudioIndicator hasAudio={hasAudio}>
                          {hasAudio 
                            ? "Audio detected - Video includes sound!" 
                            : "No audio detected - Video might be silent."}
                        </AudioIndicator>
                      )}
                      
                      <ButtonGroup>
                        <Button 
                          onClick={handleDownload}
                          disabled={isDownloading}
                        >
                          {isDownloading ? (
                            <>
                              <SmallLoadingSpinner />
                              Downloading...
                            </>
                          ) : (
                            'Download Video'
                          )}
                        </Button>
                        
                        <VideoButton 
                          href={status.video_url} 
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open in New Tab
                        </VideoButton>
                      </ButtonGroup>
                    </>
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