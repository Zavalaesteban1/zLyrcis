import styled, { createGlobalStyle } from 'styled-components';
import { APP_SIDEBAR_WIDTH, APP_SIDEBAR_WIDTH_MOBILE, CHAT_SIDEBAR_WIDTH, CHAT_SIDEBAR_RAIL_WIDTH } from '../constants/layout';

/** Shared page background — matches chat history sidebar */
const PAGE_BG = '#ffffff';

/** Wide landing composer (empty state) */
const CLAUDE_LANDING_MAX = 1024;
const CLAUDE_LANDING_GUTTER = 64;

/** Active chat thread — same wide column as Claude (~65% of main pane) */
const CHAT_THREAD_MAX = 1024;
const CHAT_THREAD_GUTTER = 48;

const chatThreadWidth = `
  width: 100%;
  max-width: ${CHAT_THREAD_MAX}px;
`;

const CHAT_LAYOUT_TRANSITION = 'margin-left 0.3s cubic-bezier(0.22, 1, 0.36, 1), width 0.3s cubic-bezier(0.22, 1, 0.36, 1)';

export { AppLayout } from './AppLayoutStyles';

export const MainContent = styled.main<{ sidebarOpen: boolean; chatSidebarOpen?: boolean }>`
  flex: 1;
  margin-left: ${props =>
    APP_SIDEBAR_WIDTH +
    (props.chatSidebarOpen ? CHAT_SIDEBAR_WIDTH : CHAT_SIDEBAR_RAIL_WIDTH)}px;
  width: ${props =>
    `calc(100% - ${APP_SIDEBAR_WIDTH}px - ${props.chatSidebarOpen ? CHAT_SIDEBAR_WIDTH : CHAT_SIDEBAR_RAIL_WIDTH}px)`};
  height: 100vh;
  min-height: 0;
  display: flex;
  flex-direction: column;
  overflow: hidden;
  padding: 0;
  background: ${PAGE_BG};
  position: relative;
  transition: ${CHAT_LAYOUT_TRANSITION};
  
  @media (max-width: 768px) {
    margin-left: ${props => (props.sidebarOpen ? `${APP_SIDEBAR_WIDTH_MOBILE}px` : '0')};
    width: ${props => (props.sidebarOpen ? `calc(100% - ${APP_SIDEBAR_WIDTH_MOBILE}px)` : '100%')};
  }
`;

export const ChatSidebar = styled.div<{ isOpen: boolean }>`
  width: ${props => (props.isOpen ? CHAT_SIDEBAR_WIDTH : CHAT_SIDEBAR_RAIL_WIDTH)}px;
  background: ${PAGE_BG};
  backdrop-filter: blur(10px);
  height: 100vh;
  border-right: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  flex-direction: column;
  transition: width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  position: fixed;
  left: ${APP_SIDEBAR_WIDTH}px;
  z-index: 90;
  overflow: hidden;
  
  @media (max-width: 768px) {
    left: 0;
    width: ${props => (props.isOpen ? '85%' : '0')};
    max-width: 320px;
    z-index: 110;
    transform: translateX(${props => (props.isOpen ? '0' : '-100%')});
    box-shadow: ${props => (props.isOpen ? '4px 0 20px rgba(0, 0, 0, 0.15)' : 'none')};
    border-right: none;
    transition: transform 0.3s cubic-bezier(0.22, 1, 0.36, 1), width 0.3s cubic-bezier(0.22, 1, 0.36, 1);
  }
`;

export const ChatListHeader = styled.div<{ $collapsed?: boolean }>`
  padding: ${props => (props.$collapsed ? '10px 8px' : '10px 16px 10px 20px')};
  min-height: 52px;
  box-sizing: border-box;
  border-bottom: 1px solid rgba(0, 0, 0, 0.06);
  display: flex;
  justify-content: ${props => (props.$collapsed ? 'center' : 'space-between')};
  align-items: center;
  gap: 12px;
  background-color: transparent;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    padding: 10px 16px;
    justify-content: space-between;
    background: linear-gradient(135deg, #1DB954, #169c46);
    color: white;
    border-bottom: none;
  }
`;

export const ChatListTitle = styled.h3<{ $hidden?: boolean }>`
  margin: 0;
  font-size: 16px;
  font-weight: 600;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  opacity: ${props => (props.$hidden ? 0 : 1)};
  width: ${props => (props.$hidden ? 0 : 'auto')};
  
  @media (max-width: 768px) {
    color: white;
    font-size: 17px;
    opacity: 1;
    width: auto;
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

export const ChatList = styled.div<{ $collapsed?: boolean }>`
  flex: 1;
  overflow-y: auto;
  padding: 10px;
  opacity: ${props => (props.$collapsed ? 0 : 1)};
  pointer-events: ${props => (props.$collapsed ? 'none' : 'auto')};
  transition: opacity 0.2s ease;
  
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
  position: relative;
  padding: 10px 12px;
  border-radius: 12px;
  cursor: pointer;
  margin-bottom: 4px;
  background-color: ${props => (props.active ? 'rgba(29, 185, 84, 0.08)' : 'transparent')};
  border: 1.5px solid ${props => (props.active ? 'rgba(29, 185, 84, 0.3)' : 'transparent')};
  transition: background-color 0.15s ease, border-color 0.15s ease;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  
  &:hover {
    background-color: ${props => (props.active ? 'rgba(29, 185, 84, 0.12)' : 'rgba(0, 0, 0, 0.04)')};
    border-color: ${props => (props.active ? 'rgba(29, 185, 84, 0.4)' : 'rgba(0, 0, 0, 0.06)')};
  }
  
  @media (max-width: 768px) {
    padding: 12px 14px;
    margin-bottom: 6px;
    
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
  min-width: 0;
  font-size: 14px;
  
  @media (max-width: 768px) {
    font-size: 15px;
  }
`;

export const ChatItemMenuWrap = styled.div`
  position: relative;
  flex-shrink: 0;
`;

export const ChatItemMenuButton = styled.button<{ $visible?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 8px;
  background: transparent;
  color: #666;
  cursor: pointer;
  opacity: ${props => (props.$visible ? 1 : 0)};
  transition: opacity 0.15s ease, background 0.15s ease, color 0.15s ease;

  ${ChatItem}:hover & {
    opacity: 1;
  }

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    color: #333;
  }

  @media (max-width: 768px) {
    opacity: 1;
  }
`;

export const ChatItemMenu = styled.div`
  position: absolute;
  top: calc(100% + 6px);
  right: 0;
  min-width: 168px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
  padding: 6px;
  z-index: 120;
`;

export const ChatItemMenuOption = styled.button<{ $destructive?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${props => (props.$destructive ? '#c0392b' : '#333')};
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${props =>
      props.$destructive ? 'rgba(233, 20, 41, 0.08)' : 'rgba(0, 0, 0, 0.04)'};
  }

  svg {
    flex-shrink: 0;
    color: inherit;
  }
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
  flex: 1;
  min-height: 0;
  background-color: ${PAGE_BG};
  position: relative;
  width: 100%;
  overflow: hidden;
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
`;

export const AgentTopBar = styled.header<{ $compact?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 10px 20px;
  background: ${PAGE_BG};
  border-bottom: ${props => (props.$compact ? 'none' : '1px solid rgba(0, 0, 0, 0.06)')};
  z-index: 10;
  min-height: 52px;
  flex-shrink: 0;

  @media (max-width: 768px) {
    padding: 10px 16px;
  }
`;

export const ChatHeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  flex: 1;
  min-width: 0;
`;

export const ChatHeaderDivider = styled.div`
  width: 1px;
  height: 20px;
  background: rgba(0, 0, 0, 0.1);
  flex-shrink: 0;
`;

export const ChatPanelToggle = styled.button<{ $active?: boolean; $inSidebar?: boolean }>`
  display: flex;
  align-items: center;
  justify-content: center;
  width: ${props => (props.$inSidebar ? '58px' : '36px')};
  height: ${props => (props.$inSidebar ? '36px' : '36px')};
  border: 1px solid ${props => (props.$active ? 'rgba(0, 0, 0, 0.12)' : 'transparent')};
  border-radius: ${props => (props.$inSidebar ? '10px' : '10px')};
  background: ${props => (props.$active ? 'rgba(0, 0, 0, 0.04)' : 'transparent')};
  color: #555;
  cursor: pointer;
  flex-shrink: 0;
  transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease;

  svg {
    width: ${props => (props.$inSidebar ? '28px' : '20px')};
    height: ${props => (props.$inSidebar ? '20px' : '20px')};
  }

  &:hover {
    background: rgba(0, 0, 0, 0.06);
    border-color: rgba(0, 0, 0, 0.1);
    color: #222;
  }

  @media (max-width: 768px) {
    color: ${props => (props.$inSidebar ? '#ffffff' : '#555')};
    border-color: ${props => (props.$inSidebar ? 'rgba(255, 255, 255, 0.25)' : 'transparent')};
    background: ${props => (props.$inSidebar ? 'rgba(255, 255, 255, 0.12)' : 'transparent')};

    &:hover {
      background: ${props => (props.$inSidebar ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.06)')};
      border-color: ${props => (props.$inSidebar ? 'rgba(255, 255, 255, 0.35)' : 'rgba(0, 0, 0, 0.1)')};
      color: ${props => (props.$inSidebar ? '#ffffff' : '#222')};
    }
  }
`;

export const ChatSidebarHeaderActions = styled.div<{ $collapsed?: boolean }>`
  display: flex;
  align-items: center;
  gap: 8px;
  flex-shrink: 0;
  justify-content: ${props => (props.$collapsed ? 'center' : 'flex-end')};
`;

export const ChatSidebarHeaderLeft = styled.div`
  display: none;
`;

export const ChatHeader = styled.div`
  display: none;
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
  font-size: 15px;
  font-weight: 600;
  color: #1a1a1a;
  letter-spacing: -0.2px;
  flex: 1;
  min-width: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  padding-right: 12px;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

export const ChatTitleMenuWrap = styled.div`
  position: relative;
  flex: 1;
  min-width: 0;
  max-width: fit-content;
`;

export const ChatTitleMenuButton = styled.button`
  display: inline-flex;
  align-items: center;
  max-width: 100%;
  padding: 6px 4px 6px 12px;
  border: 1px solid transparent;
  border-radius: 12px;
  background: transparent;
  cursor: pointer;
  color: #1a1a1a;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover,
  &[aria-expanded='true'] {
    background: rgba(0, 0, 0, 0.04);
    border-color: rgba(0, 0, 0, 0.08);
  }
`;

export const ChatTitleMenuText = styled.span`
  font-size: 15px;
  font-weight: 600;
  letter-spacing: -0.02em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: min(480px, 50vw);
  line-height: 1.3;

  @media (max-width: 768px) {
    font-size: 14px;
    max-width: min(220px, 52vw);
  }
`;

export const ChatTitleMenuChevron = styled.span`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 30px;
  height: 28px;
  flex-shrink: 0;
  color: #666;
  margin-left: 4px;
  border-left: 1px solid rgba(0, 0, 0, 0.08);
`;

export const ChatTitleDropdown = styled.div`
  position: absolute;
  top: calc(100% + 8px);
  right: 0;
  min-width: 180px;
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.08);
  border-radius: 12px;
  box-shadow: 0 8px 28px rgba(0, 0, 0, 0.12);
  padding: 6px;
  z-index: 120;
`;

export const ChatTitleDropdownOption = styled.button<{ $destructive?: boolean }>`
  width: 100%;
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: none;
  background: transparent;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 500;
  color: ${props => (props.$destructive ? '#c0392b' : '#333')};
  cursor: pointer;
  text-align: left;

  &:hover {
    background: ${props =>
      props.$destructive ? 'rgba(233, 20, 41, 0.08)' : 'rgba(0, 0, 0, 0.04)'};
  }

  svg {
    flex-shrink: 0;
    color: inherit;
  }
`;

export const ChatTitleDropdownDivider = styled.div`
  height: 1px;
  margin: 4px 6px;
  background: rgba(0, 0, 0, 0.08);
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
  display: flex;
  align-items: center;
  gap: 12px;
  flex-shrink: 0;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

export const IconButton = styled.button`
  background: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  padding: 10px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s cubic-bezier(0.22, 1, 0.36, 1);

  &:hover {
    background: rgba(29, 185, 84, 0.08);
    color: #1DB954;
  }
  
  &:active {
    transform: scale(0.95);
  }
  
  @media (max-width: 768px) {
    padding: 8px;
    
    &.hide-mobile {
      display: none;
    }
  }
`;

export const ChatMessages = styled.div`
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  padding: 40px 32px 32px;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: ${PAGE_BG};
  
  scroll-behavior: smooth;
  
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }
  
  &.show-scrollbar::-webkit-scrollbar {
    display: block;
    width: 6px;
  }
  
  &.show-scrollbar::-webkit-scrollbar-thumb {
    background: rgba(0, 0, 0, 0.15);
    border-radius: 6px;
  }
  
  @media (max-width: 768px) {
    padding: 28px 16px 24px;
  }
`;

export const ChatThreadColumn = styled.div`
  ${chatThreadWidth}
  display: flex;
  flex-direction: column;
  gap: 32px;
  flex: 1;

  @media (max-width: 768px) {
    width: 100%;
    max-width: none;
    gap: 24px;
  }
`;

export const AssistantMessageBlock = styled.div`
  display: flex;
  flex-direction: column;
  width: 100%;
`;

export const MessageDivider = styled.div`
  width: 100%;
  height: 1px;
  margin-top: 28px;
  background: rgba(29, 185, 84, 0.22);

  @media (max-width: 768px) {
    margin-top: 20px;
  }
`;

export const MessageBubble = styled.div<{ isUser: boolean; isNew?: boolean }>`
  max-width: ${props => props.isUser ? 'min(560px, 72%)' : '100%'};
  width: ${props => props.isUser ? 'fit-content' : '100%'};
  padding: ${props => props.isUser ? '12px 18px' : '6px 0'};
  border-radius: ${props => props.isUser ? '22px' : '0'};
  background: ${props => props.isUser 
    ? 'linear-gradient(135deg, #1DB954 0%, #19a049 100%)' 
    : 'transparent'};
  color: ${props => props.isUser ? '#ffffff' : '#1a1a1a'};
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  font-size: ${props => (props.isUser ? '16px' : '18px')};
  line-height: ${props => (props.isUser ? '1.5' : '1.75')};
  word-wrap: break-word;
  box-shadow: ${props => props.isUser 
    ? '0 1px 4px rgba(29, 185, 84, 0.2)' 
    : 'none'};
  border: none;
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
    max-width: ${props => props.isUser ? 'min(360px, 88%)' : '100%'};
    padding: ${props => props.isUser ? '10px 16px' : '4px 0'};
    font-size: ${props => (props.isUser ? '16px' : '17px')};
    border-radius: ${props => props.isUser ? '20px' : '0'};
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
  display: inline-flex;
  align-items: center;
  padding: ${props => (props.isProcessing ? '10px 0' : '8px 0')};
  background-color: transparent;
  align-self: flex-start;
  border: none;
  box-shadow: none;
`;

export const AgentTypingSpinner = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1DB954;
  animation: agentLogoSpin 1.1s linear infinite;

  @keyframes agentLogoSpin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
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
  align-items: center;
  padding: 16px 32px 36px;
  background: ${PAGE_BG};
  flex-shrink: 0;
  z-index: 10;
  
  @media (max-width: 768px) {
    padding: 12px 16px 24px;
  }
`;

export const InputRow = styled.div`
  display: none;
`;

export const HelperText = styled.div`
  display: none;
`;

// Action buttons for empty state
export const CompactActionButtons = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  flex-wrap: wrap;
  animation: fadeIn 0.5s ease-out 0.15s both;
  
  @media (max-width: 768px) {
    gap: 8px;
  }
`;

export const CompactActionButton = styled.button`
  background: #ffffff;
  color: #5c5854;
  border: 1px solid #e8e6e1;
  border-radius: 999px;
  padding: 10px 16px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  transition: background 0.15s ease, border-color 0.15s ease;
  font-size: 14px;
  font-weight: 500;
  
  &:hover {
    background: #f5f4f0;
    border-color: #d4d0c8;
  }
  
  svg {
    font-size: 16px;
    color: #8a8580;
  }
  
  @media (max-width: 768px) {
    padding: 9px 14px;
    font-size: 13px;
  }
`;

export const Textarea = styled.textarea`
  flex: 1;
  width: 100%;
  padding: 18px 20px 8px;
  border: none;
  background: transparent;
  font-size: 16px;
  font-family: inherit;
  resize: none;
  min-height: 72px;
  max-height: 200px;
  overflow-y: auto;
  line-height: 1.55;
  color: #1a1a1a;
  box-sizing: border-box;
  
  &::placeholder {
    color: #a8a4a0;
  }
  
  &:focus {
    outline: none;
  }
  
  -ms-overflow-style: none;
  scrollbar-width: none;
  
  &::-webkit-scrollbar {
    display: none;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
  
  @media (max-width: 768px) {
    padding: 16px 16px 6px;
    font-size: 16px;
    min-height: 48px;
  }
`;

export const SendButton = styled.button`
  display: none;
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

// Modern gradient animation
const gradientShift = `
  @keyframes gradientShift {
    0%, 100% {
      background-position: 0% 50%;
    }
    50% {
      background-position: 100% 50%;
    }
  }
`;

export const CompactChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: stretch;
  justify-content: center;
  width: 100%;
  max-width: ${CLAUDE_LANDING_MAX}px;
  margin: 0 auto;
  padding: 24px 0 48px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
  position: relative;
  background: transparent;
  
  @media (max-width: 768px) {
    width: calc(100% - 32px);
    max-width: none;
    padding: 16px 0 32px;
  }
`;

export const ClaudeGreetingRow = styled.div`
  display: flex;
  align-items: center;
  gap: 14px;
  width: 100%;
  margin-bottom: 28px;
  animation: fadeIn 0.4s ease-out both;

  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(8px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @media (max-width: 768px) {
    gap: 12px;
    margin-bottom: 24px;
  }
`;

export const ClaudeGreetingIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  color: #1DB954;
  flex-shrink: 0;
`;

export const ClaudeGreetingText = styled.h1`
  font-family: 'Libre Baskerville', Georgia, 'Times New Roman', serif;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  font-weight: 400;
  color: #1a1a1a;
  margin: 0;
  letter-spacing: -0.02em;
  line-height: 1.2;
`;

export const CompactChatInput = styled.div`
  width: 100%;
  margin: 0 auto 24px;
  animation: fadeIn 0.45s ease-out 0.05s both;

  @media (max-width: 768px) {
    margin: 0 auto 20px;
  }
`;

export const InputRowWrapper = styled.div`
  position: relative;
  display: flex;
  flex-direction: column;
  ${chatThreadWidth}
  margin: 0 auto;

  @media (max-width: 768px) {
    width: 100%;
    max-width: none;
  }
`;

export const ClaudeInputCard = styled.div<{ $landing?: boolean }>`
  width: 100%;
  min-height: ${props => (props.$landing ? '200px' : '148px')};
  display: flex;
  flex-direction: column;
  justify-content: ${props => (props.$landing ? 'space-between' : 'flex-start')};
  background: #ffffff;
  border: 1px solid #e8e6e1;
  border-radius: 28px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.06);
  overflow: hidden;
  transition: border-color 0.2s ease, box-shadow 0.2s ease;

  &:focus-within {
    border-color: #d4d0c8;
    box-shadow: 0 8px 32px rgba(0, 0, 0, 0.09);
  }

  @media (max-width: 768px) {
    min-height: ${props => (props.$landing ? '176px' : '132px')};
    border-radius: 24px;
  }
`;

export const ClaudeTextarea = styled(Textarea)<{ $landing?: boolean }>`
  flex: ${props => (props.$landing ? '1' : '0 0 auto')};
  min-height: ${props => (props.$landing ? '128px' : '28px')};
  padding: ${props => (props.$landing ? '22px 24px 12px' : '20px 24px 8px')};
  font-size: ${props => (props.$landing ? '17px' : '18px')};
  line-height: 1.55;

  @media (max-width: 768px) {
    min-height: ${props => (props.$landing ? '112px' : '28px')};
    padding: ${props => (props.$landing ? '20px 20px 10px' : '18px 20px 6px')};
    font-size: 17px;
  }
`;

export const ClaudeInputToolbar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px 14px 18px;
  flex-shrink: 0;
  margin-top: auto;
`;

export const ClaudeToolbarGroup = styled.div`
  display: flex;
  align-items: center;
  gap: 4px;
`;

export const ClaudeIconButton = styled.button`
  background: transparent;
  border: none;
  color: #8a8580;
  cursor: pointer;
  padding: 8px;
  border-radius: 10px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.15s ease, color 0.15s ease;

  &:hover:not(:disabled) {
    background: rgba(0, 0, 0, 0.05);
    color: #5c5854;
  }

  &:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }
`;

export const ClaudeSendButton = styled.button`
  width: 44px;
  height: 44px;
  border: none;
  border-radius: 14px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease, transform 0.15s ease;
  background: ${props => (props.disabled ? '#e8e6e1' : '#1DB954')};
  color: ${props => (props.disabled ? '#a8a4a0' : '#ffffff')};

  &:hover:not(:disabled) {
    background: #19a049;
    transform: scale(1.04);
  }

  &:disabled {
    cursor: not-allowed;
  }

  @media (max-width: 768px) {
    width: 40px;
    height: 40px;
    border-radius: 12px;
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
  display: none;
`;

/* —— Rename chat modal —— */
export const RenameChatModalRoot = styled.div`
  position: fixed;
  inset: 0;
  z-index: 220;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 16px;
`;

export const RenameChatModalBackdrop = styled.button`
  position: absolute;
  inset: 0;
  border: none;
  padding: 0;
  margin: 0;
  background: rgba(0, 0, 0, 0.45);
  cursor: pointer;
`;

export const RenameChatModalPanel = styled.div`
  position: relative;
  z-index: 1;
  width: min(560px, calc(100vw - 32px));
  background: #ffffff;
  border: 1px solid rgba(0, 0, 0, 0.06);
  border-radius: 20px;
  box-shadow: 0 24px 64px rgba(0, 0, 0, 0.16);
  padding: 28px 28px 24px;
`;

export const RenameChatModalHeading = styled.h2`
  margin: 0 0 20px;
  font-size: 20px;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: #1a1a1a;
`;

export const RenameChatModalForm = styled.form`
  display: flex;
  flex-direction: column;
`;

export const RenameChatModalInput = styled.input`
  width: 100%;
  box-sizing: border-box;
  padding: 14px 16px;
  min-height: 52px;
  border: 1px solid #e5e2dc;
  border-radius: 14px;
  font-size: 16px;
  line-height: 1.4;
  color: #1a1a1a;
  background: #fafaf9;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, background 0.15s ease;

  &::placeholder {
    color: #a8a4a0;
  }

  &:focus {
    outline: none;
    background: #ffffff;
    border-color: #c9c5bf;
    box-shadow: 0 0 0 4px rgba(0, 0, 0, 0.06);
  }

  &:-webkit-autofill,
  &:-webkit-autofill:hover,
  &:-webkit-autofill:focus {
    -webkit-text-fill-color: #1a1a1a;
    box-shadow: 0 0 0 1000px #fafaf9 inset;
  }
`;

export const RenameChatModalActions = styled.div`
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  margin-top: 24px;
`;

export const RenameChatModalCancel = styled.button`
  padding: 11px 20px;
  min-width: 96px;
  border: 1px solid #e5e2dc;
  border-radius: 12px;
  background: #ffffff;
  color: #333;
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s ease, border-color 0.15s ease;

  &:hover {
    background: #f7f6f3;
    border-color: #d4d0c8;
  }
`;

export const RenameChatModalSave = styled.button`
  padding: 11px 22px;
  min-width: 96px;
  border: none;
  border-radius: 12px;
  background: #1a1a1a;
  color: #ffffff;
  font-size: 15px;
  font-weight: 600;
  cursor: pointer;
  transition: background 0.15s ease, opacity 0.15s ease;

  &:hover:not(:disabled) {
    background: #333333;
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
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
  max-width: min(560px, 72%) !important;
  width: fit-content !important;
  display: flex !important;
  flex-direction: row !important;
  align-items: stretch !important;
  gap: 14px !important;
  padding: 14px 16px !important;
  border-radius: 22px !important;
  background: linear-gradient(135deg, #1DB954 0%, #19a049 100%) !important;
  color: #fff !important;
  box-shadow: 0 2px 8px rgba(29, 185, 84, 0.25) !important;
  animation: ${p => (p.$isNew ? 'messageSlideIn 0.3s cubic-bezier(0.22, 1, 0.36, 1)' : 'none')} !important;
  
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
    max-width: 85% !important;
    padding: 10px 12px !important;
    border-radius: 18px !important;
  }
`;

export const UserSongPickCover = styled.img`
  width: 64px !important;
  height: 64px !important;
  border-radius: 8px !important;
  object-fit: cover !important;
  flex-shrink: 0 !important;
  background: rgba(255, 255, 255, 0.15) !important;
`;

export const UserSongPickCoverPlaceholder = styled.div`
  width: 64px !important;
  height: 64px !important;
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
  font-size: 16px !important;
  font-weight: 700 !important;
  line-height: 1.25 !important;
  color: #fff !important;
`;

export const UserSongPickArtist = styled.div`
  font-size: 14px !important;
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