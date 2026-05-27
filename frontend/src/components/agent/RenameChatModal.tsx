import React, { useEffect, useRef, FormEvent, ChangeEvent, KeyboardEvent } from 'react';
import * as Styles from '../../styles/AgentPageStyles';

interface RenameChatModalProps {
  open: boolean;
  title: string;
  onTitleChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
}

export const RenameChatModal: React.FC<RenameChatModalProps> = ({
  open,
  title,
  onTitleChange,
  onClose,
  onSave
}) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const onCloseRef = useRef(onClose);

  useEffect(() => {
    onCloseRef.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 0);

    const handleEscape = (event: globalThis.KeyboardEvent) => {
      if (event.key === 'Escape') {
        onCloseRef.current();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => {
      window.clearTimeout(timer);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [open]);

  if (!open) return null;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    if (!title.trim()) return;
    onSave();
  };

  return (
    <Styles.RenameChatModalRoot role="presentation">
      <Styles.RenameChatModalBackdrop type="button" aria-label="Close rename dialog" onClick={onClose} />
      <Styles.RenameChatModalPanel
        role="dialog"
        aria-modal="true"
        aria-labelledby="rename-chat-modal-title"
        onClick={(event) => event.stopPropagation()}
      >
        <Styles.RenameChatModalHeading id="rename-chat-modal-title">
          Rename chat
        </Styles.RenameChatModalHeading>
        <Styles.RenameChatModalForm onSubmit={handleSubmit}>
          <Styles.RenameChatModalInput
            ref={inputRef}
            value={title}
            onChange={(event: ChangeEvent<HTMLInputElement>) => onTitleChange(event.target.value)}
            onKeyDown={(event: KeyboardEvent<HTMLInputElement>) => {
              if (event.key === 'Escape') {
                event.preventDefault();
                onClose();
              }
            }}
            placeholder="Chat name"
            autoComplete="off"
          />
          <Styles.RenameChatModalActions>
            <Styles.RenameChatModalCancel type="button" onClick={onClose}>
              Cancel
            </Styles.RenameChatModalCancel>
            <Styles.RenameChatModalSave type="submit" disabled={!title.trim()}>
              Save
            </Styles.RenameChatModalSave>
          </Styles.RenameChatModalActions>
        </Styles.RenameChatModalForm>
      </Styles.RenameChatModalPanel>
    </Styles.RenameChatModalRoot>
  );
};
