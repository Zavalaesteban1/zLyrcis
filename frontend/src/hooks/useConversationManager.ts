import { useState, useEffect, useCallback, useRef } from 'react';
import {
  fetchConversationHistory,
  fetchAllConversations,
  deleteConversationFromServer,
  appendConversationMessage,
  getVideoStatus
} from '../services/api';
import { hydrateSongPickFromUserContent, fillCachedCover, previewFromHydratedPick } from '../services/songPickFromTranscript';

export interface SongPickPayload {
  title: string;
  artist: string;
  albumCover: string | null;
}

export interface Message {
  text: string;
  isUser: boolean;
  isProcessing?: boolean;
  /** @deprecated Visual indicator is animation-only; kept for persisted conversations. */
  processingLabel?: string;
  /** Rich UI for user song selection; agent text uses `buildLyricVideoAgentMessage`. */
  songPick?: SongPickPayload;
}

export interface Conversation {
  id: string;
  title: string;
  lastMessage: string;
  date: Date;
  /** Used for sidebar ordering — higher = closer to top */
  lastActiveAt: number;
}

const getUserId = () => localStorage.getItem('user_id') || 'default';
const getConversationIdKey = () => `agent_conversation_id_${getUserId()}`;
const getConversationsListKey = () => `agent_conversations_list_${getUserId()}`;
const getConversationMessagesKey = (id: string) => `agent_conversation_messages_${getUserId()}_${id}`;
const getPendingJobsKey = () => `agent_pending_jobs_${getUserId()}`;

const WELCOME_MESSAGE: Message = {
  text: "Hi! I'm your lyric video assistant. I can create lyric videos and answer questions about music. What can I help you with today?",
  isUser: false
};

const VIDEO_READY_MESSAGE =
  "Great news! Your lyric video is now ready. You can view it in the My Songs section.";

function enrichSongPickMessages(msgs: Message[]): Message[] {
  return msgs.map((msg) => {
    if (!msg.isUser) return msg;
    if (msg.songPick) {
      const filled = fillCachedCover(msg.songPick);
      return filled.albumCover !== msg.songPick.albumCover ? { ...msg, songPick: filled } : msg;
    }
    const hydrated = hydrateSongPickFromUserContent(msg.text);
    if (!hydrated) return msg;
    return {
      ...msg,
      text: previewFromHydratedPick(hydrated),
      songPick: hydrated
    };
  });
}

function readPendingJobs(): Record<string, string> {
  try {
    const raw = localStorage.getItem(getPendingJobsKey());
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

function writePendingJobs(jobs: Record<string, string>) {
  if (Object.keys(jobs).length === 0) {
    localStorage.removeItem(getPendingJobsKey());
  } else {
    localStorage.setItem(getPendingJobsKey(), JSON.stringify(jobs));
  }
}

export function setPendingJob(conversationId: string, jobId: string) {
  const jobs = readPendingJobs();
  jobs[conversationId] = jobId;
  writePendingJobs(jobs);
}

export function clearPendingJob(conversationId: string) {
  const jobs = readPendingJobs();
  delete jobs[conversationId];
  writePendingJobs(jobs);
}

export function getPendingJob(conversationId: string): string | null {
  return readPendingJobs()[conversationId] ?? null;
}

function pruneInactiveTempConversations(convs: Conversation[], activeId: string): Conversation[] {
  return convs.filter((c) => !c.id.startsWith('temp-') || c.id === activeId);
}

function dedupeConversations(convs: Conversation[]): Conversation[] {
  const seen = new Set<string>();
  return convs.filter((conv) => {
    if (seen.has(conv.id)) return false;
    seen.add(conv.id);
    return true;
  });
}

function sortConversationsByActivity(convs: Conversation[]): Conversation[] {
  return [...convs].sort((a, b) => b.lastActiveAt - a.lastActiveAt);
}

function normalizeConversation(conv: Conversation): Conversation {
  const lastActiveAt =
    conv.lastActiveAt ??
    (conv.date instanceof Date ? conv.date.getTime() : new Date(conv.date).getTime());

  return {
    ...conv,
    date: conv.date instanceof Date ? conv.date : new Date(conv.date),
    lastActiveAt
  };
}

function prependConversation(convs: Conversation[], conv: Conversation): Conversation[] {
  return sortConversationsByActivity(
    dedupeConversations([conv, ...convs.filter((c) => c.id !== conv.id)])
  );
}

function mergeMessageHistory(backendMsgs: Message[], localMsgs: Message[]): Message[] {
  const merged = enrichSongPickMessages(backendMsgs);
  const backendKeys = new Set(merged.map((m) => `${m.isUser}:${m.text}`));

  for (const msg of localMsgs) {
    if (msg.isProcessing || msg.text === '...') continue;
    const key = `${msg.isUser}:${msg.text}`;
    if (!backendKeys.has(key)) {
      merged.push(msg);
      backendKeys.add(key);
    }
  }

  return merged;
}

async function applyPendingJobState(conversationId: string, msgs: Message[]): Promise<Message[]> {
  const jobId = getPendingJob(conversationId);
  if (!jobId) {
    return msgs.filter((m) => !m.isProcessing);
  }

  try {
    const status = await getVideoStatus(jobId);
    if (status.status === 'pending' || status.status === 'processing') {
      const hasProcessing = msgs.some((m) => m.isProcessing);
      if (hasProcessing) return msgs;
      return [...msgs, { text: '...', isUser: false, isProcessing: true }];
    }

    clearPendingJob(conversationId);
    const withoutProcessing = msgs.filter((m) => !m.isProcessing);

    if (status.status === 'completed') {
      const hasCompletion = withoutProcessing.some((m) =>
        m.text.includes('lyric video is now ready')
      );
      if (hasCompletion) return withoutProcessing;
      return [...withoutProcessing, { text: VIDEO_READY_MESSAGE, isUser: false }];
    }

    if (status.status === 'failed') {
      const errorText = `I'm sorry, but there was an issue generating your lyric video. The error was: ${status.error || 'Unknown error'}`;
      const hasError = withoutProcessing.some((m) => m.text.includes('issue generating your lyric video'));
      if (hasError) return withoutProcessing;
      return [...withoutProcessing, { text: errorText, isUser: false }];
    }
  } catch (error) {
    console.error('Error checking pending job status:', error);
  }

  return msgs.filter((m) => !m.isProcessing);
}

function backendMessagesToLocal(
  messages: { role: string; content: string }[]
): Message[] {
  return messages.map((msg) => ({
    text: msg.content,
    isUser: msg.role === 'user',
    isProcessing: false
  }));
}

function writeConversationsList(convs: Conversation[]) {
  const deduped = sortConversationsByActivity(
    dedupeConversations(convs.map(normalizeConversation))
  );
  localStorage.setItem(getConversationsListKey(), JSON.stringify(deduped));
  return deduped;
}

function mergeConversationLists(
  localConversations: Conversation[],
  serverConversations: { id: string; title: string; lastMessage: string; date: string }[]
): Conversation[] {
  const serverById = new Map(
    serverConversations.map((conv) => [
      conv.id,
      {
        id: conv.id,
        title: conv.title,
        lastMessage: conv.lastMessage,
        date: new Date(conv.date),
        lastActiveAt: new Date(conv.date).getTime()
      } as Conversation
    ])
  );

  const merged: Conversation[] = [];
  const seen = new Set<string>();

  for (const local of localConversations.map(normalizeConversation)) {
    if (!local.id.startsWith('temp-') && !serverById.has(local.id)) {
      continue;
    }

    const server = serverById.get(local.id);
    merged.push(
      server
        ? {
            ...local,
            title: server.title,
            lastMessage: server.lastMessage,
            date: server.date,
            lastActiveAt: Math.max(local.lastActiveAt, server.lastActiveAt)
          }
        : local
    );
    seen.add(local.id);
  }

  for (const server of Array.from(serverById.values())) {
    if (!seen.has(server.id)) {
      merged.push(server);
    }
  }

  return sortConversationsByActivity(merged);
}

export const useConversationManager = (options?: { disableAutoLoad?: boolean }) => {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string>('');
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [isLoading, setIsLoading] = useState(false);
  const isInitialized = useRef(false);
  const messagesRef = useRef(messages);
  const activeConversationIdRef = useRef(activeConversationId);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  useEffect(() => {
    activeConversationIdRef.current = activeConversationId;
  }, [activeConversationId]);

  const saveMessages = useCallback((conversationId: string, msgs: Message[]) => {
    if (!conversationId || msgs.length <= 1) return;
    localStorage.setItem(getConversationMessagesKey(conversationId), JSON.stringify(msgs));
  }, []);

  const saveConversationSnapshot = useCallback(
    (conversationId: string, msgs: Message[]) => {
      if (!conversationId || msgs.length <= 1) return;

      const lastNonProcessingMsg = [...msgs]
        .reverse()
        .find((msg) => !msg.isProcessing && msg.text !== '...');

      if (!lastNonProcessingMsg) return;

      setConversations((prev) => {
        const existing = prev.find((c) => c.id === conversationId);
        if (!existing) return prev;

        const next = prev.map((conv) =>
          conv.id === conversationId
            ? { ...conv, lastMessage: lastNonProcessingMsg.text }
            : conv
        );
        writeConversationsList(next);
        return next;
      });

      saveMessages(conversationId, msgs);
    },
    [saveMessages]
  );

  const persistMessagesForConversation = useCallback(
    (conversationId: string, msgs: Message[], touchOrder = true) => {
      if (!conversationId || msgs.length <= 1) return;

      const lastNonProcessingMsg = [...msgs]
        .reverse()
        .find((msg) => !msg.isProcessing && msg.text !== '...');

      if (!lastNonProcessingMsg) return;

      setConversations((prev) => {
        const existing = prev.find((c) => c.id === conversationId);
        let next: Conversation[];

        // Guard: stale temp ID after replaceConversationId — redirect to active permanent ID
        let targetId = conversationId;
        let targetExisting = existing;
        const activeId = activeConversationIdRef.current;
        if (
          !targetExisting &&
          conversationId.startsWith('temp-') &&
          activeId &&
          !activeId.startsWith('temp-') &&
          activeId !== conversationId
        ) {
          targetId = activeId;
          targetExisting = prev.find((c) => c.id === targetId);
        }

        if (targetExisting) {
          const updated: Conversation = {
            ...targetExisting,
            lastMessage: lastNonProcessingMsg.text,
            date: touchOrder ? new Date() : targetExisting.date,
            lastActiveAt: touchOrder ? Date.now() : targetExisting.lastActiveAt
          };
          next = touchOrder
            ? prependConversation(prev, updated)
            : prev.map((conv) => (conv.id === targetId ? updated : conv));
        } else {
          const titleSource = msgs.find((m) => m.isUser)?.text || 'New conversation';
          const title =
            titleSource.length > 30 ? `${titleSource.substring(0, 30)}...` : titleSource;

          const newConv: Conversation = {
            id: targetId,
            title,
            lastMessage: lastNonProcessingMsg.text,
            date: new Date(),
            lastActiveAt: Date.now()
          };
          next = prependConversation(prev, newConv);
        }

        writeConversationsList(next);
        return next;
      });

      saveMessages(
        conversationId.startsWith('temp-') &&
          activeConversationIdRef.current &&
          !activeConversationIdRef.current.startsWith('temp-')
          ? activeConversationIdRef.current
          : conversationId,
        msgs
      );
    },
    [saveMessages]
  );

  const appendMessageToConversation = useCallback(
    async (conversationId: string, text: string, persistToServer = true) => {
      if (!conversationId || conversationId.startsWith('temp-')) return;

      const saved = localStorage.getItem(getConversationMessagesKey(conversationId));
      let baseMessages: Message[] = [WELCOME_MESSAGE];

      if (saved) {
        try {
          baseMessages = JSON.parse(saved) as Message[];
        } catch {
          baseMessages = [WELCOME_MESSAGE];
        }
      }

      const withoutProcessing = baseMessages.filter((m) => !m.isProcessing);
      const alreadyHasMessage = withoutProcessing.some((m) => m.text === text);
      if (alreadyHasMessage) return;

      const updated = [...withoutProcessing, { text, isUser: false }];
      persistMessagesForConversation(conversationId, updated);

      if (conversationId === activeConversationIdRef.current) {
        setMessages(updated);
      }

      if (persistToServer) {
        try {
          await appendConversationMessage(conversationId, 'assistant', text);
        } catch (error) {
          console.error('Failed to persist message to server:', error);
        }
      }
    },
    [persistMessagesForConversation]
  );

  const loadFromLocalStorage = useCallback(
    async (id: string) => {
      const saved = localStorage.getItem(getConversationMessagesKey(id));
      let parsed: Message[] = [WELCOME_MESSAGE];

      if (saved) {
        try {
          parsed = enrichSongPickMessages(JSON.parse(saved) as Message[]);
        } catch (error) {
          console.error('Error parsing saved messages:', error);
        }
      }

      const withJobState = await applyPendingJobState(id, parsed);
      setMessages(withJobState);
      setActiveConversationId(id);
      activeConversationIdRef.current = id;
      localStorage.setItem(getConversationIdKey(), id);
      saveMessages(id, withJobState);
    },
    [saveMessages]
  );

  const loadConversation = useCallback(
    async (id: string) => {
      if (!id || id === activeConversationIdRef.current || isLoading) return;

      const previousId = activeConversationIdRef.current;
      if (previousId && messagesRef.current.length > 1) {
        saveConversationSnapshot(previousId, messagesRef.current);
      }

      setIsLoading(true);

      try {
        const history = await fetchConversationHistory(id);
        const localSaved = localStorage.getItem(getConversationMessagesKey(id));
        let localMessages: Message[] = [];

        if (localSaved) {
          try {
            localMessages = JSON.parse(localSaved) as Message[];
          } catch {
            localMessages = [];
          }
        }

        if (history.messages && history.messages.length > 0) {
          const backendLocal = backendMessagesToLocal(history.messages);
          const hasWelcome = backendLocal.some(
            (msg) => !msg.isUser && msg.text.includes("I'm your lyric video assistant")
          );
          const baseMessages = hasWelcome
            ? backendLocal
            : [WELCOME_MESSAGE, ...backendLocal];

          const merged = mergeMessageHistory(baseMessages, localMessages);
          const withJobState = await applyPendingJobState(id, merged);

          setMessages(withJobState);
          setActiveConversationId(id);
          activeConversationIdRef.current = id;
          localStorage.setItem(getConversationIdKey(), id);
          saveMessages(id, withJobState);
        } else {
          await loadFromLocalStorage(id);
        }
      } catch (error) {
        console.error('Error loading conversation from backend:', error);
        await loadFromLocalStorage(id);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, loadFromLocalStorage, saveConversationSnapshot, saveMessages]
  );

  const syncConversationsFromServer = useCallback(async () => {
    const token = localStorage.getItem('auth_token');
    if (!token) return;

    try {
      const { conversations: serverConversations } = await fetchAllConversations();
      const localSaved = localStorage.getItem(getConversationsListKey());
      let localConversations: Conversation[] = [];

      if (localSaved) {
        try {
          localConversations = (JSON.parse(localSaved) as Conversation[]).map(normalizeConversation);
        } catch {
          localConversations = [];
        }
      }

      const merged = writeConversationsList(
        pruneInactiveTempConversations(
          mergeConversationLists(localConversations, serverConversations),
          localStorage.getItem(getConversationIdKey()) || ''
        )
      );

      setConversations(merged);
    } catch (error) {
      console.error('Error syncing conversations from server:', error);
    }
  }, []);

  useEffect(() => {
    if (isInitialized.current) return;

    const initialize = async () => {
      isInitialized.current = true;

      await syncConversationsFromServer();

      if (options?.disableAutoLoad) return;

      const savedId = localStorage.getItem(getConversationIdKey());
      if (savedId) {
        await loadConversation(savedId);
      }
    };

    initialize();
  }, [options?.disableAutoLoad, loadConversation, syncConversationsFromServer]);

  const createNewConversation = useCallback(() => {
    const tempId = `temp-${Date.now()}`;
    const now = Date.now();
    const newConv: Conversation = {
      id: tempId,
      title: 'New conversation',
      lastMessage: WELCOME_MESSAGE.text,
      date: new Date(now),
      lastActiveAt: now
    };

    const previousId = activeConversationIdRef.current;

    if (previousId && messagesRef.current.length > 1) {
      saveConversationSnapshot(previousId, messagesRef.current);
    }

    setConversations((prev) => {
      const next = prependConversation(prev, newConv);
      writeConversationsList(next);
      return next;
    });

    setActiveConversationId(tempId);
    activeConversationIdRef.current = tempId;
    localStorage.setItem(getConversationIdKey(), tempId);
    setMessages([WELCOME_MESSAGE]);

    return tempId;
  }, [saveConversationSnapshot]);

  const updateConversation = useCallback((id: string, updates: Partial<Conversation>) => {
    setConversations((prev) => {
      const existing = prev.find((c) => c.id === id);
      if (!existing) return prev;

      const now = Date.now();
      const updated: Conversation = {
        ...existing,
        ...updates,
        date: new Date(now),
        lastActiveAt: now
      };
      const next = prependConversation(prev, updated);
      writeConversationsList(next);
      return next;
    });
  }, []);

  // Saves messages without changing sort order use for auto-saves, loading, completion messages
  const updateConversationMessages = useCallback(
    (id: string, msgs: Message[]) => {
      persistMessagesForConversation(id, msgs, false);
    },
    [persistMessagesForConversation]
  );

  // Saves messages AND bumps the conversation to the top call only when user sends a message
  const bumpConversationToTop = useCallback(
    (id: string, msgs: Message[]) => {
      persistMessagesForConversation(id, msgs, true);
    },
    [persistMessagesForConversation]
  );

  const deleteConversation = useCallback(
    async (id: string) => {
      try {
        await deleteConversationFromServer(id);
      } catch (error) {
        console.error('Failed to delete conversation from server:', error);
        throw error;
      }

      clearPendingJob(id);
      localStorage.removeItem(getConversationMessagesKey(id));

      let nextConversations: Conversation[] = [];
      setConversations((prev) => {
        nextConversations = prev.filter((c) => c.id !== id);
        writeConversationsList(nextConversations);
        return nextConversations;
      });

      if (id === activeConversationIdRef.current) {
        const sorted = sortConversationsByActivity(nextConversations);
        if (sorted.length > 0) {
          await loadConversation(sorted[0].id);
        } else {
          setActiveConversationId('');
          activeConversationIdRef.current = '';
          localStorage.removeItem(getConversationIdKey());
          setMessages([WELCOME_MESSAGE]);
        }
      }
    },
    [loadConversation]
  );

  const replaceConversationId = useCallback((tempId: string, permanentId: string) => {
    if (tempId === permanentId) return;

    const pendingJob = getPendingJob(tempId);
    if (pendingJob) {
      setPendingJob(permanentId, pendingJob);
      clearPendingJob(tempId);
    }

    const savedMessages = localStorage.getItem(getConversationMessagesKey(tempId));
    if (savedMessages) {
      localStorage.setItem(getConversationMessagesKey(permanentId), savedMessages);
      localStorage.removeItem(getConversationMessagesKey(tempId));
    }

    setConversations((prev) => {
      const withoutDuplicate = prev.filter(
        (conv) => conv.id !== permanentId || conv.id === tempId
      );
      const next = withoutDuplicate.map((conv) =>
        conv.id === tempId
          ? { ...conv, id: permanentId, lastActiveAt: Math.max(conv.lastActiveAt, Date.now()) }
          : conv
      );
      const sorted = sortConversationsByActivity(
        pruneInactiveTempConversations(next, permanentId)
      );

      writeConversationsList(sorted);
      return sorted;
    });

    if (activeConversationIdRef.current === tempId) {
      setActiveConversationId(permanentId);
      activeConversationIdRef.current = permanentId;
      localStorage.setItem(getConversationIdKey(), permanentId);
    }

    // Clean up any messages accidentally written back to the stale temp key
    localStorage.removeItem(getConversationMessagesKey(tempId));
  }, []);

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
    bumpConversationToTop,
    deleteConversation,
    replaceConversationId,
    setActiveConversationId,
    appendMessageToConversation,
    syncConversationsFromServer
  };
};
