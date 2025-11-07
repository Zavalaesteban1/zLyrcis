import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css'; // Optional: if you have global styles
import App from './App';

const container = document.getElementById('root');
if (!container) throw new Error('Failed to find the root element');
const root = createRoot(container);

root.render(
  // Temporarily commenting out StrictMode to reduce development renders
  // <React.StrictMode>
    <App />
  // </React.StrictMode>
);
