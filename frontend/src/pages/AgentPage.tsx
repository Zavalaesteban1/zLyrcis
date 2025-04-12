import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { logout, getUserProfile, agent_song_request, agent_chat, getVideoStatus, fetchConversationHistory } from '../services/api';
// Import icons
import { CgProfile } from 'react-icons/cg';
import { IoHomeOutline } from 'react-icons/io5';
import { MdMusicNote, MdAdd, MdLogout, MdSend, MdClose, MdMenu } from 'react-icons/md';
import { FiUser, FiPlusCircle } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { BsArrowsExpand, BsArrowsCollapse, BsChat, BsChatDots } from 'react-icons/bs';
import { AiOutlineDelete, AiOutlineEdit, AiOutlineCheck } from 'react-icons/ai';

// Styled components (matching the style of other pages)
const AppLayout = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  color: #333;
`;

const Sidebar = styled.div<{ isOpen: boolean }>`
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

const SidebarToggle = styled.button`
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

const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  padding: 0 20px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
  display: flex;
  align-items: center;
`;

const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const NavItem = styled(Link)<{ active?: boolean }>`
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

const NavIcon = styled.span`
  margin-right: 10px;
  font-size: 18px;
  display: flex;
  align-items: center;
`;

const MainContent = styled.main<{ sidebarOpen: boolean }>`
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

const ChatSidebar = styled.div<{ isOpen: boolean }>`
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

const ChatListHeader = styled.div`
  padding: 20px;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const NewChatButton = styled.button`
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

const ChatList = styled.div`
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

const ChatItem = styled.div<{ active?: boolean }>`
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

const ChatItemTitle = styled.div`
  font-weight: 500;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1;
`;

const ChatItemDelete = styled.button`
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

const ChatItemEdit = styled.button`
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

const ChatItemActions = styled.div`
  display: flex;
  align-items: center;
`;

const ChatTitleInput = styled.input`
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

const SaveButton = styled.button`
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

const EditForm = styled.form`
  display: flex;
  flex: 1;
  align-items: center;
`;

const ChatSidebarToggle = styled.button`
  position: fixed;
  top: 20px;
  left: 260px; /* Always position next to the main sidebar */
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
    left: 20px;
  }
`;

const ChatContainer = styled.div`
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

const ChatHeader = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  align-items: center;
  background-color: white;
  position: sticky;
  top: 0;
  z-index: 10;
`;

const ChatHeaderIcon = styled.div`
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

const ChatHeaderTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: #333;
`;

const ChatHeaderSubtitle = styled.div`
  font-size: 13px;
  color: #777;
  margin-top: 2px;
`;

const ChatHeaderControls = styled.div`
  margin-left: auto;
  display: flex;
  align-items: center;
  gap: 12px;
`;

const IconButton = styled.button`
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

const ChatMessages = styled.div`
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

const MessageBubble = styled.div<{ isUser: boolean; isNew?: boolean }>`
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
const GlobalStyle = createGlobalStyle`
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

const AssistantTypingIndicator = styled.div<{ isProcessing?: boolean }>`
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

const DotContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const Dot = styled.div<{ isProcessing?: boolean }>`
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

const ChatInput = styled.div`
  display: flex;
  flex-direction: column;
  padding: 24px 28px;
  border-top: 1px solid #eee;
  background-color: white;
  position: sticky;
  bottom: 0;
  z-index: 10;
`;

const InputRow = styled.div`
  display: flex;
  align-items: flex-end;
  width: 100%;
  max-width: 900px;
  margin: 0 auto;
`;

const HelperText = styled.div`
  font-size: 12px;
  color: #888;
  margin-top: 4px;
  padding-left: 12px;
  align-self: flex-start;
`;

const Textarea = styled.textarea`
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

const SendButton = styled.button`
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

const ProcessingLabel = styled.div`
  font-size: 13px;
  color: #238750;
  margin-bottom: 4px;
  font-weight: 500;
`;

const UserActions = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #1DB954;
`;

const UserName = styled.span`
  font-weight: 500;
  color: #333;
`;

// New component for chat history
interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  date: Date;
}

// Message interface
interface Message {
  text: string;
  isUser: boolean;
  isProcessing?: boolean;
}

// Constants for localStorage keys
const CONVERSATION_STORAGE_KEY = 'agent_conversation_messages';
const CONVERSATION_ID_STORAGE_KEY = 'agent_conversation_id';
const CURRENT_JOB_ID_STORAGE_KEY = 'agent_current_job_id';
const CONVERSATIONS_LIST_STORAGE_KEY = 'agent_conversations_list';

// Helper to get conversation-specific storage key
const getConversationMessagesKey = (id: string) => `${CONVERSATION_STORAGE_KEY}_${id}`;

// Small utility component for date formatting
const formatDate = () => {
  const now = new Date();
  return now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

// Utility to generate a snippet from conversation
const getConversationTitle = (messages: Message[]): string => {
  // Find the first user message
  const firstUserMessage = messages.find(m => m.isUser);
  if (!firstUserMessage) return "New conversation";
  
  // Truncate to 30 characters
  return firstUserMessage.text.length > 30 
    ? firstUserMessage.text.substring(0, 30) + '...'
    : firstUserMessage.text;
};

// Add an overlay component for mobile
const MobileOverlay = styled.div<{ visible: boolean }>`
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

// Final enhancements to match Claude's interface more closely
const CompactChatContainer = styled.div`
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

// Update header for a cleaner look
const CompactChatHeader = styled.div`
  display: flex;
  align-items: center;
  padding: 22px 26px;
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  background-color: #fcfcfc;
`;

// Make the title more prominent
const CompactChatTitle = styled.div`
  font-weight: 600;
  font-size: 18px;
  color: #333;
  letter-spacing: -0.2px;
`;

// Enhanced input area
const CompactChatInput = styled.div`
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

// Add back the CompactChatIcon component
const CompactChatIcon = styled.div`
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

const AgentPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi! I'm your lyric video assistant. I can create lyric videos and answer questions about music. What can I help you with today?", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [currentDate] = useState(formatDate());
  // Add a ref to store the interval ID
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isRestoringConversation, setIsRestoringConversation] = useState(true);
  
  // Add a ref for the textarea element
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Add state for showing/hiding scrollbars
  const [showScrollbars, setShowScrollbars] = useState<boolean>(false);
  
  // Initialize window width state
  const [windowWidth, setWindowWidth] = useState<number>(window.innerWidth);
  
  // Add state for sidebar toggle - always true by default to keep the sidebar visible
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(true);
  
  // Add state for conversation history sidebar toggle
  const [chatSidebarOpen, setChatSidebarOpen] = useState<boolean>(false);
  
  // Add state for conversation list
  const [conversations, setConversations] = useState<Conversation[]>([]);
  
  // Add this new state variable
  const [isCompactMode, setIsCompactMode] = useState<boolean>(true);
  
  // Add state to track newest message for animation
  const [newestMessageIdx, setNewestMessageIdx] = useState<number>(-1);
  
  // Add state to track which conversation is being edited
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState<string>('');
  
  // Reference for the editing input field
  const editInputRef = useRef<HTMLInputElement>(null);
  
  // Set theme for styled components with proper types
  const theme = { 
    sidebarOpen, 
    chatSidebarOpen,
    // Fix for ChatSidebarToggle's left position
    get chatSidebarToggleLeft() {
      return sidebarOpen ? '260px' : '20px';
    }
  };
  
  // Track window resize to handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      
      // Auto-collapse sidebar on small screens
      if (newWidth <= 768 && sidebarOpen) {
        setSidebarOpen(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
    
    // Initial call
    handleResize();
    
    // Cleanup
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [sidebarOpen]);
  
  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    // Don't save if we're in the process of restoring from localStorage/backend
    if (isRestoringConversation) return;
    
    // Only save if there are messages beyond the initial greeting
    if (messages.length > 1) {
      if (conversationId) {
        // Save messages to conversation-specific storage key
        localStorage.setItem(getConversationMessagesKey(conversationId), JSON.stringify(messages));
        console.log(`Saved ${messages.length} messages for conversation ${conversationId} to localStorage`);
        
        // Update conversations list
        updateConversationsList(conversationId, messages);
      } else {
        console.warn('Tried to save messages but no conversation ID is set');
      }
    }
  }, [messages, isRestoringConversation, conversationId]);
  
  // Save conversation ID when it changes
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(CONVERSATION_ID_STORAGE_KEY, conversationId);
      console.log('Saved conversation ID to localStorage:', conversationId);
      
      // Debug: log the current conversations list
      const activeConv = conversations.find(c => c.id === conversationId);
      console.log('Current active conversation:', activeConv ? activeConv.title : 'Not found in list');
      
      // Force re-render of conversation list to ensure active state is reflected
      if (conversations.length > 0) {
        setConversations([...conversations]);
      }
    }
  }, [conversationId, conversations]);
  
  // Save current job ID when it changes
  useEffect(() => {
    if (currentJobId) {
      localStorage.setItem(CURRENT_JOB_ID_STORAGE_KEY, currentJobId);
      console.log('Saved current job ID to localStorage:', currentJobId);
    } else {
      // Remove from localStorage when it's null (job completed or failed)
      localStorage.removeItem(CURRENT_JOB_ID_STORAGE_KEY);
    }
  }, [currentJobId]);
  
  // Load conversations list on mount
  useEffect(() => {
    const loadConversationsList = () => {
      const savedConversations = localStorage.getItem(CONVERSATIONS_LIST_STORAGE_KEY);
      if (savedConversations) {
        try {
          const parsedConversations = JSON.parse(savedConversations) as Conversation[];
          if (parsedConversations.length > 0) {
            setConversations(parsedConversations);
            console.log('Loaded conversations list:', parsedConversations.length, 'conversations');
          }
        } catch (error) {
          console.error('Error parsing saved conversations list:', error);
        }
      }
    };
    
    loadConversationsList();
  }, []);
  
  // Update conversations list
  const updateConversationsList = (id: string, msgs: Message[]) => {
    // Skip empty conversations or those with just the welcome message
    if (msgs.length <= 1) return;
    
    // Check if conversation already exists in list
    const existingIndex = conversations.findIndex(c => c.id === id);
    
    if (existingIndex >= 0) {
      // Update existing conversation
      const updatedConversations = [...conversations];
      updatedConversations[existingIndex] = {
        ...updatedConversations[existingIndex],
        title: updatedConversations[existingIndex].title || getConversationTitle(msgs),
        lastMessage: msgs[msgs.length - 1].text,
        date: new Date()
      };
      
      // Move this conversation to the top of the list (only if it's not already there)
      if (existingIndex > 0) {
        const updatedConversation = updatedConversations.splice(existingIndex, 1)[0];
        updatedConversations.unshift(updatedConversation);
      }
      
      setConversations(updatedConversations);
      localStorage.setItem(CONVERSATIONS_LIST_STORAGE_KEY, JSON.stringify(updatedConversations));
      
      // Log to help with debugging
      console.log('Updated existing conversation:', id, 'at index', existingIndex);
    } else {
      // Add new conversation at the beginning of the list
      const newConversation: Conversation = {
        id,
        title: getConversationTitle(msgs),
        lastMessage: msgs[msgs.length - 1].text,
        date: new Date()
      };
      const updatedConversations = [newConversation, ...conversations];
      setConversations(updatedConversations);
      localStorage.setItem(CONVERSATIONS_LIST_STORAGE_KEY, JSON.stringify(updatedConversations));
      
      // Log to help with debugging
      console.log('Added new conversation:', id);
    }
  };
  
  // Check for ongoing video generations when component mounts
  useEffect(() => {
    const checkForOngoingGenerations = () => {
      const savedJobId = localStorage.getItem(CURRENT_JOB_ID_STORAGE_KEY);
      if (savedJobId) {
        console.log('Found ongoing video generation:', savedJobId);
        setCurrentJobId(savedJobId);
        
        // Check if we already have a processing indicator in messages
        const hasProcessingIndicator = messages.some(msg => msg.isProcessing);
        
        if (!hasProcessingIndicator) {
          setMessages(prev => [...prev, {
            text: '...',
            isUser: false,
            isProcessing: true
          }]);
        }
      }
    };
    
    // Only run after conversation is restored
    if (!isRestoringConversation) {
      checkForOngoingGenerations();
    }
  }, [isRestoringConversation, messages]);
  
  // Attempt to restore conversation when component mounts
  useEffect(() => {
    const restoreConversation = async () => {
      try {
        // Get saved conversation ID
        const savedConversationId = localStorage.getItem(CONVERSATION_ID_STORAGE_KEY);
        
        if (savedConversationId) {
          console.log('Found saved conversation ID:', savedConversationId);
          
          setConversationId(savedConversationId);
          console.log('Restored conversation ID from localStorage:', savedConversationId);
          
          // Try to fetch conversation from backend first
          try {
            console.log('Fetching conversation history from backend...');
            const history = await fetchConversationHistory(savedConversationId);
            console.log('Fetched conversation from backend:', history);
            
            if (history.messages && history.messages.length > 0) {
              // Convert backend message format to our frontend format
              const convertedMessages: Message[] = history.messages.map(msg => ({
                text: msg.content,
                isUser: msg.role === 'user',
                isProcessing: false
              }));
              
              // Add our welcome message at the beginning if it's not there
              const hasWelcomeMessage = convertedMessages.some(
                msg => !msg.isUser && msg.text.includes("I'm your lyric video assistant")
              );
              
              const finalMessages = hasWelcomeMessage 
                ? convertedMessages
                : [messages[0], ...convertedMessages];
              
              setMessages(finalMessages);
              console.log('Restored conversation from backend:', finalMessages.length, 'messages');
              
              // Also save to localStorage for future use
              localStorage.setItem(getConversationMessagesKey(savedConversationId), JSON.stringify(finalMessages));
            } else {
              // If no messages from backend, try localStorage
              console.log('No messages from backend, falling back to localStorage');
              fallbackToLocalStorage(savedConversationId);
            }
          } catch (error) {
            console.error('Error fetching conversation history:', error);
            // Fallback to localStorage if backend fetch fails
            fallbackToLocalStorage(savedConversationId);
          }
        } else {
          // If no saved conversation ID, check for any saved conversations
          console.log('No saved conversation ID, checking for any saved messages');
          
          // First try the generic storage key (for backward compatibility)
          const savedGenericMessages = localStorage.getItem(CONVERSATION_STORAGE_KEY);
          if (savedGenericMessages) {
            try {
              const parsedMessages = JSON.parse(savedGenericMessages) as Message[];
              if (parsedMessages.length > 0) {
                setMessages(parsedMessages);
                console.log('Restored conversation from generic localStorage key:', parsedMessages.length, 'messages');
                
                // Generate a new conversation ID for these messages
                const newId = `migrate-${Date.now()}`;
                console.log(`Migrating generic messages to conversation ID: ${newId}`);
                setConversationId(newId);
                localStorage.setItem(CONVERSATION_ID_STORAGE_KEY, newId);
                
                // Save to conversation-specific key
                localStorage.setItem(getConversationMessagesKey(newId), JSON.stringify(parsedMessages));
                
                // Create a new conversation in the list
                updateConversationsList(newId, parsedMessages);
                
                // Clean up old storage
                localStorage.removeItem(CONVERSATION_STORAGE_KEY);
              }
            } catch (error) {
              console.error('Error parsing saved messages from generic key:', error);
            }
          }
        }
      } catch (error) {
        console.error('Error restoring conversation:', error);
      } finally {
        setIsRestoringConversation(false);
      }
    };
    
    const fallbackToLocalStorage = (id?: string) => {
      const savedConversationId = id || localStorage.getItem(CONVERSATION_ID_STORAGE_KEY);
      
      if (!savedConversationId) {
        console.warn('No conversation ID available for localStorage fallback');
        return;
      }
      
      console.log(`Attempting to restore conversation ${savedConversationId} from localStorage`);
      // Check for saved messages in localStorage using conversation-specific key
      const savedMessages = localStorage.getItem(getConversationMessagesKey(savedConversationId));
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages) as Message[];
          if (parsedMessages.length > 0) {
            setMessages(parsedMessages);
            console.log(`Restored ${parsedMessages.length} messages for conversation ${savedConversationId} from localStorage`);
          }
        } catch (error) {
          console.error(`Error parsing saved messages for conversation ${savedConversationId}:`, error);
        }
      } else {
        console.log(`No saved messages found for conversation ${savedConversationId}`);
      }
    };
    
    restoreConversation();
    
    // Cleanup function to save conversation when component unmounts
    return () => {
      if (messages.length > 1 && conversationId) {
        localStorage.setItem(getConversationMessagesKey(conversationId), JSON.stringify(messages));
        console.log(`Saved ${messages.length} messages for conversation ${conversationId} to localStorage on unmount`);
      }
    };
  }, []);
  
  // Fetch user data on component mount
  // useEffect(() => {
  //   const fetchUserData = async () => {
  //     try {
  //       const data = await getUserProfile();
  //       setUserData(data);
  //     } catch (error) {
  //       console.error('Error fetching user data:', error);
  //     }
  //   };
    
  //   fetchUserData();
  // }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Clean up interval on component unmount or when job changes
  useEffect(() => {
    // Start polling if currentJobId is set
    if (currentJobId) {
      startCheckingJobStatus(currentJobId);
    }
    
    // Cleanup function
    return () => {
      if (intervalRef.current) {
        console.log("Cleaning up interval on unmount or job change");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentJobId]);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    setInput('');
    
    // Add the user message
    setMessages(prev => {
      const newMessages = [...prev, { text: userMessage, isUser: true }];
      // Set the index of the newest message for animation
      setNewestMessageIdx(newMessages.length - 1);
      return newMessages;
    });
    
    // Simply set isCompactMode to false - the useEffect will handle focusing
    if (isCompactMode) {
      setIsCompactMode(false);
    }
    
    setIsLoading(true);
    
    // Add a typing indicator
    setMessages(prev => [...prev, { text: '...', isUser: false }]);
    
    try {
      // Use the agent_chat endpoint for all conversations
      console.log('Sending message with conversation ID:', conversationId);
      const response = await agent_chat(userMessage, conversationId);
      
      // Remove typing indicator
      setMessages(prev => prev.slice(0, -1));
      
      // Save the conversation ID for future messages
      if (response.conversation_id && (response.conversation_id !== conversationId || conversationId?.startsWith('temp-'))) {
        const prevId = conversationId;
        console.log('Updating conversation ID:', prevId, 'to', response.conversation_id);
        
        // Create message array for conversation list (include the current message)
        const currentMessages = [...messages.filter(msg => msg.text !== '...'), 
                               { text: userMessage, isUser: true }];
        
        // Add the assistant response to our message array for the conversation list
        if (response.message) {
          currentMessages.push({ text: response.message, isUser: false });
        } else if (response.song_request_data) {
          currentMessages.push({ 
            text: `I'm creating a lyric video for "${response.song_request_data?.title}" by ${response.song_request_data?.artist}. I'll let you know when it's ready!`, 
            isUser: false 
          });
        }
        
        // Check if we're replacing a temporary ID
        if (prevId && prevId.startsWith('temp-')) {
          // Find the temp conversation in the list
          const tempIndex = conversations.findIndex(c => c.id === prevId);
          
          // If we found it, replace it with the new one
          if (tempIndex >= 0) {
            console.log(`Replacing temp conversation at index ${tempIndex} with permanent ID ${response.conversation_id}`);
            
            const updatedConversations = [...conversations];
            
            // Replace the temp conversation with the permanent one
            updatedConversations[tempIndex] = {
              id: response.conversation_id,
              title: updatedConversations[tempIndex].title, // Keep the existing title
              lastMessage: currentMessages[currentMessages.length - 1].text,
              date: new Date()
            };
            
            // Move this conversation to the top if it's not already there
            if (tempIndex > 0) {
              const conversation = updatedConversations.splice(tempIndex, 1)[0];
              updatedConversations.unshift(conversation);
            }
            
            // Update conversations list FIRST for UI consistency
            setConversations(updatedConversations);
            localStorage.setItem(CONVERSATIONS_LIST_STORAGE_KEY, JSON.stringify(updatedConversations));
            
            // NOW update the conversation ID (order matters for UI reactivity)
            setConversationId(response.conversation_id);
            localStorage.setItem(CONVERSATION_ID_STORAGE_KEY, response.conversation_id);
            
            // Save messages with the new conversation ID
            localStorage.setItem(getConversationMessagesKey(response.conversation_id), JSON.stringify(currentMessages));
            
            console.log(`Successfully updated temp conversation to permanent ID: ${response.conversation_id}`);
          } else {
            console.warn(`Could not find temp conversation with ID ${prevId} - creating new entry`);
            
            // If we couldn't find the temp conversation (shouldn't happen), just add it
            const newConversation: Conversation = {
              id: response.conversation_id,
              title: getConversationTitle(currentMessages),
              lastMessage: currentMessages[currentMessages.length - 1].text,
              date: new Date()
            };
            
            const finalConversations = [newConversation, ...conversations];
            
            // Update conversations list FIRST for UI consistency
            setConversations(finalConversations);
            localStorage.setItem(CONVERSATIONS_LIST_STORAGE_KEY, JSON.stringify(finalConversations));
            
            // NOW update the conversation ID
            setConversationId(response.conversation_id);
            localStorage.setItem(CONVERSATION_ID_STORAGE_KEY, response.conversation_id);
            
            // Save messages with the new conversation ID
            localStorage.setItem(getConversationMessagesKey(response.conversation_id), JSON.stringify(currentMessages));
          }
        } else {
          // Regular update (not a temp ID but still a new ID)
          console.log(`Updating conversation ID from ${prevId} to ${response.conversation_id}`);
          
          // Update conversations list
          updateConversationsList(response.conversation_id, currentMessages);
          
          // Update conversation ID after updating the list
          setConversationId(response.conversation_id);
          localStorage.setItem(CONVERSATION_ID_STORAGE_KEY, response.conversation_id);
          
          // Save messages with the new conversation ID
          localStorage.setItem(getConversationMessagesKey(response.conversation_id), JSON.stringify(currentMessages));
        }
      } else {
        // Even if the conversation ID doesn't change, update the conversation list with latest messages
        if (conversationId) {
          console.log(`Conversation ID unchanged (${conversationId}), updating conversation messages`);
          
          const currentMessages = [...messages.filter(msg => msg.text !== '...'), 
                                 { text: userMessage, isUser: true }];
          
          if (response.message) {
            currentMessages.push({ text: response.message, isUser: false });
          }
          
          updateConversationsList(conversationId, currentMessages);
          
          // Save updated messages to localStorage
          localStorage.setItem(getConversationMessagesKey(conversationId), JSON.stringify(currentMessages));
        }
      }
      
      // Handle song request confirmation
      if (response.is_song_request && response.song_request_data) {
        // First, clear any existing processing indicators to avoid duplicates
        setMessages(prev => prev.filter(msg => !msg.isProcessing));
        
        // Set the new job ID
        setCurrentJobId(response.song_request_data.job_id);
        
        // Add the assistant's response
        setMessages(prev => {
          const newMessages = [...prev, { 
            text: response.message || `I'm creating a lyric video for "${response.song_request_data?.title}" by ${response.song_request_data?.artist}. I'll let you know when it's ready!`, 
            isUser: false 
          }];
          // Set the index of the newest message for animation
          setNewestMessageIdx(newMessages.length - 1);
          return newMessages;
        });
        
        // Add processing indicator after the confirmation message
        setMessages(prev => [...prev, { 
          text: '...', 
          isUser: false,
          isProcessing: true  // Mark as processing indicator
        }]);
        
        // The polling will start due to the useEffect with currentJobId dependency
      } else {
        // For regular responses
        setMessages(prev => {
          const newMessages = [...prev, { 
            text: response.message, 
            isUser: false 
          }];
          // Set the index of the newest message for animation
          setNewestMessageIdx(newMessages.length - 1);
          return newMessages;
        });
      }
      
    } catch (error) {
      console.error('Error:', error);
      // Remove typing indicator
      setMessages(prev => prev.slice(0, -1));
      
      // Add error message
      let errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      
      setMessages(prev => {
        const newMessages = [...prev, { 
          text: errorMessage, 
          isUser: false 
        }];
        // Set the index of the newest message for animation
        setNewestMessageIdx(newMessages.length - 1);
        return newMessages;
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  // Modify handleKeyPress to also switch from compact to expanded mode
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Shift+Enter for line breaks
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent the default behavior (new line)
      handleSend(); // Send the message
    }
    // Shift+Enter will add a new line naturally
  };
  
  // Function to check job status and notify when complete
  const startCheckingJobStatus = (jobId: string) => {
    if (!jobId) return;
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Keep track of whether we're still polling
    let isPolling = true;
    
    const checkStatus = async () => {
      try {
        console.log(`Checking status for job: ${jobId}`);
        const statusResponse = await getVideoStatus(jobId);
        console.log(`Job status: ${statusResponse.status}`);
        
        // If we stopped polling while the request was in progress, don't update anything
        if (!isPolling) return;
        
        if (statusResponse.status === 'completed') {
          // Remove the processing indicator
          setMessages(prev => prev.filter(msg => !msg.isProcessing));
          
          // Video is ready - notify the user
          setMessages(prev => [...prev, { 
            text: "Great news! Your lyric video is now ready. You can view it in the My Songs section.", 
            isUser: false 
          }]);
          
          // Clear the interval and mark polling as stopped
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            isPolling = false;
          }
          
          // Clear the job ID to prevent further checks
          setCurrentJobId(null);
          
        } else if (statusResponse.status === 'failed') {
          // Remove the processing indicator
          setMessages(prev => prev.filter(msg => !msg.isProcessing));
          
          // Video generation failed
          setMessages(prev => [...prev, { 
            text: "I'm sorry, but there was an issue generating your lyric video. The error was: " + 
                  (statusResponse.error || "Unknown error"), 
            isUser: false 
          }]);
          
          // Clear the interval and mark polling as stopped
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            isPolling = false;
          }
          
          // Clear the job ID to prevent further checks
          setCurrentJobId(null);
        }
        // If still processing, keep the processing indicator and continue polling
      } catch (error) {
        console.error('Error checking video status:', error);
        
        // If we stopped polling while the request was in progress, don't update anything
        if (!isPolling) return;
        
        // Remove the processing indicator on error
        setMessages(prev => prev.filter(msg => !msg.isProcessing));
        
        // Add error message so user knows something went wrong
        setMessages(prev => [...prev, { 
          text: "I'm having trouble checking on your video status. Please check the My Songs section to see if it's ready.", 
          isUser: false 
        }]);
        
        // Clear interval on error to prevent infinite errors
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          isPolling = false;
        }
        
        // Clear the job ID to prevent further checks
        setCurrentJobId(null);
      }
    };
    
    // Increase polling interval from 5 to 10 seconds to reduce network requests
    intervalRef.current = setInterval(checkStatus, 10000);
    
    // Make an immediate check
    checkStatus();
  };
  
  // Function to auto-resize the textarea based on content
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to scrollHeight to fit the content
    // but cap it at max-height via CSS
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  };
  
  // Listen for input changes to resize the textarea
  useEffect(() => {
    autoResizeTextarea();
  }, [input]);
  
  // Toggle scrollbar visibility
  const toggleScrollbars = () => {
    setShowScrollbars(prev => !prev);
    // Optionally save preference to localStorage
    localStorage.setItem('agent_show_scrollbars', (!showScrollbars).toString());
  };
  
  // Load scrollbar preference on mount
  useEffect(() => {
    const scrollbarPreference = localStorage.getItem('agent_show_scrollbars');
    if (scrollbarPreference !== null) {
      setShowScrollbars(scrollbarPreference === 'true');
    }
  }, []);
  
  // Modify the handleNewChat function to automatically go into edit mode for the new conversation
  const handleNewChat = () => {
    console.log('Creating new chat...');
    
    // Save current conversation if it has messages and a valid ID
    if (messages.length > 1 && conversationId) {
      console.log(`Saving current conversation (${conversationId}) before creating new one`);
      updateConversationsList(conversationId, messages);
    }
    
    // Generate a temporary conversation ID (will be replaced when the API responds)
    const tempConversationId = `temp-${Date.now()}`;
    console.log(`Generated temporary ID for new conversation: ${tempConversationId}`);
    
    // Reset conversation state
    const initialMessage = { 
      text: "Hi! I'm your lyric video assistant. I can create lyric videos and answer questions about music. What can I help you with today?", 
      isUser: false 
    };
    
    // Create a new conversation in the list FIRST (for UI consistency)
    const newConversation: Conversation = {
      id: tempConversationId,
      title: "New conversation",
      lastMessage: initialMessage.text,
      date: new Date()
    };
    
    // Add to the beginning of the list
    const updatedConversations = [newConversation, ...conversations];
    setConversations(updatedConversations);
    localStorage.setItem(CONVERSATIONS_LIST_STORAGE_KEY, JSON.stringify(updatedConversations));
    
    // Now update messages and conversation ID
    setMessages([initialMessage]);
    setConversationId(tempConversationId);
    
    // Update localStorage with the temp ID and initial message
    localStorage.setItem(CONVERSATION_ID_STORAGE_KEY, tempConversationId);
    localStorage.setItem(getConversationMessagesKey(tempConversationId), JSON.stringify([initialMessage]));
    
    // Reset to compact mode to start fresh
    setIsCompactMode(true);
    
    // Open chat sidebar if on desktop
    if (windowWidth > 768) {
      setChatSidebarOpen(true);
    }
    
    // Put the conversation in edit mode immediately
    setEditingConversationId(tempConversationId);
    setEditingTitle(""); // Clear the edit field to show the placeholder
    
    // Focus on the input field with a slight delay to allow transition
    setTimeout(() => {
      if (windowWidth > 768) {
        // Focus on edit input if sidebar is open
        if (editInputRef.current) {
          editInputRef.current.focus();
        }
      } else {
        // Focus on chat input on mobile
        textareaRef.current?.focus();
      }
    }, 200);
    
    console.log('New chat created successfully');
  };
  
  // Check for existing conversation on load and set compact mode accordingly
  useEffect(() => {
    // After restoring conversation, determine if we should be in compact mode
    if (!isRestoringConversation) {
      // If we have more than the initial greeting message, or if we have a job in progress,
      // or if we have a conversation ID, we should not be in compact mode
      if (messages.length > 1 || currentJobId || conversationId) {
        setIsCompactMode(false);
      }
    }
  }, [isRestoringConversation, messages.length, currentJobId, conversationId]);
  
  // Update the handleLoadConversation function to ensure it switches to expanded mode
  const handleLoadConversation = (id: string) => {
    console.log(`Loading conversation: ${id}, current conversationId: ${conversationId}`);
    
    // Don't reload if we're already viewing this conversation
    if (id === conversationId) {
      console.log('Already viewing this conversation, just closing sidebar on mobile');
      // Just close the sidebar on mobile
      if (windowWidth <= 768) {
        setChatSidebarOpen(false);
      }
      return;
    }
    
    // Save current conversation if it has messages
    if (messages.length > 1 && conversationId && conversationId !== id) {
      console.log('Saving current conversation before loading new one');
      updateConversationsList(conversationId, messages);
    }
    
    // Check if the conversation exists in our list
    const conversationExists = conversations.some(c => c.id === id);
    if (!conversationExists) {
      console.error(`Attempted to load non-existent conversation ID: ${id}`);
      return;
    }
    
    // First update the UI to make conversation visibly active immediately
    const conversation = conversations.find(c => c.id === id);
    console.log(`Setting active conversation ID to: ${id} (${conversation?.title})`);
    
    // Switch to expanded mode when loading a conversation
    setIsCompactMode(false);
    
    // Clear current messages and show loading state
    const loadingMessages = [
      { text: "Hi! I'm your lyric video assistant. I can create lyric videos and answer questions about music. What can I help you with today?", isUser: false },
      { text: "Loading conversation...", isUser: false }
    ];
    
    // Update active conversation with loading state
    updateActiveConversation(id, loadingMessages);
    
    // Close chat sidebar on mobile
    if (windowWidth <= 768) {
      setChatSidebarOpen(false);
    }
    
    // Try to fetch conversation from backend
    fetchConversationHistory(id)
      .then(history => {
        console.log(`Successfully loaded conversation ${id} from backend:`, history);
        
        // Double-check we're still on the same conversation (user might have changed during fetch)
        if (id !== conversationId) {
          console.log(`Conversation changed during fetch, aborting load of ${id}`);
          return;
        }
        
        if (history.messages && history.messages.length > 0) {
          // Convert backend message format to our frontend format
          const convertedMessages: Message[] = history.messages.map(msg => ({
            text: msg.content,
            isUser: msg.role === 'user',
            isProcessing: false
          }));
          
          // Add our welcome message at the beginning if it's not there
          const hasWelcomeMessage = convertedMessages.some(
            msg => !msg.isUser && msg.text.includes("I'm your lyric video assistant")
          );
          
          const finalMessages = hasWelcomeMessage 
            ? convertedMessages
            : [{ text: "Hi! I'm your lyric video assistant. I can create lyric videos and answer questions about music. What can I help you with today?", isUser: false }, ...convertedMessages];
          
          // Update the active conversation with the loaded messages
          updateActiveConversation(id, finalMessages);
          console.log('Loaded conversation from backend:', finalMessages.length, 'messages');
        } else {
          // No messages from backend
          console.warn('No messages in conversation history from backend');
          const defaultMessages = [
            { text: "Hi! I'm your lyric video assistant. I can create lyric videos and answer questions about music. What can I help you with today?", isUser: false }
          ];
          updateActiveConversation(id, defaultMessages);
        }
      })
      .catch(error => {
        console.error('Error loading conversation:', error);
        
        // Still ensure this conversation remains selected even if loading failed
        // We'll try loading from localStorage instead
        console.log('Trying to load conversation from localStorage as fallback');
        try {
          const savedMessages = localStorage.getItem(getConversationMessagesKey(id));
          if (savedMessages) {
            const parsedMessages = JSON.parse(savedMessages) as Message[];
            if (parsedMessages.length > 0) {
              updateActiveConversation(id, parsedMessages);
              console.log('Successfully loaded conversation from localStorage fallback');
              return;
            }
          }
        } catch (err) {
          console.error('Failed to load from localStorage fallback:', err);
        }
        
        // Show error message if all attempts failed
        const errorMessages = [
          { text: "Hi! I'm your lyric video assistant. I can create lyric videos and answer questions about music. What can I help you with today?", isUser: false },
          { text: "I couldn't load the previous conversation. Let's start a new one!", isUser: false }
        ];
        updateActiveConversation(id, errorMessages);
      });
    
    // Scroll to bottom of messages
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 300);
  };
  
  // Delete a conversation
  const handleDeleteConversation = (id: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent triggering the load conversation action
    
    // Filter out the conversation from the list
    const updatedConversations = conversations.filter(c => c.id !== id);
    setConversations(updatedConversations);
    localStorage.setItem(CONVERSATIONS_LIST_STORAGE_KEY, JSON.stringify(updatedConversations));
    
    // Handle the case when the currently viewed conversation is being deleted
    if (conversationId === id) {
      // If there are other conversations, load the first one
      if (updatedConversations.length > 0) {
        const firstConversationId = updatedConversations[0].id;
        
        // Update the conversation ID
        setConversationId(firstConversationId);
        localStorage.setItem(CONVERSATION_ID_STORAGE_KEY, firstConversationId);
        
        // Load the conversation from the backend
        fetchConversationHistory(firstConversationId)
          .then(history => {
            if (history.messages && history.messages.length > 0) {
              // Convert backend message format to frontend format
              const convertedMessages = history.messages.map(msg => ({
                text: msg.content,
                isUser: msg.role === 'user',
                isProcessing: false
              }));
              
              // Add welcome message if needed
              const hasWelcomeMessage = convertedMessages.some(
                msg => !msg.isUser && msg.text.includes("I'm your lyric video assistant")
              );
              
              const finalMessages = hasWelcomeMessage 
                ? convertedMessages
                : [{ text: "Hi! I'm your lyric video assistant...", isUser: false }, ...convertedMessages];
              
              setMessages(finalMessages);
            } else {
              // Default message if no messages found
              setMessages([
                { text: "Hi! I'm your lyric video assistant...", isUser: false }
              ]);
            }
          })
          .catch(error => {
            console.error('Error loading conversation:', error);
            setMessages([
              { text: "Hi! I'm your lyric video assistant...", isUser: false }
            ]);
          });
      } else {
        // If no conversations left, reset to initial state
        setConversationId(undefined);
        localStorage.removeItem(CONVERSATION_ID_STORAGE_KEY);
        localStorage.removeItem(getConversationMessagesKey(id));
        
        // Reset messages to just the welcome message
        setMessages([
          { text: "Hi! I'm your lyric video assistant...", isUser: false }
        ]);
        
        // Reset to compact mode
        setIsCompactMode(true);
      }
    }
    
    // Exit edit mode if we're editing the deleted conversation
    if (editingConversationId === id) {
      setEditingConversationId(null);
      setEditingTitle('');
    }
  };
  
  // Clear the newest message indicator after animation completes
  useEffect(() => {
    if (newestMessageIdx >= 0) {
      const timer = setTimeout(() => {
        setNewestMessageIdx(-1);
      }, 1000);
      return () => clearTimeout(timer);
    }
  }, [newestMessageIdx]);
  
  // Function to handle starting the edit process for a conversation
  const handleStartEditing = (id: string, title: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent loading the conversation when clicking edit
    setEditingConversationId(id);
    setEditingTitle(title);
    
    // Focus the input after a short delay to allow rendering
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 50);
  };
  
  // Function to handle saving the new title
  const handleSaveTitle = (id: string, e?: React.FormEvent) => {
    if (e) e.preventDefault();
    
    if (!editingTitle.trim()) {
      // Don't save empty titles
      setEditingTitle('New conversation');
    }
    
    // Find and update the conversation
    const updatedConversations = conversations.map(conv => 
      conv.id === id ? { ...conv, title: editingTitle.trim() || 'New conversation' } : conv
    );
    
    setConversations(updatedConversations);
    localStorage.setItem(CONVERSATIONS_LIST_STORAGE_KEY, JSON.stringify(updatedConversations));
    
    // Exit edit mode
    setEditingConversationId(null);
    setEditingTitle('');
  };
  
  // Function to handle canceling the edit
  const handleCancelEdit = () => {
    setEditingConversationId(null);
    setEditingTitle('');
  };
  
  // Function to handle key presses in the edit input
  const handleEditKeyDown = (id: string, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle(id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };
  
  // Helper function to ensure consistent conversation state updates
  const updateActiveConversation = (id: string, newMessages?: Message[]) => {
    console.log(`Updating active conversation to: ${id}`);
    
    // Update conversation ID in state and localStorage
    setConversationId(id);
    localStorage.setItem(CONVERSATION_ID_STORAGE_KEY, id);
    
    // If messages are provided, update them
    if (newMessages) {
      setMessages(newMessages);
      // Use conversation-specific key instead of generic key
      localStorage.setItem(getConversationMessagesKey(id), JSON.stringify(newMessages));
    }
    
    // Ensure this conversation is at the top of the list
    const updatedConversations = [...conversations];
    const existingIndex = updatedConversations.findIndex(c => c.id === id);
    
    if (existingIndex >= 0) {
      if (existingIndex > 0) { // Only reorder if not already at the top
        const conversation = updatedConversations.splice(existingIndex, 1)[0];
        updatedConversations.unshift(conversation);
        setConversations(updatedConversations);
        localStorage.setItem(CONVERSATIONS_LIST_STORAGE_KEY, JSON.stringify(updatedConversations));
      }
    } else {
      console.warn(`Tried to set active conversation to ${id}, but it wasn't found in the list`);
    }
  };
  
  // Add a useEffect to make sure the correct messages are loaded when conversation ID changes 
  useEffect(() => {
    if (!isRestoringConversation && conversationId) {
      // When conversationId changes (after initial mount), try to load messages for that specific conversation
      const loadConversationMessages = async () => {
        try {
          // First check if we already have messages loaded
          if (messages.length > 1) {
            // We already have messages, check if they match the current conversation
            // (This is just a basic check to avoid unnecessary backend calls)
            return;
          }
          
          console.log(`Loading messages for conversation ${conversationId}`);
          
          // Try to fetch from backend
          const history = await fetchConversationHistory(conversationId);
          
          if (history.messages && history.messages.length > 0) {
            // Convert backend message format to our frontend format
            const convertedMessages: Message[] = history.messages.map(msg => ({
              text: msg.content,
              isUser: msg.role === 'user',
              isProcessing: false
            }));
            
            // Add our welcome message at the beginning if it's not there
            const hasWelcomeMessage = convertedMessages.some(
              msg => !msg.isUser && msg.text.includes("I'm your lyric video assistant")
            );
            
            const finalMessages = hasWelcomeMessage 
              ? convertedMessages
              : [{ text: "Hi! I'm your lyric video assistant. I can create lyric videos and answer questions about music. What can I help you with today?", isUser: false }, ...convertedMessages];
            
            setMessages(finalMessages);
            console.log(`Loaded ${finalMessages.length} messages for conversation ${conversationId}`);
          }
        } catch (error) {
          console.error(`Error loading messages for conversation ${conversationId}:`, error);
        }
      };
      
      loadConversationMessages();
    }
  }, [conversationId, isRestoringConversation]);
  
  // Add useEffect to focus the textarea when isCompactMode changes from true to false
  useEffect(() => {
    // Only run when switching from compact mode to expanded mode
    if (!isCompactMode && textareaRef.current) {
      const focusTimeout = setTimeout(() => {
        textareaRef.current?.focus();
      }, 600); // Match the animation duration
      
      return () => clearTimeout(focusTimeout);
    }
  }, [isCompactMode]);
  
  return (
    <AppLayout>
      <GlobalStyle />
      
      {/* Main navigation sidebar - always visible on desktop, toggleable on mobile */}
      <Sidebar isOpen={sidebarOpen}>
        <Logo>
          zLyrics
        </Logo>
        <NavMenu>
          <NavItem to="/">
            <NavIcon>{IoHomeOutline({ size: 18 })}</NavIcon> Home
          </NavItem>
          <NavItem to="/profile">
            <NavIcon>{CgProfile({ size: 18 })}</NavIcon> Profile
          </NavItem>
          <NavItem to="/songs">
            <NavIcon>{MdMusicNote({ size: 18 })}</NavIcon> My Songs
          </NavItem>
          <NavItem to="/create">
            <NavIcon>{MdAdd({ size: 18 })}</NavIcon> Create Lyrics
          </NavItem>
          <NavItem to="/agent" active>
            <NavIcon>{RiRobot2Line({ size: 18 })}</NavIcon> Agent
          </NavItem>
        </NavMenu>
        
        {/* User info at bottom of sidebar */}
        {userData && (
          <div style={{ padding: '20px', borderTop: '1px solid rgba(255, 255, 255, 0.1)', marginTop: 'auto' }}>
            <UserInfo>
              <UserAvatar 
                src={userData.profile_picture || "https://via.placeholder.com/40x40?text=User"} 
                alt={userData.name} 
              />
              <div>
                <UserName style={{ color: 'white' }}>{userData.name}</UserName>
              </div>
            </UserInfo>
          </div>
        )}
      </Sidebar>
      
      {/* Toggle for sidebar on mobile */}
      <SidebarToggle onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? MdClose({ size: 20 }) : MdMenu({ size: 20 })}
      </SidebarToggle>
      
      {/* Overlay for mobile when sidebars are open */}
      <MobileOverlay 
        visible={windowWidth <= 768 && (sidebarOpen || chatSidebarOpen)}
        onClick={() => {
          if (chatSidebarOpen) setChatSidebarOpen(false);
          else if (sidebarOpen) setSidebarOpen(false);
        }}
      />
      
      {/* Chat history sidebar */}
      <ChatSidebar isOpen={chatSidebarOpen} theme={theme}>
        <ChatListHeader>
          <h3 style={{ margin: 0 }}>Conversations</h3>
          <NewChatButton onClick={handleNewChat}>
            {FiPlusCircle({ size: 16 })} New chat
          </NewChatButton>
        </ChatListHeader>
        
        <ChatList>
          {conversations.length === 0 ? (
            <div style={{ padding: '20px', color: '#777', textAlign: 'center' }}>
              No previous conversations
            </div>
          ) : (
            conversations.map(conv => {
              // Debug log to see what's being rendered
              console.log(`Rendering conversation: ${conv.id}, active: ${conv.id === conversationId}`);
              
              // Determine if this is the active conversation
              const isActive = conv.id === conversationId;
              
              return (
                <ChatItem 
                  key={conv.id} 
                  active={isActive}
                  onClick={() => handleLoadConversation(conv.id)}
                  style={isActive ? { 
                    backgroundColor: 'rgba(29, 185, 84, 0.1)',
                    borderLeft: '3px solid #1DB954'
                  } : {}}
                >
                  {editingConversationId === conv.id ? (
                    <EditForm onSubmit={(e) => handleSaveTitle(conv.id, e)}>
                      <ChatTitleInput
                        ref={editInputRef}
                        value={editingTitle}
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onKeyDown={(e) => handleEditKeyDown(conv.id, e)}
                        onBlur={() => handleSaveTitle(conv.id)}
                        placeholder="Enter conversation name..."
                        autoFocus
                      />
                      <SaveButton 
                        type="submit" 
                        title="Save title"
                      >
                        {AiOutlineCheck({ size: 16 })}
                      </SaveButton>
                    </EditForm>
                  ) : (
                    <ChatItemTitle>{conv.title}</ChatItemTitle>
                  )}
                  <ChatItemActions>
                    <ChatItemEdit 
                      onClick={(e) => handleStartEditing(conv.id, conv.title, e)}
                      title="Edit conversation"
                    >
                      {AiOutlineEdit({ size: 18, style: { verticalAlign: 'middle' } })}
                    </ChatItemEdit>
                    <ChatItemDelete 
                      onClick={(e) => handleDeleteConversation(conv.id, e)}
                      title="Delete conversation"
                    >
                      {AiOutlineDelete({ size: 18, style: { verticalAlign: 'middle' } })}
                    </ChatItemDelete>
                  </ChatItemActions>
                </ChatItem>
              );
            })
          )}
        </ChatList>
      </ChatSidebar>
      
      {/* Toggle for chat sidebar */}
      <ChatSidebarToggle 
        onClick={() => setChatSidebarOpen(!chatSidebarOpen)}
        theme={{ ...theme, sidebarOpen: true }}
      >
        {chatSidebarOpen ? 
          MdClose({ size: 20 }) : 
          BsChatDots({ size: 18 })
        }
      </ChatSidebarToggle>
      
      {/* Main chat area - now conditionally rendered based on compact mode */}
      <MainContent sidebarOpen={sidebarOpen}>
        {isCompactMode ? (
          <CompactChatContainer>
            <CompactChatHeader>
              <CompactChatIcon>
                {RiRobot2Line({ size: 24 })}
              </CompactChatIcon>
              <CompactChatTitle>Lyric Video Assistant</CompactChatTitle>
            </CompactChatHeader>
            <CompactChatInput>
              <InputRow>
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me about creating a lyric video..."
                  onKeyDown={handleKeyPress}
                  disabled={isLoading}
                  rows={1}
                  autoFocus
                />
                <SendButton onClick={handleSend} disabled={isLoading}>
                  {isLoading ? 'Sending...' : (
                    <>
                      Send
                      {MdSend({ size: 22 })}
                    </>
                  )}
                </SendButton>
              </InputRow>
              <HelperText>Press Enter to send, Shift+Enter for a new line</HelperText>
            </CompactChatInput>
          </CompactChatContainer>
        ) : (
          <ChatContainer>
            <ChatHeader>
              {windowWidth <= 768 && !sidebarOpen && (
                <IconButton 
                  onClick={() => setSidebarOpen(true)}
                  style={{ marginRight: '10px' }}
                  title="Open menu"
                >
                  {MdMenu({ size: 20 })}
                </IconButton>
              )}
              <ChatHeaderIcon>
                {RiRobot2Line({ size: 18 })}
              </ChatHeaderIcon>
              <div>
                <ChatHeaderTitle>Lyric Video Assistant</ChatHeaderTitle>
                <ChatHeaderSubtitle>{currentDate}</ChatHeaderSubtitle>
              </div>
              <ChatHeaderControls>
                {/* Button to toggle conversation list on mobile and desktop */}
                <IconButton 
                  onClick={() => setChatSidebarOpen(!chatSidebarOpen)}
                  title="Toggle conversations"
                >
                  {BsChatDots({ size: 16 })}
                </IconButton>
                
                {/* Button to toggle scrollbars */}
                <IconButton 
                  onClick={toggleScrollbars}
                  title={showScrollbars ? "Hide scrollbars" : "Show scrollbars"}
                >
                  {showScrollbars ? 
                    BsArrowsCollapse({ size: 16 }) : 
                    BsArrowsExpand({ size: 16 })
                  }
                </IconButton>
                
                {/* Button for new conversation */}
                <IconButton 
                  onClick={handleNewChat}
                  title="New conversation"
                >
                  {FiPlusCircle({ size: 16 })}
                </IconButton>
              </ChatHeaderControls>
            </ChatHeader>
            
            <ChatMessages className={showScrollbars ? 'show-scrollbar' : ''}>
              {messages.map((message, index) => (
                message.text === '...' ? (
                  <AssistantTypingIndicator key={index} isProcessing={message.isProcessing}>
                    {message.isProcessing && (
                      <ProcessingLabel>Generating your video</ProcessingLabel>
                    )}
                    <DotContainer>
                      <Dot isProcessing={message.isProcessing} />
                      <Dot isProcessing={message.isProcessing} />
                      <Dot isProcessing={message.isProcessing} />
                    </DotContainer>
                  </AssistantTypingIndicator>
                ) : (
                  <MessageBubble 
                    key={index} 
                    isUser={message.isUser}
                    isNew={index === newestMessageIdx}
                  >
                    {message.text}
                  </MessageBubble>
                )
              ))}
              <div ref={messagesEndRef} />
            </ChatMessages>
            
            <ChatInput>
              <InputRow>
                <Textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me about creating a lyric video..."
                  onKeyDown={handleKeyPress}
                  disabled={isLoading}
                  rows={1}
                />
                <SendButton onClick={handleSend} disabled={isLoading}>
                  {isLoading ? 'Sending...' : (
                    <>
                      Send
                      {MdSend({ size: 18, style: { marginLeft: '6px' } })}
                    </>
                  )}
                </SendButton>
              </InputRow>
              <HelperText>Press Enter to send, Shift+Enter for a new line</HelperText>
            </ChatInput>
          </ChatContainer>
        )}
      </MainContent>
    </AppLayout>
  );
};

export default AgentPage; 