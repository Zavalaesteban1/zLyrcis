import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { login, googleLogin, LoginCredentials } from '../services/api';
import { MdMusicNote, MdVideoLibrary, MdLyrics, MdClose } from 'react-icons/md';
import { BsSpotify } from 'react-icons/bs';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { RiRobot2Line } from 'react-icons/ri';

// Global style to hide scrollbars
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

// Styled components
const PageContainer = styled.div`
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  background-color: white;
  background-image: linear-gradient(rgba(29, 185, 84, 0.03) 1px, transparent 1px), 
                    linear-gradient(90deg, rgba(29, 185, 84, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  color: #333;
  overflow-x: hidden;
  position: relative;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 40px;
  background-color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(10px);
  -webkit-backdrop-filter: blur(10px);
  z-index: 100;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);

  @media (max-width: 768px) {
    padding: 15px 20px;
  }
`;

const HeaderLogo = styled.div`
  font-size: 32px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1DB954;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const LogoIcon = styled.span`
  display: flex;
  align-items: center;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 16px;
`;

const HeaderButton = styled.button`
  padding: 10px 20px;
  border-radius: 30px;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  @media (max-width: 768px) {
    padding: 8px 16px;
    font-size: 14px;
  }
`;

const LoginButton = styled(HeaderButton)`
  background-color: transparent;
  border: 2px solid #1DB954;
  color: #1DB954;
  
  &:hover {
    background-color: rgba(29, 185, 84, 0.1);
  }
`;

const SignupButton = styled(HeaderButton)`
  background-color: #1DB954;
  border: 2px solid #1DB954;
  color: white;
  
  &:hover {
    background-color: #169c46;
  }
`;

const HeroSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 100px 40px;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 60px 20px;
  }
`;

const HeroTitle = styled.h1`
  font-size: 56px;
  font-weight: 800;
  color: #333;
  margin-bottom: 24px;
  line-height: 1.2;
  max-width: 900px;
  
  @media (max-width: 768px) {
    font-size: 36px;
    margin-bottom: 16px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 22px;
  color: #666;
  margin-bottom: 40px;
  line-height: 1.6;
  max-width: 800px;
  
  @media (max-width: 768px) {
    font-size: 18px;
    margin-bottom: 30px;
  }
`;

const PrimaryButton = styled.button`
  padding: 18px 36px;
  background-color: #1DB954;
  border: none;
  border-radius: 10px;
  color: white;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  
  &:hover {
    background-color: #169c46;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(29, 185, 84, 0.2);
  }
  
  @media (max-width: 768px) {
    padding: 14px 28px;
    font-size: 16px;
  }
`;

const FeatureSection = styled.section`
  padding: 80px 40px;
  background-color: rgba(29, 185, 84, 0.05);
  
  @media (max-width: 768px) {
    padding: 60px 20px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 42px;
  font-weight: 700;
  color: #333;
  margin-bottom: 20px;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 32px;
  }
`;

const SectionSubtitle = styled.p`
  font-size: 20px;
  color: #666;
  margin-bottom: 60px;
  text-align: center;
  max-width: 800px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 40px;
  }
`;

const FeatureList = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 40px;
  max-width: 1200px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    gap: 30px;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
`;

const FeatureIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 20px;
  background-color: rgba(29, 185, 84, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36px;
  color: #1DB954;
  margin-bottom: 20px;
`;

const FeatureTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin-bottom: 12px;
`;

const FeatureDescription = styled.p`
  font-size: 16px;
  color: #666;
  line-height: 1.6;
  max-width: 300px;
  margin: 0 auto;
`;

const CTASection = styled.section`
  padding: 100px 40px;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 60px 20px;
  }
`;

// Modal components
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.6);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(5px);
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.2);
  width: 100%;
  max-width: 500px;
  padding: 40px;
  position: relative;
  
  @media (max-width: 768px) {
    padding: 30px;
    width: 90%;
  }
`;

const ModalCloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: transparent;
  border: none;
  font-size: 24px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    color: #333;
  }
`;

const ModalTitle = styled.h2`
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin-bottom: 10px;
  text-align: center;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const ModalSubtitle = styled.p`
  color: #666;
  font-size: 16px;
  text-align: center;
  margin-bottom: 30px;
`;

// Login form components - reusing most of the existing login form styles
const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 24px;
  width: 100%;
`;

const InputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Label = styled.label`
  font-size: 16px;
  margin-bottom: 8px;
  display: block;
  color: #444;
  font-weight: 500;
`;

const Input = styled.input`
  width: 100%;
  padding: 14px 16px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  background-color: white;
  color: #333;
  font-size: 16px;
  transition: all 0.3s ease;
  
  &:focus {
    outline: none;
    border-color: #1DB954;
    box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.1);
  }
  
  &::placeholder {
    color: #999;
  }
`;

const Button = styled.button`
  padding: 14px;
  border: none;
  border-radius: 8px;
  background-color: #1DB954;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin-top: 10px;
  
  &:hover {
    background-color: #169c46;
  }
  
  &:disabled {
    background-color: #a0a0a0;
    cursor: not-allowed;
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(233, 20, 41, 0.1);
  color: #e91429;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 14px;
  border-left: 4px solid #e91429;
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 20px 0;
  color: #666;
  
  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e0e0e0;
  }
  
  span {
    margin: 0 15px;
    font-size: 14px;
  }
`;

const GoogleLoginButton = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
`;

const LinkContainer = styled.div`
  margin-top: 24px;
  text-align: center;
  color: #666;
  font-size: 14px;
  
  a {
    color: #1DB954;
    text-decoration: none;
    font-weight: 600;
    
    &:hover {
      text-decoration: underline;
    }
  }
`;

const LoadingSpinner = styled.div`
  display: inline-block;
  width: 20px;
  height: 20px;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const Footer = styled.footer`
  background-color: #f9f9f9;
  padding: 40px;
  text-align: center;
  color: #666;
`;

const LandingPage: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Google Client ID
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCredentials(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!credentials.username || !credentials.password) {
      setError('Please enter both username and password');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      await login(credentials);
      navigate('/');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLoginSuccess = async (credentialResponse: any) => {
    try {
      setIsLoading(true);
      setError(null);
      
      const { credential } = credentialResponse;
      
      if (!credential) {
        throw new Error('No credentials returned from Google');
      }
      
      const decoded: any = jwtDecode(credential);
      console.log('Google login successful:', decoded);
      
      await googleLogin({ token_id: credential });
      navigate('/');
    } catch (err: any) {
      console.error('Google login error:', err);
      const errorMessage = err.response?.data?.error || 'Google login failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleGoogleLoginError = () => {
    setError('Google sign-in was unsuccessful. Please try again.');
  };
  
  const openLoginModal = () => {
    setIsLoginModalOpen(true);
    setIsSignupModalOpen(false);
    setError(null);
  };
  
  const openSignupModal = () => {
    setIsSignupModalOpen(true);
    setIsLoginModalOpen(false);
    setError(null);
  };
  
  const closeModals = () => {
    setIsLoginModalOpen(false);
    setIsSignupModalOpen(false);
    setError(null);
  };
  
  return (
    <PageContainer>
      <GlobalStyle />
      {/* Header with login/signup buttons */}
      <Header>
        <HeaderLogo>
          <LogoIcon>{MdMusicNote({ size: 28 })}</LogoIcon>
          zLyrics
        </HeaderLogo>
        
        <HeaderButtons>
          <LoginButton onClick={openLoginModal}>Log In</LoginButton>
          <SignupButton onClick={openSignupModal}>Sign Up</SignupButton>
        </HeaderButtons>
      </Header>
      
      {/* Hero section */}
      <HeroSection>
        <HeroTitle>Generate Beautiful Lyric Videos from Your Favorite Songs</HeroTitle>
        <HeroSubtitle>
          Turn any Song track into a stunning lyric video with just a few clicks.
          Learn songs faster, share with friends, or enhance your music experience.
        </HeroSubtitle>
        <PrimaryButton onClick={openSignupModal}>Get Started for Free</PrimaryButton>
      </HeroSection>
      
      {/* Features section */}
      <FeatureSection>
        <SectionTitle>Features</SectionTitle>
        <SectionSubtitle>Everything you need to create amazing lyric videos</SectionSubtitle>
        
        <FeatureList>
          <FeatureItem>
            <FeatureIcon>{RiRobot2Line({ size: 36 })}</FeatureIcon>
            <FeatureTitle>AI Lyric Agent</FeatureTitle>
            <FeatureDescription>
              Our intelligent AI agent helps you create lyric videos effortlessly. Just describe what you want, and the AI does the rest.
            </FeatureDescription>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureIcon>{MdLyrics({ size: 36 })}</FeatureIcon>
            <FeatureTitle>Automatic Lyric Sync</FeatureTitle>
            <FeatureDescription>
              Our algorithm perfectly syncs lyrics with the music, highlighting each line as it's sung.
            </FeatureDescription>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureIcon>{MdVideoLibrary({ size: 36 })}</FeatureIcon>
            <FeatureTitle>Video Library</FeatureTitle>
            <FeatureDescription>
              Build your personal collection of lyric videos. Access them anytime, from any device.
            </FeatureDescription>
          </FeatureItem>
        </FeatureList>
      </FeatureSection>
      
      {/* Call to action section */}
      <CTASection>
        <SectionTitle>Ready to create your first lyric video?</SectionTitle>
        <SectionSubtitle>Join thousands of users who are already enjoying zLyrics</SectionSubtitle>
        <PrimaryButton onClick={openSignupModal}>Create Free Account</PrimaryButton>
      </CTASection>
      
      {/* Footer */}
      <Footer>
        <p>© 2025 zLyrics. All rights reserved.</p>
      </Footer>
      
      {/* Login Modal */}
      <ModalOverlay isOpen={isLoginModalOpen}>
        <ModalContent>
          <ModalCloseButton onClick={closeModals}>
            {MdClose({ size: 24 })}
          </ModalCloseButton>
          
          <ModalTitle>Welcome Back</ModalTitle>
          <ModalSubtitle>Sign in to continue creating amazing lyric videos</ModalSubtitle>
          
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLoginButton>
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                useOneTap
                theme="outline"
                size="large"
                text="signin_with"
                shape="rectangular"
                width="100%"
              />
            </GoogleLoginButton>
          </GoogleOAuthProvider>
          
          <OrDivider>
            <span>OR</span>
          </OrDivider>
          
          <Form onSubmit={handleSubmit}>
            <InputContainer>
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                name="username"
                type="text"
                placeholder="Enter your username"
                value={credentials.username}
                onChange={handleChange}
                disabled={isLoading}
              />
            </InputContainer>
            
            <InputContainer>
              <Label htmlFor="password">Password</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Enter your password"
                value={credentials.password}
                onChange={handleChange}
                disabled={isLoading}
              />
            </InputContainer>
            
            <Button type="submit" disabled={isLoading}>
              {isLoading ? (
                <>
                  Signing In
                  <LoadingSpinner />
                </>
              ) : (
                'Sign In'
              )}
            </Button>
            
            {error && <ErrorMessage>{error}</ErrorMessage>}
          </Form>
          
          <LinkContainer>
            Don't have an account? <a href="#" onClick={(e) => {
              e.preventDefault();
              openSignupModal();
            }}>Sign up</a>
          </LinkContainer>
        </ModalContent>
      </ModalOverlay>
      
      {/* Signup Modal */}
      <ModalOverlay isOpen={isSignupModalOpen}>
        <ModalContent>
          <ModalCloseButton onClick={closeModals}>
            {MdClose({ size: 24 })}
          </ModalCloseButton>
          
          <ModalTitle>Create Your Account</ModalTitle>
          <ModalSubtitle>Join zLyrics and start creating amazing lyric videos</ModalSubtitle>
          
          <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
            <GoogleLoginButton>
              <GoogleLogin
                onSuccess={handleGoogleLoginSuccess}
                onError={handleGoogleLoginError}
                useOneTap
                theme="outline"
                size="large"
                text="signup_with"
                shape="rectangular"
                width="100%"
              />
            </GoogleLoginButton>
          </GoogleOAuthProvider>
          
          <OrDivider>
            <span>OR</span>
          </OrDivider>
          
          {/* In a real app, you'd have a separate signup form here */}
          <Button onClick={() => navigate('/signup')}>
            Continue with Email
          </Button>
          
          <LinkContainer>
            Already have an account? <a href="#" onClick={(e) => {
              e.preventDefault();
              openLoginModal();
            }}>Sign in</a>
          </LinkContainer>
        </ModalContent>
      </ModalOverlay>
    </PageContainer>
  );
};

export default LandingPage; 