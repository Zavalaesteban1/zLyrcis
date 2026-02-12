import React from 'react';
import styled from 'styled-components';
import { Song } from '../../hooks/useSongsManager';

const StatsCard = styled.div`
  background-color: white;
  border-radius: 12px;
  padding: 25px;
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.1);
  position: sticky;
  top: 20px;
  
  @media (max-width: 968px) {
    position: relative;
    top: 0;
    margin-top: 20px;
  }
`;

const StatsTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  margin: 0 0 20px;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin: 15px 0;
`;

const ProgressFill = styled.div<{ percent: number }>`
  height: 100%;
  background: linear-gradient(90deg, #1DB954, #169c46);
  width: ${props => props.percent}%;
  transition: width 0.3s ease;
`;

const ProgressStats = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
`;

const StatsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  margin-top: 20px;
`;

const StatItem = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  padding: 10px;
  background-color: #f9f9f9;
  border-radius: 6px;
`;

const StatLabel = styled.span`
  font-size: 12px;
  color: #666;
  text-transform: uppercase;
  font-weight: 500;
`;

const StatValue = styled.span`
  font-size: 16px;
  color: #333;
  font-weight: 600;
`;

interface LearningStatsCardProps {
  songs: Song[];
  totalLearned: number;
  learningProgress: number;
  nextToLearn?: Song;
}

export const LearningStatsCard: React.FC<LearningStatsCardProps> = ({
  songs,
  totalLearned,
  learningProgress,
  nextToLearn
}) => {
  // Get last practiced song
  const lastPracticedSong = [...songs]
    .filter(s => s.lastPracticed)
    .sort((a, b) => new Date(b.lastPracticed!).getTime() - new Date(a.lastPracticed!).getTime())[0];

  return (
    <StatsCard>
      <StatsTitle>Learning Progress</StatsTitle>
      
      <ProgressStats>
        <span>Learned {totalLearned} of {songs.length} songs</span>
        <span>{Math.round(learningProgress)}%</span>
      </ProgressStats>
      
      <ProgressBarContainer>
        <ProgressFill percent={learningProgress} />
      </ProgressBarContainer>
      
      <StatsList>
        <StatItem>
          <StatLabel>Total Songs</StatLabel>
          <StatValue>{songs.length}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Songs Learned</StatLabel>
          <StatValue>{totalLearned}</StatValue>
        </StatItem>
        <StatItem>
          <StatLabel>Next to Learn</StatLabel>
          <StatValue>{nextToLearn?.song_title || 'None'}</StatValue>
        </StatItem>
        {totalLearned > 0 && (
          <StatItem>
            <StatLabel>Last Practiced</StatLabel>
            <StatValue>
              {lastPracticedSong
                ? new Date(lastPracticedSong.lastPracticed!).toLocaleDateString()
                : 'Never'}
            </StatValue>
          </StatItem>
        )}
      </StatsList>
    </StatsCard>
  );
};
