import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled, { keyframes } from 'styled-components';
import { login, LoginCredentials } from '../services/api';

// Define animations
const gradientAnimation = keyframes`
  0% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
  100% { background-position: 0% 50%; }
`;

// Styled components
const LoginContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  padding: 2rem;
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

const LoginCard = styled.div`
  background: rgba(18, 18, 18, 0.95);
  backdrop-filter: blur(10px);
  border-radius: 20px;
  width: 90%;
  max-width: 500px;
  box-shadow: 0 8px 32px 0 rgba(0, 0, 0, 0.37);
  overflow: hidden;
  padding: 3rem;
  
  @media (max-width: 768px) {
    padding: 2rem;
    width: 95%;
  }
`;

const LoginHeader = styled.div`
  margin-bottom: 2rem;
  text-align: center;
`;

const LoginTitle = styled.h1`
  font-size: 2.5rem;
  margin-bottom: 1rem;
  background: linear-gradient(to right, #1DB954, #1ed760);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  font-weight: 800;
`;

const LoginSubtitle = styled.p`
  color: #b3b3b3;
  margin-bottom: 1rem;
`;

const Form = styled.form`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  width: 100%;
`;

const InputContainer = styled.div`
  position: relative;
  width: 100%;
`;

const Label = styled.label`
  font-size: 0.9rem;
  margin-bottom: 0.5rem;
  display: block;
  color: #b3b3b3;
`;

const Input = styled.input`
  width: 100%;
  padding: 1rem 1.5rem;
  border: 2px solid transparent;
  border-radius: 12px;
  background-color: #282828;
  color: white;
  font-size: 1rem;
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
`;

const Button = styled.button`
  padding: 1rem 1.5rem;
  border: none;
  border-radius: 12px;
  background: linear-gradient(45deg, #1DB954, #1ed760);
  color: white;
  font-size: 1rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
  overflow: hidden;
  margin-top: 0.5rem;
  
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
`;

const ErrorMessage = styled.div`
  background-color: rgba(255, 82, 82, 0.1);
  color: #ff5252;
  padding: 1rem;
  border-radius: 8px;
  border-left: 4px solid #ff5252;
  font-size: 0.9rem;
  margin-top: 1rem;
`;

const LinkContainer = styled.div`
  margin-top: 1.5rem;
  text-align: center;
  color: #b3b3b3;
  font-size: 0.9rem;
  
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
  width: 1.2rem;
  height: 1.2rem;
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  border-top-color: white;
  animation: spin 1s ease-in-out infinite;
  margin-left: 8px;

  @keyframes spin {
    to { transform: rotate(360deg); }
  }
`;

const LoginPage: React.FC = () => {
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
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
  
  return (
    <LoginContainer>
      <LoginCard>
        <LoginHeader>
          <LoginTitle>Welcome Back</LoginTitle>
          <LoginSubtitle>Sign in to continue creating amazing lyric videos</LoginSubtitle>
        </LoginHeader>
        
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