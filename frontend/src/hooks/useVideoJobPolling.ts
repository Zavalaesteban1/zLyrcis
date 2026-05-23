import { useState, useEffect, useRef, useCallback } from 'react';
import { getVideoStatus } from '../services/api';

interface VideoJobPollingOptions {
  onCompleted?: (jobId: string) => void;
  onFailed?: (jobId: string, error: string) => void;
  onStatusUpdate?: (jobId: string, status: string) => void;
  pollingInterval?: number;
}

const CURRENT_JOB_ID_KEY = 'agent_current_job_id';

export const useVideoJobPolling = (options: VideoJobPollingOptions = {}) => {
  const {
    onCompleted,
    onFailed,
    onStatusUpdate,
    pollingInterval = 10000 // 10 seconds
  } = options;

  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [isPolling, setIsPolling] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // Load ongoing job from localStorage on mount
  useEffect(() => {
    const savedJobId = localStorage.getItem(CURRENT_JOB_ID_KEY);
    if (savedJobId) {
      console.log('Resuming job polling for:', savedJobId);
      setCurrentJobId(savedJobId);
    }
  }, []);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsPolling(false);
    setCurrentJobId(null);
    localStorage.removeItem(CURRENT_JOB_ID_KEY);
  }, []);

  const checkJobStatus = useCallback(async (jobId: string) => {
    try {
      const statusResponse = await getVideoStatus(jobId);
      
      onStatusUpdate?.(jobId, statusResponse.status);

      if (statusResponse.status === 'completed') {
        onCompleted?.(jobId);
        stopPolling();
      } else if (statusResponse.status === 'failed') {
        onFailed?.(jobId, statusResponse.error || 'Unknown error');
        stopPolling();
      }
      // Continue polling if still processing
    } catch (error) {
      console.error('Error checking video status:', error);
      onFailed?.(jobId, error instanceof Error ? error.message : 'Unknown error');
      stopPolling();
    }
  }, [onCompleted, onFailed, onStatusUpdate, stopPolling]);

  const startPolling = useCallback((jobId: string) => {
    if (!jobId) return;

    // Stop any existing polling
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    setCurrentJobId(jobId);
    setIsPolling(true);
    localStorage.setItem(CURRENT_JOB_ID_KEY, jobId);

    // Make immediate check
    checkJobStatus(jobId);

    // Start interval
    intervalRef.current = setInterval(() => {
      checkJobStatus(jobId);
    }, pollingInterval);
  }, [checkJobStatus, pollingInterval]);

  // Auto-start polling when currentJobId changes
  useEffect(() => {
    if (currentJobId && !isPolling) {
      startPolling(currentJobId);
    }
  }, [currentJobId, isPolling, startPolling]);

  return {
    currentJobId,
    isPolling,
    startPolling,
    stopPolling
  };
};
