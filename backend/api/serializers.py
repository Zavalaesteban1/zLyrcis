from rest_framework import serializers
from .models import VideoJob, UserProfile
from django.contrib.auth.models import User

class VideoJobSerializer(serializers.ModelSerializer):
    """Serializer for VideoJob model"""
    class Meta:
        model = VideoJob
        fields = ['id', 'spotify_url', 'song_title', 'artist', 'status', 'created_at', 'updated_at', 'video_file']
        read_only_fields = ['id', 'song_title', 'artist', 'status', 'created_at', 'updated_at', 'video_file']

class VideoStatusSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    error = serializers.CharField(source='error_message')
    
    class Meta:
        model = VideoJob
        fields = ['id', 'status', 'song_title', 'artist', 'video_url', 'error']
        read_only_fields = ['id', 'status', 'song_title', 'artist', 'video_url', 'error']
    
    def get_video_url(self, obj):
        if obj.video_file and obj.status == 'completed':
            request = self.context.get('request')
            if request is not None:
                return request.build_absolute_uri(obj.video_file.url)
            return obj.video_file.url if obj.video_file else None
        return None

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'date_joined', 'last_login']
        read_only_fields = ['id', 'username', 'date_joined', 'last_login']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    name = serializers.SerializerMethodField()
    email = serializers.SerializerMethodField()
    last_login = serializers.SerializerMethodField()
    
    class Meta:
        model = UserProfile
        fields = ['id', 'user', 'name', 'email', 'role', 'profile_picture', 'last_login']
        read_only_fields = ['id', 'user']
    
    def get_name(self, obj):
        if obj.user.first_name and obj.user.last_name:
            return f"{obj.user.first_name} {obj.user.last_name}"
        return obj.user.username
    
    def get_email(self, obj):
        return obj.user.email
    
    def get_last_login(self, obj):
        if obj.user.last_login:
            return obj.user.last_login.strftime("%Y-%m-%d %H:%M:%S")
        return None

class ProfilePictureSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=True)
    
    class Meta:
        model = UserProfile
        fields = ['profile_picture']

class VideoJobCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new VideoJob"""
    class Meta:
        model = VideoJob
        fields = ('spotify_url',) 