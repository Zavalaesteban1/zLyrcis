import os
import sys

# Add backend directory to sys.path
sys.path.insert(0, os.path.abspath(os.path.dirname(__file__)))

from core.synchronization import AdvancedLyricSynchronizer
from api.tasks import create_animated_subtitles

def test_synchronization_and_ass():
    print("Testing _match_lyrics_to_words...")
    
    # Mock deeply nested synchronizer
    sync = AdvancedLyricSynchronizer("dummy.mp3")
    
    # Dummy whisper response words
    words = [
        {"word": "Hello", "start": 0.0, "end": 0.5, "confidence": 0.9},
        {"word": "world", "start": 0.6, "end": 1.2, "confidence": 0.9},
        {"word": "this", "start": 1.5, "end": 1.8, "confidence": 0.9},
        {"word": "is", "start": 1.8, "end": 2.0, "confidence": 0.9},
        {"word": "a", "start": 2.0, "end": 2.1, "confidence": 0.9},
        {"word": "test", "start": 2.1, "end": 3.0, "confidence": 0.9},
    ]
    
    lyrics_lines = [
        "Hello world",
        "This is a test"
    ]
    
    # Run our modified word matching logic
    synced = sync._match_lyrics_to_words(lyrics_lines, words)
    
    for s in synced:
        print(f"Line: '{s.text}' (From {s.start_time} to {s.end_time})")
        print(f"  Words: {s.words}")

    print("\n-------------------------------\n")
    print("Testing ASS generation with the synced lyrics...")

    # Convert to dictionary format expected by tasks.py
    result = []
    for lyric in synced:
        result.append({
            "text": lyric.text,
            "start_time": lyric.start_time,
            "end_time": lyric.end_time,
            "duration": lyric.duration,
            "confidence": lyric.confidence,
            "method": lyric.method,
            "words": lyric.words if hasattr(lyric, 'words') else []
        })

    song_info = {"title": "Test Title", "artist": "Test Artist"}
    subtitle_path = "test_output.ass"
    
    create_animated_subtitles(result, song_info, subtitle_path)
    print(f"Created ASS file: {subtitle_path}")
    
    with open(subtitle_path, 'r') as f:
        print(f.read())

if __name__ == "__main__":
    test_synchronization_and_ass()
