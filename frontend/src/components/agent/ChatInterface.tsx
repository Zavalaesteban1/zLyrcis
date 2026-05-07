import React, { useRef, useEffect, useState, ChangeEvent, KeyboardEvent } from 'react';
import { MdSend, MdSearch, MdMusicNote } from 'react-icons/md';
import { Message } from '../../hooks/useConversationManager';
import { SongSuggestion } from '../../services/api';
import { resolveUserSongPickForDisplay } from '../../services/songPickFromTranscript';
import { SongSearchModal } from './SongSearchModal';
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
  const [searchModalOpen, setSearchModalOpen] = useState(false);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;

    textarea.style.height = 'auto';
    textarea.style.height = `${Math.min(textarea.scrollHeight, 140)}px`;
  }, [input]);

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

  const handleSongPicked = (song: SongSuggestion) => {
    onInputChange('');
    onSongSelect?.(song);
  };

  return (
    <>
      {!hideMessages && (
        <Styles.ChatMessages className={showScrollbars ? 'show-scrollbar' : ''}>
          {messages.map((message, index) => {
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

            const songPick = resolveUserSongPickForDisplay(message);
            if (message.isUser && songPick) {
              return (
                <Styles.UserSongPickBubble key={index} $isNew={index === newestMessageIdx}>
                  {songPick.albumCover ? (
                    <Styles.UserSongPickCover src={songPick.albumCover} alt="" />
                  ) : (
                    <Styles.UserSongPickCoverPlaceholder>
                      {MdMusicNote({ size: 24 })}
                    </Styles.UserSongPickCoverPlaceholder>
                  )}
                  <Styles.UserSongPickText>
                    <Styles.UserSongPickTitle>{songPick.title}</Styles.UserSongPickTitle>
                    <Styles.UserSongPickArtist>{songPick.artist}</Styles.UserSongPickArtist>
                  </Styles.UserSongPickText>
                </Styles.UserSongPickBubble>
              );
            }

            return (
              <Styles.MessageBubble key={index} isUser={message.isUser} isNew={index === newestMessageIdx}>
                {message.text}
              </Styles.MessageBubble>
            );
          })}
          <div ref={messagesEndRef} />
        </Styles.ChatMessages>
      )}

      <SongSearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelect={handleSongPicked}
      />

      <Styles.ChatInput>
        <Styles.InputRowWrapper>
          <Styles.InputRow>
            <Styles.SearchToggleButton
              type="button"
              onClick={() => setSearchModalOpen(true)}
              isActive={false}
              title="Search for a song"
            >
              {MdSearch({ size: 22 })}
            </Styles.SearchToggleButton>

            <Styles.Textarea
              ref={textareaRef}
              value={input}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onInputChange(e.target.value)}
              placeholder="Ask me about music or describe what you need…"
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              rows={1}
            />
            <Styles.SendButton type="button" onClick={handleSendClick} disabled={isLoading}>
              {isLoading ? (
                'Sending...'
              ) : (
                <>
                  Send
                  {MdSend({ size: 18, style: { marginLeft: 6 } })}
                </>
              )}
            </Styles.SendButton>
          </Styles.InputRow>
          <Styles.HelperText>
            Enter sends, Shift+Enter newline, or use search for songs.
          </Styles.HelperText>
        </Styles.InputRowWrapper>
      </Styles.ChatInput>
    </>
  );
};
