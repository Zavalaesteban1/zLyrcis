import unittest
import os
import tempfile
import shutil
from unittest.mock import patch, MagicMock

from django.test import TestCase
from api.lyric_video.audio import AudioProcessor
from api.lyric_video.exceptions import AudioDownloadError


class AudioProcessorTest(TestCase):
    """Test cases for the AudioProcessor class."""

    def setUp(self):
        """Set up test environment."""
        self.temp_dir = tempfile.mkdtemp()
        self.song_info = {
            'title': 'Test Song',
            'artist': 'Test Artist',
            'duration_ms': 240000
        }
        self.audio_processor = AudioProcessor(self.song_info, self.temp_dir)

    def tearDown(self):
        """Clean up test environment."""
        shutil.rmtree(self.temp_dir)

    def test_normalize_string(self):
        """Test the normalize_string method."""
        # Test with normal string
        self.assertEqual(
            AudioProcessor.normalize_string("Hello, World!"),
            "hello world"
        )
        
        # Test with empty string
        self.assertEqual(AudioProcessor.normalize_string(""), "")
        
        # Test with None
        self.assertEqual(AudioProcessor.normalize_string(None), "")

    def test_string_similarity(self):
        """Test the string_similarity method."""
        # Test exact match
        self.assertEqual(
            AudioProcessor.string_similarity("test", "test"),
            1.0
        )
        
        # Test similar strings
        self.assertGreater(
            AudioProcessor.string_similarity("test", "testing"),
            0.5
        )
        
        # Test different strings
        self.assertLess(
            AudioProcessor.string_similarity("apple", "orange"),
            0.5
        )

    @patch('api.lyric_video.audio.os.path.exists')
    @patch('api.lyric_video.audio.os.walk')
    def test_find_local_audio_file_not_found(self, mock_walk, mock_exists):
        """Test _find_local_audio_file when no files are found."""
        # Mock audio directory doesn't exist
        mock_exists.return_value = False
        
        # Call the method
        result = self.audio_processor._find_local_audio_file()
        
        # Check results
        self.assertIsNone(result)
        mock_walk.assert_not_called()

    @patch('api.lyric_video.audio.os.path.exists')
    @patch('api.lyric_video.audio.os.walk')
    @patch('api.lyric_video.audio.shutil.copy2')
    def test_find_local_audio_file_found(self, mock_copy2, mock_walk, mock_exists):
        """Test _find_local_audio_file when a matching file is found."""
        # Mock audio directory exists
        mock_exists.return_value = True
        
        # Mock finding a matching file
        mock_walk.return_value = [
            ('/fake/path', [], ['test song - test artist.mp3', 'other.mp3'])
        ]
        
        # Mock successful copy
        mock_copy2.return_value = None
        
        # Mock get_audio_duration to avoid file operation
        with patch.object(AudioProcessor, 'get_audio_duration', return_value=240.0):
            # Call the method
            result = self.audio_processor._find_local_audio_file()
            
            # Check results
            self.assertEqual(result, os.path.join(self.temp_dir, 'audio.mp3'))
            mock_copy2.assert_called_once()

    @patch('api.lyric_video.audio.subprocess.run')
    def test_get_audio_duration(self, mock_run):
        """Test get_audio_duration method."""
        # Mock subprocess result
        mock_process = MagicMock()
        mock_process.stdout = "240.5\n"
        mock_run.return_value = mock_process
        
        # Call the method
        duration = AudioProcessor.get_audio_duration("fake_path.mp3")
        
        # Check results
        self.assertEqual(duration, 240.5)
        mock_run.assert_called_once()

    @patch('api.lyric_video.audio.subprocess.run')
    def test_create_silent_audio(self, mock_run):
        """Test _create_silent_audio method."""
        # Mock subprocess result and file exists
        mock_run.return_value = None
        
        with patch('os.path.exists', return_value=True):
            # Call the method
            result = self.audio_processor._create_silent_audio()
            
            # Check results
            self.assertTrue(result)
            mock_run.assert_called_once()


if __name__ == '__main__':
    unittest.main()
