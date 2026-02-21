import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
// Import icons
import { CgProfile } from 'react-icons/cg';
import { IoHomeOutline } from 'react-icons/io5';
import { MdMusicNote, MdAdd, MdClose, MdMenu } from 'react-icons/md';
import { FiPlusCircle } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';
import { BsArrowsExpand, BsArrowsCollapse, BsChatDots } from 'react-icons/bs';

// Import hooks
import { useConversationManager, Message } from '../hooks/useConversationManager';
import { useAgentChat } from '../hooks/useAgentChat';
import { useVideoJobPolling } from '../hooks/useVideoJobPolling';

// Import components
import { ConversationSidebar } from '../components/agent/ConversationSidebar';
import { ChatInterface } from '../components/agent/ChatInterface';
import { ProfileDropdown } from '../components/profile/ProfileDropdown';

// Import all styled components from AgentPageStyles
import * as Styles from '../styles/AgentPageStyles';

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

const AgentPage: React.FC = () => {
  // Navigation
  const navigate = useNavigate();
  const [currentDate] = useState(formatDate());
  
  // Custom hooks for conversation management
  const {
    conversations,
    activeConversationId,
    messages,
    isLoading: isLoadingConversation,
    setMessages,
    loadConversation,
    createNewConversation,
    updateConversation,
    updateConversationMessages,
    deleteConversation,
    replaceConversationId,
    setActiveConversationId
  } = useConversationManager();
  
  // UI state
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showScrollbars, setShowScrollbars] = useState<boolean>(false);
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);
  const { userData } = useUser();
  
  // Set theme for styled components
  const theme = { 
    sidebarOpen, 
    chatSidebarOpen,
    get chatSidebarToggleLeft() {
      return sidebarOpen ? '260px' : '20px';
    }
  };
  
  // Video job polling hook
  const { startPolling } = useVideoJobPolling({
    onCompleted: (jobId) => {
      setMessages(prev => prev.filter(msg => !msg.isProcessing));
      setMessages(prev => [...prev, { 
        text: "Great news! Your lyric video is now ready. You can view it in the My Songs section.", 
        isUser: false 
      }]);
      updateConversationMessages(activeConversationId, messages);
    },
    onFailed: (jobId, error) => {
      setMessages(prev => prev.filter(msg => !msg.isProcessing));
      setMessages(prev => [...prev, { 
        text: `I'm sorry, but there was an issue generating your lyric video. The error was: ${error}`, 
        isUser: false 
      }]);
      updateConversationMessages(activeConversationId, messages);
    }
  });
  
  // Agent chat hook
  const { sendMessage, isLoading: isSendingMessage } = useAgentChat({
    onSongRequest: (jobId, title, artist) => {
      // Add confirmation message
      const confirmMsg: Message = {
        text: `I'm creating a lyric video for "${title}" by ${artist}. I'll let you know when it's ready!`,
        isUser: false
      };
      setMessages(prev => [...prev, confirmMsg]);
      
      // Add processing indicator
      setMessages(prev => [...prev, { text: '...', isUser: false, isProcessing: true }]);
      
      // Start polling
      startPolling(jobId);
    },
    onConversationIdReceived: (newConvId) => {
      if (activeConversationId.startsWith('temp-') && newConvId !== activeConversationId) {
        replaceConversationId(activeConversationId, newConvId);
      } else if (newConvId !== activeConversationId) {
        setActiveConversationId(newConvId);
      }
    }
  });
  
  // Track window resize to handle responsive layout
  useEffect(() => {
    const handleResize = () => {
      const newWidth = window.innerWidth;
      setWindowWidth(newWidth);
      
      // Use functional update to avoid depending on sidebarOpen
      if (newWidth <= 768) {
        setSidebarOpen(prev => prev ? false : prev);
      }
    };
    
    window.addEventListener('resize', handleResize);
    // Only run handleResize on mount, not on every re-render
    const initialWidth = window.innerWidth;
    setWindowWidth(initialWidth);
    if (initialWidth <= 768) {
      setSidebarOpen(false);
    }
    
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array - only run once on mount
  
  // Auto-save messages when they change
  useEffect(() => {
    if (messages.length > 1 && activeConversationId) {
      updateConversationMessages(activeConversationId, messages);
    }
  }, [messages, activeConversationId, updateConversationMessages]);
  
  // Load scrollbar preference on mount
  useEffect(() => {
    const scrollbarPreference = localStorage.getItem('agent_show_scrollbars');
    if (scrollbarPreference !== null) {
      setShowScrollbars(scrollbarPreference === 'true');
    }
  }, []);
  
  // Determine compact mode based on conversation state
  useEffect(() => {
    if (messages.length > 1 || activeConversationId) {
      setIsCompactMode(false);
    }
  }, [messages.length, activeConversationId]);
  
  // Handle sending a message
  const handleSend = useCallback(async () => {
    if (!input.trim() || isSendingMessage) return;
    
    const userMessage = input;
    setInput('');
    
    // Create or use existing conversation
    let convId = activeConversationId;
    if (!convId) {
      convId = createNewConversation();
    }
    
    // Add user message
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    
    // Add typing indicator (not a processing indicator)
    setMessages(prev => [...prev, { text: '...', isUser: false, isProcessing: false }]);
    
    // Exit compact mode if needed
    if (isCompactMode) {
      setIsCompactMode(false);
    }
    
    // Send message using the hook
    const response = await sendMessage(userMessage, convId);
    
    // Remove only the typing indicator (not processing indicators)
    setMessages(prev => prev.filter(msg => !(msg.text === '...' && !msg.isProcessing)));
    
    if (response) {
      // Only add response message if it's not a song request
      // (song requests are handled by onSongRequest callback)
      if (!response.is_song_request) {
        setMessages(prev => [...prev, { text: response.message, isUser: false }]);
      }
    }
  }, [input, isSendingMessage, activeConversationId, isCompactMode, createNewConversation, sendMessage]);
  
  // Toggle scrollbar visibility
  const toggleScrollbars = useCallback(() => {
    setShowScrollbars(prev => !prev);
    localStorage.setItem('agent_show_scrollbars', (!showScrollbars).toString());
  }, [showScrollbars]);
  
  // Handle creating a new chat
  const handleNewChat = useCallback(() => {
    if (isLoadingConversation) return;
    
    createNewConversation();
    setIsCompactMode(false);
    
    if (windowWidth <= 768) {
      setChatSidebarOpen(false);
    }
  }, [isLoadingConversation, createNewConversation, windowWidth]);
  
  // Handle loading a conversation
  const handleLoadConversation = useCallback((id: string) => {
    if (isLoadingConversation || id === activeConversationId) {
      if (windowWidth <= 768) setChatSidebarOpen(false);
      return;
    }
    
    loadConversation(id);
    setIsCompactMode(false);
    
    if (windowWidth <= 768) {
      setChatSidebarOpen(false);
    }
  }, [isLoadingConversation, activeConversationId, windowWidth, loadConversation]);
  
  // Handle deleting a conversation
  const handleDeleteConversation = useCallback((id: string) => {
    deleteConversation(id);
  }, [deleteConversation]);
  
  // Handle renaming a conversation
  const handleRenameConversation = useCallback((id: string, newTitle: string) => {
    updateConversation(id, { title: newTitle });
  }, [updateConversation]);
  
  return (
    <Styles.AppLayout>
      <Styles.GlobalStyle />
      
      {/* Main navigation sidebar - always visible on desktop, toggleable on mobile */}
      <Styles.Sidebar isOpen={sidebarOpen}>
        <Styles.Logo>
          🎵
        </Styles.Logo>
        <Styles.NavMenu>
          <Styles.NavItem to="/" data-tooltip="Home">
            <Styles.NavIcon>{IoHomeOutline({ size: 28 })}</Styles.NavIcon>
            <Styles.NavText>Home</Styles.NavText>
          </Styles.NavItem>
          <Styles.NavItem to="/profile" data-tooltip="Profile">
            <Styles.NavIcon>{CgProfile({ size: 28 })}</Styles.NavIcon>
            <Styles.NavText>Profile</Styles.NavText>
          </Styles.NavItem>
          <Styles.NavItem to="/songs" data-tooltip="My Songs">
            <Styles.NavIcon>{MdMusicNote({ size: 28 })}</Styles.NavIcon>
            <Styles.NavText>My Songs</Styles.NavText>
          </Styles.NavItem>
          <Styles.NavItem to="/agent" active data-tooltip="AI Agent">
            <Styles.NavIcon>{RiRobot2Line({ size: 28 })}</Styles.NavIcon>
            <Styles.NavText>Agent</Styles.NavText>
          </Styles.NavItem>
        </Styles.NavMenu>
      </Styles.Sidebar>
      
      {/* Toggle for sidebar on mobile */}
      <Styles.SidebarToggle onClick={() => setSidebarOpen(!sidebarOpen)}>
        {sidebarOpen ? MdClose({ size: 20 }) : MdMenu({ size: 20 })}
      </Styles.SidebarToggle>
      
      {/* Overlay for mobile when sidebars are open */}
      <Styles.MobileOverlay 
        visible={windowWidth <= 768 && (sidebarOpen || chatSidebarOpen)}
        onClick={() => {
          if (chatSidebarOpen) setChatSidebarOpen(false);
          else if (sidebarOpen) setSidebarOpen(false);
        }}
      />
      
      {/* Chat history sidebar */}
      <ConversationSidebar
        conversations={conversations}
        activeConversationId={activeConversationId}
        isOpen={chatSidebarOpen}
        onNewChat={handleNewChat}
        onLoadConversation={handleLoadConversation}
        onDeleteConversation={handleDeleteConversation}
        onRenameConversation={handleRenameConversation}
        theme={theme}
      />
      
      {/* Toggle for chat sidebar */}
      <Styles.ChatSidebarToggle 
        onClick={() => setChatSidebarOpen(!chatSidebarOpen)}
        theme={{ ...theme, sidebarOpen: true }}
      >
        {chatSidebarOpen ? 
          MdClose({ size: 20 }) : 
          BsChatDots({ size: 18 })
        }
      </Styles.ChatSidebarToggle>
      
      {/* Main chat area - now conditionally rendered based on compact mode */}
      <Styles.MainContent sidebarOpen={sidebarOpen}>
        {isCompactMode ? (
          <Styles.CompactChatContainer>
            <Styles.CompactChatHeader>
              <Styles.CompactChatIcon>
                {RiRobot2Line({ size: 24 })}
              </Styles.CompactChatIcon>
              <Styles.CompactChatTitle>Lyric Video Assistant</Styles.CompactChatTitle>
            </Styles.CompactChatHeader>
            <Styles.CompactChatInput>
              <Styles.InputRow>
                <Styles.Textarea
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask me about creating a lyric video..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSend();
                    }
                  }}
                  disabled={isSendingMessage}
                  rows={1}
                  autoFocus
                />
                <Styles.SendButton onClick={handleSend} disabled={isSendingMessage}>
                  {isSendingMessage ? 'Sending...' : 'Send'}
                </Styles.SendButton>
              </Styles.InputRow>
              <Styles.HelperText>Press Enter to send, Shift+Enter for a new line</Styles.HelperText>
            </Styles.CompactChatInput>
          </Styles.CompactChatContainer>
        ) : (
          <Styles.ChatContainer>
            <Styles.ChatHeader>
              {windowWidth <= 768 && !sidebarOpen && (
                <Styles.IconButton 
                  onClick={() => setSidebarOpen(true)}
                  style={{ marginRight: '8px' }}
                  title="Open menu"
                >
                  {MdMenu({ size: 20 })}
                </Styles.IconButton>
              )}
              <Styles.ChatHeaderIcon>
                {RiRobot2Line({ size: 18 })}
              </Styles.ChatHeaderIcon>
              <div style={{ display: 'flex', flexDirection: 'column', flex: '0 0 auto', marginRight: 'auto' }}>
                <Styles.ChatHeaderTitle>AI Music Agent</Styles.ChatHeaderTitle>
                <Styles.ChatHeaderSubtitle>{currentDate}</Styles.ChatHeaderSubtitle>
              </div>
              <Styles.ChatHeaderControls>
                {/* Button to toggle conversation list - SHOW on mobile with better styling */}
                <Styles.IconButton 
                  onClick={() => setChatSidebarOpen(!chatSidebarOpen)}
                  title="Conversation History"
                  style={windowWidth <= 768 ? { padding: '8px' } : {}}
                >
                  {BsChatDots({ size: windowWidth <= 768 ? 18 : 16 })}
                </Styles.IconButton>
                
                {/* Button to toggle scrollbars - hide on mobile */}
                <Styles.IconButton 
                  className={windowWidth <= 768 ? "hide-mobile" : ""}
                  onClick={toggleScrollbars}
                  title={showScrollbars ? "Hide scrollbars" : "Show scrollbars"}
                >
                  {showScrollbars ? 
                    BsArrowsCollapse({ size: 16 }) : 
                    BsArrowsExpand({ size: 16 })
                  }
                </Styles.IconButton>
                
                {/* Button for new conversation - bigger on mobile */}
                <Styles.IconButton 
                  onClick={handleNewChat}
                  title="New conversation"
                  style={windowWidth <= 768 ? { padding: '8px' } : {}}
                >
                  {FiPlusCircle({ size: windowWidth <= 768 ? 18 : 16 })}
                </Styles.IconButton>
                
                {/* ProfileDropdown - always show */}
                <div style={{ marginLeft: windowWidth <= 768 ? '8px' : '10px' }}>
                  <ProfileDropdown userData={userData} />
                </div>
              </Styles.ChatHeaderControls>
            </Styles.ChatHeader>
            
            <ChatInterface
              messages={messages}
              input={input}
              isLoading={isSendingMessage}
              onInputChange={setInput}
              onSend={handleSend}
              showScrollbars={showScrollbars}
            />
          </Styles.ChatContainer>
        )}
      </Styles.MainContent>
    </Styles.AppLayout>
  );
};

export default AgentPage; 