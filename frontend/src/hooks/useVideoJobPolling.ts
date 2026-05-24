import { useEffect, useRef, useCallback } from 'react';
import { getVideoStatus } from '../services/api';
import { setPendingJob, clearPendingJob, getPendingJob } from './useConversationManager';

interface VideoJobPollingOptions {
  onCompleted?: (jobId: string, conversationId: string) => void;
  onFailed?: (jobId: string, conversationId: string, error: string) => void;
  onStatusUpdate?: (jobId: string, conversationId: string, status: string) => void;
  pollingInterval?: number;
  activeConversationId?: string;
}

export const useVideoJobPolling = (options: VideoJobPollingOptions = {}) => {
  const {
    onCompleted,
    onFailed,
    onStatusUpdate,
    pollingInterval = 10000,
    activeConversationId = ''
  } = options;

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const pollingJobsRef = useRef<Record<string, string>>({});
  const callbacksRef = useRef({ onCompleted, onFailed, onStatusUpdate });

  useEffect(() => {
    callbacksRef.current = { onCompleted, onFailed, onStatusUpdate };
  }, [onCompleted, onFailed, onStatusUpdate]);

  const stopPollingInterval = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const checkJobStatus = useCallback(
    async (conversationId: string, jobId: string) => {
      try {
        const statusResponse = await getVideoStatus(jobId);
        callbacksRef.current.onStatusUpdate?.(jobId, conversationId, statusResponse.status);

        if (statusResponse.status === 'completed') {
          delete pollingJobsRef.current[conversationId];
          clearPendingJob(conversationId);
          callbacksRef.current.onCompleted?.(jobId, conversationId);
        } else if (statusResponse.status === 'failed') {
          delete pollingJobsRef.current[conversationId];
          clearPendingJob(conversationId);
          callbacksRef.current.onFailed?.(
            jobId,
            conversationId,
            statusResponse.error || 'Unknown error'
          );
        }
      } catch (error) {
        console.error('Error checking video status:', error);
        delete pollingJobsRef.current[conversationId];
        clearPendingJob(conversationId);
        callbacksRef.current.onFailed?.(
          jobId,
          conversationId,
          error instanceof Error ? error.message : 'Unknown error'
        );
      }
    },
    []
  );

  const pollAllJobs = useCallback(async () => {
    const entries = Object.entries(pollingJobsRef.current);
    await Promise.all(entries.map(([conversationId, jobId]) => checkJobStatus(conversationId, jobId)));
  }, [checkJobStatus]);

  const ensurePollingInterval = useCallback(() => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      pollAllJobs();
    }, pollingInterval);
  }, [pollAllJobs, pollingInterval]);

  const startPolling = useCallback(
    (jobId: string, conversationId: string) => {
      if (!jobId || !conversationId) return;

      pollingJobsRef.current[conversationId] = jobId;
      setPendingJob(conversationId, jobId);
      ensurePollingInterval();
      checkJobStatus(conversationId, jobId);
    },
    [checkJobStatus, ensurePollingInterval]
  );

  const stopPolling = useCallback(
    (conversationId?: string) => {
      if (conversationId) {
        delete pollingJobsRef.current[conversationId];
        clearPendingJob(conversationId);
      } else {
        pollingJobsRef.current = {};
      }

      if (Object.keys(pollingJobsRef.current).length === 0) {
        stopPollingInterval();
      }
    },
    [stopPollingInterval]
  );

  // Resume polling for any pending jobs saved in localStorage
  useEffect(() => {
    const prefix = `agent_pending_jobs_${localStorage.getItem('user_id') || 'default'}`;
    const raw = localStorage.getItem(prefix);
    if (!raw) return;

    try {
      const jobs = JSON.parse(raw) as Record<string, string>;
      Object.entries(jobs).forEach(([conversationId, jobId]) => {
        pollingJobsRef.current[conversationId] = jobId;
      });
      if (Object.keys(jobs).length > 0) {
        ensurePollingInterval();
        pollAllJobs();
      }
    } catch (error) {
      console.error('Failed to restore pending video jobs:', error);
    }
  }, [ensurePollingInterval, pollAllJobs]);

  // When switching back to a conversation with a pending job, check immediately
  useEffect(() => {
    if (!activeConversationId) return;
    const jobId = getPendingJob(activeConversationId);
    if (!jobId) return;

    pollingJobsRef.current[activeConversationId] = jobId;
    ensurePollingInterval();
    checkJobStatus(activeConversationId, jobId);
  }, [activeConversationId, checkJobStatus, ensurePollingInterval]);

  useEffect(() => {
    return () => {
      stopPollingInterval();
    };
  }, [stopPollingInterval]);

  return {
    startPolling,
    stopPolling,
    isPolling: Object.keys(pollingJobsRef.current).length > 0
  };
};
