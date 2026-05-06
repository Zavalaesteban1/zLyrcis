"""
Tests for Telegram audio download functionality
"""

import unittest
from unittest.mock import Mock, patch, MagicMock, AsyncMock
from pathlib import Path
import tempfile
import os

# Mock the Telethon imports before importing telegram_audio
import sys
sys.modules['telethon'] = MagicMock()
sys.modules['telethon.errors'] = MagicMock()
sys.modules['telethon.tl.types'] = MagicMock()

from core.telegram_audio import (
    download_audio_from_telegram,
    TelegramAuthenticationError,
    TelegramTimeoutError,
    TelegramBotNotFoundError,
    TelegramFileNotReceivedError,
    TelegramConfigurationError,
)


class TestTelegramAudioDownload(unittest.TestCase):
    """Test Telegram audio download functionality"""

    def setUp(self):
        """Set up test fixtures"""
        self.test_spotify_url = "https://open.spotify.com/track/test123"
        self.test_title = "Test Song"
        self.test_artist = "Test Artist"

    @patch('core.telegram_audio.TELETHON_AVAILABLE', False)
    def test_download_when_telethon_not_available(self):
        """Test that function returns None when Telethon is not installed"""
        result = download_audio_from_telegram(
            self.test_spotify_url,
            self.test_title,
            self.test_artist
        )
        self.assertIsNone(result)

    @patch('core.telegram_audio.TELETHON_AVAILABLE', True)
    @patch('core.telegram_audio.settings')
    def test_download_when_not_configured(self, mock_settings):
        """Test that function returns None when Telegram is not configured"""
        # Mock missing configuration
        mock_settings.TELEGRAM_API_ID = None
        mock_settings.TELEGRAM_API_HASH = None
        mock_settings.TELEGRAM_PHONE = None
        
        result = download_audio_from_telegram(
            self.test_spotify_url,
            self.test_title,
            self.test_artist
        )
        self.assertIsNone(result)

    @patch('core.telegram_audio.TELETHON_AVAILABLE', True)
    @patch('core.telegram_audio.settings')
    @patch('core.telegram_audio._download_audio_async')
    @patch('core.telegram_audio.asyncio.new_event_loop')
    def test_successful_download(self, mock_new_loop, mock_async_download, mock_settings):
        """Test successful audio download via Telegram"""
        # Mock configuration
        mock_settings.TELEGRAM_API_ID = '123456'
        mock_settings.TELEGRAM_API_HASH = 'test_hash'
        mock_settings.TELEGRAM_PHONE = '+1234567890'
        mock_settings.TELEGRAM_DEEZER_BOT = '@testbot'
        mock_settings.TELEGRAM_SESSION_FILE = 'test_session'
        mock_settings.TELEGRAM_DOWNLOAD_TIMEOUT = 180
        
        # Mock successful download
        mock_file_path = Path('/tmp/test_audio.mp3')
        mock_async_download.return_value = mock_file_path
        
        # Mock event loop
        mock_loop = MagicMock()
        mock_new_loop.return_value = mock_loop
        mock_loop.run_until_complete.return_value = mock_file_path
        
        result = download_audio_from_telegram(
            self.test_spotify_url,
            self.test_title,
            self.test_artist
        )
        
        self.assertEqual(result, mock_file_path)
        mock_loop.close.assert_called_once()

    @patch('core.telegram_audio.TELETHON_AVAILABLE', True)
    @patch('core.telegram_audio.settings')
    @patch('core.telegram_audio._download_audio_async')
    @patch('core.telegram_audio.asyncio.new_event_loop')
    def test_timeout_error(self, mock_new_loop, mock_async_download, mock_settings):
        """Test handling of timeout errors"""
        # Mock configuration
        mock_settings.TELEGRAM_API_ID = '123456'
        mock_settings.TELEGRAM_API_HASH = 'test_hash'
        mock_settings.TELEGRAM_PHONE = '+1234567890'
        mock_settings.TELEGRAM_DEEZER_BOT = '@testbot'
        mock_settings.TELEGRAM_SESSION_FILE = 'test_session'
        mock_settings.TELEGRAM_DOWNLOAD_TIMEOUT = 180
        
        # Mock timeout
        mock_async_download.side_effect = TelegramTimeoutError("Timeout")
        
        # Mock event loop
        mock_loop = MagicMock()
        mock_new_loop.return_value = mock_loop
        mock_loop.run_until_complete.side_effect = TelegramTimeoutError("Timeout")
        
        with self.assertRaises(TelegramTimeoutError):
            download_audio_from_telegram(
                self.test_spotify_url,
                self.test_title,
                self.test_artist
            )

    def test_custom_timeout(self):
        """Test that custom timeout is respected"""
        with patch('core.telegram_audio.TELETHON_AVAILABLE', True), \
             patch('core.telegram_audio.settings') as mock_settings, \
             patch('core.telegram_audio._download_audio_async') as mock_async, \
             patch('core.telegram_audio.asyncio.new_event_loop') as mock_loop:
            
            mock_settings.TELEGRAM_API_ID = '123456'
            mock_settings.TELEGRAM_API_HASH = 'test_hash'
            mock_settings.TELEGRAM_PHONE = '+1234567890'
            mock_settings.TELEGRAM_DEEZER_BOT = '@testbot'
            mock_settings.TELEGRAM_SESSION_FILE = 'test_session'
            
            mock_file = Path('/tmp/test.mp3')
            mock_async.return_value = mock_file
            
            loop = MagicMock()
            mock_loop.return_value = loop
            loop.run_until_complete.return_value = mock_file
            
            custom_timeout = 300
            download_audio_from_telegram(
                self.test_spotify_url,
                self.test_title,
                self.test_artist,
                timeout=custom_timeout
            )
            
            # Verify async function was called with custom timeout
            mock_async.assert_called_once()
            call_args = mock_async.call_args
            self.assertEqual(call_args[0][3], custom_timeout)


class TestUploadAudioToLibrary(unittest.TestCase):
    """Test upload_audio_to_library helper function"""

    @patch('api.tasks.CLOUDINARY_AVAILABLE', False)
    def test_upload_when_cloudinary_not_available(self):
        """Test that upload returns None when Cloudinary is not available"""
        from api.tasks import upload_audio_to_library
        
        with tempfile.NamedTemporaryFile(suffix='.mp3') as tmp:
            result = upload_audio_to_library(tmp.name, "Test Song", "Test Artist")
            self.assertIsNone(result)

    @patch('api.tasks.CLOUDINARY_AVAILABLE', True)
    @patch('api.tasks.cloudinary.uploader.upload')
    def test_successful_upload(self, mock_upload):
        """Test successful upload to Cloudinary"""
        from api.tasks import upload_audio_to_library
        
        # Mock successful upload
        mock_upload.return_value = {
            'secure_url': 'https://cloudinary.com/audio-library/test.mp3'
        }
        
        with tempfile.NamedTemporaryFile(suffix='.mp3') as tmp:
            result = upload_audio_to_library(tmp.name, "Test Song", "Test Artist")
            
            self.assertIsNotNone(result)
            self.assertIn('cloudinary.com', result)
            
            # Verify upload was called with correct parameters
            mock_upload.assert_called_once()
            call_kwargs = mock_upload.call_args[1]
            self.assertEqual(call_kwargs['resource_type'], 'video')
            self.assertEqual(call_kwargs['folder'], 'audio-library')
            self.assertIn('Test Artist - Test Song', call_kwargs['public_id'])

    @patch('api.tasks.CLOUDINARY_AVAILABLE', True)
    @patch('api.tasks.cloudinary.uploader.upload')
    def test_upload_sanitizes_filenames(self, mock_upload):
        """Test that special characters are removed from filenames"""
        from api.tasks import upload_audio_to_library
        
        mock_upload.return_value = {'secure_url': 'https://test.com/file.mp3'}
        
        with tempfile.NamedTemporaryFile(suffix='.mp3') as tmp:
            # Title and artist with special characters
            upload_audio_to_library(
                tmp.name,
                "Test! Song? (Remix)",
                "Test & Artist"
            )
            
            # Check that special characters were removed
            call_kwargs = mock_upload.call_args[1]
            public_id = call_kwargs['public_id']
            
            # Should not contain special characters
            self.assertNotIn('!', public_id)
            self.assertNotIn('?', public_id)
            self.assertNotIn('(', public_id)
            self.assertNotIn(')', public_id)
            self.assertNotIn('&', public_id)

    @patch('api.tasks.CLOUDINARY_AVAILABLE', True)
    @patch('api.tasks.cloudinary.uploader.upload')
    def test_upload_handles_errors(self, mock_upload):
        """Test that upload errors are handled gracefully"""
        from api.tasks import upload_audio_to_library
        
        # Mock upload failure
        mock_upload.side_effect = Exception("Upload failed")
        
        with tempfile.NamedTemporaryFile(suffix='.mp3') as tmp:
            result = upload_audio_to_library(tmp.name, "Test Song", "Test Artist")
            
            # Should return None on error, not raise exception
            self.assertIsNone(result)


class TestGetAudioIntegration(unittest.TestCase):
    """Integration tests for get_audio with Telegram support"""

    @patch('api.tasks.CLOUDINARY_AVAILABLE', False)
    @patch('api.tasks.TELEGRAM_AVAILABLE', True)
    @patch('api.tasks.download_audio_from_telegram')
    def test_telegram_fallback_when_cloudinary_unavailable(self, mock_telegram_download):
        """Test that Telegram is used when Cloudinary is not available"""
        from api.tasks import get_audio
        
        # Mock Telegram download
        mock_file = Path('/tmp/telegram_audio.mp3')
        mock_telegram_download.return_value = mock_file
        
        with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as tmp:
            try:
                # Create the mock file
                mock_file.exists = lambda: True
                
                with patch('pathlib.Path.exists', return_value=True), \
                     patch('shutil.copy2'):
                    
                    result = get_audio(
                        "Test Song",
                        "Test Artist",
                        tmp.name,
                        spotify_url="https://open.spotify.com/track/test123"
                    )
                    
                    # Should have tried Telegram
                    mock_telegram_download.assert_called_once()
            finally:
                if os.path.exists(tmp.name):
                    os.unlink(tmp.name)

    @patch('api.tasks.TELEGRAM_AVAILABLE', False)
    def test_no_telegram_when_not_available(self):
        """Test that Telegram is skipped when not available"""
        from api.tasks import get_audio
        
        with tempfile.NamedTemporaryFile(suffix='.mp3') as tmp:
            # Should not crash, just skip to local files
            result = get_audio(
                "Test Song",
                "Test Artist",
                tmp.name,
                spotify_url="https://open.spotify.com/track/test123"
            )
            
            # Will be False since no local files either
            self.assertFalse(result)


if __name__ == '__main__':
    unittest.main()
