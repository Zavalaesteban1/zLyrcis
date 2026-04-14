import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchConversationHistory, ConversationMessage } from '../services/api';

export interface Message {
  text: string;
  isUser: boolean;
  isProcessing?: boolean;
  processingLabel?: string;  // Custom label for processing indicator
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  date: Date;
}

const getUserId = () => localStorage.getItem('user_id') || 'default';
const getConversationIdKey = () => `agent_conversation_id_${getUserId()}`;
const getConversationsListKey = () => `agent_conversations_list_${getUserId()}`;
const getConversationMessagesKey = (id: string) => `agent_conversation_messages_${getUserId()}_${id}`;

const WELCOME_MESSAGE: Message = {
  text: "Hi! I'm your lyric video assistant. I can create lyric videos and answer questions about music. What can I help you with today?",
  isUser: false
};

export const useConversationManager = () => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);

  // Load conversations list from localStorage
  useEffect(() => {
    const loadConversationsList = () => {
      const saved = localStorage.getItem(getConversationsListKey());
      if (saved) {
        try {
          const parsed = JSON.parse(saved) as Conversation[];
          // Convert date strings back to Date objects
          const withDates = parsed.map(conv => ({
            ...conv,
            date: new Date(conv.date)
          }));
          setConversations(withDates);
        } catch (error) {
          console.error('Error parsing conversations list:', error);
        }
      }
    };

    loadConversationsList();
  }, []);

  // Load active conversation on mount
  useEffect(() => {
    if (isInitialized.current) return;

    const loadActiveConversation = async () => {
      const savedId = localStorage.getItem(getConversationIdKey());

      if (savedId) {
        await loadConversation(savedId);
      }

      isInitialized.current = true;
    };

    loadActiveConversation();
  }, []);

  // Save conversations list to localStorage
  const saveConversationsList = useCallback((convs: Conversation[]) => {
    localStorage.setItem(getConversationsListKey(), JSON.stringify(convs));
  }, []);

  // Save messages for a specific conversation
  const saveMessages = useCallback((conversationId: string, msgs: Message[]) => {
    if (!conversationId || msgs.length <= 1) return;

    localStorage.setItem(getConversationMessagesKey(conversationId), JSON.stringify(msgs));
  }, []);

  // Load conversation by ID
  const loadConversation = useCallback(async (id: string) => {
    if (!id || id === activeConversationId || isLoading) return;

    setIsLoading(true);

    try {
      // Try backend first
      const history = await fetchConversationHistory(id);

      if (history.messages && history.messages.length > 0) {
        const convertedMessages: Message[] = history.messages.map(msg => ({
          text: msg.content,
          isUser: msg.role === 'user',
          isProcessing: false
        }));

        const hasWelcome = convertedMessages.some(
          msg => !msg.isUser && msg.text.includes("I'm your lyric video assistant")
        );

        const finalMessages = hasWelcome
          ? convertedMessages
          : [WELCOME_MESSAGE, ...convertedMessages];

        setMessages(finalMessages);
        setActiveConversationId(id);
        localStorage.setItem(getConversationIdKey(), id);
        saveMessages(id, finalMessages);
      } else {
        // Try localStorage fallback
        loadFromLocalStorage(id);
      }
    } catch (error) {
      console.error('Error loading conversation from backend:', error);
      loadFromLocalStorage(id);
    } finally {
      setIsLoading(false);
    }
  }, [activeConversationId, isLoading, saveMessages]);

  // Load from localStorage fallback
  const loadFromLocalStorage = useCallback((id: string) => {
    const saved = localStorage.getItem(getConversationMessagesKey(id));

    if (saved) {
      try {
        const parsed = JSON.parse(saved) as Message[];
        setMessages(parsed);
        setActiveConversationId(id);
        localStorage.setItem(getConversationIdKey(), id);
      } catch (error) {
        console.error('Error parsing saved messages:', error);
        setMessages([WELCOME_MESSAGE]);
        setActiveConversationId(id);
      }
    } else {
      setMessages([WELCOME_MESSAGE]);
      setActiveConversationId(id);
    }
  }, []);

  // Create new conversation
  const createNewConversation = useCallback(() => {
    const tempId = `temp-${Date.now()}`;
    const newConv: Conversation = {
      id: tempId,
      title: 'New conversation',
      lastMessage: WELCOME_MESSAGE.text,
      date: new Date()
    };

    const updatedConvs = [newConv, ...conversations];
    setConversations(updatedConvs);
    saveConversationsList(updatedConvs);

    setActiveConversationId(tempId);
    localStorage.setItem(getConversationIdKey(), tempId);

    setMessages([WELCOME_MESSAGE]);
    saveMessages(tempId, [WELCOME_MESSAGE]);

    return tempId;
  }, [conversations, saveConversationsList, saveMessages]);

  // Update conversation title and metadata
  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    const updatedConvs = conversations.map(conv =>
      conv.id === id ? { ...conv, ...updates, date: new Date() } : conv
    );

    // Move updated conversation to top
    const index = updatedConvs.findIndex(c => c.id === id);
    if (index > 0) {
      const [conv] = updatedConvs.splice(index, 1);
      updatedConvs.unshift(conv);
    }

    setConversations(updatedConvs);
    saveConversationsList(updatedConvs);
  }, [conversations, saveConversationsList]);

  // Update conversation with new messages
  const updateConversationMessages = useCallback((id: string, msgs: Message[]) => {
    if (msgs.length <= 1) return;

    const lastNonProcessingMsg = [...msgs].reverse()
      .find(msg => !msg.isProcessing && msg.text !== '...');

    if (!lastNonProcessingMsg) return;

    const existingConv = conversations.find(c => c.id === id);

    if (existingConv) {
      updateConversation(id, {
        lastMessage: lastNonProcessingMsg.text
      });
    } else {
      // Create new conversation entry
      const title = msgs.find(m => m.isUser)?.text.substring(0, 30) + '...' || 'New conversation';
      const newConv: Conversation = {
        id,
        title,
        lastMessage: lastNonProcessingMsg.text,
        date: new Date()
      };

      const updatedConvs = [newConv, ...conversations];
      setConversations(updatedConvs);
      saveConversationsList(updatedConvs);
    }

    saveMessages(id, msgs);
  }, [conversations, updateConversation, saveConversationsList, saveMessages]);

  // Delete conversation
  const deleteConversation = useCallback((id: string) => {
    const updatedConvs = conversations.filter(c => c.id !== id);
    setConversations(updatedConvs);
    saveConversationsList(updatedConvs);

    // Remove messages from localStorage
    localStorage.removeItem(getConversationMessagesKey(id));

    // If deleting active conversation, load the next one or reset
    if (id === activeConversationId) {
      if (updatedConvs.length > 0) {
        loadConversation(updatedConvs[0].id);
      } else {
        setActiveConversationId('');
        localStorage.removeItem(getConversationIdKey());
        setMessages([WELCOME_MESSAGE]);
      }
    }
  }, [conversations, activeConversationId, saveConversationsList, loadConversation]);

  // Replace temporary ID with permanent one
  const replaceConversationId = useCallback((tempId: string, permanentId: string) => {
    const updatedConvs = conversations.map(conv =>
      conv.id === tempId ? { ...conv, id: permanentId } : conv
    );

    setConversations(updatedConvs);
    saveConversationsList(updatedConvs);

    // Update active conversation ID
    if (activeConversationId === tempId) {
      setActiveConversationId(permanentId);
      localStorage.setItem(getConversationIdKey(), permanentId);
    }

    // Copy messages to new key and delete old
    const savedMessages = localStorage.getItem(getConversationMessagesKey(tempId));
    if (savedMessages) {
      localStorage.setItem(getConversationMessagesKey(permanentId), savedMessages);
      localStorage.removeItem(getConversationMessagesKey(tempId));
    }
  }, [conversations, activeConversationId, saveConversationsList]);

  return {
    conversations,
    activeConversationId,
    messages,
    isLoading,
    setMessages,
    loadConversation,
    createNewConversation,
    updateConversation,
    updateConversationMessages,
    deleteConversation,
    replaceConversationId,
    setActiveConversationId
  };
};
