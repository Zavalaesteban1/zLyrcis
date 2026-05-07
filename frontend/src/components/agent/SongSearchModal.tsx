import React from 'react';
import { MdClose } from 'react-icons/md';
import { SongSuggestion } from '../../services/api';
import { SearchBar } from './SearchBar';
import * as Styles from '../../styles/AgentPageStyles';

interface SongSearchModalProps {
  open: boolean;
  onClose: () => void;
  onSelect: (song: SongSuggestion) => void;
}

export const SongSearchModal: React.FC<SongSearchModalProps> = ({ open, onClose, onSelect }) => {
  if (!open) return null;

  return (
    <Styles.SongSearchModalRoot role="presentation">
      <Styles.SongSearchModalBackdrop type="button" aria-label="Close search" onClick={onClose} />
      <Styles.SongSearchModalPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby="song-search-modal-title"
        onClick={(e) => e.stopPropagation()}
      >
        <Styles.SongSearchModalHeader>
          <Styles.SongSearchModalTitle id="song-search-modal-title">Search for a Song</Styles.SongSearchModalTitle>
          <Styles.SongSearchModalClose type="button" onClick={onClose} aria-label="Close">
            {MdClose({ size: 22 })}
          </Styles.SongSearchModalClose>
        </Styles.SongSearchModalHeader>
        <Styles.SongSearchModalBody>
          <SearchBar
            variant="modal"
            autoFocus
            onSelect={(song) => {
              onSelect(song);
              onClose();
            }}
          />
        </Styles.SongSearchModalBody>
      </Styles.SongSearchModalPanel>
    </Styles.SongSearchModalRoot>
  );
};
