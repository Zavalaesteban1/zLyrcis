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
from dataclasses import dataclass, field
from difflib import SequenceMatcher

# Import configuration
try:
    from .config import SynchronizationConfig, get_default_config
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
    from deepgram import DeepgramClient
    DEEPGRAM_AVAILABLE = True
except ImportError:
    DEEPGRAM_AVAILABLE = False
    print("Deepgram SDK not installed. Install with: pip install deepgram-sdk")

# Groq/OpenAI imports (for fast Whisper API)
try:
    from openai import OpenAI
    GROQ_AVAILABLE = True
except ImportError:
    GROQ_AVAILABLE = False
    print("OpenAI SDK not installed. Install with: pip install openai")


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
    words: List[Dict] = field(default_factory=list)


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
            
            # Ensure tempo is a scalar (librosa can return array or scalar depending on version)
            if hasattr(tempo, '__len__'):
                tempo = float(tempo[0]) if len(tempo) > 0 else 120.0
            else:
                tempo = float(tempo)
            
            # Energy and spectral features
            spectral_centroid = librosa.feature.spectral_centroid(y=self.y, sr=self.sample_rate)[0]
            zero_crossing_rate = librosa.feature.zero_crossing_rate(self.y)[0]
            mfcc = librosa.feature.mfcc(y=self.y, sr=self.sample_rate, n_mfcc=13)
            
            # Calculate energy profile (RMS)
            energy_profile = librosa.feature.rms(y=self.y, frame_length=2048, hop_length=512)[0]
            
            # Detect vocal segments using spectral features
            vocal_segments = self._detect_vocal_segments(spectral_centroid, energy_profile)
            
            print(f"DEBUG: Detected {len(vocal_segments)} vocal segments using audio analysis")
            if vocal_segments:
                for i, (start, end) in enumerate(vocal_segments[:3]):  # Show first 3
                    print(f"DEBUG:   Vocal segment {i+1}: {start:.2f}s - {end:.2f}s (duration: {end-start:.2f}s)")
            
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
        
        # SPECIAL CASE: If no lyrics provided (Genius failed), use Groq transcription only
        if lyrics_lines is None or len(lyrics_lines) == 0:
            print("⚠️  No Genius lyrics - using Groq transcription as lyrics (Groq-only mode)")
            return self._synchronize_groq_only()
        
        # Method 1: Groq API (Fastest - 3-5 seconds on GPU)
        groq_result = self._synchronize_with_groq(lyrics_lines)
        if groq_result and len(groq_result) > len(lyrics_lines) * 0.7:
            print("Using Groq API (Whisper large-v3 on GPU)")
            return groq_result
        
        # Method 2: Local Whisper Word-Level Sync (Slowest but works offline)
        whisper_result = self._synchronize_with_local_whisper(lyrics_lines)
        if whisper_result and len(whisper_result) > len(lyrics_lines) * 0.7:
            print("Using Local Whisper word-level synchronization")
            return whisper_result

        # Method 3: Try enhanced Deepgram with audio features (fallback)
        deepgram_result = self._synchronize_with_enhanced_deepgram(lyrics_lines)
        if deepgram_result and len(deepgram_result) > len(lyrics_lines) * 0.7:
            print("Using enhanced Deepgram synchronization")
            return deepgram_result
        
        # Method 4: Try audio analysis-based synchronization
        if self.audio_features:
            audio_result = self._synchronize_with_audio_analysis(lyrics_lines)
            if audio_result:
                print("Using audio analysis-based synchronization")
                return audio_result
        
        # Method 5: Fallback to improved basic synchronization
        print("Using improved basic synchronization")
        return self._create_improved_basic_synchronization(lyrics_lines)
    
    def _synchronize_with_groq(self, lyrics_lines: List[str]) -> Optional[List[SyncedLyric]]:
        """Fast synchronization using Groq API (Whisper large-v3 on GPU)"""
        if not GROQ_AVAILABLE:
            print("OpenAI SDK not available - skipping Groq. Install with: pip install openai")
            return None
            
        try:
            api_key = os.environ.get("GROQ_API_KEY")
            if not api_key:
                print("No GROQ_API_KEY found - skipping Groq API")
                return None
            
            print("Using Groq API for ultra-fast Whisper transcription...")
            
            # Initialize Groq client (OpenAI-compatible)
            client = OpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1"
            )
            
            # Open audio file and send to Groq
            with open(self.audio_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    model="whisper-large-v3",  # or "distil-whisper-large-v3-en" for English-only (faster)
                    file=audio_file,
                    response_format="verbose_json",
                    timestamp_granularities=["word"]
                )
            
            # Extract language
            detected_lang = getattr(transcription, 'language', 'en')
            print(f"Groq detected language: {detected_lang}")
            
            # Extract words from response
            words = []
            if hasattr(transcription, 'words') and transcription.words:
                for word_obj in transcription.words:
                    words.append({
                        "word": word_obj.word.strip(),
                        "start": word_obj.start,
                        "end": word_obj.end
                    })
            
            if not words:
                print("No words extracted from Groq response")
                return None
            
            print(f"Groq returned {len(words)} words with perfect timestamps")

            # DEBUG: Show EVERYTHING Groq transcribed
            print(f"\n{'='*80}")
            print(f"GROQ COMPLETE TRANSCRIPTION - Total words: {len(words)}")
            print(f"{'='*80}")
            transcribed_text = ' '.join([w['word'] for w in words])  # ALL words
            print(f"Complete transcribed text:")
            print(f"{transcribed_text}")
            print(f"{'='*80}\n")
            
            # DEBUG: Show ALL word-level timestamps
            print(f"{'='*80}")
            print(f"GROQ WORD-LEVEL TIMESTAMPS - ALL {len(words)} WORDS")
            print(f"{'='*80}")
            for i, w in enumerate(words, 1):
                print(f"Word {i:3d}: '{w['word']:20s}' → {w['start']:7.2f}s - {w['end']:7.2f}s")
            print(f"{'='*80}\n")
            
            
            # Match lyrics to word sequences using existing algorithm
            synced_lyrics = self._match_lyrics_to_words(lyrics_lines, words, detected_lang)
            
            if synced_lyrics:
                print(f"Successfully synced {len(synced_lyrics)} lyric lines using Groq API")
            
            return synced_lyrics
            
        except Exception as e:
            print(f"Error in Groq synchronization: {e}")
            traceback.print_exc()
            return None
    
    def _synchronize_groq_only(self) -> Optional[List[SyncedLyric]]:
        """Use ONLY Groq transcription (no Genius lyrics) - perfect for songs not on Genius"""
        if not GROQ_AVAILABLE:
            print("OpenAI SDK not available - cannot use Groq-only mode")
            return None
            
        try:
            api_key = os.environ.get("GROQ_API_KEY")
            if not api_key:
                print("No GROQ_API_KEY found - falling back to local Whisper")
                return self._synchronize_with_local_whisper([])
            
            print("🎵 Groq-only mode: Using transcription as lyrics (no Genius matching needed)")
            
            # Initialize Groq client
            client = OpenAI(
                api_key=api_key,
                base_url="https://api.groq.com/openai/v1"
            )
            
            # Transcribe with Groq - FORCE ENGLISH to avoid misdetection
            # (Reggae, heavily accented music, or poor audio can confuse auto-detection)
            with open(self.audio_path, "rb") as audio_file:
                transcription = client.audio.transcriptions.create(
                    model="whisper-large-v3",
                    file=audio_file,
                    response_format="verbose_json",
                    timestamp_granularities=["segment"],  # Get segments, not just words
                    language="en"  # Force English (prevents Khmer/wrong language detection)
                )
            
            # Extract language (should be 'en' now)
            detected_lang = getattr(transcription, 'language', 'en')
            print(f"Groq detected language: {detected_lang} (forced English for Groq-only mode)")
            
            # Extract segments (these are natural phrase groupings from Whisper)
            synced_lyrics = []
            if hasattr(transcription, 'segments') and transcription.segments:
                for seg in transcription.segments:
                    text = seg.text.strip()
                    if text:  # Skip empty segments
                        synced_lyrics.append(SyncedLyric(
                            text=text,
                            start_time=seg.start,
                            end_time=seg.end,
                            duration=seg.end - seg.start,
                            confidence=1.0,  # Perfect sync!
                            method="groq_transcription_only",
                            words=[]
                        ))
            
            if not synced_lyrics:
                print("No segments extracted from Groq response")
                return None
            
            print(f"✓ Groq-only mode: {len(synced_lyrics)} lines transcribed with PERFECT sync")
            print(f"  (No Genius matching needed - these are Groq's natural phrase groupings)")
            
            return synced_lyrics
            
        except Exception as e:
            print(f"Error in Groq-only mode: {e}")
            traceback.print_exc()
            return None
    
    def _synchronize_with_local_whisper(self, lyrics_lines: List[str]) -> Optional[List[SyncedLyric]]:
        """Synchronize perfectly using whisper-timestamped for word-level bounding boxes"""
        try:
            import whisper_timestamped as whisper
        except ImportError:
            print("whisper-timestamped not available - skipping. Please install with: pip install whisper-timestamped torch")
            return None
            
        try:
            print("Loading local Whisper model for highly accurate word-level transcription...")
            # Use 'base' for speed, but 'small'/'medium' yields better accuracy.
            model = whisper.load_model("base", device="cpu")
            audio = whisper.load_audio(self.audio_path)
            
            print("Transcribing audio with auto-detected language...")
            # Let Whisper auto-detect the language by not specifying it
            result = whisper.transcribe(model, audio)
            
            # Show what language Whisper detected
            detected_lang = result.get("language", "unknown")
            print(f"Whisper detected language: {detected_lang}")
            
            # Extract all words sequentially
            words = []
            for segment in result.get("segments", []):
                for word in segment.get("words", []):
                    # whisper-timestamped returns dicts like: {'text': ' word', 'start': 1.2, 'end': 1.5}
                    words.append({
                        "word": word["text"].strip(),
                        "start": word["start"],
                        "end": word["end"]
                    })
            
            if not words:
                print("No words extracted from local Whisper response")
                return None
            
            print(f"Local Whisper returned {len(words)} words with perfect timestamps")
            
            # Match lyrics to word sequences using existing improved algorithm
            synced_lyrics = self._match_lyrics_to_words(lyrics_lines, words, detected_lang)
            
            if synced_lyrics:
                print(f"Successfully synced {len(synced_lyrics)} lyric lines using local Whisper")
            
            # Validate and adjust timing
            if self.audio_features and hasattr(self, '_validate_timing_with_audio_features'):
                synced_lyrics = self._validate_timing_with_audio_features(synced_lyrics)
            
            return synced_lyrics
            
        except Exception as e:
            print(f"Error in local Whisper synchronization: {e}")
            traceback.print_exc()
            return None

    def _synchronize_with_enhanced_deepgram(self, lyrics_lines: List[str]) -> Optional[List[SyncedLyric]]:
        """Enhanced Deepgram synchronization using audio features"""
        if not DEEPGRAM_AVAILABLE:
            print("Deepgram not available - skipping")
            return None
            
        try:
            api_key = os.environ.get("DEEPGRAM_API_KEY")
            if not api_key:
                print("No Deepgram API key found")
                return None
            
            print("Calling Deepgram API for transcription...")
            # Get Deepgram transcription with word-level timestamps
            response = asyncio.run(self._process_deepgram_enhanced(api_key))
            if not response or not hasattr(response, 'results'):
                print("No valid response from Deepgram")
                return None
            
            # DEBUG: Print response structure
            print(f"DEBUG: Response type: {type(response)}")
            print(f"DEBUG: Response has results: {hasattr(response, 'results')}")
            if hasattr(response, 'results'):
                print(f"DEBUG: Results type: {type(response.results)}")
                print(f"DEBUG: Results has channels: {hasattr(response.results, 'channels')}")
                if hasattr(response.results, 'channels'):
                    print(f"DEBUG: Number of channels: {len(response.results.channels)}")
                    if len(response.results.channels) > 0:
                        channel = response.results.channels[0]
                        print(f"DEBUG: Channel type: {type(channel)}")
                        print(f"DEBUG: Channel has alternatives: {hasattr(channel, 'alternatives')}")
                        if hasattr(channel, 'alternatives') and len(channel.alternatives) > 0:
                            alt = channel.alternatives[0]
                            print(f"DEBUG: Alternative type: {type(alt)}")
                            print(f"DEBUG: Alternative attributes: {dir(alt)}")
                            print(f"DEBUG: Alternative has words: {hasattr(alt, 'words')}")
            
            # Extract words with timestamps
            words = []
            if hasattr(response.results, 'channels') and response.results.channels:
                for alternative in response.results.channels[0].alternatives:
                    if hasattr(alternative, 'words'):
                        print(f"DEBUG: alternative.words type: {type(alternative.words)}")
                        print(f"DEBUG: alternative.words is None: {alternative.words is None}")
                        print(f"DEBUG: alternative.words length: {len(alternative.words) if alternative.words else 0}")
                        
                        if alternative.words and len(alternative.words) > 0:
                            print(f"DEBUG: First word sample: {alternative.words[0]}")
                            words.extend(alternative.words)
                        else:
                            print(f"DEBUG: alternative.words is empty or None")
                            # Check if there's a transcript even without word-level timing
                            if hasattr(alternative, 'transcript'):
                                print(f"DEBUG: Has transcript: '{alternative.transcript[:100] if alternative.transcript else 'None'}'")
            
            if not words:
                print("No words extracted from Deepgram response")
                return None
            
            print(f"Deepgram returned {len(words)} words with timestamps")
            
            # DEBUG: Show time range of transcribed words
            if words:
                first_word = words[0]
                last_word = words[-1]
                if isinstance(first_word, dict):
                    first_time = first_word.get('start', 0)
                    last_time = last_word.get('end', 0)
                else:
                    first_time = first_word.start if hasattr(first_word, 'start') else 0
                    last_time = last_word.end if hasattr(last_word, 'end') else 0
                print(f"DEBUG: Transcribed words span from {first_time:.2f}s to {last_time:.2f}s")
            
            # Match lyrics to word sequences using improved algorithm
            # Deepgram doesn't always return language, default to English
            detected_lang = "en"
            synced_lyrics = self._match_lyrics_to_words(lyrics_lines, words, detected_lang)
            
            if synced_lyrics:
                print(f"Successfully synced {len(synced_lyrics)} lyric lines using Deepgram")
            
            # Validate and adjust timing using audio features
            if self.audio_features:
                synced_lyrics = self._validate_timing_with_audio_features(synced_lyrics)
            
            return synced_lyrics
            
        except Exception as e:
            print(f"Error in enhanced Deepgram synchronization: {e}")
            traceback.print_exc()
            return None
    
    async def _process_deepgram_enhanced(self, api_key: str):
        """Process audio with Deepgram using enhanced options"""
        try:
            deepgram = DeepgramClient(api_key)
            
            with open(self.audio_path, 'rb') as audio:
                payload = {"buffer": audio.read()}
            
            # Deepgram SDK v3.x API - base model includes word timestamps by default
            # Remove language parameter to enable auto-detection for all languages
            options = {
                "model": "nova-2",
                "smart_format": True,
                "punctuate": True,
                "utterances": True,
                "diarize": False,
                "detect_language": True
            }
            
            response = await deepgram.listen.asyncprerecorded.v("1").transcribe_file(payload, options)
            return response
            
        except Exception as e:
            print(f"Enhanced Deepgram processing error: {e}")
            traceback.print_exc()
            return None
    
    def _match_lyrics_to_words(self, lyrics_lines: List[str], words: List, detected_language: str = "en") -> List[SyncedLyric]:
        """Match lyrics lines to word sequences with improved algorithm"""
        synced_lyrics = []
        word_idx = 0
        
        for line_num, line in enumerate(lyrics_lines, 1):
            if not line.strip():
                continue
            
            # Normalize and tokenize the lyric line
            line_words = self._normalize_and_tokenize(line)
            if not line_words:
                continue
            
            # Get previous end time for proximity constraint
            previous_end_time = synced_lyrics[-1].end_time if synced_lyrics else 0
            
            # Find the best matching sequence in transcribed words
            # Note: detected_language available but not used in this branch's matching logic yet
            best_match = self._find_best_word_sequence(line_words, words, word_idx, previous_end_time)
            
            if best_match:
                start_idx, end_idx, confidence = best_match
                
                # Extract sequence of matched words
                matched_words = []
                for k in range(start_idx, end_idx + 1):
                    w = words[k]
                    if isinstance(w, dict):
                        m_word = w.get('word', w.get('text', ''))
                        m_start = w.get('start', 0)
                        m_end = w.get('end', m_start + 0.5)
                    else:
                        m_word = w.word if hasattr(w, 'word') else ''
                        m_start = w.start if hasattr(w, 'start') else 0
                        m_end = w.end if hasattr(w, 'end') else m_start + 0.5
                    matched_words.append({"word": m_word.strip(), "start": m_start, "end": m_end})

                # Extract start/end times - handle both dict and object formats
                start_word = words[start_idx]
                end_word = words[end_idx]
                
                if isinstance(start_word, dict):
                    start_time = start_word.get('start', 0)
                    end_time = end_word.get('end', start_time + 2.0)
                else:
                    start_time = start_word.start if hasattr(start_word, 'start') else 0
                    end_time = end_word.end if hasattr(end_word, 'end') else start_time + 2.0
                
                duration = end_time - start_time
                
                # CRITICAL SAFETY CHECK: If duration is still too long (shouldn't happen with our fix, but just in case)
                MAX_DURATION = 12.0
                if duration > MAX_DURATION:
                    print(f"  WARNING: Line {line_num} has excessive duration ({duration:.2f}s), capping at {MAX_DURATION}s")
                    end_time = start_time + MAX_DURATION
                    duration = MAX_DURATION
                    confidence = confidence * 0.5  # Reduce confidence
                
                print(f"  Line {line_num}: '{line[:50]}...' → {start_time:.2f}s-{end_time:.2f}s (confidence: {confidence:.2f})")
                
                synced_lyrics.append(SyncedLyric(
                    text=line,
                    start_time=start_time,
                    end_time=end_time,
                    duration=duration,
                    confidence=confidence,
                    method="enhanced_deepgram",
                    words=matched_words
                ))
                
                word_idx = end_idx + 1
            else:
                # No match found - estimate based on previous timing and ADVANCE word_idx
                print(f"  Line {line_num}: No match found, using estimation")
                if synced_lyrics:
                    last_end = synced_lyrics[-1].end_time
                    estimated_duration = max(2.0, min(len(line) * 0.05, 5.0))  # Cap at 5 seconds
                    
                    synced_lyrics.append(SyncedLyric(
                        text=line,
                        start_time=last_end + 0.5,
                        end_time=last_end + 0.5 + estimated_duration,
                        duration=estimated_duration,
                        confidence=0.3,
                        method="estimated"
                    ))
                    
                    # CRITICAL FIX: Advance word_idx to avoid getting stuck
                    # Skip ahead by estimated number of words for this line
                    estimated_words = max(3, len(line_words))
                    word_idx = min(word_idx + estimated_words, len(words) - 1)
                else:
                    synced_lyrics.append(SyncedLyric(
                        text=line,
                        start_time=5.0,  # Default start
                        end_time=7.0,
                        duration=2.0,
                        confidence=0.2,
                        method="default"
                    ))
                    word_idx = min(5, len(words) - 1)  # Skip first few words
        
        # POST-PROCESSING: Validate and fix any remaining timing issues
        synced_lyrics = self._post_process_timing(synced_lyrics)
        
        return synced_lyrics
    
    def _normalize_and_tokenize(self, text: str) -> List[str]:
        """Normalize and tokenize text for matching"""
        # Remove special characters and normalize
        normalized = re.sub(r'[^\w\s]', '', text.lower())
        return [word for word in normalized.split() if len(word) > 1]
    
    def _post_process_timing(self, synced_lyrics: List[SyncedLyric]) -> List[SyncedLyric]:
        """Post-process synchronized lyrics to fix timing issues"""
        if not synced_lyrics:
            return synced_lyrics
        
        # First pass: identify problematic sections
        problem_start_idx = None
        consecutive_large_gaps = 0
        MAX_DURATION = 12.0
        MIN_GAP = 0.1
        MAX_GAP = 10.0
        
        # Detect cascading failures (many consecutive large gaps)
        for i in range(1, len(synced_lyrics)):
            gap = synced_lyrics[i].start_time - synced_lyrics[i-1].end_time
            if gap > MAX_GAP:
                consecutive_large_gaps += 1
                if problem_start_idx is None:
                    problem_start_idx = i
            else:
                if consecutive_large_gaps > 3:
                    # We have a cascading failure - need to redistribute
                    print(f"  POST-PROCESS: Detected cascading failure starting at line {problem_start_idx+1} ({consecutive_large_gaps} bad gaps)")
                    break
                consecutive_large_gaps = 0
                problem_start_idx = None
        
        # If we detected cascading failure, redistribute those lines
        if consecutive_large_gaps > 3 and problem_start_idx is not None:
            processed = synced_lyrics[:problem_start_idx]
            failed_lines = synced_lyrics[problem_start_idx:]
            
            # Redistribute failed lines starting from last good position
            last_good_end = processed[-1].end_time if processed else 5.0
            print(f"  POST-PROCESS: Redistributing {len(failed_lines)} lines starting from {last_good_end:.2f}s")
            
            for i, lyric in enumerate(failed_lines):
                estimated_duration = max(2.0, min(len(lyric.text) * 0.04, 5.0))
                new_start = last_good_end + 0.5
                new_end = new_start + estimated_duration
                
                processed.append(SyncedLyric(
                    text=lyric.text,
                    start_time=new_start,
                    end_time=new_end,
                    duration=estimated_duration,
                    confidence=0.35,
                    method="redistributed"
                ))
                last_good_end = new_end
            
            return processed
        
        # Normal processing: fix individual issues
        processed = []
        
        for i, lyric in enumerate(synced_lyrics):
            # Fix 1: Cap excessive durations
            duration = lyric.end_time - lyric.start_time
            if duration > MAX_DURATION:
                print(f"  POST-PROCESS: Capping line {i+1} duration from {duration:.2f}s to {MAX_DURATION}s")
                lyric = SyncedLyric(
                    text=lyric.text,
                    start_time=lyric.start_time,
                    end_time=lyric.start_time + MAX_DURATION,
                    duration=MAX_DURATION,
                    confidence=lyric.confidence * 0.7,
                    method=f"{lyric.method}_capped"
                )
            
            # Fix 2: Detect and fix large gaps between consecutive lines
            if i > 0:
                prev_lyric = processed[-1]
                gap = lyric.start_time - prev_lyric.end_time
                
                # If gap is too large, it suggests a matching error
                if gap > MAX_GAP:
                    print(f"  POST-PROCESS: Large gap detected ({gap:.2f}s) between lines {i} and {i+1}")
                    # Adjust current line to start closer to previous line
                    new_start = prev_lyric.end_time + 1.0
                    new_duration = min(lyric.duration, 5.0)
                    lyric = SyncedLyric(
                        text=lyric.text,
                        start_time=new_start,
                        end_time=new_start + new_duration,
                        duration=new_duration,
                        confidence=0.4,
                        method="gap_adjusted"
                    )
                
                # If lines overlap, fix it
                elif gap < 0:
                    overlap = -gap
                    print(f"  POST-PROCESS: Fixing {overlap:.2f}s overlap between lines {i} and {i+1}")
                    lyric = SyncedLyric(
                        text=lyric.text,
                        start_time=prev_lyric.end_time + MIN_GAP,
                        end_time=prev_lyric.end_time + MIN_GAP + lyric.duration,
                        duration=lyric.duration,
                        confidence=lyric.confidence,
                        method=lyric.method
                    )
            
            processed.append(lyric)
        
        return processed
    
    def _find_best_word_sequence(self, target_words: List[str], transcribed_words: List, start_idx: int, previous_end_time: float = 0) -> Optional[Tuple[int, int, float]]:
        """Find the best matching word sequence with time duration and proximity constraints"""
        if not target_words or start_idx >= len(transcribed_words):
            return None
        
        best_match = None
        best_score = 0.0
        search_window = min(50, len(transcribed_words) - start_idx)  # Reduced search window
        
        # Maximum duration for a single lyric line (in seconds)
        MAX_LINE_DURATION = 15.0
        
        # CRITICAL: Maximum time distance from previous line (prevents jumping too far)
        MAX_TIME_DISTANCE = 20.0  # Don't search more than 20 seconds ahead
        
        for i in range(start_idx, start_idx + search_window):
            # Get start time of potential match
            start_word = transcribed_words[i]
            if isinstance(start_word, dict):
                start_time = start_word.get('start', 0)
            else:
                start_time = start_word.start if hasattr(start_word, 'start') else 0
            
            # CRITICAL: Skip if this word is too far from the previous line
            if previous_end_time > 0 and (start_time - previous_end_time) > MAX_TIME_DISTANCE:
                # Stop searching - we've gone too far
                break
            
            for j in range(i + 1, min(i + len(target_words) * 3, len(transcribed_words))):
                # CRITICAL: Check time duration FIRST before doing expensive string matching
                end_word = transcribed_words[j]
                
                # Extract timestamps
                if isinstance(end_word, dict):
                    end_time = end_word.get('end', start_time + 2.0)
                else:
                    end_time = end_word.end if hasattr(end_word, 'end') else start_time + 2.0
                
                duration = end_time - start_time
                
                # Skip if duration exceeds maximum
                if duration > MAX_LINE_DURATION:
                    continue
                
                # Extract sequence of transcribed words
                sequence = []
                for k in range(i, j + 1):
                    word_obj = transcribed_words[k]
                    
                    # Handle both dict and object formats
                    if isinstance(word_obj, dict):
                        word_text = word_obj.get('word', '')
                    elif hasattr(word_obj, 'word'):
                        word_text = word_obj.word
                    else:
                        continue
                    
                    word = re.sub(r'[^\w\s]', '', word_text.lower())
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
                
                # Duration penalty: prefer shorter matches when similarity is similar
                # Ideal duration is 2-6 seconds per line
                if duration < 2.0:
                    duration_penalty = 0.9  # Slightly penalize very short
                elif duration <= 6.0:
                    duration_penalty = 1.0  # Perfect range
                elif duration <= 10.0:
                    duration_penalty = 0.95  # Slightly penalize longer
                else:
                    duration_penalty = 0.85  # Penalize very long
                
                # Proximity bonus: prefer matches closer to previous line
                if previous_end_time > 0:
                    time_gap = start_time - previous_end_time
                    if time_gap < 0:
                        proximity_bonus = 0.8  # Penalize overlaps
                    elif time_gap <= 2.0:
                        proximity_bonus = 1.0  # Perfect gap
                    elif time_gap <= 5.0:
                        proximity_bonus = 0.95  # Good gap
                    elif time_gap <= 10.0:
                        proximity_bonus = 0.85  # Acceptable gap
                    else:
                        proximity_bonus = 0.7  # Large gap penalty
                else:
                    proximity_bonus = 1.0
                
                # Combined score with duration and proximity consideration
                score = (similarity * 0.7 + length_bonus * 0.3) * duration_penalty * proximity_bonus
                
                # Lower threshold to 0.5 for better matching with slang/variations
                if score > best_score and score > 0.5:
                    best_score = score
                    best_match = (i, j, score)
        
        return best_match
    
    def _synchronize_with_utterances(self, response, lyrics_lines: List[str]) -> Optional[List[SyncedLyric]]:
        """Fallback: Use Deepgram utterances instead of word-level matching"""
        try:
            # Extract utterances from response
            utterances = []
            if hasattr(response.results, 'utterances') and response.results.utterances:
                utterances = response.results.utterances
            
            if not utterances:
                print("No utterances found in Deepgram response")
                return None
            
            print(f"Using utterance-based sync with {len(utterances)} utterances for {len(lyrics_lines)} lyrics")
            
            # Match lyrics to utterances
            synced_lyrics = []
            utterance_idx = 0
            
            for line_num, line in enumerate(lyrics_lines, 1):
                if not line.strip():
                    continue
                
                # Find best matching utterance
                best_match = None
                best_score = 0
                
                # Search next 3 utterances
                for i in range(min(3, len(utterances) - utterance_idx)):
                    if utterance_idx + i >= len(utterances):
                        break
                    
                    utterance = utterances[utterance_idx + i]
                    
                    # Get utterance text
                    if isinstance(utterance, dict):
                        utt_text = utterance.get('transcript', '')
                        utt_start = utterance.get('start', 0)
                        utt_end = utterance.get('end', utt_start + 2.0)
                    else:
                        utt_text = utterance.transcript if hasattr(utterance, 'transcript') else ''
                        utt_start = utterance.start if hasattr(utterance, 'start') else 0
                        utt_end = utterance.end if hasattr(utterance, 'end') else utt_start + 2.0
                    
                    # Calculate similarity
                    similarity = SequenceMatcher(None, line.lower(), utt_text.lower()).ratio()
                    
                    if similarity > best_score:
                        best_score = similarity
                        best_match = (utterance_idx + i, utt_start, utt_end, similarity)
                
                if best_match and best_score > 0.4:
                    idx, start_time, end_time, confidence = best_match
                    print(f"  Line {line_num}: '{line[:50]}...' → {start_time:.2f}s-{end_time:.2f}s (confidence: {confidence:.2f})")
                    
                    synced_lyrics.append(SyncedLyric(
                        text=line,
                        start_time=start_time,
                        end_time=end_time,
                        duration=end_time - start_time,
                        confidence=confidence,
                        method="utterance_based"
                    ))
                    utterance_idx = idx + 1
                else:
                    # Estimate timing
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
                        utterance_idx = min(utterance_idx + 1, len(utterances) - 1)
                    else:
                        synced_lyrics.append(SyncedLyric(
                            text=line,
                            start_time=5.0,
                            end_time=7.0,
                            duration=2.0,
                            confidence=0.2,
                            method="default"
                        ))
            
            if synced_lyrics:
                print(f"Successfully synced {len(synced_lyrics)} lyric lines using utterances")
            
            return synced_lyrics
            
        except Exception as e:
            print(f"Error in utterance-based sync: {e}")
            traceback.print_exc()
            return None
    
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
            print(f"DEBUG: Using vocal segments - first segment starts at {intro_time:.2f}s")
        else:
            # Try to detect vocal start using onset analysis
            if self.audio_features and self.audio_features.onset_times is not None and len(self.audio_features.onset_times) > 0:
                # Look for sustained activity (likely vocal start)
                onset_times = self.audio_features.onset_times
                print(f"DEBUG: Found {len(onset_times)} onsets, first at {onset_times[0]:.2f}s")
                
                # Find first cluster of onsets (likely vocal start)
                intro_time = 5.0  # Default
                for i in range(len(onset_times) - 5):
                    # Check if we have sustained activity (5+ onsets within 10 seconds)
                    if onset_times[i+4] - onset_times[i] < 10.0:
                        intro_time = max(5.0, onset_times[i] - 2.0)  # Start slightly before
                        print(f"DEBUG: Vocal start detected from onset analysis: {onset_times[i]:.2f}s")
                        break
            else:
                intro_time = min(15, duration * 0.15)
                print(f"DEBUG: Using fallback intro time: {intro_time:.2f}s")
            
            available_time = duration - intro_time - 5
        
        print(f"Improved sync: intro={intro_time:.2f}s, available={available_time:.2f}s")
        
        # Calculate timing
        time_per_line = available_time / len(non_empty_lines)
        time_per_line = max(1.5, min(time_per_line, 4.0))
        
        print(f"DEBUG: Distributing {len(non_empty_lines)} lines over {available_time:.2f}s (~{time_per_line:.2f}s per line)")
        
        synced_lyrics = []
        current_time = intro_time
        
        for i, line in enumerate(non_empty_lines, 1):
            # Adjust duration based on line characteristics
            line_length_factor = len(line) / 30
            duration = max(1.5, min(time_per_line * line_length_factor, 5.0))
            
            # Shorter lines get less time
            if len(line) < 5:
                duration = max(1.0, duration * 0.6)
            elif len(line) > 50:
                duration = min(6.0, duration * 1.2)
            
            print(f"DEBUG: Line {i}: '{line[:40]}...' → {current_time:.2f}s-{current_time + duration:.2f}s (duration: {duration:.2f}s)")
            
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


def synchronize_lyrics_advanced(audio_path: str, lyrics_lines: List[str] = None, lyrics_source: str = None) -> List[Dict]:
    """
    Main function to synchronize lyrics using advanced methods.
    Returns list of dicts compatible with existing code.
    
    Args:
        audio_path: Path to audio file
        lyrics_lines: List of lyric lines (None for Groq-only mode)
        lyrics_source: Name of lyrics service ("Musixmatch", "Genius", etc.)
    
    If lyrics_lines is None, uses Groq transcription as lyrics (Groq-only mode).
    """
    synchronizer = AdvancedLyricSynchronizer(audio_path)
    
    # Analyze audio features
    synchronizer.analyze_audio()
    
    # Synchronize lyrics (handles None for Groq-only mode)
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
            "method": lyric.method,
            "words": lyric.words if hasattr(lyric, 'words') else []
        })
    
    # Determine the mode description for logging
    if lyrics_lines is None:
        mode = "Groq-only (transcription as lyrics)"
    elif lyrics_source:
        mode = f"{lyrics_source}+Groq matching"
    else:
        mode = "Lyrics+Groq matching"  # Generic fallback if source unknown
    
    print(f"Advanced synchronization complete: {len(result)} lyrics synced ({mode})")
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
