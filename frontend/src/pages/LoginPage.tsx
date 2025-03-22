import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { login, googleLogin, LoginCredentials } from '../services/api';
import { MdMusicNote } from 'react-icons/md';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';

// Styled components
const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  background-color: white;
  background-image: linear-gradient(rgba(29, 185, 84, 0.03) 1px, transparent 1px), 
                    linear-gradient(90deg, rgba(29, 185, 84, 0.03) 1px, transparent 1px);
  background-size: 20px 20px;
  color: #333;
  overflow-x: hidden;
  padding: 40px;
`;

const Logo = styled.div`
  font-size: 42px;
  font-weight: 700;
  margin-bottom: 50px;
  display: flex;
  align-items: center;
  gap: 15px;
  color: #1DB954;
  
  @media (min-width: 1600px) {
    font-size: 48px;
    margin-bottom: 60px;
  }
  
  @media (max-width: 768px) {
    font-size: 32px;
    margin-bottom: 30px;
  }
`;

const LogoIcon = styled.span`
  display: flex;
  align-items: center;
  font-size: 48px;
  
  @media (min-width: 1600px) {
    font-size: 54px;
  }
  
  @media (max-width: 768px) {
    font-size: 36px;
  }
`;

const LoginCard = styled.div`
  background-color: white;
  border-radius: 16px;
  box-shadow: 0 8px 30px rgba(0, 0, 0, 0.1);
  width: 100%;
  max-width: 650px;
  padding: 60px 80px;
  border: 1px solid rgba(0, 0, 0, 0.05);
  
  @media (min-width: 1600px) {
    max-width: 750px;
    padding: 70px 90px;
  }
  
  @media (max-width: 768px) {
    padding: 30px;
    max-width: 100%;
    border-radius: 10px;
  }
`;

const LoginHeader = styled.div`
  margin-bottom: 50px;
  text-align: center;
  
  @media (min-width: 1600px) {
    margin-bottom: 60px;
  }
  
  @media (max-width: 768px) {
    margin-bottom: 30px;
  }
`;

const LoginTitle = styled.h2`
  font-size: 36px;
  font-weight: 600;
  color: #333;
  margin-bottom: 15px;
  
  @media (min-width: 1600px) {
    font-size: 42px;
    margin-bottom: 18px;
  }
  
  @media (max-width: 768px) {
    font-size: 28px;
    margin-bottom: 10px;
  }
`;

const LoginSubtitle = styled.p`
  color: #666;
  font-size: 20px;
  
  @media (min-width: 1600px) {
    font-size: 22px;
  }
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 28px;
  width: 100%;
  
  @media (min-width: 1600px) {
    gap: 32px;
  }
  
  @media (max-width: 768px) {
    gap: 20px;
  }
`;

const InputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Label = styled.label`
  font-size: 18px;
  margin-bottom: 12px;
  display: block;
  color: #444;
  font-weight: 500;
  
  @media (min-width: 1600px) {
    font-size: 20px;
    margin-bottom: 14px;
  }
  
  @media (max-width: 768px) {
    font-size: 14px;
    margin-bottom: 8px;
  }
`;

const Input = styled.input`
  width: 100%;
  padding: 16px 20px;
  border: 1px solid #e0e0e0;
  border-radius: 10px;
  background-color: white;
  color: #333;
  font-size: 18px;
  transition: all 0.3s ease;
  
  @media (min-width: 1600px) {
    padding: 18px 22px;
    font-size: 20px;
    border-radius: 12px;
  }
  
  @media (max-width: 768px) {
    padding: 12px 15px;
    font-size: 16px;
    border-radius: 8px;
  }
  
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
  padding: 18px;
  border: none;
  border-radius: 10px;
  background-color: #1DB954;
  color: white;
  font-size: 20px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  margin-top: 15px;
  
  @media (min-width: 1600px) {
    padding: 20px;
    font-size: 22px;
    margin-top: 20px;
    border-radius: 12px;
  }
  
  @media (max-width: 768px) {
    padding: 14px;
    font-size: 16px;
    margin-top: 5px;
    border-radius: 8px;
  }
  
  &:hover {
    background-color: #169c46;
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(29, 185, 84, 0.2);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  &:disabled {
    background-color: #a0a0a0;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
`;

const ErrorMessage = styled.div`
  background-color: rgba(233, 20, 41, 0.1);
  color: #e91429;
  padding: 16px 20px;
  border-radius: 10px;
  font-size: 18px;
  border-left: 4px solid #e91429;
  
  @media (min-width: 1600px) {
    padding: 18px 22px;
    font-size: 20px;
    border-radius: 12px;
  }
  
  @media (max-width: 768px) {
    padding: 12px 15px;
    font-size: 14px;
    border-radius: 8px;
  }
`;

const LinkContainer = styled.div`
  margin-top: 35px;
  text-align: center;
  color: #666;
  font-size: 18px;
  
  @media (min-width: 1600px) {
    margin-top: 40px;
    font-size: 20px;
  }
  
  @media (max-width: 768px) {
    margin-top: 25px;
    font-size: 14px;
  }
  
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
  width: 24px;
  height: 24px;
  border: 3px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
  
  @media (min-width: 1600px) {
    width: 28px;
    height: 28px;
    border-width: 3px;
  }
  
  @media (max-width: 768px) {
    width: 20px;
    height: 20px;
    border-width: 2px;
  }
`;

const OrDivider = styled.div`
  display: flex;
  align-items: center;
  margin: 25px 0;
  color: #666;
  
  &::before, &::after {
    content: '';
    flex: 1;
    border-bottom: 1px solid #e0e0e0;
  }
  
  span {
    margin: 0 15px;
    font-size: 16px;
  }
  
  @media (min-width: 1600px) {
    margin: 30px 0;
    span {
      margin: 0 20px;
      font-size: 18px;
    }
  }
  
  @media (max-width: 768px) {
    margin: 20px 0;
    span {
      margin: 0 10px;
      font-size: 14px;
    }
  }
`;

const GoogleLoginButton = styled.div`
  width: 100%;
  display: flex;
  justify-content: center;
  margin-bottom: 10px;
`;

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  // Google Client ID - replace with your actual client ID
  const GOOGLE_CLIENT_ID = process.env.REACT_APP_GOOGLE_CLIENT_ID || '';
  console.log('Google Client ID:', GOOGLE_CLIENT_ID); // Add this line
  
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
      
      // Extract the token_id from credentialResponse
      const { credential } = credentialResponse;
      
      if (!credential) {
        throw new Error('No credentials returned from Google');
      }
      
      // Decode the JWT to get user info (client-side only)
      const decoded: any = jwtDecode(credential);
      console.log('Google login successful:', decoded);
      
      // Send the token to your backend
      await googleLogin({ token_id: credential });
      
      // Navigate to home page
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
  
  return (
    <LoginContainer>
      <Logo>
        <LogoIcon>{MdMusicNote({ size: 48 })}</LogoIcon>
        zLyrics
      </Logo>
      
      <LoginCard>
        <LoginHeader>
          <LoginTitle>Sign In</LoginTitle>
          <LoginSubtitle>Sign in to continue creating amazing lyric videos</LoginSubtitle>
        </LoginHeader>
        
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
          Don't have an account? <Link to="/signup">Sign up</Link>
        </LinkContainer>
      </LoginCard>
    </LoginContainer>
  );
};

export default LoginPage; 