from rest_framework import serializers
from .models import VideoJob

class VideoJobSerializer(serializers.ModelSerializer):
    """Serializer for VideoJob model"""
    class Meta:
        model = VideoJob
        fields = '__all__'
        read_only_fields = ('id', 'status', 'created_at', 'updated_at', 'video_file', 'error_message')

class VideoJobCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new VideoJob"""
    class Meta:
        model = VideoJob
        fields = ('spotify_url',) 