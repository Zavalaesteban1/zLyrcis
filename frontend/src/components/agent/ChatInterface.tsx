import React, { useRef, useEffect, useState, ChangeEvent, KeyboardEvent } from 'react';
import { MdSearch, MdMusicNote, MdArrowUpward } from 'react-icons/md';
import { Message } from '../../hooks/useConversationManager';
import { SongSuggestion } from '../../services/api';
import { resolveUserSongPickForDisplay } from '../../services/songPickFromTranscript';
import { SongSearchModal } from './SongSearchModal';
import { IconAgentOrbit } from '../icons/IconAgentOrbit';
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
    const nextHeight = Math.min(textarea.scrollHeight, 200);
    textarea.style.height = `${nextHeight}px`;
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
          <Styles.ChatThreadColumn>
          {messages.map((message, index) => {
            if (message.text === '...') {
              return (
                <Styles.AssistantTypingIndicator
                  key={index}
                  isProcessing={message.isProcessing}
                  role="status"
                  aria-label={message.isProcessing ? 'Generating video' : 'Assistant is typing'}
                >
                  {message.isProcessing ? (
                    <Styles.BarContainer>
                      <Styles.AnimatedBar delay={0} />
                      <Styles.AnimatedBar delay={0.1} />
                      <Styles.AnimatedBar delay={0.2} />
                      <Styles.AnimatedBar delay={0.3} />
                      <Styles.AnimatedBar delay={0.4} />
                      <Styles.AnimatedBar delay={0.5} />
                      <Styles.AnimatedBar delay={0.4} />
                      <Styles.AnimatedBar delay={0.3} />
                      <Styles.AnimatedBar delay={0.2} />
                      <Styles.AnimatedBar delay={0.1} />
                    </Styles.BarContainer>
                  ) : (
                    <Styles.AgentTypingSpinner>
                      <IconAgentOrbit size={28} />
                    </Styles.AgentTypingSpinner>
                  )}
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

            return message.isUser ? (
              <Styles.MessageBubble key={index} isUser={message.isUser} isNew={index === newestMessageIdx}>
                {message.text}
              </Styles.MessageBubble>
            ) : (
              <Styles.AssistantMessageBlock key={index}>
                <Styles.MessageBubble isUser={false} isNew={index === newestMessageIdx}>
                  {message.text}
                </Styles.MessageBubble>
                {index < messages.length - 1 && <Styles.MessageDivider aria-hidden="true" />}
              </Styles.AssistantMessageBlock>
            );
          })}
          <div ref={messagesEndRef} />
          </Styles.ChatThreadColumn>
        </Styles.ChatMessages>
      )}

      <SongSearchModal
        open={searchModalOpen}
        onClose={() => setSearchModalOpen(false)}
        onSelect={handleSongPicked}
      />

      <Styles.ChatInput>
        <Styles.InputRowWrapper>
          <Styles.ClaudeInputCard>
            <Styles.ClaudeTextarea
              ref={textareaRef}
              value={input}
              onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onInputChange(e.target.value)}
              placeholder="Reply..."
              onKeyDown={handleKeyPress}
              disabled={isLoading}
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
                  onClick={handleSendClick}
                  disabled={isLoading || !input.trim()}
                  title="Send message"
                >
                  {MdArrowUpward({ size: 20 })}
                </Styles.ClaudeSendButton>
              </Styles.ClaudeToolbarGroup>
            </Styles.ClaudeInputToolbar>
          </Styles.ClaudeInputCard>
        </Styles.InputRowWrapper>
      </Styles.ChatInput>
    </>
  );
};
