import React, { useEffect, useRef, useState } from 'react';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { AiOutlineDelete, AiOutlineEdit } from 'react-icons/ai';
import * as Styles from '../../styles/AgentPageStyles';

interface ChatTitleMenuProps {
  title: string;
  onRename: () => void;
  onDelete: () => void;
}

export const ChatTitleMenu: React.FC<ChatTitleMenuProps> = ({
  title,
  onRename,
  onDelete
}) => {
  const [open, setOpen] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  const handleRename = () => {
    setOpen(false);
    onRename();
  };

  const handleDelete = () => {
    setOpen(false);
    onDelete();
  };

  return (
    <Styles.ChatTitleMenuWrap ref={wrapRef}>
      <Styles.ChatTitleMenuButton
        type="button"
        onClick={() => setOpen(prev => !prev)}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label="Chat options"
      >
        <Styles.ChatTitleMenuText>{title}</Styles.ChatTitleMenuText>
        <Styles.ChatTitleMenuChevron aria-hidden="true">
          {MdKeyboardArrowDown({ size: 18 })}
        </Styles.ChatTitleMenuChevron>
      </Styles.ChatTitleMenuButton>

      {open && (
        <Styles.ChatTitleDropdown role="menu" onClick={(event) => event.stopPropagation()}>
          <Styles.ChatTitleDropdownOption type="button" role="menuitem" onClick={handleRename}>
            {AiOutlineEdit({ size: 16 })}
            Rename
          </Styles.ChatTitleDropdownOption>
          <Styles.ChatTitleDropdownDivider aria-hidden="true" />
          <Styles.ChatTitleDropdownOption
            type="button"
            role="menuitem"
            $destructive
            onClick={handleDelete}
          >
            {AiOutlineDelete({ size: 16 })}
            Delete
          </Styles.ChatTitleDropdownOption>
        </Styles.ChatTitleDropdown>
      )}
    </Styles.ChatTitleMenuWrap>
  );
};
