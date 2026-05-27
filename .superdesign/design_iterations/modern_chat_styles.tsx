// Modern Chat Styles - Claude/Gemini Inspired Design
// These will replace sections in AgentPageStyles.tsx

import styled, { keyframes } from 'styled-components';

// Gradient background animation for empty state
const gradientShift = keyframes`
  0%, 100% {
    background-position: 0% 50%;
  }
  50% {
    background-position: 100% 50%;
  }
`;

// Modern Compact Chat Container (Empty State - Centered)
export const ModernCompactChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100%;
  max-width: 720px;
  margin: 0 auto;
  padding: 40px 24px;
  min-height: 70vh;
  position: relative;
  
  @media (max-width: 768px) {
    max-width: 100%;
    padding: 32px 20px;
    min-height: 60vh;
  }
`;

// Icon container with modern styling
export const ModernChatIcon = styled.div`
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: linear-gradient(135deg, #1DB954 0%, #169c46 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 40px;
  margin-bottom: 24px;
  box-shadow: 0 8px 32px rgba(29, 185, 84, 0.25);
  animation: floatIn 0.6s cubic-bezier(0.22, 1, 0.36, 1);
  
  @keyframes floatIn {
    0% {
      opacity: 0;
      transform: translateY(-20px) scale(0.9);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
  
  @media (max-width: 768px) {
    width: 64px;
    height: 64px;
    font-size: 32px;
    margin-bottom: 20px;
  }
`;

// Modern title
export const ModernChatTitle = styled.h1`
  font-size: 32px;
  font-weight: 700;
  color: #1a1a1a;
  margin: 0 0 8px 0;
  text-align: center;
  letter-spacing: -0.5px;
  
  @media (max-width: 768px) {
    font-size: 26px;
  }
`;

// Subtitle
export const ModernChatSubtitle = styled.p`
  font-size: 16px;
  color: #666;
  margin: 0 0 48px 0;
  text-align: center;
  font-weight: 400;
  
  @media (max-width: 768px) {
    font-size: 15px;
    margin: 0 0 40px 0;
  }
`;

// Modern Input Container (Claude-style)
export const ModernInputContainer = styled.div`
  width: 100%;
  max-width: 680px;
  margin: 0 auto 32px;
  
  @media (max-width: 768px) {
    max-width: 100%;
    margin: 0 auto 24px;
  }
`;

// Modern Input Row (pill-shaped like Claude)
export const ModernInputRow = styled.div`
  display: flex;
  align-items: center;
  background: #ffffff;
  border: 1.5px solid #e0e0e0;
  border-radius: 28px;
  padding: 8px 12px 8px 20px;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.04);
  
  &:focus-within {
    border-color: #1DB954;
    box-shadow: 0 4px 16px rgba(29, 185, 84, 0.12), 0 0 0 3px rgba(29, 185, 84, 0.08);
  }
  
  &:hover:not(:focus-within) {
    border-color: #c0c0c0;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.06);
  }
  
  @media (max-width: 768px) {
    border-radius: 24px;
    padding: 6px 10px 6px 16px;
  }
`;

// Modern Textarea (seamless integration)
export const ModernTextarea = styled.textarea`
  flex: 1;
  padding: 14px 16px;
  border: none;
  background: transparent;
  font-size: 16px;
  font-family: inherit;
  resize: none;
  min-height: 24px;
  max-height: 140px;
  overflow-y: auto;
  line-height: 1.5;
  color: #1a1a1a;
  
  &::placeholder {
    color: #999;
  }
  
  &:focus {
    outline: none;
  }
  
  /* Hide scrollbar */
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  @media (max-width: 768px) {
    padding: 12px 12px;
    font-size: 16px;
    min-height: 20px;
  }
`;

// Modern Icon Button (for search, voice, etc.)
export const ModernIconButton = styled.button`
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    background: rgba(0, 0, 0, 0.05);
    color: #1DB954;
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 8px;
  }
`;

// Modern Send Button
export const ModernSendButton = styled.button`
  background: #1DB954;
  color: white;
  border: none;
  border-radius: 20px;
  padding: 12px 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 6px;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  font-size: 15px;
  font-weight: 600;
  white-space: nowrap;
  margin-left: 8px;
  
  &:hover:not(:disabled) {
    background: #19a049;
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(29, 185, 84, 0.3);
  }
  
  &:active:not(:disabled) {
    transform: translateY(0);
  }
  
  &:disabled {
    background: #cccccc;
    cursor: not-allowed;
    transform: none;
  }
  
  @media (max-width: 768px) {
    padding: 10px 20px;
    font-size: 14px;
    border-radius: 18px;
  }
`;

// Helper text below input
export const ModernHelperText = styled.div`
  font-size: 13px;
  color: #888;
  text-align: center;
  margin-top: 12px;
  line-height: 1.4;
  
  @media (max-width: 768px) {
    font-size: 12px;
    margin-top: 10px;
  }
`;

// Action buttons container (History, New, Profile)
export const ModernActionButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  animation: fadeIn 0.5s ease-out 0.2s both;
  
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 768px) {
    gap: 10px;
  }
`;

// Individual action button
export const ModernActionButton = styled.button`
  background: rgba(29, 185, 84, 0.08);
  color: #1DB954;
  border: 1.5px solid rgba(29, 185, 84, 0.2);
  border-radius: 16px;
  padding: 12px 20px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);
  font-size: 14px;
  font-weight: 600;
  
  &:hover {
    background: rgba(29, 185, 84, 0.12);
    border-color: rgba(29, 185, 84, 0.4);
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(29, 185, 84, 0.15);
  }
  
  &:active {
    transform: translateY(0);
  }
  
  svg {
    font-size: 18px;
  }
  
  @media (max-width: 768px) {
    padding: 10px 16px;
    font-size: 13px;
    border-radius: 14px;
    
    svg {
      font-size: 16px;
    }
  }
`;

// Expanded Chat Container (replaces old ChatContainer)
export const ModernExpandedChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: #fafafa;
  position: relative;
  animation: expandChat 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  
  @keyframes expandChat {
    0% {
      opacity: 0.9;
      transform: scale(0.98);
    }
    100% {
      opacity: 1;
      transform: scale(1);
    }
  }
  
  @media (max-width: 768px) {
    height: 100vh;
  }
`;

// Modern Chat Header
export const ModernChatHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  position: sticky;
  top: 0;
  z-index: 10;
  
  @media (max-width: 768px) {
    padding: 14px 16px;
  }
`;

// Chat name in header
export const ModernChatName = styled.div`
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.2px;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

// Header actions (right side)
export const ModernHeaderActions = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

// Modern Messages Container
export const ModernMessagesContainer = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 32px 24px;
  display: flex;
  flex-direction: column;
  gap: 20px;
  
  /* Smooth scrolling */
  scroll-behavior: smooth;
  
  /* Hide scrollbar by default */
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  /* Show on hover if needed */
  &.show-scrollbar::-webkit-scrollbar {
    display: block;
    width: 6px;
  }
  
  &.show-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 6px;
  }
  
  @media (max-width: 768px) {
    padding: 24px 16px;
    gap: 16px;
  }
`;

// Modern Message Bubble
export const ModernMessageBubble = styled.div<{ isUser: boolean; isNew?: boolean }>`
  max-width: 75%;
  padding: 14px 18px;
  border-radius: 20px;
  background-color: ${props => props.isUser 
    ? 'linear-gradient(135deg, #1DB954 0%, #19a049 100%)' 
    : '#ffffff'};
  background: ${props => props.isUser 
    ? 'linear-gradient(135deg, #1DB954 0%, #19a049 100%)' 
    : '#ffffff'};
  color: ${props => props.isUser ? '#ffffff' : '#1a1a1a'};
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  font-size: 15px;
  line-height: 1.5;
  box-shadow: ${props => props.isUser 
    ? '0 2px 8px rgba(29, 185, 84, 0.2)' 
    : '0 1px 3px rgba(0, 0, 0, 0.08)'};
  border: ${props => props.isUser ? 'none' : '1px solid rgba(0, 0, 0, 0.06)'};
  animation: ${props => props.isNew ? 'messageSlideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)' : 'none'};
  
  @keyframes messageSlideIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  @media (max-width: 768px) {
    max-width: 85%;
    padding: 12px 16px;
    font-size: 15px;
    border-radius: 18px;
  }
`;

// Modern Input Footer (for expanded chat)
export const ModernInputFooter = styled.div`
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-top: 1px solid rgba(0, 0, 0, 0.06);
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

// Background for empty state
export const ModernEmptyBackground = styled.div`
  position: fixed;
  inset: 0;
  background: linear-gradient(135deg, #f5f5f5 0%, #fafafa 50%, #f0f0f0 100%);
  background-size: 200% 200%;
  animation: ${gradientShift} 8s ease infinite;
  z-index: -1;
`;
