import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
// Import icons
import { MdAdd, MdClose, MdMenu } from 'react-icons/md';
import { FiPlusCircle } from 'react-icons/fi';
import { IconAgentOrbit } from '../components/icons/IconAgentOrbit';
import { BsArrowsExpand, BsArrowsCollapse, BsChatDots } from 'react-icons/bs';

// Import hooks
import { useConversationManager, Message } from '../hooks/useConversationManager';
import { useAgentChat } from '../hooks/useAgentChat';
import { useVideoJobPolling } from '../hooks/useVideoJobPolling';

// Import components
import { ConversationSidebar } from '../components/agent/ConversationSidebar';
import { ChatInterface } from '../components/agent/ChatInterface';
import { ProfileDropdown } from '../components/profile/ProfileDropdown';
import { VideoSettingsModal } from '../components/agent/VideoSettingsModal';
import { AppSidebar } from '../components/layout/AppSidebar';
import {
  startVideoGeneration,
  useExistingVariant,
  SongSuggestion,
  buildLyricVideoAgentMessage,
  formatSongPickPreview,
  appendConversationMessage
} from '../services/api';
import { primeSongCoverCache } from '../services/songCoverCache';

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
  const location = useLocation();
  const [currentDate] = useState(formatDate());
  const autoStartProcessed = React.useRef(false);

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
    bumpConversationToTop,
    deleteConversation,
    replaceConversationId,
    setActiveConversationId,
    appendMessageToConversation
  } = useConversationManager({ disableAutoLoad: !!location.state?.autoStartSong });

  const activeConversationIdRef = React.useRef(activeConversationId);
  const updateConversationMessagesRef = React.useRef(updateConversationMessages);
  const appendMessageToConversationRef = React.useRef(appendMessageToConversation);
  const bumpConversationToTopRef = React.useRef(bumpConversationToTop);

  React.useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  React.useEffect(() => {
    updateConversationMessagesRef.current = updateConversationMessages;
    appendMessageToConversationRef.current = appendMessageToConversation;
    bumpConversationToTopRef.current = bumpConversationToTop;
  }, [updateConversationMessages, appendMessageToConversation, bumpConversationToTop]);

  const VIDEO_READY_MESSAGE =
    "Great news! Your lyric video is now ready. You can view it in the My Songs section.";

  // UI state
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth > 768);
  const [chatSidebarOpen, setChatSidebarOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [showScrollbars, setShowScrollbars] = useState<boolean>(false);
  const [isCompactMode, setIsCompactMode] = useState<boolean>(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [existingVariants, setExistingVariants] = useState<any[]>([]);
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
    activeConversationId,
    onCompleted: (_jobId, conversationId) => {
      if (!conversationId || conversationId.startsWith('temp-')) return;

      if (conversationId === activeConversationIdRef.current) {
        setMessages((prev) => {
          const updated = [
            ...prev.filter((msg) => !msg.isProcessing),
            { text: VIDEO_READY_MESSAGE, isUser: false }
          ];
          updateConversationMessagesRef.current(conversationId, updated);
          return updated;
        });

        appendConversationMessage(conversationId, 'assistant', VIDEO_READY_MESSAGE).catch((error) => {
          console.error('Failed to persist video completion message:', error);
        });
      } else {
        appendMessageToConversationRef.current(conversationId, VIDEO_READY_MESSAGE);
      }
    },
    onFailed: (_jobId, conversationId, error) => {
      if (!conversationId || conversationId.startsWith('temp-')) return;

      const errorMessage = `I'm sorry, but there was an issue generating your lyric video. The error was: ${error}`;
      if (conversationId === activeConversationIdRef.current) {
        setMessages((prev) => {
          const updated = [
            ...prev.filter((msg) => !msg.isProcessing),
            { text: errorMessage, isUser: false }
          ];
          updateConversationMessagesRef.current(conversationId, updated);
          return updated;
        });

        appendConversationMessage(conversationId, 'assistant', errorMessage).catch((err) => {
          console.error('Failed to persist video error message:', err);
        });
      } else {
        appendMessageToConversationRef.current(conversationId, errorMessage);
      }
    }
  });

  // Agent chat hook
  const { sendMessage, isLoading: isSendingMessage } = useAgentChat({
    onSongRequest: (jobId, _title, _artist, conversationId, isFavoriteOnly) => {
      if (!conversationId) return;

      if (isFavoriteOnly) {
        setMessages(prev => [...prev, {
          text: '...',
          isUser: false,
          isProcessing: true,
        }]);
      } else {
        setMessages(prev => [...prev, {
          text: '...',
          isUser: false,
          isProcessing: true,
        }]);

        startPolling(jobId, conversationId);
      }
    },
    onCustomizationRequest: (jobId, _conversationId, variants) => {
      setPendingJobId(jobId);
      if (variants) setExistingVariants(variants);
      else setExistingVariants([]);
      setModalOpen(true);
    },
    onConversationIdReceived: (newConvId) => {
      const currentId = activeConversationIdRef.current;

      if (currentId.startsWith('temp-') && newConvId !== currentId) {
        replaceConversationId(currentId, newConvId);
        activeConversationIdRef.current = newConvId;
      } else if (newConvId !== currentId) {
        setActiveConversationId(newConvId);
        activeConversationIdRef.current = newConvId;
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
    const resolvedConvId = response?.conversation_id || activeConversationIdRef.current || convId;

    // Remove only the typing indicator (not processing indicators)
    setMessages(prev => prev.filter(msg => !(msg.text === '...' && !msg.isProcessing)));

    if (response) {
      // If the response contains song data with album cover, update the user message
      if (response.song_request_data?.title && response.song_request_data?.artist) {
        const { title, artist, album_cover } = response.song_request_data;
        
        // Prime the cache with the album cover
        if (album_cover) {
          primeSongCoverCache(title, artist, album_cover);
        }

        // Update the last user message to include songPick
        setMessages(prev => {
          const newMessages = [...prev];
          // Find the last user message (should be the one we just sent)
          for (let i = newMessages.length - 1; i >= 0; i--) {
            if (newMessages[i].isUser && newMessages[i].text === userMessage) {
              newMessages[i] = {
                ...newMessages[i],
                text: formatSongPickPreview({ title, artist }),
                songPick: {
                  title,
                  artist,
                  albumCover: album_cover || null
                }
              };
              break;
            }
          }
          return newMessages;
        });
      }

      // For favorite-only songs, delay showing the response to sync with the "adding" indicator
      if (response.is_favorite_only && response.message) {
        // Wait 2 seconds to show "Adding to collection..." then show success message
        setTimeout(() => {
          // Remove the processing indicator
          setMessages(prev => prev.filter(msg => !msg.isProcessing));
          // Add the AI's success message — use ref to get the resolved (non-temp) ID
          setMessages(prev => {
            const updated = [...prev, { text: response.message, isUser: false }];
            bumpConversationToTopRef.current(resolvedConvId, updated);
            return updated;
          });
        }, 2000);
      } else if (response.message) {
        // For regular messages and video generation, add response immediately
        setMessages(prev => {
          const updated = [...prev, { text: response.message, isUser: false }];
          bumpConversationToTopRef.current(resolvedConvId, updated);
          return updated;
        });
      }
    }
  }, [input, isSendingMessage, activeConversationId, isCompactMode, createNewConversation, sendMessage]);

  const handleSongSelect = useCallback(async (song: SongSuggestion, forceNewConversation: boolean = false) => {
    primeSongCoverCache(song.title, song.artist, song.album_cover);

    let convId = activeConversationId;
    if (forceNewConversation || !convId) {
      convId = createNewConversation();
    }

    if (isCompactMode) {
      setIsCompactMode(false);
    }

    const agentString = buildLyricVideoAgentMessage(song);

    const userBubble: Message = {
      text: formatSongPickPreview(song),
      isUser: true,
      songPick: {
        title: song.title,
        artist: song.artist,
        albumCover: song.album_cover
      }
    };

    const newMessages: Message[] = [
      userBubble,
      { text: '...', isUser: false, isProcessing: false }
    ];

    if (forceNewConversation) {
      setMessages(newMessages);
    } else {
      setMessages(prev => [...prev, ...newMessages]);
    }

    const response = await sendMessage(agentString, convId);
    const resolvedConvId = response?.conversation_id || activeConversationIdRef.current || convId;

    // Remove only the typing indicator (not processing indicators)
    setMessages(prev => prev.filter(msg => !(msg.text === '...' && !msg.isProcessing)));

    if (response) {
      // For favorite-only songs, delay showing the response to sync with the "adding" indicator
      if (response.is_favorite_only && response.message) {
        setTimeout(() => {
          setMessages(prev => prev.filter(msg => !msg.isProcessing));
          setMessages(prev => {
            const updated = [...prev, { text: response.message, isUser: false }];
            bumpConversationToTopRef.current(resolvedConvId, updated);
            return updated;
          });
        }, 2000);
      } else if (response.message) {
        setMessages(prev => {
          const updated = [...prev, { text: response.message, isUser: false }];
          bumpConversationToTopRef.current(resolvedConvId, updated);
          return updated;
        });
      }
    }
  }, [activeConversationId, createNewConversation, isCompactMode, setMessages, sendMessage]);

  // Handle auto-starting a song from navigation state
  useEffect(() => {
    const autoStartSong = location.state?.autoStartSong;
    if (autoStartSong && !autoStartProcessed.current) {
      autoStartProcessed.current = true;
      // When navigating from home, force a new conversation
      handleSongSelect(autoStartSong, true);
      
      // Clear the state so it doesn't trigger again on refresh
      window.history.replaceState({}, document.title);
    }
  }, [location.state, handleSongSelect]);

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
  const handleDeleteConversation = useCallback(async (id: string) => {
    try {
      await deleteConversation(id);
    } catch {
      window.alert('Could not delete this conversation. Please try again.');
    }
  }, [deleteConversation]);

  // Handle renaming a conversation
  const handleRenameConversation = useCallback((id: string, newTitle: string) => {
    updateConversation(id, { title: newTitle });
  }, [updateConversation]);

  return (
    <Styles.AppLayout>
      <Styles.GlobalStyle />

      <AppSidebar
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(!sidebarOpen)}
        onClose={() => setSidebarOpen(false)}
        overlayVisible={windowWidth <= 768 && (sidebarOpen || chatSidebarOpen)}
        onOverlayClick={() => {
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
                <IconAgentOrbit size={24} />
              </Styles.CompactChatIcon>
              <Styles.CompactChatTitle>Lyric Video Assistant</Styles.CompactChatTitle>
            </Styles.CompactChatHeader>
            <ChatInterface
              messages={messages}
              input={input}
              isLoading={isSendingMessage}
              onInputChange={setInput}
              onSend={handleSend}
              onSongSelect={handleSongSelect}
              hideMessages={true}
            />
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
                <IconAgentOrbit size={18} />
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
              onSongSelect={handleSongSelect}
              showScrollbars={showScrollbars}
            />
          </Styles.ChatContainer>
        )}
      </Styles.MainContent>

      <VideoSettingsModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        jobId={pendingJobId}
        existingVariants={existingVariants}
        onUseExisting={async (variantId) => {
          setModalOpen(false);
          try {
            setMessages(prev => [...prev, { text: '...', isUser: false, isProcessing: true }]);
            await useExistingVariant(variantId);
            setMessages(prev => prev.filter(msg => !msg.isProcessing));
            setMessages(prev => [...prev, { text: "Your video has been instantly added to My Songs!", isUser: false }]);
          } catch (e) {
            console.error("Failed to reuse existing video", e);
          }
        }}
        onGenerate={async (colors) => {
          setModalOpen(false);
          try {
            if (pendingJobId) {
              const conversationId = activeConversationIdRef.current;
              setMessages(prev => [...prev, { text: '...', isUser: false, isProcessing: true }]);
              await startVideoGeneration(pendingJobId, colors);
              if (conversationId) {
                startPolling(pendingJobId, conversationId);
              }
            }
          } catch (e) {
            console.error("Failed to generate with custom settings", e);
          }
        }}
      />
    </Styles.AppLayout>
  );
};

export default AgentPage; 