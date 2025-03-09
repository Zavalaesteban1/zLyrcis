import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

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
    const response = await api.get('/profile/');
    return response.data;
  } catch (error) {
    // For demo purposes, return mock data if the API is not available
    console.error('Error fetching profile:', error);
    return {
      id: 1,
      name: "John Doe",
      role: "Premium User",
      email: "john.doe@example.com",
      last_login: "2023-11-15 14:30:22",
      profile_picture: null
    };
  }
};

export const updateProfilePicture = async (file: File): Promise<UserProfile> => {
  const formData = new FormData();
  formData.append('profile_picture', file);
  
  try {
    const response = await api.post('/profile/update-picture/', formData, {
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
    const response = await api.patch('/profile/update/', profileData);
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

export default api; 