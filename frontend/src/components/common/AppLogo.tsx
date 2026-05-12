import React from 'react';
import { IoMusicalNotes } from 'react-icons/io5';

interface AppLogoProps {
  size?: number;
}

/**
 * Centralized app logo component
 * Change the icon here to update it across the entire app
 */
export const AppLogo: React.FC<AppLogoProps> = ({ size = 36 }) => {
  return <>{IoMusicalNotes({ size })}</>;
};
