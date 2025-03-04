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

export default api; 