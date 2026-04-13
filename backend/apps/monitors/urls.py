from django.urls import path, include
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
# We'll add viewsets later (e.g., EndpointViewSet)

urlpatterns = [
    path('', include(router.urls)),
]