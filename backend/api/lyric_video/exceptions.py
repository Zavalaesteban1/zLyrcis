"""
Custom exceptions for the lyric video generator.
"""

class LyricVideoError(Exception):
    """Base exception for all lyric video generation errors."""
    pass

class SpotifyError(LyricVideoError):
    """Exception raised for errors related to Spotify API."""
    pass

class LyricsNotFoundError(LyricVideoError):
    """Exception raised when lyrics cannot be found for a song."""
    pass

class AudioDownloadError(LyricVideoError):
    """Exception raised when audio cannot be downloaded or processed."""
    pass

class SynchronizationError(LyricVideoError):
    """Exception raised when lyrics cannot be synchronized with audio."""
    pass

class VideoGenerationError(LyricVideoError):
    """Exception raised when the video cannot be generated."""
    pass
