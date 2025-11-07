#!/usr/bin/env python
"""
Example script demonstrating how to use the AudioProcessor class to find local audio files.

Usage:
    python audio_example.py "Song Title" "Artist Name"
"""
import os
import sys
import tempfile
import logging
from pathlib import Path

# Add the parent directory to the Python path to import the modules
sys.path.insert(0, str(Path(__file__).resolve().parent.parent.parent.parent))

# Configure basic logging
logging.basicConfig(level=logging.INFO, 
                    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')

# Import the AudioProcessor class
from api.lyric_video.audio import AudioProcessor


def main():
    """Example of using AudioProcessor to find and process a local audio file."""
    
    # Get command line arguments
    if len(sys.argv) < 3:
        print(f"Usage: {sys.argv[0]} \"Song Title\" \"Artist Name\"")
        sys.exit(1)
        
    song_title = sys.argv[1]
    artist = sys.argv[2]
    
    print(f"Looking for audio file: '{song_title}' by '{artist}'")
    
    # Create a temporary directory
    with tempfile.TemporaryDirectory() as temp_dir:
        # Initialize the AudioProcessor
        song_info = {
            'title': song_title,
            'artist': artist,
            'duration_ms': 240000  # default 4 minutes
        }
        
        processor = AudioProcessor(song_info, temp_dir)
        
        # Try to find a local audio file
        try:
            local_file = processor._find_local_audio_file()
            
            if local_file:
                print(f"✅ Found matching audio file: {local_file}")
                
                # Get the duration
                duration = processor.get_audio_duration(local_file)
                print(f"   Duration: {duration:.2f} seconds ({duration/60:.2f} minutes)")
                
                # For Pink Floyd's "Time", check if vocals start time is correctly identified
                if "time" in song_title.lower() and "floyd" in artist.lower():
                    if processor.special_case:
                        print(f"   Vocal start time: {processor.special_case['vocal_start']} seconds")
                    else:
                        print("   Warning: Special case not detected for Pink Floyd's Time!")
                
                # Detect vocal start time (for demonstration)
                try:
                    vocal_start = processor.detect_vocal_start()
                    print(f"   Detected vocal start: {vocal_start:.2f} seconds")
                except Exception as e:
                    print(f"   Error detecting vocal start: {e}")
            else:
                print("❌ No matching audio file found in the audio_files directory")
                print("   Please add audio files to the audio_files directory in the project root")
                
        except Exception as e:
            print(f"Error: {e}")
            
    print("\nFinished processing audio file")


if __name__ == "__main__":
    main() 