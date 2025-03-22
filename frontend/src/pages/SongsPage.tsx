import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import styled from 'styled-components';
import { getUserProfile, logout, getUserVideos, deleteVideo, VideoJob, extractSpotifyTrackId, getSpotifyAlbumArtwork } from '../services/api';
// Import icons
import { CgProfile } from 'react-icons/cg';
import { IoHomeOutline } from 'react-icons/io5';
import { MdMusicNote, MdAdd, MdLogout, MdDownload, MdPlayArrow, MdPause, MdClose, MdDelete, MdCheckCircle, MdStar, MdStarBorder } from 'react-icons/md';
import { BsMusicNoteList, BsCheckSquare, BsCheckSquareFill } from 'react-icons/bs';
import { AiFillStar, AiOutlineStar } from 'react-icons/ai';

// Styled components for the songs page (matching profile page style)
const AppLayout = styled.div`
  display: flex;
  width: 100%;
  min-height: 100vh;
  background-color: #f5f5f5;
  color: #333;
  max-width: 100vw;
  overflow-x: hidden;
  transition: opacity 0.2s ease;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
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
  z-index: 100;
  
  @media (max-width: 768px) {
    display: none;
  }
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
  transition: all 0.2s ease;
  
  @media (max-width: 1200px) {
    padding: 30px 40px;
  }
  
  @media (max-width: 768px) {
    margin-left: 0;
    width: 100%;
    padding: 20px;
  }
`;

const PageHeader = styled.div`
  display: flex;
  justify-content: space-between;
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

const SongsContainer = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  overflow: hidden;
  padding: 0;
  width: 100%;
  max-width: 100%;
  margin-bottom: 30px;
`;

const SongsHeader = styled.div`
  background: linear-gradient(90deg, #1DB954, #169c46);
  padding: 25px 30px;
  color: white;
`;

const SongsHeaderTitle = styled.h2`
  font-size: 22px;
  font-weight: 600;
  margin: 0;
  display: flex;
  align-items: center;
  gap: 10px;
`;

const SongsList = styled.div`
  padding: 0;
  max-height: calc(100vh - 250px);
  overflow-y: auto;
  
  /* Custom scrollbar for better UX */
  &::-webkit-scrollbar {
    width: 10px;
  }
  
  &::-webkit-scrollbar-track {
    background: #f1f1f1;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb {
    background: #ccc;
    border-radius: 4px;
  }
  
  &::-webkit-scrollbar-thumb:hover {
    background: #1DB954;
  }
`;

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

const SongInfo = styled.div`
  flex: 1;
  min-width: 0; /* Prevents flex items from overflowing */
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

const SongDuration = styled.span`
  font-size: 15px;
  color: #999;
  margin-right: 30px;
  
  @media (max-width: 768px) {
    margin-right: 20px;
    font-size: 14px;
  }
  
  @media (max-width: 480px) {
    margin-right: 10px;
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

const DownloadButton = styled(ActionButton)`
  &:hover {
    color: #1DB954;
  }
`;

const PlayButton = styled(ActionButton)`
  background-color: ${props => props.className === 'playing' ? '#1DB954' : 'transparent'};
  color: ${props => props.className === 'playing' ? 'white' : '#666'};
  
  &:hover {
    background-color: ${props => props.className === 'playing' ? '#169c46' : '#f0f0f0'};
    color: ${props => props.className === 'playing' ? 'white' : '#1DB954'};
  }
`;

const EmptyState = styled.div`
  padding: 80px 30px;
  text-align: center;
  color: #999;
  
  @media (max-width: 768px) {
    padding: 50px 20px;
  }
`;

const EmptyStateIcon = styled.div`
  font-size: 48px;
  margin-bottom: 20px;
  color: #ddd;
`;

const EmptyStateText = styled.p`
  font-size: 16px;
  margin: 0 0 20px;
`;

const Button = styled.button`
  background-color: #1DB954;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 10px 16px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  gap: 6px;
  margin: 0 auto;
  
  &:hover {
    background-color: #169c46;
  }
  
  &:active {
    transform: scale(0.98);
  }
`;

const NotificationMessage = styled.div<{ type: 'success' | 'error' }>`
  background-color: ${props => props.type === 'success' 
    ? 'rgba(29, 185, 84, 0.1)' 
    : 'rgba(233, 20, 41, 0.1)'};
  color: ${props => props.type === 'success' ? '#1DB954' : '#e91429'};
  padding: 15px;
  border-radius: 8px;
  margin-bottom: 20px;
  font-size: 14px;
  display: flex;
  align-items: center;
  gap: 10px;

  &::before {
    content: '${props => props.type === 'success' ? '✅' : '⚠️'}';
  }
`;

const StatsCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 25px;
  
  @media (max-width: 768px) {
    padding: 20px;
  }
`;

const StatsTitle = styled.h3`
  font-size: 20px;
  font-weight: 600;
  margin: 0 0 20px;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 18px;
    margin: 0 0 15px;
  }
`;

const StatsList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 15px;
  
  @media (max-width: 768px) {
    gap: 12px;
  }
`;

const StatItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-bottom: 15px;
  border-bottom: 1px solid #f0f0f0;
  
  &:last-child {
    border-bottom: none;
    padding-bottom: 0;
  }
  
  @media (max-width: 768px) {
    padding-bottom: 12px;
  }
`;

const StatLabel = styled.span`
  font-size: 16px;
  color: #666;
  
  @media (max-width: 768px) {
    font-size: 14px;
  }
`;

const StatValue = styled.span`
  font-size: 18px;
  font-weight: 600;
  color: #333;
  
  @media (max-width: 768px) {
    font-size: 16px;
  }
`;

// Add ContentGrid styled component to match ProfilePage
const ContentGrid = styled.div`
  display: grid;
  grid-template-columns: 2fr 1fr;
  gap: 30px;
  
  @media (max-width: 1200px) {
    grid-template-columns: 1fr;
  }
`;

const ComingSoonCard = styled.div`
  background-color: white;
  border-radius: 10px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
  padding: 30px;
  margin-top: 30px;
  text-align: center;
`;

const ComingSoonTitle = styled.h3`
  font-size: 18px;
  font-weight: 600;
  margin: 0 0 15px;
  color: #1DB954;
`;

const ComingSoonText = styled.p`
  font-size: 14px;
  color: #666;
  margin: 0;
  line-height: 1.5;
`;

// Add new styled components for the video player modal
const VideoModal = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const VideoContainer = styled.div`
  width: 90%;
  max-width: 800px;
  background: #191414;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3);
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
  background: rgba(0, 0, 0, 0.5);
  border: none;
  border-radius: 50%;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.2);
    transform: scale(1.1);
  }
`;

const VideoInfoBar = styled.div`
  padding: 15px;
  background: #191414;
  color: white;
`;

const VideoTitle = styled.h4`
  font-size: 18px;
  margin: 0 0 5px;
`;

const VideoArtist = styled.p`
  font-size: 14px;
  color: #1DB954;
  margin: 0;
`;

// Add a styled component for the delete button
const DeleteButton = styled(ActionButton)`
  &:hover {
    color: #e91429;
    background-color: rgba(233, 20, 41, 0.1);
  }
`;

// Add a styled component for the confirm dialog
const ConfirmDialog = styled.div`
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
  padding: 20px;
`;

const ConfirmBox = styled.div`
  background-color: white;
  border-radius: 10px;
  padding: 25px;
  width: 90%;
  max-width: 400px;
  text-align: center;
  box-shadow: 0 5px 15px rgba(0, 0, 0, 0.3);
`;

const ConfirmTitle = styled.h3`
  font-size: 18px;
  margin-bottom: 15px;
  color: #333;
`;

const ConfirmText = styled.p`
  margin-bottom: 20px;
  color: #666;
  font-size: 14px;
  line-height: 1.5;
`;

const ButtonGroup = styled.div`
  display: flex;
  justify-content: center;
  gap: 15px;
`;

const CancelButton = styled.button`
  background-color: #f5f5f5;
  color: #333;
  border: none;
  border-radius: 8px;
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #e0e0e0;
  }
`;

const ConfirmDeleteButton = styled.button`
  background-color: #e91429;
  color: white;
  border: none;
  border-radius: 8px;
  padding: 10px 15px;
  font-size: 14px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: #c51226;
  }
`;

// Add function to generate a placeholder color based on song title 
const generatePlaceholderColor = (title: string): string => {
  // Simple hash function to convert string to a number
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }

  // Convert hash to a bright/vibrant color
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 80%, 60%)`;
};

// Add a placeholder component for when there's no album cover
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

// Update the Song interface to include learning status
interface Song {
  id: string;
  song_title: string;
  artist: string;
  video_file: string | null;
  created_at: string;
  spotify_url: string;
  albumCoverUrl?: string | null;
  learned: boolean;
  lastPracticed?: string | null;
  difficultyRating?: number | null;
}

// Add a styled component for the checkbox to mark a song as learned
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

// Update the StarRating component to use icons
const StarRating = styled.div`
  display: flex;
  align-items: center;
  gap: 2px;
  margin-top: 8px;
`;

const Star = styled.div<{ filled: boolean }>`
  color: ${props => props.filled ? '#FFD700' : '#ddd'};
  cursor: pointer;
  font-size: 16px;
  transition: color 0.2s ease;
  display: flex;
  align-items: center;
  
  &:hover {
    color: #FFD700;
  }
`;

// Add a filter bar for the songs list
const FilterBar = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 30px;
  border-bottom: 1px solid #f0f0f0;
  background-color: #fafafa;
`;

const FilterOptions = styled.div`
  display: flex;
  align-items: center;
  gap: 15px;
`;

const FilterOption = styled.button<{ active: boolean }>`
  background: ${props => props.active ? 'rgba(29, 185, 84, 0.1)' : 'transparent'};
  border: none;
  padding: 8px 12px;
  border-radius: 4px;
  cursor: pointer;
  color: ${props => props.active ? '#1DB954' : '#666'};
  font-size: 14px;
  font-weight: 500;
  transition: all 0.2s ease;
  
  &:hover {
    background-color: rgba(29, 185, 84, 0.1);
    color: #1DB954;
  }
`;

const SearchInput = styled.input`
  padding: 8px 12px;
  border: 1px solid #ddd;
  border-radius: 4px;
  width: 200px;
  font-size: 14px;
  transition: all 0.2s ease;
  
  &:focus {
    border-color: #1DB954;
    outline: none;
    box-shadow: 0 0 0 2px rgba(29, 185, 84, 0.1);
  }
`;

// Add a progress bar component for the learning status
const ProgressBarContainer = styled.div`
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin: 15px 0;
`;

const ProgressFill = styled.div<{ percent: number }>`
  height: 100%;
  background: linear-gradient(90deg, #1DB954, #169c46);
  width: ${props => props.percent}%;
  transition: width 0.3s ease;
`;

const ProgressStats = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 10px;
  font-size: 14px;
  color: #666;
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

const SongsPage: React.FC = () => {
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notification, setNotification] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const [playingSongId, setPlayingSongId] = useState<string | null>(null);
  const [userData, setUserData] = useState<any>(null);
  const [videoLoading, setVideoLoading] = useState(false);
  const [songToDelete, setSongToDelete] = useState<Song | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  
  // Add new state variables for learning feature
  const [filter, setFilter] = useState<'all' | 'learned' | 'not-learned'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  
  useEffect(() => {
    // Fetch user profile data
    const fetchUserData = async () => {
      try {
        const data = await getUserProfile();
        setUserData(data);
      } catch (err) {
        console.error('Error fetching user data:', err);
      }
    };
    
    // Fetch user's videos and album covers together
    const fetchSongsAndCovers = async () => {
      try {
        setLoading(true);
        const videosData = await getUserVideos();
        
        // Map VideoJob data to Song interface
        const formattedSongs = videosData.map(video => {
          // Check local storage for learning data
          const learningData = JSON.parse(localStorage.getItem(`song_learning_${video.id}`) || 'null');
          
          return {
            id: video.id,
            song_title: video.song_title,
            artist: video.artist,
            video_file: video.video_file,
            created_at: video.created_at,
            spotify_url: video.spotify_url,
            albumCoverUrl: null, // Will be populated soon
            learned: learningData?.learned || false,
            lastPracticed: learningData?.lastPracticed || null,
            difficultyRating: learningData?.difficultyRating || null
          };
        });
        
        // First set songs without album covers to show UI faster
        setSongs(formattedSongs);
        
        // Then immediately start fetching album covers in parallel with retries
        const fetchAlbumCover = async (song: Song): Promise<Song> => {
          // Extract track ID from Spotify URL
          const trackId = extractSpotifyTrackId(song.spotify_url);
          
          if (!trackId) {
            console.warn(`Could not extract track ID from Spotify URL for "${song.song_title}": ${song.spotify_url}`);
            return song;
          }
          
          try {
            // Fetch album cover with retry
            const fetchWithRetry = async (attempts = 3): Promise<string | null> => {
              try {
                const albumCoverUrl = await getSpotifyAlbumArtwork(trackId);
                return albumCoverUrl;
              } catch (err) {
                if (attempts <= 1) throw err;
                console.log(`Retrying album cover fetch for "${song.song_title}" (${attempts-1} attempts left)`);
                await new Promise(r => setTimeout(r, 500)); // Wait 500ms before retry
                return fetchWithRetry(attempts - 1);
              }
            };
            
            const albumCoverUrl = await fetchWithRetry();
            if (albumCoverUrl) {
              return { ...song, albumCoverUrl };
            }
          } catch (err) {
            console.error(`Error fetching album cover for "${song.song_title}":`, err);
          }
          
          return song;
        };
        
        // Process in batches to avoid overwhelming the API
        const batchSize = 5;
        let songsWithCovers: Song[] = [...formattedSongs];
        
        for (let i = 0; i < formattedSongs.length; i += batchSize) {
          const batch = formattedSongs.slice(i, i + batchSize);
          const batchResults = await Promise.all(batch.map(fetchAlbumCover));
          
          // Update songs with this batch of results
          songsWithCovers = [
            ...songsWithCovers.slice(0, i),
            ...batchResults,
            ...songsWithCovers.slice(i + batchSize)
          ];
          
          // Update state with partial results
          setSongs(songsWithCovers);
        }
        
        setError(null);
      } catch (err) {
        setError('Failed to load songs. Please try again later.');
        console.error('Error fetching songs:', err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchUserData();
    fetchSongsAndCovers();
  }, []);
  
  const handleLogout = async () => {
    if (window.confirm('Are you sure you want to log out?')) {
      try {
        await logout();
        navigate('/login');
      } catch (error) {
        console.error('Error logging out:', error);
        // Force logout even if API call fails
        localStorage.removeItem('auth_token');
        navigate('/login');
      }
    }
  };
  
  const handlePlayPause = (songId: string) => {
    if (playingSongId === songId) {
      setPlayingSongId(null);
      // Stop the video if it's playing
      if (videoRef.current) {
        videoRef.current.pause();
      }
    } else {
      setPlayingSongId(songId);
      setVideoLoading(true);
      // The video will be loaded in the useEffect
    }
  };
  
  // Add useEffect to handle video playback
  useEffect(() => {
    if (playingSongId && videoRef.current) {
      const song = songs.find(s => s.id === playingSongId);
      if (song && song.video_file) {
        videoRef.current.src = song.video_file;
        
        // Listen for the loaded data event to hide the loading indicator
        const handleVideoLoaded = () => {
          setVideoLoading(false);
        };
        
        // Clean up function to remove event listeners
        const cleanUpVideo = () => {
          if (videoRef.current) {
            videoRef.current.removeEventListener('loadeddata', handleVideoLoaded);
            videoRef.current.removeEventListener('error', handleVideoError);
          }
        };
        
        const handleVideoError = (e: Event) => {
          console.error('Error loading video:', e);
          setVideoLoading(false);
          setNotification({
            message: 'Error loading video. Please try again.',
            type: 'error'
          });
        };
        
        videoRef.current.addEventListener('loadeddata', handleVideoLoaded);
        videoRef.current.addEventListener('error', handleVideoError);
        
        videoRef.current.play().catch(err => {
          console.error('Error playing video:', err);
          setVideoLoading(false);
          setNotification({
            message: 'Error playing video. Please try again.',
            type: 'error'
          });
        });
        
        // Clean up the event listeners when the component unmounts
        return cleanUpVideo;
      }
    }
  }, [playingSongId, songs]);
  
  const handleDownload = (song: Song) => {
    if (!song.video_file) {
      setNotification({
        message: `Error: No video file available for "${song.song_title}"`,
        type: 'error'
      });
      return;
    }
    
    // Create a temporary anchor element to trigger download
    const link = document.createElement('a');
    link.href = song.video_file;
    link.download = `${song.song_title} - ${song.artist}.mp4`;
    link.target = '_blank';
    
    // Append to the document and trigger click
    document.body.appendChild(link);
    link.click();
    
    // Clean up
    document.body.removeChild(link);
    
    setNotification({
      message: `Downloading "${song.song_title}" by ${song.artist}...`,
      type: 'success'
    });
    
    // Clear notification after 3 seconds
    setTimeout(() => {
      setNotification(null);
    }, 3000);
  };
  
  // Add delete song function
  const handleDeleteClick = (song: Song) => {
    setSongToDelete(song);
  };
  
  const confirmDelete = async () => {
    if (!songToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteVideo(songToDelete.id);
      
      // Remove the deleted song from the state
      setSongs(songs.filter(s => s.id !== songToDelete.id));
      
      // Show success notification
      setNotification({
        message: `"${songToDelete.song_title}" has been deleted`,
        type: 'success'
      });
      
      // Clear notification after 3 seconds
      setTimeout(() => {
        setNotification(null);
      }, 3000);
    } catch (err) {
      console.error('Error deleting song:', err);
      setNotification({
        message: 'Error deleting song. Please try again.',
        type: 'error'
      });
    } finally {
      setIsDeleting(false);
      setSongToDelete(null);
    }
  };
  
  const cancelDelete = () => {
    setSongToDelete(null);
  };
  
  // Add function to toggle learned status
  const toggleLearnedStatus = (songId: string) => {
    setSongs(prevSongs => {
      const updatedSongs = prevSongs.map(song => {
        if (song.id === songId) {
          const newLearnedStatus = !song.learned;
          const lastPracticed = newLearnedStatus ? new Date().toISOString() : song.lastPracticed;
          
          // Get the current user ID
          const userId = userData?.id || parseInt(localStorage.getItem('user_id') || '0');
          
          // Save learning data to localStorage with user-specific key
          localStorage.setItem(`user_${userId}_song_learning_${songId}`, JSON.stringify({
            learned: newLearnedStatus,
            lastPracticed,
            difficultyRating: song.difficultyRating
          }));
          
          return {
            ...song,
            learned: newLearnedStatus,
            lastPracticed
          };
        }
        return song;
      });
      
      // Show notification
      const song = prevSongs.find(s => s.id === songId);
      if (song) {
        setNotification({
          message: song.learned 
            ? `Marked "${song.song_title}" as not learned` 
            : `Congratulations! You've learned "${song.song_title}"`,
          type: 'success'
        });
        
        // Clear notification after 3 seconds
        setTimeout(() => {
          setNotification(null);
        }, 3000);
      }
      
      return updatedSongs;
    });
  };
  
  // Add function to set difficulty rating
  const setDifficultyRating = (songId: string, rating: number) => {
    setSongs(prevSongs => {
      const updatedSongs = prevSongs.map(song => {
        if (song.id === songId) {
          // Get the current user ID
          const userId = userData?.id || parseInt(localStorage.getItem('user_id') || '0');
          
          // Get existing learning data
          const existingData = JSON.parse(localStorage.getItem(`user_${userId}_song_learning_${songId}`) || '{}');
          
          // Update and save learning data with user-specific key
          localStorage.setItem(`user_${userId}_song_learning_${songId}`, JSON.stringify({
            ...existingData,
            difficultyRating: rating
          }));
          
          return {
            ...song,
            difficultyRating: rating
          };
        }
        return song;
      });
      
      return updatedSongs;
    });
  };
  
  // Add function to filter songs
  const getFilteredSongs = () => {
    return songs.filter(song => {
      // Apply filter
      if (filter === 'all' && song.learned) return false; // Only show unlearned songs in "All Songs"
      if (filter === 'learned' && !song.learned) return false;
      if (filter === 'not-learned' && song.learned) return false;
      
      // Apply search
      if (searchTerm.trim() !== '') {
        const term = searchTerm.toLowerCase();
        return song.song_title.toLowerCase().includes(term) || 
               song.artist.toLowerCase().includes(term);
      }
      
      return true;
    });
  };
  
  // Calculate learning stats
  const getTotalLearned = () => songs.filter(song => song.learned).length;
  const getLearningProgress = () => (songs.length > 0 ? (getTotalLearned() / songs.length) * 100 : 0);
  const getNextToLearn = () => songs.find(song => !song.learned);
  
  // Update the stats card
  const renderLearningStats = () => {
    return (
      <StatsCard>
        <StatsTitle>Learning Progress</StatsTitle>
        
        <ProgressStats>
          <span>Learned {getTotalLearned()} of {songs.length} songs</span>
          <span>{Math.round(getLearningProgress())}%</span>
        </ProgressStats>
        
        <ProgressBarContainer>
          <ProgressFill percent={getLearningProgress()} />
        </ProgressBarContainer>
        
        <StatsList>
          <StatItem>
            <StatLabel>Total Songs</StatLabel>
            <StatValue>{songs.length}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Songs Learned</StatLabel>
            <StatValue>{getTotalLearned()}</StatValue>
          </StatItem>
          <StatItem>
            <StatLabel>Next to Learn</StatLabel>
            <StatValue>{getNextToLearn()?.song_title || 'None'}</StatValue>
          </StatItem>
          {getTotalLearned() > 0 && (
            <StatItem>
              <StatLabel>Last Practiced</StatLabel>
              <StatValue>
                {(() => {
                  const lastPracticedSong = [...songs]
                    .filter(s => s.lastPracticed)
                    .sort((a, b) => new Date(b.lastPracticed!).getTime() - new Date(a.lastPracticed!).getTime())[0];
                  
                  return lastPracticedSong ? 
                    new Date(lastPracticedSong.lastPracticed!).toLocaleDateString() : 
                    'Never';
                })()}
              </StatValue>
            </StatItem>
          )}
        </StatsList>
      </StatsCard>
    );
  };
  
  if (loading) {
    return (
      <AppLayout>
        <Sidebar>
          <Logo>zLyrics</Logo>
          <NavMenu>
            <NavItem to="/">
              <NavIcon>{IoHomeOutline({ size: 18 })}</NavIcon> Home
            </NavItem>
            <NavItem to="/profile">
              <NavIcon>{CgProfile({ size: 18 })}</NavIcon> Profile
            </NavItem>
            <NavItem to="/songs" active>
              <NavIcon>{MdMusicNote({ size: 18 })}</NavIcon> My Songs
            </NavItem>
            <NavItem to="/create">
              <NavIcon>{MdAdd({ size: 18 })}</NavIcon> Create Video
            </NavItem>
          </NavMenu>
        </Sidebar>
        <MainContent>
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            {/* <h2>Loading songs...</h2> */}
          </div>
        </MainContent>
      </AppLayout>
    );
  }
  
  if (error) {
    return (
      <AppLayout>
        <Sidebar>
          <Logo>zLyrics</Logo>
          <NavMenu>
            <NavItem to="/">
              <NavIcon>{IoHomeOutline({ size: 18 })}</NavIcon> Home
            </NavItem>
            <NavItem to="/profile">
              <NavIcon>{CgProfile({ size: 18 })}</NavIcon> Profile
            </NavItem>
            <NavItem to="/songs" active>
              <NavIcon>{MdMusicNote({ size: 18 })}</NavIcon> My Songs
            </NavItem>
            <NavItem to="/create">
              <NavIcon>{MdAdd({ size: 18 })}</NavIcon> Create Video
            </NavItem>
          </NavMenu>
        </Sidebar>
        <MainContent>
          <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
            <h2>Error</h2>
            <p>{error}</p>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </div>
        </MainContent>
      </AppLayout>
    );
  }
  
  // Get filtered songs
  const filteredSongs = getFilteredSongs();
  
  return (
    <AppLayout>
      <Sidebar>
        <Logo>zLyrics</Logo>
        <NavMenu>
          <NavItem to="/">
            <NavIcon>{IoHomeOutline({ size: 18 })}</NavIcon> Home
          </NavItem>
          <NavItem to="/profile">
            <NavIcon>{CgProfile({ size: 18 })}</NavIcon> Profile
          </NavItem>
          <NavItem to="/songs" active>
            <NavIcon>{MdMusicNote({ size: 18 })}</NavIcon> My Songs
          </NavItem>
          <NavItem to="/create">
            <NavIcon>{MdAdd({ size: 18 })}</NavIcon> Create Video
          </NavItem>
        </NavMenu>
      </Sidebar>
      
      <MainContent>
        <PageHeader>
          <PageTitle>My Songs</PageTitle>
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
        
        {notification && (
          <NotificationMessage type={notification.type}>
            {notification.message}
          </NotificationMessage>
        )}
        
        <ContentGrid>
          <SongsContainer>
            <SongsHeader>
              <SongsHeaderTitle>
                {BsMusicNoteList({ size: 20 })} Your Song Collection
              </SongsHeaderTitle>
            </SongsHeader>
            
            {songs.length > 0 && (
              <FilterBar>
                <FilterOptions>
                  <FilterOption 
                    active={filter === 'all'} 
                    onClick={() => setFilter('all')}
                  >
                    Unlearned Songs
                  </FilterOption>
                  <FilterOption 
                    active={filter === 'learned'} 
                    onClick={() => setFilter('learned')}
                  >
                    Learned
                  </FilterOption>
                  <FilterOption 
                    active={filter === 'not-learned'} 
                    onClick={() => setFilter('not-learned')}
                  >
                    Still Learning
                  </FilterOption>
                </FilterOptions>
                <SearchInput 
                  type="text" 
                  placeholder="Search songs..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </FilterBar>
            )}
            
            <SongsList>
              {songs.length === 0 ? (
                <EmptyState>
                  <EmptyStateIcon>
                    {MdMusicNote({ size: 48 })}
                  </EmptyStateIcon>
                  <EmptyStateText>You don't have any songs yet.</EmptyStateText>
                  <Button as={Link} to="/create">
                    {MdAdd({ size: 18 })} Create Your First Video
                  </Button>
                </EmptyState>
              ) : filteredSongs.length === 0 ? (
                <EmptyState>
                  <EmptyStateText>No songs match your current filter.</EmptyStateText>
                  <Button onClick={() => { setFilter('all'); setSearchTerm(''); }}>
                    Clear Filters
                  </Button>
                </EmptyState>
              ) : (
                filteredSongs.map(song => (
                  <SongItem key={song.id}>
                    <LearnedCheckbox 
                      checked={song.learned} 
                      onClick={() => toggleLearnedStatus(song.id)}
                    >
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
                      <StarRating>
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            filled={!!song.difficultyRating && star <= song.difficultyRating}
                            onClick={() => setDifficultyRating(song.id, star)}
                            title={`Difficulty: ${star}`}
                          >
                            {!!song.difficultyRating && star <= song.difficultyRating 
                              ? AiFillStar({ size: 16 }) 
                              : AiOutlineStar({ size: 16 })}
                          </Star>
                        ))}
                      </StarRating>
                    </SongInfo>
                    <SongDuration>
                      {song.lastPracticed 
                        ? `Last practiced: ${new Date(song.lastPracticed).toLocaleDateString()}`
                        : new Date(song.created_at).toLocaleDateString()}
                    </SongDuration>
                    <SongActions>
                      {song.video_file && (
                        <>
                          <PlayButton 
                            onClick={() => handlePlayPause(song.id)}
                            className={playingSongId === song.id ? 'playing' : ''}
                          >
                            {playingSongId === song.id 
                              ? MdPause({ size: 22 })
                              : MdPlayArrow({ size: 22 })
                            }
                          </PlayButton>
                          <DownloadButton onClick={() => handleDownload(song)}>
                            {MdDownload({ size: 22 })}
                          </DownloadButton>
                          <DeleteButton onClick={() => handleDeleteClick(song)}>
                            {MdDelete({ size: 22 })}
                          </DeleteButton>
                        </>
                      )}
                    </SongActions>
                  </SongItem>
                ))
              )}
            </SongsList>
          </SongsContainer>
          
          <div>
            {renderLearningStats()}
            
            <ComingSoonCard>
              <ComingSoonTitle>Track Your Progress</ComingSoonTitle>
              <ComingSoonText>
                Mark songs as "learned" when you've mastered them. Set difficulty ratings to
                prioritize your practice sessions. Filter the list to focus on what you're
                still learning.
              </ComingSoonText>
            </ComingSoonCard>
          </div>
        </ContentGrid>
      </MainContent>
      
      {/* Video Player Modal */}
      {playingSongId && (
        <VideoModal onClick={() => setPlayingSongId(null)}>
          <VideoContainer onClick={(e) => e.stopPropagation()}>
            <VideoCloseButton onClick={() => setPlayingSongId(null)}>
              {MdClose({ size: 20 })}
            </VideoCloseButton>
            
            {videoLoading && (
              <LoadingOverlay>
                <LoadingSpinner />
                <LoadingText>Loading video...</LoadingText>
              </LoadingOverlay>
            )}
            
            <VideoPlayer 
              ref={videoRef}
              controls
              preload="auto"
              autoPlay
              onEnded={() => setPlayingSongId(null)}
            />
            
            <VideoInfoBar>
              {(() => {
                const playingSong = songs.find(s => s.id === playingSongId);
                return playingSong ? (
                  <>
                    <VideoTitle>{playingSong.song_title}</VideoTitle>
                    <VideoArtist>{playingSong.artist}</VideoArtist>
                  </>
                ) : null;
              })()}
            </VideoInfoBar>
          </VideoContainer>
        </VideoModal>
      )}
      
      {/* Confirm Delete Dialog */}
      {songToDelete && (
        <ConfirmDialog>
          <ConfirmBox>
            <ConfirmTitle>Delete Song</ConfirmTitle>
            <ConfirmText>
              Are you sure you want to delete "{songToDelete.song_title}" by {songToDelete.artist}? 
              This action cannot be undone.
            </ConfirmText>
            <ButtonGroup>
              <CancelButton onClick={cancelDelete} disabled={isDeleting}>
                Cancel
              </CancelButton>
              <ConfirmDeleteButton onClick={confirmDelete} disabled={isDeleting}>
                {isDeleting ? 'Deleting...' : 'Delete'}
              </ConfirmDeleteButton>
            </ButtonGroup>
          </ConfirmBox>
        </ConfirmDialog>
      )}
    </AppLayout>
  );
};

// Add the new styled components for loading overlay
const LoadingOverlay = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  z-index: 5;
`;

const LoadingSpinner = styled.div`
  border: 4px solid rgba(255, 255, 255, 0.3);
  border-left-color: #1DB954;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  animation: spin 1s linear infinite;

  @keyframes spin {
    0% {
      transform: rotate(0deg);
    }
    100% {
      transform: rotate(360deg);
    }
  }
`;

const LoadingText = styled.p`
  color: white;
  margin-top: 15px;
  font-size: 16px;
`;

export default SongsPage; 