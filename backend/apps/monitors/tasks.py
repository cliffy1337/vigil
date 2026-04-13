import requests
from celery import shared_task
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .models import Endpoint, CheckResult, Incident, FailedEmail
import logging

logger = logging.getLogger(__name__)

@shared_task(bind=True, max_retries=3, default_retry_delay=60)
def check_endpoint(self, endpoint_id):
    """Check a single endpoint and record result, create/close incidents, send alerts."""
    try:
        endpoint = Endpoint.objects.get(id=endpoint_id, is_active=True)
    except Endpoint.DoesNotExist:
        logger.warning(f"Endpoint {endpoint_id} not found or inactive")
        return

    # Idempotency: skip if checked too recently (within interval_minutes)
    last_check = CheckResult.objects.filter(endpoint=endpoint).first()
    if last_check:
        elapsed = (timezone.now() - last_check.checked_at).total_seconds() / 60
        if elapsed < endpoint.interval_minutes:
            logger.info(f"Skipping {endpoint.name}, last check {elapsed:.1f} min ago")
            return

    # Perform HTTP check
    start_time = timezone.now()
    try:
        response = requests.get(endpoint.url, timeout=10)
        is_up = response.status_code < 500  # consider 4xx as down? You decide, but let's treat <500 as up
        status_code = response.status_code
        response_time = int((timezone.now() - start_time).total_seconds() * 1000)
    except requests.RequestException as e:
        is_up = False
        status_code = None
        response_time = None
        logger.error(f"Check failed for {endpoint.name}: {e}")

    # Save check result
    check = CheckResult.objects.create(
        endpoint=endpoint,
        status_code=status_code,
        response_time_ms=response_time or 0,
        is_up=is_up,
        checked_at=start_time
    )

    # Get previous check result
    previous_check = CheckResult.objects.filter(endpoint=endpoint).exclude(id=check.id).first()

    # Detect status change
    status_changed = previous_check and previous_check.is_up != is_up
    if status_changed:
        if not is_up:
            # Outage started
            incident = Incident.objects.create(
                endpoint=endpoint,
                started_at=start_time,
                resolved=False
            )
            # Send alert asynchronously
            send_alert_email.delay(endpoint.id, incident.id, is_resolved=False)
        else:
            # Outage ended
            incident = Incident.objects.filter(endpoint=endpoint, resolved=False).first()
            if incident:
                incident.ended_at = start_time
                incident.resolved = True
                incident.save()
                send_alert_email.delay(endpoint.id, incident.id, is_resolved=True)

    return check.id

@shared_task(bind=True, max_retries=2, default_retry_delay=300)
def send_alert_email(self, endpoint_id, incident_id, is_resolved):
    """Send email alert for an incident (start or resolution)."""
    try:
        endpoint = Endpoint.objects.get(id=endpoint_id)
        incident = Incident.objects.get(id=incident_id)
    except (Endpoint.DoesNotExist, Incident.DoesNotExist) as e:
        logger.error(f"Cannot send alert: {e}")
        return

    # Cooldown: don't send another alert for same endpoint within cooldown period (default 60 min)
    cooldown_minutes = getattr(endpoint.user, 'alert_cooldown_minutes', 60)
    if endpoint.last_alert_sent_at:
        elapsed = (timezone.now() - endpoint.last_alert_sent_at).total_seconds() / 60
        if elapsed < cooldown_minutes and not is_resolved:
            logger.info(f"Alert cooldown active for {endpoint.name}, skipping email")
            return

    subject = f"[Vigil] {endpoint.name} is {'DOWN' if not is_resolved else 'UP again'}"
    message = f"""
    Endpoint: {endpoint.name} ({endpoint.url})
    Status: {'DOWN' if not is_resolved else 'RESOLVED'}
    Time: {timezone.now()}
    Incident started at: {incident.started_at}
    """
    if is_resolved and incident.ended_at:
        message += f"Resolved at: {incident.ended_at}\nDuration: {incident.duration_seconds():.0f} seconds"

    try:
        send_mail(
            subject=subject,
            message=message.strip(),
            from_email=settings.DEFAULT_FROM_EMAIL,
            recipient_list=[endpoint.user.email],
            fail_silently=False,
        )
        endpoint.last_alert_sent_at = timezone.now()
        endpoint.save(update_fields=['last_alert_sent_at'])
        logger.info(f"Alert email sent for {endpoint.name} to {endpoint.user.email}")
    except Exception as e:
        logger.error(f"Failed to send email: {e}")
        # Store in dead letter queue for later retry
        FailedEmail.objects.create(
            to_email=endpoint.user.email,
            subject=subject,
            body=message,
            retry_count=0,
            next_retry_at=timezone.now() + timezone.timedelta(minutes=5),
        )
        # Retry the task
        raise self.retry(exc=e)

@shared_task
def schedule_checks():
    """Periodic task that schedules checks for all active endpoints."""
    endpoints = Endpoint.objects.filter(is_active=True)
    for endpoint in endpoints:
        check_endpoint.delay(endpoint.id)
    logger.info(f"Scheduled checks for {endpoints.count()} endpoints")