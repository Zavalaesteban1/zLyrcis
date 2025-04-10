"""
Functions for interacting with the Spotify API.
"""
import re
import os
import traceback
import logging
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from django.conf import settings
from .exceptions import SpotifyError
from .audio import estimate_vocal_start_time

logger = logging.getLogger(__name__)

def get_spotify_client():
    """
    Create and return a Spotify client using credentials from settings.
    
    Returns:
        spotipy.Spotify: Authenticated Spotify client
    
    Raises:
        SpotifyError: If Spotify credentials are missing or invalid
    """
    try:
        client_credentials_manager = SpotifyClientCredentials(
            client_id=settings.SPOTIFY_CLIENT_ID,
            client_secret=settings.SPOTIFY_CLIENT_SECRET
        )
        return spotipy.Spotify(client_credentials_manager=client_credentials_manager)
    except Exception as e:
        logger.error(f"Failed to initialize Spotify client: {e}")
        raise SpotifyError(f"Could not initialize Spotify client: {e}")

def extract_spotify_track_id(spotify_url):
    """
    Extract track ID from a Spotify URL.
    
    Args:
        spotify_url (str): Spotify track URL
        
    Returns:
        str: Spotify track ID
        
    Raises:
        SpotifyError: If track ID cannot be extracted
    """
    pattern = r'(?:https?:\/\/)?(?:open\.)?spotify\.com\/track\/([a-zA-Z0-9]+)'
    match = re.search(pattern, spotify_url)
    
    if match:
        return match.group(1)
    
    logger.error(f"Invalid Spotify URL format: {spotify_url}")
    raise SpotifyError(f"Invalid Spotify URL format: {spotify_url}")

def get_spotify_track_info(track_id):
    """Get track information from Spotify API"""
    try:
        # Get credentials from Django settings
        client_id = settings.SPOTIFY_CLIENT_ID
        client_secret = settings.SPOTIFY_CLIENT_SECRET

        # Try to get credentials from environment directly if not in settings
        if not client_id:
            client_id = os.environ.get('SPOTIFY_CLIENT_ID')
            print(
                f"Using SPOTIFY_CLIENT_ID from environment: {'Found' if client_id else 'Not found'}")

        if not client_secret:
            client_secret = os.environ.get('SPOTIFY_CLIENT_SECRET')
            print(
                f"Using SPOTIFY_CLIENT_SECRET from environment: {'Found' if client_secret else 'Not found'}")

        # Debug output credentials information (first few chars only for security)
        if client_id:
            safe_id = client_id[:4] + \
                '...' if len(client_id) > 4 else client_id
            print(f"Using Spotify client ID: {safe_id}")

        # Check if credentials exist
        if not client_id or not client_secret:
            raise ValueError(
                "Spotify API credentials not configured correctly")

        # Set the credentials explicitly for Spotipy
        os.environ['SPOTIPY_CLIENT_ID'] = client_id
        os.environ['SPOTIPY_CLIENT_SECRET'] = client_secret

        # Create client credentials manager with explicit values
        client_credentials_manager = SpotifyClientCredentials(
            client_id=client_id,
            client_secret=client_secret
        )
        sp = spotipy.Spotify(
            client_credentials_manager=client_credentials_manager)

        # Get basic track info
        track = sp.track(track_id)

        # Try to get audio analysis, but handle errors gracefully
        audio_analysis = None
        try:
            audio_analysis = sp.audio_analysis(track_id)
            print("Successfully retrieved audio analysis from Spotify")
        except spotipy.exceptions.SpotifyException as e:
            print(f"Warning: Could not fetch audio analysis: {e}")
            # Create a placeholder audio analysis structure
            audio_analysis = {
                "sections": [],
                "segments": []
            }

        # Get audio features for additional information
        audio_features = None
        try:
            audio_features = sp.audio_features(track_id)[0]
        except spotipy.exceptions.SpotifyException as e:
            print(f"Warning: Could not fetch audio features: {e}")
            audio_features = {}

        # Estimate vocal start time from sections and segments
        vocal_start_time = estimate_vocal_start_time(
            audio_analysis, audio_features)

        print(f"Estimated vocal start time: {vocal_start_time} seconds")

        return {
            'title': track['name'],
            'artist': track['artists'][0]['name'],
            'album': track['album']['name'],
            'duration_ms': track['duration_ms'],
            'album_art_url': track['album']['images'][0]['url'] if track['album']['images'] else None,
            'vocal_start_time': vocal_start_time
        }
    except spotipy.exceptions.SpotifyException as e:
        print(f"Spotify API error: {str(e)}")
        raise
    except Exception as e:
        print(f"Error in get_spotify_track_info: {str(e)}")
        traceback.print_exc()
        raise
        
    """
    Get track information from Spotify.
    
    Args:
        track_id (str): Spotify track ID
        
    Returns:
        dict: Track information including title, artist, duration, etc.
        
    Raises:
        SpotifyError: If track information cannot be retrieved
    """
    try:
        spotify = get_spotify_client()
        track = spotify.track(track_id)
        
        return {
            'title': track['name'],
            'artist': track['artists'][0]['name'],
            'album': track['album']['name'],
            'album_art_url': track['album']['images'][0]['url'] if track['album']['images'] else None,
            'duration_ms': track['duration_ms'],
            'preview_url': track['preview_url'],
            'spotify_url': track['external_urls']['spotify']
        }
    except Exception as e:
        logger.error(f"Failed to get track info for track_id {track_id}: {e}")
        raise SpotifyError(f"Failed to get track info: {e}")

def get_spotify_album_artwork(track_id):
    """
    Get album artwork URL for a Spotify track.
    
    Args:
        track_id (str): Spotify track ID
        
    Returns:
        str: URL to album artwork
        
    Raises:
        SpotifyError: If album artwork cannot be retrieved
    """
    try:
        track_info = get_spotify_track_info(track_id)
        return track_info.get('album_art_url')
    except Exception as e:
        logger.error(f"Failed to get album artwork for track_id {track_id}: {e}")
        raise SpotifyError(f"Failed to get album artwork: {e}")
