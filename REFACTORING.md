# Refactoring Documentation

## Overview

This project underwent a major refactoring to split a large monolithic `tasks.py` file (over 3000 lines) into multiple modular components. This document explains what was done and how to continue the refactoring process if needed.

## Original Structure

The original codebase had a single large `tasks.py` file with all logic for:
- Downloading audio
- Finding local audio files
- Processing lyrics
- Synchronizing lyrics with audio
- Generating videos
- Special case handling
- Utility functions

## New Modular Structure

The code has been refactored into the following modules:

```
backend/api/lyric_video/
├── __init__.py
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

## Key Components

1. **audio.py**: 
   - `AudioProcessor` class for handling audio operations
   - Finding local audio files
   - Downloading audio from various sources
   - Detecting vocal start times

2. **lyrics.py**:
   - Fetching lyrics from Genius
   - Cleaning and processing lyrics

3. **synchronization.py**:
   - `LyricSynchronizer` class for timing lyrics
   - Multiple synchronization methods

4. **video.py**:
   - `VideoGenerator` class for creating videos
   - Subtitle generation
   - Background creation

5. **spotify.py**:
   - Interacting with Spotify API
   - Getting track information

6. **config/special_cases.py**:
   - Handling special case songs with custom settings

7. **tasks.py**:
   - Main orchestration logic
   - Job management

## Original File Preservation

The original large `tasks.py` file has been preserved as `original_tasks.py` in the project root for reference. Use this file if you need to check for any functionality that may not have been fully migrated to the new modular structure.

## Missing Functions Analyzer

A helper script `extract_missing_functions.py` is included to identify potential functions from the original file that might need to be transferred to the new modules:

```bash
python extract_missing_functions.py original_tasks.py backend/api/lyric_video/
```

## Next Steps in Refactoring

Some additional refactoring steps that could be taken:

1. Move more synchronization methods from the original file to `synchronization.py`
2. Enhance the utility methods in `utils.py`
3. Add more example scripts to `examples/`
4. Expand test coverage for each module
5. Add type hints to function signatures

## Integration Points

The main entry point `generate_lyric_video` in `backend/api/tasks.py` has been updated to use the new modular structure while maintaining backward compatibility. 