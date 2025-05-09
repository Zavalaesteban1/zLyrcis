import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import styled, { keyframes, createGlobalStyle } from 'styled-components';
import { submitSpotifyLink } from '../services/api';

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

const HomeContainer = styled.div`
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

const Card = styled.div`
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

const Subtitle = styled.p`
  text-align: center;
  color: #b3b3b3;
  margin-bottom: 3rem;
  font-size: clamp(1rem, 2vw, 1.2rem);
  line-height: 1.6;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 2rem;
  width: 100%;
`;

const InputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Input = styled.input`
  width: 100%;
  padding: 1.5rem 2rem;
  border: 2px solid transparent;
  border-radius: 12px;
  background-color: #282828;
  color: white;
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #1DB954;
    background-color: #333;
    box-shadow: 0 0 0 4px rgba(29, 185, 84, 0.1);
  }
  
  &::placeholder {
    color: #b3b3b3;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const Button = styled.button`
  padding: 1.5rem 2rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(45deg, #1DB954, #1ed760);
  color: white;
  font-size: clamp(1rem, 1.5vw, 1.2rem);
  font-weight: 600;
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

const ErrorMessage = styled.div`
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

const HomePage: React.FC = () => {
  const [spotifyUrl, setSpotifyUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

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
      navigate(`/status/${response.id}`);
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <GlobalStyle />
      <HomeContainer>
        <ContentWrapper>
          <Card>
            <Title>Lyric Video Generator</Title>
            <Subtitle>
              Transform your favorite Spotify tracks into beautiful lyric videos.
              Just paste the link and let the magic happen!
            </Subtitle>
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
          </Card>
        </ContentWrapper>
      </HomeContainer>
    </>
  );
};

export default HomePage; 