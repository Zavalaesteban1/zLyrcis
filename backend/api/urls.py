from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VideoJobViewSet

router = DefaultRouter()
router.register(r'videos', VideoJobViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 