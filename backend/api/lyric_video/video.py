"""
Functions for generating lyric videos.
"""
import os
import logging
import tempfile
import random
import subprocess
from django.conf import settings
from pathlib import Path
from .exceptions import VideoGenerationError

logger = logging.getLogger(__name__)

class VideoGenerator:
    """Class for generating lyric videos."""
    
    def __init__(self, song_info, audio_path, lyrics_timings, temp_dir=None):
        """
        Initialize the video generator.
        
        Args:
            song_info (dict): Song information
            audio_path (str): Path to audio file
            lyrics_timings (list): List of dictionaries with line text and timing information
            temp_dir (str, optional): Path to temporary directory
        """
        self.song_info = song_info
        self.audio_path = audio_path
        self.lyrics_timings = lyrics_timings
        self.temp_dir = temp_dir or tempfile.mkdtemp()
        
        # Set default video properties
        self.video_width = 1280
        self.video_height = 720
        self.font = self._get_system_font()
        self.font_size = 48
        self.subtitle_file = None
        
    def _get_system_font(self):
        """
        Get a suitable font from the system.
        
        Returns:
            str: Path to font file
        """
        # Common font locations by OS
        font_locations = {
            'darwin': [  # macOS
                '/System/Library/Fonts/Helvetica.ttc',
                '/Library/Fonts/Arial.ttf',
                '/System/Library/Fonts/SFNSDisplay.ttf'
            ],
            'linux': [  # Linux
                '/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf',
                '/usr/share/fonts/TTF/Arial.ttf',
                '/usr/share/fonts/truetype/freefont/FreeSans.ttf'
            ],
            'win32': [  # Windows
                'C:\\Windows\\Fonts\\Arial.ttf',
                'C:\\Windows\\Fonts\\Verdana.ttf',
                'C:\\Windows\\Fonts\\Calibri.ttf'
            ]
        }
        
        # Try to find a suitable font
        import platform
        system = platform.system().lower()
        
        if system == 'darwin':
            os_key = 'darwin'
        elif system == 'linux':
            os_key = 'linux'
        elif system == 'windows':
            os_key = 'win32'
        else:
            os_key = 'linux'  # Default to Linux
            
        # Check each font path
        for font_path in font_locations.get(os_key, []):
            if os.path.exists(font_path):
                return font_path
                
        # If no system font found, use a fallback from project
        project_font = os.path.join(settings.BASE_DIR, 'static', 'fonts', 'OpenSans-Regular.ttf')
        if os.path.exists(project_font):
            return project_font
            
        # Last resort: return a common font name and hope FFmpeg can find it
        return 'Arial'
        
    def create_subtitle_file(self):
        """
        Create an SRT subtitle file from the timings.
        
        Returns:
            str: Path to subtitle file
        """
        subtitle_path = os.path.join(self.temp_dir, 'subtitles.srt')
        
        with open(subtitle_path, 'w', encoding='utf-8') as f:
            for i, timing in enumerate(self.lyrics_timings):
                # Convert seconds to SRT format (HH:MM:SS,mmm)
                start_str = self._seconds_to_srt_time(timing['start'])
                end_str = self._seconds_to_srt_time(timing['end'])
                
                # Write the subtitle entry
                f.write(f"{i+1}\n")
                f.write(f"{start_str} --> {end_str}\n")
                f.write(f"{timing['text']}\n\n")
                
        logger.info(f"Created subtitle file at {subtitle_path}")
        self.subtitle_file = subtitle_path
        return subtitle_path
        
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
    
    def generate_background(self):
        """
        Generate a background video with a color gradient.
        
        Returns:
            str: Path to generated background
        """
        background_path = os.path.join(self.temp_dir, 'background.mp4')
        
        # Generate a random gradient direction and colors
        direction = random.choice(['tb', 'bt', 'lr', 'rl'])  # top-bottom, bottom-top, left-right, right-left
        color1 = self._generate_color()
        color2 = self._generate_color()
        
        # Get audio duration
        duration_cmd = [
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', self.audio_path
        ]
        
        try:
            result = subprocess.run(duration_cmd, capture_output=True, text=True)
            duration = float(result.stdout.strip())
        except Exception as e:
            logger.error(f"Error getting audio duration: {e}")
            duration = 240.0  # Default to 4 minutes
        
        # Create a background video with gradient
        cmd = [
            'ffmpeg', '-y',
            '-f', 'lavfi',
            '-i', f'color=c={color1}:s={self.video_width}x{self.video_height}:d={duration}',
            '-vf', f'geq=r=\'r(X,Y)\':g=\'g(X,Y)\':b=\'b(X,Y)\'',
            '-c:v', 'libx264', '-tune', 'stillimage', '-pix_fmt', 'yuv420p',
            background_path
        ]
        
        try:
            subprocess.run(cmd, check=True, capture_output=True)
            logger.info(f"Created background video at {background_path}")
            return background_path
        except subprocess.CalledProcessError as e:
            logger.error(f"Error creating background: {e}")
            raise VideoGenerationError(f"Failed to create background video: {e}")
            
    @staticmethod
    def _generate_color():
        """
        Generate a random color in hex format.
        
        Returns:
            str: Color in hex format
        """
        r = random.randint(20, 200)  # Avoid too dark or too bright
        g = random.randint(20, 200)
        b = random.randint(20, 200)
        return f"0x{r:02x}{g:02x}{b:02x}"
    
    def generate_video(self, output_path):
        """
        Generate the lyric video.
        
        Args:
            output_path (str): Path to save the generated video
            
        Returns:
            str: Path to the generated video
            
        Raises:
            VideoGenerationError: If video generation fails
        """
        logger.info("Starting video generation")
        
        # Create subtitle file if not already created
        if not self.subtitle_file:
            self.create_subtitle_file()
            
        # Create a temporary background video
        background_path = self.generate_background()
        
        # Add artist and title overlay
        title_text = f"{self.song_info['title']} - {self.song_info['artist']}"
        
        # Prepare FFmpeg command
        cmd = [
            'ffmpeg', '-y',
            '-i', background_path,
            '-i', self.audio_path,
            '-vf', (
                f"subtitles='{self.subtitle_file}':force_style="
                f"'FontName={self.font},FontSize={self.font_size},PrimaryColour=white,"
                f"Alignment=10,BackColour=&H80000000,BorderStyle=4',"
                f"drawtext=text='{title_text}':fontfile='{self.font}':"
                f"fontsize={(self.font_size//2)}:fontcolor=white:x=(w-text_w)/2:y=h*0.05"
            ),
            '-c:v', 'libx264', '-preset', 'medium', '-crf', '22',
            '-c:a', 'aac', '-b:a', '192k',
            '-shortest',
            output_path
        ]
        
        try:
            # Run FFmpeg
            subprocess.run(cmd, check=True, capture_output=True)
            logger.info(f"Successfully generated video at {output_path}")
            return output_path
        except subprocess.CalledProcessError as e:
            logger.error(f"Error generating video: {e}")
            logger.error(f"FFmpeg stderr: {e.stderr}")
            raise VideoGenerationError(f"Failed to generate video: {e}")
