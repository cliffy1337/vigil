from django.contrib import admin
from .models import Endpoint, CheckResult, Incident, FailedEmail

@admin.register(Endpoint)
class EndpointAdmin(admin.ModelAdmin):
    list_display = ['name', 'user', 'url', 'interval_minutes', 'is_active', 'last_alert_sent_at', 'created_at']
    list_filter = ['is_active', 'created_at', 'user']
    search_fields = ['name', 'url']
    raw_id_fields = ['user']
    readonly_fields = ['id', 'created_at', 'updated_at']

@admin.register(CheckResult)
class CheckResultAdmin(admin.ModelAdmin):
    list_display = ['endpoint', 'is_up', 'status_code', 'response_time_ms', 'checked_at']
    list_filter = ['is_up', 'checked_at']
    search_fields = ['endpoint__name', 'endpoint__url']
    readonly_fields = ['id', 'checked_at']

@admin.register(Incident)
class IncidentAdmin(admin.ModelAdmin):
    list_display = ['endpoint', 'started_at', 'ended_at', 'resolved', 'duration_seconds']
    list_filter = ['resolved', 'started_at']
    search_fields = ['endpoint__name']
    readonly_fields = ['id', 'created_at']

@admin.register(FailedEmail)
class FailedEmailAdmin(admin.ModelAdmin):
    list_display = ['to_email', 'subject', 'retry_count', 'next_retry_at', 'success_at']
    list_filter = ['retry_count', 'success_at']
    search_fields = ['to_email', 'subject']
    readonly_fields = ['id', 'created_at', 'last_attempt_at']