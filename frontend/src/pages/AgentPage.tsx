import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUser } from '../contexts/UserContext';
// Import icons
import { MdAdd, MdClose, MdMenu, MdSearch, MdArrowUpward } from 'react-icons/md';
import { FiPlusCircle } from 'react-icons/fi';
import { IconPanelSidebar } from '../components/icons/IconPanelSidebar';
import { IconAgentOrbit } from '../components/icons/IconAgentOrbit';

// Import hooks
import { useConversationManager, Message } from '../hooks/useConversationManager';
import { useAgentChat } from '../hooks/useAgentChat';
import { useVideoJobPolling } from '../hooks/useVideoJobPolling';

// Import components
import { ConversationSidebar } from '../components/agent/ConversationSidebar';
import { ChatInterface } from '../components/agent/ChatInterface';
import { ChatTitleMenu } from '../components/agent/ChatTitleMenu';
import { RenameChatModal } from '../components/agent/RenameChatModal';
import { ProfileDropdown } from '../components/profile/ProfileDropdown';
import { VideoSettingsModal } from '../components/agent/VideoSettingsModal';
import { AppSidebar } from '../components/layout/AppSidebar';
import { SongSearchModal } from '../components/agent/SongSearchModal';
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

const getTimeGreeting = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return 'Morning';
  if (hour >= 12 && hour < 17) return 'Afternoon';
  return 'Evening';
};

const getFirstName = (name?: string) => {
  if (!name?.trim()) return 'there';
  return name.trim().split(/\s+/)[0].toLowerCase();
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
    renameConversation,
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
  const [isCompactMode, setIsCompactMode] = useState<boolean>(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [pendingJobId, setPendingJobId] = useState<string | null>(null);
  const [existingVariants, setExistingVariants] = useState<any[]>([]);
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [renameTargetId, setRenameTargetId] = useState<string | null>(null);
  const [renameDraft, setRenameDraft] = useState('');
  const compactTextareaRef = React.useRef<HTMLTextAreaElement>(null);
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

  // Determine compact mode - only exit when user has actually sent a message
  useEffect(() => {
    // Check if there are any user messages
    const hasUserMessages = messages.some(msg => msg.isUser);
    
    if (hasUserMessages || (activeConversationId && !activeConversationId.startsWith('temp-'))) {
      setIsCompactMode(false);
    } else {
      setIsCompactMode(true);
    }
  }, [messages, activeConversationId]);

  useEffect(() => {
    const textarea = compactTextareaRef.current;
    if (!textarea || !isCompactMode) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
  }, [input, isCompactMode]);

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
    void renameConversation(id, newTitle);
  }, [renameConversation]);

  const handleRequestRename = useCallback((id: string, title: string) => {
    setRenameTargetId(id);
    setRenameDraft(title);
  }, []);

  const handleCloseRename = useCallback(() => {
    setRenameTargetId(null);
    setRenameDraft('');
  }, []);

  const handleSaveRename = useCallback(() => {
    if (!renameTargetId) return;
    const trimmed = renameDraft.trim();
    if (!trimmed) return;
    handleRenameConversation(renameTargetId, trimmed);
    handleCloseRename();
  }, [renameDraft, renameTargetId, handleRenameConversation, handleCloseRename]);

  const activeConversationTitle =
    activeConversationId && conversations.find(c => c.id === activeConversationId)?.title
      ? conversations.find(c => c.id === activeConversationId)?.title
      : 'New Chat';

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
        onToggle={() => setChatSidebarOpen(!chatSidebarOpen)}
        onNewChat={handleNewChat}
        onLoadConversation={handleLoadConversation}
        onDeleteConversation={handleDeleteConversation}
        onRequestRename={handleRequestRename}
        theme={theme}
      />

      {/* Main chat area - now conditionally rendered based on compact mode */}
      <Styles.MainContent sidebarOpen={sidebarOpen} chatSidebarOpen={chatSidebarOpen}>
        <Styles.AgentTopBar $compact={isCompactMode}>
          <Styles.ChatHeaderLeft>
            {windowWidth <= 768 && !chatSidebarOpen && (
              <>
                <Styles.ChatPanelToggle
                  type="button"
                  onClick={() => setChatSidebarOpen(true)}
                  title="Open sidebar"
                  aria-label="Open sidebar"
                >
                  <IconPanelSidebar width={24} height={18} />
                </Styles.ChatPanelToggle>
                {!isCompactMode && <Styles.ChatHeaderDivider />}
              </>
            )}
            {!isCompactMode && activeConversationId && (
              <ChatTitleMenu
                title={activeConversationTitle || 'New Chat'}
                onRename={() => handleRequestRename(activeConversationId, activeConversationTitle || 'New Chat')}
                onDelete={() => void handleDeleteConversation(activeConversationId)}
              />
            )}
            {!isCompactMode && !activeConversationId && (
              <Styles.ChatHeaderTitle>New Chat</Styles.ChatHeaderTitle>
            )}
          </Styles.ChatHeaderLeft>

          {!isCompactMode && (
            <Styles.ChatHeaderControls>
              <Styles.IconButton
                onClick={handleNewChat}
                title="New conversation"
              >
                {FiPlusCircle({ size: 18 })}
              </Styles.IconButton>

              <div style={{ marginLeft: '4px' }}>
                <ProfileDropdown userData={userData} />
              </div>
            </Styles.ChatHeaderControls>
          )}
        </Styles.AgentTopBar>

        {isCompactMode ? (
          <Styles.CompactChatContainer>
            <Styles.ClaudeGreetingRow>
              <Styles.ClaudeGreetingIcon>
                <IconAgentOrbit size={36} />
              </Styles.ClaudeGreetingIcon>
              <Styles.ClaudeGreetingText>
                {getTimeGreeting()}, {getFirstName(userData?.name)}
              </Styles.ClaudeGreetingText>
            </Styles.ClaudeGreetingRow>
            
            <Styles.CompactChatInput>
              <Styles.ClaudeInputCard $landing>
                <Styles.ClaudeTextarea
                  $landing
                  ref={compactTextareaRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="What lyric video are you creating today?"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      if (input.trim() && !isSendingMessage) {
                        handleSend();
                      }
                    }
                  }}
                  disabled={isSendingMessage}
                  rows={1}
                />
                <Styles.ClaudeInputToolbar>
                  <Styles.ClaudeToolbarGroup>
                    <Styles.ClaudeIconButton
                      type="button"
                      onClick={() => setSearchModalOpen(true)}
                      title="Search for a song"
                    >
                      {MdSearch({ size: 20 })}
                    </Styles.ClaudeIconButton>
                  </Styles.ClaudeToolbarGroup>
                  <Styles.ClaudeToolbarGroup>
                    <Styles.ClaudeSendButton
                      type="button"
                      onClick={handleSend}
                      disabled={isSendingMessage || !input.trim()}
                      title="Send message"
                    >
                      {MdArrowUpward({ size: 20 })}
                    </Styles.ClaudeSendButton>
                  </Styles.ClaudeToolbarGroup>
                </Styles.ClaudeInputToolbar>
              </Styles.ClaudeInputCard>
            </Styles.CompactChatInput>
            
            <Styles.CompactActionButtons>
              <Styles.CompactActionButton
                onClick={handleNewChat}
                title="New Chat"
              >
                {FiPlusCircle({ size: 16 })}
                <span>New chat</span>
              </Styles.CompactActionButton>
              
              <ProfileDropdown userData={userData} />
            </Styles.CompactActionButtons>
          </Styles.CompactChatContainer>
        ) : (
          <Styles.ChatContainer>
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
      
      <SongSearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelect={handleSongSelect}
      />

      <RenameChatModal
        open={renameTargetId !== null}
        title={renameDraft}
        onTitleChange={setRenameDraft}
        onClose={handleCloseRename}
        onSave={handleSaveRename}
      />
    </Styles.AppLayout>
  );
};

export default AgentPage; 