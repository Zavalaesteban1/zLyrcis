"""
Fix script to troubleshoot and repair audio issues in the video generation process.
This script helps identify why audio is being skipped and fixes videos without audio.
"""

import os
import subprocess
import tempfile
import sys
import traceback
import glob
import django
from django.conf import settings
import youtube_dl
import requests
import soundcloud
from pydub import AudioSegment
from pydub.generators import Sine

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lyric_video_project.settings')
django.setup()

from api.models import VideoJob

def repair_video_without_audio(video_path):
    """
    Attempt to repair a video that has no audio track by adding a default audio track.
    
    Args:
        video_path: Path to the video file that needs repair
    
    Returns:
        str: Path to the repaired video file or None if repair failed
    """
    try:
        if not os.path.exists(video_path):
            print(f"Error: Video file does not exist at {video_path}")
            return None
        
        print(f"Checking video at {video_path}")
        print(f"Video file size: {os.path.getsize(video_path)} bytes")
        
        # Check if the video has audio
        audio_check = subprocess.run([
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'a',
            '-show_streams',
            '-of', 'json',
            video_path
        ], capture_output=True, text=True)
        
        print(f"Audio streams check result: {audio_check.stdout}")
        
        # If no audio is found or audio streams is empty
        no_audio = audio_check.stdout.strip() == '{\n    "streams": [\n\n    ]\n}' or '"streams": []' in audio_check.stdout
        
        if no_audio:
            print("No audio detected in video. Generating repair.")
            
            # Get video duration
            duration_check = subprocess.run([
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                video_path
            ], capture_output=True, text=True)
            
            video_duration = 60  # Default to 60 seconds if we can't determine duration
            if duration_check.stdout.strip():
                video_duration = float(duration_check.stdout.strip())
                
            print(f"Video duration: {video_duration} seconds")
            
            with tempfile.TemporaryDirectory() as temp_dir:
                # Create a temporary audio file
                temp_audio = os.path.join(temp_dir, 'temp_audio.mp3')
                subprocess.run([
                    'ffmpeg',
                    '-f', 'lavfi',
                    '-i', f'sine=frequency=440:duration={video_duration}',
                    '-c:a', 'libmp3lame',
                    '-b:a', '192k',
                    '-y',
                    temp_audio
                ], check=True)
                
                # Create output filename
                base_name = os.path.basename(video_path)
                dir_name = os.path.dirname(video_path)
                name, ext = os.path.splitext(base_name)
                repaired_video = os.path.join(dir_name, f"{name}_fixed{ext}")
                
                # Combine video with new audio
                subprocess.run([
                    'ffmpeg',
                    '-i', video_path,
                    '-i', temp_audio,
                    '-c:v', 'copy',
                    '-c:a', 'aac',
                    '-b:a', '192k',
                    '-shortest',
                    '-y',
                    repaired_video
                ], check=True)
                
                # Verify the fixed video has audio
                audio_check = subprocess.run([
                    'ffprobe',
                    '-v', 'error',
                    '-select_streams', 'a',
                    '-show_streams',
                    '-of', 'json',
                    repaired_video
                ], capture_output=True, text=True)
                
                if '"streams": [' in audio_check.stdout and len(audio_check.stdout) > 15:
                    print(f"Successfully added audio to video! Saved at {repaired_video}")
                    return repaired_video
                else:
                    print(f"Failed to add audio to video.")
                    return None
        else:
            print("Video already has audio. No repair needed.")
            return video_path
            
    except Exception as e:
        print(f"Error repairing video: {str(e)}")
        traceback.print_exc()
        return None

def fix_all_videos_in_media():
    """Fix all videos in the media directory that are missing audio."""
    try:
        # Get all mp4 files in the media directory
        media_root = settings.MEDIA_ROOT
        video_files = glob.glob(os.path.join(media_root, '**/*.mp4'), recursive=True)
        
        print(f"Found {len(video_files)} video files in media directory")
        
        fixed_count = 0
        for video_path in video_files:
            print(f"\nProcessing video: {video_path}")
            repaired_path = repair_video_without_audio(video_path)
            
            if repaired_path and repaired_path != video_path:
                fixed_count += 1
                
                # Update the job if possible
                try:
                    video_name = os.path.basename(video_path)
                    job_id = os.path.splitext(video_name)[0]
                    if job_id.isdigit():
                        job = VideoJob.objects.filter(id=int(job_id)).first()
                        if job:
                            # Update the job with the new video
                            with open(repaired_path, 'rb') as f:
                                job.video_file.save(f"{job.id}_fixed.mp4", f)
                            print(f"Updated job {job.id} with fixed video")
                except Exception as e:
                    print(f"Error updating job: {str(e)}")
        
        print(f"\nFixed {fixed_count} videos out of {len(video_files)}")
        return fixed_count
            
    except Exception as e:
        print(f"Error fixing videos: {str(e)}")
        traceback.print_exc()
        return 0

def fix_job_videos(job_ids=None):
    """Fix video files for specific job IDs or all completed jobs."""
    try:
        if job_ids:
            jobs = VideoJob.objects.filter(id__in=job_ids, status='completed')
        else:
            jobs = VideoJob.objects.filter(status='completed')
        
        print(f"Found {jobs.count()} completed jobs to check")
        
        fixed_count = 0
        for job in jobs:
            if not job.video_file:
                print(f"Job {job.id} has no video file. Skipping.")
                continue
                
            video_path = job.video_file.path
            print(f"\nProcessing job {job.id} video: {video_path}")
            
            repaired_path = repair_video_without_audio(video_path)
            if repaired_path and repaired_path != video_path:
                fixed_count += 1
                # Update the job with the new video
                with open(repaired_path, 'rb') as f:
                    job.video_file.save(f"{job.id}_fixed.mp4", f)
                print(f"Updated job {job.id} with fixed video")
        
        print(f"\nFixed {fixed_count} videos out of {jobs.count()} jobs")
        return fixed_count
        
    except Exception as e:
        print(f"Error fixing job videos: {str(e)}")
        traceback.print_exc()
        return 0

def get_youtube_audio(song_title, artist):
    """Download audio from YouTube"""
    search_query = f"{song_title} {artist} official audio"
    
    # Using yt-dlp which is already in your code
    ydl_opts = {
        'format': 'bestaudio/best',
        'postprocessors': [{
            'key': 'FFmpegExtractAudio',
            'preferredcodec': 'mp3',
            'preferredquality': '192',
        }],
        'outtmpl': output_path,
        'quiet': True,
    }
    
    with youtube_dl.YoutubeDL(ydl_opts) as ydl:
        info = ydl.extract_info(f"ytsearch:{search_query}", download=True)
        return output_path

def get_local_audio(song_title, artist):
    """Find a matching track in a local library"""
    library_path = "/path/to/your/music/library"
    
    # Simple search by filename
    for root, dirs, files in os.walk(library_path):
        for file in files:
            if file.endswith(".mp3") and song_title.lower() in file.lower() and artist.lower() in file.lower():
                return os.path.join(root, file)
    
    return None

def get_soundcloud_audio(song_title, artist):
    """Get audio from SoundCloud"""
    client = soundcloud.Client(client_id=settings.SOUNDCLOUD_CLIENT_ID)
    tracks = client.get('/tracks', q=f"{song_title} {artist}")
    
    if tracks:
        track_url = tracks[0].stream_url
        response = requests.get(f"{track_url}?client_id={settings.SOUNDCLOUD_CLIENT_ID}")
        with open(output_path, 'wb') as f:
            f.write(response.content)
        return output_path
    
    return None

def get_deezer_audio(song_title, artist):
    """Get audio from Deezer"""
    import deezer
    
    client = deezer.Client()
    results = client.search(f"{song_title} {artist}")
    
    if results and results.data:
        track = results.data[0]
        preview_url = track.preview
        
        response = requests.get(preview_url)
        with open(output_path, 'wb') as f:
            f.write(response.content)
        return output_path
    
    return None

def get_freesound_audio(duration):
    """Get a royalty-free background track"""
    # You can search by duration to match your video length
    import freesound
    
    client = freesound.FreesoundClient()
    client.set_token(settings.FREESOUND_API_KEY)
    
    results = client.text_search(query="background music", 
                                 filter=f"duration:[{duration-10} TO {duration+10}]")
    
    if results.results:
        sound = results.results[0]
        sound.retrieve_preview(output_path)
        return output_path
    
    return None

def generate_synthetic_music(duration, mood="neutral"):
    """Generate synthetic music using PyDub or similar"""
    # Create a simple melody based on mood
    if mood == "happy":
        notes = [440, 494, 523, 587, 659]  # A, B, C, D, E (major scale)
    elif mood == "sad":
        notes = [440, 466, 523, 587, 622]  # A, Bb, C, D, Eb (minor scale)
    else:
        notes = [440, 494, 554, 587, 659]  # Default scale
    
    audio = AudioSegment.silent(duration=0)
    note_duration = 500  # milliseconds
    
    # Generate a simple repeating melody
    while len(audio) < duration * 1000:
        for note in notes:
            tone = Sine(note).to_audio_segment(duration=note_duration)
            audio += tone
            if len(audio) >= duration * 1000:
                break
    
    audio.export(output_path, format="mp3")
    return output_path

def get_audio_with_fallbacks(song_title, artist, output_path):
    """Try multiple audio sources with fallbacks"""
    
    # Try each method in order of preference
    audio_methods = [
        lambda: get_spotify_audio(song_title, artist),
        lambda: get_youtube_audio(song_title, artist),
        lambda: get_deezer_audio(song_title, artist),
        lambda: get_soundcloud_audio(song_title, artist),
        lambda: generate_synthetic_music(duration)  # Last resort
    ]
    
    for method in audio_methods:
        try:
            result = method()
            if result and os.path.exists(result):
                print(f"Successfully retrieved audio using {method.__name__}")
                return result
        except Exception as e:
            print(f"Error with {method.__name__}: {e}")
            continue
    
    # If all else fails, ensure we return something
    return generate_synthetic_music(duration)

if __name__ == "__main__":
    print("Running audio fix script...")
    
    if len(sys.argv) > 1:
        if sys.argv[1] == "all":
            print("Fixing all videos in media directory...")
            fix_all_videos_in_media()
        elif sys.argv[1] == "jobs":
            print("Fixing all completed job videos...")
            fix_job_videos()
        elif sys.argv[1] == "job" and len(sys.argv) > 2:
            job_id = int(sys.argv[2])
            print(f"Fixing video for job ID {job_id}...")
            fix_job_videos([job_id])
        elif os.path.exists(sys.argv[1]):
            print(f"Fixing specific video file: {sys.argv[1]}")
            repair_video_without_audio(sys.argv[1])
        else:
            print("Invalid argument.")
            print("Usage: python audio_fix.py [all|jobs|job JOB_ID|video_path]")
    else:
        print("Fixing all completed job videos by default...")
        fix_job_videos() 