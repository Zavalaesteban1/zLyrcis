import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled, { createGlobalStyle } from 'styled-components';
import { logout, getUserProfile, agent_song_request, agent_chat, getVideoStatus, fetchConversationHistory } from '../services/api';
// Import icons
import { CgProfile } from 'react-icons/cg';
import { IoHomeOutline } from 'react-icons/io5';
import { MdMusicNote, MdAdd, MdLogout, MdSend } from 'react-icons/md';
import { FiUser } from 'react-icons/fi';
import { RiRobot2Line } from 'react-icons/ri';

// Styled components (matching the style of other pages)
const AppLayout = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  color: #333;
`;

const Sidebar = styled.div`
  width: 240px;
  background-color: #1DB954;
  color: white;
  padding: 30px 0;
  display: flex;
  flex-direction: column;
  position: fixed;
  height: 100vh;
  box-shadow: 2px 0 10px rgba(0, 0, 0, 0.1);
`;

const Logo = styled.div`
  font-size: 24px;
  font-weight: 700;
  padding: 0 20px 30px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
  margin-bottom: 20px;
`;

const NavMenu = styled.nav`
  display: flex;
  flex-direction: column;
  flex: 1;
`;

const NavItem = styled(Link)<{ active?: boolean }>`
  padding: 12px 20px;
  color: white;
  text-decoration: none;
  display: flex;
  align-items: center;
  font-weight: ${props => props.active ? '600' : '400'};
  background-color: ${props => props.active ? 'rgba(0, 0, 0, 0.2)' : 'transparent'};
  border-left: ${props => props.active ? '4px solid white' : '4px solid transparent'};
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(255, 255, 255, 0.2);
    color: white;
    border-left: 4px solid rgba(255, 255, 255, 0.7);
  }
`;

const NavIcon = styled.span`
  margin-right: 10px;
  font-size: 18px;
  display: flex;
  align-items: center;
`;

const MainContent = styled.main`
  flex: 1;
  margin-left: 240px;
  padding: 30px;
  width: calc(100% - 240px);
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 30px;
  padding-bottom: 20px;
  border-bottom: 1px solid #e0e0e0;
`;

const PageTitle = styled.h1`
  font-size: 28px;
  font-weight: 600;
  color: #333;
  margin: 0;
`;

const UserActions = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 10px;
`;

const UserAvatar = styled.img`
  width: 40px;
  height: 40px;
  border-radius: 50%;
  object-fit: cover;
  border: 2px solid #1DB954;
`;

const UserName = styled.span`
  font-weight: 500;
  color: #333;
`;

const LogoutButton = styled.button`
  background-color: transparent;
  border: none;
  color: #666;
  cursor: pointer;
  display: flex;
  align-items: center;
  gap: 5px;
  padding: 5px 10px;
  border-radius: 4px;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #f0f0f0;
    color: #e91429;
  }
`;

// Chat specific styled components
const ChatContainer = styled.div`
  width: 100%;
  max-width: 800px;
  margin: 0 auto;
  border-radius: 16px;
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.08);
  background-color: white;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  height: 550px;
  border: 1px solid #eaeaea;
`;

const ChatHeader = styled.div`
  padding: 16px 24px;
  border-bottom: 1px solid #eaeaea;
  display: flex;
  align-items: center;
  background-color: white;
`;

const ChatHeaderIcon = styled.div`
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background-color: #1DB954;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 12px;
  color: white;
  font-size: 18px;
`;

const ChatHeaderTitle = styled.div`
  font-weight: 600;
  font-size: 16px;
  color: #333;
`;

const ChatHeaderSubtitle = styled.div`
  font-size: 13px;
  color: #777;
  margin-top: 2px;
`;

const ChatMessages = styled.div`
  flex: 1;
  padding: 24px;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 20px;
  background-color: #fafafa;
`;

const MessageBubble = styled.div<{ isUser: boolean }>`
  max-width: 85%;
  padding: 16px 20px;
  border-radius: 22px;
  background-color: ${props => props.isUser ? '#1DB954' : '#f1f1f1'};
  color: ${props => props.isUser ? 'white' : '#333'};
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  word-wrap: break-word;
  font-size: 16px;
  line-height: 1.5;
  box-shadow: ${props => props.isUser ? '0 1px 2px rgba(0, 0, 0, 0.1)' : 'none'};
  border: ${props => props.isUser ? 'none' : '1px solid #e0e0e0'};
  
  /* Add a subtle indicator of who's speaking */
  position: relative;
  
  &::before {
    content: ${props => props.isUser ? '""' : '"🎵"'};
    position: absolute;
    top: -24px;
    ${props => props.isUser ? 'right: 12px' : 'left: 12px'};
    font-size: 12px;
    color: #666;
    opacity: ${props => props.isUser ? 0 : 0.8};
  }
`;

// Create a global style for the animations
const GlobalStyle = createGlobalStyle`
  @keyframes pulse {
    0%, 100% {
      opacity: 0.4;
    }
    50% {
      opacity: 0.8;
    }
  }
  
  @keyframes processingPulse {
    0%, 100% {
      opacity: 0.5;
      transform: scale(1);
    }
    50% {
      opacity: 1;
      transform: scale(1.1);
    }
  }
`;

const AssistantTypingIndicator = styled.div<{ isProcessing?: boolean }>`
  display: inline-block;
  padding: 12px 16px;
  border-radius: 18px;
  background-color: #f1f1f1;
  align-self: flex-start;
  font-size: 16px;
  color: #666;
  border: 1px solid #e0e0e0;
  ${props => props.isProcessing && `
    margin-top: 10px;
    background-color: #e8f7ee;
    border-color: #c8e6d7;
  `}
`;

const DotContainer = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
`;

const Dot = styled.div<{ isProcessing?: boolean }>`
  width: 8px;
  height: 8px;
  background-color: ${props => props.isProcessing ? '#238750' : '#888'};
  border-radius: 50%;
  opacity: 0.6;
  animation: ${props => props.isProcessing ? 'processingPulse' : 'pulse'} 1.2s infinite;
  
  &:nth-child(2) {
    animation-delay: 0.2s;
  }
  
  &:nth-child(3) {
    animation-delay: 0.4s;
  }
`;

const ChatInput = styled.div`
  display: flex;
  flex-direction: column;
  padding: 20px;
  border-top: 1px solid #eee;
  background-color: white;
`;

const InputRow = styled.div`
  display: flex;
  align-items: flex-end;
  width: 100%;
`;

const HelperText = styled.div`
  font-size: 12px;
  color: #888;
  margin-top: 4px;
  padding-left: 12px;
  align-self: flex-start;
`;

const Textarea = styled.textarea`
  flex: 1;
  padding: 14px 20px;
  border: 1px solid #ddd;
  border-radius: 24px;
  margin-right: 10px;
  font-size: 16px;
  transition: all 0.2s ease;
  font-family: inherit;
  resize: none;
  min-height: 52px;
  max-height: 120px;
  overflow-y: auto;
  line-height: 1.4;
  
  &:focus {
    outline: none;
    border-color: #1DB954;
    box-shadow: 0 0 0 3px rgba(29, 185, 84, 0.15);
  }
  
  &::placeholder {
    color: #999;
  }

  &:disabled {
    opacity: 0.7;
    cursor: not-allowed;
  }
`;

const SendButton = styled.button`
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 24px;
  padding: 14px 24px;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s ease;
  font-size: 16px;
  font-weight: 500;
  
  &:hover {
    background-color: #19a049;
    transform: translateY(-1px);
    box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
  }
  
  &:active {
    transform: translateY(0);
    box-shadow: none;
  }
  
  &:disabled {
    background-color: #cccccc;
    cursor: not-allowed;
    transform: none;
    box-shadow: none;
  }
  
  svg {
    margin-left: 4px;
  }
`;

const ProcessingLabel = styled.div`
  font-size: 13px;
  color: #238750;
  margin-bottom: 4px;
  font-weight: 500;
`;

// Message interface
interface Message {
  text: string;
  isUser: boolean;
  isProcessing?: boolean;
}

// Constants for localStorage keys
const CONVERSATION_STORAGE_KEY = 'agent_conversation_messages';
const CONVERSATION_ID_STORAGE_KEY = 'agent_conversation_id';
const CURRENT_JOB_ID_STORAGE_KEY = 'agent_current_job_id';

// Small utility component for date formatting
const formatDate = () => {
  const now = new Date();
  return now.toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });
};

const AgentPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { text: "Hi! I'm your lyric video assistant. I can create lyric videos and answer questions about music. What can I help you with today?", isUser: false }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [currentJobId, setCurrentJobId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [conversationId, setConversationId] = useState<string | undefined>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [currentDate] = useState(formatDate());
  // Add a ref to store the interval ID
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isRestoringConversation, setIsRestoringConversation] = useState(true);
  
  // Add a ref for the textarea element
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  
  // Save conversation to localStorage whenever it changes
  useEffect(() => {
    // Don't save if we're in the process of restoring from localStorage/backend
    if (isRestoringConversation) return;
    
    // Only save if there are messages beyond the initial greeting
    if (messages.length > 1) {
      localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(messages));
      console.log('Saved conversation to localStorage:', messages.length, 'messages');
    }
  }, [messages, isRestoringConversation]);
  
  // Save conversation ID when it changes
  useEffect(() => {
    if (conversationId) {
      localStorage.setItem(CONVERSATION_ID_STORAGE_KEY, conversationId);
      console.log('Saved conversation ID to localStorage:', conversationId);
    }
  }, [conversationId]);
  
  // Save current job ID when it changes
  useEffect(() => {
    if (currentJobId) {
      localStorage.setItem(CURRENT_JOB_ID_STORAGE_KEY, currentJobId);
      console.log('Saved current job ID to localStorage:', currentJobId);
    } else {
      // Remove from localStorage when it's null (job completed or failed)
      localStorage.removeItem(CURRENT_JOB_ID_STORAGE_KEY);
    }
  }, [currentJobId]);
  
  // Check for ongoing video generations when component mounts
  useEffect(() => {
    const checkForOngoingGenerations = () => {
      const savedJobId = localStorage.getItem(CURRENT_JOB_ID_STORAGE_KEY);
      if (savedJobId) {
        console.log('Found ongoing video generation:', savedJobId);
        setCurrentJobId(savedJobId);
        
        // Check if we already have a processing indicator in messages
        const hasProcessingIndicator = messages.some(msg => msg.isProcessing);
        
        if (!hasProcessingIndicator) {
          setMessages(prev => [...prev, {
            text: '...',
            isUser: false,
            isProcessing: true
          }]);
        }
      }
    };
    
    // Only run after conversation is restored
    if (!isRestoringConversation) {
      checkForOngoingGenerations();
    }
  }, [isRestoringConversation, messages]);
  
  // Attempt to restore conversation when component mounts
  useEffect(() => {
    const restoreConversation = async () => {
      try {
        // Get saved conversation ID
        const savedConversationId = localStorage.getItem(CONVERSATION_ID_STORAGE_KEY);
        
        if (savedConversationId) {
          setConversationId(savedConversationId);
          console.log('Restored conversation ID from localStorage:', savedConversationId);
          
          // Try to fetch conversation from backend first
          try {
            const history = await fetchConversationHistory(savedConversationId);
            console.log('Fetched conversation from backend:', history);
            
            if (history.messages && history.messages.length > 0) {
              // Convert backend message format to our frontend format
              const convertedMessages: Message[] = history.messages.map(msg => ({
                text: msg.content,
                isUser: msg.role === 'user',
                isProcessing: false
              }));
              
              // Add our welcome message at the beginning if it's not there
              const hasWelcomeMessage = convertedMessages.some(
                msg => !msg.isUser && msg.text.includes("I'm your lyric video assistant")
              );
              
              const finalMessages = hasWelcomeMessage 
                ? convertedMessages
                : [messages[0], ...convertedMessages];
              
              setMessages(finalMessages);
              console.log('Restored conversation from backend:', finalMessages.length, 'messages');
            } else {
              // If no messages from backend, try localStorage
              fallbackToLocalStorage();
            }
          } catch (error) {
            console.error('Error fetching conversation history:', error);
            // Fallback to localStorage if backend fetch fails
            fallbackToLocalStorage();
          }
        } else {
          // If no saved conversation ID, still try localStorage
          fallbackToLocalStorage();
        }
      } catch (error) {
        console.error('Error restoring conversation:', error);
      } finally {
        setIsRestoringConversation(false);
      }
    };
    
    const fallbackToLocalStorage = () => {
      // Check for saved messages in localStorage
      const savedMessages = localStorage.getItem(CONVERSATION_STORAGE_KEY);
      if (savedMessages) {
        try {
          const parsedMessages = JSON.parse(savedMessages) as Message[];
          if (parsedMessages.length > 0) {
            setMessages(parsedMessages);
            console.log('Restored conversation from localStorage:', parsedMessages.length, 'messages');
          }
        } catch (error) {
          console.error('Error parsing saved messages:', error);
        }
      }
    };
    
    restoreConversation();
    
    // Cleanup function to save conversation when component unmounts
    return () => {
      if (messages.length > 1) {
        localStorage.setItem(CONVERSATION_STORAGE_KEY, JSON.stringify(messages));
        console.log('Saved conversation to localStorage on unmount');
      }
    };
  }, []);
  
  // Fetch user data on component mount
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const data = await getUserProfile();
        setUserData(data);
      } catch (error) {
        console.error('Error fetching user data:', error);
      }
    };
    
    fetchUserData();
  }, []);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  // Clean up interval on component unmount or when job changes
  useEffect(() => {
    // Start polling if currentJobId is set
    if (currentJobId) {
      startCheckingJobStatus(currentJobId);
    }
    
    // Cleanup function
    return () => {
      if (intervalRef.current) {
        console.log("Cleaning up interval on unmount or job change");
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [currentJobId]);
  
  // Handle logout
  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };
  
  // Handle sending a message
  const handleSend = async () => {
    if (!input.trim() || isLoading) return;
    
    const userMessage = input;
    setInput('');
    setMessages(prev => [...prev, { text: userMessage, isUser: true }]);
    setIsLoading(true);
    
    // Add a typing indicator
    setMessages(prev => [...prev, { text: '...', isUser: false }]);
    
    try {
      // Use the agent_chat endpoint for all conversations
      console.log('Sending message with conversation ID:', conversationId);
      const response = await agent_chat(userMessage, conversationId);
      
      // Remove typing indicator
      setMessages(prev => prev.slice(0, -1));
      
      // Save the conversation ID for future messages
      if (response.conversation_id && response.conversation_id !== conversationId) {
        console.log('Updating conversation ID:', response.conversation_id);
        setConversationId(response.conversation_id);
      }
      
      // Handle song request confirmation
      if (response.is_song_request && response.song_request_data) {
        // First, clear any existing processing indicators to avoid duplicates
        setMessages(prev => prev.filter(msg => !msg.isProcessing));
        
        // Set the new job ID
        setCurrentJobId(response.song_request_data.job_id);
        
        // Add the assistant's response
        setMessages(prev => [...prev, { 
          text: response.message || `I'm creating a lyric video for "${response.song_request_data?.title}" by ${response.song_request_data?.artist}. I'll let you know when it's ready!`, 
          isUser: false 
        }]);
        
        // Add processing indicator after the confirmation message
        setMessages(prev => [...prev, { 
          text: '...', 
          isUser: false,
          isProcessing: true  // Mark as processing indicator
        }]);
        
        // The polling will start due to the useEffect with currentJobId dependency
      } else {
        // For regular responses
        setMessages(prev => [...prev, { 
          text: response.message, 
          isUser: false 
        }]);
      }
      
    } catch (error) {
      console.error('Error:', error);
      // Remove typing indicator
      setMessages(prev => prev.slice(0, -1));
      
      // Add error message
      let errorMessage = error instanceof Error ? error.message : 'Something went wrong';
      
      setMessages(prev => [...prev, { 
        text: errorMessage, 
        isUser: false 
      }]);
    } finally {
      setIsLoading(false);
    }
  };
  
  // Function to check job status and notify when complete
  const startCheckingJobStatus = (jobId: string) => {
    if (!jobId) return;
    
    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    
    // Keep track of whether we're still polling
    let isPolling = true;
    
    const checkStatus = async () => {
      try {
        console.log(`Checking status for job: ${jobId}`);
        const statusResponse = await getVideoStatus(jobId);
        console.log(`Job status: ${statusResponse.status}`);
        
        // If we stopped polling while the request was in progress, don't update anything
        if (!isPolling) return;
        
        if (statusResponse.status === 'completed') {
          // Remove the processing indicator
          setMessages(prev => prev.filter(msg => !msg.isProcessing));
          
          // Video is ready - notify the user
          setMessages(prev => [...prev, { 
            text: "Great news! Your lyric video is now ready. You can view it in the My Songs section.", 
            isUser: false 
          }]);
          
          // Clear the interval and mark polling as stopped
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            isPolling = false;
          }
          
          // Clear the job ID to prevent further checks
          setCurrentJobId(null);
          
        } else if (statusResponse.status === 'failed') {
          // Remove the processing indicator
          setMessages(prev => prev.filter(msg => !msg.isProcessing));
          
          // Video generation failed
          setMessages(prev => [...prev, { 
            text: "I'm sorry, but there was an issue generating your lyric video. The error was: " + 
                  (statusResponse.error || "Unknown error"), 
            isUser: false 
          }]);
          
          // Clear the interval and mark polling as stopped
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            isPolling = false;
          }
          
          // Clear the job ID to prevent further checks
          setCurrentJobId(null);
        }
        // If still processing, keep the processing indicator and continue polling
      } catch (error) {
        console.error('Error checking video status:', error);
        
        // If we stopped polling while the request was in progress, don't update anything
        if (!isPolling) return;
        
        // Remove the processing indicator on error
        setMessages(prev => prev.filter(msg => !msg.isProcessing));
        
        // Add error message so user knows something went wrong
        setMessages(prev => [...prev, { 
          text: "I'm having trouble checking on your video status. Please check the My Songs section to see if it's ready.", 
          isUser: false 
        }]);
        
        // Clear interval on error to prevent infinite errors
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          isPolling = false;
        }
        
        // Clear the job ID to prevent further checks
        setCurrentJobId(null);
      }
    };
    
    // Increase polling interval from 5 to 10 seconds to reduce network requests
    intervalRef.current = setInterval(checkStatus, 10000);
    
    // Make an immediate check
    checkStatus();
  };
  
  // Handle key press events for the textarea
  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Allow Shift+Enter for line breaks
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault(); // Prevent the default behavior (new line)
      handleSend(); // Send the message
    }
    // Shift+Enter will add a new line naturally
  };
  
  // Function to auto-resize the textarea based on content
  const autoResizeTextarea = () => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    
    // Reset height to auto to get the correct scrollHeight
    textarea.style.height = 'auto';
    
    // Set the height to scrollHeight to fit the content
    // but cap it at max-height via CSS
    textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
  };
  
  // Listen for input changes to resize the textarea
  useEffect(() => {
    autoResizeTextarea();
  }, [input]);
  
  return (
    <AppLayout>
      <GlobalStyle />
      <Sidebar>
        <Logo>zLyrics</Logo>
        <NavMenu>
          <NavItem to="/">
            <NavIcon>{IoHomeOutline({ size: 18 })}</NavIcon> Home
          </NavItem>
          <NavItem to="/profile">
            <NavIcon>{CgProfile({ size: 18 })}</NavIcon> Profile
          </NavItem>
          <NavItem to="/songs">
            <NavIcon>{MdMusicNote({ size: 18 })}</NavIcon> My Songs
          </NavItem>
          <NavItem to="/create">
            <NavIcon>{MdAdd({ size: 18 })}</NavIcon> Create Lyrics
          </NavItem>
          <NavItem to="/agent" active>
            <NavIcon>{RiRobot2Line({ size: 18 })}</NavIcon> Agent
          </NavItem>
        </NavMenu>
      </Sidebar>
      
      <MainContent>
        <PageHeader>
          <UserActions>
            {userData && (
              <UserInfo>
                <UserAvatar 
                  src={userData.profile_picture || "https://via.placeholder.com/40x40?text=User"} 
                  alt={userData.name} 
                />
                <UserName>{userData.name}</UserName>
              </UserInfo>
            )}
            <LogoutButton onClick={handleLogout}>
              {MdLogout({ size: 18 })} Logout
            </LogoutButton>
          </UserActions>
        </PageHeader>
        
        <PageTitle>Lyric Video Assistant</PageTitle>
        <p style={{ 
          marginBottom: '30px', 
          textAlign: 'center',
          fontSize: '16px',
          color: '#666',
          maxWidth: '600px',
          margin: '0 auto 30px'
        }}>
          Ask me to create a lyric video for any song, or chat about music and videos. I'm here to help!
        </p>
        
        <ChatContainer>
          <ChatHeader>
            <ChatHeaderIcon>
              {RiRobot2Line({ size: 18 })}
            </ChatHeaderIcon>
            <div>
              <ChatHeaderTitle>Lyric Video Assistant</ChatHeaderTitle>
              <ChatHeaderSubtitle>{currentDate}</ChatHeaderSubtitle>
            </div>
          </ChatHeader>
          <ChatMessages>
            {messages.map((message, index) => (
              message.text === '...' ? (
                <AssistantTypingIndicator key={index} isProcessing={message.isProcessing}>
                  {message.isProcessing && (
                    <ProcessingLabel>Generating your video</ProcessingLabel>
                  )}
                  <DotContainer>
                    <Dot isProcessing={message.isProcessing} />
                    <Dot isProcessing={message.isProcessing} />
                    <Dot isProcessing={message.isProcessing} />
                  </DotContainer>
                </AssistantTypingIndicator>
              ) : (
                <MessageBubble key={index} isUser={message.isUser}>
                  {message.text}
                </MessageBubble>
              )
            ))}
            <div ref={messagesEndRef} />
          </ChatMessages>
          <ChatInput>
            <InputRow>
              <Textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask me about creating a lyric video..."
                onKeyDown={handleKeyPress}
                disabled={isLoading}
                rows={1}
              />
              <SendButton onClick={handleSend} disabled={isLoading}>
                {isLoading ? 'Sending...' : (
                  <>
                    Send
                    {MdSend({ size: 18, style: { marginLeft: '6px' } })}
                  </>
                )}
              </SendButton>
            </InputRow>
          </ChatInput>
        </ChatContainer>
      </MainContent>
    </AppLayout>
  );
};

export default AgentPage; 