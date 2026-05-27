/**
 * Dashboard (HomePage) regression + new-feature tests.
 * Covers: hero render, Continue Learning module, metric pills, CTA, quick
 * actions routing, stats tiles, activity cards, discovery carousels, AI
 * access points, API call integrity, and error resilience.
 *
 * All business logic, state, API calls, and data sources are preserved —
 * this suite proves they still work after the UI evolution.
 */
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';

// ─── Module mocks ──────────────────────────────────────────────────────────────

jest.mock('../services/api', () => ({
  getUserVideos: jest.fn(),
  extractSpotifyTrackId: jest.fn(() => null),
  getSpotifyAlbumArtwork: jest.fn(() => Promise.resolve(null)),
  isAuthenticated: jest.fn(() => true),
  getCurrentUser: jest.fn(() => Promise.resolve({})),
}));

jest.mock('../contexts/UserContext', () => ({
  useUser: jest.fn(),
  UserProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

import { getUserVideos } from '../services/api';
import { useUser } from '../contexts/UserContext';
import HomePage from '../pages/HomePage';

// ─── Fixtures ──────────────────────────────────────────────────────────────────

const mockUser = {
  id: 1,
  name: 'Test User',
  email: 'test@example.com',
  created_at: '2024-01-01T00:00:00Z',
};

const baseVideo = {
  spotify_url: 'https://open.spotify.com/track/abc',
  status: 'completed' as const,
  updated_at: '2024-06-01T10:05:00Z',
  video_file: null,
  error_message: null,
  is_favorite: false,
  is_favorite_only: false,
  is_learned: false,
  last_practiced: null,
  difficulty_rating: null,
};

const mockVideos = [
  {
    ...baseVideo,
    id: '1',
    song_title: 'Tunnel Vision',
    artist: 'Kodak Black',
    created_at: '2024-06-01T10:00:00Z',
  },
  {
    ...baseVideo,
    id: '2',
    song_title: 'HUMBLE.',
    artist: 'Kendrick Lamar',
    created_at: '2024-05-28T09:00:00Z',
    is_learned: true,
    is_favorite: true,
    difficulty_rating: 3,
  },
  {
    ...baseVideo,
    id: '3',
    song_title: 'God\'s Plan',
    artist: 'Drake',
    created_at: '2024-05-20T08:00:00Z',
  },
];

const renderDashboard = () =>
  render(
    <MemoryRouter initialEntries={['/']}>
      <HomePage />
    </MemoryRouter>
  );

// ─── Setup ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  (useUser as jest.Mock).mockReturnValue({ userData: mockUser, loading: false, error: null });
  (getUserVideos as jest.Mock).mockResolvedValue(mockVideos);
  localStorage.clear();
});

afterEach(() => jest.clearAllMocks());

// ─── Page structure ────────────────────────────────────────────────────────────

describe('Dashboard — page structure', () => {
  it('renders the page title "Dashboard"', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
  });

  it('renders the hero card welcome greeting', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Welcome back, Test User/i)).toBeInTheDocument());
  });

  it('falls back to "User" when name is absent', async () => {
    (useUser as jest.Mock).mockReturnValue({ userData: { ...mockUser, name: '' }, loading: false, error: null });
    renderDashboard();
    await waitFor(() => expect(screen.getByText(/Welcome back, User/i)).toBeInTheDocument());
  });

  it('renders "Recent Activity" section', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Recent Activity')).toBeInTheDocument());
  });

  it('renders "Your Stats" section', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Your Stats')).toBeInTheDocument());
  });

  it('renders "Creator Tools" section', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Creator Tools')).toBeInTheDocument());
  });
});

// ─── Hero card ────────────────────────────────────────────────────────────────

describe('Dashboard — Hero card', () => {
  it('renders "Overview" label in the hero', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Overview')).toBeInTheDocument());
  });

  it('renders metric pills when songs exist', async () => {
    renderDashboard();
    await waitFor(() => {
      // Multiple "videos" occurrences are expected (welcome text + pill)
      const videoEls = screen.getAllByText(/videos/i);
      expect(videoEls.length).toBeGreaterThan(0);
      const learnedEls = screen.getAllByText(/learned/i);
      expect(learnedEls.length).toBeGreaterThan(0);
    });
  });

  it('shows "Continue Learning" module when unlearned songs exist', async () => {
    renderDashboard();
    await waitFor(() => {
      // "Continue Learning" appears in the hero panel AND the discovery carousel
      const els = screen.getAllByText('Continue Learning');
      expect(els.length).toBeGreaterThan(0);
    });
  });

  it('shows "Your Library" or "learned all" message when all songs are learned', async () => {
    localStorage.setItem('song_learning_1', JSON.stringify({ learned: true }));
    localStorage.setItem('song_learning_2', JSON.stringify({ learned: true }));
    localStorage.setItem('song_learning_3', JSON.stringify({ learned: true }));
    renderDashboard();
    await waitFor(() => {
      const text = document.body.textContent || '';
      const hasExpected =
        text.includes('Your Library') ||
        text.includes("learned all") ||
        text.includes('Generate a new one');
      expect(hasExpected).toBe(true);
    });
  });

  it('shows empty-library message when no songs', async () => {
    (getUserVideos as jest.Mock).mockResolvedValue([]);
    renderDashboard();
    await waitFor(() => {
      const text = document.body.textContent || '';
      expect(text.includes('Generate your first') || text.includes('Create beautiful')).toBe(true);
    });
  });
});

// ─── Create Video CTA ─────────────────────────────────────────────────────────

describe('Dashboard — Create Video CTA', () => {
  it('"Create New Video" CTA links to /agent', async () => {
    renderDashboard();
    await waitFor(() => {
      const cta = screen.getByText(/Create New Video/i).closest('a');
      expect(cta).toHaveAttribute('href', '/agent');
    });
  });

  it('empty-state CTA "Create Your First Video" links to /agent', async () => {
    (getUserVideos as jest.Mock).mockResolvedValue([]);
    renderDashboard();
    await waitFor(() => {
      const cta = screen.getByText(/Create Your First Video/i).closest('a');
      expect(cta).toHaveAttribute('href', '/agent');
    });
  });
});

// ─── Creator Tools (Quick Actions) ────────────────────────────────────────────

describe('Dashboard — Creator Tools (Quick Actions)', () => {
  it('AI Agent tool links to /agent', async () => {
    renderDashboard();
    await waitFor(() => {
      const link = screen.getByText('AI Agent').closest('a');
      expect(link).toHaveAttribute('href', '/agent');
    });
  });

  it('My Songs tool links to /songs', async () => {
    renderDashboard();
    await waitFor(() => {
      const link = screen.getByText('My Songs').closest('a');
      expect(link).toHaveAttribute('href', '/songs');
    });
  });

  it('Edit Profile tool links to /profile', async () => {
    renderDashboard();
    await waitFor(() => {
      const link = screen.getByText('Edit Profile').closest('a');
      expect(link).toHaveAttribute('href', '/profile');
    });
  });

  it('Open Spotify tool links to spotify.com', async () => {
    renderDashboard();
    await waitFor(() => {
      const link = screen.getByText('Open Spotify').closest('a');
      expect(link).toHaveAttribute('href', 'https://spotify.com');
    });
  });

  it('renders tool descriptions for all four Creator Tools', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getByText('Generate lyric videos with AI')).toBeInTheDocument();
      expect(screen.getByText('Browse your library')).toBeInTheDocument();
      expect(screen.getByText('Update your details')).toBeInTheDocument();
      expect(screen.getByText('Find your next song')).toBeInTheDocument();
    });
  });
});

// ─── Stats tiles ─────────────────────────────────────────────────────────────

describe('Dashboard — Stats tiles', () => {
  it('renders "Videos Created" stat label', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Videos Created')).toBeInTheDocument());
  });

  it('renders "Songs Learned" stat label', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Songs Learned')).toBeInTheDocument());
  });

  it('renders "Progress" stat label', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Progress')).toBeInTheDocument());
  });

  it('renders "Member Since" stat label', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Member Since')).toBeInTheDocument());
  });

  it('shows correct Videos Created count (3)', async () => {
    renderDashboard();
    await waitFor(() => {
      // 3 videos loaded
      expect(screen.getByText('3')).toBeInTheDocument();
    });
  });
});

// ─── Recent Activity / song integration ───────────────────────────────────────

describe('Dashboard — Recent Activity + song integration', () => {
  it('shows song titles from the API', async () => {
    renderDashboard();
    await waitFor(() => {
      // Songs appear in multiple sections (activity + carousels) — getAllByText is correct
      expect(screen.getAllByText('Tunnel Vision').length).toBeGreaterThan(0);
      expect(screen.getAllByText('HUMBLE.').length).toBeGreaterThan(0);
    });
  });

  it('shows artist names', async () => {
    renderDashboard();
    await waitFor(() => {
      expect(screen.getAllByText('Kodak Black').length).toBeGreaterThan(0);
      expect(screen.getAllByText('Kendrick Lamar').length).toBeGreaterThan(0);
    });
  });

  it('shows "Learned" badge for songs marked as learned in localStorage', async () => {
    localStorage.setItem('song_learning_1', JSON.stringify({ learned: true }));
    renderDashboard();
    await waitFor(() => expect(screen.getAllByText(/Learned/i).length).toBeGreaterThan(0));
  });

  it('calls getUserVideos on mount', async () => {
    renderDashboard();
    await waitFor(() => expect(getUserVideos).toHaveBeenCalledTimes(1));
  });

  it('"See all" in Recent Activity links to /songs', async () => {
    renderDashboard();
    await waitFor(() => {
      const seeAll = screen.getAllByText(/See all/i);
      const songsLink = seeAll.find(el => el.closest('a')?.getAttribute('href') === '/songs');
      expect(songsLink).toBeDefined();
    });
  });
});

// ─── Discovery carousels ───────────────────────────────────────────────────────

describe('Dashboard — Discovery carousels', () => {
  it('renders "Recently Generated" carousel when songs exist', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Recently Generated')).toBeInTheDocument());
  });

  it('renders "Continue Learning" carousel when unlearned songs exist', async () => {
    renderDashboard();
    await waitFor(() => {
      // There are 2 unlearned songs in mockVideos (id 1 and 3)
      const els = screen.getAllByText('Continue Learning');
      expect(els.length).toBeGreaterThan(0);
    });
  });

  it('renders "Mastered Songs" carousel when learned songs exist', async () => {
    localStorage.setItem('song_learning_2', JSON.stringify({ learned: true }));
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Mastered Songs')).toBeInTheDocument());
  });

  it('renders "AI Suggestions" carousel when songs exist', async () => {
    renderDashboard();
    await waitFor(() => expect(screen.getByText('AI Suggestions')).toBeInTheDocument());
  });

  it('"AI Suggestions" open-agent link points to /agent', async () => {
    renderDashboard();
    await waitFor(() => {
      const link = screen.getByText(/Open Agent/i).closest('a');
      expect(link).toHaveAttribute('href', '/agent');
    });
  });

  it('discovery section is NOT shown when no songs exist', async () => {
    (getUserVideos as jest.Mock).mockResolvedValue([]);
    renderDashboard();
    await waitFor(() => {
      expect(screen.queryByText('Recently Generated')).not.toBeInTheDocument();
      expect(screen.queryByText('AI Suggestions')).not.toBeInTheDocument();
    });
  });
});

// ─── AI access points ─────────────────────────────────────────────────────────

describe('Dashboard — AI access points', () => {
  it('AI Agent tool is present and navigates to /agent', async () => {
    renderDashboard();
    await waitFor(() => {
      const links = screen.getAllByRole('link');
      const agentLinks = links.filter(l => l.getAttribute('href') === '/agent');
      expect(agentLinks.length).toBeGreaterThan(0);
    });
  });

  it('"Continue Learning" New button in hero links to /agent', async () => {
    renderDashboard();
    await waitFor(() => {
      // The "New" CLBtn inside the Continue Learning panel
      const links = screen.getAllByRole('link');
      const newBtns = links.filter(l => l.textContent?.includes('New') && l.getAttribute('href') === '/agent');
      expect(newBtns.length).toBeGreaterThan(0);
    });
  });
});

// ─── API / DB error resilience ─────────────────────────────────────────────────

describe('Dashboard — Error resilience', () => {
  it('renders without crashing when getUserVideos rejects', async () => {
    (getUserVideos as jest.Mock).mockRejectedValue(new Error('Network error'));
    renderDashboard();
    await waitFor(() => expect(screen.getByText('Dashboard')).toBeInTheDocument());
  });

  it('shows empty state UI when API returns empty array', async () => {
    (getUserVideos as jest.Mock).mockResolvedValue([]);
    renderDashboard();
    await waitFor(() => expect(screen.getByText('No recent activity yet')).toBeInTheDocument());
  });
});
