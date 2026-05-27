import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { APP_SIDEBAR_WIDTH, APP_SIDEBAR_WIDTH_MOBILE } from '../constants/layout';

export { APP_SIDEBAR_WIDTH, APP_SIDEBAR_WIDTH_MOBILE };

// ─── Layout shell ────────────────────────────────────────────────────────────

export const AppLayout = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #eef1f6;
  color: #333;
  max-width: 100vw;
  overflow-x: hidden;
`;

// ─── Floating dark rail ───────────────────────────────────────────────────────
// Desktop: a rounded charcoal pill anchored 12 px from the left edge.
// The rail is 84 px wide; the main content uses margin-left: 108 px, giving a
// comfortable 12 px breathing gap between rail and content.

export const Sidebar = styled.aside<{ isOpen: boolean }>`
  width: 84px;
  background-color: #1a1e23;
  color: rgba(255, 255, 255, 0.45);
  padding: 20px 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: fixed;
  top: 16px;
  left: 12px;
  height: calc(100vh - 32px);
  border-radius: 18px;
  box-shadow:
    0 8px 40px rgba(0, 0, 0, 0.32),
    0 2px 8px rgba(0, 0, 0, 0.18);
  z-index: 100;
  transition: transform 0.3s ease;
  box-sizing: border-box;
  overflow: hidden;

  @media (max-width: 768px) {
    /* On mobile: full-height left drawer (no border-radius) */
    width: ${APP_SIDEBAR_WIDTH_MOBILE}px;
    top: 0;
    left: 0;
    height: 100vh;
    border-radius: 0;
    transform: translateX(${props => (props.isOpen ? '0' : '-100%')});
    align-items: stretch;
    padding: 24px 0;
  }
`;

// ─── Logo area ─────────────────────────────────────────────────────────────────

export const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex-shrink: 0;
  padding: 4px 0 20px;
  margin-bottom: 8px;
  color: #1db954;
  border-bottom: 1px solid rgba(255, 255, 255, 0.07);

  svg {
    width: 32px !important;
    height: 32px !important;
  }

  @media (max-width: 768px) {
    justify-content: flex-start;
    padding: 0 24px 24px;
    margin-bottom: 16px;
  }
`;

// ─── Nav menu / footer ────────────────────────────────────────────────────────

export const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  flex: 1;
  min-height: 0;
  padding-top: 28px;
  gap: 6px;

  @media (max-width: 768px) {
    align-items: stretch;
    gap: 4px;
    padding-top: 0;
  }
`;

export const NavFooter = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  flex-shrink: 0;
  margin-top: auto;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.07);

  @media (max-width: 768px) {
    align-items: stretch;
    padding-top: 20px;
  }
`;

// ─── Individual nav item ───────────────────────────────────────────────────────

export const NavItem = styled(NavLink)`
  width: 52px;
  height: 52px;
  padding: 0;
  color: rgba(255, 255, 255, 0.45);
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 14px;
  transition:
    background-color 0.18s ease,
    color 0.18s ease,
    box-shadow 0.18s ease,
    transform 0.15s ease;
  position: relative;
  flex-shrink: 0;

  svg {
    width: 22px !important;
    height: 22px !important;
  }

  /* Hover — subtle lift + slightly brighter icon */
  &:hover {
    background-color: rgba(255, 255, 255, 0.09);
    color: rgba(255, 255, 255, 0.82);
    transform: scale(1.06);
  }

  /* Active route — soft green-tinted rounded-square with glow */
  &.active {
    background-color: rgba(29, 185, 84, 0.16);
    color: #1db954;
    box-shadow:
      0 0 0 1px rgba(29, 185, 84, 0.18),
      0 4px 18px rgba(29, 185, 84, 0.18);
  }

  /* CSS tooltip shown on desktop hover */
  &:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    left: calc(100% + 14px);
    top: 50%;
    transform: translateY(-50%);
    background-color: #1a1e23;
    color: rgba(255, 255, 255, 0.92);
    padding: 8px 12px;
    border-radius: 8px;
    white-space: nowrap;
    font-size: 13px;
    font-weight: 500;
    z-index: 1000;
    pointer-events: none;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.28);
    border: 1px solid rgba(255, 255, 255, 0.07);
  }

  /* Mobile: full-width row */
  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    min-height: 52px;
    padding: 14px 24px;
    justify-content: flex-start;
    border-radius: 0;
    gap: 16px;
    transform: none;

    &:hover {
      transform: none;
      background-color: rgba(255, 255, 255, 0.07);
    }

    &.active {
      background-color: rgba(29, 185, 84, 0.14);
      border-left: 3px solid #1db954;
      color: #1db954;
      box-shadow: none;
    }

    &:hover::after {
      display: none;
    }
  }
`;

// ─── Icon / text wrappers ─────────────────────────────────────────────────────

export const NavIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  flex-shrink: 0;

  svg {
    width: 22px !important;
    height: 22px !important;
  }

  @media (max-width: 768px) {
    width: 28px;
    justify-content: center;

    svg {
      width: 22px !important;
      height: 22px !important;
    }
  }
`;

export const NavText = styled.span`
  display: none;
  font-size: 15px;
  font-weight: 500;

  @media (max-width: 768px) {
    display: inline;
  }
`;

// ─── Mobile FAB toggle ─────────────────────────────────────────────────────────

export const SidebarToggle = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 200;
  background-color: #1a1e23;
  color: #1db954;
  border: none;
  border-radius: 50%;
  width: 52px;
  height: 52px;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow:
    0 4px 20px rgba(0, 0, 0, 0.3),
    0 0 0 1px rgba(29, 185, 84, 0.2);
  transition: transform 0.2s ease, background-color 0.15s ease;

  svg {
    width: 24px !important;
    height: 24px !important;
  }

  &:hover {
    transform: scale(1.07);
    background-color: #222830;
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

// ─── Mobile backdrop ──────────────────────────────────────────────────────────

export const MobileOverlay = styled.div<{ visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.55);
  z-index: 80;
  opacity: ${props => (props.visible ? 1 : 0)};
  visibility: ${props => (props.visible ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease, visibility 0.3s ease;

  @media (min-width: 769px) {
    display: none;
  }
`;
