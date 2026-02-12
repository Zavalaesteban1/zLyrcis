"""
Debug script to help identify why audio is being skipped in the video generation process.
"""

import os
import subprocess
import traceback

def debug_ffmpeg_command():
    """
    Function to debug FFmpeg commands by creating a test video with audio.
    """
    try:
        # Create temporary files
        temp_dir = os.path.join(os.getcwd(), 'debug_output')
        os.makedirs(temp_dir, exist_ok=True)
        
        audio_path = os.path.join(temp_dir, 'test_audio.mp3')
        black_video = os.path.join(temp_dir, 'black_video.mp4')
        output_video = os.path.join(temp_dir, 'output_video.mp4')
        
        # Create a test audio file
        subprocess.run([
            'ffmpeg',
            '-f', 'lavfi',
            '-i', 'sine=frequency=440:duration=5',
            '-c:a', 'libmp3lame',
            '-y',
            audio_path
        ], check=True, capture_output=True)
        
        print(f"Created test audio file at {audio_path}")
        
        # Create black video with audio
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
        ], check=True, capture_output=True)
        
        print(f"Created black video with audio at {black_video}")
        
        # Check if the video has audio
        audio_check = subprocess.run([
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'a',
            '-show_streams',
            '-of', 'json',
            black_video
        ], capture_output=True, text=True)
        
        print(f"Audio check result: {audio_check.stdout}")
        
        # Create a simple subtitle file
        subtitle_file = os.path.join(temp_dir, 'subtitles.srt')
        with open(subtitle_file, 'w') as f:
            f.write("1\n00:00:01,000 --> 00:00:04,000\nTest Subtitle\n\n")
        
        # Add subtitles to video
        subprocess.run([
            'ffmpeg',
            '-i', black_video,
            '-vf', f"subtitles={subtitle_file}:force_style='FontName=Arial,FontSize=36,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,Bold=1,Alignment=2,MarginV=30'",
            '-c:v', 'libx264',
            '-preset', 'medium',
            '-c:a', 'copy',
            '-y',
            output_video
        ], check=True, capture_output=True)
        
        print(f"Added subtitles to video: {output_video}")
        
        # Final audio check
        final_check = subprocess.run([
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'a',
            '-show_streams',
            '-of', 'json',
            output_video
        ], capture_output=True, text=True)
        
        print(f"Final audio check result: {final_check.stdout}")
        
        return True
    except Exception as e:
        print(f"Error in debug_ffmpeg_command: {str(e)}")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    debug_ffmpeg_command() 