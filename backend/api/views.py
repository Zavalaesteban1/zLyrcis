from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import VideoJob
from .serializers import VideoJobSerializer, VideoJobCreateSerializer
from .tasks import generate_lyric_video

# Create your views here.

class VideoJobViewSet(viewsets.ModelViewSet):
    """ViewSet for handling video generation jobs"""
    queryset = VideoJob.objects.all().order_by('-created_at')
    
    def get_serializer_class(self):
        if self.action == 'create':
            return VideoJobCreateSerializer
        return VideoJobSerializer
    
    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        job = serializer.save()
        
        # Queue the video generation task
        generate_lyric_video.delay(str(job.id))
        
        headers = self.get_success_headers(serializer.data)
        return Response(
            VideoJobSerializer(job).data,
            status=status.HTTP_201_CREATED,
            headers=headers
        )
    
    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get the status of a video generation job"""
        job = get_object_or_404(VideoJob, pk=pk)
        return Response({
            'status': job.status,
            'video_url': request.build_absolute_uri(job.video_file.url) if job.video_file else None,
            'error': job.error_message if job.error_message else None
        })
