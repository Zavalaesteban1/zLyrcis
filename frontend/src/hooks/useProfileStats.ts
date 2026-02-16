import { useState, useEffect, useCallback } from 'react';
import { getUserVideos, VideoJob } from '../services/api';

export interface SongWithLearningData extends VideoJob {
  learned: boolean;
  lastPracticed?: string | null;
  difficultyRating?: number | null;
}

interface UseProfileStatsReturn {
  songs: SongWithLearningData[];
  songsLoading: boolean;
  totalSongs: number;
  songsLearned: number;
  learningProgress: number;
  fetchSongs: () => Promise<void>;
}

export const useProfileStats = (userId: number | null): UseProfileStatsReturn => {
  const [songs, setSongs] = useState<SongWithLearningData[]>([]);
  const [songsLoading, setSongsLoading] = useState(true);

  // Fetch user's songs
  const fetchSongs = useCallback(async () => {
    try {
      setSongsLoading(true);
      const videosData = await getUserVideos();

      // Map VideoJob data with learning status from localStorage
      const songsWithLearningData: SongWithLearningData[] = videosData.map(video => {
        // Check local storage for learning data (user-specific)
        const learningDataKey = userId
          ? `user_${userId}_song_learning_${video.id}`
          : `song_learning_${video.id}`;
        const learningData = JSON.parse(localStorage.getItem(learningDataKey) || 'null');

        return {
          ...video,
          learned: learningData?.learned || false,
          lastPracticed: learningData?.lastPracticed || null,
          difficultyRating: learningData?.difficultyRating || null
        };
      });

      setSongs(songsWithLearningData);
    } catch (err) {
      console.error('Error fetching songs:', err);
      setSongs([]);
    } finally {
      setSongsLoading(false);
    }
  }, [userId]);

  // Initial fetch
  useEffect(() => {
    fetchSongs();
  }, [fetchSongs]);

  // Calculate statistics
  const totalSongs = songs.length;
  const songsLearned = songs.filter(song => song.learned).length;
  const learningProgress = totalSongs > 0 ? (songsLearned / totalSongs) * 100 : 0;

  return {
    songs,
    songsLoading,
    totalSongs,
    songsLearned,
    learningProgress,
    fetchSongs
  };
};
