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
    Array.from(formData.entries()).map(entry => `${entry[0]}: ${entry[1]}`));
  
  try {
    // Using axios directly to have more control over the request
    const response = await api.post('/profile/update_picture/', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    
    return response.data;
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
  // Save token to localStorage
  localStorage.setItem('auth_token', response.data.token);
  return response.data;
};

export const signup = async (credentials: SignupCredentials): Promise<AuthResponse> => {
  const response = await api.post('/auth/signup/', credentials);
  // Save token to localStorage
  localStorage.setItem('auth_token', response.data.token);
  return response.data;
};

export const logout = async (): Promise<void> => {
  await api.post('/auth/logout/');
  // Remove token from localStorage
  localStorage.removeItem('auth_token');
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

export default api; 