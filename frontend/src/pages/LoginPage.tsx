import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { login, googleLogin, LoginCredentials } from '../services/api';
import { MdMusicNote, MdVideoLibrary, MdLyrics, MdClose, MdBusinessCenter, MdSchool } from 'react-icons/md';
import { BsSpotify } from 'react-icons/bs';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { RiRobot2Line } from 'react-icons/ri';
import { FaGuitar, FaTicketAlt, FaHandshake } from 'react-icons/fa';

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
  background-image: linear-gradient(rgba(29, 185, 84, 0.04) 1px, transparent 1px), 
                    linear-gradient(90deg, rgba(29, 185, 84, 0.04) 1px, transparent 1px);
  background-size: 24px 24px;
  color: #1a1a1a;
  overflow-x: hidden;
  position: relative;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 48px;
  background-color: rgba(255, 255, 255, 0.7);
  backdrop-filter: blur(20px);
  -webkit-backdrop-filter: blur(20px);
  z-index: 100;
  border-bottom: 1px solid rgba(29, 185, 84, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);

  @media (max-width: 768px) {
    padding: 12px 24px;
  }
`;

const HeaderLogo = styled.div`
  font-size: 24px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 20px;
    gap: 8px;
  }
`;

const LogoIcon = styled.span`
  display: flex;
  align-items: center;
  color: #1DB954;
`;

const HeaderButtons = styled.div`
  display: flex;
  gap: 16px;
`;

const HeaderButton = styled.button`
  padding: 8px 20px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  
  @media (max-width: 768px) {
    padding: 6px 16px;
    font-size: 13px;
  }
`;

const LoginButton = styled(HeaderButton)`
  background-color: transparent;
  border: 1px solid rgba(29, 185, 84, 0.2);
  color: #1a1a1a;
  
  &:hover {
    background-color: rgba(29, 185, 84, 0.05);
    border-color: rgba(29, 185, 84, 0.3);
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const SignupButton = styled(HeaderButton)`
  background: linear-gradient(135deg, #1DB954 0%, #17a049 100%);
  border: 1px solid transparent;
  color: white;
  box-shadow: 0 2px 8px rgba(29, 185, 84, 0.2);
  
  &:hover {
    box-shadow: 0 4px 16px rgba(29, 185, 84, 0.3);
    transform: translateY(-1px);
  }
  
  &:active {
    transform: translateY(0);
  }
`;

const HeroSection = styled.section`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 140px 48px 120px;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 80px 24px 60px;
  }
`;

const HeroTitle = styled.h1`
  font-size: 72px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 20px;
  line-height: 1.1;
  letter-spacing: -0.03em;
  max-width: 900px;
  background: linear-gradient(135deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  animation: shimmer 8s ease-in-out infinite;
  
  @keyframes shimmer {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
  }
  
  @media (max-width: 768px) {
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  @media (max-width: 480px) {
    font-size: 36px;
  }
`;

const HeroSubtitle = styled.p`
  font-size: 18px;
  color: #666;
  margin-bottom: 48px;
  line-height: 1.6;
  max-width: 500px;
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 36px;
  }
`;

const PrimaryButton = styled.button`
  padding: 16px 40px;
  background: linear-gradient(135deg, #1DB954 0%, #17a049 100%);
  border: none;
  border-radius: 12px;
  color: white;
  font-size: 16px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  box-shadow: 0 4px 16px rgba(29, 185, 84, 0.25);
  position: relative;
  overflow: hidden;
  
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.2), transparent);
    transition: left 0.5s;
  }
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 8px 24px rgba(29, 185, 84, 0.35);
    
    &::before {
      left: 100%;
    }
  }
  
  &:active {
    transform: translateY(0);
  }
  
  @media (max-width: 768px) {
    padding: 14px 32px;
    font-size: 15px;
  }
`;

const FeatureSection = styled.section`
  padding: 100px 48px;
  background: transparent;
  
  @media (max-width: 768px) {
    padding: 60px 24px;
  }
`;

const SectionTitle = styled.h2`
  font-size: 48px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 80px;
  text-align: center;
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 32px;
    margin-bottom: 48px;
  }
`;

const SectionSubtitle = styled.p`
  font-size: 18px;
  color: #666;
  margin-bottom: 64px;
  text-align: center;
  max-width: 600px;
  margin-left: auto;
  margin-right: auto;
  
  @media (max-width: 768px) {
    font-size: 16px;
    margin-bottom: 40px;
  }
`;

const FeatureList = styled.div`
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 48px;
  max-width: 1100px;
  margin: 0 auto;
  
  @media (max-width: 968px) {
    grid-template-columns: 1fr;
    gap: 40px;
  }
`;

const FeatureItem = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  text-align: center;
  padding: 40px 32px;
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.5);
  backdrop-filter: blur(10px);
  border: 1px solid rgba(29, 185, 84, 0.1);
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  &:hover {
    transform: translateY(-8px);
    box-shadow: 0 16px 40px rgba(29, 185, 84, 0.12);
    border-color: rgba(29, 185, 84, 0.2);
    background: rgba(255, 255, 255, 0.8);
  }
`;

const FeatureIcon = styled.div`
  width: 64px;
  height: 64px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(29, 185, 84, 0.1) 0%, rgba(29, 185, 84, 0.05) 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32px;
  color: #1DB954;
  margin-bottom: 24px;
  transition: all 0.3s ease;
  
  ${FeatureItem}:hover & {
    transform: scale(1.1);
    background: linear-gradient(135deg, rgba(29, 185, 84, 0.15) 0%, rgba(29, 185, 84, 0.08) 100%);
  }
`;

const FeatureTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #1a1a1a;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
`;

const FeatureDescription = styled.p`
  font-size: 15px;
  color: #666;
  line-height: 1.5;
  margin: 0;
`;

const CTASection = styled.section`
  padding: 120px 48px;
  text-align: center;
  
  @media (max-width: 768px) {
    padding: 80px 24px;
  }
`;

// Modal components
const ModalOverlay = styled.div<{ isOpen: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(0, 0, 0, 0.4);
  display: ${props => props.isOpen ? 'flex' : 'none'};
  justify-content: center;
  align-items: center;
  z-index: 1000;
  backdrop-filter: blur(12px);
  animation: ${props => props.isOpen ? 'fadeIn 0.2s ease-out' : 'none'};
  
  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
`;

const ModalContent = styled.div`
  background-color: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.15);
  width: 100%;
  max-width: 480px;
  padding: 48px;
  position: relative;
  border: 1px solid rgba(29, 185, 84, 0.1);
  animation: slideUp 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  
  @keyframes slideUp {
    from {
      opacity: 0;
      transform: translateY(20px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 768px) {
    padding: 32px;
    width: 90%;
  }
`;

const ModalCloseButton = styled.button`
  position: absolute;
  top: 20px;
  right: 20px;
  background: rgba(0, 0, 0, 0.05);
  border: none;
  font-size: 20px;
  cursor: pointer;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 8px;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(0, 0, 0, 0.08);
    color: #1a1a1a;
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const ModalTitle = styled.h2`
  font-size: 24px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
  text-align: center;
  letter-spacing: -0.01em;
  
  @media (max-width: 768px) {
    font-size: 22px;
  }
`;

const ModalSubtitle = styled.p`
  color: #666;
  font-size: 14px;
  text-align: center;
  margin-bottom: 32px;
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
  font-size: 14px;
  margin-bottom: 8px;
  display: block;
  color: #1a1a1a;
  font-weight: 600;
`;

const Input = styled.input`
  width: 100%;
  padding: 12px 14px;
  border: 1.5px solid #e8e8e8;
  border-radius: 10px;
  background-color: #fafafa;
  color: #1a1a1a;
  font-size: 15px;
  transition: all 0.2s ease;
  
  &:focus {
    outline: none;
    border-color: #1DB954;
    background-color: white;
    box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.08);
  }
  
  &::placeholder {
    color: #999;
  }
`;

const Button = styled.button`
  width: 50%;
  box-sizing: border-box;
  padding: 13px;
  border: none;
  border-radius: 10px;
  background: linear-gradient(135deg, #1DB954 0%, #17a049 100%);
  color: white;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  margin: 8px auto 0;
  box-shadow: 0 2px 8px rgba(29, 185, 84, 0.2);
  
  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(29, 185, 84, 0.3);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #a0a0a0;
    cursor: not-allowed;
    transform: none;
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
  background: transparent;
  padding: 40px 48px;
  text-align: center;
  color: #999;
  font-size: 14px;
  border-top: 1px solid rgba(29, 185, 84, 0.1);
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
        <HeroTitle>Music Ai Simple.</HeroTitle>
        <HeroSubtitle>
        Generate lyric videos with Ai. Learn.
        </HeroSubtitle>
        <PrimaryButton onClick={openSignupModal}>Get Started</PrimaryButton>
      </HeroSection>
      
      {/* Features section */}
      <FeatureSection>
        <SectionTitle>Features</SectionTitle>
        
        <FeatureList>
          <FeatureItem>
            <FeatureIcon>{RiRobot2Line({ size: 32 })}</FeatureIcon>
            <FeatureTitle>AI Chat Agent</FeatureTitle>
            <FeatureDescription>
              Request songs, customize videos
            </FeatureDescription>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureIcon>{MdVideoLibrary({ size: 32 })}</FeatureIcon>
            <FeatureTitle>Video Generation</FeatureTitle>
            <FeatureDescription>
              Create custom lyric videos instantly
            </FeatureDescription>
          </FeatureItem>
          
          <FeatureItem>
            <FeatureIcon>{MdLyrics({ size: 32 })}</FeatureIcon>
            <FeatureTitle>Learn Lyrics</FeatureTitle>
            <FeatureDescription>
              Build a collection to practice
            </FeatureDescription>
          </FeatureItem>
        </FeatureList>
      </FeatureSection>
      
      {/* Call to action section */}
      <CTASection>
        <SectionTitle>Start creating lyric videos</SectionTitle>
        <PrimaryButton onClick={openSignupModal}>Get Started</PrimaryButton>
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
          <ModalSubtitle>Sign in to continue</ModalSubtitle>
          
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
          
          <ModalTitle>Get Started</ModalTitle>
          <ModalSubtitle>Create your account</ModalSubtitle>
          
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