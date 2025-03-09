from django.db import models
import uuid
import os
from django.contrib.auth.models import User

def video_upload_path(instance, filename):
    """Generate a unique path for uploaded videos"""
    ext = filename.split('.')[-1]
    filename = f"{uuid.uuid4()}.{ext}"
    return os.path.join('videos', filename)

class VideoJob(models.Model):
    """Model for storing video generation job information"""
    STATUS_CHOICES = (
        ('pending', 'Pending'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    )
    
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    spotify_url = models.URLField(max_length=255)
    song_title = models.CharField(max_length=255, blank=True)
    artist = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    video_file = models.FileField(upload_to=video_upload_path, blank=True, null=True)
    error_message = models.TextField(blank=True)
    
    def __str__(self):
        return f"{self.song_title} by {self.artist} ({self.status})"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    role = models.CharField(max_length=50, default='Standard User')
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
