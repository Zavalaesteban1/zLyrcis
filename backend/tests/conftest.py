import pytest

pytest_plugins = []

@pytest.fixture
def mock_musixmatch_response():
    return {
        "message": {
            "header": {"status_code": 200},
            "body": {
                "lyrics": {
                    "lyrics_body": "Hello world\nThis is a test\n..."
                }
            }
        }
    }

@pytest.fixture
def mock_whisper_response():
    return {
        "segments": [
            {"start": 0.0, "end": 2.0, "text": "Hello world"},
            {"start": 2.0, "end": 4.0, "text": "This is a test"}
        ]
    }
