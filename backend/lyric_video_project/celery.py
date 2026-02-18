import os
import dotenv
from celery import Celery
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
dotenv_path = os.path.join(BASE_DIR, '.env')
if os.path.exists(dotenv_path):
    dotenv.load_dotenv(dotenv_path)
    print(f"Celery worker: Loaded .env file from {dotenv_path}")
else:
    print(f"Celery worker: Warning! .env file not found at {dotenv_path}")

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lyric_video_project.settings')

print("====== DEBUGGING REDIS AND CELERY =====")
redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
print(f"REDIS_URL from environment: {redis_url[:40]}...")
print(f"Full REDIS_URL length: {len(redis_url)}")
print("========================================")

app = Celery('lyric_video_project',
             broker=redis_url,
             backend=redis_url)

app.config_from_object('django.conf:settings', namespace='CELERY')

app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')