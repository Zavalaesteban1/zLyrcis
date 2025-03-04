# Lyric Video Generator

A web application that generates high-quality lyric videos from Spotify song links. The application fetches song information and lyrics, then creates a video with synchronized lyrics.

## Features

- Input a Spotify song link and generate a lyric video
- High-quality 4K video output
- Lyrics synchronized with the audio
- Responsive web interface
- Background processing for video generation

## Tech Stack

- **Frontend**: React with TypeScript
- **Backend**: Django with Django REST Framework
- **Music API**: Spotify API
- **Lyrics API**: Genius API
- **Video Generation**: FFmpeg
- **Background Tasks**: Celery with Redis
- **Database**: SQLite (development) / PostgreSQL (production)

## Setup

### Prerequisites

- Python 3.8+
- Node.js 14+
- Redis server
- FFmpeg

### Backend Setup

1. Navigate to the backend directory:
   ```
   cd lyric_video_generator/backend
   ```

2. Create and activate a virtual environment:
   ```
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

3. Install dependencies:
   ```
   pip install -r requirements.txt
   ```

4. Create a `.env` file based on `.env.example` and add your API keys:
   ```
   cp .env.example .env
   ```

5. Run migrations:
   ```
   python manage.py migrate
   ```

6. Start the Django development server:
   ```
   python manage.py runserver
   ```

7. In a separate terminal, start the Celery worker:
   ```
   celery -A lyric_video_project worker --loglevel=info
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```
   cd lyric_video_generator/frontend
   ```

2. Install dependencies:
   ```
   npm install
   ```

3. Start the development server:
   ```
   npm start
   ```

## Usage

1. Open your browser and go to `http://localhost:3000`
2. Paste a Spotify song link in the input field
3. Click "Generate Video"
4. Wait for the video to be generated
5. Download the video when it's ready

## API Endpoints

- `POST /api/videos/`: Create a new video generation job
- `GET /api/videos/`: List all video generation jobs
- `GET /api/videos/{id}/`: Get details of a specific job
- `GET /api/videos/{id}/status/`: Get the status of a specific job

## License

MIT

## Acknowledgements

- Spotify API
- Genius API
- FFmpeg 