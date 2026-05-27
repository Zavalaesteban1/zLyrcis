/**
 * AppSidebar / navigation rail tests.
 * Verifies rendering, active-route highlighting, toggle behaviour, and
 * that all nav links point to the correct routes.
 *
 * Note: <Sidebar> is a styled.aside → ARIA role is "complementary".
 *       The inner <NavMenu> is a styled.nav (role "navigation").
 */
import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import '@testing-library/jest-dom';
import { AppSidebar } from '../components/layout/AppSidebar';

// ─── Helpers ───────────────────────────────────────────────────────────────────

interface RenderOptions {
  isOpen?: boolean;
  route?: string;
}

const renderSidebar = (opts: RenderOptions = {}) => {
  const { isOpen = false, route = '/' } = opts;
  const onToggle = jest.fn();
  const onClose = jest.fn();

  const result = render(
    <MemoryRouter initialEntries={[route]}>
      <AppSidebar isOpen={isOpen} onToggle={onToggle} onClose={onClose} />
    </MemoryRouter>
  );

  return { ...result, onToggle, onClose };
};

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('AppSidebar — renders correctly', () => {
  it('renders the sidebar landmark with aria-label "Main navigation"', () => {
    renderSidebar();
    // <Sidebar> is a styled.aside → ARIA role is "complementary"
    const landmark = screen.getByRole('complementary', { name: /main navigation/i });
    expect(landmark).toBeInTheDocument();
  });

  it('renders the mobile toggle button in the DOM', () => {
    // SidebarToggle is display:none on desktop — jsdom does not process CSS media
    // queries, so we confirm the button exists via direct DOM query.
    const { container } = renderSidebar();
    const btn = container.querySelector('button[aria-label="Open menu"]');
    expect(btn).toBeInTheDocument();
  });

  it('shows "Close menu" label when sidebar is open', () => {
    const { container } = renderSidebar({ isOpen: true });
    const btn = container.querySelector('button[aria-label="Close menu"]');
    expect(btn).toBeInTheDocument();
  });
});

describe('AppSidebar — navigation links', () => {
  it('renders a Home link pointing to /', () => {
    renderSidebar();
    const links = screen.getAllByRole('link');
    const homeLink = links.find(l => l.getAttribute('href') === '/');
    expect(homeLink).toBeDefined();
  });

  it('renders a Profile link pointing to /profile', () => {
    renderSidebar();
    const links = screen.getAllByRole('link');
    const profileLink = links.find(l => l.getAttribute('href') === '/profile');
    expect(profileLink).toBeDefined();
  });

  it('renders a My Songs link pointing to /songs', () => {
    renderSidebar();
    const links = screen.getAllByRole('link');
    const songsLink = links.find(l => l.getAttribute('href') === '/songs');
    expect(songsLink).toBeDefined();
  });

  it('renders an Agent link pointing to /agent', () => {
    renderSidebar();
    const links = screen.getAllByRole('link');
    const agentLink = links.find(l => l.getAttribute('href') === '/agent');
    expect(agentLink).toBeDefined();
  });

  it('renders a Settings link pointing to /edit-profile', () => {
    renderSidebar();
    const links = screen.getAllByRole('link');
    const settingsLink = links.find(l => l.getAttribute('href') === '/edit-profile');
    expect(settingsLink).toBeDefined();
  });

  it('renders exactly 5 nav links total', () => {
    renderSidebar();
    const links = screen.getAllByRole('link');
    expect(links).toHaveLength(5);
  });
});

describe('AppSidebar — active navigation state', () => {
  it('marks Home link as active on / route', () => {
    renderSidebar({ route: '/' });
    const links = screen.getAllByRole('link');
    const homeLink = links.find(l => l.getAttribute('href') === '/');
    expect(homeLink).toHaveClass('active');
  });

  it('marks Profile link as active on /profile route', () => {
    renderSidebar({ route: '/profile' });
    const links = screen.getAllByRole('link');
    const profileLink = links.find(l => l.getAttribute('href') === '/profile');
    expect(profileLink).toHaveClass('active');
  });

  it('marks Songs link as active on /songs route', () => {
    renderSidebar({ route: '/songs' });
    const links = screen.getAllByRole('link');
    const songsLink = links.find(l => l.getAttribute('href') === '/songs');
    expect(songsLink).toHaveClass('active');
  });

  it('marks Agent link as active on /agent route', () => {
    renderSidebar({ route: '/agent' });
    const links = screen.getAllByRole('link');
    const agentLink = links.find(l => l.getAttribute('href') === '/agent');
    expect(agentLink).toHaveClass('active');
  });

  it('does NOT mark Home as active on /profile route', () => {
    renderSidebar({ route: '/profile' });
    const links = screen.getAllByRole('link');
    const homeLink = links.find(l => l.getAttribute('href') === '/');
    expect(homeLink).not.toHaveClass('active');
  });
});

describe('AppSidebar — mobile toggle behaviour', () => {
  it('calls onToggle when the toggle button is clicked', () => {
    const { container, onToggle } = renderSidebar();
    const btn = container.querySelector('button[aria-label="Open menu"]') as HTMLElement;
    expect(btn).toBeTruthy();
    fireEvent.click(btn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it('sidebar landmark is present in DOM regardless of isOpen', () => {
    renderSidebar({ isOpen: false });
    expect(screen.getByRole('complementary', { name: /main navigation/i })).toBeInTheDocument();
  });

  it('sidebar landmark remains in DOM when open', () => {
    renderSidebar({ isOpen: true });
    expect(screen.getByRole('complementary', { name: /main navigation/i })).toBeInTheDocument();
  });
});
