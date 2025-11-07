#!/usr/bin/env python3
"""
Synchronization debugging and testing utility.

This script helps test and debug lyrics-to-audio synchronization by:
1. Analyzing audio files
2. Testing different synchronization methods
3. Generating detailed timing reports
4. Creating test videos for validation
"""

import os
import sys
import json
import argparse
from pathlib import Path

# Add Django settings
import django
from django.conf import settings

# Configure Django
if not settings.configured:
    os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lyric_video_project.settings')
    django.setup()

# Import synchronization modules
try:
    from api.lyric_video.advanced_synchronization import AdvancedLyricSynchronizer
    from api.tasks import (
        get_lyrics, clean_lyrics, remove_metadata_from_lyrics,
        synchronize_with_deepgram, create_basic_synchronization,
        get_spotify_track_info, extract_spotify_track_id
    )
    SYNC_AVAILABLE = True
except ImportError as e:
    print(f"Import error: {e}")
    SYNC_AVAILABLE = False


def test_audio_analysis(audio_path: str):
    """Test audio analysis features"""
    print(f"\n=== AUDIO ANALYSIS FOR {audio_path} ===")
    
    if not os.path.exists(audio_path):
        print(f"Error: Audio file not found: {audio_path}")
        return None
    
    try:
        synchronizer = AdvancedLyricSynchronizer(audio_path)
        features = synchronizer.analyze_audio()
        
        if features:
            print(f"✓ Audio analysis successful")
            print(f"  Tempo: {features.tempo:.2f} BPM")
            print(f"  Beat times: {len(features.beat_times)} beats detected")
            print(f"  Onset times: {len(features.onset_times)} onsets detected")
            print(f"  Vocal segments: {len(features.vocal_segments)} segments")
            
            for i, (start, end) in enumerate(features.vocal_segments):
                duration = end - start
                print(f"    Segment {i+1}: {start:.2f}s - {end:.2f}s ({duration:.2f}s)")
            
            return features
        else:
            print("✗ Audio analysis failed")
            return None
            
    except Exception as e:
        print(f"✗ Audio analysis error: {e}")
        return None


def test_lyrics_processing(spotify_url: str):
    """Test lyrics retrieval and processing"""
    print(f"\n=== LYRICS PROCESSING FOR {spotify_url} ===")
    
    try:
        # Get track info
        track_id = extract_spotify_track_id(spotify_url)
        if not track_id:
            print("✗ Could not extract Spotify track ID")
            return None
            
        song_info = get_spotify_track_info(track_id)
        print(f"✓ Track: {song_info['title']} by {song_info['artist']}")
        
        # Get lyrics
        lyrics = get_lyrics(song_info['title'], song_info['artist'])
        if not lyrics:
            print("✗ Could not retrieve lyrics")
            return None
            
        print(f"✓ Raw lyrics retrieved ({len(lyrics)} characters)")
        
        # Process lyrics
        lyrics_lines = clean_lyrics(lyrics)
        filtered_lines = remove_metadata_from_lyrics(lyrics_lines)
        
        print(f"✓ Processed lyrics: {len(filtered_lines)} lines")
        print("First 5 lines:")
        for i, line in enumerate(filtered_lines[:5]):
            print(f"  {i+1}: {line}")
        
        return {
            'song_info': song_info,
            'lyrics_lines': filtered_lines
        }
        
    except Exception as e:
        print(f"✗ Lyrics processing error: {e}")
        return None


def test_synchronization_methods(audio_path: str, lyrics_lines: list):
    """Test different synchronization methods"""
    print(f"\n=== SYNCHRONIZATION TESTING ===")
    
    results = {}
    
    # Test 1: Advanced synchronization
    try:
        print("\n--- Testing Advanced Synchronization ---")
        synchronizer = AdvancedLyricSynchronizer(audio_path)
        synchronizer.analyze_audio()
        
        advanced_result = synchronizer.synchronize_lyrics(lyrics_lines)
        if advanced_result:
            results['advanced'] = [
                {
                    'text': lyric.text,
                    'start_time': lyric.start_time,
                    'end_time': lyric.end_time,
                    'duration': lyric.duration,
                    'confidence': lyric.confidence,
                    'method': lyric.method
                }
                for lyric in advanced_result
            ]
            print(f"✓ Advanced sync: {len(advanced_result)} lyrics synchronized")
            
            # Show method distribution
            methods = {}
            for lyric in advanced_result:
                methods[lyric.method] = methods.get(lyric.method, 0) + 1
            
            print("  Method distribution:")
            for method, count in methods.items():
                print(f"    {method}: {count} lyrics")
        else:
            print("✗ Advanced synchronization failed")
            
    except Exception as e:
        print(f"✗ Advanced synchronization error: {e}")
    
    # Test 2: Deepgram synchronization
    try:
        print("\n--- Testing Deepgram Synchronization ---")
        deepgram_result = synchronize_with_deepgram(audio_path, lyrics_lines)
        if deepgram_result:
            results['deepgram'] = deepgram_result
            print(f"✓ Deepgram sync: {len(deepgram_result)} lyrics synchronized")
        else:
            print("✗ Deepgram synchronization failed or not available")
    except Exception as e:
        print(f"✗ Deepgram synchronization error: {e}")
    
    # Test 3: Basic synchronization
    try:
        print("\n--- Testing Basic Synchronization ---")
        # Get audio duration first
        import subprocess
        result = subprocess.run([
            'ffprobe', '-v', 'error', '-show_entries', 'format=duration',
            '-of', 'default=noprint_wrappers=1:nokey=1', audio_path
        ], capture_output=True, text=True)
        
        duration = float(result.stdout.strip()) if result.stdout else 180.0
        
        basic_result = create_basic_synchronization(lyrics_lines, duration)
        if basic_result:
            results['basic'] = basic_result
            print(f"✓ Basic sync: {len(basic_result)} lyrics synchronized")
        else:
            print("✗ Basic synchronization failed")
    except Exception as e:
        print(f"✗ Basic synchronization error: {e}")
    
    return results


def compare_synchronization_results(results: dict):
    """Compare different synchronization results"""
    print(f"\n=== SYNCHRONIZATION COMPARISON ===")
    
    if not results:
        print("No synchronization results to compare")
        return
    
    methods = list(results.keys())
    print(f"Comparing methods: {', '.join(methods)}")
    
    # Compare timing differences
    if len(methods) > 1:
        print("\nTiming comparison (first 5 lyrics):")
        max_lines = min(5, min(len(results[method]) for method in methods))
        
        for i in range(max_lines):
            print(f"\nLine {i+1}:")
            for method in methods:
                lyric = results[method][i]
                text = lyric['text'][:50] + "..." if len(lyric['text']) > 50 else lyric['text']
                print(f"  {method:12}: {lyric['start_time']:6.2f}s - {lyric['end_time']:6.2f}s | {text}")
    
    # Show timing statistics
    print("\nTiming Statistics:")
    for method in methods:
        lyrics = results[method]
        start_times = [l['start_time'] for l in lyrics]
        durations = [l['duration'] for l in lyrics]
        
        avg_start = sum(start_times) / len(start_times)
        avg_duration = sum(durations) / len(durations)
        
        print(f"  {method:12}: avg_start={avg_start:.2f}s, avg_duration={avg_duration:.2f}s")


def generate_test_video(audio_path: str, sync_results: dict, output_dir: str):
    """Generate test videos for each synchronization method"""
    print(f"\n=== GENERATING TEST VIDEOS ===")
    
    os.makedirs(output_dir, exist_ok=True)
    
    for method, lyrics in sync_results.items():
        try:
            print(f"\nGenerating test video for {method} method...")
            
            # Create simple SRT file
            srt_path = os.path.join(output_dir, f"test_{method}.srt")
            with open(srt_path, 'w', encoding='utf-8') as f:
                for i, lyric in enumerate(lyrics):
                    start_time = format_srt_time(lyric['start_time'])
                    end_time = format_srt_time(lyric['end_time'])
                    f.write(f"{i+1}\n{start_time} --> {end_time}\n{lyric['text']}\n\n")
            
            # Generate video with ffmpeg
            video_path = os.path.join(output_dir, f"test_{method}.mp4")
            
            import subprocess
            subprocess.run([
                'ffmpeg', '-y',
                '-i', audio_path,
                '-vf', f'subtitles={srt_path}:force_style=\'FontSize=24,PrimaryColour=&H00ffffff,OutlineColour=&H00000000,Outline=2,Shadow=1\'',
                '-c:v', 'libx264', '-crf', '25',
                '-c:a', 'aac', '-b:a', '128k',
                video_path
            ], check=True, capture_output=True)
            
            print(f"✓ Test video created: {video_path}")
            
        except Exception as e:
            print(f"✗ Error creating test video for {method}: {e}")


def format_srt_time(seconds: float) -> str:
    """Format time for SRT subtitle format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int((seconds % 1) * 1000)
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"


def export_results(results: dict, output_file: str):
    """Export synchronization results to JSON"""
    print(f"\n=== EXPORTING RESULTS ===")
    
    try:
        with open(output_file, 'w', encoding='utf-8') as f:
            json.dump(results, f, indent=2, ensure_ascii=False)
        print(f"✓ Results exported to: {output_file}")
    except Exception as e:
        print(f"✗ Export error: {e}")


def main():
    parser = argparse.ArgumentParser(description="Debug and test lyrics synchronization")
    parser.add_argument('--audio', '-a', required=True, help="Path to audio file")
    parser.add_argument('--spotify-url', '-s', help="Spotify URL for lyrics")
    parser.add_argument('--lyrics-file', '-l', help="Path to text file with lyrics (one line per lyric)")
    parser.add_argument('--output-dir', '-o', default='./sync_test_output', help="Output directory for test files")
    parser.add_argument('--test-videos', action='store_true', help="Generate test videos")
    parser.add_argument('--export-json', help="Export results to JSON file")
    
    args = parser.parse_args()
    
    if not SYNC_AVAILABLE:
        print("Error: Synchronization modules not available")
        return 1
    
    print("=== LYRICS SYNCHRONIZATION DEBUG TOOL ===")
    
    # Test audio analysis
    audio_features = test_audio_analysis(args.audio)
    
    # Get lyrics
    lyrics_data = None
    lyrics_lines = []
    
    if args.spotify_url:
        lyrics_data = test_lyrics_processing(args.spotify_url)
        if lyrics_data:
            lyrics_lines = lyrics_data['lyrics_lines']
    elif args.lyrics_file:
        try:
            with open(args.lyrics_file, 'r', encoding='utf-8') as f:
                lyrics_lines = [line.strip() for line in f if line.strip()]
            print(f"✓ Loaded {len(lyrics_lines)} lyrics from file")
        except Exception as e:
            print(f"✗ Error loading lyrics file: {e}")
            return 1
    else:
        print("Error: Must provide either --spotify-url or --lyrics-file")
        return 1
    
    if not lyrics_lines:
        print("Error: No lyrics available for synchronization")
        return 1
    
    # Test synchronization methods
    sync_results = test_synchronization_methods(args.audio, lyrics_lines)
    
    # Compare results
    compare_synchronization_results(sync_results)
    
    # Generate test videos if requested
    if args.test_videos and sync_results:
        generate_test_video(args.audio, sync_results, args.output_dir)
    
    # Export results if requested
    if args.export_json and sync_results:
        export_results({
            'audio_features': {
                'tempo': audio_features.tempo if audio_features else None,
                'vocal_segments': audio_features.vocal_segments if audio_features else None
            },
            'lyrics_data': lyrics_data,
            'synchronization_results': sync_results
        }, args.export_json)
    
    print("\n=== DEBUG SESSION COMPLETE ===")
    return 0


if __name__ == "__main__":
    sys.exit(main())
