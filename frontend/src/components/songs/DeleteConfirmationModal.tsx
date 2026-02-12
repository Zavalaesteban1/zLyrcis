import React from 'react';
import styled from 'styled-components';
import { Song } from '../../hooks/useSongsManager';

const ConfirmDialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 20px;
`;

const ConfirmBox = styled.div`
  background: white;
  border-radius: 12px;
  padding: 30px;
  max-width: 400px;
  width: 100%;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
`;

const ConfirmTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  color: #333;
  margin: 0 0 15px;
`;

const ConfirmText = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0 0 25px;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  gap: 10px;
  justify-content: flex-end;
`;

const Button = styled.button`
  padding: 10px 20px;
  border-radius: 6px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`;

const CancelButton = styled(Button)`
  background-color: #f0f0f0;
  color: #666;
  
  &:hover:not(:disabled) {
    background-color: #e0e0e0;
  }
`;

const ConfirmDeleteButton = styled(Button)`
  background-color: #e91429;
  color: white;
  
  &:hover:not(:disabled) {
    background-color: #d01020;
  }
`;

interface DeleteConfirmationModalProps {
  song: Song | null;
  isDeleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export const DeleteConfirmationModal: React.FC<DeleteConfirmationModalProps> = ({
  song,
  isDeleting,
  onConfirm,
  onCancel
}) => {
  if (!song) return null;

  return (
    <ConfirmDialog onClick={onCancel}>
      <ConfirmBox onClick={(e) => e.stopPropagation()}>
        <ConfirmTitle>Delete Song</ConfirmTitle>
        <ConfirmText>
          Are you sure you want to delete "{song.song_title}" by {song.artist}? This action cannot be undone.
        </ConfirmText>
        <ButtonGroup>
          <CancelButton onClick={onCancel} disabled={isDeleting}>
            Cancel
          </CancelButton>
          <ConfirmDeleteButton onClick={onConfirm} disabled={isDeleting}>
            {isDeleting ? 'Deleting...' : 'Delete'}
          </ConfirmDeleteButton>
        </ButtonGroup>
      </ConfirmBox>
    </ConfirmDialog>
  );
};
