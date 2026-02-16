import React from 'react';
import styled from 'styled-components';
import { SongWithLearningData } from '../../hooks/useProfileStats';
import { MdCheckCircle } from 'react-icons/md';
import { BsMusicNoteList } from 'react-icons/bs';
import { FiTrendingUp } from 'react-icons/fi';

const StatsContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 20px;
`;

const StatsCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 25px;
`;

const StatsTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px;
  color: #333;
`;

const StatsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
`;

const StatLabel = styled.span`
  font-size: 16px;
  color: #666;
`;

const StatValue = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #333;
`;

const ProgressBarContainer = styled.div`
  width: 100%;
  height: 10px;
  background-color: #f0f0f0;
  border-radius: 5px;
  overflow: hidden;
  margin-top: 10px;
`;

const ProgressFill = styled.div<{ percent: number }>`
  height: 100%;
  background: linear-gradient(90deg, #1DB954, #169c46);
  width: ${props => props.percent}%;
  transition: width 0.5s ease;
  border-radius: 5px;
`;

const RecentSongCard = styled.div`
  background: linear-gradient(135deg, #1DB954 0%, #169c46 100%);
  padding: 20px;
  border-radius: 8px;
  color: white;
  margin-top: 15px;
`;

const RecentSongTitle = styled.div`
  font-size: 16px;
  font-weight: 600;
  margin-bottom: 4px;
`;

const RecentSongArtist = styled.div`
  font-size: 14px;
  opacity: 0.9;
  margin-bottom: 8px;
`;

const RecentSongDate = styled.div`
  font-size: 12px;
  opacity: 0.8;
  display: flex;
  align-items: center;
  gap: 4px;
`;

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffTime = Math.abs(now.getTime() - date.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
  if (diffDays < 365) return `${Math.floor(diffDays / 30)} months ago`;
  return `${Math.floor(diffDays / 365)} years ago`;
};

interface ProfileStatsCardsProps {
  totalSongs: number;
  songsLearned: number;
  learningProgress: number;
  accountAge: string;
  mostRecentSong: SongWithLearningData | null;
}

export const ProfileStatsCards: React.FC<ProfileStatsCardsProps> = ({
  totalSongs,
  songsLearned,
  learningProgress,
  accountAge,
  mostRecentSong
}) => {
  return (
    <StatsContainer>
      <StatsCard>
        <StatsTitle>Account Statistics</StatsTitle>
        <StatsList>
          <StatItem>
            <StatLabel>Videos Created</StatLabel>
            <StatValue>{totalSongs}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Songs Learned</StatLabel>
            <StatValue>{songsLearned}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Learning Progress</StatLabel>
            <StatValue>{Math.round(learningProgress)}%</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Member Since</StatLabel>
            <StatValue>{accountAge}</StatValue>
          </StatItem>
        </StatsList>
        
        {learningProgress > 0 && (
          <ProgressBarContainer>
            <ProgressFill percent={learningProgress} />
          </ProgressBarContainer>
        )}
      </StatsCard>

      {mostRecentSong && (
        <StatsCard>
          <StatsTitle>Recent Activity</StatsTitle>
          <RecentSongCard>
            <RecentSongTitle>
              {mostRecentSong.song_title}
              {mostRecentSong.learned && (
                <span style={{ marginLeft: '8px' }}>
                  {MdCheckCircle({ size: 18 })}
                </span>
              )}
            </RecentSongTitle>
            <RecentSongArtist>{mostRecentSong.artist}</RecentSongArtist>
            <RecentSongDate>
              Created {formatDate(mostRecentSong.created_at)}
            </RecentSongDate>
          </RecentSongCard>
        </StatsCard>
      )}
    </StatsContainer>
  );
};
