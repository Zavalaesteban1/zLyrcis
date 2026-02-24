# Audio Files Directory

This directory is **not tracked in git** and is only used for local development.

## Production Setup

In production, all audio files are stored and retrieved from **Cloudinary**. The backend automatically:
- Searches for audio files in Cloudinary first
- Falls back to local files only in development

## For Developers

When you clone this repository:

1. **You do NOT need to download audio files** - the application uses Cloudinary
2. If you want to test with local audio files for development:
   - Place your `.mp3`, `.wav`, or `.flac` files in this directory
   - The backend will use them as a fallback if Cloudinary is not configured

## Cloudinary Configuration

Make sure your environment has these variables set:
```
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

See `backend/.env.example` for reference.

## Uploading Audio to Cloudinary

If you need to upload new audio files to Cloudinary:

```bash
cd backend
python scripts/upload_audio_to_cloudinary.py
```

This will upload all audio files from this directory to Cloudinary's `audio-library` folder.
