import { useState, useCallback } from 'react';
import { agent_chat, AgentChatResponse } from '../services/api';

interface UseAgentChatOptions {
  onSongRequest?: (
    jobId: string,
    title: string,
    artist: string,
    conversationId: string,
    isFavoriteOnly?: boolean
  ) => void;
  onConversationIdReceived?: (conversationId: string) => void;
  onCustomizationRequest?: (jobId: string, conversationId: string, existingVariants?: any[]) => void;
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
      const resolvedConversationId = response.conversation_id || conversationId || '';

      if (response.conversation_id) {
        onConversationIdReceived?.(response.conversation_id);
      }

      if (response.show_customization_modal && response.job_id) {
        const jobId = response.job_id;
        const variants = response.existing_variants;
        setTimeout(() => {
          onCustomizationRequest?.(jobId, resolvedConversationId, variants);
        }, 1500);
      } else if (response.is_song_request && response.song_request_data) {
        const { job_id, title, artist, status: jobStatus } = response.song_request_data;
        const isFavoriteOnly = response.is_favorite_only || false;

        if (jobStatus !== 'awaiting_customization') {
          onSongRequest?.(job_id, title, artist, resolvedConversationId, isFavoriteOnly);
        }
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
  }, [onSongRequest, onConversationIdReceived, onCustomizationRequest]);

  return {
    sendMessage,
    isLoading,
    error
  };
};
