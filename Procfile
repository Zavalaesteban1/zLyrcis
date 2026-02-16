web: cd backend && gunicorn lyric_video_project.wsgi:application --bind 0.0.0.0:$PORT
worker: cd backend && celery -A lyric_video_project worker --loglevel=info
