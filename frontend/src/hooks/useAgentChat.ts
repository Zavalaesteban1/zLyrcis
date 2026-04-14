import { useState, useCallback } from 'react';
import { agent_chat, AgentChatResponse } from '../services/api';
import { Message } from './useConversationManager';

interface UseAgentChatOptions {
  onSongRequest?: (jobId: string, title: string, artist: string, isFavoriteOnly?: boolean) => void;
  onConversationIdReceived?: (conversationId: string) => void;
  onCustomizationRequest?: (jobId: string, existingVariants?: any[]) => void;
}

export const useAgentChat = (options: UseAgentChatOptions = {}) => {
  const { onSongRequest, onConversationIdReceived, onCustomizationRequest } = options;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = useCallback(async (
    message: string,
    conversationId?: string
  ): Promise<AgentChatResponse | null> => {
    if (!message.trim()) return null;

    setIsLoading(true);
    setError(null);

    try {
      const response = await agent_chat(message, conversationId);

      // Notify about conversation ID
      if (response.conversation_id) {
        onConversationIdReceived?.(response.conversation_id);
      }

      // Handle customization prompt
      if (response.show_customization_modal && response.job_id) {
        onCustomizationRequest?.(response.job_id, response.existing_variants);
      } else if (response.is_song_request && response.song_request_data) {
        // Handle normal song request
        const { job_id, title, artist } = response.song_request_data;
        const isFavoriteOnly = response.is_favorite_only || false;
        onSongRequest?.(job_id, title, artist, isFavoriteOnly);
      }

      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to send message';
      setError(errorMessage);
      console.error('Error sending message:', err);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [onSongRequest, onConversationIdReceived]);

  return {
    sendMessage,
    isLoading,
    error
  };
};
