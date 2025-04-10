"""
Lyric video generation module for creating synchronized lyric videos from Spotify tracks.

This package provides a complete solution for generating lyric videos by:
1. Taking a Spotify URL as input
2. Fetching track information from Spotify
3. Finding lyrics from Genius (or alternative sources)
4. Downloading/locating audio for the track
5. Analyzing the audio to detect vocal start times
6. Synchronizing lyrics with the audio
7. Creating a video with timed lyric subtitles

Components:
- tasks.py: Main Celery task orchestration
- spotify.py: Spotify API interactions
- lyrics.py: Lyrics retrieval and processing
- audio.py: Audio handling functions
- synchronization.py: Lyrics timing algorithms
- video.py: Video generation
- exceptions.py: Custom exceptions
- config/: Configuration files
"""

__version__ = '1.0.0'