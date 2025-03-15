# Lyric Video Generator

A web application that generates lyric videos for songs by combining lyrics with audio.

## Features

- Automatically retrieves song information from Spotify
- Fetches lyrics from Genius or alternative sources
- Downloads audio from multiple sources (YouTube, Deezer) with fallbacks
- Supports using local audio files
- Synchronizes lyrics with audio using beat detection
- Generates professional-looking lyric videos

## Using Local Audio Files

If you're having trouble with the automatic audio download, you can use your own audio files:

1. Create an `audio_files` directory in the project root:
   ```
   mkdir -p /path/to/lyric_video_generator/audio_files
   ```

2. Add your MP3 files to this directory. Name them to match the song title and artist for best results:
   ```
   Example: "Shape of You - Ed Sheeran.mp3"
   ```

3. The system will automatically search for matching audio files when generating videos.

## Installation

1. Clone the repository:
   ```
   git clone <repository-url>
   cd lyric_video_generator
   ```

2. Set up the virtual environment:
   ```
   python -m venv backend/venv
   source backend/venv/bin/activate  # On Windows: backend\venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r backend/requirements.txt
   ```

4. Set up environment variables:
   ```
   cp .env.example .env
   ```
   Edit the `.env` file with your Spotify and Genius API credentials.

5. Run migrations:
   ```
   cd backend
   python manage.py migrate
   ```

## Running the Application

1. Start the Redis server (required for Celery):
   ```
   redis-server
   ```

2. Start the Celery worker:
   ```
   cd backend
   celery -A lyric_video_project worker --loglevel=info
   ```

3. Start the Django development server:
   ```
   cd backend
   python manage.py runserver
   ```

4. Access the application at http://localhost:8000

## Troubleshooting Audio Issues

If you're experiencing issues with audio in the generated videos:

1. Check that FFmpeg is installed and available in your PATH
2. Verify that the audio files are valid MP3 files
3. Look at the logs for any error messages related to audio processing
4. Try using a local audio file as described above

## License

[MIT License](LICENSE) 