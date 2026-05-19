import styled, { createGlobalStyle } from 'styled-components';
import { APP_SIDEBAR_WIDTH, APP_SIDEBAR_WIDTH_MOBILE } from '../constants/layout';

export { AppLayout } from './AppLayoutStyles';

export const MainContent = styled.main<{ sidebarOpen: boolean }>`
  flex: 1;
  margin-left: ${APP_SIDEBAR_WIDTH}px;
  width: calc(100% - ${APP_SIDEBAR_WIDTH}px);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 0;
  background-color: #f5f5f5;
  position: relative; /* Ensure position is relative for all modes */
  
  @media (max-width: 768px) {
    margin-left: ${props => (props.sidebarOpen ? `${APP_SIDEBAR_WIDTH_MOBILE}px` : '0')};
    width: ${props => (props.sidebarOpen ? `calc(100% - ${APP_SIDEBAR_WIDTH_MOBILE}px)` : '100%')};
    transition: margin-left 0.3s ease, width 0.3s ease;
  }
`;

export const ChatSidebar = styled.div<{ isOpen: boolean }>`
  width: 300px;
  background-color: #fff;
  height: 100vh;
  border-right: 1px solid #eaeaea;
  display: flex;
  flex-direction: column;
  transition: transform 0.3s ease, left 0.3s ease;
  position: fixed;
  left: ${APP_SIDEBAR_WIDTH}px;
  z-index: 90;
  transform: translateX(${props => props.isOpen ? '0' : '-100%'});
  overflow-y: auto;
  
  @media (max-width: 768px) {
    left: 0;
    width: 85%;
    max-width: 320px;
    z-index: 110; /* Higher than main sidebar on mobile */
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
    box-shadow: ${props => props.isOpen ? '4px 0 20px rgba(0, 0, 0, 0.15)' : 'none'};
    border-right: none;
  }
`;

export const ChatListHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #fafafa;
  
  @media (max-width: 768px) {
    padding: 16px 18px;
    background: linear-gradient(135deg, #1DB954, #169c46);
    color: white;
    border-bottom: none;
  }
`;

export const ChatListTitle = styled.h3`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  
  @media (max-width: 768px) {
    color: white;
    font-size: 17px;
  }
`;

export const NewChatButton = styled.button`
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  display: flex;
  align-items: center;
  gap: 8px;
  cursor: pointer;
  font-weight: 600;
  transition: all 0.2s ease;
  font-size: 14px;
  
  &:hover {
    background-color: #19a049;
  }
  
  @media (max-width: 768px) {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 10px 18px;
    border-radius: 8px;
    font-size: 15px;
    
    &:hover {
      background-color: rgba(255, 255, 255, 0.3);
    }
  }
`;

export const ChatList = styled.div`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  
  /* Hide scrollbar but keep scrolling functionality */
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  @media (max-width: 768px) {
    padding: 12px 10px;
  }
`;

export const ChatItem = styled.div<{ active?: boolean }>`
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  margin-bottom: 8px;
  background-color: ${props => props.active ? 'rgba(29, 185, 84, 0.1)' : 'transparent'};
  border-left: ${props => props.active ? '3px solid #1DB954' : '3px solid transparent'};
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  
  &:hover {
    background-color: ${props => props.active ? 'rgba(29, 185, 84, 0.15)' : 'rgba(0, 0, 0, 0.05)'};
  }
  
  @media (max-width: 768px) {
    padding: 14px 16px;
    border-radius: 10px;
    margin-bottom: 10px;
    
    &:active {
      transform: scale(0.98);
    }
  }
`;

export const ChatItemTitle = styled.div`
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
  
  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

export const ChatItemDelete = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  position: relative;
  
  ${ChatItem}:hover & {
    opacity: 1;
  }
  
  &:hover {
    color: #e91429;
    transform: scale(1.15);
  }
  
  &:hover::after {
    content: "Delete";
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.75);
    color: white;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
    font-weight: 500;
  }
  
  &:hover::before {
    content: "";
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: rgba(0, 0, 0, 0.75) transparent transparent transparent;
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    opacity: 1;
    padding: 8px;
    color: #999;
    
    &:active {
      color: #e91429;
      transform: scale(1.1);
    }
    
    &:hover::after,
    &:hover::before {
      display: none;
    }
  }
`;

export const ChatItemEdit = styled.button`
  background: none;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  opacity: 0;
  transition: opacity 0.2s ease, transform 0.2s ease;
  margin-right: 4px;
  position: relative;
  
  ${ChatItem}:hover & {
    opacity: 1;
  }
  
  &:hover {
    color: #1DB954;
    transform: scale(1.15);
  }
  
  &:hover::after {
    content: "Rename";
    position: absolute;
    top: -25px;
    left: 50%;
    transform: translateX(-50%);
    background-color: rgba(0, 0, 0, 0.75);
    color: white;
    font-size: 12px;
    padding: 4px 8px;
    border-radius: 4px;
    white-space: nowrap;
    pointer-events: none;
    font-weight: 500;
  }
  
  &:hover::before {
    content: "";
    position: absolute;
    top: -8px;
    left: 50%;
    transform: translateX(-50%);
    border-width: 4px;
    border-style: solid;
    border-color: rgba(0, 0, 0, 0.75) transparent transparent transparent;
    pointer-events: none;
  }
  
  @media (max-width: 768px) {
    opacity: 1;
    padding: 8px;
    margin-right: 4px;
    color: #999;
    
    &:active {
      color: #1DB954;
      transform: scale(1.1);
    }
    
    &:hover::after,
    &:hover::before {
      display: none;
    }
  }
`;

export const ChatItemActions = styled.div`
  display: flex;
  align-items: center;
`;

export const ChatTitleInput = styled.input`
  font-weight: 500;
  color: #333;
  background: transparent;
  border: none;
  border-bottom: 2px solid #1DB954;
  padding: 4px 2px;
  width: 100%;
  margin-right: 8px;
  transition: all 0.2s ease;
  border-radius: 2px;
  
  &::placeholder {
    color: #aaa;
    font-style: italic;
    opacity: 0.7;
  }
  
  &:focus {
    outline: none;
    background-color: rgba(29, 185, 84, 0.05);
    box-shadow: 0 2px 0 rgba(29, 185, 84, 0.2);
  }
`;

export const SaveButton = styled.button`
  background: none;
  border: none;
  cursor: pointer;
  color: #1DB954;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    transform: scale(1.1);
  }
`;

export const EditForm = styled.form`
  display: flex;
  flex: 1;
  align-items: center;
`;

export const ChatSidebarToggle = styled.button`
  position: fixed;
  top: 20px;
  /* Position at the right edge of the sidebar when open */
  left: ${props => props.theme.chatSidebarOpen ? 'calc(240px + 300px + 10px)' : '260px'};
  z-index: 95;
  background-color: #fff;
  color: #1DB954;
  border: 1px solid #eaeaea;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.05);
    box-shadow: 0 2px 15px rgba(0, 0, 0, 0.1);
  }
  
  @media (max-width: 768px) {
    left: ${props => props.theme.chatSidebarOpen ? 'calc(280px + 10px)' : '20px'};
  }
`;

export const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 60px);
  background-color: white;
  position: relative;
  max-width: 1000px;
  width: 100%;
  border-radius: 16px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  margin: 30px auto;
  border: 1px solid #eaeaea;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  animation: expandIn 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  
  @keyframes expandIn {
    0% {
      opacity: 0.9;
      transform: translateY(20px) scale(0.98);
      max-height: 90vh;
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
      max-height: calc(100vh - 60px);
    }
  }
  
  @media (max-width: 1200px) {
    margin: 30px 20px;
    max-width: calc(100% - 40px);
  }
  
  @media (max-width: 768px) {
    margin: 0;
    max-width: 100%;
    height: 100vh;
    border-radius: 0;
    box-shadow: none;
    border: none;
    animation: none;
  }
`;

export const ChatHeader = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  align-items: center;
  background-color: white;
  position: sticky;
  top: 0;
  z-index: 10;
  gap: 0;
  
  @media (max-width: 768px) {
    padding: 14px 16px;
    flex-wrap: nowrap;
    gap: 0;
  }
`;

export const ChatHeaderIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #1DB954;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: white;
  font-size: 18px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    width: 28px;
    height: 28px;
    font-size: 16px;
    margin-right: 10px;
  }
`;

export const ChatHeaderTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: #333;
  line-height: 1.2;
  display: flex;
  align-items: center;
  
  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

export const ChatHeaderSubtitle = styled.div`
  font-size: 13px;
  color: #777;
  margin-top: 2px;
  line-height: 1.2;
  
  @media (max-width: 768px) {
    display: none;
  }
`;

export const ChatHeaderControls = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
  
  @media (max-width: 768px) {
    gap: 8px;
    margin-left: auto;
  }
`;

export const IconButton = styled.button`
  background: none;
  border: none;
  color: #777;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;

  &:hover {
    color: #1DB954;
    background-color: rgba(29, 185, 84, 0.1);
  }
  
  @media (max-width: 768px) {
    padding: 6px;
    
    /* Hide some buttons on mobile to reduce clutter */
    &.hide-mobile {
      display: none;
    }
  }
`;

export const ChatMessages = styled.div`
  flex: 1;
  padding: 28px 30px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 24px;
  background-color: #fafafa;
  
  /* Hide scrollbar but keep scrolling functionality */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  
  &::-webkit-scrollbar {
    display: none;  /* Chrome, Safari, Opera */
  }
  
  /* Show scrollbar on hover only if "show-scrollbar" class is added */
  &.show-scrollbar::-webkit-scrollbar {
    display: block;
    width: 6px;
  }
  
  &.show-scrollbar:hover::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.2);
  }
  
  &.show-scrollbar:not(:hover)::-webkit-scrollbar-thumb {
    background: transparent;
  }
  
  /* Smooth scrolling */
  scroll-behavior: smooth;
  
  @media (max-width: 768px) {
    padding: 24px 16px;
    gap: 18px;
  }
`;

export const MessageBubble = styled.div<{ isUser: boolean; isNew?: boolean }>`
  max-width: 85%;
  padding: 16px 20px;
  border-radius: 22px;
  background-color: ${props => props.isUser ? '#1DB954' : '#f1f1f1'};
  color: ${props => props.isUser ? 'white' : '#333'};
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  word-wrap: break-word;
  font-size: 16px;
  line-height: 1.5;
  box-shadow: ${props => props.isUser ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'};
  border: ${props => props.isUser ? 'none' : '1px solid #e0e0e0'};
  animation: ${props => props.isNew ? 'messageFadeIn 0.3s ease-out' : 'none'};
  
  @keyframes messageFadeIn {
    from {
      opacity: 0;
      transform: translateY(10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }
  
  /* Add a subtle indicator of who's speaking */
  position: relative;
  
  &::before {
    content: ${props => props.isUser ? '""' : '"🎵"'};
    position: absolute;
    top: -24px;
    ${props => props.isUser ? 'right: 12px' : 'left: 12px'};
    font-size: 12px;
    color: #666;
    opacity: ${props => props.isUser ? 0 : 0.8};
  }
  
  @media (max-width: 768px) {
    max-width: 90%;
    padding: 14px 18px;
    font-size: 15px;
    border-radius: 18px;
  }
`;

// Create a global style for the animations
export const GlobalStyle = createGlobalStyle`
  @keyframes pulse {
    0%, 100% {
      opacity: 0.4;
    }
    50% {
      opacity: 0.8;
    }
  }
  
  @keyframes processingPulse {
    0%, 100% {
      opacity: 0.5;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
  }

  /* Custom scrollbar styles for webkit browsers (Chrome, Safari, etc.) */
  ::-webkit-scrollbar {
    width: 6px;
    height: 6px;
  }

  ::-webkit-scrollbar-track {
    background: transparent;
  }

  ::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 6px;
  }

  ::-webkit-scrollbar-thumb:hover {
    background: rgba(0, 0, 0, 0.2);
  }

  /* For Firefox */
  * {
    scrollbar-width: thin;
    scrollbar-color: rgba(0, 0, 0, 0.1) transparent;
  }

  /* Hide scrollbar when not in use but keep functionality */
  .hide-scrollbar::-webkit-scrollbar {
    width: 0px;
    background: transparent;
  }

  .hide-scrollbar {
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
  }
  
  body {
    overflow: hidden; /* Prevent double scrollbars */
  }
`;

export const AssistantTypingIndicator = styled.div<{ isProcessing?: boolean }>`
  display: inline-block;
  padding: ${props => props.isProcessing ? '14px 20px' : '12px 16px'};
  border-radius: 18px;
  background-color: ${props => props.isProcessing ? '#e8f7ee' : '#f1f1f1'};
  align-self: flex-start;
  font-size: 16px;
  color: #666;
  border: 1px solid ${props => props.isProcessing ? '#c8e6d7' : '#e0e0e0'};
  ${props => props.isProcessing && `
    margin-top: 10px;
  `}
`;

export const DotContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

export const Dot = styled.div<{ isProcessing?: boolean }>`
  width: 8px;
  height: 8px;
  background-color: ${props => props.isProcessing ? '#238750' : '#888'};
  border-radius: 50%;
  opacity: 0.6;
  animation: ${props => props.isProcessing ? 'processingPulse' : 'pulse'} 1.2s infinite;
  
  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  &:nth-child(3) {
    animation-delay: 0.4s;
  }
`;

export const BarContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 3px;
  height: 18px;
  padding: 0 8px;
`;

export const AnimatedBar = styled.div<{ delay: number }>`
  width: 2px;
  background: linear-gradient(180deg, #1DB954 0%, #169c46 100%);
  border-radius: 1px;
  animation: barWave 1s ease-in-out infinite;
  animation-delay: ${props => props.delay}s;
  box-shadow: 0 0 4px rgba(29, 185, 84, 0.25);
  
  @keyframes barWave {
    0%, 100% {
      height: 4px;
    }
    50% {
      height: 16px;
    }
  }
`;

export const ChatInput = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px 28px;
  border-top: 1px solid #eee;
  background-color: white;
  position: sticky;
  bottom: 0;
  z-index: 10;
  
  @media (max-width: 768px) {
    padding: 16px;
  }
`;

export const InputRow = styled.div`
  display: flex;
  align-items: flex-end;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
  
  @media (max-width: 768px) {
    max-width: 100%;
  }
`;

export const HelperText = styled.div`
  font-size: 12px !important;
  color: #888 !important;
  margin-top: 6px !important;
  padding-left: 0px;
  align-self: flex-start;
  line-height: 1.35 !important;
  
  @media (max-width: 768px) {
    font-size: 11px !important;
  }
`;

export const Textarea = styled.textarea`
  flex: 1;
  padding: 18px 24px;
  border: 1px solid #ddd;
  border-radius: 24px;
  margin-right: 14px;
  font-size: 16px;
  transition: all 0.2s ease;
  font-family: inherit;
  resize: none;
  min-height: 60px;
  max-height: 140px;
  overflow-y: auto;
  line-height: 1.4;
  
  /* Hide scrollbar but keep scrolling functionality */
  -ms-overflow-style: none;  /* IE and Edge */
  scrollbar-width: none;  /* Firefox */
  
  &::-webkit-scrollbar {
    display: none;  /* Chrome, Safari, Opera */
  }
  
  &:focus {
    outline: none;
    border-color: #1DB954;
    box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.15);
  }
  
  &::placeholder {
    color: #999;
    transition: opacity 0.2s ease;
  }
  
  &:focus::placeholder {
    opacity: 0.7;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 14px 18px;
    font-size: 16px;
    margin-right: 10px;
    min-height: 50px;
    border-radius: 20px;
  }
`;

export const SendButton = styled.button`
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 24px;
  padding: 18px 30px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 16px;
  font-weight: 500;
  white-space: nowrap;
  
  &:hover {
    background-color: #19a049;
    transform: translateY(-1px);
    box-shadow: 0 3px 8px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  svg {
    margin-left: 8px;
    font-size: 20px;
  }
  
  @media (max-width: 768px) {
    padding: 14px 24px;
    font-size: 15px;
    border-radius: 20px;
  }
`;

export const UserActions = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

export const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

export const UserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #1DB954;
`;

export const UserName = styled.span`
  font-weight: 500;
  color: #333;
`;

export const MobileOverlay = styled.div<{ visible: boolean }>`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  z-index: 80;
  opacity: ${props => props.visible ? 1 : 0};
  visibility: ${props => props.visible ? 'visible' : 'hidden'};
  transition: opacity 0.3s ease, visibility 0.3s ease;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

export const CompactChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  width: 700px;
  max-width: 90%;
  margin: 0;
  border-radius: 20px;
  box-shadow: 0 8px 40px rgba(0, 0, 0, 0.12);
  background-color: white;
  overflow: hidden;
  transition: all 0.4s cubic-bezier(0.22, 1, 0.36, 1);
  animation: floatIn 0.5s cubic-bezier(0.22, 1, 0.36, 1) forwards;
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  z-index: 10;
  
  &:focus-within {
    box-shadow: 0 12px 48px rgba(29, 185, 84, 0.16);
    transform: translate(-50%, -52%);
  }
  
  @keyframes floatIn {
    0% {
      opacity: 0;
      transform: translate(-50%, -40%) scale(0.98);
    }
    100% {
      opacity: 1;
      transform: translate(-50%, -50%) scale(1);
    }
  }
  
  @media (max-width: 768px) {
    width: 95%;
    max-width: 95%;
    border-radius: 16px;
  }
`;

export const CompactChatHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 22px 26px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background-color: #fcfcfc;
  
  @media (max-width: 768px) {
    padding: 18px 20px;
  }
`;

export const CompactChatTitle = styled.div`
  font-weight: 600;
  font-size: 18px;
  color: #333;
  letter-spacing: -0.2px;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

export const CompactChatInput = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px 24px;
  background-color: white;
  border-top: 1px solid transparent;
  transition: border-color 0.3s ease;
  
  &:focus-within {
    border-top-color: rgba(29, 185, 84, 0.1);
  }
  
  @media (max-width: 768px) {
    padding: 16px 18px;
  }
`;

export const CompactChatIcon = styled.div`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  background-color: #1DB954;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 14px;
  color: white;
  font-size: 22px;
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
    font-size: 20px;
    margin-right: 12px;
  }
`;

export const ChatSearchOverlay = styled.div`
  position: absolute;
  bottom: 100%;
  left: 0;
  width: 100%;
  background-color: white;
  border: 1px solid #ddd;
  border-bottom: none;
  border-radius: 16px 16px 0 0;
  box-shadow: 0 -4px 12px rgba(0, 0, 0, 0.05);
  max-height: 300px;
  overflow-y: auto;
  z-index: 20;
  padding: 8px 0;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.1);
    border-radius: 6px;
  }
`;

export const ChatSearchResultItem = styled.div`
  display: flex;
  align-items: center;
  padding: 10px 20px;
  cursor: pointer;
  transition: background-color 0.2s;
  
  &:hover {
    background-color: rgba(29, 185, 84, 0.05);
  }
`;

export const ChatSearchAlbumCover = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 4px;
  object-fit: cover;
  margin-right: 12px;
`;

export const ChatSearchSongInfo = styled.div`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export const ChatSearchSongTitle = styled.div`
  font-size: 14px;
  font-weight: 600;
  color: #333;
`;

export const ChatSearchSongMeta = styled.div`
  font-size: 12px;
  color: #666;
  margin-top: 2px;
`;

export const SearchToggleButton = styled.button<{ isActive?: boolean }>`
  background-color: ${props => props.isActive ? '#f1f1f1' : 'transparent'};
  color: ${props => props.isActive ? '#e91429' : '#666'};
  border: none;
  border-radius: 50%;
  width: 56px;
  height: 56px;
  margin-left: -8px;
  margin-right: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s ease;
  flex-shrink: 0;
  
  &:hover {
    background-color: ${props => props.isActive ? '#ffebee' : 'rgba(0, 0, 0, 0.05)'};
    color: ${props => props.isActive ? '#d32f2f' : '#333'};
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
  
  svg {
    font-size: 28px;
  }
  
  @media (max-width: 768px) {
    width: 46px;
    height: 46px;
    margin-right: 8px;
    
    svg {
      font-size: 24px;
    }
  }
`;

export const InputRowWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
`;

/* —— Song search modal & reusable search UI —— */
export const SongSearchModalRoot = styled.div`
  position: fixed !important;
  inset: 0 !important;
  z-index: 200 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  padding: 16px !important;
`;

export const SongSearchModalBackdrop = styled.button`
  position: absolute !important;
  inset: 0 !important;
  border: none !important;
  padding: 0 !important;
  margin: 0 !important;
  background: rgba(0, 0, 0, 0.45) !important;
  cursor: pointer !important;
`;

export const SongSearchModalPanel = styled.div`
  position: relative !important;
  z-index: 1 !important;
  width: 100% !important;
  max-width: 520px !important;
  max-height: min(88vh, 720px) !important;
  background: #fff !important;
  border-radius: 16px !important;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.2) !important;
  display: flex !important;
  flex-direction: column !important;
  overflow: hidden !important;

  @media (max-width: 768px) {
    max-width: 100% !important;
    max-height: 92vh !important;
    border-radius: 14px !important;
  }
`;

export const SongSearchModalHeader = styled.div`
  display: flex !important;
  align-items: center !important;
  justify-content: space-between !important;
  padding: 16px 18px !important;
  border-bottom: 1px solid #eee !important;
  flex-shrink: 0 !important;
`;

export const SongSearchModalTitle = styled.h2`
  margin: 0 !important;
  font-size: 18px !important;
  font-weight: 600 !important;
  color: #222 !important;
`;

export const SongSearchModalClose = styled.button`
  border: none !important;
  background: transparent !important;
  padding: 8px !important;
  border-radius: 50% !important;
  cursor: pointer !important;
  color: #666 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;

  &:hover {
    background: #f0f0f0 !important;
    color: #111 !important;
  }
`;

export const SongSearchModalBody = styled.div`
  flex: 1 1 auto !important;
  min-height: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  padding: 12px 16px 16px !important;
`;

export const SearchBarRoot = styled.div<{ $modal?: boolean }>`
  display: flex !important;
  flex-direction: column !important;
  flex: ${p => (p.$modal ? '1 1 auto' : '0 0 auto')} !important;
  min-height: ${p => (p.$modal ? '0' : 'auto')} !important;
  position: relative !important;
`;

export const SearchBarInputRow = styled.div`
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  flex-shrink: 0 !important;
`;

export const SearchBarField = styled.input`
  flex: 1 !important;
  min-width: 0 !important;
  padding: 12px 14px !important;
  border: 1px solid #ddd !important;
  border-radius: 12px !important;
  font-size: 16px !important;
  font-family: inherit !important;

  &:focus {
    outline: none !important;
    border-color: #1db954 !important;
    box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.15) !important;
  }

  &::placeholder {
    color: #999 !important;
  }
`;

export const SearchBarResultsPanel = styled.div<{ $open: boolean; $modal?: boolean }>`
  margin-top: 10px !important;
  border: 1px solid #e8e8e8 !important;
  border-radius: 12px !important;
  background: #fafafa !important;
  overflow: hidden !important;
  display: ${p => (p.$open ? 'flex' : 'none')} !important;
  flex-direction: column !important;
  flex: ${p => (p.$open && p.$modal ? '1 1 auto' : p.$open ? '0 0 auto' : 'none')} !important;
  min-height: ${p => (p.$open && p.$modal ? '120px' : '0')} !important;
  max-height: ${p => (p.$open && p.$modal ? 'none' : p.$open ? 'min(48vh, 360px)' : '0')} !important;
`;

export const SearchBarResultsScroll = styled.div<{ $modal?: boolean }>`
  overflow-y: auto !important;
  flex: 1 1 auto !important;
  min-height: 0 !important;
  max-height: ${p => (p.$modal ? 'none' : 'min(48vh, 360px)')} !important;

  &::-webkit-scrollbar {
    width: 6px !important;
  }
  &::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.12) !important;
    border-radius: 6px !important;
  }
`;

export const SearchBarStateRow = styled.div`
  padding: 20px 16px !important;
  text-align: center !important;
  color: #666 !important;
  font-size: 14px !important;
  display: flex !important;
  flex-direction: column !important;
  align-items: center !important;
  gap: 10px !important;
`;

export const SearchSpinner = styled.div`
  width: 22px !important;
  height: 22px !important;
  border: 2px solid #e0e0e0 !important;
  border-top-color: #1db954 !important;
  border-radius: 50% !important;
  animation: searchSpin 0.7s linear infinite !important;

  @keyframes searchSpin {
    to {
      transform: rotate(360deg);
    }
  }
`;

export const SearchResultRow = styled.button`
  display: flex !important;
  width: 100% !important;
  align-items: center !important;
  padding: 10px 12px !important;
  border: none !important;
  border-bottom: 1px solid #eee !important;
  background: #fff !important;
  cursor: pointer !important;
  text-align: left !important;
  gap: 12px !important;

  &:last-child {
    border-bottom: none !important;
  }

  &:hover {
    background: rgba(29, 185, 84, 0.06) !important;
  }
`;

export const SearchResultThumb = styled.img`
  width: 44px !important;
  height: 44px !important;
  border-radius: 6px !important;
  object-fit: cover !important;
  flex-shrink: 0 !important;
`;

export const SearchResultThumbPlaceholder = styled.div`
  width: 44px !important;
  height: 44px !important;
  border-radius: 6px !important;
  background: #e8e8e8 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  color: #888 !important;
  flex-shrink: 0 !important;
`;

export const SearchResultText = styled.div`
  flex: 1 !important;
  min-width: 0 !important;
`;

export const SearchResultTitle = styled.div`
  font-size: 14px !important;
  font-weight: 600 !important;
  color: #222 !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
`;

export const SearchResultMeta = styled.div`
  font-size: 12px !important;
  color: #666 !important;
  margin-top: 2px !important;
  white-space: nowrap !important;
  overflow: hidden !important;
  text-overflow: ellipsis !important;
`;

/* User song pick bubble (chat) */
export const UserSongPickBubble = styled.div<{ $isNew?: boolean }>`
  align-self: flex-end !important;
  max-width: 88% !important;
  display: flex !important;
  flex-direction: row !important;
  align-items: stretch !important;
  gap: 12px !important;
  padding: 12px 14px !important;
  border-radius: 16px !important;
  background: linear-gradient(135deg, #159847 0%, #1db954 100%) !important;
  color: #fff !important;
  box-shadow: 0 4px 14px rgba(25, 160, 73, 0.35) !important;
  animation: ${p => (p.$isNew ? 'messageFadeIn 0.3s ease-out' : 'none')} !important;

  @media (max-width: 768px) {
    max-width: 92% !important;
    padding: 10px 12px !important;
  }
`;

export const UserSongPickCover = styled.img`
  width: 56px !important;
  height: 56px !important;
  border-radius: 8px !important;
  object-fit: cover !important;
  flex-shrink: 0 !important;
  background: rgba(255, 255, 255, 0.15) !important;
`;

export const UserSongPickCoverPlaceholder = styled.div`
  width: 56px !important;
  height: 56px !important;
  border-radius: 8px !important;
  flex-shrink: 0 !important;
  background: rgba(255, 255, 255, 0.2) !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  font-size: 24px !important;
`;

export const UserSongPickText = styled.div`
  flex: 1 !important;
  min-width: 0 !important;
  display: flex !important;
  flex-direction: column !important;
  justify-content: center !important;
  gap: 4px !important;
`;

export const UserSongPickTitle = styled.div`
  font-size: 15px !important;
  font-weight: 700 !important;
  line-height: 1.25 !important;
  color: #fff !important;
`;

export const UserSongPickArtist = styled.div`
  font-size: 13px !important;
  opacity: 0.95 !important;
  line-height: 1.3 !important;
`;

/* Page-variant mobile FAB + sheet */
export const SearchMobileFab = styled.button`
  position: fixed !important;
  right: 20px !important;
  bottom: 100px !important;
  width: 56px !important;
  height: 56px !important;
  border-radius: 50% !important;
  border: none !important;
  background: #1db954 !important;
  color: #fff !important;
  box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2) !important;
  z-index: 90 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
  cursor: pointer !important;

  @media (min-width: 769px) {
    display: none !important;
  }
`;

export const SearchMobileSheet = styled.div`
  position: fixed !important;
  inset: 0 !important;
  z-index: 195 !important;
  background: #fff !important;
  display: flex !important;
  flex-direction: column !important;
`;

export const SearchMobileSheetBar = styled.div`
  display: flex !important;
  align-items: center !important;
  gap: 8px !important;
  padding: 12px 12px !important;
  border-bottom: 1px solid #eee !important;
  flex-shrink: 0 !important;
`;

export const SearchMobileSheetBack = styled.button`
  border: none !important;
  background: transparent !important;
  padding: 8px !important;
  cursor: pointer !important;
  color: #333 !important;
  display: flex !important;
  align-items: center !important;
`;

export const SearchMobileSheetBody = styled.div`
  flex: 1 !important;
  min-height: 0 !important;
  padding: 12px 16px 24px !important;
  display: flex !important;
  flex-direction: column !important;
`; 