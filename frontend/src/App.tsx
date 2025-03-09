import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import HomePage from './pages/HomePage';
import VideoStatusPage from './pages/VideoStatusPage';
import ProfilePage from './pages/ProfilePage';
import './app.css';

function App() {
  return (
    <Router>
      <div className="App">
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/status/:jobId" element={<VideoStatusPage />} />
          <Route path="/profile" element={<ProfilePage />} />
          <Route path="/edit-profile" element={<ProfilePage />} />
          <Route path="/change-password" element={<ProfilePage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App; 