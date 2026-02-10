# Lyric Video Generator

Generate synchronized lyric videos from Spotify tracks with AI-powered timing and beautiful animations.

## Features

- **AI-Powered Synchronization** - Advanced lyric-to-audio alignment using Deepgram + audio analysis
- **AI Chat Agent** - Conversational interface to request songs naturally
- **Video Library** - Manage your collection with album artwork
- **User Profiles** - Authentication with Google OAuth or username/password
- **Download & Share** - Export videos for any platform

## Tech Stack

**Backend:** Django, Celery, Redis, FFmpeg, librosa  
**Frontend:** React, TypeScript, Styled Components  
**Database:** MySQL (easily switchable to PostgreSQL)  
**APIs:** Spotify, Genius, Deepgram, Anthropic Claude

---

## Prerequisites

Before installation, ensure you have:

- **Python 3.8+** with pip
- **Node.js 16+** with npm
- **MySQL** or PostgreSQL database
- **Redis** server
- **FFmpeg** with codecs

---

## Quick Start

```bash
# 1. Clone repository
git clone <repository-url>
cd lyric_video_generator

# 2. Backend setup
cd backend

python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
python manage.py migrate

# 3. Frontend setup
cd ../frontend
npm install

# 4. Configure environment variables (see below)

# 5. Run services (3 terminals needed)
# Terminal 1: Redis
redis-server

# Terminal 2: Celery worker
cd backend
celery -A lyric_video_project worker --loglevel=info

# Terminal 3: Django server
python manage.py runserver

# Terminal 4: React app
cd frontend
npm start
```

Access the app at `http://localhost:3000`

---

## Detailed Setup Instructions

### Option 1: macOS Setup

**1. Install Homebrew (if not installed):**
```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

**2. Install system dependencies:**
```bash
brew install python3 node mysql redis ffmpeg portaudio
```

**3. Start MySQL and Redis:**
```bash
brew services start mysql
brew services start redis
```

**4. Create database:**
```bash
mysql -u root -p
CREATE DATABASE zLyrics;
exit;
```

**5. Follow the "Backend Setup" and "Frontend Setup" sections below.**

---

### Option 2: Ubuntu/Linux Setup

**1. Update system:**
```bash
sudo apt update && sudo apt upgrade -y
```

**2. Install system dependencies:**
```bash
sudo apt install -y \
  python3 python3-pip python3-venv python3-dev \
  nodejs npm \
  mysql-server \
  redis-server \
  ffmpeg libavcodec-extra \
  build-essential libssl-dev libffi-dev \
  libasound2-dev portaudio19-dev libportaudio2 \
  libpulse-dev libsndfile1-dev
```

**3. Start services:**
```bash
sudo systemctl start mysql
sudo systemctl start redis-server
sudo systemctl enable mysql
sudo systemctl enable redis-server
```

**4. Create database:**
```bash
sudo mysql
CREATE DATABASE zLyrics;
CREATE USER 'root'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON zLyrics.* TO 'root'@'localhost';
FLUSH PRIVILEGES;
exit;
```

**5. Follow the "Backend Setup" and "Frontend Setup" sections below.**

---

### Option 3: Windows Setup

**1. Install prerequisites:**
- **Python 3.8+**: Download from [python.org](https://www.python.org/downloads/)
- **Node.js 16+**: Download from [nodejs.org](https://nodejs.org/)
- **MySQL**: Download from [mysql.com](https://dev.mysql.com/downloads/installer/)
- **Redis**: Download from [Memurai](https://www.memurai.com/get-memurai) or use WSL2

**2. Install FFmpeg:**
- Download from [ffmpeg.org](https://ffmpeg.org/download.html#build-windows)
- Extract and add to PATH environment variable
- Verify: `ffmpeg -version`

**3. Create database:**
```cmd
mysql -u root -p
CREATE DATABASE zLyrics;
exit;
```

**4. Follow the "Backend Setup" and "Frontend Setup" sections below.**

---

## Backend Setup

**1. Create virtual environment:**
```bash
cd backend
python -m venv venv

# Activate:
source venv/bin/activate          # macOS/Linux
venv\Scripts\activate              # Windows
```

**2. Install Python dependencies:**
```bash
pip install -r requirements.txt
```

**3. Configure environment variables:**

Create `backend/.env` file:
```bash
# Django settings
DEBUG=True
SECRET_KEY=your-secret-key-here
DATABASE_NAME=zLyrics
DATABASE_USER=root
DATABASE_PASS=your_mysql_password
DB_HOST=localhost

# Spotify API (required)
SPOTIFY_CLIENT_ID=your_spotify_client_id
SPOTIFY_CLIENT_SECRET=your_spotify_client_secret

# Genius API (required)
GENIUS_ACCESS_TOKEN=your_genius_token

# Anthropic API (required for AI agent)
ANTHROPIC_API_KEY=your_anthropic_key

# Google OAuth (optional)
GOOGLE_CLIENT_ID=your_google_client_id

# Deepgram API (optional, enhances sync quality)
DEEPGRAM_API_KEY=your_deepgram_key

# Celery settings
CELERY_BROKER_URL=redis://localhost:6379/0
CELERY_RESULT_BACKEND=redis://localhost:6379/0
```

**4. Run database migrations:**
```bash
python manage.py migrate
python manage.py createsuperuser  # Optional: create admin user
```

---

## Frontend Setup

**1. Install dependencies:**
```bash
cd frontend
npm install
```

**2. Configure environment variables:**

Create `frontend/.env` file:
```bash
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_SPOTIFY_CLIENT_ID=your_spotify_client_id
REACT_APP_SPOTIFY_CLIENT_SECRET=your_spotify_client_secret
REACT_APP_GOOGLE_CLIENT_ID=your_google_client_id
```

---

## Getting API Credentials

### Spotify API (Required)
1. Visit [Spotify Developer Dashboard](https://developer.spotify.com/dashboard/)
2. Log in and create a new app
3. Copy the **Client ID** and **Client Secret**
4. Add redirect URI: `http://localhost:3000`

### Genius API (Required)
1. Visit [Genius API Clients](https://genius.com/api-clients)
2. Create a new API client
3. Generate an access token
4. Copy the token

### Anthropic API (Required for AI Agent)
1. Visit [Anthropic Console](https://console.anthropic.com/)
2. Create an account
3. Generate an API key from the dashboard

### Deepgram API (Optional)
1. Visit [Deepgram Console](https://console.deepgram.com/)
2. Sign up for free tier (45,000 minutes free)
3. Create an API key

### Google OAuth (Optional)
1. Visit [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project
3. Enable Google+ API
4. Create OAuth 2.0 credentials
5. Add authorized redirect URI: `http://localhost:3000`

---

## Running the Application

You need **4 terminal windows** open:

### Terminal 1: Redis Server
```bash
redis-server
```

### Terminal 2: Celery Worker (Backend)
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
celery -A lyric_video_project worker --loglevel=info
```

### Terminal 3: Django Server (Backend)
```bash
cd backend
source venv/bin/activate  # Windows: venv\Scripts\activate
python manage.py runserver
```

### Terminal 4: React App (Frontend)
```bash
cd frontend
npm start
```

**Access the application:**
- Frontend: `http://localhost:3000`
- Backend API: `http://localhost:8000/api`
- Django Admin: `http://localhost:8000/admin`

---

## Using Local Audio Files

If automatic audio download fails, use local MP3 files:

**1. Create audio directory:**
```bash
mkdir audio_files  # In project root
```

**2. Add MP3 files with this naming format:**
```
"Song Title - Artist Name.mp3"
Example: "Shape of You - Ed Sheeran.mp3"
```

**3. The system will automatically detect and use local files.**

---

## Troubleshooting

### FFmpeg Not Found
```bash
# macOS
brew install ffmpeg

# Ubuntu
sudo apt install ffmpeg

# Windows
# Download from ffmpeg.org and add to PATH
```

### Redis Connection Error
```bash
# Check if Redis is running
redis-cli ping  # Should return "PONG"

# Start Redis
redis-server
```

### MySQL Connection Error
```bash
# Check if MySQL is running
# macOS
brew services list

# Ubuntu
sudo systemctl status mysql

# Verify database exists
mysql -u root -p -e "SHOW DATABASES;"
```

### Celery Worker Not Processing Tasks
```bash
# Check Celery worker logs
# Ensure Redis is running
# Verify CELERY_BROKER_URL in .env
```

### Port Already in Use
```bash
# Django (port 8000)
python manage.py runserver 8001

# React (port 3000)
PORT=3001 npm start
```

### Missing Python Packages
```bash
# Reinstall requirements
pip install --upgrade pip
pip install -r requirements.txt
```

### Frontend Build Errors
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

---

## Project Structure

```
lyric_video_generator/
├── backend/
│   ├── api/                    # Django app
│   │   ├── models.py          # VideoJob, UserProfile
│   │   ├── views.py           # REST API endpoints
│   │   ├── tasks.py           # Celery async tasks
│   │   └── lyric_video/       # Core video generation
│   ├── lyric_video_project/   # Django settings
│   ├── media/                 # Generated videos
│   ├── requirements.txt
│   └── manage.py
├── frontend/
│   ├── src/
│   │   ├── pages/            # React pages
│   │   ├── services/api.ts   # API client
│   │   └── styles/           # Styled components
│   └── package.json
└── audio_files/              # Optional local audio
```

---

## Common Commands

```bash
# Backend
python manage.py makemigrations
python manage.py migrate
python manage.py createsuperuser
python manage.py shell

# Frontend
npm start                     # Development server
npm run build                 # Production build
npm test                      # Run tests

# Celery
celery -A lyric_video_project worker --loglevel=info
celery -A lyric_video_project beat  # Periodic tasks (if needed)

# Database
python manage.py dumpdata > backup.json
python manage.py loaddata backup.json
```

---

## Development Tips

1. **Test video generation:**
   - Use short songs (2-3 minutes) for faster testing
   - Check Celery worker logs for errors
   - Monitor Redis: `redis-cli MONITOR`

2. **Debug mode:**
   - Set `DEBUG=True` in backend `.env`
   - Check Django logs in terminal
   - Use Django admin at `/admin` to view database

3. **API testing:**
   - Use Postman or curl to test endpoints
   - Django REST Framework provides browsable API at `/api/`

4. **Frontend development:**
   - React DevTools for component inspection
   - Network tab to debug API calls
   - Check browser console for errors

---

## License

MIT License 