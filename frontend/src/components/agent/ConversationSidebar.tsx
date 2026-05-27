import React, { useState, useRef, useEffect, MouseEvent } from 'react';
import { FiPlusCircle } from 'react-icons/fi';
import { MdMoreVert } from 'react-icons/md';
import { IconPanelSidebar } from '../icons/IconPanelSidebar';
import { AiOutlineDelete, AiOutlineEdit } from 'react-icons/ai';
import { Conversation } from '../../hooks/useConversationManager';
import * as Styles from '../../styles/AgentPageStyles';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  isOpen: boolean;
  onToggle: () => void;
  onNewChat: () => void;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRequestRename: (id: string, title: string) => void;
  theme: any;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  isOpen,
  onToggle,
  onNewChat,
  onLoadConversation,
  onDeleteConversation,
  onRequestRename,
  theme
}) => {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenuId) return;

    const handleClickOutside = (event: globalThis.MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setOpenMenuId(null);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  const handleOpenRename = (id: string, title: string, e?: MouseEvent) => {
    e?.stopPropagation();
    setOpenMenuId(null);
    onRequestRename(id, title);
  };

  const handleDeleteClick = (id: string, e?: MouseEvent) => {
    e?.stopPropagation();
    setOpenMenuId(null);
    onDeleteConversation(id);
  };

  const toggleMenu = (id: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setOpenMenuId(prev => (prev === id ? null : id));
  };

  return (
    <Styles.ChatSidebar isOpen={isOpen} theme={theme}>
      <Styles.ChatListHeader $collapsed={!isOpen}>
        <Styles.ChatListTitle $hidden={!isOpen}>Conversations</Styles.ChatListTitle>
        <Styles.ChatSidebarHeaderActions $collapsed={!isOpen}>
          {isOpen && (
            <Styles.NewChatButton onClick={onNewChat}>
              {FiPlusCircle({ size: 16 })} New
            </Styles.NewChatButton>
          )}
          <Styles.ChatPanelToggle
            type="button"
            onClick={onToggle}
            title={isOpen ? 'Close sidebar' : 'Open sidebar'}
            aria-label={isOpen ? 'Close sidebar' : 'Open sidebar'}
            $active={isOpen}
            $inSidebar
          >
            <IconPanelSidebar width={28} height={20} />
          </Styles.ChatPanelToggle>
        </Styles.ChatSidebarHeaderActions>
      </Styles.ChatListHeader>

      <Styles.ChatList $collapsed={!isOpen}>
        {conversations.length === 0 ? (
          <div style={{ padding: '20px', color: '#777', textAlign: 'center' }}>
            No previous conversations
          </div>
        ) : (
          conversations
            .slice()
            .sort((a, b) => (b.lastActiveAt ?? 0) - (a.lastActiveAt ?? 0))
            .map(conv => {
              const isActive = conv.id === activeConversationId;

              return (
                <Styles.ChatItem
                  key={conv.id}
                  active={isActive}
                  onClick={() => onLoadConversation(conv.id)}
                >
                  <Styles.ChatItemTitle>{conv.title}</Styles.ChatItemTitle>
                  <Styles.ChatItemMenuWrap
                    ref={openMenuId === conv.id ? menuRef : undefined}
                  >
                    <Styles.ChatItemMenuButton
                      type="button"
                      $visible={openMenuId === conv.id}
                      onClick={(e) => toggleMenu(conv.id, e)}
                      aria-label="Conversation options"
                      aria-expanded={openMenuId === conv.id}
                    >
                      {MdMoreVert({ size: 18 })}
                    </Styles.ChatItemMenuButton>
                    {openMenuId === conv.id && (
                      <Styles.ChatItemMenu onClick={(e) => e.stopPropagation()}>
                        <Styles.ChatItemMenuOption
                          type="button"
                          onClick={(e) => handleOpenRename(conv.id, conv.title, e)}
                        >
                          {AiOutlineEdit({ size: 16 })}
                          Rename
                        </Styles.ChatItemMenuOption>
                        <Styles.ChatItemMenuOption
                          type="button"
                          $destructive
                          onClick={(e) => handleDeleteClick(conv.id, e)}
                        >
                          {AiOutlineDelete({ size: 16 })}
                          Delete
                        </Styles.ChatItemMenuOption>
                      </Styles.ChatItemMenu>
                    )}
                  </Styles.ChatItemMenuWrap>
                </Styles.ChatItem>
              );
            })
        )}
      </Styles.ChatList>
    </Styles.ChatSidebar>
  );
};
