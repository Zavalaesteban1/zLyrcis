import { useState, useRef, useCallback, RefObject } from 'react';

interface UseVideoPlayerReturn {
  playingSongId: string | null;
  videoLoading: boolean;
  videoRef: RefObject<HTMLVideoElement>;
  playVideo: (songId: string) => void;
  closeVideo: () => void;
  handleVideoLoaded: () => void;
}

export const useVideoPlayer = (): UseVideoPlayerReturn => {
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);

  // Play a video
  const playVideo = useCallback((songId: string) => {
    setPlayingSongId(songId);
    setVideoLoading(true);
  }, []);

  // Close video player
  const closeVideo = useCallback(() => {
    setPlayingSongId(null);
    setVideoLoading(false);
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }, []);

  // Handle video loaded event
  const handleVideoLoaded = useCallback(() => {
    setVideoLoading(false);
  }, []);

  return {
    playingSongId,
    videoLoading,
    videoRef,
    playVideo,
    closeVideo,
    handleVideoLoaded
  };
};
