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
    user = models.ForeignKey('auth.User', related_name='videos', on_delete=models.CASCADE, null=True)
    spotify_url = models.URLField(max_length=255)
    song_title = models.CharField(max_length=255, blank=True)
    artist = models.CharField(max_length=255, blank=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='pending')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    video_file = models.FileField(upload_to=video_upload_path, blank=True, null=True)
    error_message = models.TextField(blank=True)
    is_favorite_only = models.BooleanField(default=False)  # True if user just wants to save song, not generate video
    is_favorite = models.BooleanField(default=False)  # True if user marked this as a favorite song
    
    def __str__(self):
        return f"{self.song_title} by {self.artist} ({self.status})"

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    profile_picture = models.ImageField(upload_to='profile_pictures/', null=True, blank=True)
    role = models.CharField(max_length=50, default='Standard User')
    
    def __str__(self):
        return f"{self.user.username}'s Profile"

class Conversation(models.Model):
    """Model for storing conversation metadata"""
    id = models.CharField(max_length=255, primary_key=True)
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='conversations')
    title = models.CharField(max_length=255, default='New conversation')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-updated_at']
    
    def __str__(self):
        return f"{self.user.username} - {self.title}"

class ConversationMessage(models.Model):
    """Model for storing individual messages in a conversation"""
    ROLE_CHOICES = (
        ('user', 'User'),
        ('assistant', 'Assistant'),
    )
    
    conversation = models.ForeignKey(Conversation, on_delete=models.CASCADE, related_name='messages')
    role = models.CharField(max_length=20, choices=ROLE_CHOICES)
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    
    class Meta:
        ordering = ['created_at']
    
    def __str__(self):
        return f"{self.conversation.id} - {self.role}: {self.content[:50]}"
