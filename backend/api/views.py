from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import VideoJob, UserProfile
from .serializers import (
    VideoJobSerializer, 
    VideoStatusSerializer, 
    UserProfileSerializer, 
    ProfilePictureSerializer
)
from .tasks import generate_lyric_video
from rest_framework.permissions import IsAuthenticated

# Create your views here.

class VideoJobViewSet(viewsets.ModelViewSet):
    """ViewSet for handling video generation jobs"""
    queryset = VideoJob.objects.all().order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'status':
            return VideoStatusSerializer
        return VideoJobSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = serializer.save(status='pending')
        
        # Queue the video generation task
        generate_lyric_video.delay(job.id)
        
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get the status of a video generation job"""
        job = get_object_or_404(VideoJob, pk=pk)
        serializer = self.get_serializer(job)
        return Response(serializer.data)

class UserProfileViewSet(viewsets.ModelViewSet):
    queryset = UserProfile.objects.all()
    serializer_class = UserProfileSerializer
    permission_classes = [IsAuthenticated]
    
    def get_object(self):
        # Return the profile of the currently authenticated user
        return get_object_or_404(UserProfile, user=self.request.user)
    
    @action(detail=False, methods=['get'])
    def me(self, request):
        profile = self.get_object()
        serializer = self.get_serializer(profile)
        return Response(serializer.data)
    
    @action(detail=False, methods=['post'])
    def update_picture(self, request):
        profile = self.get_object()
        serializer = ProfilePictureSerializer(profile, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        
        # Return the full profile data
        return Response(UserProfileSerializer(profile).data)
    
    @action(detail=False, methods=['post'])
    def change_password(self, request):
        user = request.user
        old_password = request.data.get('old_password')
        new_password = request.data.get('new_password')
        
        if not old_password or not new_password:
            return Response(
                {'error': 'Both old_password and new_password are required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        if not user.check_password(old_password):
            return Response(
                {'error': 'Old password is incorrect'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        user.set_password(new_password)
        user.save()
        return Response({'success': 'Password updated successfully'})
