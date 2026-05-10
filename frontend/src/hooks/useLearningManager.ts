import { useCallback } from 'react';
import { Song } from './useSongsManager';
import { updateVideoLearningStatus } from '../services/api';

interface UseLearningManagerOptions {
  userId: number | null;
  onUpdate: (songId: string, updates: Partial<Song>) => void;
  onNotification: (message: string, type: 'success' | 'error') => void;
}

interface UseLearningManagerReturn {
  toggleLearnedStatus: (song: Song) => void;
  setDifficultyRating: (songId: string, rating: number) => void;
  getLearningStats: (songs: Song[]) => {
    totalLearned: number;
    learningProgress: number;
    nextToLearn: Song | undefined;
  };
}

export const useLearningManager = ({
  userId,
  onUpdate,
  onNotification
}: UseLearningManagerOptions): UseLearningManagerReturn => {
  
  // Toggle learned status for a song
  const toggleLearnedStatus = useCallback(async (song: Song) => {
    const newLearnedStatus = !song.learned;
    const lastPracticed = newLearnedStatus ? new Date().toISOString() : song.lastPracticed;
    
    // Optimistically update UI
    onUpdate(song.id, {
      learned: newLearnedStatus,
      lastPracticed
    });
    
    try {
      // Save to database via API
      await updateVideoLearningStatus(song.id, newLearnedStatus, song.difficultyRating || undefined);
      
      // Also save to localStorage as backup/cache
      const learningDataKey = userId 
        ? `user_${userId}_song_learning_${song.id}`
        : `song_learning_${song.id}`;
      
      localStorage.setItem(learningDataKey, JSON.stringify({
        learned: newLearnedStatus,
        lastPracticed,
        difficultyRating: song.difficultyRating
      }));
      
      // Show success notification
      const message = newLearnedStatus
        ? `Congratulations! You've learned "${song.song_title}"`
        : `Marked "${song.song_title}" as not learned`;
      
      onNotification(message, 'success');
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        onNotification('', 'success');
      }, 3000);
    } catch (error) {
      // Revert UI update on error
      onUpdate(song.id, {
        learned: song.learned,
        lastPracticed: song.lastPracticed
      });
      
      onNotification('Failed to update learning status. Please try again.', 'error');
      
      setTimeout(() => {
        onNotification('', 'error');
      }, 3000);
    }
  }, [userId, onUpdate, onNotification]);

  // Set difficulty rating for a song
  const setDifficultyRating = useCallback(async (songId: string, rating: number) => {
    // Optimistically update UI
    onUpdate(songId, { difficultyRating: rating });
    
    try {
      // Save to database via API (get current learned status from state)
      // We need to get the song's current learned status, but we don't have access to it here
      // So we'll just update the difficulty rating field
      await updateVideoLearningStatus(songId, undefined as any, rating); // API will only update difficulty if provided
      
      // Also save to localStorage as backup/cache
      const learningDataKey = userId 
        ? `user_${userId}_song_learning_${songId}`
        : `song_learning_${songId}`;
      
      // Get existing learning data
      const existingData = JSON.parse(localStorage.getItem(learningDataKey) || '{}');
      
      // Update and save learning data
      localStorage.setItem(learningDataKey, JSON.stringify({
        ...existingData,
        difficultyRating: rating
      }));
    } catch (error) {
      console.error('Failed to update difficulty rating:', error);
      // UI is already updated optimistically, so we don't revert here
    }
  }, [userId, onUpdate]);

  // Calculate learning statistics
  const getLearningStats = useCallback((songs: Song[]) => {
    const totalLearned = songs.filter(song => song.learned).length;
    const learningProgress = songs.length > 0 ? (totalLearned / songs.length) * 100 : 0;
    const nextToLearn = songs.find(song => !song.learned);
    
    return {
      totalLearned,
      learningProgress,
      nextToLearn
    };
  }, []);

  return {
    toggleLearnedStatus,
    setDifficultyRating,
    getLearningStats
  };
};
