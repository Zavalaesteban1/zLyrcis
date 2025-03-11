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
            create_lyric_video(audio_path, lyrics, video_path, audio_duration)

            # Save the video file
            with open(video_path, 'rb') as video_file:
                job.video_file.save(f"{job.id}.mp4", video_file)

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

        track = sp.track(track_id)

        return {
            'title': track['name'],
            'artist': track['artists'][0]['name'],
            'album': track['album']['name'],
            'duration_ms': track['duration_ms'],
            'album_art_url': track['album']['images'][0]['url'] if track['album']['images'] else None
        }
    except spotipy.exceptions.SpotifyException as e:
        print(f"Spotify API error: {str(e)}")
        raise
    except Exception as e:
        print(f"Error in get_spotify_track_info: {str(e)}")
        traceback.print_exc()
        raise

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
    Create a silent audio file with the correct duration from Spotify
    """
    # Get track info to determine duration
    track_info = get_spotify_track_info(track_id)
    duration_seconds = track_info['duration_ms'] / 1000


    print(f"Song duration from Spotify: {duration_seconds} seconds")

    # Debug: Print detailed duration info to identify any issues
    print(f"Track duration in MS: {track_info['duration_ms']}")
    print(f"Track duration in seconds: {duration_seconds}")

    # Create completely silent audio file with the correct duration
    # Using libmp3lame codec instead of pcm_s16le for MP3 files
    subprocess.run([
        'ffmpeg',
        '-f', 'lavfi',
        '-i', 'sine=frequency=0:sample_rate=44100:duration=' + str(duration_seconds),
        '-c:a', 'libmp3lame',  # Use MP3 codec for MP3 files
        output_path
    ], check=True, capture_output=True)

    # Verify the file was created and check its duration
    if os.path.exists(output_path):
        try:
            result = subprocess.run([
                'ffprobe',
                '-v', 'error',
                '-show_entries', 'format=duration',
                '-of', 'default=noprint_wrappers=1:nokey=1',
                output_path
            ], capture_output=True, text=True, check=True)

            if result.stdout.strip():
                actual_duration = float(result.stdout.strip())
                print(f"VERIFICATION: Silent audio file duration is {actual_duration} seconds")

                if abs(actual_duration - duration_seconds) > 5:  # Allow small differences
                    print(f"WARNING: Audio duration mismatch by {abs(actual_duration - duration_seconds)} seconds")

                # Return the actual duration instead of the expected one
                return actual_duration
        except Exception as e:
            print(f"Warning: Couldn't verify audio duration: {e}")

    print(f"Using expected duration: {duration_seconds} seconds")
    return duration_seconds

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

def create_lyric_video(audio_path, lyrics, output_path, audio_duration=None):
    """
    Create a lyric video with FFmpeg that properly displays lyrics
    with improved timing based on line length, syllable count, and position
    """
    import os
    import re
    import subprocess

    # Debug the raw lyrics
    print("Raw lyrics (first 200 chars):")
    print(lyrics[:200] if lyrics else "No lyrics found!")

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

    # Add a pre-roll delay before the first lyric
    pre_roll_delay = 1.5  # seconds

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
        print(f"Creating black video with duration: {audio_duration} seconds")
        black_video = os.path.join(temp_dir, "black.mp4")

        # Create black video
        subprocess.run([
            'ffmpeg',
            '-f', 'lavfi',
            '-i', f'color=c=black:s=1280x720:d={audio_duration}',  # Explicitly set the duration
            '-c:v', 'libx264',
            '-tune', 'stillimage',
            '-pix_fmt', 'yuv420p',
            '-r', '30',  # Set frame rate explicitly
            black_video
        ], check=True, capture_output=True)

        print(f"Created black background video: {black_video}")

        # Add very detailed duration verification
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
                print(f"VERIFICATION: Black video duration is {black_duration} seconds")

                if abs(black_duration - audio_duration) > 1:
                    print(f"CRITICAL WARNING: Video duration doesn't match audio duration by {abs(black_duration - audio_duration)} seconds")
                    print(f"This could explain the 30-second limit issue")
        except Exception as e:
            print(f"Warning: Couldn't verify black video duration: {e}")

        # When combining video and audio, don't use the audio at all for now
        # Just copy the black video for the final output
        print("Skipping audio addition as requested - using video only")
        video_with_audio = black_video  # Just use the black video directly

        # Then continue with adding subtitles to the video
        subprocess.run([
            'ffmpeg',
            '-i', video_with_audio,
            '-vf', f"subtitles={subtitle_file}:force_style='FontName=Arial,FontSize=36,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,BackColour=&H80000000,Bold=1,Alignment=2,MarginV=30'",
            '-c:v', 'libx264',  # Explicitly set video codec
            '-preset', 'medium',  # Use a medium preset for reasonable quality/speed
            '-t', str(audio_duration),  # Explicitly set the output duration
            output_path
        ], check=True, capture_output=True)

        print(f"Added subtitles to video: {output_path}")

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
