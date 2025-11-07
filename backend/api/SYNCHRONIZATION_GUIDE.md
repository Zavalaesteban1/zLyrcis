# Advanced Lyrics Synchronization Guide

## Overview

The advanced synchronization system addresses the core problem of accurately matching lyrics to audio timing. Instead of relying on simple time-based distribution, it uses multiple sophisticated approaches:

1. **Audio Analysis**: Analyzes the audio to detect vocal segments, beats, and energy patterns
2. **Enhanced Deepgram Integration**: Uses speech-to-text with improved matching algorithms
3. **Machine Learning Features**: Employs spectral analysis and onset detection
4. **Hybrid Fallback**: Combines multiple methods for maximum reliability

## Problem Analysis

### Original Issues
- **Poor timing accuracy**: Lyrics appeared at wrong times
- **No audio awareness**: Ignored actual vocal patterns
- **Fixed intro estimation**: Used percentage-based guesses
- **Simple text matching**: Basic string similarity was unreliable

### Solution Approach
- **Multi-method synchronization**: Try advanced → Deepgram → basic fallback
- **Audio feature analysis**: Detect actual vocal segments and beats
- **Configurable parameters**: Fine-tune for different genres and songs
- **Quality validation**: Confidence scoring and timing validation

## Installation

### 1. Install Dependencies

```bash
# Core audio analysis library
pip install librosa>=0.9.0

# Additional scientific computing (if not already installed)
pip install numpy>=1.21.0 scipy>=1.7.0 scikit-learn>=1.0.0

# Enhanced Deepgram (if using)
pip install deepgram-sdk>=2.3.0
```

### 2. System Dependencies (Ubuntu/Debian)

```bash
# Audio processing libraries
sudo apt-get install libsndfile1-dev libasound2-dev portaudio19-dev

# FFmpeg with audio codecs
sudo apt-get install ffmpeg libavcodec-extra
```

### 3. Environment Variables

Add to your `.env` file:

```bash
# Required for Deepgram (optional but recommended)
DEEPGRAM_API_KEY=your_deepgram_api_key

# Optional tuning parameters
SYNC_VOCAL_ENERGY_THRESHOLD=0.3
SYNC_MIN_LINE_DURATION=1.5
SYNC_MAX_LINE_DURATION=6.0
SYNC_ENABLE_BEAT_ALIGNMENT=true
```

## Usage

### Basic Usage

The system is automatically integrated into your existing video generation pipeline. When you create a lyric video, it will:

1. Try advanced synchronization first (if librosa is available)
2. Fall back to enhanced Deepgram (if API key is set)
3. Use improved basic synchronization as final fallback

### Testing and Debugging

Use the debug tool to test synchronization quality:

```bash
# Test with Spotify URL (gets lyrics automatically)
python backend/api/debug_synchronization.py \
  --audio /path/to/your/audio.mp3 \
  --spotify-url "https://open.spotify.com/track/..." \
  --test-videos \
  --output-dir ./test_results

# Test with manual lyrics file
python backend/api/debug_synchronization.py \
  --audio /path/to/your/audio.mp3 \
  --lyrics-file ./lyrics.txt \
  --export-json results.json
```

### Genre-Specific Optimization

Configure for specific music genres:

```python
from api.lyric_video.sync_config import get_config_for_genre
from api.lyric_video.advanced_synchronization import AdvancedLyricSynchronizer

# Use rap-optimized settings
config = get_config_for_genre('rap')
synchronizer = AdvancedLyricSynchronizer(audio_path, config)
```

Available genre presets:
- `pop`: Balanced settings for pop music
- `rock`: Higher energy thresholds, longer intros
- `rap`: Fast-paced lyrics, minimal gaps
- `ballad`: Longer line durations, more spacing
- `country`: Moderate settings for country music

## Configuration

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SYNC_VOCAL_ENERGY_THRESHOLD` | 0.3 | Sensitivity for vocal detection |
| `SYNC_MIN_LINE_DURATION` | 1.5 | Minimum seconds per lyric line |
| `SYNC_MAX_LINE_DURATION` | 6.0 | Maximum seconds per lyric line |
| `SYNC_DEEPGRAM_SIMILARITY` | 0.6 | Text similarity threshold for matching |
| `SYNC_ENABLE_BEAT_ALIGNMENT` | true | Align lyrics to detected beats |
| `SYNC_INTRO_SHORT` | 0.10 | Intro time ratio for short songs |
| `SYNC_INTRO_MEDIUM` | 0.12 | Intro time ratio for medium songs |
| `SYNC_INTRO_LONG` | 0.15 | Intro time ratio for long songs |

### Programmatic Configuration

```python
from api.lyric_video.sync_config import SynchronizationConfig

config = SynchronizationConfig()
config.VOCAL_ENERGY_THRESHOLD = 0.25  # More sensitive
config.MIN_LINE_DURATION = 1.0        # Faster lyrics
config.ENABLE_BEAT_ALIGNMENT = True   # Use beat detection

# Use with synchronizer
synchronizer = AdvancedLyricSynchronizer(audio_path, config)
```

## How It Works

### 1. Audio Analysis Phase

```python
# Extract audio features
tempo, beat_times = librosa.beat.beat_track(y=audio, sr=sample_rate)
onset_times = librosa.onset.onset_detect(y=audio, sr=sample_rate)
spectral_centroid = librosa.feature.spectral_centroid(y=audio)
energy_profile = librosa.feature.rms(y=audio)

# Detect vocal segments
vocal_segments = detect_vocal_segments(spectral_centroid, energy_profile)
```

### 2. Enhanced Deepgram Integration

```python
# Get word-level timestamps from Deepgram
response = await deepgram.transcribe_file(audio, options={
    'model': 'nova-2',
    'words': True,  # Enable word-level timestamps
    'utterances': True,
    'smart_format': True
})

# Match lyrics to transcribed words with improved algorithm
for lyric_line in lyrics:
    best_match = find_best_word_sequence(lyric_line, transcribed_words)
    if confidence > threshold:
        use_deepgram_timing(best_match)
    else:
        estimate_timing_from_audio_features()
```

### 3. Audio-Based Synchronization

```python
# Distribute lyrics across detected vocal segments
for segment_start, segment_end in vocal_segments:
    segment_lyrics = assign_lyrics_to_segment(lyrics, segment_index)
    
    # Find beats within this vocal segment
    segment_beats = beat_times[
        (beat_times >= segment_start) & (beat_times <= segment_end)
    ]
    
    # Align lyrics to beats
    for lyric, beat_time in zip(segment_lyrics, segment_beats):
        sync_lyric_to_beat(lyric, beat_time)
```

## Troubleshooting

### Common Issues

#### 1. Poor Synchronization Quality

**Symptoms**: Lyrics appear too early/late, bunched together, or misaligned

**Solutions**:
```bash
# Test audio analysis
python backend/api/debug_synchronization.py --audio your_file.mp3 --spotify-url your_url

# Check vocal detection sensitivity
export SYNC_VOCAL_ENERGY_THRESHOLD=0.2  # More sensitive
export SYNC_VOCAL_ENERGY_THRESHOLD=0.4  # Less sensitive

# Adjust timing bounds
export SYNC_MIN_LINE_DURATION=1.0  # Faster lyrics
export SYNC_MAX_LINE_DURATION=8.0  # Slower lyrics
```

#### 2. Deepgram Not Working

**Symptoms**: Falls back to basic synchronization despite having API key

**Solutions**:
```bash
# Verify API key
echo $DEEPGRAM_API_KEY

# Test Deepgram connection
python -c "
import asyncio
from deepgram import DeepgramClient
client = DeepgramClient('your_api_key')
print('Deepgram connection OK')
"

# Check similarity threshold
export SYNC_DEEPGRAM_SIMILARITY=0.4  # More lenient matching
```

#### 3. Audio Analysis Fails

**Symptoms**: Error messages about librosa or audio processing

**Solutions**:
```bash
# Install audio libraries
sudo apt-get install libsndfile1-dev libasound2-dev
pip install librosa scipy numpy

# Test audio loading
python -c "
import librosa
y, sr = librosa.load('your_file.mp3')
print(f'Audio loaded: {len(y)} samples at {sr}Hz')
"
```

#### 4. Genre-Specific Issues

**Rap/Fast Songs**: Lyrics too slow
```bash
export SYNC_MIN_LINE_DURATION=0.8
export SYNC_INTRO_SHORT=0.05
```

**Ballads/Slow Songs**: Lyrics too fast
```bash
export SYNC_MIN_LINE_DURATION=2.5
export SYNC_MAX_LINE_DURATION=10.0
export SYNC_INTRO_MEDIUM=0.25
```

**Rock/Metal**: Vocals not detected
```bash
export SYNC_VOCAL_ENERGY_THRESHOLD=0.4
export SYNC_INTRO_MEDIUM=0.20
```

### Quality Validation

#### Check Synchronization Confidence

```python
# Enable confidence reporting in your output
for lyric in synced_lyrics:
    print(f"Line: {lyric['text']}")
    print(f"Timing: {lyric['start_time']:.2f}s - {lyric['end_time']:.2f}s")
    print(f"Confidence: {lyric.get('confidence', 0):.2f}")
    print(f"Method: {lyric.get('method', 'unknown')}")
```

#### Generate Test Videos

```bash
# Create test videos with different methods
python backend/api/debug_synchronization.py \
  --audio your_file.mp3 \
  --spotify-url your_url \
  --test-videos \
  --output-dir ./comparison

# Compare results
ls ./comparison/
# test_advanced.mp4
# test_deepgram.mp4  
# test_basic.mp4
```

## Performance Optimization

### For High-Volume Processing

```bash
# Disable beat alignment for faster processing
export SYNC_ENABLE_BEAT_ALIGNMENT=false

# Use lighter audio analysis
export SYNC_ENABLE_SPECTRAL=false
export SYNC_ENABLE_ONSET_DETECTION=false

# Reduce Deepgram search window
export SYNC_DEEPGRAM_SEARCH_WINDOW=50
```

### For Maximum Quality

```bash
# Enable all features
export SYNC_ENABLE_BEAT_ALIGNMENT=true
export SYNC_ENABLE_VAD=true
export SYNC_ENABLE_SPECTRAL=true
export SYNC_ENABLE_ONSET_DETECTION=true

# Use stricter thresholds
export SYNC_DEEPGRAM_SIMILARITY=0.7
export SYNC_VOCAL_ENERGY_THRESHOLD=0.25
```

## API Reference

### Main Functions

```python
# Primary synchronization function
from api.lyric_video.advanced_synchronization import synchronize_lyrics_advanced

result = synchronize_lyrics_advanced(audio_path, lyrics_lines)
# Returns: List[Dict] with timing information

# Configuration management
from api.lyric_video.sync_config import SynchronizationConfig, get_config_for_genre

config = get_config_for_genre('pop')
config.VOCAL_ENERGY_THRESHOLD = 0.25
```

### Debug and Testing

```python
# Audio analysis testing
from api.lyric_video.advanced_synchronization import AdvancedLyricSynchronizer

synchronizer = AdvancedLyricSynchronizer(audio_path)
features = synchronizer.analyze_audio()
print(f"Tempo: {features.tempo} BPM")
print(f"Vocal segments: {len(features.vocal_segments)}")
```

## Advanced Customization

### Custom Vocal Detection

```python
class CustomSynchronizer(AdvancedLyricSynchronizer):
    def _detect_vocal_segments(self, spectral_centroid, energy_profile):
        # Custom vocal detection logic
        # Return List[Tuple[float, float]] of (start_time, end_time)
        pass
```

### Custom Timing Algorithm

```python
def custom_timing_algorithm(audio_path, lyrics_lines):
    # Your custom synchronization logic
    return [
        {
            'text': line,
            'start_time': calculated_start,
            'end_time': calculated_end,
            'duration': calculated_duration,
            'confidence': confidence_score,
            'method': 'custom'
        }
        for line in lyrics_lines
    ]
```

## Best Practices

1. **Always test with debug tool first**: Use `debug_synchronization.py` to validate timing
2. **Use genre-specific presets**: Start with appropriate genre configuration
3. **Validate audio quality**: Ensure clean audio without compression artifacts
4. **Monitor confidence scores**: Low confidence indicates potential timing issues
5. **Adjust thresholds incrementally**: Small changes in thresholds can have big impacts
6. **Keep lyrics clean**: Remove metadata and annotations before synchronization
7. **Test with different song types**: Verify settings work across your music catalog

## Support and Feedback

When reporting synchronization issues, please include:

1. Audio file characteristics (duration, genre, quality)
2. Lyrics sample (first few lines)
3. Current configuration settings
4. Output from debug tool
5. Expected vs actual timing behavior

This helps identify the best optimization approach for your specific use case.
