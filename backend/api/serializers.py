from rest_framework import serializers
from .models import VideoJob, UserProfile
from django.contrib.auth.models import User

class VideoJobSerializer(serializers.ModelSerializer):
    """Serializer for VideoJob model"""
    video_file = serializers.SerializerMethodField()
    
    class Meta:
        model = VideoJob
        fields = ['id', 'spotify_url', 'song_title', 'artist', 'album_cover', 'status', 'created_at', 'updated_at', 'video_file', 'is_favorite', 'is_favorite_only', 'is_learned', 'last_practiced', 'difficulty_rating', 'bg_color', 'text_color', 'karaoke_color']
        read_only_fields = ['id', 'song_title', 'artist', 'status', 'created_at', 'updated_at']
    
    def get_video_file(self, obj):
        """Return video file URL - handles both URLField and FileField"""
        if not obj.video_file:
            return None
        
        # If it's a string (URLField with R2/external URL), check if it's a full URL
        if isinstance(obj.video_file, str):
            if obj.video_file.startswith('http://') or obj.video_file.startswith('https://'):
                return obj.video_file
            else:
                # It's a relative path - build absolute URL
                request = self.context.get('request')
                if request:
                    # Prepend /media/ for Django's MEDIA_URL
                    media_url = f"/media/{obj.video_file}"
                    abs_url = request.build_absolute_uri(media_url)
                    return abs_url
                else:
                    return obj.video_file
        
        # Try FileField approach for backwards compatibility
        try:
            if hasattr(obj.video_file, 'url'):
                url = obj.video_file.url
                # If it's already a full URL (R2/external), return as is
                if url.startswith('http://') or url.startswith('https://'):
                    return url
                # Otherwise build absolute URI (local storage)
                request = self.context.get('request')
                if request:
                    abs_url = request.build_absolute_uri(url)
                    return abs_url
                return url
        except (ValueError, AttributeError):
            pass
        
        # Fallback: return as string
        return str(obj.video_file) if obj.video_file else None

class VideoStatusSerializer(serializers.ModelSerializer):
    video_url = serializers.SerializerMethodField()
    error = serializers.CharField(source='error_message')
    
    class Meta:
        model = VideoJob
        fields = ['id', 'status', 'song_title', 'artist', 'video_url', 'error']
        read_only_fields = ['id', 'status', 'song_title', 'artist', 'video_url', 'error']
    
    def get_video_url(self, obj):
        """Get video URL - handles both URLField (R2/external URLs) and FileField"""
        if obj.video_file and obj.status == 'completed':
            # If video_file is a string (URLField with R2 URL), return directly
            if isinstance(obj.video_file, str):
                # Already a full URL (R2/external)
                if obj.video_file.startswith('http://') or obj.video_file.startswith('https://'):
                    return obj.video_file
                else:
                    # It's a relative path - build absolute URL
                    request = self.context.get('request')
                    if request:
                        media_url = f"/media/{obj.video_file}"
                        abs_url = request.build_absolute_uri(media_url)
                        return abs_url
            
            # Otherwise, try to get URL from FileField (for backwards compatibility)
            try:
                if hasattr(obj.video_file, 'url'):
                    url = obj.video_file.url
                    # If it's already a full URL, return as is
                    if url.startswith('http://') or url.startswith('https://'):
                        return url
                    # Otherwise build absolute URI
                    request = self.context.get('request')
                    if request is not None:
                        abs_url = request.build_absolute_uri(url)
                        return abs_url
                    return url
            except (ValueError, AttributeError):
                # If we can't get the URL, return the video_file value itself
                return str(obj.video_file) if obj.video_file else None
        
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
    profile_picture = serializers.SerializerMethodField()
    
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
    
    def get_profile_picture(self, obj):
        """Return the profile picture URL. Falls back to the Cloudinary-hosted default avatar."""
        default_avatar_url = 'https://res.cloudinary.com/dhvp6c43m/image/upload/profile_pictures/default_avatar.png'

        if obj.profile_picture:
            picture_name = str(obj.profile_picture)
            # The model used to store this path as a default even for new users who
            # never uploaded anything. It is NOT a real upload, so skip Cloudinary
            # resolution and return the default directly.
            if picture_name == 'profile_pictures/default_avatar.png':
                return default_avatar_url

            if hasattr(obj.profile_picture, 'url'):
                url = obj.profile_picture.url
                if url.startswith('http://') or url.startswith('https://'):
                    return url
                # Local dev storage — build an absolute URI
                request = self.context.get('request')
                if request:
                    return request.build_absolute_uri(url)
                return url

        return default_avatar_url

class ProfilePictureSerializer(serializers.ModelSerializer):
    profile_picture = serializers.ImageField(required=True)
    
    class Meta:
        model = UserProfile
        fields = ['profile_picture']

class VideoJobCreateSerializer(serializers.ModelSerializer):
    """Serializer for creating a new VideoJob"""
    class Meta:
        model = VideoJob
        fields = ('spotify_url', 'bg_color', 'text_color', 'karaoke_color') 