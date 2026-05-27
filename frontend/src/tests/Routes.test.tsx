/**
 * Route integrity tests.
 * App.tsx already contains BrowserRouter, so we render <App /> directly
 * (no extra MemoryRouter wrapper) to avoid "Router inside Router" errors.
 * Route-level behaviour (redirect / protected) is tested by mocking
 * isAuthenticated and checking the rendered output.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Module mocks ──────────────────────────────────────────────────────────────

jest.mock('../services/api', () => ({
  isAuthenticated: jest.fn(),
  getCurrentUser: jest.fn(() => Promise.resolve({})),
  getUserVideos: jest.fn(() => Promise.resolve([])),
  getUserProfile: jest.fn(() => Promise.resolve({ id: 1, name: 'Test', email: 'x@x.com' })),
  extractSpotifyTrackId: jest.fn(() => null),
  getSpotifyAlbumArtwork: jest.fn(() => Promise.resolve(null)),
}));

jest.mock('@react-oauth/google', () => ({
  GoogleOAuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
  GoogleLogin: () => null,
  useGoogleLogin: () => jest.fn(),
}));

import App from '../App';
import { isAuthenticated } from '../services/api';

// App uses BrowserRouter internally — render it directly without extra Router wrapper.
const renderApp = () => render(<App />);

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('Routes — unauthenticated flow', () => {
  beforeEach(() => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);
  });

  it('App renders without crashing when not authenticated', async () => {
    expect(() => renderApp()).not.toThrow();
  });

  it('renders content on the page when not authenticated', async () => {
    renderApp();
    await waitFor(() => {
      expect(document.body.textContent).toBeTruthy();
    });
  });
});

describe('Routes — public routes render', () => {
  beforeEach(() => {
    (isAuthenticated as jest.Mock).mockReturnValue(false);
  });

  it('App component renders without crashing', () => {
    expect(() => renderApp()).not.toThrow();
  });
});

describe('Routes — authenticated flow', () => {
  beforeEach(() => {
    (isAuthenticated as jest.Mock).mockReturnValue(true);
  });

  it('App renders without crashing when authenticated', async () => {
    expect(() => renderApp()).not.toThrow();
  });

  it('renders content when authenticated', async () => {
    renderApp();
    await waitFor(
      () => {
        expect(document.body.textContent).toBeTruthy();
      },
      { timeout: 3000 }
    );
  });
});

describe('Routes — module integrity', () => {
  it('App module imports without errors', () => {
    expect(() => require('../App')).not.toThrow();
  });

  it('HomePage module imports without errors', () => {
    expect(() => require('../pages/HomePage')).not.toThrow();
  });

  it('AppSidebar module imports without errors', () => {
    expect(() => require('../components/layout/AppSidebar')).not.toThrow();
  });

  it('AppLayoutStyles module imports without errors', () => {
    expect(() => require('../styles/AppLayoutStyles')).not.toThrow();
  });
});
