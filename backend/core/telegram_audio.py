"""
Telegram Audio Download Module

This module handles automated audio downloads from Telegram using the Telethon library.
It communicates with a Deezer bot to download MP3 files based on Spotify links.
"""

import os
import asyncio
import logging
from pathlib import Path
from typing import Optional, Tuple
from django.conf import settings

try:
    from telethon import TelegramClient, events
    from telethon.sessions import StringSession
    from telethon.errors import (
        SessionPasswordNeededError,
        PhoneNumberInvalidError,
        PhoneCodeInvalidError,
        FloodWaitError,
        AuthKeyUnregisteredError,
    )
    from telethon.tl.types import Message, MessageMediaDocument
    TELETHON_AVAILABLE = True
except ImportError:
    TELETHON_AVAILABLE = False
    # Create dummy classes for type hints when Telethon is not available
    TelegramClient = None
    StringSession = None
    Message = None
    MessageMediaDocument = None
    logging.warning("Telethon not installed. Telegram audio download will not be available.")


logger = logging.getLogger(__name__)


class TelegramAuthenticationError(Exception):
    """Raised when Telegram authentication fails"""
    pass


class TelegramTimeoutError(Exception):
    """Raised when Telegram bot doesn't respond in time"""
    pass


class TelegramBotNotFoundError(Exception):
    """Raised when the Deezer bot username is invalid"""
    pass


class TelegramFileNotReceivedError(Exception):
    """Raised when bot responds but doesn't send an audio file"""
    pass


class TelegramConfigurationError(Exception):
    """Raised when Telegram configuration is missing or invalid"""
    pass


def _get_telegram_config() -> dict:
    """
    Get Telegram configuration from Django settings
    
    Returns:
        dict: Configuration dictionary with api_id, api_hash, phone, bot_username, etc.
    
    Raises:
        TelegramConfigurationError: If required configuration is missing
    """
    if not TELETHON_AVAILABLE:
        raise TelegramConfigurationError("Telethon library not installed")
    
    api_id = getattr(settings, 'TELEGRAM_API_ID', None)
    api_hash = getattr(settings, 'TELEGRAM_API_HASH', None)
    phone = getattr(settings, 'TELEGRAM_PHONE', None)
    bot_username = getattr(settings, 'TELEGRAM_DEEZER_BOT', '@deezload2bot')
    session_file = getattr(settings, 'TELEGRAM_SESSION_FILE', 'telegram_session')
    download_timeout = getattr(settings, 'TELEGRAM_DOWNLOAD_TIMEOUT', 180)
    
    if not api_id or not api_hash:
        raise TelegramConfigurationError(
            "TELEGRAM_API_ID and TELEGRAM_API_HASH must be set in settings. "
            "Get them from https://my.telegram.org/apps"
        )
    
    if not phone:
        raise TelegramConfigurationError(
            "TELEGRAM_PHONE must be set in settings (format: +1234567890)"
        )
    
    # Ensure bot username starts with @
    if not bot_username.startswith('@'):
        bot_username = f'@{bot_username}'
    
    return {
        'api_id': int(api_id),
        'api_hash': api_hash,
        'phone': phone,
        'bot_username': bot_username,
        'session_file': session_file,
        'download_timeout': int(download_timeout),
    }


async def _init_telegram_client():
    """
    Initialize and authenticate Telegram client
    
    Returns:
        TelegramClient: Authenticated Telegram client (if available)
    
    Raises:
        TelegramAuthenticationError: If authentication fails
        TelegramConfigurationError: If configuration is invalid
    """
    config = _get_telegram_config()
    
    # Check if we have a session string (production) or file (development)
    session_string = os.getenv('TELEGRAM_SESSION_STRING')
    
    if session_string:
        # Production: Use StringSession from environment variable
        logger.info("Using StringSession from environment variable")
        session = StringSession(session_string)
    else:
        # Development: Use file-based session
        logger.info("Using file-based session")
        session_path = Path(__file__).parent.parent / config['session_file']
        session = str(session_path)
    
    client = TelegramClient(
        session,
        config['api_id'],
        config['api_hash']
    )
    
    try:
        await client.connect()
        
        # Check if already authorized
        if not await client.is_user_authorized():
            logger.info("Telegram client not authorized, attempting phone authentication...")
            
            # This will only happen during initial setup or if session expired
            # For production, session should already be established via setup command
            raise TelegramAuthenticationError(
                "Telegram session not authorized. Please run 'python manage.py setup_telegram' first or set TELEGRAM_SESSION_STRING."
            )
        
        logger.info("Telegram client authenticated successfully")
        return client
        
    except AuthKeyUnregisteredError:
        raise TelegramAuthenticationError(
            "Telegram session expired or invalid. Please run 'python manage.py setup_telegram' again or regenerate SESSION_STRING."
        )
    except Exception as e:
        logger.error(f"Failed to initialize Telegram client: {e}")
        raise TelegramAuthenticationError(f"Failed to connect to Telegram: {str(e)}")


async def _send_to_deezer_bot(client, spotify_url: str, bot_username: str, timeout: int) -> Optional[Path]:
    """
    Send Spotify link to Deezer bot and wait for audio file response
    
    Args:
        client: Authenticated Telegram client
        spotify_url: Spotify track URL
        bot_username: Deezer bot username (e.g., @deezload2bot)
        timeout: Maximum wait time in seconds
    
    Returns:
        Path to downloaded MP3 file, or None if failed
    
    Raises:
        TelegramTimeoutError: If bot doesn't respond in time
        TelegramBotNotFoundError: If bot username is invalid
        TelegramFileNotReceivedError: If bot responds but doesn't send audio
    """
    logger.info(f"Sending Spotify link to {bot_username}: {spotify_url}")
    
    try:
        # Get the bot entity
        try:
            bot_entity = await client.get_entity(bot_username)
        except ValueError as e:
            raise TelegramBotNotFoundError(f"Bot {bot_username} not found: {str(e)}")
        
        # Create a temporary directory for the download
        temp_dir = Path(settings.MEDIA_ROOT) / 'telegram_downloads'
        temp_dir.mkdir(parents=True, exist_ok=True)
        
        # Variable to store the downloaded file path
        downloaded_file = None
        download_event = asyncio.Event()
        
        # Handler for incoming messages from the bot
        @client.on(events.NewMessage(from_users=bot_entity))
        async def message_handler(event):
            nonlocal downloaded_file
            
            message = event.message
            
            # Check if message contains an audio file
            if message.media and hasattr(message.media, 'document'):
                document = message.media.document
                
                # Check if it's an audio file (MP3)
                is_audio = False
                filename = None
                
                for attribute in document.attributes:
                    # Check for audio attributes
                    if hasattr(attribute, 'duration'):
                        is_audio = True
                    # Get filename
                    if hasattr(attribute, 'file_name'):
                        filename = attribute.file_name
                
                if is_audio or (filename and filename.endswith('.mp3')):
                    logger.info(f"Receiving audio file from bot: {filename or 'unknown'}")
                    
                    # Download the file
                    try:
                        file_path = await message.download_media(file=str(temp_dir))
                        if file_path:
                            downloaded_file = Path(file_path)
                            logger.info(f"Downloaded audio to: {downloaded_file}")
                            download_event.set()
                    except Exception as e:
                        logger.error(f"Error downloading file: {e}")
        
        # Send the Spotify link to the bot
        try:
            await client.send_message(bot_entity, spotify_url)
            logger.info(f"Sent message to {bot_username}")
        except FloodWaitError as e:
            logger.warning(f"Rate limited by Telegram, need to wait {e.seconds} seconds")
            raise TelegramTimeoutError(f"Rate limited by Telegram: wait {e.seconds}s")
        
        # Wait for response with timeout
        try:
            await asyncio.wait_for(download_event.wait(), timeout=timeout)
        except asyncio.TimeoutError:
            logger.error(f"Timeout waiting for response from {bot_username}")
            raise TelegramTimeoutError(
                f"Bot {bot_username} did not respond within {timeout} seconds"
            )
        
        # Remove the handler
        client.remove_event_handler(message_handler)
        
        if downloaded_file and downloaded_file.exists():
            return downloaded_file
        else:
            raise TelegramFileNotReceivedError(
                f"Bot responded but did not send an audio file"
            )
    
    except (TelegramTimeoutError, TelegramBotNotFoundError, TelegramFileNotReceivedError):
        raise
    except Exception as e:
        logger.error(f"Unexpected error in _send_to_deezer_bot: {e}", exc_info=True)
        raise


async def _download_audio_async(spotify_url: str, title: str, artist: str, timeout: int = 180) -> Optional[Path]:
    """
    Async implementation of audio download from Telegram
    
    Args:
        spotify_url: Spotify track URL
        title: Song title (for logging)
        artist: Artist name (for logging)
        timeout: Download timeout in seconds
    
    Returns:
        Path to downloaded MP3 file, or None if failed
    """
    client = None
    try:
        config = _get_telegram_config()
        
        logger.info(f"Attempting Telegram download for: {artist} - {title}")
        
        # Initialize client
        client = await _init_telegram_client()
        
        # Send to bot and get file
        file_path = await _send_to_deezer_bot(
            client,
            spotify_url,
            config['bot_username'],
            timeout
        )
        
        if file_path:
            logger.info(f"Successfully downloaded via Telegram: {file_path}")
            return file_path
        
        return None
    
    finally:
        if client:
            await client.disconnect()


def download_audio_from_telegram(spotify_url: str, title: str, artist: str, timeout: int = None) -> Optional[Path]:
    """
    Download audio from Telegram Deezer bot (synchronous wrapper)
    
    This is the main entry point for downloading audio files via Telegram.
    It sends a Spotify link to a Telegram bot that downloads the track from Deezer.
    
    Args:
        spotify_url: Full Spotify track URL (e.g., https://open.spotify.com/track/...)
        title: Song title (for logging and fallback)
        artist: Artist name (for logging and fallback)
        timeout: Maximum wait time in seconds (default: from settings or 180)
    
    Returns:
        Path: Path to downloaded MP3 file if successful
        None: If download fails or Telegram is not configured
    
    Raises:
        TelegramConfigurationError: If Telegram is not properly configured
        TelegramAuthenticationError: If authentication fails
        TelegramTimeoutError: If bot doesn't respond in time
        TelegramBotNotFoundError: If bot username is invalid
        TelegramFileNotReceivedError: If bot responds but doesn't send audio
    
    Example:
        >>> file_path = download_audio_from_telegram(
        ...     "https://open.spotify.com/track/abc123",
        ...     "Song Title",
        ...     "Artist Name"
        ... )
        >>> if file_path:
        ...     print(f"Downloaded to: {file_path}")
    """
    if not TELETHON_AVAILABLE:
        logger.warning("Telethon not available, skipping Telegram download")
        return None
    
    try:
        config = _get_telegram_config()
        if timeout is None:
            timeout = config['download_timeout']
        
        # Run the async function in a new event loop
        # This is safe in Celery tasks which run in separate threads
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)
        try:
            result = loop.run_until_complete(
                _download_audio_async(spotify_url, title, artist, timeout)
            )
            return result
        finally:
            loop.close()
    
    except TelegramConfigurationError as e:
        logger.warning(f"Telegram not configured: {e}")
        return None
    except (TelegramAuthenticationError, TelegramTimeoutError, 
            TelegramBotNotFoundError, TelegramFileNotReceivedError) as e:
        logger.error(f"Telegram download failed: {e}")
        raise
    except Exception as e:
        logger.error(f"Unexpected error in Telegram download: {e}", exc_info=True)
        return None


async def test_telegram_setup(test_spotify_url: str = None) -> bool:
    """
    Test Telegram connection and bot interaction
    
    Args:
        test_spotify_url: Optional Spotify URL to test download
    
    Returns:
        True if setup is working, False otherwise
    """
    client = None
    try:
        print("Testing Telegram configuration...")
        config = _get_telegram_config()
        print(f"✓ Configuration loaded")
        print(f"  Bot: {config['bot_username']}")
        print(f"  Timeout: {config['download_timeout']}s")
        
        print("\nConnecting to Telegram...")
        client = await _init_telegram_client()
        print("✓ Connected and authenticated")
        
        print(f"\nChecking bot {config['bot_username']}...")
        try:
            bot_entity = await client.get_entity(config['bot_username'])
            print(f"✓ Bot found: {bot_entity.first_name}")
        except ValueError:
            print(f"✗ Bot {config['bot_username']} not found")
            return False
        
        if test_spotify_url:
            print(f"\nTesting download with: {test_spotify_url}")
            file_path = await _send_to_deezer_bot(
                client,
                test_spotify_url,
                config['bot_username'],
                config['download_timeout']
            )
            if file_path:
                print(f"✓ Download successful: {file_path}")
                print(f"  File size: {file_path.stat().st_size / 1024 / 1024:.2f} MB")
                return True
            else:
                print("✗ Download failed")
                return False
        
        print("\n✓ All checks passed")
        return True
    
    except Exception as e:
        print(f"\n✗ Test failed: {e}")
        return False
    finally:
        if client:
            await client.disconnect()
