"""
Debug script to test the video generation process with audio.
This script will create a test video with audio to verify that FFmpeg is working correctly.
"""

import os
import subprocess
import tempfile
import json
from django.conf import settings
import sys
import traceback

# Add the Django project to the path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lyric_video_project.settings')

import django
django.setup()

def debug_video_generation():
    """Test the video generation process with audio."""
    try:
        # Create a temporary directory
        with tempfile.TemporaryDirectory() as temp_dir:
            print(f"Created temporary directory: {temp_dir}")
            
            # Create a test audio file
            audio_path = os.path.join(temp_dir, 'test_audio.mp3')
            print(f"Creating test audio file at {audio_path}")
            
            subprocess.run([
                'ffmpeg',
                '-f', 'lavfi',
                '-i', 'sine=frequency=440:duration=5',
                '-c:a', 'libmp3lame',
                '-y',
                audio_path
            ], check=True)
            
            print(f"Created test audio file: {os.path.exists(audio_path)}")
            if os.path.exists(audio_path):
                print(f"Audio file size: {os.path.getsize(audio_path)} bytes")
            
            # Verify audio file
            audio_check = subprocess.run([
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                audio_path
            ], capture_output=True, text=True)
            
            print(f"Audio duration: {audio_check.stdout.strip() if audio_check.stdout else 'Unknown'}")
            
            # Create a black video with audio
            black_video = os.path.join(temp_dir, 'black.mp4')
            print(f"Creating black video with audio at {black_video}")
            
            subprocess.run([
                'ffmpeg',
                '-f', 'lavfi',
                '-i', 'color=c=black:s=1280x720:d=5',
                '-i', audio_path,
                '-c:v', 'libx264',
                '-tune', 'stillimage',
                '-pix_fmt', 'yuv420p',
                '-c:a', 'aac',
                '-b:a', '192k',
                '-shortest',
                '-r', '30',
                '-y',
                black_video
            ], check=True)
            
            print(f"Created black video: {os.path.exists(black_video)}")
            if os.path.exists(black_video):
                print(f"Video file size: {os.path.getsize(black_video)} bytes")
            
            # Check if the video has audio
            audio_check = subprocess.run([
                'ffprobe',
                '-v', 'error',
                '-select_streams', 'a',
                '-show_streams',
                '-of', 'json',
                black_video
            ], capture_output=True, text=True)
            
            print(f"Audio streams in video: {audio_check.stdout}")
            
            # Create a simple subtitle file
            subtitle_file = os.path.join(temp_dir, 'subtitles.srt')
            with open(subtitle_file, 'w') as f:
                f.write("1\n00:00:01,000 --> 00:00:04,000\nTest Subtitle\n\n")
            
            # Add subtitles to video
            output_video = os.path.join(temp_dir, 'output.mp4')
            print(f"Adding subtitles to video at {output_video}")
            
            subprocess.run([
                'ffmpeg',
                '-i', black_video,
                '-vf', f"subtitles={subtitle_file}:force_style='FontName=Arial,FontSize=36,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,Bold=1,Alignment=2,MarginV=30'",
                '-c:v', 'libx264',
                '-preset', 'medium',
                '-c:a', 'copy',
                '-y',
                output_video
            ], check=True)
            
            print(f"Created output video: {os.path.exists(output_video)}")
            if os.path.exists(output_video):
                print(f"Output video file size: {os.path.getsize(output_video)} bytes")
            
            # Final check for audio
            final_check = subprocess.run([
                'ffprobe',
                '-v', 'error',
                '-select_streams', 'a',
                '-show_streams',
                '-of', 'json',
                output_video
            ], capture_output=True, text=True)
            
            print(f"Final audio check: {final_check.stdout}")
            
            # Copy the output video to a location outside the temp directory
            final_output = os.path.join(settings.MEDIA_ROOT, 'debug_video.mp4')
            print(f"Copying output video to {final_output}")
            
            subprocess.run(['cp', output_video, final_output], check=True)
            
            print(f"Debug video created at {final_output}")
            print(f"Access URL: {settings.MEDIA_URL}debug_video.mp4")
            
            return True
    except Exception as e:
        print(f"Error in debug_video_generation: {str(e)}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    debug_video_generation() 