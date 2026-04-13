from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import Endpoint, CheckResult, Incident
from .serializers import EndpointSerializer, CheckResultSerializer, IncidentSerializer
from .permissions import IsOwnerOrReadOnly

class EndpointViewSet(viewsets.ModelViewSet):
    serializer_class = EndpointSerializer
    permission_classes = [permissions.IsAuthenticated, IsOwnerOrReadOnly]

    def get_queryset(self):
        return Endpoint.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=['post'])
    def check_now(self, request, pk=None):
        endpoint = self.get_object()
        # We'll implement Celery task later; for now just return ack
        from .tasks import check_endpoint  # will be created later
        check_endpoint.delay(endpoint.id)
        return Response({'status': 'check queued'}, status=status.HTTP_202_ACCEPTED)

class CheckResultViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = CheckResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        qs = CheckResult.objects.filter(endpoint__user=self.request.user)
        endpoint_id = self.request.query_params.get('endpoint')
        if endpoint_id:
            qs = qs.filter(endpoint_id=endpoint_id)
        return qs

class IncidentViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = IncidentSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        return Incident.objects.filter(endpoint__user=self.request.user)

    @action(detail=True, methods=['post'])
    def resend_alert(self, request, pk=None):
        incident = self.get_object()
        # We'll implement email resend later
        return Response({'status': 'alert resend queued'}, status=status.HTTP_202_ACCEPTED)