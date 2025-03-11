import os
import dotenv
from celery import Celery
from pathlib import Path

# Load environment variables from .env file before setting up Celery
BASE_DIR = Path(__file__).resolve().parent.parent
dotenv_path = os.path.join(BASE_DIR, '.env')
if os.path.exists(dotenv_path):
    dotenv.load_dotenv(dotenv_path)
    print(f"Celery worker: Loaded .env file from {dotenv_path}")
else:
    print(f"Celery worker: Warning! .env file not found at {dotenv_path}")

# Set the default Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'lyric_video_project.settings')

app = Celery('lyric_video_project')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

@app.task(bind=True, ignore_result=True)
def debug_task(self):
    print(f'Request: {self.request!r}') 