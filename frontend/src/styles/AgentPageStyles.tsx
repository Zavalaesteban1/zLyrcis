import styled, { createGlobalStyle } from 'styled-components';
import { Link } from 'react-router-dom';

// Styled components from AgentPage.tsx
export const AppLayout = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  color: #333;
`;

export const Sidebar = styled.div<{ isOpen: boolean }>`
  width: 240px;
  background-color: #1DB954;
  color: white;
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
  z-index: 100;
  transition: transform 0.3s ease;
  
  @media (max-width: 768px) {
    width: 280px;
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
  }
`;

export const SidebarToggle = styled.button`
  position: fixed;
  top: 20px;
  left: 20px;
  z-index: 200;
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
  display: none;
  
  &:hover {
    transform: scale(1.05);
    background-color: #19a049;
  }
  
  @media (max-width: 768px) {
    display: flex;
  }
`;

export const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  padding: 0 20px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
`;

export const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

export const NavItem = styled(Link)<{ active?: boolean }>`
  padding: 12px 20px;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  font-weight: ${props => props.active ? '600' : '400'};
  background-color: ${props => props.active ? 'rgba(0, 0, 0, 0.2)' : 'transparent'};
  border-left: ${props => props.active ? '4px solid white' : '4px solid transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border-left: 4px solid rgba(255, 255, 255, 0.7);
  }
`;

export const NavIcon = styled.span`
  margin-right: 10px;
  font-size: 18px;
  display: flex;
  align-items: center;
`;

export const MainContent = styled.main<{ sidebarOpen: boolean }>`
  flex: 1;
  margin-left: 240px; /* Always align with sidebar on desktop */
  width: calc(100% - 240px);
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  overflow: auto;
  padding: 0;
  background-color: #f5f5f5;
  position: relative; /* Ensure position is relative for all modes */
  
  @media (max-width: 768px) {
    margin-left: ${props => props.sidebarOpen ? '280px' : '0'};
    width: ${props => props.sidebarOpen ? 'calc(100% - 280px)' : '100%'};
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
  left: 240px; /* Always position next to the main sidebar */
  z-index: 90;
  transform: translateX(${props => props.isOpen ? '0' : '-100%'});
  overflow-y: auto;
  
  @media (max-width: 768px) {
    left: 0;
    width: 280px;
    z-index: 110; /* Higher than main sidebar on mobile */
    transform: translateX(${props => props.isOpen ? '0' : '-100%'});
    box-shadow: ${props => props.isOpen ? '2px 0 10px rgba(0, 0, 0, 0.1)' : 'none'};
  }
`;

export const ChatListHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  
  &:hover {
    background-color: #19a049;
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
`;

export const ChatItemTitle = styled.div`
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
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
`;

export const ChatHeaderTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: #333;
`;

export const ChatHeaderSubtitle = styled.div`
  font-size: 13px;
  color: #777;
  margin-top: 2px;
`;

export const ChatHeaderControls = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
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
  padding: 12px 16px;
  border-radius: 18px;
  background-color: #f1f1f1;
  align-self: flex-start;
  font-size: 16px;
  color: #666;
  border: 1px solid #e0e0e0;
  ${props => props.isProcessing && `
    margin-top: 10px;
    background-color: #e8f7ee;
    border-color: #c8e6d7;
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

export const ChatInput = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px 28px;
  border-top: 1px solid #eee;
  background-color: white;
  position: sticky;
  bottom: 0;
  z-index: 10;
`;

export const InputRow = styled.div`
  display: flex;
  align-items: flex-end;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
`;

export const HelperText = styled.div`
  font-size: 12px;
  color: #888;
  margin-top: 4px;
  padding-left: 12px;
  align-self: flex-start;
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
`;

export const ProcessingLabel = styled.div`
  font-size: 13px;
  color: #238750;
  margin-bottom: 4px;
  font-weight: 500;
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
  }
`;

export const CompactChatHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 22px 26px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background-color: #fcfcfc;
`;

export const CompactChatTitle = styled.div`
  font-weight: 600;
  font-size: 18px;
  color: #333;
  letter-spacing: -0.2px;
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
`; 