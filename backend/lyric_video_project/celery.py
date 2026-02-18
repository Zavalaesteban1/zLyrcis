import os
import dotenv
from celery import Celery
from pathlib import Path

BASE_DIR = Path(__file__).resolve().parent.parent
dotenv_path = os.path.join(BASE_DIR, '.env')
if os.path.exists(dotenv_path):
    dotenv.load_dotenv(dotenv_path)
else:
    print(f"Celery worker: Warning! .env file not found at {dotenv_path}")

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lyric_video_project.settings')

redis_url = os.environ.get('REDIS_URL', 'redis://localhost:6379/0')
print(f"====== DEBUGGING REDIS AND CELERY =====")
print(f"REDIS_URL from environment: {redis_url[:40]}...")
print(f"========================================")

app = Celery('lyric_video_project')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.conf.broker_url = redis_url
app.conf.result_backend = redis_url

app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')