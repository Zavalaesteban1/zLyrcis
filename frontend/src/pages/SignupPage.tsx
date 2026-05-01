import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import styled from 'styled-components';
import { signup, SignupCredentials } from '../services/api';
import { MdMusicNote } from 'react-icons/md';

// Define interface for form data
interface SignupFormData extends SignupCredentials {
  confirmPassword: string;
}

// Styled components
const SignupContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 100vh;
  width: 100%;
  max-width: 100vw;
  background-color: white;
  background-image: linear-gradient(rgba(29, 185, 84, 0.04) 1px, transparent 1px), 
                    linear-gradient(90deg, rgba(29, 185, 84, 0.04) 1px, transparent 1px);
  background-size: 24px 24px;
  color: #1a1a1a;
  overflow-x: hidden;
  padding: 40px;
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  margin-bottom: 40px;
  display: flex;
  align-items: center;
  gap: 10px;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  
  @media (max-width: 768px) {
    font-size: 20px;
    margin-bottom: 24px;
  }
`;

const LogoIcon = styled.span`
  display: flex;
  align-items: center;
  color: #1DB954;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const SignupCard = styled.div`
  background-color: white;
  border-radius: 20px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.08);
  width: 100%;
  max-width: 480px;
  padding: 48px;
  border: 1px solid rgba(29, 185, 84, 0.1);
  
  @media (max-width: 768px) {
    padding: 32px;
    max-width: 100%;
    border-radius: 16px;
  }
`;

const SignupHeader = styled.div`
  margin-bottom: 40px;
  text-align: center;
`;

const SignupTitle = styled.h2`
  font-size: 28px;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 8px;
  letter-spacing: -0.01em;
  
  @media (max-width: 768px) {
    font-size: 24px;
  }
`;

const SignupSubtitle = styled.p`
  color: #666;
  font-size: 15px;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

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
  margin-top: 8px;
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
  border-left: 3px solid #e91429;
`;

const LinkContainer = styled.div`
  margin-top: 32px;
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

const SignupPage: React.FC = () => {
  const [formData, setFormData] = useState<SignupFormData>({
    username: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev: SignupFormData) => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate form
    if (!formData.username || !formData.email || !formData.password || !formData.confirmPassword) {
      setError('All fields are required');
      return;
    }
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Extract the credentials without confirmPassword
      const { confirmPassword, ...credentials } = formData;
      await signup(credentials);
      navigate('/login');
    } catch (err: any) {
      const errorMessage = err.response?.data?.error || 'Signup failed. Please try again.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  return (
    <SignupContainer>
      <Logo>
        <LogoIcon>{MdMusicNote({ size: 24 })}</LogoIcon>
        zLyrics
      </Logo>
      
      <SignupCard>
        <SignupHeader>
          <SignupTitle>Create Account</SignupTitle>
          <SignupSubtitle>Get started in seconds</SignupSubtitle>
        </SignupHeader>
        
        <Form onSubmit={handleSubmit}>
          <InputContainer>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              name="username"
              type="text"
              placeholder="Choose a username"
              value={formData.username}
              onChange={handleChange}
              disabled={isLoading}
            />
          </InputContainer>
          
          <InputContainer>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              name="email"
              type="email"
              placeholder="Enter your email"
              value={formData.email}
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
              placeholder="Create a password"
              value={formData.password}
              onChange={handleChange}
              disabled={isLoading}
            />
          </InputContainer>
          
          <InputContainer>
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              placeholder="Confirm your password"
              value={formData.confirmPassword}
              onChange={handleChange}
              disabled={isLoading}
            />
          </InputContainer>
          
          <Button type="submit" disabled={isLoading}>
            {isLoading ? (
              <>
                Creating Account
                <LoadingSpinner />
              </>
            ) : (
              'Sign Up'
            )}
          </Button>
          
          {error && <ErrorMessage>{error}</ErrorMessage>}
        </Form>
        
        <LinkContainer>
          Already have an account? <Link to="/login">Sign in</Link>
        </LinkContainer>
      </SignupCard>
    </SignupContainer>
  );
};

export default SignupPage; 