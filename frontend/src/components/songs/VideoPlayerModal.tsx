import React, { RefObject } from 'react';
import styled from 'styled-components';
import { Song } from '../../hooks/useSongsManager';
import { MdClose } from 'react-icons/md';

const VideoModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.4);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const VideoContainer = styled.div`
  width: 90%;
  max-width: 800px;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  position: relative;
`;

const VideoPlayer = styled.video`
  width: 100%;
  display: block;
`;

const VideoCloseButton = styled.button`
  position: absolute;
  top: 15px;
  right: 15px;
  background: white;
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #333;
  cursor: pointer;
  transition: all 0.2s ease;
  z-index: 10;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
  
  &:hover {
    background: #1DB954;
    color: white;
    transform: scale(1.1);
  }
`;

const VideoInfoBar = styled.div`
  padding: 15px 20px;
  background: white;
  color: #333;
  border-top: 1px solid #e0e0e0;
`;

const VideoTitle = styled.h4`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 5px;
  color: #333;
`;

const VideoArtist = styled.p`
  font-size: 14px;
  color: #1DB954;
  margin: 0;
`;

const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(255, 255, 255, 0.95);
  color: #333;
  font-size: 18px;
  font-weight: 500;
  z-index: 5;
`;

interface VideoPlayerModalProps {
  song: Song | null;
  videoRef: RefObject<HTMLVideoElement>;
  isLoading: boolean;
  onClose: () => void;
}

export const VideoPlayerModal: React.FC<VideoPlayerModalProps> = ({
  song,
  videoRef,
  isLoading,
  onClose
}) => {
  if (!song) return null;

  return (
    <VideoModal onClick={onClose}>
      <VideoContainer onClick={(e) => e.stopPropagation()}>
        <VideoCloseButton onClick={onClose}>
          {MdClose({ size: 20 })}
        </VideoCloseButton>
        
        <VideoPlayer
          ref={videoRef}
          controls
          autoPlay
        />
        
        <VideoInfoBar>
          <VideoTitle>{song.song_title}</VideoTitle>
          <VideoArtist>{song.artist}</VideoArtist>
        </VideoInfoBar>
      </VideoContainer>
    </VideoModal>
  );
};
