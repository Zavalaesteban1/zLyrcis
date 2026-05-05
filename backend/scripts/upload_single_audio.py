#!/usr/bin/env python
"""Upload a single audio file to Cloudinary"""

import os
import sys
import cloudinary
import cloudinary.uploader

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Load environment variables
import dotenv
dotenv_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), '.env')
if os.path.exists(dotenv_path):
    dotenv.load_dotenv(dotenv_path)
    print(f"✓ Loaded .env file")
else:
    print(f"⚠️  Warning: .env file not found!")

# Configure Cloudinary
cloudinary.config(
    cloud_name=os.environ.get('CLOUDINARY_CLOUD_NAME'),
    api_key=os.environ.get('CLOUDINARY_API_KEY'),
    api_secret=os.environ.get('CLOUDINARY_API_SECRET')
)

def upload_file(file_path):
    """Upload a single audio file to Cloudinary"""
    
    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False
    
    filename = os.path.basename(file_path)
    print(f"\n{'='*60}")
    print(f"🎵 Uploading: {filename}")
    print(f"{'='*60}\n")
    
    try:
        # Upload to Cloudinary
        result = cloudinary.uploader.upload(
            file_path,
            resource_type='video',  # Cloudinary treats audio as video
            folder='audio-library',
            public_id=filename[:-4],  # Remove .mp3 extension
            overwrite=True,  # Overwrite if exists
            use_filename=True,
            unique_filename=False
        )
        
        print(f"✅ SUCCESS!")
        print(f"\n📊 Upload Details:")
        print(f"   Filename: {filename}")
        print(f"   Public ID: {result['public_id']}")
        print(f"   URL: {result['secure_url']}")
        print(f"   Duration: {result.get('duration', 'N/A')}s")
        print(f"   Size: {result.get('bytes', 0) / 1024 / 1024:.2f} MB")
        print(f"\n{'='*60}\n")
        
        return True
        
    except Exception as e:
        print(f"❌ FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == '__main__':
    if len(sys.argv) < 2:
        print("Usage: python upload_single_audio.py <path_to_audio_file>")
        sys.exit(1)
    
    file_path = sys.argv[1]
    success = upload_file(file_path)
    sys.exit(0 if success else 1)
