import pytest

def test_musixmatch_mock(mock_musixmatch_response):
    """Test handling of Musixmatch API data."""
    assert mock_musixmatch_response['message']['header']['status_code'] == 200

def test_whisper_mock(mock_whisper_response):
    """Test handling of Groq Whisper API data."""
    assert len(mock_whisper_response['segments']) == 2
