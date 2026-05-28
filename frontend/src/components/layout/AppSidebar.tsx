import React from 'react';
import { CgProfile } from 'react-icons/cg';
import { IoSettingsOutline } from 'react-icons/io5';
import { MdClose, MdMenu, MdMusicNote } from 'react-icons/md';
import { AppLogo } from '../common/AppLogo';
import { IconAgentOrbit } from '../icons/IconAgentOrbit';
import { IconAgentHeadphone } from '../icons/IconAgentHeadphone';
import { ROUTES } from '../../constants/routes';
import {
  Sidebar,
  Logo,
  NavMenu,
  NavFooter,
  NavItem,
  NavIcon,
  NavText,
  SidebarToggle,
  MobileOverlay,
} from '../../styles/AppLayoutStyles';

/** Icon pixel size passed to react-icons (also enforced via CSS on svg). */
const NAV_ICON_SIZE = 32;

export interface AppSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  onClose: () => void;
  /** Override overlay visibility (e.g. Agent page also opens chat sidebar). */
  overlayVisible?: boolean;
  onOverlayClick?: () => void;
}

/**
 * Global app navigation rail (Agent, Songs, Profile, Learning).
 * Uses react-router NavLink for active route highlighting.
 */
export const AppSidebar: React.FC<AppSidebarProps> = ({
  isOpen,
  onToggle,
  onClose,
  overlayVisible,
  onOverlayClick,
}) => {
  const showOverlay = overlayVisible ?? isOpen;
  return (
    <>
      <Sidebar isOpen={isOpen} aria-label="Main navigation">
        <Logo>
          <AppLogo size={40} />
        </Logo>

        <NavMenu>
          <NavItem to={ROUTES.agent} end data-tooltip="AI Agent">
            <NavIcon>
              <IconAgentOrbit size={NAV_ICON_SIZE} />
            </NavIcon>
            <NavText>Agent</NavText>
          </NavItem>
          <NavItem to={ROUTES.songs} data-tooltip="My Songs">
            <NavIcon>{MdMusicNote({ size: NAV_ICON_SIZE })}</NavIcon>
            <NavText>My Songs</NavText>
          </NavItem>
          <NavItem to={ROUTES.profile} data-tooltip="Profile">
            <NavIcon>{CgProfile({ size: NAV_ICON_SIZE })}</NavIcon>
            <NavText>Profile</NavText>
          </NavItem>
          <NavItem to={ROUTES.dashboard} data-tooltip="Learning">
            <NavIcon>
              <IconAgentHeadphone size={NAV_ICON_SIZE} />
            </NavIcon>
            <NavText>Learning</NavText>
          </NavItem>
        </NavMenu>

        <NavFooter>
          <NavItem to={ROUTES.editProfile} data-tooltip="Settings">
            <NavIcon>{IoSettingsOutline({ size: NAV_ICON_SIZE })}</NavIcon>
            <NavText>Settings</NavText>
          </NavItem>
        </NavFooter>
      </Sidebar>

      <SidebarToggle type="button" onClick={onToggle} aria-label={isOpen ? 'Close menu' : 'Open menu'}>
        {isOpen ? MdClose({ size: 24 }) : MdMenu({ size: 24 })}
      </SidebarToggle>

      <MobileOverlay
        visible={showOverlay}
        onClick={onOverlayClick ?? onClose}
        aria-hidden={!showOverlay}
      />
    </>
  );
};
