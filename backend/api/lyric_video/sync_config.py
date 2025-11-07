"""
Configuration settings for lyrics synchronization.

This module contains adjustable parameters for fine-tuning the synchronization
algorithms based on different types of songs and audio quality.
"""

import os
from typing import Dict, Any


class SynchronizationConfig:
    """Configuration class for synchronization parameters"""
    
    def __init__(self):
        # Audio Analysis Settings
        self.AUDIO_SAMPLE_RATE = 22050
        self.FRAME_LENGTH = 2048
        self.HOP_LENGTH = 512
        
        # Vocal Detection Settings
        self.VOCAL_ENERGY_THRESHOLD = float(os.getenv('SYNC_VOCAL_ENERGY_THRESHOLD', '0.3'))
        self.VOCAL_SPECTRAL_THRESHOLD = float(os.getenv('SYNC_VOCAL_SPECTRAL_THRESHOLD', '-0.5'))
        self.MIN_VOCAL_SEGMENT_DURATION = float(os.getenv('SYNC_MIN_VOCAL_SEGMENT', '1.0'))
        
        # Deepgram Settings
        self.DEEPGRAM_MODEL = os.getenv('SYNC_DEEPGRAM_MODEL', 'nova-2')
        self.DEEPGRAM_SIMILARITY_THRESHOLD = float(os.getenv('SYNC_DEEPGRAM_SIMILARITY', '0.6'))
        self.DEEPGRAM_SEARCH_WINDOW = int(os.getenv('SYNC_DEEPGRAM_SEARCH_WINDOW', '100'))
        self.DEEPGRAM_MAX_SEQUENCE_LENGTH = int(os.getenv('SYNC_DEEPGRAM_MAX_SEQUENCE', '3'))
        
        # Timing Settings
        self.MIN_LINE_DURATION = float(os.getenv('SYNC_MIN_LINE_DURATION', '1.5'))
        self.MAX_LINE_DURATION = float(os.getenv('SYNC_MAX_LINE_DURATION', '6.0'))
        self.MIN_GAP_BETWEEN_LINES = float(os.getenv('SYNC_MIN_GAP', '0.1'))
        self.MAX_GAP_BETWEEN_LINES = float(os.getenv('SYNC_MAX_GAP', '1.0'))
        
        # Basic Synchronization Fallback
        self.INTRO_TIME_SHORT_SONG = float(os.getenv('SYNC_INTRO_SHORT', '0.10'))  # 10% for short songs
        self.INTRO_TIME_MEDIUM_SONG = float(os.getenv('SYNC_INTRO_MEDIUM', '0.12'))  # 12% for medium songs
        self.INTRO_TIME_LONG_SONG = float(os.getenv('SYNC_INTRO_LONG', '0.15'))  # 15% for long songs
        self.MAX_INTRO_TIME = float(os.getenv('SYNC_MAX_INTRO', '30.0'))  # Max 30 seconds
        
        # Song Duration Thresholds
        self.SHORT_SONG_THRESHOLD = float(os.getenv('SYNC_SHORT_SONG_THRESHOLD', '120.0'))  # 2 minutes
        self.LONG_SONG_THRESHOLD = float(os.getenv('SYNC_LONG_SONG_THRESHOLD', '240.0'))  # 4 minutes
        
        # Line Length Adjustments
        self.BASELINE_CHARS_PER_LINE = int(os.getenv('SYNC_BASELINE_CHARS', '30'))
        self.SHORT_LINE_THRESHOLD = int(os.getenv('SYNC_SHORT_LINE_THRESHOLD', '5'))
        self.LONG_LINE_THRESHOLD = int(os.getenv('SYNC_LONG_LINE_THRESHOLD', '50'))
        self.SHORT_LINE_DURATION_FACTOR = float(os.getenv('SYNC_SHORT_LINE_FACTOR', '0.6'))
        self.LONG_LINE_DURATION_FACTOR = float(os.getenv('SYNC_LONG_LINE_FACTOR', '1.2'))
        
        # Confidence Thresholds
        self.HIGH_CONFIDENCE_THRESHOLD = float(os.getenv('SYNC_HIGH_CONFIDENCE', '0.8'))
        self.MEDIUM_CONFIDENCE_THRESHOLD = float(os.getenv('SYNC_MEDIUM_CONFIDENCE', '0.6'))
        self.LOW_CONFIDENCE_THRESHOLD = float(os.getenv('SYNC_LOW_CONFIDENCE', '0.4'))
        
        # Beat Alignment Settings
        self.ENABLE_BEAT_ALIGNMENT = os.getenv('SYNC_ENABLE_BEAT_ALIGNMENT', 'true').lower() == 'true'
        self.BEAT_ALIGNMENT_TOLERANCE = float(os.getenv('SYNC_BEAT_TOLERANCE', '0.2'))  # 200ms tolerance
        
        # Advanced Features
        self.ENABLE_ONSET_DETECTION = os.getenv('SYNC_ENABLE_ONSET_DETECTION', 'true').lower() == 'true'
        self.ENABLE_VOCAL_ACTIVITY_DETECTION = os.getenv('SYNC_ENABLE_VAD', 'true').lower() == 'true'
        self.ENABLE_SPECTRAL_ANALYSIS = os.getenv('SYNC_ENABLE_SPECTRAL', 'true').lower() == 'true'
    
    def get_intro_time_ratio(self, audio_duration: float) -> float:
        """Get appropriate intro time ratio based on song length"""
        if audio_duration < self.SHORT_SONG_THRESHOLD:
            return self.INTRO_TIME_SHORT_SONG
        elif audio_duration < self.LONG_SONG_THRESHOLD:
            return self.INTRO_TIME_MEDIUM_SONG
        else:
            return self.INTRO_TIME_LONG_SONG
    
    def calculate_line_duration(self, line: str, base_duration: float) -> float:
        """Calculate adjusted duration for a lyric line"""
        line_length = len(line)
        
        # Base duration adjustment based on line length
        length_factor = line_length / self.BASELINE_CHARS_PER_LINE
        adjusted_duration = base_duration * length_factor
        
        # Apply specific adjustments for very short or long lines
        if line_length < self.SHORT_LINE_THRESHOLD:
            adjusted_duration *= self.SHORT_LINE_DURATION_FACTOR
        elif line_length > self.LONG_LINE_THRESHOLD:
            adjusted_duration *= self.LONG_LINE_DURATION_FACTOR
        
        # Ensure duration is within bounds
        return max(self.MIN_LINE_DURATION, min(adjusted_duration, self.MAX_LINE_DURATION))
    
    def calculate_gap_duration(self, line_duration: float) -> float:
        """Calculate gap duration between lines"""
        # Dynamic gap based on line duration
        gap = self.MIN_GAP_BETWEEN_LINES + (0.1 * min(1.0, line_duration / 3.0))
        return min(gap, self.MAX_GAP_BETWEEN_LINES)
    
    def get_confidence_level(self, confidence: float) -> str:
        """Get confidence level description"""
        if confidence >= self.HIGH_CONFIDENCE_THRESHOLD:
            return "high"
        elif confidence >= self.MEDIUM_CONFIDENCE_THRESHOLD:
            return "medium"
        elif confidence >= self.LOW_CONFIDENCE_THRESHOLD:
            return "low"
        else:
            return "very_low"
    
    def to_dict(self) -> Dict[str, Any]:
        """Export configuration as dictionary"""
        return {
            key: value for key, value in self.__dict__.items()
            if not key.startswith('_')
        }
    
    def update_from_dict(self, config_dict: Dict[str, Any]):
        """Update configuration from dictionary"""
        for key, value in config_dict.items():
            if hasattr(self, key):
                setattr(self, key, value)
    
    def save_to_file(self, filepath: str):
        """Save configuration to JSON file"""
        import json
        with open(filepath, 'w') as f:
            json.dump(self.to_dict(), f, indent=2)
    
    def load_from_file(self, filepath: str):
        """Load configuration from JSON file"""
        import json
        with open(filepath, 'r') as f:
            config_dict = json.load(f)
            self.update_from_dict(config_dict)


# Genre-specific presets
GENRE_PRESETS = {
    'pop': {
        'VOCAL_ENERGY_THRESHOLD': 0.25,
        'INTRO_TIME_SHORT_SONG': 0.08,
        'INTRO_TIME_MEDIUM_SONG': 0.10,
        'MIN_LINE_DURATION': 1.2,
        'MAX_LINE_DURATION': 4.0,
    },
    'rock': {
        'VOCAL_ENERGY_THRESHOLD': 0.35,
        'INTRO_TIME_SHORT_SONG': 0.15,
        'INTRO_TIME_MEDIUM_SONG': 0.18,
        'MIN_LINE_DURATION': 1.0,
        'MAX_LINE_DURATION': 5.0,
    },
    'rap': {
        'VOCAL_ENERGY_THRESHOLD': 0.20,
        'INTRO_TIME_SHORT_SONG': 0.05,
        'INTRO_TIME_MEDIUM_SONG': 0.08,
        'MIN_LINE_DURATION': 0.8,
        'MAX_LINE_DURATION': 3.0,
        'SHORT_LINE_DURATION_FACTOR': 0.4,
        'BASELINE_CHARS_PER_LINE': 40,
    },
    'ballad': {
        'VOCAL_ENERGY_THRESHOLD': 0.30,
        'INTRO_TIME_SHORT_SONG': 0.20,
        'INTRO_TIME_MEDIUM_SONG': 0.25,
        'MIN_LINE_DURATION': 2.0,
        'MAX_LINE_DURATION': 8.0,
        'MIN_GAP_BETWEEN_LINES': 0.3,
    },
    'country': {
        'VOCAL_ENERGY_THRESHOLD': 0.28,
        'INTRO_TIME_SHORT_SONG': 0.12,
        'INTRO_TIME_MEDIUM_SONG': 0.15,
        'MIN_LINE_DURATION': 1.5,
        'MAX_LINE_DURATION': 5.5,
    }
}


def get_config_for_genre(genre: str) -> SynchronizationConfig:
    """Get configuration optimized for a specific genre"""
    config = SynchronizationConfig()
    
    if genre.lower() in GENRE_PRESETS:
        preset = GENRE_PRESETS[genre.lower()]
        config.update_from_dict(preset)
        print(f"Applied {genre} genre preset")
    
    return config


# Global configuration instance
default_config = SynchronizationConfig()


def get_default_config() -> SynchronizationConfig:
    """Get the default configuration instance"""
    return default_config


def set_config_from_env():
    """Update default configuration from environment variables"""
    global default_config
    default_config = SynchronizationConfig()


# Load configuration on module import
set_config_from_env()


if __name__ == "__main__":
    # Test configuration
    config = SynchronizationConfig()
    print("Default configuration:")
    for key, value in config.to_dict().items():
        print(f"  {key}: {value}")
    
    # Test genre presets
    print("\nAvailable genre presets:")
    for genre in GENRE_PRESETS.keys():
        print(f"  - {genre}")
    
    # Example of using a genre preset
    rock_config = get_config_for_genre('rock')
    print(f"\nRock preset intro time for medium song: {rock_config.INTRO_TIME_MEDIUM_SONG}")
