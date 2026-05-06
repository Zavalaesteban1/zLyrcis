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
│   ├── telegram_audio.py        # Telegram bot audio downloads
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
│   ├── test_spotify.py
│   └── test_telegram_audio.py
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
                        2. Genius/Musixmatch API (lyrics)
                        3. Audio retrieval:
                           a. Cloudinary cache (primary)
                           b. Telegram Deezer bot (auto-download)
                           c. Local files (fallback)
                        4. Audio processing (librosa)
                        5. Synchronization (Deepgram + audio analysis)
                        6. Video rendering (FFmpeg)
                        7. File storage (Cloudinary/local)
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

### core/telegram_audio.py
- Telegram bot integration for audio downloads
- Telethon client management
- Session-based authentication
- Communication with Deezer bot
- Automatic audio file retrieval
- Timeout and error handling
- Uses: telethon, asyncio

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

# Telegram (for automatic audio downloads)
TELEGRAM_API_ID=your_api_id
TELEGRAM_API_HASH=your_api_hash
TELEGRAM_PHONE=+1234567890
TELEGRAM_DEEZER_BOT=@deezload2bot
TELEGRAM_SESSION_FILE=telegram_session
TELEGRAM_DOWNLOAD_TIMEOUT=180

# OAuth
GOOGLE_CLIENT_ID=your_client_id

# Celery
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

## Telegram Audio Download Setup

The system uses Telegram to automatically download high-quality MP3 files from Deezer via a Telegram bot. This eliminates the need for manual audio file management.

### Architecture Flow

```
1. User requests song → Spotify API (metadata)
2. Check Cloudinary cache (fast cache hit)
3. If NOT cached → Send Spotify link to Telegram Deezer bot
4. Bot downloads from Deezer → Returns MP3 file
5. Upload to Cloudinary (for future requests)
6. Generate lyric video
```

### Initial Setup

#### 1. Get Telegram API Credentials

1. Go to https://my.telegram.org/apps
2. Log in with your phone number
3. Click "API Development Tools"
4. Create a new application:
   - App title: "Lyric Video Generator" (or any name)
   - Short name: "lyric-gen" (or any short name)
   - Platform: Other
5. Copy your `api_id` and `api_hash`

#### 2. Configure Environment Variables

Add to your `.env` file:

```bash
TELEGRAM_API_ID=12345678
TELEGRAM_API_HASH=abcdef1234567890abcdef1234567890
TELEGRAM_PHONE=+1234567890  # Your phone number with country code
TELEGRAM_DEEZER_BOT=@deezload2bot  # Bot username (default)
TELEGRAM_SESSION_FILE=telegram_session
TELEGRAM_DOWNLOAD_TIMEOUT=180  # seconds
```

**Note:** Keep your phone number in international format with + and country code.

#### 3. Install Dependencies

```bash
pip install -r requirements.txt
# This includes: telethon>=1.34.0, cryptg>=0.4.0
```

#### 4. Run Setup Command

```bash
python manage.py setup_telegram
```

This will:
- Connect to Telegram
- Send a verification code to your phone
- Prompt you to enter the code
- Test connection to the Deezer bot
- Save session for future use

**First-time authentication flow:**
```bash
$ python manage.py setup_telegram

=== Telegram Audio Download Setup ===

API ID: 12345678
Phone: +1234567890
Bot: @deezload2bot

Connecting to Telegram...
Not authenticated yet. Starting authentication...

A code has been sent to +1234567890
Enter the code: 12345

✓ Authentication successful!

Testing Telegram setup...
✓ Configuration loaded
  Bot: @deezload2bot
  Timeout: 180s

✓ Connected and authenticated
✓ Bot found: Deezload Music Bot

✓ Setup complete! Telegram audio download is ready.
Session saved to: /path/to/backend/telegram_session.session

IMPORTANT: Keep the .session file secure (it contains your credentials)
```

#### 5. Test with a Song (Optional)

```bash
python manage.py setup_telegram --test-url "https://open.spotify.com/track/3n3Ppam7vgaVa1iaRUc9Lp"
```

This will test downloading an actual song via the bot.

### How It Works

#### Audio Retrieval Priority

The `get_audio()` function follows this order:

1. **Cloudinary Cache** (Primary - Fastest)
   - Searches `audio-library/` folder
   - Matches by artist and title
   - Returns immediately if found

2. **Telegram Download** (When not cached)
   - Sends Spotify URL to Deezer bot
   - Bot downloads from Deezer
   - Receives MP3 file
   - Uploads to Cloudinary for caching
   - Returns file for video generation

3. **Local Files** (Last Resort)
   - Checks `audio_files/` directory
   - Manual fallback for emergency

#### Cloudinary Caching

After successful Telegram download:
```python
# Automatically uploads to Cloudinary
upload_audio_to_library(audio_path, title, artist)
# Filename: "Artist - Title.mp3" in audio-library/
```

Benefits:
- Future requests for the same song are instant
- Reduces Telegram bot usage
- No manual file management needed
- Grows automatically over time

### Session Management

#### Session Files

The `.session` file stores your Telegram authentication:
- **Location:** `backend/telegram_session.session`
- **Security:** Contains credentials - treat like a password
- **Git:** Already in `.gitignore`
- **Persistence:** Lasts until you change your Telegram password or revoke

#### Production Deployment

For production environments:

**Option 1: Mount as Secret File**
```bash
# Railway.app, Render, etc.
# Upload telegram_session.session as a secret file
```

**Option 2: Environment Variable**
```bash
# Convert to base64
base64 telegram_session.session > session_b64.txt

# Add to .env
TELEGRAM_SESSION_BASE64=<base64_content>

# Decode in settings.py
import base64
session_data = base64.b64decode(os.getenv('TELEGRAM_SESSION_BASE64'))
with open('telegram_session.session', 'wb') as f:
    f.write(session_data)
```

**Option 3: Re-authenticate in Production**
```bash
# Run setup command on production server
python manage.py setup_telegram
# Enter code sent to your phone
```

### Troubleshooting

#### Session Expired Error

```
TelegramAuthenticationError: Telegram session expired or invalid
```

**Solution:**
```bash
# Delete old session
rm backend/telegram_session.session

# Re-authenticate
python manage.py setup_telegram
```

#### Bot Not Found Error

```
TelegramBotNotFoundError: Bot @deezload2bot not found
```

**Possible causes:**
1. Bot username changed
2. Bot is offline/banned
3. Typo in bot username

**Solution:**
```bash
# Find working Deezer bot
# Search Telegram for: "deezer bot" or "deezload"

# Update .env with new bot username
TELEGRAM_DEEZER_BOT=@newbotname
```

#### Timeout Error

```
TelegramTimeoutError: Bot did not respond within 180 seconds
```

**Possible causes:**
1. Bot is slow/overloaded
2. Song not available on Deezer
3. Network issues

**Solution:**
```bash
# Increase timeout in .env
TELEGRAM_DOWNLOAD_TIMEOUT=300  # 5 minutes

# Or in code:
download_audio_from_telegram(url, title, artist, timeout=300)
```

#### Rate Limit Error

```
FloodWaitError: Too many requests
```

**Solution:**
- Telegram rate limits: ~30 requests/second
- Wait time will be shown in error message
- System automatically falls back to local files
- For high volume: consider queue throttling in Celery

#### Import Error

```
ImportError: No module named 'telethon'
```

**Solution:**
```bash
pip install telethon cryptg
# Or
pip install -r requirements.txt
```

#### Two-Factor Authentication

If you have 2FA enabled on Telegram:

```bash
$ python manage.py setup_telegram

Enter the code: 12345
✓ Code accepted

Two-step verification is enabled.
Enter your password: ********

✓ Authentication successful!
```

### Configuration Reference

#### Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TELEGRAM_API_ID` | Yes | - | Telegram API ID from my.telegram.org |
| `TELEGRAM_API_HASH` | Yes | - | Telegram API hash |
| `TELEGRAM_PHONE` | Yes | - | Your phone number (+1234567890) |
| `TELEGRAM_DEEZER_BOT` | No | `@deezload2bot` | Bot username |
| `TELEGRAM_SESSION_FILE` | No | `telegram_session` | Session filename |
| `TELEGRAM_DOWNLOAD_TIMEOUT` | No | `180` | Download timeout (seconds) |

#### Telethon Exceptions

Custom exceptions in `core/telegram_audio.py`:

- `TelegramConfigurationError` - Missing API credentials
- `TelegramAuthenticationError` - Auth failed/expired
- `TelegramTimeoutError` - Bot didn't respond
- `TelegramBotNotFoundError` - Invalid bot username
- `TelegramFileNotReceivedError` - Bot responded but no audio

### Security Considerations

#### Session File Protection

**DO:**
- ✓ Add `*.session` to `.gitignore` (already done)
- ✓ Treat session files like passwords
- ✓ Use environment variables or secrets management in production
- ✓ Regenerate if compromised

**DON'T:**
- ✗ Commit `.session` files to git
- ✗ Share session files
- ✗ Store in public locations
- ✗ Use personal account for production (consider dedicated account)

#### Rate Limiting

For high-volume production:

```python
# Add rate limiting in Celery
from celery import Task

class RateLimitedTask(Task):
    rate_limit = '10/m'  # 10 tasks per minute

@shared_task(base=RateLimitedTask)
def generate_lyric_video(job_id):
    # ...
```

### Monitoring

#### Success Metrics

Log messages to track:
```
✓ Using Cloudinary cache         # Cache hit - best case
✓ Downloaded via Telegram         # New download - working
⚠️  Telegram timeout               # Bot slow/unavailable
⚠️  Falling back to local files    # Last resort used
```

#### Recommended Monitoring

1. **Cache Hit Rate**
   - Track Cloudinary vs Telegram downloads
   - Goal: >80% cache hit rate over time

2. **Telegram Success Rate**
   - Track successful vs failed downloads
   - Alert if < 70% success rate

3. **Average Download Time**
   - Track Telegram download duration
   - Typical: 10-60 seconds
   - Alert if > 120 seconds consistently

### Alternative Bots

If `@deezload2bot` is unavailable, search Telegram for alternatives:

- `@DeezloadBot`
- `@DeezerMusicBot`
- `@SpotifyMusicDownloaderBot`

Update `.env`:
```bash
TELEGRAM_DEEZER_BOT=@alternative_bot_name
```

Test with:
```bash
python manage.py setup_telegram --test-url "https://open.spotify.com/track/..."
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


trying to get this to work