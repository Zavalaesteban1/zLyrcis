import os
import tempfile
import subprocess
import re
import json
import time
import traceback
import asyncio
import requests
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
import lyricsgenius
from celery import shared_task
from django.conf import settings
from .models import VideoJob
from pathlib import Path
from difflib import SequenceMatcher

# Import advanced synchronization
try:
    from .lyric_video.advanced_synchronization import synchronize_lyrics_advanced
    ADVANCED_SYNC_AVAILABLE = True
except ImportError:
    ADVANCED_SYNC_AVAILABLE = False
    print("Advanced synchronization not available")

# Import Deepgram SDK
try:
    from deepgram import DeepgramClient, PrerecordedOptions
    DEEPGRAM_AVAILABLE = True
except ImportError:
    DEEPGRAM_AVAILABLE = False
    print("Deepgram SDK not installed. Install with: pip install deepgram-sdk")


@shared_task
def generate_lyric_video(job_id):
    """
    Main task to generate a lyric video with smooth animated lyrics
    """
    job = None
    try:
        # Get the job
        job = VideoJob.objects.get(id=job_id)
        job.status = 'processing'
        job.save()
        
        print(f"Processing job {job_id} for URL: {job.spotify_url}")
        
        # 1. Get song details from Spotify
        spotify_track_id = extract_spotify_track_id(job.spotify_url)
        song_info = get_spotify_track_info(spotify_track_id)
        
        # Update job with song details
        job.song_title = song_info['title']
        job.artist = song_info['artist']
        job.save()
        
        # 2. Get lyrics from Genius
        lyrics = get_lyrics(song_info['title'], song_info['artist'])
        if not lyrics:
            # Try simplified title (removing parts in parentheses)
            simplified_title = re.sub(r'\(.*?\)', '', song_info['title']).strip()
            if simplified_title != song_info['title']:
                lyrics = get_lyrics(simplified_title, song_info['artist'])
                
        if not lyrics:
            raise ValueError("Could not find lyrics for this song")
        
        # Process lyrics into clean lines - AGGRESSIVELY CLEAN THEM
        lyrics_lines = clean_lyrics(lyrics)
        
        # Double-check filtering - remove any metadata that might have slipped through
        filtered_lyrics_lines = remove_metadata_from_lyrics(lyrics_lines)
        
        # Create a temporary directory for processing
        with tempfile.TemporaryDirectory() as temp_dir:
            # CRITICAL FIX: Find and patch any SRT files that might be created by external systems
            # This must happen early in the process
            patch_temp_directory_srt_files(temp_dir, filtered_lyrics_lines)
            
            # 3. Get audio file (from local files or Spotify)
            audio_path = os.path.join(temp_dir, 'audio.mp3')
            
            # Try local audio first
            audio_found = get_local_audio(song_info['title'], song_info['artist'], audio_path)
            
            # If no local audio, download from Spotify
            if not audio_found:
                download_audio(spotify_track_id, audio_path)
            
            # Check that audio exists
            if not os.path.exists(audio_path) or os.path.getsize(audio_path) == 0:
                raise ValueError("Failed to get audio for this song")
            
            # Get audio duration
            audio_duration = get_audio_duration(audio_path)
            print(f"Audio duration: {audio_duration} seconds")
            
            # 4. Synchronize lyrics with audio using advanced methods
            synced_lyrics = None
            
            # Try advanced synchronization first (includes multiple methods)
            if ADVANCED_SYNC_AVAILABLE:
                print("Using advanced synchronization system")
                synced_lyrics = synchronize_lyrics_advanced(audio_path, filtered_lyrics_lines)
            
            # If advanced sync not available, try Deepgram
            if not synced_lyrics and DEEPGRAM_AVAILABLE:
                print("Falling back to Deepgram synchronization")
                synced_lyrics = synchronize_with_deepgram(audio_path, filtered_lyrics_lines)
            
            # Final fallback to basic timing
            if not synced_lyrics:
                print("Using basic fallback synchronization method")
                synced_lyrics = create_basic_synchronization(filtered_lyrics_lines, audio_duration)
            
            # CRITICAL FIX: One more check for SRT files before video generation
            patch_temp_directory_srt_files(temp_dir, filtered_lyrics_lines)
            
            # 5. Create lyric video with animated lyrics (now with ASS subtitles)
            video_path = os.path.join(temp_dir, 'output.mp4')
            create_animated_lyric_video(audio_path, synced_lyrics, song_info, video_path)
            
            # 6. Save the video
            if os.path.exists(video_path):
                # Create directories if they don't exist
                os.makedirs(os.path.dirname(settings.MEDIA_ROOT), exist_ok=True)
                
                # Final video path
                final_path = os.path.join(settings.MEDIA_ROOT, f"videos/{job_id}.mp4")
                os.makedirs(os.path.dirname(final_path), exist_ok=True)
                
                # Copy the video to the media directory
                import shutil
                shutil.copy2(video_path, final_path)
                
                # Update job
                job.video_file = f"videos/{job_id}.mp4"
                job.status = 'completed'
                job.save()
                
                print(f"Video successfully created: {final_path}")
            else:
                raise ValueError("Failed to create video file")
            
    except Exception as e:
        print(f"Error generating lyric video: {e}")
        traceback.print_exc()
        
        if job:
            job.status = 'failed'
            job.error_message = str(e)
            job.save()


def extract_spotify_track_id(spotify_url):
    """Extract Spotify track ID from URL"""
    import re
    
    # Handle various Spotify URL formats
    match = re.search(r'track/([a-zA-Z0-9]+)', spotify_url)
    if match:
        return match.group(1)
    
    match = re.search(r'spotify:track:([a-zA-Z0-9]+)', spotify_url)
    if match:
        return match.group(1)
    
    return None


def get_spotify_track_info(track_id):
    """Get track information from Spotify API"""
    # Get Spotify API credentials
    client_id = settings.SPOTIFY_CLIENT_ID
    client_secret = settings.SPOTIFY_CLIENT_SECRET
    
    # Set up Spotify client
    sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
        client_id=client_id,
        client_secret=client_secret
    ))
    
    # Get track details
    track = sp.track(track_id)
    
    # Extract relevant information
    song_info = {
        'title': track['name'],
        'artist': track['artists'][0]['name'],
        'duration_ms': track['duration_ms'],
        'album': track['album']['name'],
        'release_date': track['album']['release_date'],
        'image_url': track['album']['images'][0]['url'] if track['album']['images'] else None
    }
    
    return song_info


def get_lyrics(title, artist):
    """Get lyrics from Genius API"""
    # Get Genius API token
    genius_token = settings.GENIUS_ACCESS_TOKEN
    
    if not genius_token:
        print("Genius API token not found. Set GENIUS_ACCESS_TOKEN in settings.")
        return None
    
    # Set up Genius API client
    genius = lyricsgenius.Genius(genius_token)
    genius.verbose = False  # Turn off status messages
    
    try:
        # Search for the song
        song = genius.search_song(title, artist)
        
        if song:
            # Preprocess lyrics to remove Genius explanations and annotations
            return preprocess_genius_lyrics(song.lyrics)
        
        return None
    except Exception as e:
        print(f"Error fetching lyrics: {e}")
        return None


def preprocess_genius_lyrics(lyrics):
    """
    Preprocess Genius lyrics to remove explanations, annotations, and other non-lyric content
    """
    if not lyrics:
        return ""
    
    # IMMEDIATE REMOVAL: First directly look for and remove the problematic narration text
    # This is a very specific filter for the common problem
    lyrics = re.sub(r'The song includes narration by.*?\bRead More\b.*?(\n|$)', '', lyrics, flags=re.IGNORECASE | re.DOTALL)
    lyrics = re.sub(r'.*narration is reminiscent of.*?(\n|$)', '', lyrics, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove more explanation patterns
    lyrics = re.sub(r'.*?\[Part [IV]+\].*?(\n|$)', '', lyrics, flags=re.IGNORECASE)
    
    # Detect if lyrics start with an explanation paragraph
    # (common for songs with intros, narration explanations, etc.)
    lines = lyrics.split('\n')
    
    # Skip lines at beginning that contain explanations
    start_index = 0
    for i, line in enumerate(lines):
        # If we find a line that looks like the start of actual lyrics
        # (after potential explanations)
        stripped = line.strip()
        
        # Skip empty lines at the beginning
        if not stripped:
            continue
            
        # Check if this line has explanatory text
        lower_line = stripped.lower()
        if (any(word in lower_line for word in ['narration', 'narrated', 'narrative', 'includes', 'featuring', 
                                              'produced by', 'reminiscent', 'read more', 'reference', 
                                              'alludes', 'homage', 'tribute', 'sample']) or
            '[part' in lower_line or 
            re.search(r'\d+embed', lower_line)):
            start_index = i + 1  # Skip this line
            continue
            
        # Look for lyrics section markers (often indicate start of actual lyrics)
        if stripped.startswith('[') and ']' in stripped:
            start_index = i
            break
            
        # "Lyrics" heading often indicates the start of actual content
        if stripped.lower() == "lyrics":
            start_index = i + 1  # Start after this heading
            break
            
        # If we have a line that doesn't match any explanation patterns,
        # we've likely reached the actual lyrics
        if len(stripped) > 0 and not any(marker in lower_line for marker in 
                                     ['narration', 'produced', 'written', 'directed', 'featuring']):
            break
    
    # Only skip content if we're confident we found where lyrics actually start
    if start_index > 0:
        print(f"Skipping {start_index} lines of explanatory content in lyrics")
        lines = lines[start_index:]
    
    # Also remove content after the lyrics end (often credits, album info, etc.)
    end_index = len(lines)
    for i in range(len(lines) - 1, 0, -1):
        if any(marker in lines[i].lower() for marker in [
            "embed", 
            "you might also like",
            "more on genius",
            "read more"
        ]):
            end_index = i
            break
    
    if end_index < len(lines):
        lines = lines[:end_index]
    
    # Do a final check for any lines that might still contain metadata
    filtered_lines = []
    for line in lines:
        # Skip lines with explanatory text
        if any(marker in line.lower() for marker in [
            "narration by", "narrated by", "narrates", 
            "reminiscent", "produced by", "written by",
            "the song includes", "read more", "part i", "part ii"
        ]):
            continue
            
        # Skip lines that are too long (likely descriptions, not lyrics)
        if len(line) > 100:
            continue
            
        filtered_lines.append(line)
    
    return '\n'.join(filtered_lines)


def download_audio(track_id, output_path):
    """Download audio from Spotify"""
    try:
        # This is a placeholder as Spotify doesn't directly provide audio downloads
        # You would need to use a service like yt-dlp to download from YouTube
        
        print("Note: Direct Spotify downloads aren't available.")
        print("Using placeholder download method instead.")
        
        # You could integrate a streaming service API here
        
        # Return a dummy duration
        return 180  # 3 minutes
    except Exception as e:
        print(f"Error downloading audio: {e}")
        return None


def get_local_audio(song_title, artist, output_path):
    """Find matching audio file in local audio_files directory"""
    # Get path to audio_files directory (expected to be in project root)
    project_root = Path(__file__).resolve().parent.parent.parent
    audio_dir = project_root / 'audio_files'
    
    if not audio_dir.exists():
        print(f"Local audio directory not found: {audio_dir}")
        return False
    
    # Normalize song title and artist for comparison
    def normalize_string(s):
        # Remove special characters and convert to lowercase
        return re.sub(r'[^\w\s]', '', s.lower()).strip()
    
    # Compare similarity between strings
    def string_similarity(a, b):
        return SequenceMatcher(None, a, b).ratio()
    
    normalized_title = normalize_string(song_title)
    normalized_artist = normalize_string(artist)
    
    # Look for matching files
    best_match = None
    best_score = 0
    
    # Check various audio file extensions
    for ext in ['.mp3', '.m4a', '.wav', '.flac', '.ogg']:
        for file_path in audio_dir.glob(f'**/*{ext}'):
            filename = file_path.stem
            
            # Check different filename formats:
            # 1. "Artist - Title.mp3"
            # 2. "Title - Artist.mp3"
            # 3. "Title.mp3"
            
            # Calculate similarity score
            if ' - ' in filename:
                parts = filename.split(' - ')
                if len(parts) == 2:
                    # Try both "Artist - Title" and "Title - Artist" formats
                    score1 = (string_similarity(normalize_string(parts[0]), normalized_artist) * 0.5 +
                              string_similarity(normalize_string(parts[1]), normalized_title) * 0.5)
                    
                    score2 = (string_similarity(normalize_string(parts[0]), normalized_title) * 0.5 +
                              string_similarity(normalize_string(parts[1]), normalized_artist) * 0.5)
                    
                    score = max(score1, score2)
                else:
                    score = 0
            else:
                # Just compare with title
                score = string_similarity(normalize_string(filename), normalized_title)
            
            # Update best match if better score
            if score > best_score and score > 0.7:  # Threshold for match
                best_score = score
                best_match = file_path
    
    # If a good match is found, copy to output_path
    if best_match:
        print(f"Found local audio file: {best_match} (match score: {best_score:.2f})")
        import shutil
        shutil.copy2(best_match, output_path)
        return True
    
    print("No suitable local audio file found.")
    return False


def get_audio_duration(audio_path):
    """Get the duration of audio file using ffprobe"""
    result = subprocess.run([
        'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
        '-of', 'default=noprint_wrappers=1:nokey=1', audio_path
    ], capture_output=True, text=True)
    
    if result.stdout:
        return float(result.stdout.strip())
    
    # Fallback - try another method
    result = subprocess.run([
        'ffmpeg', '-i', audio_path, '-f', 'null', '-'
    ], stderr=subprocess.PIPE, text=True)
    
    # Parse duration from ffmpeg output
    duration_match = re.search(r'Duration: (\d{2}):(\d{2}):(\d{2})\.(\d{2})', result.stderr)
    if duration_match:
        h, m, s, ms = map(int, duration_match.groups())
        return h * 3600 + m * 60 + s + ms / 100
    
    # Default duration if all else fails
    return 180  # 3 minutes


async def _process_deepgram(api_key, audio_file_path):
    """Helper function to process audio with Deepgram API"""
    try:
        # Create Deepgram client
        deepgram = DeepgramClient(api_key)
        
        # Read audio file
        with open(audio_file_path, 'rb') as audio:
            payload = audio.read()
        
        # Set options for transcription
        options = PrerecordedOptions(
            model="nova-2",
            language="en",
            detect_language=True,
            diarize=False,
            smart_format=True,
            utterances=True
        )
        
        # Send request to Deepgram
        response = await deepgram.listen.prerecorded.v("1").transcribe_file(payload, options)
        
        return response
    except Exception as e:
        print(f"Deepgram processing error: {e}")
        return None


def synchronize_with_deepgram(audio_path, lyrics_lines):
    """Use Deepgram to synchronize lyrics with audio"""
    if not DEEPGRAM_AVAILABLE:
        print("Deepgram SDK not available. Skipping Deepgram synchronization.")
        return None
    
    try:
        # Get Deepgram API key
        api_key = os.environ.get("DEEPGRAM_API_KEY")
        if not api_key:
            print("Deepgram API key not found.")
            return None
        
        # Process with Deepgram
        response = asyncio.run(_process_deepgram(api_key, audio_path))
        
        if not response or not hasattr(response, 'results'):
            print("Invalid Deepgram response")
            return None
        
        # Extract utterances
        utterances = response.results.utterances
        if not utterances:
            print("No utterances found in Deepgram response")
            return None
        
        # Match lyrics lines with utterances
        synced_lyrics = []
        current_idx = 0
        
        for line in lyrics_lines:
            if not line.strip():
                continue
                
            # Find best matching utterance
            best_match = None
            best_score = 0
            
            # Only look at the next few utterances to avoid incorrect matches
            search_range = min(len(utterances) - current_idx, 5)
            
            for i in range(search_range):
                if current_idx + i >= len(utterances):
                    break
                    
                utterance = utterances[current_idx + i]
                similarity = SequenceMatcher(None, 
                                            line.lower(), 
                                            utterance.transcript.lower()).ratio()
                
                if similarity > best_score:
                    best_score = similarity
                    best_match = utterance
            
            # If we found a good match, use its timing
            if best_match and best_score > 0.6:  # Threshold for good match
                current_idx += 1  # Move to next utterance for next line
                
                synced_lyrics.append({
                    "text": line,
                    "start_time": best_match.start,
                    "end_time": best_match.end,
                    "duration": best_match.end - best_match.start
                })
            else:
                # Estimate timing if no good match
                if synced_lyrics:
                    # Base on previous line timing
                    prev_end = synced_lyrics[-1]["end_time"]
                    # Estimate duration based on line length
                    est_duration = max(2.0, len(line) * 0.05)
                    
                    synced_lyrics.append({
                        "text": line,
                        "start_time": prev_end + 0.3,  # Small gap between lines
                        "end_time": prev_end + 0.3 + est_duration,
                        "duration": est_duration
                    })
                else:
                    # First line with no match - assume it starts at beginning
                    est_duration = max(2.0, len(line) * 0.05)
                    synced_lyrics.append({
                        "text": line,
                        "start_time": 0,
                        "end_time": est_duration,
                        "duration": est_duration
                    })
        
        print(f"Deepgram synchronized {len(synced_lyrics)} lyrics lines")
        return synced_lyrics
        
    except Exception as e:
        print(f"Error in Deepgram synchronization: {e}")
        traceback.print_exc()
        return None


def create_basic_synchronization(lyrics_lines, audio_duration):
    """Create basic timing for lyrics when Deepgram is not available"""
    # Skip empty lines
    non_empty_lines = [line for line in lyrics_lines if line.strip()]
    
    if not non_empty_lines:
        return []
    
    # Improved intro time detection - typically songs start vocals after 10-20% of audio
    # For very short songs, use less intro time; for long songs, cap at 30 seconds
    if audio_duration < 120:  # Short song (less than 2 minutes)
        intro_time = min(15, audio_duration * 0.10)  # 10% with 15 second max
    elif audio_duration < 240:  # Medium song (2-4 minutes)
        intro_time = min(20, audio_duration * 0.12)  # 12% with 20 second max
    else:  # Long song (over 4 minutes)
        intro_time = min(30, audio_duration * 0.15)  # 15% with 30 second max
    
    print(f"Estimated intro time: {intro_time} seconds")
    
    # Calculate time per line, adjusting for song length
    available_time = audio_duration - intro_time - 5  # Reserve 5 seconds at the end
    time_per_line = available_time / len(non_empty_lines)
    
    # Cap line duration within reasonable limits
    time_per_line = max(1.5, min(time_per_line, 4.0))
    
    # Create timing data with adjusted durations based on line length
    synced_lyrics = []
    current_time = intro_time
    
    for line in non_empty_lines:
        # Adjust duration based on line length and complexity
        line_length_factor = len(line) / 30  # Normalize to 30 chars as baseline
        duration = max(1.5, min(time_per_line * line_length_factor, 5.0))
        
        # For very short lines (likely solo words or exclamations), reduce duration
        if len(line) < 5:
            duration = max(1.0, duration * 0.6)
        
        # For very long lines, increase duration but cap at reasonable limit
        if len(line) > 50:
            duration = min(6.0, duration * 1.2)
        
        synced_lyrics.append({
            "text": line,
            "start_time": current_time,
            "end_time": current_time + duration,
            "duration": duration
        })
        
        # Add small gap between lines, shorter for shorter lines
        gap = 0.1 + (0.1 * min(1.0, duration / 3.0))
        current_time += duration + gap
    
    # Final pass - ensure no overlap between lines
    for i in range(1, len(synced_lyrics)):
        if synced_lyrics[i]["start_time"] < synced_lyrics[i-1]["end_time"]:
            # Fix overlap by shifting current line
            overlap = synced_lyrics[i-1]["end_time"] - synced_lyrics[i]["start_time"]
            synced_lyrics[i]["start_time"] += overlap + 0.1  # Add small extra gap
            synced_lyrics[i]["end_time"] += overlap + 0.1
    
    return synced_lyrics


def create_animated_lyric_video(audio_path, synced_lyrics, song_info, output_path):
    """Create a lyric video with vertically animated lyrics using ASS format"""
    try:
        # EXTRA VALIDATION: Filter synced lyrics before creating subtitles
        cleaned_synced_lyrics = []
        
        # These words/phrases strongly indicate metadata, not lyrics
        metadata_indicators = [
            "narration by", "narrated by", "narrates", "the song includes",
            "reminiscent", "read more", "produced by", "written by", 
            "refers to", "alludes to"
        ]
        
        for lyric in synced_lyrics:
            # Check for metadata indicators
            contains_metadata = False
            for indicator in metadata_indicators:
                if indicator.lower() in lyric["text"].lower():
                    contains_metadata = True
                    break
                    
            # Skip lines with metadata or extremely long lines (likely explanations)
            if contains_metadata or len(lyric["text"]) > 100:
                continue
                
            # Skip lines starting with "Part" or other section markers
            if re.search(r'^\[Part [IVX]+\]', lyric["text"]) or lyric["text"].startswith("Read More"):
                continue
                
            cleaned_synced_lyrics.append(lyric)
            
        # Use the cleaned synced lyrics
        synced_lyrics = cleaned_synced_lyrics
        
        # Warn if we filtered out a lot of lyrics (might indicate metadata issues)
        if len(cleaned_synced_lyrics) < len(synced_lyrics) - 3:  # Allow for a few normal filtering cases
            print(f"WARNING: Filtered out {len(synced_lyrics) - len(cleaned_synced_lyrics)} lyrics that may be metadata!")
            
        # Continue with the rest of the function
        # 1. Create ASS subtitle file with animated vertical text
        subtitle_path = os.path.splitext(output_path)[0] + '.ass'
        create_animated_subtitles(synced_lyrics, song_info, subtitle_path)
        
        # Check if an SRT file was also created (by other parts of the process)
        # This often happens with some ffmpeg workflows
        srt_path = os.path.splitext(output_path)[0] + '.srt'
        if os.path.exists(srt_path):
            print("Found SRT file, checking and fixing any metadata...")
            if check_and_fix_srt(srt_path):
                print("Fixed metadata in SRT file!")
        
        # 2. Generate background video with gradient effect
        audio_duration = get_audio_duration(audio_path)
        temp_bg = os.path.splitext(output_path)[0] + '_bg.mp4'
        
        # Create a more dynamic gradient background with subtle animation
        # The moving gradient works better with vertical lyrics
        # Using a dark gradient allows the text to stand out better
        subprocess.run([
            'ffmpeg', '-y',
            '-f', 'lavfi',
            '-i', f'gradients=s=1280x720:c0=0x000428:c1=0x004e92:d={audio_duration}:speed=0.02',
            '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
            temp_bg
        ], check=True)
        
        # If the gradient filter fails (may happen in some ffmpeg versions), fall back to simpler background
        if not os.path.exists(temp_bg) or os.path.getsize(temp_bg) == 0:
            print("Falling back to basic background...")
            subprocess.run([
                'ffmpeg', '-y',
                '-f', 'lavfi',
                '-i', f'color=c=black:s=1280x720:d={audio_duration}',
                '-vf', 'drawbox=x=0:y=0:w=iw:h=ih:color=blue@0.4:t=fill,format=yuv420p',
                '-c:v', 'libx264', '-pix_fmt', 'yuv420p',
                temp_bg
            ], check=True)
        
        # 3. Combine background, audio, and ASS subtitles
        subprocess.run([
            'ffmpeg', '-y',
            '-i', temp_bg,
            '-i', audio_path,
            '-vf', f'ass={subtitle_path}',
            '-c:v', 'libx264', '-crf', '22',  # Slightly better quality
            '-c:a', 'aac', '-b:a', '192k',
            '-shortest',
            output_path
        ], check=True)
        
        # Make sure no additional SRT files were created during this process
        final_srt = os.path.splitext(output_path)[0] + '.srt'
        if os.path.exists(final_srt):
            print("Checking final SRT file...")
            check_and_fix_srt(final_srt)
        
        print(f"Created lyric video: {output_path}")
        return output_path
        
    except Exception as e:
        print(f"Error creating lyric video: {e}")
        traceback.print_exc()
        return None


def create_animated_subtitles(synced_lyrics, song_info, output_path):
    """Create animated ASS subtitles with vertical flowing text effect"""
    # ASS subtitle header with vertical styling
    header = """[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
Aspect Ratio: 16:9
Collisions: Normal
Title: Lyrics

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Default,Arial,42,&H00FFFFFF,&H000000FF,&H00000000,&H00000000,0,0,0,0,100,100,0,0,1,2,0,2,10,10,30,1
Style: Title,Arial,64,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,1,0,0,0,100,100,0,0,1,2,1,8,10,10,40,1
Style: Artist,Arial,48,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,8,10,10,120,1
Style: LyricLine,Arial,46,&H00FFFFFF,&H000000FF,&H00000000,&H80000000,0,0,0,0,100,100,0,0,1,2,1,5,10,10,30,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text
"""
    
    # Add title and artist at the beginning with fancy animation
    events = [
        f"Dialogue: 0,0:00:00.00,0:00:05.00,Title,,0,0,0,,{{\\fad(300,500)\\t(0,1000,\\fscx120\\fscy120)\\t(1000,2000,\\fscx100\\fscy100)}}{song_info['title']}",
        f"Dialogue: 0,0:00:00.00,0:00:05.00,Artist,,0,0,0,,{{\\fad(300,500)\\t(500,1500,\\fscx110\\fscy110)\\t(1500,2500,\\fscx100\\fscy100)}}{song_info['artist']}"
    ]
    
    # Define a central vertical area for lyrics display
    # Center horizontally (640) with different vertical positions
    center_x = 640
    vertical_start = 220  # Starting position from top
    max_vertical = 650    # Maximum vertical position
    vertical_spacing = 68  # Space between lines
    
    # Define colors for visual appeal (in ASS format: &HAABBGGRR)
    colors = [
        "&H00FFFFFF",  # White
        "&H0000FFFF",  # Yellow
        "&H000080FF",  # Orange
        "&H000000FF",  # Red
        "&H00FF00FF",  # Magenta
        "&H00FF0000",  # Blue
        "&H0000FF00",  # Green
    ]
    
    # Process each lyric with vertical animation effect
    for i, lyric in enumerate(synced_lyrics):
        # Format timing
        start_h = int(lyric["start_time"] // 3600)
        start_m = int((lyric["start_time"] % 3600) // 60)
        start_s = int(lyric["start_time"] % 60)
        start_cs = int((lyric["start_time"] % 1) * 100)
        
        end_h = int(lyric["end_time"] // 3600)
        end_m = int((lyric["end_time"] % 3600) // 60)
        end_s = int(lyric["end_time"] % 60)
        end_cs = int((lyric["end_time"] % 1) * 100)
        
        start_time = f"{start_h}:{start_m:02d}:{start_s:02d}.{start_cs:02d}"
        end_time = f"{end_h}:{end_m:02d}:{end_s:02d}.{end_cs:02d}"
        
        # Create karaoke effect with character-by-character timing
        text = lyric["text"]
        duration = lyric["duration"]
        
        # Calculate time per character for smooth animation
        chars = len(text)
        if chars == 0:
            continue
            
        ms_per_char = int((duration * 1000) / chars)
        
        # Select color for this line (cycle through colors)
        current_color = colors[i % len(colors)]
        next_color = colors[(i + 1) % len(colors)]
        
        # Calculate vertical position for this line
        vertical_position = vertical_start + ((i % 6) * vertical_spacing)
        if vertical_position > max_vertical:
            vertical_position = vertical_start
        
        # Create karaoke effect with k-timing and vertical positioning
        k_text = ""
        for char in text:
            if char == " ":
                k_text += " "  # Don't animate spaces
            else:
                k_text += f"{{\\k{ms_per_char}}}{char}"
        
        # Add dialogue event with multiple effects:
        # 1. Positioned vertically using \pos(x,y)
        # 2. Fade in/out using \fad(fade_in,fade_out)
        # 3. Color transition during animation using \t and \1c
        # 4. Scale/size change during animation using \t and \fscx/\fscy
        # 5. Border adjustment for better visibility
        events.append(
            f"Dialogue: 0,{start_time},{end_time},LyricLine,,0,0,0,,"
            f"{{\\pos({center_x},{vertical_position})\\fad(200,300)"
            f"\\1c{current_color}\\bord2"
            f"\\t(0,{ms_per_char*3},\\fscx110\\fscy110\\1c{current_color})"
            f"\\t({ms_per_char*3},{duration*500},\\fscx100\\fscy100\\1c{next_color})"
            f"}}{k_text}"
        )
    
    # Write subtitle file
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(header + '\n'.join(events))
    
    return output_path


def clean_lyrics(lyrics):
    """Clean lyrics text and split into lines, aggressively removing Genius metadata"""
    if not lyrics:
        return []
        
    # DIRECT FILTER: Remove specific problematic phrases before any other processing
    lyrics = re.sub(r'The song includes narration by.*?Read More.*?(\n|$)', '', lyrics, flags=re.IGNORECASE | re.DOTALL)
    
    # Remove unnecessary text
    lyrics = re.sub(r'\d+Embed', '', lyrics)
    lyrics = re.sub(r'You might also like', '', lyrics)
    
    # Split into lines
    lines = lyrics.split('\n')
    
    # Clean up lines
    clean_lines = []
    skip_next_lines = 0
    
    for line in lines:
        line = line.strip()
        
        # Skip empty lines
        if not line:
            continue
            
        # Skip lines that are part of a multi-line explanation (like "Read More")
        if skip_next_lines > 0:
            skip_next_lines -= 1
            continue
        
        # AGGRESSIVE FILTERING: Skip any line with explanatory content    
        # Skip lines that might be annotations, explanations, or metadata
        contains_metadata = False
        
        # These words/phrases strongly indicate metadata, not lyrics
        metadata_indicators = [
            "narration by", "narrated by", "narrates", "the song includes",
            "reminiscent", "read more", "produced by", "written by", 
            "directed by", "featuring", "feat.", "ft.", 
            "refers to", "alludes to", "sample", "homage",
            "released on", "mixtape", "album", "single", 
            "music video", "video below", "official"
        ]
        
        for indicator in metadata_indicators:
            if indicator.lower() in line.lower():
                contains_metadata = True
                break
                
        if contains_metadata:
            # If it contains "Read More", skip next line too as it's likely part of explanation
            if "read more" in line.lower():
                skip_next_lines = 1
            continue
            
        # Skip bracket annotations like [Verse], [Chorus], [Part 1], etc.
        if (line.startswith('[') and line.endswith(']')) or (line.startswith('(') and line.endswith(')')):
            continue
            
        # Skip lines that look like metadata descriptions
        if re.search(r'(produced|written|directed|mixed|mastered|engineered) by', line.lower()):
            continue
            
        # Skip lines that are dates or years
        if re.match(r'^\d{4}(-\d{2}-\d{2})?$', line):
            continue
            
        # Skip lines that look like timestamps
        if re.match(r'^\d+:\d+$', line):
            continue
            
        # Skip lines that start with a name followed by a colon (common in Genius annotations)
        if re.match(r'^[A-Z][a-z]+ ?[A-Z][a-z]+:', line):
            continue
            
        # Skip long explanatory text (these are definitely not lyrics)
        if len(line) > 80 and any(x in line.lower() for x in ["refers to", "alludes to", "mentions", "references", "explanation", "interpret"]):
            continue
            
        # Skip lines with "Part" followed by Roman numerals (common in annotations)
        if re.search(r'\[Part [IVX]+\]', line):
            continue
            
        clean_lines.append(line)
    
    return clean_lines


def remove_metadata_from_lyrics(lyrics_lines):
    """Additional filter to remove any metadata that might have slipped through"""
    filtered = []
    
    metadata_phrases = [
        "narration by", "narrated by", "narrates", 
        "the song includes", "includes narration",
        "reminiscent", "read more", 
        "produced by", "written by", "directed by",
        "featuring", "part i", "part ii"
    ]
    
    for line in lyrics_lines:
        # Skip empty lines
        if not line.strip():
            continue
            
        # Skip lines with metadata phrases
        skip_line = False
        for phrase in metadata_phrases:
            if phrase.lower() in line.lower():
                skip_line = True
                break
                
        # Skip lines with brackets that aren't typical verse markers
        if (line.startswith('[') and line.endswith(']') and 
            not any(x in line.lower() for x in ['verse', 'chorus', 'hook', 'bridge', 'intro', 'outro'])):
            skip_line = True
            
        # Skip extremely long lines (likely explanations)
        if len(line) > 100:
            skip_line = True
            
        if not skip_line:
            filtered.append(line)
            
    return filtered


def check_and_fix_srt(srt_path):
    """Check SRT file for metadata lines and remove them"""
    if not os.path.exists(srt_path):
        return False
        
    try:
        with open(srt_path, 'r', encoding='utf-8') as f:
            lines = f.readlines()
            
        # Process SRT content
        fixed_lines = []
        skip_block = False
        i = 0
        
        metadata_phrases = [
            "narration by", "narrated by", "narrates", 
            "the song includes", "includes narration",
            "reminiscent", "read more", 
            "produced by", "written by", "directed by",
            "featuring", "part i", "part ii"
        ]
        
        while i < len(lines):
            line = lines[i].strip()
            
            # Process subtitle blocks (number, timestamp, text, blank line)
            if line.isdigit():  # Start of a block
                block_num = int(line)
                timestamp_line = lines[i+1] if i+1 < len(lines) else ""
                text_line = lines[i+2] if i+2 < len(lines) else ""
                
                # Check if this block contains metadata
                skip_block = False
                for phrase in metadata_phrases:
                    if phrase.lower() in text_line.lower():
                        skip_block = True
                        break
                        
                # Skip very long lines (likely explanations)
                if len(text_line) > 100:
                    skip_block = True
                
                # If not skipping, add this block
                if not skip_block:
                    fixed_lines.append(f"{len(fixed_lines)//4 + 1}\n")  # Renumber blocks
                    fixed_lines.append(timestamp_line + "\n")
                    fixed_lines.append(text_line + "\n")
                    fixed_lines.append("\n")  # Blank line
                    
                # Skip to next block
                i += 4
            else:
                # Handle irregular format, just add the line
                i += 1
                
        # Only rewrite if we found and fixed issues
        if len(fixed_lines) < len(lines):
            with open(srt_path, 'w', encoding='utf-8') as f:
                f.writelines(fixed_lines)
            return True
            
        return False
        
    except Exception as e:
        print(f"Error checking SRT file: {e}")
        return False


def patch_temp_directory_srt_files(temp_dir, clean_lyrics):
    """
    Scan a directory for SRT files and replace any metadata text with cleaned lyrics.
    This is a critical patch to fix external systems that might create SRT files with metadata.
    """
    print(f"CRITICAL FIX: Scanning {temp_dir} for SRT files to patch...")
    
    # Look for common SRT files
    srt_files = []
    for root, dirs, files in os.walk(temp_dir):
        for file in files:
            if file.endswith('.srt'):
                srt_files.append(os.path.join(root, file))
    
    if not srt_files:
        print("No SRT files found to patch.")
        return
    
    # We found SRT files that might contain metadata
    print(f"Found {len(srt_files)} SRT files to check: {srt_files}")
    
    # Get the clean lyrics ready
    if not clean_lyrics:
        print("WARNING: No clean lyrics available for patching SRT files!")
        return
        
    # Patch each SRT file
    for srt_file in srt_files:
        print(f"Checking SRT file: {srt_file}")
        
        try:
            # Read the original SRT content
            with open(srt_file, 'r', encoding='utf-8') as f:
                srt_content = f.readlines()
                
            # Check for metadata indicators
            needs_fixing = False
            for line in srt_content:
                if any(phrase in line.lower() for phrase in [
                    "narration by", "the song includes", "reminiscent",
                    "produced by", "read more", "part i", "part ii"
                ]):
                    needs_fixing = True
                    break
                    
            if not needs_fixing:
                print(f"SRT file {srt_file} looks clean, no need to patch.")
                continue
                
            print(f"CRITICAL FIX: Found metadata in {srt_file}, replacing with clean lyrics!")
            
            # Parse the SRT structure to get timestamps
            timestamps = []
            subtitle_blocks = []
            current_block = []
            
            for line in srt_content:
                if line.strip() == '':
                    if current_block:
                        subtitle_blocks.append(current_block)
                        current_block = []
                else:
                    current_block.append(line.strip())
                    
            if current_block:  # Add the last block if exists
                subtitle_blocks.append(current_block)
                
            # Extract timestamps from blocks
            for block in subtitle_blocks:
                if len(block) >= 2:  # There should be at least index and timestamp
                    # Timestamps are typically in the second line with format: 00:00:01,000 --> 00:00:04,000
                    timestamp_line = block[1]
                    if '-->' in timestamp_line:
                        timestamps.append(timestamp_line)
            
            # Now create a new SRT file with clean lyrics
            new_srt_content = []
            
            # Make sure we have enough timestamps
            num_lyrics = min(len(clean_lyrics), len(timestamps))
            
            for i in range(num_lyrics):
                new_srt_content.append(f"{i+1}\n")  # Index
                new_srt_content.append(f"{timestamps[i]}\n")  # Timestamp
                new_srt_content.append(f"{clean_lyrics[i]}\n")  # Clean lyric
                new_srt_content.append("\n")  # Empty line
                
            # Write the new clean SRT file
            with open(srt_file, 'w', encoding='utf-8') as f:
                f.writelines(new_srt_content)
                
            print(f"CRITICAL FIX: Successfully patched {srt_file} with clean lyrics!")
            
        except Exception as e:
            print(f"Error patching SRT file {srt_file}: {e}")
            traceback.print_exc()
            
    print("CRITICAL FIX: SRT file patching complete.")
