import React, { useState, useRef, FormEvent, ChangeEvent, KeyboardEvent, MouseEvent } from 'react';
import { FiPlusCircle } from 'react-icons/fi';
import { AiOutlineDelete, AiOutlineEdit, AiOutlineCheck } from 'react-icons/ai';
import { Conversation } from '../../hooks/useConversationManager';
import * as Styles from '../../styles/AgentPageStyles';

interface ConversationSidebarProps {
  conversations: Conversation[];
  activeConversationId: string;
  isOpen: boolean;
  onNewChat: () => void;
  onLoadConversation: (id: string) => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  theme: any;
}

export const ConversationSidebar: React.FC<ConversationSidebarProps> = ({
  conversations,
  activeConversationId,
  isOpen,
  onNewChat,
  onLoadConversation,
  onDeleteConversation,
  onRenameConversation,
  theme
}) => {
  const [editingConversationId, setEditingConversationId] = useState<string | null>(null);
  const [editingTitle, setEditingTitle] = useState('');
  const editInputRef = useRef<HTMLInputElement>(null);

  const handleStartEditing = (id: string, title: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    setEditingConversationId(id);
    setEditingTitle(title);
    
    setTimeout(() => {
      if (editInputRef.current) {
        editInputRef.current.focus();
        editInputRef.current.select();
      }
    }, 50);
  };

  const handleSaveTitle = (id: string, e?: FormEvent) => {
    if (e) e.preventDefault();
    
    const newTitle = editingTitle.trim() || 'New conversation';
    onRenameConversation(id, newTitle);
    
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const handleCancelEdit = () => {
    setEditingConversationId(null);
    setEditingTitle('');
  };

  const handleEditKeyDown = (id: string, e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSaveTitle(id);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      handleCancelEdit();
    }
  };

  const handleDeleteClick = (id: string, e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onDeleteConversation(id);
  };

  return (
    <Styles.ChatSidebar isOpen={isOpen} theme={theme}>
      <Styles.ChatListHeader>
        <h3 style={{ margin: 0 }}>Conversations</h3>
        <Styles.NewChatButton onClick={onNewChat}>
          {FiPlusCircle({ size: 16 })} New chat
        </Styles.NewChatButton>
      </Styles.ChatListHeader>
      
      <Styles.ChatList>
        {conversations.length === 0 ? (
          <div style={{ padding: '20px', color: '#777', textAlign: 'center' }}>
            No previous conversations
          </div>
        ) : (
          conversations.map(conv => {
            const isActive = conv.id === activeConversationId;
            
            return (
              <Styles.ChatItem 
                key={conv.id} 
                active={isActive}
                onClick={() => onLoadConversation(conv.id)}
                style={isActive ? { 
                  backgroundColor: 'rgba(29, 185, 84, 0.1)',
                  borderLeft: '3px solid #1DB954'
                } : {}}
              >
                {editingConversationId === conv.id ? (
                  <Styles.EditForm onSubmit={(e) => handleSaveTitle(conv.id, e)}>
                    <Styles.ChatTitleInput
                      ref={editInputRef}
                      value={editingTitle}
                      onChange={(e: ChangeEvent<HTMLInputElement>) => setEditingTitle(e.target.value)}
                      onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => handleEditKeyDown(conv.id, e)}
                      onBlur={() => handleSaveTitle(conv.id)}
                      placeholder="Enter conversation name..."
                      autoFocus
                    />
                    <Styles.SaveButton 
                      type="submit" 
                      title="Save title"
                    >
                      {AiOutlineCheck({ size: 16 })}
                    </Styles.SaveButton>
                  </Styles.EditForm>
                ) : (
                  <Styles.ChatItemTitle>{conv.title}</Styles.ChatItemTitle>
                )}
                <Styles.ChatItemActions>
                  <Styles.ChatItemEdit 
                    onClick={(e) => handleStartEditing(conv.id, conv.title, e)}
                    title="Edit conversation"
                  >
                    {AiOutlineEdit({ size: 18, style: { verticalAlign: 'middle' } })}
                  </Styles.ChatItemEdit>
                  <Styles.ChatItemDelete 
                    onClick={(e) => handleDeleteClick(conv.id, e)}
                    title="Delete conversation"
                  >
                    {AiOutlineDelete({ size: 18, style: { verticalAlign: 'middle' } })}
                  </Styles.ChatItemDelete>
                </Styles.ChatItemActions>
              </Styles.ChatItem>
            );
          })
        )}
      </Styles.ChatList>
    </Styles.ChatSidebar>
  );
};
