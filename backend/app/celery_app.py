from celery import Celery
import os
from app.core.config import settings

broker = os.getenv("CELERY_BROKER_URL", settings.REDIS_URL)
celery_app = Celery("proofile_worker", broker=broker)
# Basic config - in production, configure task serializer, result backend, concurrency
celery_app.conf.update(task_track_started=True)

@celery_app.task
def ping():
    return "pong"
