import { useState, useEffect, useCallback } from 'react';
import { getUserVideos, deleteVideo, VideoJob } from '../services/api';

export interface Song {
  id: string;
  song_title: string;
  artist: string;
  video_file: string | null;
  created_at: string;
  spotify_url: string;
  albumCoverUrl?: string | null;
  learned: boolean;
  lastPracticed?: string | null;
  difficultyRating?: number | null;
  is_favorite: boolean;
  is_favorite_only: boolean;
}

interface UseSongsManagerReturn {
  songs: Song[];
  loading: boolean;
  error: string | null;
  notification: { message: string; type: 'success' | 'error' } | null;
  fetchSongs: () => Promise<void>;
  deleteSong: (songId: string) => Promise<void>;
  updateSong: (songId: string, updates: Partial<Song>) => void;
  clearNotification: () => void;
  setNotification: (notification: { message: string; type: 'success' | 'error' } | null) => void;
}

export const useSongsManager = (userId: number | null): UseSongsManagerReturn => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const fetchSongs = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const videosData = await getUserVideos();

      const formattedSongs = videosData.map((video: VideoJob) => {
        let learned = video.is_learned || false;
        let lastPracticed = video.last_practiced || null;
        let difficultyRating = video.difficulty_rating || null;

        if (!video.is_learned && !video.last_practiced) {
          const learningDataKey = userId
            ? `user_${userId}_song_learning_${video.id}`
            : `song_learning_${video.id}`;
          const learningData = JSON.parse(localStorage.getItem(learningDataKey) || 'null');

          if (learningData) {
            learned = learningData.learned || false;
            lastPracticed = learningData.lastPracticed || null;
            difficultyRating = learningData.difficultyRating || null;
          }
        }

        return {
          id: video.id,
          song_title: video.song_title,
          artist: video.artist,
          video_file: video.video_file,
          created_at: video.created_at,
          spotify_url: video.spotify_url,
          albumCoverUrl: video.album_cover ?? null,
          learned,
          lastPracticed,
          difficultyRating,
          is_favorite: video.is_favorite || false,
          is_favorite_only: video.is_favorite_only || false,
        };
      });

      setSongs(formattedSongs);
    } catch (err) {
      console.error('Error fetching songs:', err);
      setError('Failed to load songs. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const deleteSong = useCallback(async (songId: string) => {
    try {
      await deleteVideo(songId);

      setSongs(prevSongs => prevSongs.filter(song => song.id !== songId));

      const learningDataKey = userId
        ? `user_${userId}_song_learning_${songId}`
        : `song_learning_${songId}`;
      localStorage.removeItem(learningDataKey);

      setNotification({
        message: 'Song deleted successfully',
        type: 'success'
      });

      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (err) {
      console.error('Error deleting song:', err);
      setNotification({
        message: 'Error deleting song. Please try again.',
        type: 'error'
      });
    }
  }, [userId]);

  const updateSong = useCallback((songId: string, updates: Partial<Song>) => {
    setSongs(prevSongs =>
      prevSongs.map(song =>
        song.id === songId ? { ...song, ...updates } : song
      )
    );
  }, []);

  const clearNotification = useCallback(() => {
    setNotification(null);
  }, []);

  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  return {
    songs,
    loading,
    error,
    notification,
    fetchSongs,
    deleteSong,
    updateSong,
    clearNotification,
    setNotification
  };
};
