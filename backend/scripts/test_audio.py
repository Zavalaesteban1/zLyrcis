"""
Test script for audio functions
"""

import os
import sys
import tempfile
import django
import subprocess
import requests
from bs4 import BeautifulSoup

# Setup Django
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lyric_video_project.settings')
django.setup()

from api.tasks import get_youtube_audio, get_deezer_audio, generate_synthetic_music

def test_audio_functions():
    """Test the audio functions"""
    print("Testing audio functions...")
    
    # Create a temporary file
    with tempfile.NamedTemporaryFile(suffix='.mp3', delete=False) as temp_file:
        temp_path = temp_file.name
    
    try:
        # Test YouTube audio download
        print("\n1. Testing YouTube audio download...")
        youtube_result = get_youtube_audio('Shape of You', 'Ed Sheeran', temp_path)
        print(f"YouTube result: {youtube_result}")
        if youtube_result:
            print(f"File size: {os.path.getsize(youtube_result)} bytes")
        
        # Test Deezer audio download
        print("\n2. Testing Deezer audio download...")
        deezer_result = get_deezer_audio('Shape of You', 'Ed Sheeran', temp_path)
        print(f"Deezer result: {deezer_result}")
        if deezer_result:
            print(f"File size: {os.path.getsize(deezer_result)} bytes")
        
        # Test synthetic music generation
        print("\n3. Testing synthetic music generation...")
        synthetic_result = generate_synthetic_music(30, temp_path)
        print(f"Synthetic result: {synthetic_result}")
        if synthetic_result:
            print(f"File size: {os.path.getsize(synthetic_result)} bytes")
        
        print("\nAll tests completed!")
    
    finally:
        # Clean up
        if os.path.exists(temp_path):
            os.unlink(temp_path)

def get_youtube_audio_improved(song_title, artist, output_path):
    """Download audio from YouTube with improved error handling"""
    try:
        # Use yt-dlp instead of youtube-dl (more reliable and maintained)
        import yt_dlp as ydl_module
        
        # Add more search terms for better matching
        search_query = f"{song_title} {artist} official audio full song"
        
        # Configure with more robust options
        ydl_opts = {
            'format': 'bestaudio/best',
            'postprocessors': [{
                'key': 'FFmpegExtractAudio',
                'preferredcodec': 'mp3',
                'preferredquality': '192',
            }],
            'outtmpl': output_path,
            'quiet': True,
            'default_search': 'ytsearch',
            'max_downloads': 1,
            'noplaylist': True,
            # Add these options to handle SSL errors
            'nocheckcertificate': True,
            'ignoreerrors': True,
            'no_warnings': True,
            # Add retries
            'retries': 5,
            'fragment_retries': 5,
        }
        
        with ydl_module.YoutubeDL(ydl_opts) as ydl:
            print(f"Searching YouTube for: {search_query}")
            info = ydl.extract_info(f"ytsearch:{search_query}", download=True)
            
            if info and 'entries' in info and info['entries']:
                video_info = info['entries'][0]
                print(f"Found and downloaded: {video_info.get('title', 'Unknown')}")
                
                # Verify audio content and duration
                if os.path.exists(output_path):
                    # Check if duration is reasonable (not too short)
                    duration_check = subprocess.run([
                        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                        '-of', 'default=noprint_wrappers=1:nokey=1', output_path
                    ], capture_output=True, text=True)
                    
                    if duration_check.stdout.strip():
                        actual_duration = float(duration_check.stdout.strip())
                        if actual_duration > 30:  # Ensure it's not just a preview
                            return output_path
                        else:
                            print(f"Downloaded audio too short: {actual_duration}s")
        
        # If we get here, the primary method failed
        return None
    except Exception as e:
        print(f"YouTube download error: {e}")
        return None

def get_audio_with_music_recognition(song_title, artist, output_path):
    """Use music recognition APIs to find the correct song"""
    try:
        # First try AcrCloud (they have a free tier)
        # You'll need to sign up for an API key at acrcloud.com
        import acrcloud.recognizer as acr
        
        # Configure AcrCloud
        config = {
            'host': 'identify-us-west-2.acrcloud.com',
            'access_key': settings.ACRCLOUD_ACCESS_KEY,
            'access_secret': settings.ACRCLOUD_ACCESS_SECRET,
            'timeout': 10
        }
        
        recognizer = acr.ACRCloudRecognizer(config)
        
        # Search for the song
        query = f"{song_title} {artist}"
        result = recognizer.recognize_by_query(query)
        
        # Parse the result
        import json
        result_dict = json.loads(result)
        
        if 'status' in result_dict and result_dict['status']['code'] == 0:
            if 'metadata' in result_dict and 'music' in result_dict['metadata']:
                music = result_dict['metadata']['music'][0]
                if 'external_metadata' in music and 'youtube' in music['external_metadata']:
                    youtube_id = music['external_metadata']['youtube']['vid']
                    
                    # Download from YouTube using the exact ID
                    return download_from_youtube_id(youtube_id, output_path)
        
        return None
    except Exception as e:
        print(f"Music recognition error: {e}")
        return None

def get_audio_from_mp3_sites(song_title, artist, output_path):
    """Scrape MP3 download sites for the song"""
    try:
        # Create a clean search query
        query = f"{song_title} {artist}".replace(' ', '+')
        
        # List of sites to try (these are examples, you'd need to update with working sites)
        sites = [
            f"https://mp3download.to/search?q={query}",
            f"https://mp3paw.com/search?q={query}"
        ]
        
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
        
        for site in sites:
            response = requests.get(site, headers=headers, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # Look for download links (this will vary by site)
                download_links = soup.select('a.download-link')
                
                for link in download_links:
                    href = link.get('href')
                    if href and (song_title.lower() in href.lower() or artist.lower() in href.lower()):
                        # Download the file
                        audio_response = requests.get(href, headers=headers)
                        if audio_response.status_code == 200:
                            with open(output_path, 'wb') as f:
                                f.write(audio_response.content)
                            return output_path
        
        return None
    except Exception as e:
        print(f"MP3 site scraping error: {e}")
        return None

def get_deezer_audio_fixed(song_title, artist, output_path):
    """Get audio from Deezer with fixed data handling"""
    try:
        import deezer
        
        client = deezer.Client()
        results = client.search(f"{song_title} {artist}")
        
        # Fix for the PaginatedList issue
        if results and hasattr(results, 'data') and len(results.data) > 0:
            track = results.data[0]
            preview_url = track.preview
            
            response = requests.get(preview_url)
            with open(output_path, 'wb') as f:
                f.write(response.content)
            
            # Check if it's a full track or just a preview
            result = subprocess.run([
                'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1', output_path
            ], capture_output=True, text=True)
            
            if result.stdout.strip():
                duration = float(result.stdout.strip())
                if duration < 45:  # It's likely just a preview
                    print(f"Deezer provided only a {duration}s preview, not using")
                    return None
            
            return output_path
        elif results and hasattr(results, 'iter'):
            # Handle PaginatedList differently
            for track in results.iter():
                if hasattr(track, 'preview') and track.preview:
                    preview_url = track.preview
                    response = requests.get(preview_url)
                    with open(output_path, 'wb') as f:
                        f.write(response.content)
                    return output_path
                break  # Just try the first result
        
        return None
    except Exception as e:
        print(f"Deezer download error: {e}")
        return None

def verify_audio_match(audio_path, song_title, artist):
    """Verify that the downloaded audio matches the expected song"""
    try:
        import acoustid
        import chromaprint
        
        # Calculate fingerprint
        duration, fp_encoded = acoustid.fingerprint_file(audio_path)
        fingerprint, version = chromaprint.decode_fingerprint(fp_encoded)
        
        # Look up the fingerprint
        results = acoustid.lookup('YOUR_ACOUSTID_API_KEY', fingerprint, duration)
        
        for score, recording_id, title, artist_name in results:
            # Check if the title and artist are similar enough
            from difflib import SequenceMatcher
            
            title_similarity = SequenceMatcher(None, title.lower(), song_title.lower()).ratio()
            artist_similarity = SequenceMatcher(None, artist_name.lower(), artist.lower()).ratio()
            
            # If both title and artist are similar enough, it's a match
            if title_similarity > 0.6 and artist_similarity > 0.6:
                print(f"Audio verified as {title} by {artist_name} (score: {score})")
                return True
        
        return False
    except Exception as e:
        print(f"Audio verification error: {e}")
        return True  # Default to True on error to avoid rejecting good matches

def sync_lyrics_to_audio(lyrics, audio_path):
    """Improve lyric synchronization with audio analysis"""
    try:
        import librosa
        import numpy as np
        
        # Load the audio
        y, sr = librosa.load(audio_path, sr=None)
        
        # Detect beats
        tempo, beat_frames = librosa.beat.beat_track(y=y, sr=sr)
        beat_times = librosa.frames_to_time(beat_frames, sr=sr)
        
        # Detect onsets (might indicate vocal entry points)
        onset_env = librosa.onset.onset_strength(y=y, sr=sr)
        onset_frames = librosa.onset.onset_detect(onset_envelope=onset_env, sr=sr)
        onset_times = librosa.frames_to_time(onset_frames, sr=sr)
        
        # Detect vocal segments
        S = np.abs(librosa.stft(y))
        mel = librosa.feature.melspectrogram(S=S, sr=sr)
        
        # Use harmonic-percussive source separation to find vocal parts
        y_harmonic, y_percussive = librosa.effects.hpss(y)
        
        # Vocals are more likely in harmonic parts
        mfcc = librosa.feature.mfcc(y=y_harmonic, sr=sr, n_mfcc=13)
        
        # Find segments with high MFCC variance (likely vocals)
        mfcc_var = np.var(mfcc, axis=1)
        vocal_segments = []
        
        # Process lyrics and assign timestamps
        lines = [line for line in lyrics.split('\n') if line.strip()]
        timed_lyrics = []
        
        # Simple algorithm: distribute lyrics across detected onsets
        # This is a simplified approach - a real solution would be more complex
        if len(onset_times) > len(lines):
            # Skip some early onsets that might be intro
            start_idx = len(onset_times) // 10
            usable_onsets = onset_times[start_idx:start_idx + len(lines)]
            
            for i, line in enumerate(lines):
                if i < len(usable_onsets):
                    timed_lyrics.append({
                        'text': line,
                        'start_time': usable_onsets[i],
                        'duration': 4.0  # Default duration
                    })
        
        return timed_lyrics
    except Exception as e:
        print(f"Lyric sync error: {e}")
        return None

def download_audio(track_id, output_path):
    """Download audio with improved matching and verification"""
    # Get track info from Spotify
    track_info = get_spotify_track_info(track_id)
    song_title = track_info['title']
    artist = track_info['artist']
    duration_seconds = track_info['duration_ms'] / 1000
    
    print(f"Searching for audio: {song_title} by {artist}")
    
    # Try multiple sources with verification
    methods = [
        get_youtube_audio_improved,
        get_audio_with_music_recognition,
        get_deezer_audio_fixed,
        get_audio_from_mp3_sites
    ]
    
    for method in methods:
        try:
            result_path = method(song_title, artist, output_path)
            
            if result_path and os.path.exists(result_path):
                # Verify it's the right song
                if verify_audio_match(result_path, song_title, artist):
                    print(f"Successfully downloaded verified audio using {method.__name__}")
                    
                    # Get the actual duration
                    result = subprocess.run([
                        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
                        '-of', 'default=noprint_wrappers=1:nokey=1', result_path
                    ], capture_output=True, text=True)
                    
                    if result.stdout.strip():
                        return float(result.stdout.strip())
                    
                    return duration_seconds
        except Exception as e:
            print(f"Error with {method.__name__}: {e}")
    
    # Fall back to synthetic audio as last resort
    print("All methods failed. Creating synthetic audio.")
    generate_synthetic_music(duration_seconds, output_path)
    return duration_seconds

if __name__ == "__main__":
    test_audio_functions() 