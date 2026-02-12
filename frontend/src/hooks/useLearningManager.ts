import { useCallback } from 'react';
import { Song } from './useSongsManager';

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
  const toggleLearnedStatus = useCallback((song: Song) => {
    const newLearnedStatus = !song.learned;
    const lastPracticed = newLearnedStatus ? new Date().toISOString() : song.lastPracticed;
    
    // Save to localStorage with user-specific key
    const learningDataKey = userId 
      ? `user_${userId}_song_learning_${song.id}`
      : `song_learning_${song.id}`;
    
    localStorage.setItem(learningDataKey, JSON.stringify({
      learned: newLearnedStatus,
      lastPracticed,
      difficultyRating: song.difficultyRating
    }));
    
    // Update song in parent state
    onUpdate(song.id, {
      learned: newLearnedStatus,
      lastPracticed
    });
    
    // Show notification
    const message = newLearnedStatus
      ? `Congratulations! You've learned "${song.song_title}"`
      : `Marked "${song.song_title}" as not learned`;
    
    onNotification(message, 'success');
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      onNotification('', 'success');
    }, 3000);
  }, [userId, onUpdate, onNotification]);

  // Set difficulty rating for a song
  const setDifficultyRating = useCallback((songId: string, rating: number) => {
    // Get learning data key
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
    
    // Update song in parent state
    onUpdate(songId, { difficultyRating: rating });
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
