import React, { useRef, useEffect, useState, ChangeEvent, KeyboardEvent } from 'react';
import { MdSend } from 'react-icons/md';
import { Message } from '../../hooks/useConversationManager';
import * as Styles from '../../styles/AgentPageStyles';

interface ChatInterfaceProps {
  messages: Message[];
  input: string;
  isLoading: boolean;
  onInputChange: (value: string) => void;
  onSend: () => void;
  showScrollbars?: boolean;
}

export const ChatInterface: React.FC<ChatInterfaceProps> = ({
  messages,
  input,
  isLoading,
  onInputChange,
  onSend,
  showScrollbars = false
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [newestMessageIdx, setNewestMessageIdx] = useState(-1);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

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

  return (
    <>
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
      
      <Styles.ChatInput>
        <Styles.InputRow>
          <Styles.Textarea
            ref={textareaRef}
            value={input}
            onChange={(e: ChangeEvent<HTMLTextAreaElement>) => onInputChange(e.target.value)}
            placeholder="Ask me about music..."
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
      </Styles.ChatInput>
    </>
  );
};
