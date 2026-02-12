import React from 'react';
import styled from 'styled-components';
import { Song } from '../../hooks/useSongsManager';
import { MdPlayArrow, MdPause, MdDownload, MdDelete, MdCheckCircle } from 'react-icons/md';
import { BsCheckSquareFill } from 'react-icons/bs';

// Styled components matching original design
const SongItem = styled.div`
  display: flex;
  align-items: center;
  padding: 20px 30px;
  border-bottom: 1px solid #f0f0f0;
  transition: background-color 0.2s ease;
  
  @media (max-width: 768px) {
    padding: 15px 20px;
    flex-wrap: wrap;
  }
  
  &:hover {
    background-color: #f9f9f9;
  }
  
  &:last-child {
    border-bottom: none;
  }
`;

const LearnedCheckbox = styled.div<{ checked: boolean }>`
  width: 26px;
  height: 26px;
  border-radius: 4px;
  border: 2px solid ${props => props.checked ? '#1DB954' : '#ddd'};
  background-color: ${props => props.checked ? '#1DB954' : 'transparent'};
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  margin-right: 15px;
  transition: all 0.2s ease;
  
  &:hover {
    border-color: #1DB954;
    background-color: ${props => props.checked ? '#169c46' : 'rgba(29, 185, 84, 0.1)'};
  }
`;

const SongCover = styled.div`
  width: 70px;
  height: 70px;
  border-radius: 8px;
  overflow: hidden;
  margin-right: 25px;
  flex-shrink: 0;
  background-color: #eee;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 28px;
  position: relative;
  
  @media (max-width: 768px) {
    width: 60px;
    height: 60px;
    margin-right: 20px;
  }
  
  @media (max-width: 480px) {
    width: 50px;
    height: 50px;
    margin-right: 15px;
  }
`;

const SongImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
`;

const AlbumPlaceholder = styled.div<{ color: string }>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.color};
  color: white;
  font-size: 22px;
  font-weight: bold;
`;

const LearnedBadge = styled.div`
  position: absolute;
  bottom: -5px;
  right: -5px;
  background-color: #1DB954;
  color: white;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  border: 2px solid white;
`;

const SongInfo = styled.div`
  flex: 1;
  min-width: 0;
`;

const SongTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 8px;
  color: #333;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  
  @media (max-width: 768px) {
    font-size: 16px;
    white-space: normal;
  }
`;

const SongArtist = styled.p`
  font-size: 15px;
  color: #666;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const SongActions = styled.div`
  display: flex;
  gap: 20px;
  
  @media (max-width: 768px) {
    gap: 15px;
  }
  
  @media (max-width: 480px) {
    gap: 10px;
  }
`;

const ActionButton = styled.button`
  background-color: transparent;
  border: none;
  width: 42px;
  height: 42px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #666;
  transition: all 0.2s ease;
  
  @media (max-width: 768px) {
    width: 36px;
    height: 36px;
  }
  
  &:hover {
    background-color: #f0f0f0;
    color: #1DB954;
  }
`;

// Helper function to generate placeholder color
const generatePlaceholderColor = (title: string): string => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 80%, 60%)`;
};

interface SongCardProps {
  song: Song;
  isPlaying: boolean;
  onToggleLearned: () => void;
  onPlay: () => void;
  onDownload: () => void;
  onDelete: () => void;
}

export const SongCard: React.FC<SongCardProps> = ({
  song,
  isPlaying,
  onToggleLearned,
  onPlay,
  onDownload,
  onDelete
}) => {
  return (
    <SongItem>
      <LearnedCheckbox checked={song.learned} onClick={onToggleLearned}>
        {song.learned ? BsCheckSquareFill({ size: 16 }) : null}
      </LearnedCheckbox>
      
      <SongCover>
        {song.albumCoverUrl ? (
          <SongImage src={song.albumCoverUrl} alt={`${song.song_title} cover`} />
        ) : (
          <AlbumPlaceholder color={generatePlaceholderColor(song.song_title)}>
            {song.song_title.charAt(0).toUpperCase()}
          </AlbumPlaceholder>
        )}
        {song.learned && (
          <LearnedBadge title="Learned">
            {MdCheckCircle({ size: 16 })}
          </LearnedBadge>
        )}
      </SongCover>
      
      <SongInfo>
        <SongTitle>{song.song_title}</SongTitle>
        <SongArtist>{song.artist}</SongArtist>
      </SongInfo>
      
      <SongActions>
        <ActionButton onClick={onPlay} title={isPlaying ? 'Pause' : 'Play'}>
          {isPlaying ? MdPause({ size: 18 }) : MdPlayArrow({ size: 18 })}
        </ActionButton>
        <ActionButton onClick={onDownload} title="Download">
          {MdDownload({ size: 18 })}
        </ActionButton>
        <ActionButton onClick={onDelete} title="Delete">
          {MdDelete({ size: 18 })}
        </ActionButton>
      </SongActions>
    </SongItem>
  );
};
