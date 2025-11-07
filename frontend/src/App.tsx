import React, { useEffect, useState, useRef } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation, useNavigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SongsPage from './pages/SongsPage';
import CreateVideoPage from './pages/CreateVideoPage';
import AgentPage from './pages/AgentPage';
import { isAuthenticated, getCurrentUser } from './services/api';
import './app.css';

// Protected route component
interface ProtectedRouteProps {
  element: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  return isAuthenticated() ? <>{element}</> : <Navigate to="/login" />;
};

// Page transition wrapper component
const PageTransitionWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isActive, setIsActive] = useState(false);
  
  useEffect(() => {
    // Small delay to ensure smooth transitions
    const timer = setTimeout(() => {
      setIsActive(true);
    }, 50);
    
    // Clean up function for when component unmounts
    return () => {
      clearTimeout(timer);
      setIsActive(false);
    };
  }, []);
  
  return (
    <div className={`page-transition ${isActive ? 'active' : ''}`}>
      {children}
    </div>
  );
};

// Apply the transition wrapper to routes
const TransitionRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  return <PageTransitionWrapper>{element}</PageTransitionWrapper>;
};

function App() {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is authenticated on app load
    const checkAuth = async () => {
      if (isAuthenticated()) {
        try {
          await getCurrentUser();
        } catch (error) {
          // Token is invalid, do nothing (user will be redirected to login)
        }
      }
      setLoading(false);
    };

    checkAuth();
  }, []);

  return (
    <Router>
      <div className="App">
        {loading ? (
          <div className="silent-loading"></div>
        ) : (
          <Routes>
            {/* Public routes */}
            <Route path="/login" element={<TransitionRoute element={<LoginPage />} />} />
            <Route path="/signup" element={<TransitionRoute element={<SignupPage />} />} />
            
            {/* Protected routes */}
            <Route path="/" element={<ProtectedRoute element={<TransitionRoute element={<HomePage />} />} />} />
            <Route path="/profile" element={<ProtectedRoute element={<TransitionRoute element={<ProfilePage />} />} />} />
            <Route path="/songs" element={<ProtectedRoute element={<TransitionRoute element={<SongsPage />} />} />} />
            <Route path="/create" element={<ProtectedRoute element={<TransitionRoute element={<CreateVideoPage />} />} />} />
            <Route path="/agent" element={<ProtectedRoute element={<TransitionRoute element={<AgentPage />} />} />} />
            <Route path="/edit-profile" element={<ProtectedRoute element={<TransitionRoute element={<ProfilePage />} />} />} />
            <Route path="/change-password" element={<ProtectedRoute element={<TransitionRoute element={<ProfilePage />} />} />} />
          </Routes>
        )}
      </div>
    </Router>
  );
}

export default App; 