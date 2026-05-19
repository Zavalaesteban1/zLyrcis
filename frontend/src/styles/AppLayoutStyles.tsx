import styled from 'styled-components';
import { NavLink } from 'react-router-dom';
import { APP_SIDEBAR_WIDTH, APP_SIDEBAR_WIDTH_MOBILE } from '../constants/layout';

export { APP_SIDEBAR_WIDTH, APP_SIDEBAR_WIDTH_MOBILE };

export const AppLayout = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  color: #333;
  max-width: 100vw;
  overflow-x: hidden;
`;

export const Sidebar = styled.aside<{ isOpen: boolean }>`
  width: ${APP_SIDEBAR_WIDTH}px;
  background-color: #1db954;
  color: #ffffff;
  padding: 20px 0 24px;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: fixed;
  top: 0;
  left: 0;
  height: 100vh;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.12);
  z-index: 100;
  transition: transform 0.3s ease;
  box-sizing: border-box;

  @media (max-width: 768px) {
    width: ${APP_SIDEBAR_WIDTH_MOBILE}px;
    transform: translateX(${props => (props.isOpen ? '0' : '-100%')});
    align-items: stretch;
    padding: 24px 0;
  }
`;

export const Logo = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  flex-shrink: 0;
  padding: 4px 0 24px;
  margin-bottom: 12px;
  color: #ffffff;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);

  svg {
    width: 40px !important;
    height: 40px !important;
  }

  @media (max-width: 768px) {
    justify-content: flex-start;
    padding: 0 24px 24px;
    margin-bottom: 16px;
  }
`;

export const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
  flex: 1;
  min-height: 0;
  padding-top: 35px;
  gap: 50px;

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
  padding-top: 28px;

  @media (max-width: 768px) {
    align-items: stretch;
    padding-top: 20px;
  }
`;

export const NavItem = styled(NavLink)`
  width: 64px;
  height: 64px;
  padding: 0;
  color: #ffffff;
  text-decoration: none;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 16px;
  transition: background-color 0.15s ease, transform 0.15s ease;
  position: relative;
  flex-shrink: 0;

  svg {
    width: 32px !important;
    height: 32px !important;
  }

  &:hover {
    background-color: rgba(255, 255, 255, 0.22);
    color: #ffffff;
    transform: scale(1.04);
  }

  &.active {
    background-color: rgba(0, 0, 0, 0.22);
    color: #ffffff;
  }

  &:hover::after {
    content: attr(data-tooltip);
    position: absolute;
    left: calc(100% + 14px);
    top: 50%;
    transform: translateY(-50%);
    background-color: rgba(0, 0, 0, 0.9);
    color: #ffffff;
    padding: 10px 14px;
    border-radius: 8px;
    white-space: nowrap;
    font-size: 14px;
    font-weight: 500;
    z-index: 1000;
    pointer-events: none;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
  }

  @media (max-width: 768px) {
    width: 100%;
    height: auto;
    min-height: 56px;
    padding: 16px 24px;
    justify-content: flex-start;
    border-radius: 0;
    gap: 16px;
    transform: none;

    &:hover {
      transform: none;
    }

    &.active {
      background-color: rgba(0, 0, 0, 0.15);
      border-left: 4px solid #ffffff;
    }

    &:hover::after {
      display: none;
    }
  }
`;

export const NavIcon = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  line-height: 1;
  flex-shrink: 0;

  svg {
    width: 32px !important;
    height: 32px !important;
  }

  @media (max-width: 768px) {
    width: 32px;
    justify-content: center;

    svg {
      width: 28px !important;
      height: 28px !important;
    }
  }
`;

export const NavText = styled.span`
  display: none;
  font-size: 17px;
  font-weight: 500;

  @media (max-width: 768px) {
    display: inline;
  }
`;

export const SidebarToggle = styled.button`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 200;
  background-color: #1db954;
  color: #ffffff;
  border: none;
  border-radius: 50%;
  width: 52px;
  height: 52px;
  display: none;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 12px rgba(0, 0, 0, 0.2);
  transition: transform 0.2s ease, background-color 0.15s ease;

  svg {
    width: 26px !important;
    height: 26px !important;
  }

  &:hover {
    transform: scale(1.05);
    background-color: #19a049;
  }

  &:active {
    transform: scale(0.95);
  }

  @media (max-width: 768px) {
    display: flex;
  }
`;

export const MobileOverlay = styled.div<{ visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.45);
  z-index: 80;
  opacity: ${props => (props.visible ? 1 : 0)};
  visibility: ${props => (props.visible ? 'visible' : 'hidden')};
  transition: opacity 0.3s ease, visibility 0.3s ease;

  @media (min-width: 769px) {
    display: none;
  }
`;
