#!/usr/bin/env python
"""
Script to upload all audio files from audio_files/ directory to Cloudinary.
This only needs to be run once to migrate your local audio library to the cloud.

Usage:
    python upload_audio_to_cloudinary.py
"""

import os
import sys
from pathlib import Path
import cloudinary
import cloudinary.uploader

# Add parent directory to path to import Django settings
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
import dotenv
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(dotenv_path):
    dotenv.load_dotenv(dotenv_path)
    print(f"✓ Loaded .env file from: {dotenv_path}")
else:
    print(f"⚠️  Warning: .env file not found at {dotenv_path}")
    print("Make sure CLOUDINARY_* environment variables are set!")

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET')
)

def upload_audio_files():
    """Upload all MP3 files from audio_files/ to Cloudinary"""
    
    # Get the audio_files directory (one level up from backend)
    backend_dir = Path(__file__).resolve().parent.parent
    project_root = backend_dir.parent
    audio_dir = project_root / 'audio_files'
    
    print(f"\n{'='*60}")
    print(f"🎵 Cloudinary Audio Upload Script")
    print(f"{'='*60}\n")
    
    print(f"📁 Audio directory: {audio_dir}")
    
    if not audio_dir.exists():
        print(f"❌ Error: Audio directory not found at {audio_dir}")
        return
    
    # Get all MP3 files
    audio_files = list(audio_dir.glob('*.mp3'))
    
    if not audio_files:
        print("❌ No MP3 files found in audio_files/ directory")
        return
    
    print(f"✓ Found {len(audio_files)} MP3 files\n")
    
    # Confirm upload
    print("This will upload all audio files to Cloudinary in the 'audio-library' folder.")
    response = input("Continue? (y/n): ")
    
    if response.lower() != 'y':
        print("❌ Upload cancelled")
        return
    
    print(f"\n{'='*60}")
    print("Starting upload...")
    print(f"{'='*60}\n")
    
    successful = 0
    failed = 0
    skipped = 0
    
    for audio_file in audio_files:
        filename = audio_file.name
        
        # Skip .gitkeep file
        if filename == '.gitkeep':
            continue
        
        try:
            print(f"📤 Uploading: {filename}...", end=' ')
            
            # Upload to Cloudinary
            # resource_type='video' because Cloudinary treats audio as video
            # folder='audio-library' to organize files
            result = cloudinary.uploader.upload(
                str(audio_file),
                resource_type='video',
                folder='audio-library',
                public_id=filename[:-4],  # Remove .mp3 extension
                overwrite=False,  # Don't overwrite if already exists
                use_filename=True,
                unique_filename=False
            )
            
            print(f"✓ Success!")
            print(f"   URL: {result['secure_url']}")
            successful += 1
            
        except cloudinary.exceptions.Error as e:
            if 'already exists' in str(e):
                print(f"⊘ Already exists (skipped)")
                skipped += 1
            else:
                print(f"✗ Failed: {e}")
                failed += 1
        except Exception as e:
            print(f"✗ Failed: {e}")
            failed += 1
    
    # Summary
    print(f"\n{'='*60}")
    print(f"📊 Upload Summary")
    print(f"{'='*60}")
    print(f"✓ Successful: {successful}")
    print(f"⊘ Skipped (already exists): {skipped}")
    print(f"✗ Failed: {failed}")
    print(f"Total processed: {successful + failed + skipped}")
    print(f"{'='*60}\n")
    
    if successful > 0 or skipped > 0:
        print("✅ Audio library is now available on Cloudinary!")
        print("🚀 Your app will now use these files for video generation.")
    
    if failed > 0:
        print("\n⚠️  Some files failed to upload. Check the errors above.")

if __name__ == '__main__':
    try:
        upload_audio_files()
    except KeyboardInterrupt:
        print("\n\n❌ Upload cancelled by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
