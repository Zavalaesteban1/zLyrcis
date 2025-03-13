import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import HomePage from './pages/HomePage';
import VideoStatusPage from './pages/VideoStatusPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import SongsPage from './pages/SongsPage';
import { isAuthenticated, getCurrentUser } from './services/api';
import './app.css';

// Protected route component
interface ProtectedRouteProps {
  element: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ element }) => {
  return isAuthenticated() ? <>{element}</> : <Navigate to="/login" />;
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

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          
          {/* Protected routes */}
          <Route path="/" element={<ProtectedRoute element={<HomePage />} />} />
          <Route path="/status/:jobId" element={<ProtectedRoute element={<VideoStatusPage />} />} />
          <Route path="/profile" element={<ProtectedRoute element={<ProfilePage />} />} />
          <Route path="/songs" element={<ProtectedRoute element={<SongsPage />} />} />
          <Route path="/edit-profile" element={<ProtectedRoute element={<ProfilePage />} />} />
          <Route path="/change-password" element={<ProtectedRoute element={<ProfilePage />} />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 