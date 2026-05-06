import React, { useRef, useEffect, useState, ChangeEvent, KeyboardEvent } from 'react';
import { MdSend, MdSearch, MdClose } from 'react-icons/md';
import { Message } from '../../hooks/useConversationManager';
import { searchSongs, SongSuggestion } from '../../services/api';
import * as Styles from '../../styles/AgentPageStyles';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  onSongSelect?: (song: SongSuggestion) => void;
  showScrollbars?: boolean;
  hideMessages?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  input,
  isLoading,
  onInputChange,
  onSend,
  onSongSelect,
  showScrollbars = false,
  hideMessages = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [newestMessageIdx, setNewestMessageIdx] = useState(-1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  // Search states
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<SongSuggestion[]>([]);

  // Track window resize for mobile detection
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 768);
    };
    
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [input]);

  // Clear newest message indicator after animation
  useEffect(() => {
    if (newestMessageIdx >= 0) {
      const timer = setTimeout(() => setNewestMessageIdx(-1), 1000);
      return () => clearTimeout(timer);
    }
  }, [newestMessageIdx]);

  const handleKeyPress = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  const handleSendClick = () => {
    onSend();
    setNewestMessageIdx(messages.length);
  };

  const handleSearchToggle = async () => {
    if (isSearchMode) {
      // Close search mode
      setIsSearchMode(false);
      setSearchResults([]);
    } else {
      // Open search mode and search if input exists
      setIsSearchMode(true);
      if (input.trim()) {
        setIsSearching(true);
        try {
          const results = await searchSongs(input.trim());
          setSearchResults(results);
        } catch (error) {
          console.error("Error searching songs:", error);
          setSearchResults([]);
        } finally {
          setIsSearching(false);
        }
      }
    }
  };

  const handleResultClick = (song: SongSuggestion) => {
    setIsSearchMode(false);
    setSearchResults([]);
    onInputChange(''); // clear the input
    if (onSongSelect) {
      onSongSelect(song);
    }
  };

  return (
    <>
      {!hideMessages && (
        <Styles.ChatMessages className={showScrollbars ? 'show-scrollbar' : ''}>
          {messages.map((message, index) => {
            // Check if this is a typing/processing indicator
            if (message.text === '...') {
            return (
              <Styles.AssistantTypingIndicator key={index} isProcessing={message.isProcessing}>
                {message.isProcessing && (
                  <Styles.ProcessingLabel>
                    {message.processingLabel || '🎵 Generating your video...'}
                  </Styles.ProcessingLabel>
                )}
                <Styles.DotContainer>
                  <Styles.Dot isProcessing={message.isProcessing} />
                  <Styles.Dot isProcessing={message.isProcessing} />
                  <Styles.Dot isProcessing={message.isProcessing} />
                </Styles.DotContainer>
              </Styles.AssistantTypingIndicator>
            );
          }
          
          // Regular message bubble
          return (
            <Styles.MessageBubble 
              key={index} 
              isUser={message.isUser}
              isNew={index === newestMessageIdx}
            >
              {message.text}
            </Styles.MessageBubble>
          );
        })}
        <div ref={messagesEndRef} />
      </Styles.ChatMessages>
      )}
      
      <Styles.ChatInput>
        <Styles.InputRowWrapper>
          {isSearchMode && (
            <Styles.ChatSearchOverlay>
              {isSearching ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Searching...</div>
              ) : searchResults.length > 0 ? (
                searchResults.map(song => (
                  <Styles.ChatSearchResultItem key={song.id} onClick={() => handleResultClick(song)}>
                    {song.album_cover ? (
                      <Styles.ChatSearchAlbumCover src={song.album_cover} alt={song.title} />
                    ) : (
                      <div style={{ width: '40px', height: '40px', backgroundColor: '#e0e0e0', borderRadius: '4px', marginRight: '12px' }} />
                    )}
                    <Styles.ChatSearchSongInfo>
                      <Styles.ChatSearchSongTitle>{song.title}</Styles.ChatSearchSongTitle>
                      <Styles.ChatSearchSongMeta>{song.artist} • {song.runtime}</Styles.ChatSearchSongMeta>
                    </Styles.ChatSearchSongInfo>
                  </Styles.ChatSearchResultItem>
                ))
              ) : input.trim() ? (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>No results found</div>
              ) : (
                <div style={{ padding: '20px', textAlign: 'center', color: '#666' }}>Type a song name and click search again to see results</div>
              )}
            </Styles.ChatSearchOverlay>
          )}
          
          <Styles.InputRow>
            <Styles.SearchToggleButton 
              onClick={handleSearchToggle} 
              isActive={isSearchMode}
              title={isSearchMode ? "Close search" : "Search for a song"}
            >
              {isSearchMode ? MdClose({ size: 20 }) : MdSearch({ size: 20 })}
            </Styles.SearchToggleButton>
            
            <Styles.Textarea
              ref={textareaRef}
              value={input}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onInputChange(e.target.value)}
              placeholder="Ask me about music or search a song..."
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              rows={1}
            />
          <Styles.SendButton onClick={handleSendClick} disabled={isLoading}>
            {isLoading ? 'Sending...' : (
              <>
                Send
                {MdSend({ size: 18, style: { marginLeft: '6px' } })}
              </>
            )}
          </Styles.SendButton>
          </Styles.InputRow>
          <Styles.HelperText>Press Enter to send, Shift+Enter for a new line</Styles.HelperText>
        </Styles.InputRowWrapper>
      </Styles.ChatInput>
    </>
  );
};
