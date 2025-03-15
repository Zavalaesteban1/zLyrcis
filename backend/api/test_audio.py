"""
Test script for audio functions
"""

import os
import sys
import tempfile
import django

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lyric_video_project.settings')
django.setup()

from api.tasks import get_youtube_audio, get_deezer_audio, generate_synthetic_music

def test_audio_functions():
    """Test the audio functions"""
    print("Testing audio functions...")
    
    # Create a temporary file
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
        temp_path = temp_file.name
    
    try:
        # Test YouTube audio download
        print("\n1. Testing YouTube audio download...")
        youtube_result = get_youtube_audio('Shape of You', 'Ed Sheeran', temp_path)
        print(f"YouTube result: {youtube_result}")
        if youtube_result:
            print(f"File size: {os.path.getsize(youtube_result)} bytes")
        
        # Test Deezer audio download
        print("\n2. Testing Deezer audio download...")
        deezer_result = get_deezer_audio('Shape of You', 'Ed Sheeran', temp_path)
        print(f"Deezer result: {deezer_result}")
        if deezer_result:
            print(f"File size: {os.path.getsize(deezer_result)} bytes")
        
        # Test synthetic music generation
        print("\n3. Testing synthetic music generation...")
        synthetic_result = generate_synthetic_music(30, temp_path)
        print(f"Synthetic result: {synthetic_result}")
        if synthetic_result:
            print(f"File size: {os.path.getsize(synthetic_result)} bytes")
        
        print("\nAll tests completed!")
    
    finally:
        # Clean up
        if os.path.exists(temp_path):
            os.unlink(temp_path)

if __name__ == "__main__":
    test_audio_functions() 