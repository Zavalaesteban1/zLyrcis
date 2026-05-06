import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login, googleLogin, LoginCredentials } from '../services/api';
import { MdMusicNote, MdVideoLibrary, MdLyrics, MdClose } from 'react-icons/md';
import { GoogleOAuthProvider, GoogleLogin } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import { RiRobot2Line } from 'react-icons/ri';
import '../styles/LoginPage.css';

const LoginPage: React.FC = () => {
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);
  const [isSignupModalOpen, setIsSignupModalOpen] = useState(false);
  const [credentials, setCredentials] = useState<LoginCredentials>({
    username: '',
    password: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  
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
    <div className="login-page-container">
      {/* Header */}
      <header className="login-header">
        <div className="header-content">
          <div className="header-logo">
            <div className="logo-icon">
              {MdMusicNote({ size: 28, color: '#1DB954' })}
            </div>
            zLyrics
          </div>
          
          <div className="header-buttons">
            <button className="header-button login-button" onClick={openLoginModal}>
              Log In
            </button>
            <button className="header-button signup-button" onClick={openSignupModal}>
              Sign Up
            </button>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-decorative-blur" />

        <h1 className="hero-title">
          Create Lyric Videos <br />
          <span className="hero-title-italic">In Minutes.</span>
        </h1>

        <p className="hero-subtitle">
          Generate lyric videos with Ai. Learn music.
        </p>

        <button className="primary-button" onClick={openSignupModal}>
          <span>Start Generating</span>
          <span className="primary-button-arrow">→</span>
        </button>
      </section>
      
      {/* Features Section */}
      <section className="features-section">
        <div className="features-header">
          <div>
            <h2 className="section-title">
              Less Noise. <span className="hero-title-italic">More Signal.</span>
            </h2>
            <p className="section-subtitle">
              Our visual engine handles the heavy lifting, giving you more time to focus on the creative direction.
            </p>
          </div>
        </div>

        <div className="feature-grid">
          {/* Feature 1: AI Chat Agent */}
          <div className="feature-card">
            <div className="feature-corner-tl" />
            <div className="feature-corner-tr" />
            
            <div className="feature-visual">
              <div className="visual-mockup chat-mockup">
                <div className="scanning-line" />
                <div className="chat-prompt">
                  <span className="prompt-icon">▶</span>
                  <span className="prompt-text">"Create a lyric video for Breathe in the air by Pink Floyd"</span>
                </div>
                <div className="ai-generating">
                  <div className="generating-text">
                    <span className="generating-icon">{RiRobot2Line({ size: 20, color: '#1DB954' })}</span>
                    <span>AI Generating</span>
                    <div className="dot-animation">
                      <span className="dot">.</span>
                      <span className="dot">.</span>
                      <span className="dot">.</span>
                    </div>
                  </div>
                  <div className="progress-bar">
                    <div className="progress-fill"></div>
                  </div>
                  <div className="generating-steps">
                    <div className="step completed">✓ Analyzing lyrics</div>
                    <div className="step active">⟳ Syncing timestamps</div>
                    <div className="step">○ Rendering video</div>
                  </div>
                </div>
              </div>
            </div>

            <div className="feature-content">
              <div className="feature-info">
                <div className="feature-icon-container">
                  {RiRobot2Line({ size: 16, color: '#1DB954' })}
                </div>
                <h3 className="feature-title">AI Chat Agent</h3>
              </div>
              
              <div className="feature-meta">
                <div className="feature-indicator" />
              </div>
            </div>
          </div>

          {/* Feature 2: Lyric Sync */}
          <div className="feature-card">
            <div className="feature-corner-tl" />
            <div className="feature-corner-tr" />
            
            <div className="feature-visual">
              <div className="visual-mockup lyric-sync-mockup">
                <div className="scanning-line" />
                <div className="lyric-sync-container">
                  <div className="lyric-line">
                    <span className="timestamp">00:12</span>
                    <span className="lyric-text">One carat drip down my fang</span>
                  </div>
                  <div className="lyric-line active">
                    <span className="timestamp">00:15</span>
                    <span className="lyric-text highlighted">Drugs runnin' deep through my vein</span>
                  </div>
                  <div className="lyric-line">
                    <span className="timestamp">00:18</span>
                    <span className="lyric-text">I'm takin' drugs, healin' the pain</span>
                  </div>
                  <div className="lyric-line">
                    <span className="timestamp">00:21</span>
                    <span className="lyric-text">Let the paint drip on my main</span>
                  </div>
                  <div className="lyric-line">
                    <span className="timestamp">00:24</span>
                    <span className="lyric-text">Let the paint drip, me and Wave</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="feature-content">
              <div className="feature-info">
                <div className="feature-icon-container">
                  {MdLyrics({ size: 16, color: '#1DB954' })}
                </div>
                <h3 className="feature-title">Lyric Sync</h3>
              </div>
              
              <div className="feature-meta">
                <div className="feature-indicator" />
              </div>
            </div>
          </div>

          {/* Feature 3: Video Library */}
          <div className="feature-card">
            <div className="feature-corner-tl" />
            <div className="feature-corner-tr" />
            
            <div className="feature-visual">
              <div className="visual-mockup library-mockup library-video-mockup">
                <div className="scanning-line" />
                <video 
                  className="library-video"
                  autoPlay 
                  loop 
                  muted 
                  playsInline
                >
                  <source src="/assets/zLyricsSongLibrary.mov" type="video/quicktime" />
                  <source src="/assets/zLyricsSongLibrary.mov" type="video/mp4" />
                  Your browser does not support the video tag.
                </video>
              </div>
            </div>

            <div className="feature-content">
              <div className="feature-info">
                <div className="feature-icon-container">
                  {MdVideoLibrary({ size: 16, color: '#1DB954' })}
                </div>
                <h3 className="feature-title">Video Library</h3>
              </div>
              
              <div className="feature-meta">
                <div className="feature-indicator" />
              </div>
            </div>
          </div>
        </div>
      </section>
      
      {/* CTA Section */}
      <section className="cta-section">
        <div className="cta-content-centered">
          <h2 className="cta-title">
            Elevate your music <span className="hero-title-italic">learning</span>
          </h2>
          <button className="cta-button" onClick={openSignupModal}>
            GET STARTED NOW
          </button>
        </div>
      </section>
      
      {/* Footer */}
      <footer className="footer">
        <p>© 2025 zLyrics // All rights reserved // Made for creators</p>
      </footer>
      
      {/* Login Modal */}
      {isLoginModalOpen && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={closeModals}>
              {MdClose({ size: 24 })}
            </button>
            
            <h2 className="modal-title">Welcome Back</h2>
            <p className="modal-subtitle">Sign in to continue</p>
            
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <div className="google-login-container">
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
              </div>
            </GoogleOAuthProvider>
            
            <div className="or-divider">
              <span>OR</span>
            </div>
            
            <form className="login-form" onSubmit={handleSubmit}>
              <div className="input-container">
                <label htmlFor="username" className="input-label">Username</label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  placeholder="Enter your username"
                  value={credentials.username}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="input-field"
                />
              </div>
              
              <div className="input-container">
                <label htmlFor="password" className="input-label">Password</label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  placeholder="Enter your password"
                  value={credentials.password}
                  onChange={handleChange}
                  disabled={isLoading}
                  className="input-field"
                />
              </div>
              
              <button type="submit" disabled={isLoading} className="submit-button">
                {isLoading ? (
                  <>
                    Signing In
                    <div className="loading-spinner" />
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
              
              {error && <div className="error-message">{error}</div>}
            </form>
            
            <div className="link-container">
              Don't have an account?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  openSignupModal();
                }}
              >
                Sign up
              </a>
            </div>
          </div>
        </div>
      )}
      
      {/* Signup Modal */}
      {isSignupModalOpen && (
        <div className="modal-overlay" onClick={closeModals}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close-button" onClick={closeModals}>
              {MdClose({ size: 24 })}
            </button>
            
            <h2 className="modal-title">Get Started</h2>
            <p className="modal-subtitle">Create your account</p>
            
            <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
              <div className="google-login-container">
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
              </div>
            </GoogleOAuthProvider>
            
            <div className="or-divider">
              <span>OR</span>
            </div>
            
            <button className="submit-button" onClick={() => navigate('/signup')}>
              Continue with Email
            </button>
            
            <div className="link-container">
              Already have an account?{' '}
              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  openLoginModal();
                }}
              >
                Sign in
              </a>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LoginPage;
