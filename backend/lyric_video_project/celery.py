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
print(f"REDIS_URL: {redis_url[:40]}...")
print(f"========================================")

app = Celery('lyric_video_project',
             broker=redis_url,
             backend=redis_url,
             include=['api.tasks'])

app.conf.update(
    task_serializer='json',
    accept_content=['json'],
    result_serializer='json',
)

app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}')