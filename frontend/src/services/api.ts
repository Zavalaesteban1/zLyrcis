import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

// Get token from localStorage
const getAuthToken = () => localStorage.getItem('auth_token');

// Create axios instance with auth token interceptor
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add auth token to requests if it exists
api.interceptors.request.use(
  (config) => {
    const token = getAuthToken();
    if (token) {
      config.headers.Authorization = `Token ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export interface VideoJob {
  id: string;
  spotify_url: string;
  song_title: string;
  artist: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  created_at: string;
  updated_at: string;
  video_file: string | null;
  error_message: string | null;
}

export interface VideoStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  video_url: string | null;
  error: string | null;
}

// Profile interfaces
export interface UserProfile {
  id: number;
  name: string;
  role: string;
  email: string;
  last_login: string;
  profile_picture: string | null;
}

// Authentication interfaces
export interface LoginCredentials {
  username: string;
  password: string;
}

export interface GoogleLoginCredentials {
  token_id: string;
}

export interface SignupCredentials {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user_id: number;
  username: string;
  email: string;
  profile: UserProfile | null;
}

// Helper function to clear previous user data from localStorage
const clearPreviousUserData = () => {
  // Get all localStorage keys
  const keys = Object.keys(localStorage);
  
  // Find and remove any song learning data that doesn't belong to the current user
  keys.forEach(key => {
    if (key.includes('song_learning_') && !key.includes('user_')) {
      localStorage.removeItem(key);
    }
  });
};

/**
 * Submit a Spotify link to generate a lyric video
 * @param spotifyUrl The Spotify track URL
 * @returns The created video job
 */
export const submitSpotifyLink = async (spotifyUrl: string): Promise<VideoJob> => {
  const response = await api.post('/videos/', { spotify_url: spotifyUrl });
  return response.data;
};

/**
 * Get the status of a video generation job
 * @param jobId The ID of the video job
 * @returns The status of the video job
 */
export const getVideoStatus = async (jobId: string): Promise<VideoStatusResponse> => {
  const response = await api.get(`/videos/${jobId}/status/`);
  return response.data;
};

/**
 * Get details of a video job
 * @param jobId The ID of the video job
 * @returns The video job details
 */
export const getVideoJob = async (jobId: string): Promise<VideoJob> => {
  const response = await api.get(`/videos/${jobId}/`);
  return response.data;
};

// Profile API functions
export const getUserProfile = async (): Promise<UserProfile> => {
  try {
    // First try to get the user profile using the /profile/me/ endpoint
    const response = await api.get('/profile/me/');
    return response.data;
  } catch (error) {
    console.error('Error fetching profile:', error);
    throw error;
  }
};

export const updateProfilePicture = async (file: File): Promise<UserProfile> => {
  // Create a new FormData instance
  const formData = new FormData();
  formData.append('profile_picture', file);
  
  console.log('FormData contents:', 
    Array.from(formData.entries()).map(entry => `${entry[0]}: ${entry[1] instanceof File ? 
      `File: ${(entry[1] as File).name}, type: ${(entry[1] as File).type}, size: ${(entry[1] as File).size}` : 
      entry[1]}`));
  
  try {
    // Use the fetch API instead of axios
    const token = getAuthToken();
    const url = `${API_URL}/profile/update_picture/`;
    
    console.log('Sending request to:', url);
    console.log('With token:', token ? 'Token present' : 'No token');
    
    const response = await fetch(url, {
      method: 'POST',
      body: formData,
      headers: {
        // Don't set Content-Type for FormData
        'Authorization': token ? `Token ${token}` : ''
      }
    });
    
    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers));
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: 'Failed to parse error response' }));
      console.error('Server error response:', errorData);
      throw new Error(errorData.error || `Server error: ${response.status}`);
    }
    
    const data = await response.json();
    console.log('Response data:', data);
    return data;
  } catch (error) {
    console.error('Error updating profile picture:', error);
    throw error;
  }
};

export const updateProfile = async (profileData: Partial<UserProfile>): Promise<UserProfile> => {
  try {
    const response = await api.patch('/profile/update_profile/', profileData);
    return response.data;
  } catch (error) {
    console.error('Error updating profile:', error);
    throw error;
  }
};

export const changePassword = async (oldPassword: string, newPassword: string): Promise<void> => {
  try {
    await api.post('/profile/change-password/', {
      old_password: oldPassword,
      new_password: newPassword,
    });
  } catch (error) {
    console.error('Error changing password:', error);
    throw error;
  }
};

// Authentication API functions
export const login = async (credentials: LoginCredentials): Promise<AuthResponse> => {
  const response = await api.post('/auth/login/', credentials);
  // Clear any previous user data
  clearPreviousUserData();
  // Save token and user_id to localStorage
  localStorage.setItem('auth_token', response.data.token);
  localStorage.setItem('user_id', response.data.user_id.toString());
  return response.data;
};

export const googleLogin = async (credentials: GoogleLoginCredentials): Promise<AuthResponse> => {
  try {
    const response = await api.post('/auth/google-login/', credentials);
    // Clear any previous user data
    clearPreviousUserData();
    // Save token and user_id to localStorage
    localStorage.setItem('auth_token', response.data.token);
    localStorage.setItem('user_id', response.data.user_id.toString());
    return response.data;
  } catch (error) {
    console.error('Google login error:', error);
    throw error;
  }
};

export const signup = async (credentials: SignupCredentials): Promise<AuthResponse> => {
  const response = await api.post('/auth/signup/', credentials);
  // Clear any previous user data
  clearPreviousUserData();
  // Save token and user_id to localStorage
  localStorage.setItem('auth_token', response.data.token);
  localStorage.setItem('user_id', response.data.user_id.toString());
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout/');
  // Remove token and user_id from localStorage
  localStorage.removeItem('auth_token');
  localStorage.removeItem('user_id');
};

export const getCurrentUser = async (): Promise<AuthResponse> => {
  try {
    const response = await api.get('/auth/user/');
    return response.data;
  } catch (error) {
    // Remove token if invalid
    localStorage.removeItem('auth_token');
    throw error;
  }
};

export const isAuthenticated = (): boolean => {
  return !!getAuthToken();
};

/**
 * Get all completed videos for the current user
 * @returns List of completed video jobs with download URLs
 */
export const getUserVideos = async (): Promise<VideoJob[]> => {
  try {
    const response = await api.get('/videos/?status=completed');
    return response.data;
  } catch (error) {
    console.error('Error fetching user videos:', error);
    throw error;
  }
};

/**
 * Delete a video by ID
 * @param videoId The ID of the video to delete
 */
export const deleteVideo = async (videoId: string): Promise<void> => {
  try {
    await api.delete(`/videos/${videoId}/`);
  } catch (error) {
    console.error('Error deleting video:', error);
    throw error;
  }
};

/**
 * Extract Spotify track ID from a Spotify URL
 * @param spotifyUrl Spotify track URL
 * @returns Extracted track ID or null if not found
 */
export const extractSpotifyTrackId = (spotifyUrl: string): string | null => {
  if (!spotifyUrl) return null;
  
  // Handle multiple Spotify URL formats
  const patterns = [
    /spotify\.com\/track\/([a-zA-Z0-9]+)/, // standard web URL
    /open\.spotify\.com\/track\/([a-zA-Z0-9]+)/, // open.spotify URL
    /spotify:track:([a-zA-Z0-9]+)/ // URI format
  ];
  
  for (const pattern of patterns) {
    const match = spotifyUrl.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  console.warn(`Could not extract track ID from Spotify URL: ${spotifyUrl}`);
  return null;
};

// Spotify API Client ID and Secret
const SPOTIFY_CLIENT_ID = process.env.REACT_APP_SPOTIFY_CLIENT_ID || '';
const SPOTIFY_CLIENT_SECRET = process.env.REACT_APP_SPOTIFY_CLIENT_SECRET || '';

// For debugging - will show in console
console.log('Environment variables loaded:');
console.log('- SPOTIFY_CLIENT_ID available:', !!SPOTIFY_CLIENT_ID);
console.log('- SPOTIFY_CLIENT_SECRET available:', !!SPOTIFY_CLIENT_SECRET);

let spotifyAccessToken: string | null = null;
let tokenExpiryTime: number = 0;

/**
 * Get Spotify access token using Client Credentials flow
 * @returns Spotify access token
 * @throws Error if token cannot be obtained
 */
const getSpotifyAccessToken = async (): Promise<string> => {
  try {
    // Check if we already have a valid token
    if (spotifyAccessToken && Date.now() < tokenExpiryTime) {
      console.log('Using cached Spotify access token');
      return spotifyAccessToken;
    }

    console.log('Requesting new Spotify access token...');
    
    // Make sure we have the credentials
    if (!SPOTIFY_CLIENT_ID || !SPOTIFY_CLIENT_SECRET) {
      throw new Error('Spotify credentials are not configured');
    }
    
    // Request new token using client credentials flow
    const params = new URLSearchParams();
    params.append('grant_type', 'client_credentials');
    
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': 'Basic ' + btoa(`${SPOTIFY_CLIENT_ID}:${SPOTIFY_CLIENT_SECRET}`)
      },
      body: params
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to get Spotify token: ${response.status} ${response.statusText} - ${errorText}`);
    }

    const data = await response.json();

    if (data.access_token) {
      console.log('Successfully obtained Spotify access token');
      spotifyAccessToken = data.access_token;
      // Set token expiry time (subtract 60 seconds to be safe)
      tokenExpiryTime = Date.now() + (data.expires_in - 60) * 1000;
      return data.access_token;
    } else {
      throw new Error('Spotify token response missing access_token');
    }
  } catch (error) {
    console.error('Failed to get Spotify access token:', error);
    throw error;
  }
};

// Add a cache for album cover URLs
const albumCoverCache: Record<string, string | null> = {};

/**
 * Fetch album artwork URL for a Spotify track
 * @param trackId Spotify track ID
 * @returns Album artwork URL or null if not found
 */
export const getSpotifyAlbumArtwork = async (trackId: string): Promise<string | null> => {
  if (!trackId) {
    console.warn('No track ID provided to getSpotifyAlbumArtwork');
    return null;
  }
  
  try {
    // Check cache first
    if (albumCoverCache[trackId] !== undefined) {
      console.log(`Using cached album cover for track ${trackId}`);
      return albumCoverCache[trackId];
    }
    
    // Check if we have proper Spotify credentials
    const credsAvailable = SPOTIFY_CLIENT_ID && 
                           SPOTIFY_CLIENT_SECRET && 
                           SPOTIFY_CLIENT_ID !== 'your_spotify_client_id_here' && 
                           SPOTIFY_CLIENT_SECRET !== 'your_spotify_client_secret_here';
    
    console.log(`Album artwork for track ${trackId}: Credentials available = ${credsAvailable}`);
    
    if (!credsAvailable) {
      console.log('Using mock album artwork (Spotify credentials not set)');
      // Return a mock cover URL based on the trackId for testing
      const mockUrl = `https://picsum.photos/seed/${trackId}/300/300`;
      albumCoverCache[trackId] = mockUrl; // Cache the result
      return mockUrl;
    }
    
    // Try to get album artwork from Spotify API
    try {
      const token = await getSpotifyAccessToken();
      
      // Make direct request to Spotify API
      const response = await fetch(`https://api.spotify.com/v1/tracks/${trackId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        console.error(`Spotify API error for track ${trackId}: ${response.status} ${response.statusText} - ${errorText}`);
        throw new Error(`Spotify API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.album && data.album.images && data.album.images.length > 0) {
        console.log(`Successfully retrieved album artwork for track ${trackId}`);
        const coverUrl = data.album.images[0].url;
        albumCoverCache[trackId] = coverUrl; // Cache the result
        return coverUrl;
      } else {
        console.warn(`No album artwork found in Spotify response for track ${trackId}`);
        // Instead of caching null, we'll use a placeholder
        const placeholderUrl = `https://picsum.photos/seed/${trackId}/300/300`;
        albumCoverCache[trackId] = placeholderUrl;
        return placeholderUrl;
      }
    } catch (err) {
      console.error(`Error with Spotify API call for track ${trackId}:`, err);
      // Always use a fallback image instead of returning null
      const fallbackUrl = `https://picsum.photos/seed/${trackId}/300/300`;
      albumCoverCache[trackId] = fallbackUrl; // Cache the fallback
      return fallbackUrl;
    }
  } catch (error) {
    console.error(`Error fetching Spotify album artwork for track ${trackId}:`, error);
    // Generate a placeholder rather than returning null
    const placeholderUrl = `https://picsum.photos/seed/${trackId}/300/300`;
    return placeholderUrl;
  }
};

export default api; 