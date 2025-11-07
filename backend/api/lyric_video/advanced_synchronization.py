"""
Advanced lyrics-to-audio synchronization module.

This module provides multiple synchronization strategies for better timing accuracy:
1. Audio analysis-based synchronization using librosa
2. Enhanced Deepgram integration with audio features
3. Machine learning-based vocal detection
4. Hybrid approach combining multiple methods
"""

import os
import re
import numpy as np
import asyncio
import traceback
from typing import List, Dict, Optional, Tuple
from dataclasses import dataclass
from difflib import SequenceMatcher

# Import configuration
try:
    from .sync_config import SynchronizationConfig, get_default_config
    CONFIG_AVAILABLE = True
except ImportError:
    CONFIG_AVAILABLE = False
    print("Sync config not available - using default values")

# Audio analysis imports
try:
    import librosa
    import librosa.display
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    print("librosa not available. Install with: pip install librosa")

# Deepgram imports
try:
    from deepgram import DeepgramClient, PrerecordedOptions
    DEEPGRAM_AVAILABLE = True
except ImportError:
    DEEPGRAM_AVAILABLE = False
    print("Deepgram SDK not installed. Install with: pip install deepgram-sdk")


@dataclass
class AudioFeatures:
    """Audio analysis results"""
    tempo: float
    beat_times: np.ndarray
    onset_times: np.ndarray
    vocal_segments: List[Tuple[float, float]]
    energy_profile: np.ndarray
    spectral_centroid: np.ndarray
    zero_crossing_rate: np.ndarray
    mfcc: np.ndarray


@dataclass
class SyncedLyric:
    """Synchronized lyric line with timing"""
    text: str
    start_time: float
    end_time: float
    duration: float
    confidence: float = 0.0
    method: str = "unknown"


class AdvancedLyricSynchronizer:
    """Advanced synchronization using multiple audio analysis techniques"""
    
    def __init__(self, audio_path: str, config: Optional[SynchronizationConfig] = None):
        self.audio_path = audio_path
        self.audio_features = None
        self.config = config if config else (get_default_config() if CONFIG_AVAILABLE else None)
        self.sample_rate = self.config.AUDIO_SAMPLE_RATE if self.config else 22050
        self.y = None
        
    def analyze_audio(self) -> Optional[AudioFeatures]:
        """Perform comprehensive audio analysis"""
        if not LIBROSA_AVAILABLE:
            print("librosa not available - cannot perform audio analysis")
            return None
            
        try:
            # Load audio
            self.y, self.sample_rate = librosa.load(self.audio_path, sr=22050)
            
            # Extract features
            tempo, beat_times = librosa.beat.beat_track(y=self.y, sr=self.sample_rate, units='time')
            onset_times = librosa.onset.onset_detect(y=self.y, sr=self.sample_rate, units='time')
            
            # Energy and spectral features
            spectral_centroid = librosa.feature.spectral_centroid(y=self.y, sr=self.sample_rate)[0]
            zero_crossing_rate = librosa.feature.zero_crossing_rate(self.y)[0]
            mfcc = librosa.feature.mfcc(y=self.y, sr=self.sample_rate, n_mfcc=13)
            
            # Calculate energy profile (RMS)
            energy_profile = librosa.feature.rms(y=self.y, frame_length=2048, hop_length=512)[0]
            
            # Detect vocal segments using spectral features
            vocal_segments = self._detect_vocal_segments(spectral_centroid, energy_profile)
            
            self.audio_features = AudioFeatures(
                tempo=tempo,
                beat_times=beat_times,
                onset_times=onset_times,
                vocal_segments=vocal_segments,
                energy_profile=energy_profile,
                spectral_centroid=spectral_centroid,
                zero_crossing_rate=zero_crossing_rate,
                mfcc=mfcc
            )
            
            print(f"Audio analysis complete: tempo={tempo:.2f} BPM, {len(vocal_segments)} vocal segments")
            return self.audio_features
            
        except Exception as e:
            print(f"Error in audio analysis: {e}")
            traceback.print_exc()
            return None
    
    def _detect_vocal_segments(self, spectral_centroid: np.ndarray, energy_profile: np.ndarray) -> List[Tuple[float, float]]:
        """Detect vocal segments using energy and spectral analysis"""
        try:
            # Time frames for the features
            frame_length = self.config.FRAME_LENGTH if self.config else 2048
            hop_length = self.config.HOP_LENGTH if self.config else 512
            time_frames = librosa.frames_to_time(np.arange(len(energy_profile)), 
                                                sr=self.sample_rate, 
                                                hop_length=hop_length)
            
            # Normalize features
            energy_norm = (energy_profile - np.mean(energy_profile)) / np.std(energy_profile)
            centroid_norm = (spectral_centroid - np.mean(spectral_centroid)) / np.std(spectral_centroid)
            
            # Vocal detection heuristic using config values
            vocal_energy_threshold = self.config.VOCAL_ENERGY_THRESHOLD if self.config else 0.3
            vocal_spectral_threshold = self.config.VOCAL_SPECTRAL_THRESHOLD if self.config else -0.5
            vocal_indicator = (energy_norm > vocal_energy_threshold) & (centroid_norm > vocal_spectral_threshold)
            
            # Find continuous vocal segments
            segments = []
            in_vocal = False
            start_time = 0
            
            for i, is_vocal in enumerate(vocal_indicator):
                current_time = time_frames[i]
                
                if is_vocal and not in_vocal:
                    # Start of vocal segment
                    start_time = current_time
                    in_vocal = True
                elif not is_vocal and in_vocal:
                    # End of vocal segment
                    min_duration = self.config.MIN_VOCAL_SEGMENT_DURATION if self.config else 1.0
                    if current_time - start_time > min_duration:
                        segments.append((start_time, current_time))
                    in_vocal = False
            
            # Handle case where song ends during vocal segment
            if in_vocal:
                segments.append((start_time, time_frames[-1]))
            
            return segments
            
        except Exception as e:
            print(f"Error detecting vocal segments: {e}")
            # Return a fallback with estimated vocal regions
            duration = len(self.y) / self.sample_rate
            return [(duration * 0.1, duration * 0.9)]  # Assume vocals in middle 80%
    
    def synchronize_lyrics(self, lyrics_lines: List[str]) -> List[SyncedLyric]:
        """Main synchronization method that tries multiple approaches"""
        print("Starting advanced lyrics synchronization...")
        
        # Method 1: Try enhanced Deepgram with audio features
        deepgram_result = self._synchronize_with_enhanced_deepgram(lyrics_lines)
        if deepgram_result and len(deepgram_result) > len(lyrics_lines) * 0.7:
            print("Using enhanced Deepgram synchronization")
            return deepgram_result
        
        # Method 2: Try audio analysis-based synchronization
        if self.audio_features:
            audio_result = self._synchronize_with_audio_analysis(lyrics_lines)
            if audio_result:
                print("Using audio analysis-based synchronization")
                return audio_result
        
        # Method 3: Fallback to improved basic synchronization
        print("Using improved basic synchronization")
        return self._create_improved_basic_synchronization(lyrics_lines)
    
    def _synchronize_with_enhanced_deepgram(self, lyrics_lines: List[str]) -> Optional[List[SyncedLyric]]:
        """Enhanced Deepgram synchronization using audio features"""
        if not DEEPGRAM_AVAILABLE:
            return None
            
        try:
            api_key = os.environ.get("DEEPGRAM_API_KEY")
            if not api_key:
                return None
            
            # Get Deepgram transcription with word-level timestamps
            response = asyncio.run(self._process_deepgram_enhanced(api_key))
            if not response or not hasattr(response, 'results'):
                return None
            
            # Extract words with timestamps
            words = []
            if hasattr(response.results, 'channels') and response.results.channels:
                for alternative in response.results.channels[0].alternatives:
                    if hasattr(alternative, 'words'):
                        words.extend(alternative.words)
            
            if not words:
                return None
            
            # Match lyrics to word sequences using improved algorithm
            synced_lyrics = self._match_lyrics_to_words(lyrics_lines, words)
            
            # Validate and adjust timing using audio features
            if self.audio_features:
                synced_lyrics = self._validate_timing_with_audio_features(synced_lyrics)
            
            return synced_lyrics
            
        except Exception as e:
            print(f"Error in enhanced Deepgram synchronization: {e}")
            return None
    
    async def _process_deepgram_enhanced(self, api_key: str):
        """Process audio with Deepgram using enhanced options"""
        try:
            deepgram = DeepgramClient(api_key)
            
            with open(self.audio_path, 'rb') as audio:
                payload = audio.read()
            
            options = PrerecordedOptions(
                model="nova-2",
                language="en",
                detect_language=True,
                smart_format=True,
                punctuate=True,
                paragraphs=True,
                utterances=True,
                words=True,  # Enable word-level timestamps
                diarize=False
            )
            
            response = await deepgram.listen.prerecorded.v("1").transcribe_file(payload, options)
            return response
            
        except Exception as e:
            print(f"Enhanced Deepgram processing error: {e}")
            return None
    
    def _match_lyrics_to_words(self, lyrics_lines: List[str], words: List) -> List[SyncedLyric]:
        """Match lyrics lines to word sequences with improved algorithm"""
        synced_lyrics = []
        word_idx = 0
        
        for line in lyrics_lines:
            if not line.strip():
                continue
            
            # Normalize and tokenize the lyric line
            line_words = self._normalize_and_tokenize(line)
            if not line_words:
                continue
            
            # Find the best matching sequence in transcribed words
            best_match = self._find_best_word_sequence(line_words, words, word_idx)
            
            if best_match:
                start_idx, end_idx, confidence = best_match
                start_time = words[start_idx].start if hasattr(words[start_idx], 'start') else 0
                end_time = words[end_idx].end if hasattr(words[end_idx], 'end') else start_time + 2.0
                
                synced_lyrics.append(SyncedLyric(
                    text=line,
                    start_time=start_time,
                    end_time=end_time,
                    duration=end_time - start_time,
                    confidence=confidence,
                    method="enhanced_deepgram"
                ))
                
                word_idx = end_idx + 1
            else:
                # No match found - estimate based on previous timing
                if synced_lyrics:
                    last_end = synced_lyrics[-1].end_time
                    estimated_duration = max(2.0, len(line) * 0.05)
                    
                    synced_lyrics.append(SyncedLyric(
                        text=line,
                        start_time=last_end + 0.5,
                        end_time=last_end + 0.5 + estimated_duration,
                        duration=estimated_duration,
                        confidence=0.3,
                        method="estimated"
                    ))
                else:
                    synced_lyrics.append(SyncedLyric(
                        text=line,
                        start_time=5.0,  # Default start
                        end_time=7.0,
                        duration=2.0,
                        confidence=0.2,
                        method="default"
                    ))
        
        return synced_lyrics
    
    def _normalize_and_tokenize(self, text: str) -> List[str]:
        """Normalize and tokenize text for matching"""
        # Remove special characters and normalize
        normalized = re.sub(r'[^\w\s]', '', text.lower())
        return [word for word in normalized.split() if len(word) > 1]
    
    def _find_best_word_sequence(self, target_words: List[str], transcribed_words: List, start_idx: int) -> Optional[Tuple[int, int, float]]:
        """Find the best matching word sequence"""
        if not target_words or start_idx >= len(transcribed_words):
            return None
        
        best_match = None
        best_score = 0.0
        search_window = min(100, len(transcribed_words) - start_idx)  # Limit search window
        
        for i in range(start_idx, start_idx + search_window):
            for j in range(i + 1, min(i + len(target_words) * 3, len(transcribed_words))):
                # Extract sequence of transcribed words
                sequence = []
                for k in range(i, j + 1):
                    if hasattr(transcribed_words[k], 'word'):
                        word = re.sub(r'[^\w\s]', '', transcribed_words[k].word.lower())
                        if word:
                            sequence.append(word)
                
                if not sequence:
                    continue
                
                # Calculate similarity
                target_text = ' '.join(target_words)
                sequence_text = ' '.join(sequence)
                similarity = SequenceMatcher(None, target_text, sequence_text).ratio()
                
                # Bonus for word count match
                length_bonus = 1.0 - abs(len(target_words) - len(sequence)) / max(len(target_words), len(sequence))
                score = similarity * 0.7 + length_bonus * 0.3
                
                if score > best_score and score > 0.6:
                    best_score = score
                    best_match = (i, j, score)
        
        return best_match
    
    def _synchronize_with_audio_analysis(self, lyrics_lines: List[str]) -> Optional[List[SyncedLyric]]:
        """Synchronize using audio analysis features"""
        if not self.audio_features:
            return None
        
        try:
            # Filter out empty lines
            non_empty_lines = [line for line in lyrics_lines if line.strip()]
            if not non_empty_lines:
                return []
            
            synced_lyrics = []
            
            # Map lyrics to vocal segments
            vocal_segments = self.audio_features.vocal_segments
            if not vocal_segments:
                return None
            
            # Distribute lyrics across vocal segments
            lyrics_per_segment = self._distribute_lyrics_across_segments(non_empty_lines, vocal_segments)
            
            for segment_idx, (start_time, end_time) in enumerate(vocal_segments):
                segment_lyrics = lyrics_per_segment.get(segment_idx, [])
                if not segment_lyrics:
                    continue
                
                # Find beat-aligned positions within this segment
                segment_beats = self.audio_features.beat_times[
                    (self.audio_features.beat_times >= start_time) & 
                    (self.audio_features.beat_times <= end_time)
                ]
                
                # Synchronize lyrics within the segment
                segment_synced = self._synchronize_within_segment(
                    segment_lyrics, start_time, end_time, segment_beats
                )
                synced_lyrics.extend(segment_synced)
            
            return synced_lyrics
            
        except Exception as e:
            print(f"Error in audio analysis synchronization: {e}")
            return None
    
    def _distribute_lyrics_across_segments(self, lyrics_lines: List[str], vocal_segments: List[Tuple[float, float]]) -> Dict[int, List[str]]:
        """Distribute lyrics across vocal segments"""
        distribution = {}
        
        if not vocal_segments:
            return distribution
        
        # Simple distribution - divide lyrics evenly across segments
        lyrics_per_segment = max(1, len(lyrics_lines) // len(vocal_segments))
        
        for i, segment in enumerate(vocal_segments):
            start_idx = i * lyrics_per_segment
            end_idx = start_idx + lyrics_per_segment
            
            # Last segment gets remaining lyrics
            if i == len(vocal_segments) - 1:
                end_idx = len(lyrics_lines)
            
            distribution[i] = lyrics_lines[start_idx:end_idx]
        
        return distribution
    
    def _synchronize_within_segment(self, lyrics: List[str], start_time: float, end_time: float, beats: np.ndarray) -> List[SyncedLyric]:
        """Synchronize lyrics within a vocal segment using beat timing"""
        synced_lyrics = []
        
        if not lyrics:
            return synced_lyrics
        
        segment_duration = end_time - start_time
        
        if len(beats) > 1:
            # Use beat-aligned timing
            beat_positions = np.linspace(0, len(beats) - 1, len(lyrics) + 1, dtype=int)
            
            for i, lyric in enumerate(lyrics):
                if i < len(beat_positions) - 1:
                    lyric_start = beats[beat_positions[i]]
                    lyric_end = beats[beat_positions[i + 1]]
                else:
                    # Last lyric extends to segment end
                    lyric_start = beats[beat_positions[i]] if beat_positions[i] < len(beats) else end_time - 2.0
                    lyric_end = end_time
                
                synced_lyrics.append(SyncedLyric(
                    text=lyric,
                    start_time=lyric_start,
                    end_time=lyric_end,
                    duration=lyric_end - lyric_start,
                    confidence=0.8,
                    method="audio_analysis"
                ))
        else:
            # Fallback to even distribution within segment
            time_per_lyric = segment_duration / len(lyrics)
            
            for i, lyric in enumerate(lyrics):
                lyric_start = start_time + (i * time_per_lyric)
                lyric_end = lyric_start + time_per_lyric
                
                synced_lyrics.append(SyncedLyric(
                    text=lyric,
                    start_time=lyric_start,
                    end_time=lyric_end,
                    duration=time_per_lyric,
                    confidence=0.6,
                    method="segment_distribution"
                ))
        
        return synced_lyrics
    
    def _validate_timing_with_audio_features(self, synced_lyrics: List[SyncedLyric]) -> List[SyncedLyric]:
        """Validate and adjust timing using audio features"""
        if not self.audio_features:
            return synced_lyrics
        
        validated_lyrics = []
        
        for lyric in synced_lyrics:
            # Check if timing aligns with vocal segments
            is_in_vocal_segment = any(
                start <= lyric.start_time <= end or start <= lyric.end_time <= end
                for start, end in self.audio_features.vocal_segments
            )
            
            if is_in_vocal_segment:
                # Good timing - keep as is
                validated_lyrics.append(lyric)
            else:
                # Adjust to nearest vocal segment
                adjusted_lyric = self._adjust_to_vocal_segment(lyric)
                validated_lyrics.append(adjusted_lyric)
        
        return validated_lyrics
    
    def _adjust_to_vocal_segment(self, lyric: SyncedLyric) -> SyncedLyric:
        """Adjust lyric timing to nearest vocal segment"""
        if not self.audio_features.vocal_segments:
            return lyric
        
        # Find nearest vocal segment
        min_distance = float('inf')
        best_segment = None
        
        for start, end in self.audio_features.vocal_segments:
            # Calculate distance to segment
            if lyric.start_time < start:
                distance = start - lyric.start_time
            elif lyric.start_time > end:
                distance = lyric.start_time - end
            else:
                distance = 0  # Already in segment
            
            if distance < min_distance:
                min_distance = distance
                best_segment = (start, end)
        
        if best_segment and min_distance > 0:
            start, end = best_segment
            # Adjust to start of nearest vocal segment
            new_start = start
            new_end = min(start + lyric.duration, end)
            
            return SyncedLyric(
                text=lyric.text,
                start_time=new_start,
                end_time=new_end,
                duration=new_end - new_start,
                confidence=lyric.confidence * 0.8,  # Reduce confidence due to adjustment
                method=f"{lyric.method}_adjusted"
            )
        
        return lyric
    
    def _create_improved_basic_synchronization(self, lyrics_lines: List[str]) -> List[SyncedLyric]:
        """Improved basic synchronization using audio features when available"""
        non_empty_lines = [line for line in lyrics_lines if line.strip()]
        if not non_empty_lines:
            return []
        
        # Get audio duration
        duration = len(self.y) / self.sample_rate if self.y is not None else 180.0
        
        # Use audio features for better intro detection
        if self.audio_features and self.audio_features.vocal_segments:
            # Use first vocal segment as start
            intro_time = self.audio_features.vocal_segments[0][0]
            available_time = self.audio_features.vocal_segments[-1][1] - intro_time
        else:
            # Fallback to heuristic
            intro_time = min(15, duration * 0.15)
            available_time = duration - intro_time - 5
        
        print(f"Improved sync: intro={intro_time:.2f}s, available={available_time:.2f}s")
        
        # Calculate timing
        time_per_line = available_time / len(non_empty_lines)
        time_per_line = max(1.5, min(time_per_line, 4.0))
        
        synced_lyrics = []
        current_time = intro_time
        
        for line in non_empty_lines:
            # Adjust duration based on line characteristics
            line_length_factor = len(line) / 30
            duration = max(1.5, min(time_per_line * line_length_factor, 5.0))
            
            # Shorter lines get less time
            if len(line) < 5:
                duration = max(1.0, duration * 0.6)
            elif len(line) > 50:
                duration = min(6.0, duration * 1.2)
            
            synced_lyrics.append(SyncedLyric(
                text=line,
                start_time=current_time,
                end_time=current_time + duration,
                duration=duration,
                confidence=0.5,
                method="improved_basic"
            ))
            
            # Dynamic gap based on line duration
            gap = 0.1 + (0.1 * min(1.0, duration / 3.0))
            current_time += duration + gap
        
        # Fix overlaps
        for i in range(1, len(synced_lyrics)):
            if synced_lyrics[i].start_time < synced_lyrics[i-1].end_time:
                overlap = synced_lyrics[i-1].end_time - synced_lyrics[i].start_time
                synced_lyrics[i].start_time += overlap + 0.1
                synced_lyrics[i].end_time += overlap + 0.1
        
        return synced_lyrics


def synchronize_lyrics_advanced(audio_path: str, lyrics_lines: List[str]) -> List[Dict]:
    """
    Main function to synchronize lyrics using advanced methods.
    Returns list of dicts compatible with existing code.
    """
    synchronizer = AdvancedLyricSynchronizer(audio_path)
    
    # Analyze audio features
    synchronizer.analyze_audio()
    
    # Synchronize lyrics
    synced_lyrics = synchronizer.synchronize_lyrics(lyrics_lines)
    
    # Convert to format expected by existing code
    result = []
    for lyric in synced_lyrics:
        result.append({
            "text": lyric.text,
            "start_time": lyric.start_time,
            "end_time": lyric.end_time,
            "duration": lyric.duration,
            "confidence": lyric.confidence,
            "method": lyric.method
        })
    
    print(f"Advanced synchronization complete: {len(result)} lyrics synced")
    return result


if __name__ == "__main__":
    # Test script
    test_lyrics = [
        "This is the first line",
        "This is the second line",
        "And here's the chorus"
    ]
    
    # This would be called with actual audio file
    # result = synchronize_lyrics_advanced("path/to/audio.mp3", test_lyrics)
    print("Advanced synchronization module ready")
