import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { FiLogOut } from 'react-icons/fi';
import { CgProfile } from 'react-icons/cg';
import { logout } from '../../services/api';

interface ProfileDropdownProps {
  userData: {
    name: string;
    email?: string;
    profile_picture?: string | null;
  } | null;
}

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

const DropdownContainer = styled.div`
  position: relative;
  display: inline-block;
`;

const ProfileTrigger = styled.button<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  background: transparent;
  border: none;
  cursor: pointer;
  padding: 4px 8px;
  border-radius: 24px;
  transition: all 0.2s ease;

  &:hover {
    background-color: #f0f0f0;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const ProfileImage = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #1DB954;
`;

const ArrowIcon = styled.span<{ $isOpen: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  font-size: 24px;
  transition: transform 0.2s ease;
  transform: rotate(${props => props.$isOpen ? '180deg' : '0deg'});
`;

const DropdownMenu = styled.div<{ $isOpen: boolean }>`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 320px;
  background: white;
  border-radius: 16px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.12);
  padding: 16px 0;
  z-index: 1000;
  opacity: ${props => props.$isOpen ? '1' : '0'};
  visibility: ${props => props.$isOpen ? 'visible' : 'hidden'};
  transform: ${props => props.$isOpen ? 'translateY(0)' : 'translateY(-10px)'};
  transition: all 0.2s ease;
  animation: ${props => props.$isOpen ? fadeIn : 'none'} 0.2s ease;
`;

const MenuSection = styled.div`
  padding: 8px 0;
  border-bottom: 1px solid #e9e9e9;

  &:last-child {
    border-bottom: none;
  }
`;

const SectionLabel = styled.div`
  font-size: 12px;
  font-weight: 600;
  color: #666;
  padding: 8px 16px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
`;

const ProfileCard = styled.div<{ $selected?: boolean }>`
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  cursor: pointer;
  transition: background-color 0.15s ease;
  background-color: ${props => props.$selected ? '#f0f0f0' : 'transparent'};
  border-radius: 8px;
  margin: 0 8px;
  position: relative;

  &:hover {
    background-color: #f0f0f0;
  }
`;

const ProfileCardImage = styled.img`
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
  flex-shrink: 0;
`;

const ProfileCardInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const ProfileCardName = styled.div`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin-bottom: 2px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const ProfileCardLabel = styled.div`
  font-size: 13px;
  color: #666;
  margin-bottom: 2px;
`;

const ProfileCardEmail = styled.div`
  font-size: 13px;
  color: #999;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
`;

const CheckmarkIcon = styled.div`
  width: 20px;
  height: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1DB954;
  font-size: 20px;
  flex-shrink: 0;
`;

const MenuItem = styled.button`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 12px 16px;
  background: transparent;
  border: none;
  cursor: pointer;
  font-size: 15px;
  font-weight: 500;
  color: #333;
  text-align: left;
  transition: background-color 0.15s ease;

  &:hover {
    background-color: #f0f0f0;
  }

  &:active {
    transform: scale(0.98);
  }
`;

const MenuItemIcon = styled.span`
  font-size: 20px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  width: 24px;
`;

export const ProfileDropdown: React.FC<ProfileDropdownProps> = ({ userData }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
      // Force logout even if API call fails
      localStorage.removeItem('auth_token');
      navigate('/login');
    }
  };

  const handleProfileClick = () => {
    navigate('/profile');
    setIsOpen(false);
  };

  const toggleDropdown = () => {
    setIsOpen(!isOpen);
  };

  if (!userData) return null;

  return (
    <DropdownContainer ref={dropdownRef}>
      <ProfileTrigger onClick={toggleDropdown} $isOpen={isOpen}>
        <ProfileImage
          src={userData.profile_picture || "https://via.placeholder.com/40x40?text=User"}
          alt={userData.name}
        />
        <ArrowIcon $isOpen={isOpen}>
          {MdKeyboardArrowDown({ size: 24 })}
        </ArrowIcon>
      </ProfileTrigger>

      <DropdownMenu $isOpen={isOpen}>
        <MenuSection>
          <SectionLabel>Currently in</SectionLabel>
          <ProfileCard $selected>
            <ProfileCardImage
              src={userData.profile_picture || "https://via.placeholder.com/48x48?text=User"}
              alt={userData.name}
            />
            <ProfileCardInfo>
              <ProfileCardName>{userData.name.charAt(0).toUpperCase()}</ProfileCardName>
              <ProfileCardLabel>Personal</ProfileCardLabel>
              <ProfileCardEmail>{userData.email || 'No email'}</ProfileCardEmail>
            </ProfileCardInfo>
            <CheckmarkIcon>✓</CheckmarkIcon>
          </ProfileCard>
        </MenuSection>

        <MenuSection>
          <MenuItem onClick={handleProfileClick}>
            <MenuItemIcon>
              {CgProfile({ size: 20 })}
            </MenuItemIcon>
            View Profile
          </MenuItem>
        </MenuSection>

        <MenuSection>
          <MenuItem onClick={handleLogout}>
            <MenuItemIcon>
              {FiLogOut({ size: 20 })}
            </MenuItemIcon>
            Log out
          </MenuItem>
        </MenuSection>
      </DropdownMenu>
    </DropdownContainer>
  );
};
