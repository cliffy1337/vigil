import os
from celery import Celery
from celery.schedules import crontab

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
app = Celery('vigil')
app.config_from_object('django.conf:settings', namespace='CELERY')
app.autodiscover_tasks()
app.conf.beat_schedule = {
    'check-endpoints-every-5-minutes': {
        'task': 'apps.monitors.tasks.schedule_checks',
        'schedule': crontab(minute='*/5'),  # every 5 minutes
    },
}