"""
Functions for synchronizing lyrics with audio.
"""
import os
import json
import logging
import tempfile
import subprocess
import numpy as np
from .exceptions import SynchronizationError

# Make librosa import optional
try:
    import librosa
    LIBROSA_AVAILABLE = True
except ImportError:
    LIBROSA_AVAILABLE = False
    print("librosa is not available. Some advanced synchronization features will be disabled.")

logger = logging.getLogger(__name__)

class LyricSynchronizer:
    """Class for synchronizing lyrics with audio."""
    
    def __init__(self, lyrics, audio_path, song_info=None, temp_dir=None):
        """
        Initialize the lyric synchronizer.
        
        Args:
            lyrics (str or list): Lyrics text or list of lines
            audio_path (str): Path to audio file
            song_info (dict, optional): Song information
            temp_dir (str, optional): Path to temporary directory
        """
        self.audio_path = audio_path
        self.song_info = song_info or {}
        self.temp_dir = temp_dir or tempfile.mkdtemp()
        
        # Convert lyrics to list of lines if it's a string
        if isinstance(lyrics, str):
            self.lyrics = [line.strip() for line in lyrics.split('\n') if line.strip()]
        else:
            self.lyrics = lyrics
            
        # Initialize empty timings
        self.timings = []
        
    def synchronize(self, vocal_start=None):
        """
        Synchronize lyrics with audio using the best available method.
        
        Args:
            vocal_start (float, optional): Time in seconds when vocals start
            
        Returns:
            list: List of dictionaries with line text and timing information
            
        Raises:
            SynchronizationError: If synchronization fails
        """
        logger.info("Starting lyrics synchronization")
        
        # Try all methods in order of reliability
        methods = [
            self._sync_with_aeneas,
            self._sync_with_audio_analysis,
            self._sync_with_forced_alignment,
            self._sync_with_uniform_distribution
        ]
        
        for method in methods:
            try:
                logger.info(f"Trying sync method: {method.__name__}")
                timings = method(vocal_start)
                if timings and len(timings) == len(self.lyrics):
                    self.timings = timings
                    logger.info(f"Successfully synchronized lyrics using {method.__name__}")
                    return timings
            except Exception as e:
                logger.warning(f"Method {method.__name__} failed: {e}")
        
        # If all methods fail, use a simple distribution as fallback
        logger.warning("All synchronization methods failed, using fallback")
        self.timings = self._create_fallback_timings(vocal_start)
        return self.timings
    
    def _sync_with_aeneas(self, vocal_start=0.0):
        """
        Synchronize lyrics using aeneas forced alignment tool.
        
        Args:
            vocal_start (float): Time when vocals start
            
        Returns:
            list: List of timings
        """
        try:
            # Import aeneas if available
            import aeneas.tools.execute_task as execute_task
            
            # Create temporary files
            text_file = os.path.join(self.temp_dir, "lyrics.txt")
            timings_file = os.path.join(self.temp_dir, "map.json")
            
            # Write lyrics to text file
            with open(text_file, "w", encoding="utf-8") as f:
                for i, line in enumerate(self.lyrics):
                    f.write(f"{i+1} {line}\n")
            
            # Run aeneas
            config = [
                "task_language=eng",
                "is_text_type=plain",
                "is_audio_file_head_min=0",
                f"is_audio_file_head_max={vocal_start}",
                "task_adjust_boundary_algorithm=auto",
                "os_task_file_format=json",
                "task_adjust_boundary_adjacent_multiplier=4.000"
            ]
            
            task = execute_task.ExecuteTask(use_sys=False)
            task.execute([
                self.audio_path,
                text_file,
                "task_language=eng|os_task_file_format=json|is_text_type=plain",
                timings_file
            ])
            
            # Read the output
            with open(timings_file, "r", encoding="utf-8") as f:
                data = json.load(f)
            
            # Extract timings
            fragments = data.get("fragments", [])
            if not fragments or len(fragments) != len(self.lyrics):
                logger.warning(f"Aeneas returned {len(fragments)} fragments for {len(self.lyrics)} lines")
                return None
                
            timings = []
            for fragment in fragments:
                start = float(fragment["begin"]) + vocal_start
                end = float(fragment["end"]) + vocal_start
                text = fragment["lines"][0]
                timings.append({"text": text, "start": start, "end": end})
            
            return timings
        except Exception as e:
            logger.error(f"Error in aeneas synchronization: {e}")
            raise SynchronizationError(f"Aeneas synchronization failed: {e}")
    
    def _sync_with_audio_analysis(self, vocal_start=0.0):
        """
        Synchronize lyrics using audio beat detection and energy analysis.
        
        Args:
            vocal_start (float): Time when vocals start
            
        Returns:
            list: List of timings
        """
        try:
            if not LIBROSA_AVAILABLE:
                logger.warning("Librosa not available, skipping audio analysis synchronization method")
                return None
                
            # Load audio
            y, sr = librosa.load(self.audio_path, sr=None)
            
            # Get beats and tempo
            tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
            beat_times = librosa.frames_to_time(beat_frames, sr=sr)
            
            # Filter beats to start at vocal_start
            beat_times = beat_times[beat_times >= vocal_start]
            
            # If not enough beats, add some
            if len(beat_times) < len(self.lyrics):
                logger.warning(f"Not enough beats detected: {len(beat_times)} < {len(self.lyrics)}")
                
                # Calculate the average beat duration
                if len(beat_times) > 1:
                    avg_beat_duration = (beat_times[-1] - beat_times[0]) / (len(beat_times) - 1)
                else:
                    avg_beat_duration = 60.0 / tempo  # Convert tempo to seconds per beat
                
                # Add beats
                last_beat = beat_times[-1] if len(beat_times) > 0 else vocal_start
                additional_beats = [last_beat + (i+1) * avg_beat_duration for i in range(len(self.lyrics) - len(beat_times))]
                beat_times = np.append(beat_times, additional_beats)
            
            # Assign timings based on beat positions and line lengths
            timings = []
            for i, line in enumerate(self.lyrics):
                # Use line length to determine how many beats it should take
                line_length = len(line)
                beats_needed = max(1, min(4, line_length // 10))  # Between 1 and 4 beats
                
                if i + beats_needed < len(beat_times):
                    start = beat_times[i]
                    end = beat_times[i + beats_needed]
                else:
                    # For the last lines, distribute the remaining time
                    remaining_lines = len(self.lyrics) - i
                    remaining_time = beat_times[-1] - beat_times[i]
                    time_per_line = remaining_time / remaining_lines
                    start = beat_times[i]
                    end = start + time_per_line
                
                timings.append({"text": line, "start": start, "end": end})
            
            return timings
        except Exception as e:
            logger.error(f"Error in audio analysis synchronization: {e}")
            return None
    
    def _sync_with_forced_alignment(self, vocal_start=0.0):
        """
        Synchronize lyrics using Montreal Forced Aligner (if available).
        
        Args:
            vocal_start (float): Time when vocals start
            
        Returns:
            list: List of timings
        """
        # This is a placeholder for a more complex implementation
        # Montreal Forced Aligner would require more setup and processing
        logger.warning("Montreal Forced Aligner not implemented yet")
        return None
    
    def _sync_with_uniform_distribution(self, vocal_start=0.0):
        """
        Synchronize lyrics by distributing them evenly across the audio.
        
        Args:
            vocal_start (float): Time when vocals start
            
        Returns:
            list: List of timings
        """
        try:
            # Get audio duration
            duration = librosa.get_duration(filename=self.audio_path)
            
            # Set end time to 95% of total duration to avoid running past the end
            end_time = 0.95 * duration
            
            # Calculate available time for lyrics
            available_time = end_time - vocal_start
            
            # Distribute time based on line lengths
            total_chars = sum(len(line) for line in self.lyrics)
            
            timings = []
            current_time = vocal_start
            
            for line in self.lyrics:
                # Allocate time proportional to line length
                line_duration = (len(line) / total_chars) * available_time
                
                # Set minimum duration
                line_duration = max(line_duration, 1.5)  # Minimum 1.5 seconds per line
                
                start = current_time
                end = current_time + line_duration
                current_time = end
                
                timings.append({"text": line, "start": start, "end": end})
            
            return timings
        except Exception as e:
            logger.error(f"Error in uniform distribution synchronization: {e}")
            raise SynchronizationError(f"Uniform distribution synchronization failed: {e}")
    
    def _create_fallback_timings(self, vocal_start=0.0):
        """
        Create fallback timings when all other methods fail.
        
        Args:
            vocal_start (float): Time when vocals start
            
        Returns:
            list: List of timings
        """
        try:
            # Estimate audio duration
            try:
                duration = librosa.get_duration(filename=self.audio_path)
            except:
                # If librosa fails, use a default duration based on typical song length
                duration = 210.0  # 3.5 minutes
            
            # Set end time to 95% of total duration
            end_time = 0.95 * duration
            
            # Equal distribution
            available_time = end_time - vocal_start
            time_per_line = available_time / len(self.lyrics)
            
            timings = []
            for i, line in enumerate(self.lyrics):
                start = vocal_start + i * time_per_line
                end = start + time_per_line
                timings.append({"text": line, "start": start, "end": end})
            
            return timings
        except Exception as e:
            logger.error(f"Error creating fallback timings: {e}")
            
            # Last resort: hard-coded timing
            timings = []
            for i, line in enumerate(self.lyrics):
                # Assume 3 seconds per line starting at vocal_start
                start = vocal_start + i * 3.0
                end = start + 3.0
                timings.append({"text": line, "start": start, "end": end})
            
            return timings
    
    def create_subtitle_file(self, output_path):
        """
        Create an SRT subtitle file from the timings.
        
        Args:
            output_path (str): Path to save the SRT file
            
        Returns:
            str: Path to the created file
            
        Raises:
            SynchronizationError: If subtitles cannot be created
        """
        if not self.timings:
            raise SynchronizationError("No timings available. Run synchronize() first.")
            
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                for i, timing in enumerate(self.timings):
                    # Convert seconds to SRT format (HH:MM:SS,mmm)
                    start_str = self._seconds_to_srt_time(timing['start'])
                    end_str = self._seconds_to_srt_time(timing['end'])
                    
                    # Write the subtitle entry
                    f.write(f"{i+1}\n")
                    f.write(f"{start_str} --> {end_str}\n")
                    f.write(f"{timing['text']}\n\n")
                    
            logger.info(f"Created subtitle file at {output_path}")
            return output_path
        except Exception as e:
            logger.error(f"Error creating subtitle file: {e}")
            raise SynchronizationError(f"Failed to create subtitle file: {e}")
    
    @staticmethod
    def _seconds_to_srt_time(seconds):
        """
        Convert seconds to SRT time format (HH:MM:SS,mmm).
        
        Args:
            seconds (float): Time in seconds
            
        Returns:
            str: Formatted time string
        """
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        seconds = seconds % 60
        milliseconds = int((seconds - int(seconds)) * 1000)
        
        return f"{hours:02d}:{minutes:02d}:{int(seconds):02d},{milliseconds:03d}"
