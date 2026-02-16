from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    VideoJobViewSet, 
    UserProfileViewSet,
    user_login,
    user_signup,
    user_logout,
    get_user_info,
    google_login,
    agent_song_request,
    agent_chat,
    get_conversation_history,
    get_all_conversations,
    delete_conversation
)
from django.conf import settings
from django.conf.urls.static import static

router = DefaultRouter()
router.register(r'videos', VideoJobViewSet)
router.register(r'profile', UserProfileViewSet, basename='profile')

urlpatterns = [
    path('', include(router.urls)),
    # Authentication endpoints
    path('auth/login/', user_login, name='login'),
    path('auth/signup/', user_signup, name='signup'),
    path('auth/logout/', user_logout, name='logout'),
    path('auth/user/', get_user_info, name='user_info'),
    path('auth/google-login/', google_login, name='google_login'),
    path('agent_song_request/', agent_song_request, name='agent-song-request'),
    path('agent_chat/', agent_chat, name='agent_chat'),
    path('get_conversation_history/', get_conversation_history, name='get_conversation_history'),
    path('get_all_conversations/', get_all_conversations, name='get_all_conversations'),
    path('delete_conversation/<str:conversation_id>/', delete_conversation, name='delete_conversation'),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT) 