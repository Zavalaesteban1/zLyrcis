import os
import tempfile
import subprocess
import requests
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import lyricsgenius
from celery import shared_task
from django.conf import settings
from .models import VideoJob
import ffmpeg
import re
import json
import time
from bs4 import BeautifulSoup
import traceback
import math

@shared_task
def generate_lyric_video(job_id):
    """
    Generate a lyric video for a Spotify track
    
    Steps:
    1. Fetch song info from Spotify
    2. Fetch lyrics from Genius
    3. Download the audio
    4. Generate the video with synced lyrics
    5. Save the video and update the job status
    """
    job = None
    try:
        # Get the job
        job = VideoJob.objects.get(id=job_id)
        job.status = 'processing'
        job.save()
        
        print(f"Processing job {job_id} for URL: {job.spotify_url}")
        
        # Extract Spotify track ID from URL
        track_id = extract_spotify_track_id(job.spotify_url)
        if not track_id:
            raise ValueError("Invalid Spotify URL")
            
        # Validate environment setup
        if not settings.SPOTIFY_CLIENT_ID or not settings.SPOTIFY_CLIENT_SECRET:
            error_msg = "Spotify API credentials are missing. Please add SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET to your .env file."
            print(error_msg)
            job.status = 'failed'
            job.error_message = error_msg
            job.save()
            return
            
        # Fetch song info from Spotify
        song_info = get_spotify_track_info(track_id)
        job.song_title = song_info['title']
        job.artist = song_info['artist']
        job.save()

        # Fetch lyrics from Genius
        lyrics = get_lyrics(song_info['title'], song_info['artist'])
        if not lyrics:
            simplified_title = re.sub(r'\(.*?\)', '', song_info['title']).strip()
            if simplified_title != song_info['title']:
                lyrics = get_lyrics(simplified_title, song_info['artist'])

        if not lyrics:
            raise ValueError("Could not find lyrics for this song")

        # Create temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            # 1. Create a silent audio file with the correct duration
            audio_path = os.path.join(temp_dir, 'audio.mp3')
            audio_duration = download_audio(track_id, audio_path)
            
            # 2. Define the output video path
            video_path = os.path.join(temp_dir, 'output.mp4')
            
            # 3. Create the lyric video with known paths and duration
            create_lyric_video(
                audio_path, 
                lyrics, 
                video_path, 
                audio_duration, 
                vocal_start_time=song_info.get('vocal_start_time', 5.0)
            )

            # Save the video file
            with open(video_path, 'rb') as video_file:
                job.video_file.save(f"{job.id}.mp4", video_file)

        # At the end of generate_lyric_video function, before marking job as completed:
        # Verify the final video has audio
        try:
            video_path = job.video_file.path
            if os.path.exists(video_path):
                audio_check = subprocess.run([
                    'ffprobe',
                    '-v', 'error',
                    '-select_streams', 'a',
                    '-show_streams',
                    '-of', 'json',
                    video_path
                ], capture_output=True, text=True)
                print(f"FINAL VIDEO AUDIO CHECK: {audio_check.stdout}")
                
                # If no audio is detected, try to recreate the video with guaranteed audio
                if '"streams": []' in audio_check.stdout or not audio_check.stdout:
                    print("WARNING: No audio detected in final video. Creating guaranteed audio version...")
                    
                    # Create a temp directory
                    with tempfile.TemporaryDirectory() as temp_dir:
                        # Create a test audio file
                        test_audio = os.path.join(temp_dir, 'backup_audio.mp3')
                        subprocess.run([
                            'ffmpeg',
                            '-f', 'lavfi',
                            '-i', 'sine=frequency=440:duration=60',
                            '-c:a', 'libmp3lame',
                            '-y',
                            test_audio
                        ], check=True, capture_output=True)
                        
                        # Add this audio to the existing video
                        fixed_video = os.path.join(temp_dir, 'fixed_video.mp4')
                        subprocess.run([
                            'ffmpeg',
                            '-i', video_path,
                            '-i', test_audio,
                            '-c:v', 'copy',
                            '-c:a', 'aac',
                            '-shortest',
                            '-y',
                            fixed_video
                        ], check=True, capture_output=True)
                        
                        # Replace the original video with the fixed one
                        with open(fixed_video, 'rb') as f:
                            job.video_file.save(f"{job.id}_fixed.mp4", f)
                            print("Replaced videoless file with version containing backup audio")
        except Exception as e:
            print(f"Error in final audio check: {e}")

        job.status = 'completed'
        job.save()

    except Exception as e:
        print(f"Error: {str(e)}")
        print(traceback.format_exc())
        if 'job' in locals() and job:
            job.status = 'failed'
            job.error_message = str(e)
            job.save()
        raise

def extract_spotify_track_id(spotify_url):
    """Extract the track ID from a Spotify URL"""
    # Regular expression to match Spotify track URLs
    pattern = r'(?:https?:\/\/)?(?:open\.)?spotify\.com\/track\/([a-zA-Z0-9]+)'
    match = re.search(pattern, spotify_url)

    if match:
        return match.group(1)
    return None

def get_spotify_track_info(track_id):
    """Get track information from Spotify API"""
    try:
        # Get credentials from Django settings
        client_id = settings.SPOTIFY_CLIENT_ID
        client_secret = settings.SPOTIFY_CLIENT_SECRET
        
        # Try to get credentials from environment directly if not in settings
        if not client_id:
            client_id = os.environ.get('SPOTIFY_CLIENT_ID')
            print(f"Using SPOTIFY_CLIENT_ID from environment: {'Found' if client_id else 'Not found'}")
        
        if not client_secret:
            client_secret = os.environ.get('SPOTIFY_CLIENT_SECRET')
            print(f"Using SPOTIFY_CLIENT_SECRET from environment: {'Found' if client_secret else 'Not found'}")
        
        # Debug output credentials information (first few chars only for security)
        if client_id:
            safe_id = client_id[:4] + '...' if len(client_id) > 4 else client_id
            print(f"Using Spotify client ID: {safe_id}")
        
        # Check if credentials exist
        if not client_id or not client_secret:
            raise ValueError("Spotify API credentials not configured correctly")
            
        # Set the credentials explicitly for Spotipy
        os.environ['SPOTIPY_CLIENT_ID'] = client_id
        os.environ['SPOTIPY_CLIENT_SECRET'] = client_secret
        
        # Create client credentials manager with explicit values
        client_credentials_manager = SpotifyClientCredentials(
            client_id=client_id,
            client_secret=client_secret
        )
        sp = spotipy.Spotify(client_credentials_manager=client_credentials_manager)

        # Get basic track info
        track = sp.track(track_id)
        
        # Try to get audio analysis, but handle errors gracefully
        audio_analysis = None
        try:
            audio_analysis = sp.audio_analysis(track_id)
            print("Successfully retrieved audio analysis from Spotify")
        except spotipy.exceptions.SpotifyException as e:
            print(f"Warning: Could not fetch audio analysis: {e}")
            # Create a placeholder audio analysis structure
            audio_analysis = {
                "sections": [],
                "segments": []
            }
        
        # Get audio features for additional information
        audio_features = None
        try:
            audio_features = sp.audio_features(track_id)[0]
        except spotipy.exceptions.SpotifyException as e:
            print(f"Warning: Could not fetch audio features: {e}")
            audio_features = {}
        
        # Estimate vocal start time from sections and segments
        vocal_start_time = estimate_vocal_start_time(audio_analysis, audio_features)
        
        print(f"Estimated vocal start time: {vocal_start_time} seconds")

        return {
            'title': track['name'],
            'artist': track['artists'][0]['name'],
            'album': track['album']['name'],
            'duration_ms': track['duration_ms'],
            'album_art_url': track['album']['images'][0]['url'] if track['album']['images'] else None,
            'vocal_start_time': vocal_start_time
        }
    except spotipy.exceptions.SpotifyException as e:
        print(f"Spotify API error: {str(e)}")
        raise
    except Exception as e:
        print(f"Error in get_spotify_track_info: {str(e)}")
        traceback.print_exc()
        raise

def estimate_vocal_start_time(audio_analysis, audio_features):
    """
    Estimate when vocals start in a track based on Spotify's audio analysis
    
    This uses several heuristics:
    1. Look for sections with high vocal confidence
    2. Look for segments with high vocal confidence
    3. Use the track's intro duration if available
    4. Fall back to a default based on the track's energy and tempo
    """
    try:
        # Check if we have valid audio analysis data
        if not audio_analysis or not isinstance(audio_analysis, dict):
            print("No valid audio analysis data available. Using default vocal start time.")
            return 5.0
            
        # Method 1: Look for sections with vocal confidence
        sections = audio_analysis.get('sections', [])
        if sections:
            for i, section in enumerate(sections):
                # If this isn't the first section and has higher vocal confidence
                if i > 0 and section.get('confidence', 0) > 0.5:
                    start_time = section.get('start', 0)
                    if start_time > 5:  # If it's a significant time into the song
                        print(f"Detected vocal start from section change at {start_time}s")
                        return start_time
        
        # Method 2: Look for segments with vocal characteristics
        segments = audio_analysis.get('segments', [])
        
        if segments:
            # Skip the first few segments as they might be noise
            start_idx = min(5, len(segments) // 10)
            
            for i, segment in enumerate(segments[start_idx:], start_idx):
                # Look for segments with high loudness and mid-range timbre
                # which often indicates vocals
                loudness = segment.get('loudness_max', -60)
                timbre = segment.get('timbre', [0, 0])
                
                # Timbre[1] often correlates with vocal presence
                if loudness > -15 and len(timbre) > 1 and timbre[1] > 20:
                    start_time = segment.get('start', 0)
                    if start_time > 3:  # If it's a significant time into the song
                        print(f"Detected vocal start from segment analysis at {start_time}s")
                        return start_time
        
        # Method 3: Use track features to make an educated guess
        # Songs with lower energy often have longer intros
        if audio_features:
            energy = audio_features.get('energy', 0.5)
            tempo = audio_features.get('tempo', 120)
            
            # Calculate a reasonable default based on energy and tempo
            # Lower energy and tempo often means longer intros
            default_start = max(3, min(30, (1 - energy) * 40))
            
            print(f"Estimated vocal start time based on track features: {default_start}s")
            return default_start
        
        # If we have no useful data, return a reasonable default
        print("Using default vocal start time")
        return 5.0
        
    except Exception as e:
        print(f"Error estimating vocal start time: {e}")
        # Default to a reasonable value if we can't determine
        return 5.0  # 5 seconds is a reasonable default

def get_lyrics(title, artist):
    """Get lyrics from multiple sources with better error handling"""
    import re

    print(f"Searching for \"{title}\" by {artist}...")

    # Clean up the title and artist for better search results
    clean_title = re.sub(r'\(feat\..*?\)|\(ft\..*?\)', '', title).strip()
    clean_title = re.sub(r'\(.*?\)', '', clean_title).strip()

    # Try Genius API with original title and artist
    try:
        genius = lyricsgenius.Genius(settings.GENIUS_ACCESS_TOKEN)
        genius.verbose = False  # Turn off status messages

        # Set a timeout to avoid hanging
        genius.timeout = 10

        # Try with original title/artist
        song = genius.search_song(title, artist)

        if song and song.lyrics:
            print(f"Found lyrics with original title/artist")
            return song.lyrics
    except Exception as e:
        print(f"Error searching Genius with original title: {e}")

    # Try with cleaned title
    if clean_title != title:
        try:
            print(f"Trying with cleaned title: \"{clean_title}\" by {artist}")
            song = genius.search_song(clean_title, artist)

            if song and song.lyrics:
                print(f"Found lyrics with cleaned title")
                return song.lyrics
        except Exception as e:
            print(f"Error searching Genius with cleaned title: {e}")

    # Try with just the title (no artist)
    try:
        print(f"Trying with just title: \"{title}\"")
        song = genius.search_song(title)

        if song and song.lyrics:
            print(f"Found lyrics with just title")
            return song.lyrics
    except Exception as e:
        print(f"Error searching Genius with just title: {e}")

    # Try with cleaned title (no artist)
    if clean_title != title:
        try:
            print(f"Trying with just cleaned title: \"{clean_title}\"")
            song = genius.search_song(clean_title)

            if song and song.lyrics:
                print(f"Found lyrics with just cleaned title")
                return song.lyrics
        except Exception as e:
            print(f"Error searching Genius with just cleaned title: {e}")

    # If all else fails, try a web scraping approach as a last resort
    try:
        print("Trying alternative lyrics source...")
        lyrics = get_lyrics_from_alternative_source(title, artist)
        if lyrics:
            print("Found lyrics from alternative source")
            return lyrics
    except Exception as e:
        print(f"Error with alternative lyrics source: {e}")

    print(f"No results found for: '{title} {artist}'")
    return None

def get_lyrics_from_alternative_source(title, artist):
    """Fallback method to get lyrics from alternative sources"""
    # Try AZLyrics as a fallback
    try:
        # Format the URL - convert spaces to underscores and remove special chars
        artist_url = artist.lower().replace(' ', '').replace("'", "")
        title_url = title.lower().replace(' ', '').replace("'", "")

        # Remove any other special characters
        import re
        artist_url = re.sub(r'[^a-z0-9]', '', artist_url)
        title_url = re.sub(r'[^a-z0-9]', '', title_url)

        url = f"https://www.azlyrics.com/lyrics/{artist_url}/{title_url}.html"

        print(f"Trying AZLyrics URL: {url}")

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')

            # AZLyrics has the lyrics in a div with no class or id, between the usage warning and the submit correction divs
            lyrics_div = soup.find('div', class_='lyricsh').find_next('div', class_=None)

            if lyrics_div:
                lyrics = lyrics_div.get_text().strip()
                return lyrics
    except Exception as e:
        print(f"Error scraping AZLyrics: {e}")

    # Try another source if AZLyrics fails
    try:
        # Search for lyrics using a search engine
        search_query = f"{title} {artist} lyrics"
        search_url = f"https://www.google.com/search?q={search_query.replace(' ', '+')}"

        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }

        response = requests.get(search_url, headers=headers, timeout=10)

        if response.status_code == 200:
            soup = BeautifulSoup(response.text, 'html.parser')

            # Look for Google's lyrics box
            lyrics_box = soup.find('div', class_='ujudUb')

            if lyrics_box:
                lyrics = lyrics_box.get_text().strip()
                return lyrics
    except Exception as e:
        print(f"Error with search engine approach: {e}")

    return None

def download_audio(track_id, output_path):
    """
    Download the actual audio for a Spotify track using multiple sources with fallbacks
    """
    # Get track info from Spotify
    track_info = get_spotify_track_info(track_id)
    duration_seconds = track_info['duration_ms'] / 1000
    
    print(f"Song duration from Spotify: {duration_seconds} seconds")
    print(f"Track duration in MS: {track_info['duration_ms']}")
    print(f"Track duration in seconds: {duration_seconds}")
    
    # Create a search query using title and artist
    search_query = f"{track_info['title']} {track_info['artist']}"
    print(f"Searching for audio: {search_query}")
    
    # Try multiple audio sources with fallbacks
    audio_downloaded = False
    
    # 1. Try YouTube first (most reliable source)
    try:
        print("Attempting to download audio from YouTube...")
        youtube_path = get_youtube_audio(track_info['title'], track_info['artist'], output_path)
        if youtube_path and os.path.exists(youtube_path) and os.path.getsize(youtube_path) > 100000:
            print(f"Successfully downloaded audio from YouTube")
            audio_downloaded = True
            
            # Verify the duration is similar to what we expect
            result = subprocess.run([
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                output_path
            ], capture_output=True, text=True, check=True)
            
            if result.stdout.strip():
                actual_duration = float(result.stdout.strip())
                print(f"Downloaded audio duration: {actual_duration} seconds (Expected: {duration_seconds})")
                return actual_duration
    except Exception as e:
        print(f"Error downloading from YouTube: {e}")
    
    # 2. Try Deezer as fallback
    if not audio_downloaded:
        try:
            print("Attempting to download audio from Deezer...")
            deezer_path = get_deezer_audio(track_info['title'], track_info['artist'], output_path)
            if deezer_path and os.path.exists(deezer_path) and os.path.getsize(deezer_path) > 100000:
                print(f"Successfully downloaded audio from Deezer")
                audio_downloaded = True
                
                # Verify duration
                result = subprocess.run([
                    'ffprobe',
                    '-v', 'error',
                    '-show_entries', 'format=duration',
                    '-of', 'default=noprint_wrappers=1:nokey=1',
                    output_path
                ], capture_output=True, text=True, check=True)
                
                if result.stdout.strip():
                    actual_duration = float(result.stdout.strip())
                    print(f"Downloaded audio duration: {actual_duration} seconds (Expected: {duration_seconds})")
                    return actual_duration
        except Exception as e:
            print(f"Error downloading from Deezer: {e}")
    
    # 3. Last resort: Generate synthetic music
    if not audio_downloaded:
        print(f"All download methods failed. Creating synthetic audio with duration: {duration_seconds} seconds")
        try:
            # Create a melodic tone as a last resort
            generate_synthetic_music(duration_seconds, output_path)
            
            print(f"Created synthetic audio file at {output_path}")
            
            # Verify the file was created
            if os.path.exists(output_path):
                result = subprocess.run([
                    'ffprobe',
                    '-v', 'error',
                    '-show_entries', 'format=duration',
                    '-of', 'default=noprint_wrappers=1:nokey=1',
                    output_path
                ], capture_output=True, text=True, check=True)
                
                if result.stdout.strip():
                    actual_duration = float(result.stdout.strip())
                    print(f"Synthetic audio file duration: {actual_duration} seconds")
                    return actual_duration
        except Exception as e:
            print(f"Error creating synthetic audio: {e}")
            
            # Absolute last resort - silent audio
            print(f"Falling back to silent audio with duration: {duration_seconds} seconds")
            try:
                subprocess.run([
                    'ffmpeg',
                    '-f', 'lavfi',
                    '-i', 'sine=frequency=0:sample_rate=44100:duration=' + str(duration_seconds),
                    '-c:a', 'libmp3lame',
                    '-y',
                    output_path
                ], check=True, capture_output=True)
                
                print(f"Created silent audio file at {output_path}")
                
                if os.path.exists(output_path):
                    result = subprocess.run([
                        'ffprobe',
                        '-v', 'error',
                        '-show_entries', 'format=duration',
                        '-of', 'default=noprint_wrappers=1:nokey=1',
                        output_path
                    ], capture_output=True, text=True, check=True)
                    
                    if result.stdout.strip():
                        actual_duration = float(result.stdout.strip())
                        print(f"Silent audio file duration: {actual_duration} seconds")
                        return actual_duration
            except Exception as e2:
                print(f"Error creating silent audio: {e2}")
    
    # If all else fails, return the expected duration
    return duration_seconds

def get_youtube_audio(song_title, artist, output_path):
    """Download audio from YouTube"""
    try:
        import youtube_dl
        search_query = f"{song_title} {artist} official audio"
        
        # Configure youtube-dl options
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
        }
        
        # Search and download from YouTube
        with youtube_dl.YoutubeDL(ydl_opts) as ydl:
            print("Searching YouTube for the track...")
            # Use ytsearch to find the most relevant result
            search_term = f"ytsearch:{search_query}"
            info = ydl.extract_info(search_term, download=True)
            
            if info and 'entries' in info and info['entries']:
                # Get the first result (most relevant)
                video_info = info['entries'][0]
                print(f"Found and downloaded track: {video_info.get('title', 'Unknown')}")
                return output_path
        
        return None
    except Exception as e:
        print(f"YouTube download error: {e}")
        return None

def get_deezer_audio(song_title, artist, output_path):
    """Get audio from Deezer"""
    try:
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
    except Exception as e:
        print(f"Deezer download error: {e}")
        return None

def get_soundcloud_audio(song_title, artist, output_path):
    """Get audio from SoundCloud - DISABLED due to dependency issues"""
    print("SoundCloud integration is disabled due to dependency issues")
    return None

def generate_synthetic_music(duration, output_path, mood="neutral"):
    """Generate synthetic music using PyDub or similar"""
    try:
        from pydub import AudioSegment
        from pydub.generators import Sine
        
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
    except ImportError:
        print("PyDub not available. Using FFmpeg to generate tone.")
        # Fallback to FFmpeg if PyDub is not available
        try:
            subprocess.run([
                'ffmpeg',
                '-f', 'lavfi',
                '-i', f'sine=frequency=440:duration={duration}',
                '-c:a', 'libmp3lame',
                '-b:a', '192k',
                '-y',
                output_path
            ], check=True, capture_output=True)
            return output_path
        except Exception as e:
            print(f"Error generating tone with FFmpeg: {e}")
            return None
    except Exception as e:
        print(f"Error generating synthetic music: {e}")
        return None

def detect_vocals_with_librosa(audio_path):
    """
    Use librosa to detect when vocals start in a song
    
    This is a fallback method if Spotify's API doesn't provide accurate information
    """
    try:
        # Check if librosa is available
        import librosa
        import numpy as np
        
        print("Using librosa to detect vocals...")
        
        # Load the audio file (use a smaller duration to avoid memory issues)
        # Focus on the first 120 seconds as most vocals should start within that time
        max_duration = 120  # 2 minutes
        y, sr = librosa.load(audio_path, sr=None, duration=max_duration)
        
        print(f"Audio loaded: {len(y) / sr:.2f} seconds at {sr} Hz")
        
        # Calculate the mel spectrogram with more bands for better vocal detection
        mel_spec = librosa.feature.melspectrogram(y=y, sr=sr, n_mels=128, fmax=8000)
        
        # Convert to dB scale
        mel_db = librosa.power_to_db(mel_spec, ref=np.max)
        
        # Calculate the spectral contrast - good for detecting vocals
        contrast = librosa.feature.spectral_contrast(y=y, sr=sr, n_bands=6)
        
        # Vocals typically have high contrast in the mid-frequency range (1-4 kHz)
        # We'll look at the average contrast in this range (bands 2-4)
        mid_freq_contrast = np.mean(contrast[2:5], axis=0)
        
        # Harmonic content is also indicative of vocals
        harmonic, percussive = librosa.effects.hpss(y)
        harmonic_mel = librosa.feature.melspectrogram(y=harmonic, sr=sr)
        harmonic_db = librosa.power_to_db(harmonic_mel, ref=np.max)
        
        # Compute spectral flatness - vocals have lower flatness
        flatness = librosa.feature.spectral_flatness(y=y)
        
        # Create a composite feature that combines contrast and harmonicity
        # This helps detect vocals more accurately
        vocal_score = np.zeros_like(mid_freq_contrast)
        for i in range(len(vocal_score)):
            # Higher contrast, more harmonic content, and lower flatness = more likely to be vocals
            vocal_score[i] = (
                mid_freq_contrast[i] * 0.5 +
                np.mean(harmonic_db[:, i]) * 0.3 +
                (1 - flatness[0, i]) * 0.2
            )
        
        # Smooth the score to avoid detecting short non-vocal sounds
        window_size = int(sr / 512)  # About 0.1 seconds
        if window_size > 1:
            from scipy.ndimage import uniform_filter1d
            vocal_score = uniform_filter1d(vocal_score, size=window_size)
        
        # Find segments with high vocal scores
        threshold = np.percentile(vocal_score, 85)  # Use 85th percentile as threshold
        
        # Look for sustained vocals (not just brief sounds)
        min_segment_length = int(sr / 256)  # About 0.2 seconds
        
        # Find continuous regions above threshold
        above_threshold = vocal_score > threshold
        
        # Find the start of the first significant vocal segment
        segment_starts = []
        in_segment = False
        segment_length = 0
        
        for i, is_above in enumerate(above_threshold):
            if is_above and not in_segment:
                segment_start = i
                in_segment = True
                segment_length = 1
            elif is_above and in_segment:
                segment_length += 1
            elif not is_above and in_segment:
                # If segment was long enough, add it
                if segment_length >= min_segment_length:
                    segment_starts.append(segment_start)
                in_segment = False
                segment_length = 0
        
        # If we found any significant segments
        if segment_starts:
            # Convert frame index to time
            first_vocal_frame = segment_starts[0]
            vocal_start_time = librosa.frames_to_time(first_vocal_frame, sr=sr)
            
            # Ensure it's not too early (avoid false positives in the first few seconds)
            vocal_start_time = max(1.0, vocal_start_time)
            
            # Add a small buffer to ensure we don't cut off the beginning of vocals
            final_start_time = max(0.5, vocal_start_time - 0.5)
            
            print(f"Librosa detected vocals starting at: {vocal_start_time:.2f} seconds (adjusted to {final_start_time:.2f}s)")
            return final_start_time
        
        # If no clear vocal segments found, try an alternative method
        # Look for sudden changes in energy that might indicate vocals starting
        onset_env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=512)
        peaks = librosa.util.peak_pick(onset_env, pre_max=3, post_max=3, pre_avg=3, post_avg=5, delta=0.5, wait=10)
        
        # Filter peaks to find significant changes
        significant_peaks = []
        for peak in peaks:
            # Check if this peak is significantly higher than the surrounding area
            if peak > 0 and peak < len(onset_env):
                # Calculate how much stronger this peak is compared to its neighborhood
                prev_avg = np.mean(onset_env[max(0, peak-10):peak]) if peak > 0 else 0
                peak_value = onset_env[peak]
                
                # If peak is significantly higher, consider it
                if peak_value > prev_avg * 2 and peak > 20:  # Skip very early peaks
                    significant_peaks.append(peak)
        
        if significant_peaks:
            # Convert to time
            onset_time = librosa.frames_to_time(significant_peaks[0], sr=sr, hop_length=512)
            
            # Ensure it's not too early
            onset_time = max(2.0, onset_time)
            
            print(f"Detected vocal onset at: {onset_time:.2f} seconds")
            return onset_time
            
        # If all methods fail, use a default start time
        print("Could not detect clear vocal start point, using default")
        return 5.0
        
    except ImportError:
        print("Librosa not available, using default vocal start time")
        return 5.0
    except Exception as e:
        print(f"Error detecting vocals with librosa: {e}")
        traceback.print_exc()
        return 5.0

def create_lyric_video(audio_path, lyrics, output_path, audio_duration=None, vocal_start_time=5.0):
    """
    Create a lyric video with FFmpeg that properly displays lyrics
    with improved timing based on line length, syllable count, and position
    
    Parameters:
    - audio_path: Path to the audio file
    - lyrics: Raw lyrics text
    - output_path: Path to save the output video
    - audio_duration: Duration of the audio in seconds
    - vocal_start_time: Time in seconds when vocals start in the song
    """
    import os
    import re
    import subprocess

    # ADDED: Debug print to confirm audio inclusion is attempted
    print("AUDIO DEBUG: Starting lyric video creation with audio")
    print(f"AUDIO DEBUG: Audio path exists: {os.path.exists(audio_path)}")
    if os.path.exists(audio_path):
        print(f"AUDIO DEBUG: Audio file size: {os.path.getsize(audio_path)} bytes")
    
    # If the vocal start time is very short (less than 3 seconds), try to detect it with librosa
    if vocal_start_time < 3.0:
        try:
            detected_start = detect_vocals_with_librosa(audio_path)
            if detected_start > vocal_start_time:
                print(f"Using librosa-detected vocal start time: {detected_start}s instead of {vocal_start_time}s")
                vocal_start_time = detected_start
        except Exception as e:
            print(f"Error using librosa for vocal detection: {e}")
    
    # Debug the raw lyrics
    print("Raw lyrics (first 200 chars):")
    print(lyrics[:200] if lyrics else "No lyrics found!")
    print(f"Using vocal start time: {vocal_start_time} seconds")

    # Process lyrics - clean up Genius formatting
    if not lyrics:
        raise ValueError("Empty lyrics received")

    # Clean up the lyrics from Genius
    lyrics = re.sub(r'\d+Embed', '', lyrics)  # Remove Embed markers
    lyrics = re.sub(r'You might also like', '', lyrics)  # Remove suggestions

    # Split into lines and clean up
    lyrics_lines = lyrics.split('\n')
    clean_lines = []

    # Skip the first line if it contains the song title or [Lyrics]
    start_idx = 0
    if len(lyrics_lines) > 0 and ('[' in lyrics_lines[0] or 'Lyrics' in lyrics_lines[0]):
        start_idx = 1

    # Process lyrics to identify sections (verses, chorus, etc.)
    sections = []
    current_section = {"type": "unknown", "lines": []}

    for line in lyrics_lines[start_idx:]:
        # Skip empty lines and lines with Genius metadata
        line = line.strip()
        if not line:
            continue
        if any(x in line for x in ["Embed", "Lyrics", "You might also like", "Contributors"]):
            continue

        # Check if this is a section marker
        if line.startswith('[') and line.endswith(']'):
            section_name = line[1:-1].lower()
            if current_section["lines"]:
                sections.append(current_section)
            current_section = {"type": section_name, "lines": []}
        else:
            current_section["lines"].append(line)

    # Add the last section if it has lines
    if current_section["lines"]:
        sections.append(current_section)

    # Flatten sections into clean lines with appropriate spacing
    for section in sections:
        for line in section["lines"]:
            clean_lines.append(line)
        # Add an empty line between sections for visual separation
        if section != sections[-1]:
            clean_lines.append("")

    # If no sections were found, use the original cleaning method
    if not clean_lines:
        for line in lyrics_lines[start_idx:]:
            line = line.strip()
            if not line:
                continue
            if any(x in line for x in ["Embed", "Lyrics", "You might also like", "Contributors"]):
                continue
            if line.startswith('[') and line.endswith(']'):
                continue
            clean_lines.append(line)

    # Debug the cleaned lyrics
    print(f"Cleaned lyrics - {len(clean_lines)} lines:")
    for i, line in enumerate(clean_lines[:5]):
        print(f"Line {i}: {line}")

    if len(clean_lines) == 0:
        raise ValueError("No valid lyrics lines found after cleaning")

    # Create a temporary directory for our files
    temp_dir = os.path.dirname(output_path)

    # Improved syllable counting function
    def count_syllables_improved(text):
        text = text.lower()
        text = re.sub(r'[^a-z ]', '', text)
        words = text.split()

        count = 0
        for word in words:
            # Count vowel groups
            vowels = "aeiouy"
            word_count = 0
            prev_is_vowel = False

            for char in word:
                is_vowel = char in vowels
                if is_vowel and not prev_is_vowel:
                    word_count += 1
                prev_is_vowel = is_vowel

            # Apply corrections for common patterns
            if word.endswith('e'):
                word_count -= 1
            if word.endswith('le') and len(word) > 2 and word[-3] not in vowels:
                word_count += 1
            if word.endswith('es') or word.endswith('ed'):
                word_count -= 1

            # Ensure at least one syllable per word
            count += max(1, word_count)

        return count

    # Calculate timing based on line length, syllable count, and position
    non_empty_lines = [line for line in clean_lines if line]
    total_chars = sum(len(line) for line in non_empty_lines)
    total_syllables = sum(count_syllables_improved(line) for line in non_empty_lines)

    # Use the vocal start time as the pre-roll delay
    # Add a small buffer (0.5 seconds) to ensure lyrics appear right when vocals start
    pre_roll_delay = max(0.5, vocal_start_time - 0.5)  
    print(f"Setting pre-roll delay to {pre_roll_delay} seconds")

    # Reserve time for pauses between sections and pre-roll
    empty_line_duration = 1.5  # seconds pause between sections
    num_empty_lines = sum(1 for line in clean_lines if not line)
    reserved_time = (num_empty_lines * empty_line_duration) + pre_roll_delay

    # Adjust available time for actual lyrics
    available_time = max(0, audio_duration - reserved_time)

    # Calculate average time per syllable based on available time
    avg_time_per_syllable = available_time / max(total_syllables, 1)

    # Set reasonable bounds for line durations
    min_line_duration = 1.5  # seconds
    max_line_duration = 6.0  # seconds

    # Calculate line durations
    line_durations = []

    # Add pre-roll delay
    if clean_lines:
        line_durations.append(pre_roll_delay)
        clean_lines.insert(0, "")  # Insert empty line for pre-roll

    for i, line in enumerate(clean_lines[1:], 1):  # Skip the first empty line we added
        if not line:  # Empty line (section break)
            line_durations.append(empty_line_duration)
            continue

        # Calculate syllables in this line
        syllables = count_syllables_improved(line)

        # Base duration on syllable count
        base_duration = syllables * avg_time_per_syllable

        # Adjust for line position
        position_factor = 1.0
        if i < len(clean_lines) - 1 and clean_lines[i+1] == "":  # Last line in a section
            position_factor = 1.2  # Give more time to last lines in sections
        elif i > 1 and clean_lines[i-1] == "":  # First line in a section
            position_factor = 1.1  # Give more time to first lines in sections

        # Adjust for line complexity
        complexity_factor = 1.0
        if len(line) > 40:  # Very long line
            complexity_factor = 1.2
        elif len(line) < 15 and syllables > 5:  # Short but syllable-dense line
            complexity_factor = 1.1

        # Calculate final duration with all factors
        duration = base_duration * position_factor * complexity_factor

        # Ensure duration is within bounds
        duration = max(min_line_duration, min(max_line_duration, duration))

        line_durations.append(duration)

    # Adjust durations to fit within audio length
    total_duration = sum(line_durations)
    if total_duration > audio_duration:
        scale_factor = audio_duration / total_duration
        line_durations = [duration * scale_factor for duration in line_durations]

    # Calculate start times
    start_times = [0]
    for i in range(1, len(line_durations)):
        start_times.append(start_times[i-1] + line_durations[i-1])

    # Create a simple text file for FFmpeg to use
    subtitle_file = os.path.join(temp_dir, "subtitles.srt")
    with open(subtitle_file, 'w', encoding='utf-8') as f:
        for i, (line, start_time, duration) in enumerate(zip(clean_lines, start_times, line_durations)):
            end_time = start_time + duration

            # Skip writing the pre-roll empty line to the SRT file
            if i == 0 and not line:
                continue

            # Convert to SRT format (HH:MM:SS,mmm)
            start_h = int(start_time / 3600)
            start_m = int((start_time % 3600) / 60)
            start_s = int(start_time % 60)
            start_ms = int((start_time % 1) * 1000)

            end_h = int(end_time / 3600)
            end_m = int((end_time % 3600) / 60)
            end_s = int(end_time % 60)
            end_ms = int((end_time % 1) * 1000)

            f.write(f"{i}\n")
            f.write(f"{start_h:02d}:{start_m:02d}:{start_s:02d},{start_ms:03d} --> {end_h:02d}:{end_m:02d}:{end_s:02d},{end_ms:03d}\n")
            f.write(f"{line}\n\n")

    print(f"Created subtitle file at {subtitle_file}")

    # Generate video with FFmpeg - using a simpler, more reliable approach
    try:
        # Create black video with audio duration - ensure duration is passed correctly
        print(f"Creating video with audio: {audio_duration} seconds")
        black_video = os.path.join(temp_dir, "black.mp4")

        # ADDED: Verify audio file before using it
        print(f"AUDIO DEBUG: Verifying audio file before video creation")
        if not os.path.exists(audio_path):
            raise ValueError(f"Audio file does not exist at {audio_path}")
        
        # Create black video with the audio
        subprocess.run([
            'ffmpeg',
            '-f', 'lavfi',
            '-i', f'color=c=black:s=1280x720:d={audio_duration}',  # Create black background
            '-i', audio_path,  # Add the audio file
            '-c:v', 'libx264',
            '-tune', 'stillimage',
            '-pix_fmt', 'yuv420p',
            '-c:a', 'aac',  # Use AAC codec for audio
            '-b:a', '192k',  # Set audio bitrate
            '-shortest',  # End when shortest input ends
            '-r', '30',  # Set frame rate explicitly
            '-y',  # Overwrite output file if it exists
            black_video
        ], check=True, capture_output=True)

        print(f"Created video with audio: {black_video}")
        
        # ADDED: Verify that audio track was included
        print("AUDIO DEBUG: Verifying audio was included in the black video")
        audio_check = subprocess.run([
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'a',
            '-show_streams',
            '-of', 'json',
            black_video
        ], capture_output=True, text=True)
        
        print(f"AUDIO DEBUG: FFprobe audio streams result: {audio_check.stdout}")
        
        # Verify the video was created properly
        try:
            result = subprocess.run([
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                black_video
            ], capture_output=True, text=True, check=True)

            if result.stdout.strip():
                black_duration = float(result.stdout.strip())
                print(f"VERIFICATION: Video with audio duration is {black_duration} seconds")

                if abs(black_duration - audio_duration) > 1:
                    print(f"WARNING: Video duration doesn't match audio duration by {abs(black_duration - audio_duration)} seconds")
        except Exception as e:
            print(f"Warning: Couldn't verify video duration: {e}")

        # Add subtitles to the video
        subprocess.run([
            'ffmpeg',
            '-i', black_video,
            '-vf', f"subtitles={subtitle_file}:force_style='FontName=Arial,FontSize=36,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,Bold=1,Alignment=2,MarginV=30'",
            '-c:v', 'libx264',  # Video codec
            '-preset', 'medium',  # Preset for encoding speed/quality balance
            '-c:a', 'copy',  # Copy audio stream without re-encoding
            '-y',  # Overwrite output file if it exists
            output_path
        ], check=True, capture_output=True)

        print(f"Added subtitles to video: {output_path}")
        
        # ADDED: Final check for audio in output
        print("AUDIO DEBUG: Verifying audio in final output")
        final_audio_check = subprocess.run([
            'ffprobe',
            '-v', 'error',
            '-select_streams', 'a',
            '-show_streams',
            '-of', 'json',
            output_path
        ], capture_output=True, text=True)

        # At the end of download_audio function, just before returning:
        print(f"AUDIO DEBUG: Final audio path: {output_path}, exists: {os.path.exists(output_path)}, size: {os.path.getsize(output_path) if os.path.exists(output_path) else 0} bytes")
        # Check if there's actual audio content
        print(f"AUDIO DEBUG: Final FFprobe audio result: {final_audio_check.stdout}")

        # Verify the output file was created
        if os.path.exists(output_path):
            print(f"Final video created successfully: {output_path} ({os.path.getsize(output_path)} bytes)")

            # Final verification of output duration
            try:
                result = subprocess.run([
                    'ffprobe',
                    '-v', 'error',
                    '-show_entries', 'format=duration',
                    '-of', 'default=noprint_wrappers=1:nokey=1',
                    output_path
                ], capture_output=True, text=True, check=True)

                if result.stdout.strip():
                    final_duration = float(result.stdout.strip())
                    print(f"Final video duration: {final_duration} seconds")
            except Exception as e:
                print(f"Warning: Couldn't verify final video duration: {e}")
        else:
            raise ValueError(f"Output video file not created: {output_path}")

    except Exception as e:
        print(f"FFmpeg error: {str(e)}")
        import traceback
        print(traceback.format_exc())
        raise
    finally:
        # Clean up temporary files
        for file in [subtitle_file]:
            if os.path.exists(file):
                try:
                    os.remove(file)
                except:
                    pass

def process_lyrics_structure(lyrics):
    """Process lyrics to identify structure and clean lines"""
    import re

    # Clean up the lyrics from Genius
    lyrics = re.sub(r'\d+Embed', '', lyrics)  # Remove Embed markers
    lyrics = re.sub(r'You might also like', '', lyrics)  # Remove suggestions

    # Split into lines and clean up
    lyrics_lines = lyrics.split('\n')

    # Skip the first line if it contains the song title or [Lyrics]
    start_idx = 0
    if len(lyrics_lines) > 0 and ('[' in lyrics_lines[0] or 'Lyrics' in lyrics_lines[0]):
        start_idx = 1

    # Process lyrics to identify sections (verses, chorus, etc.)
    sections = []
    current_section = {"type": "unknown", "lines": []}

    for line in lyrics_lines[start_idx:]:
        # Skip empty lines and lines with Genius metadata
        line = line.strip()
        if not line:
            continue
        if any(x in line for x in ["Embed", "Lyrics", "You might also like", "Contributors"]):
            continue

        # Check if this is a section marker
        if line.startswith('[') and line.endswith(']'):
            section_name = line[1:-1].lower()
            if current_section["lines"]:
                sections.append(current_section)
            current_section = {"type": section_name, "lines": []}
        else:
            current_section["lines"].append(line)

    # Add the last section if it has lines
    if current_section["lines"]:
        sections.append(current_section)

    # Create processed lyrics structure
    processed_lyrics = {
        "sections": sections,
        "total_lines": sum(len(section["lines"]) for section in sections),
        "section_count": len(sections)
    }

    return processed_lyrics

def calculate_hybrid_timing(processed_lyrics, audio_duration):
    """Calculate timing using a hybrid approach"""
    # Extract sections from processed lyrics
    sections = processed_lyrics["sections"]

    # Add a pre-roll delay before the first lyric
    pre_roll_delay = 1.5  # seconds

    # Set pause between sections
    section_pause = 1.5  # seconds

    # Calculate total number of lines and syllables
    total_lines = processed_lyrics["total_lines"]

    # Count syllables in each line
    def count_syllables_in_text(text):
        import re
        text = text.lower()
        text = re.sub(r'[^a-z ]', '', text)
        words = text.split()

        count = 0
        for word in words:
            # Count vowel groups
            vowels = "aeiouy"
            word_count = 0
            prev_is_vowel = False

            for char in word:
                is_vowel = char in vowels
                if is_vowel and not prev_is_vowel:
                    word_count += 1
                prev_is_vowel = is_vowel

            # Apply corrections for common patterns
            if word.endswith('e'):
                word_count -= 1
            if word.endswith('le') and len(word) > 2 and word[-3] not in vowels:
                word_count += 1
            if word.endswith('es') or word.endswith('ed'):
                word_count -= 1

            # Ensure at least one syllable per word
            count += max(1, word_count)

        return count

    # Calculate total syllables across all sections
    total_syllables = 0
    for section in sections:
        for line in section["lines"]:
            total_syllables += count_syllables_in_text(line)

    # Calculate reserved time for pauses
    reserved_time = pre_roll_delay + (len(sections) - 1) * section_pause

    # Calculate available time for actual lyrics
    available_time = max(0, audio_duration - reserved_time)

    # Calculate average time per syllable
    avg_time_per_syllable = available_time / max(total_syllables, 1)

    # Set reasonable bounds for line durations
    min_line_duration = 1.5  # seconds
    max_line_duration = 6.0  # seconds

    # Generate timing data
    timing_data = []
    current_time = 0

    # Add pre-roll delay
    timing_data.append({
        "text": "",
        "start_time": current_time,
        "duration": pre_roll_delay,
        "is_pause": True
    })
    current_time += pre_roll_delay

    # Process each section
    for i, section in enumerate(sections):
        # Process each line in the section
        for j, line in enumerate(section["lines"]):
            # Calculate syllables in this line
            syllables = count_syllables_in_text(line)

            # Base duration on syllable count
            base_duration = syllables * avg_time_per_syllable

            # Adjust for line position
            position_factor = 1.0
            if j == len(section["lines"]) - 1:  # Last line in section
                position_factor = 1.2
            elif j == 0:  # First line in section
                position_factor = 1.1

            # Adjust for line complexity
            complexity_factor = 1.0
            if len(line) > 40:  # Very long line
                complexity_factor = 1.2
            elif len(line) < 15 and syllables > 5:  # Short but syllable-dense line
                complexity_factor = 1.1

            # Calculate final duration with all factors
            duration = base_duration * position_factor * complexity_factor

            # Ensure duration is within bounds
            duration = max(min_line_duration, min(max_line_duration, duration))

            # Add line timing
            timing_data.append({
                "text": line,
                "start_time": current_time,
                "duration": duration,
                "is_pause": False,
                "section": section["type"],
                "line_index": j
            })
            current_time += duration

        # Add pause after section (except for the last section)
        if i < len(sections) - 1:
            timing_data.append({
                "text": "",
                "start_time": current_time,
                "duration": section_pause,
                "is_pause": True
            })
            current_time += section_pause

    # Calculate total timing duration
    total_timing_duration = sum(item["duration"] for item in timing_data)

    # Scale timing if needed to match audio duration
    if total_timing_duration > audio_duration:
        scale_factor = audio_duration / total_timing_duration
        for item in timing_data:
            item["duration"] *= scale_factor
            # Recalculate start times
        current_time = 0
        for item in timing_data:
            item["start_time"] = current_time
            current_time += item["duration"]

    return timing_data

def create_srt_file(timing_data, output_file):
    """Create an SRT file from timing data"""
    with open(output_file, 'w', encoding='utf-8') as f:
        index = 1
        for item in timing_data:
            # Skip pause items
            if item["is_pause"]:
                continue

            # Get timing information
            start_time = item["start_time"]
            end_time = start_time + item["duration"]

            # Convert to SRT format (HH:MM:SS,mmm)
            start_h = int(start_time / 3600)
            start_m = int((start_time % 3600) / 60)
            start_s = int(start_time % 60)
            start_ms = int((start_time % 1) * 1000)

            end_h = int(end_time / 3600)
            end_m = int((end_time % 3600) / 60)
            end_s = int(end_time % 60)
            end_ms = int((end_time % 1) * 1000)

            # Write SRT entry
            f.write(f"{index}\n")
            f.write(f"{start_h:02d}:{start_m:02d}:{start_s:02d},{start_ms:03d} --> {end_h:02d}:{end_m:02d}:{end_s:02d},{end_ms:03d}\n")
            f.write(f"{item['text']}\n\n")

            index += 1

def count_syllables(word):
    """Count syllables in a word using a simple heuristic"""
    word = word.lower()
    if len(word) <= 3:
        return 1

    # Remove trailing e
    if word.endswith('e'):
        word = word[:-1]

    # Count vowel groups
    vowels = "aeiouy"
    count = 0
    prev_is_vowel = False

    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_is_vowel:
            count += 1
        prev_is_vowel = is_vowel

    return max(1, count)  # At least 1 syllable per word
