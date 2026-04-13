from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EndpointViewSet, CheckResultViewSet, IncidentViewSet

router = DefaultRouter()
router.register(r'endpoints', EndpointViewSet, basename='endpoint')
router.register(r'check-results', CheckResultViewSet, basename='checkresult')
router.register(r'incidents', IncidentViewSet, basename='incident')

urlpatterns = [
    path('', include(router.urls)),
]