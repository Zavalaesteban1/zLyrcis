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

### General Setup

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

### Ubuntu-Specific Installation

If you're running on Ubuntu, follow these additional steps to ensure everything works smoothly:

1. Update your package lists:
   ```
   sudo apt update
   ```

2. Install system dependencies:
   ```
   sudo apt install -y python3-dev python3-pip python3-venv \
                      ffmpeg libavcodec-extra \
                      redis-server \
                      build-essential libssl-dev libffi-dev \
                      espeak libespeak-dev
   ```

3. Install audio processing libraries:
   ```
   sudo apt install -y libasound2-dev portaudio19-dev libportaudio2 libportaudiocpp0 \
                      libpulse-dev libsndfile1-dev
   ```

4. Install aeneas for audio synchronization:
   ```
   # Install aeneas dependencies
   sudo apt install -y libxml2-dev libxslt1-dev libbs4-dev

   # Install Python libraries
   pip install numpy
   pip install aeneas
   ```

   If you encounter issues with aeneas installation, try:
   ```
   # Alternative installation method for aeneas
   git clone https://github.com/ReadBeyond/aeneas.git
   cd aeneas
   pip install -r requirements.txt
   python setup.py build_ext --inplace
   python setup.py install
   ```

5. Verify installations:
   ```
   # Verify FFmpeg
   ffmpeg -version

   # Verify aeneas
   python -m aeneas.diagnostics
   ```

## Running the Application on Ubuntu

1. Start the Redis server:
   ```
   sudo systemctl start redis-server
   # To enable it to start on boot:
   sudo systemctl enable redis-server
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

## Troubleshooting Audio Issues on Ubuntu

If you're experiencing issues with audio in the generated videos on Ubuntu:

1. Verify FFmpeg installation and codecs:
   ```
   ffmpeg -version
   # Check for libmp3lame support
   ffmpeg -encoders | grep mp3
   ```

2. If libmp3lame is missing:
   ```
   sudo apt install -y libmp3lame-dev
   ```

3. Check system audio settings:
   ```
   sudo apt install -y pavucontrol
   pavucontrol  # Open PulseAudio Volume Control
   ```

4. If audio synchronization issues occur, check aeneas setup:
   ```
   python -m aeneas.diagnostics
   ```

5. Look at the logs for any error messages related to audio processing:
   ```
   tail -f backend/logs/debug.log
   ```

6. Try using a local audio file as described in the "Using Local Audio Files" section.

## License

[MIT License](LICENSE) 