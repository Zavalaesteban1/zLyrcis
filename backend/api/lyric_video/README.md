# Lyric Video Generator Module

This module contains the core functionality for generating lyric videos from Spotify tracks.

## Directory Structure

```
lyric_video/
├── __init__.py        - Package initialization
├── audio.py           - Audio processing and file handling
├── config/
│   ├── __init__.py
│   └── special_cases.py - Configuration for special case songs
├── exceptions.py      - Custom exception classes
├── examples/
│   └── audio_example.py - Example usage of the audio module
├── lyrics.py          - Lyrics fetching and processing
├── spotify.py         - Spotify API interaction
├── synchronization.py - Lyrics-to-audio synchronization
├── tasks.py           - Main task orchestration
├── utils.py           - Utility functions
└── video.py           - Video generation
```

## Audio Processing

The `audio.py` module provides a robust solution for handling audio files in the lyric video generation process:

- Finding and using local audio files
- Downloading audio from various sources (Spotify, YouTube)
- Detecting vocal start times
- Handling special cases for songs with unusual structures

### Usage Example

```python
import tempfile
from api.lyric_video.audio import AudioProcessor

# Create a temporary directory for processing
with tempfile.TemporaryDirectory() as temp_dir:
    # Initialize the AudioProcessor with song information
    song_info = {
        'title': 'Time',
        'artist': 'Pink Floyd',
        'duration_ms': 413000  # 6:53
    }
    
    processor = AudioProcessor(song_info, temp_dir)
    
    # Find a local audio file
    audio_path = processor._find_local_audio_file()
    if audio_path:
        print(f"Found local audio file: {audio_path}")
        
        # Get the duration
        duration = processor.get_audio_duration(audio_path)
        print(f"Duration: {duration:.2f} seconds")
        
        # Detect vocal start time
        vocal_start = processor.detect_vocal_start()
        print(f"Vocals start at: {vocal_start:.2f} seconds")
```

### Special Case Handling

The module includes special handling for songs with unusual structures, such as:

1. **Pink Floyd's "Time"** - Vocals start at 2:19 (139.0 seconds)
2. **Pink Floyd's "Breathe"** - Vocals start at 1:21 (81.0 seconds)
3. **Larry June's "Generation"** - Vocals start at 0:20.5 (20.5 seconds)

Additional special cases can be defined in `config/special_cases.py`.

## Command Line Example

You can test the audio file finding functionality with the included example script:

```bash
# From the backend directory
python -m api.lyric_video.examples.audio_example "Time" "Pink Floyd"
```

This will attempt to find a local audio file for Pink Floyd's "Time" and display information about it. 