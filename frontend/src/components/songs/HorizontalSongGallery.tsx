import React from 'react';
import styled from 'styled-components';
import { Song } from '../../hooks/useSongsManager';
import { MdPlayArrow, MdPause, MdDownload, MdDelete, MdCheckCircle } from 'react-icons/md';
import { BsCheckSquareFill } from 'react-icons/bs';

const GallerySection = styled.div`
  margin-bottom: 40px;
`;

const SectionHeader = styled.div`
  padding: 0 30px;
  margin-bottom: 20px;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const SectionTitle = styled.h3`
  font-size: 24px;
  font-weight: 600;
  color: #333;
  margin: 0;
  
  @media (max-width: 768px) {
    font-size: 20px;
  }
`;

const SongCount = styled.span`
  font-size: 14px;
  color: #666;
  font-weight: 400;
`;

const ScrollContainer = styled.div`
  display: flex;
  overflow-x: auto;
  overflow-y: hidden;
  gap: 24px;
  padding: 10px 30px 30px;
  scroll-behavior: smooth;
  -webkit-overflow-scrolling: touch;
  
  /* Hide scrollbar for Chrome, Safari and Opera */
  &::-webkit-scrollbar {
    height: 8px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f0f0f0;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #1DB954;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #169c46;
  }
  
  @media (max-width: 768px) {
    padding: 10px 20px 30px;
    gap: 20px;
  }
`;

const SongCard = styled.div`
  position: relative;
  flex-shrink: 0;
  width: 280px;
  cursor: pointer;
  transition: transform 0.3s ease;
  
  &:hover {
    transform: translateY(-8px);
  }
  
  @media (max-width: 768px) {
    width: 200px;
  }
`;

const CardImageWrapper = styled.div`
  position: relative;
  width: 100%;
  aspect-ratio: 1;
  border-radius: 24px;
  overflow: hidden;
  background-color: #eee;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transition: box-shadow 0.3s ease;
  
  ${SongCard}:hover & {
    box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
  }
`;

const AlbumImage = styled.img`
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.5s ease;
  
  ${SongCard}:hover & {
    transform: scale(1.05);
  }
`;

const AlbumPlaceholder = styled.div<{ color: string }>`
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: ${props => props.color};
  color: white;
  font-size: 96px;
  font-weight: bold;
`;

const LearnedCheckbox = styled.div<{ checked: boolean }>`
  position: absolute;
  top: 10px;
  left: 10px;
  width: 28px;
  height: 28px;
  border-radius: 6px;
  border: 2px solid ${props => props.checked ? '#1DB954' : 'rgba(255, 255, 255, 0.8)'};
  background-color: ${props => props.checked ? '#1DB954' : 'rgba(0, 0, 0, 0.3)'};
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  z-index: 2;
  transition: all 0.2s ease;
  
  &:hover {
    transform: scale(1.1);
    border-color: #1DB954;
  }
`;

const LearnedBadge = styled.div`
  position: absolute;
  top: 10px;
  right: 10px;
  background-color: #1DB954;
  color: white;
  width: 28px;
  height: 28px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  box-shadow: 0 2px 8px rgba(29, 185, 84, 0.4);
  z-index: 2;
`;

const HoverOverlay = styled.div`
  position: absolute;
  inset: 0;
  background: linear-gradient(to top, rgba(0, 0, 0, 0.9), rgba(0, 0, 0, 0.3));
  opacity: 0;
  transition: opacity 0.3s ease;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding: 20px;
  z-index: 1;
  
  ${SongCard}:hover & {
    opacity: 1;
  }
`;

const ActionButtons = styled.div`
  display: flex;
  gap: 12px;
  align-items: center;
`;

const ActionButton = styled.button`
  background-color: rgba(255, 255, 255, 0.95);
  border: none;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #333;
  transition: all 0.2s ease;
  backdrop-filter: blur(8px);
  
  &:hover {
    background-color: #1DB954;
    color: white;
    transform: scale(1.1);
  }
  
  &:active {
    transform: scale(0.95);
  }
`;

const PlayButton = styled(ActionButton)<{ isPlaying: boolean }>`
  background-color: ${props => props.isPlaying ? '#1DB954' : 'rgba(255, 255, 255, 0.95)'};
  color: ${props => props.isPlaying ? 'white' : '#333'};
  width: 48px;
  height: 48px;
  
  &:hover {
    background-color: ${props => props.isPlaying ? '#169c46' : '#1DB954'};
    color: white;
  }
`;

const SongInfo = styled.div`
  padding: 16px 4px 0;
`;

const SongTitle = styled.h4`
  font-size: 16px;
  font-weight: 600;
  color: #333;
  margin: 0 0 6px;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

const SongArtist = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
`;

// Helper function
const generatePlaceholderColor = (title: string): string => {
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 80%, 60%)`;
};

interface HorizontalSongGalleryProps {
  title: string;
  songs: Song[];
  playingSongId: string | null;
  onToggleLearned: (song: Song) => void;
  onPlay: (songId: string) => void;
  onDownload: (song: Song) => void;
  onDelete: (song: Song) => void;
}

export const HorizontalSongGallery: React.FC<HorizontalSongGalleryProps> = ({
  title,
  songs,
  playingSongId,
  onToggleLearned,
  onPlay,
  onDownload,
  onDelete
}) => {
  if (songs.length === 0) return null;

  return (
    <GallerySection>
      <SectionHeader>
        <SectionTitle>
          {title} <SongCount>({songs.length})</SongCount>
        </SectionTitle>
      </SectionHeader>
      
      <ScrollContainer>
        {songs.map((song) => (
          <SongCard key={song.id}>
            <CardImageWrapper>
              <LearnedCheckbox 
                checked={song.learned} 
                onClick={(e) => {
                  e.stopPropagation();
                  onToggleLearned(song);
                }}
              >
                {song.learned ? BsCheckSquareFill({ size: 14 }) : null}
              </LearnedCheckbox>
              
              {song.learned && (
                <LearnedBadge title="Learned">
                  {MdCheckCircle({ size: 16 })}
                </LearnedBadge>
              )}
              
              {song.albumCoverUrl ? (
                <AlbumImage src={song.albumCoverUrl} alt={song.song_title} />
              ) : (
                <AlbumPlaceholder color={generatePlaceholderColor(song.song_title)}>
                  {song.song_title.charAt(0).toUpperCase()}
                </AlbumPlaceholder>
              )}
              
              <HoverOverlay>
                <ActionButtons>
                  <ActionButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDownload(song);
                    }}
                    title="Download"
                  >
                    {MdDownload({ size: 18 })}
                  </ActionButton>
                  
                  <PlayButton 
                    isPlaying={playingSongId === song.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      onPlay(song.id);
                    }}
                    title={playingSongId === song.id ? 'Pause' : 'Play'}
                  >
                    {playingSongId === song.id ? MdPause({ size: 24 }) : MdPlayArrow({ size: 24 })}
                  </PlayButton>
                  
                  <ActionButton 
                    onClick={(e) => {
                      e.stopPropagation();
                      onDelete(song);
                    }}
                    title="Delete"
                  >
                    {MdDelete({ size: 18 })}
                  </ActionButton>
                </ActionButtons>
              </HoverOverlay>
            </CardImageWrapper>
            
            <SongInfo>
              <SongTitle>{song.song_title}</SongTitle>
              <SongArtist>{song.artist}</SongArtist>
            </SongInfo>
          </SongCard>
        ))}
      </ScrollContainer>
    </GallerySection>
  );
};
