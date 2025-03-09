from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import VideoJobViewSet, UserProfileViewSet

router = DefaultRouter()
router.register(r'videos', VideoJobViewSet)
router.register(r'profile', UserProfileViewSet)

urlpatterns = [
    path('', include(router.urls)),
] 