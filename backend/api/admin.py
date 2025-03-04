from django.contrib import admin
from .models import VideoJob

@admin.register(VideoJob)
class VideoJobAdmin(admin.ModelAdmin):
    list_display = ('id', 'song_title', 'artist', 'status', 'created_at')
    list_filter = ('status', 'created_at')
    search_fields = ('song_title', 'artist', 'spotify_url')
    readonly_fields = ('id', 'created_at', 'updated_at')
