# Backend Architecture

Clean, professional Django backend for the Lyric Video Generator.

## Project Structure

```
backend/
├── manage.py                    # Django management script
├── requirements.txt             # Python dependencies
├── .env                         # Environment variables (DO NOT COMMIT)
├── .env.example                 # Example environment config
│
├── lyric_video_project/         # Django project settings
│   ├── __init__.py
│   ├── settings.py              # Main Django configuration
│   ├── urls.py                  # Root URL routing
│   ├── celery.py                # Celery configuration
│   ├── wsgi.py                  # WSGI entry point
│   └── asgi.py                  # ASGI entry point
│
├── api/                         # Django REST Framework app
│   ├── __init__.py
│   ├── apps.py                  # App configuration
│   ├── models.py                # Database models (VideoJob, UserProfile)
│   ├── serializers.py           # DRF serializers
│   ├── views.py                 # API endpoints
│   ├── urls.py                  # API URL routing
│   ├── tasks.py                 # Celery async tasks
│   ├── admin.py                 # Django admin configuration
│   ├── signals.py               # Django signals (auto-create profiles)
│   ├── middleware.py            # Custom middleware
│   └── migrations/              # Database migrations
│
├── core/                        # Core business logic
│   ├── __init__.py
│   ├── audio.py                 # Audio processing & analysis
│   ├── lyrics.py                # Lyrics fetching & cleaning (Genius API)
│   ├── synchronization.py       # Lyric-audio synchronization (all strategies)
│   ├── video.py                 # Video rendering (FFmpeg)
│   ├── spotify.py               # Spotify API integration
│   ├── config.py                # Configuration constants
│   ├── exceptions.py            # Custom exceptions
│   └── utils.py                 # Helper utilities
│
├── tests/                       # Unit & integration tests
│   ├── __init__.py
│   ├── test_audio.py
│   ├── test_lyrics.py
│   ├── test_synchronization.py
│   ├── test_video.py
│   └── test_spotify.py
│
├── scripts/                     # Debug & utility scripts
│   ├── __init__.py
│   ├── debug_synchronization.py
│   ├── debug_video.py
│   ├── audio_debug.py
│   └── audio_fix.py
│
└── media/                       # Generated media files
    ├── videos/                  # Generated lyric videos
    └── profile_pictures/        # User profile images
```

## Architecture Overview

### Separation of Concerns

**1. API Layer (`api/`)**
- Handles HTTP requests/responses
- REST API endpoints
- Authentication & permissions
- Input validation via serializers
- Celery task dispatching

**2. Core Engine (`core/`)**
- Pure business logic
- No Django dependencies (can be reused elsewhere)
- Audio/video processing
- External API integrations
- Synchronization algorithms

**3. Project Config (`lyric_video_project/`)**
- Django settings
- URL routing
- Celery configuration
- WSGI/ASGI servers

### Data Flow

```
User Request → API View → Celery Task → Core Modules → Database Update
                                ↓
                        Video Generation Pipeline:
                        1. Spotify API (track metadata)
                        2. Genius API (lyrics)
                        3. Audio processing (librosa)
                        4. Synchronization (Deepgram + audio analysis)
                        5. Video rendering (FFmpeg)
                        6. File storage
```

## Core Modules

### core/audio.py
- Audio file loading & validation
- Duration calculation
- Format conversion
- Audio feature extraction (tempo, beats, vocals)
- Uses: librosa, pydub, ffmpeg

### core/lyrics.py
- Genius API integration
- Lyrics fetching & search
- Metadata filtering & cleaning
- Text preprocessing
- Uses: lyricsgenius

### core/synchronization.py
- **Advanced synchronization** (Deepgram + audio analysis)
- **Deepgram-only** synchronization (word-level timestamps)
- **Fallback** synchronization (time-based estimation)
- Strategy pattern with multiple methods
- Confidence scoring
- Uses: deepgram-sdk, librosa, scipy

### core/video.py
- Video generation with FFmpeg
- ASS subtitle creation
- Background rendering (gradients, effects)
- Animation effects (karaoke, fades, color shifts)
- Video encoding & optimization
- Uses: ffmpeg-python, subprocess

### core/spotify.py
- Spotify API authentication
- Track metadata extraction
- URL parsing
- Album artwork fetching
- Uses: spotipy

### core/config.py
- Configuration constants
- Genre-specific sync settings
- FFmpeg parameters
- File paths & formats

### core/exceptions.py
- Custom exception classes
- Error handling utilities
- Logging helpers

### core/utils.py
- String normalization
- File operations
- Time formatting
- Text similarity calculations

## API Endpoints

### Authentication
```
POST   /api/auth/login/              # User login
POST   /api/auth/signup/             # User registration
POST   /api/auth/logout/             # User logout
POST   /api/auth/google-login/       # Google OAuth login
GET    /api/auth/user/               # Get current user
```

### Videos
```
GET    /api/videos/                  # List user's videos
POST   /api/videos/                  # Create video job
GET    /api/videos/{id}/             # Get video details
GET    /api/videos/{id}/status/      # Get video status
DELETE /api/videos/{id}/             # Delete video
```

### Profile
```
GET    /api/profile/me/              # Get user profile
PATCH  /api/profile/update_profile/  # Update profile
POST   /api/profile/update_picture/  # Upload profile picture
POST   /api/profile/change_password/ # Change password
```

### AI Agent
```
POST   /api/agent_chat/              # General conversation
POST   /api/agent_song_request/      # Song-specific request
GET    /api/get_conversation_history/ # Get chat history
```

## Database Models

### VideoJob
```python
id              UUIDField       # Primary key
user            ForeignKey      # Owner (nullable for legacy)
spotify_url     URLField        # Original Spotify link
song_title      CharField       # Track title
artist          CharField       # Artist name
status          CharField       # pending/processing/completed/failed
video_file      FileField       # Path to generated video
error_message   TextField       # Error details if failed
created_at      DateTimeField   # Creation timestamp
updated_at      DateTimeField   # Last update timestamp
```

### UserProfile
```python
user              OneToOneField  # Django User
profile_picture   ImageField     # Profile image
role              CharField      # User role (default: 'Standard User')
```

## Celery Tasks

### generate_lyric_video(job_id)
Main async task for video generation:

1. Fetch Spotify track metadata
2. Get lyrics from Genius API
3. Clean & filter lyrics (remove metadata)
4. Get audio file (local or download)
5. Synchronize lyrics with audio
6. Generate video with FFmpeg
7. Save to media directory
8. Update job status

**Execution time:** 30 seconds - 5 minutes
**Priority:** High
**Retry:** 3 times on failure

## Environment Variables

Required in `.env`:

```bash
# Django
DEBUG=True
SECRET_KEY=your-secret-key
DATABASE_NAME=zLyrics
DATABASE_USER=root
DATABASE_PASS=your_password
DB_HOST=localhost

# APIs
SPOTIFY_CLIENT_ID=your_client_id
SPOTIFY_CLIENT_SECRET=your_client_secret
GENIUS_ACCESS_TOKEN=your_token
ANTHROPIC_API_KEY=your_key
DEEPGRAM_API_KEY=your_key  # Optional

# OAuth
GOOGLE_CLIENT_ID=your_client_id

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

## Running the Backend

### Development

```bash
# Terminal 1: Django server
python manage.py runserver

# Terminal 2: Celery worker
celery -A lyric_video_project worker --loglevel=info

# Terminal 3: Redis (if not running as service)
redis-server
```

### Testing

```bash
# Run all tests
python manage.py test

# Run specific test file
python manage.py test tests.test_audio

# Run with coverage
coverage run --source='.' manage.py test
coverage report
```

### Database Management

```bash
# Create migrations
python manage.py makemigrations

# Apply migrations
python manage.py migrate

# Create superuser
python manage.py createsuperuser

# Open Django shell
python manage.py shell
```

### Debugging

```bash
# Use debug scripts
python scripts/debug_synchronization.py

# Monitor Celery tasks
celery -A lyric_video_project flower

# Check Redis
redis-cli MONITOR
```

## Key Design Decisions

### Why separate `core/` from `api/`?

1. **Reusability:** Core logic can be used outside Django
2. **Testing:** Easier to test pure Python without Django
3. **Clarity:** Clear separation between web layer and business logic
4. **Maintenance:** Changes to API don't affect core algorithms

### Why not use Django services pattern?

- `core/` essentially *is* the service layer
- No need for extra `services/` folder when we have clear modules
- Direct imports are simpler: `from core.audio import process_audio`

### Why keep all synchronization in one file?

- Originally scattered across multiple files
- Unified `core/synchronization.py` makes it easier to:
  - Compare different strategies
  - Maintain fallback logic
  - Add new methods
  - Debug timing issues

## Common Tasks

### Add a new API endpoint

1. Define in `api/views.py`
2. Add route in `api/urls.py`
3. Create serializer in `api/serializers.py` (if needed)
4. Test with Postman or Django REST browsable API

### Add a new synchronization strategy

1. Implement in `core/synchronization.py`
2. Follow existing strategy pattern
3. Add to fallback chain in `api/tasks.py`
4. Add tests in `tests/test_synchronization.py`

### Debug video generation issues

1. Check Celery worker logs
2. Run `scripts/debug_video.py` with test audio
3. Verify FFmpeg installation: `ffmpeg -version`
4. Check temporary files in `/tmp/`
5. Test audio analysis: `python scripts/audio_debug.py`

## Performance Optimization

### Current optimizations:
- Celery async processing
- Redis caching for conversation history
- Local audio file matching (avoids downloads)
- FFmpeg hardware acceleration (when available)
- Efficient lyrics cleaning (regex pre-compilation)

### Future improvements:
- Database query optimization (select_related, prefetch_related)
- Video thumbnail generation
- Progress tracking (% completion)
- Batch processing multiple videos
- CDN for video delivery

## Security

### Best practices implemented:
- Environment variables for secrets
- Token-based authentication
- User-specific video filtering
- Input validation via serializers
- SQL injection prevention (Django ORM)
- XSS protection (Django defaults)

### Areas to improve:
- Rate limiting on API endpoints
- File upload size limits
- Video processing timeouts
- API key rotation
- Audit logging

## Troubleshooting

### Celery not processing tasks
```bash
# Check Redis connection
redis-cli ping  # Should return PONG

# Verify Celery config
python -c "from lyric_video_project.celery import app; print(app.conf)"

# Restart Celery
pkill -f "celery worker"
celery -A lyric_video_project worker --loglevel=debug
```

### Import errors after restructure
```bash
# Clear Python cache
find . -type d -name "__pycache__" -exec rm -r {} +
find . -type f -name "*.pyc" -delete

# Reinstall in development mode
pip install -e .
```

### FFmpeg errors
```bash
# Verify installation
ffmpeg -version
ffprobe -version

# Test basic operation
ffmpeg -f lavfi -i testsrc=duration=10:size=1280x720:rate=30 test.mp4

# Check codecs
ffmpeg -codecs | grep mp3
ffmpeg -codecs | grep h264
```

## Contributing

When adding new features:

1. Keep `api/` focused on HTTP handling
2. Put business logic in `core/`
3. Add tests in `tests/`
4. Update this README
5. Use type hints where possible
6. Follow PEP 8 style guide
7. Add docstrings to public functions

## License

MIT License
