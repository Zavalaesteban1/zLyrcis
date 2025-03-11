from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
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
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.authtoken.models import Token
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login, logout

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
        serializer = self.get_serializer(job, context={'request': request})
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
    
    @action(detail=False, methods=['post', 'patch'])
    def update_profile(self, request):
        profile = self.get_object()
        user = request.user
        
        # Get data from request
        name = request.data.get('name', '')
        email = request.data.get('email', '')
        role = request.data.get('role', '')
        
        # Update user information
        if name:
            # Split name into first_name and last_name
            name_parts = name.split(' ', 1)
            user.first_name = name_parts[0]
            user.last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        if email:
            user.email = email
        
        # Save user changes
        user.save()
        
        # Update profile information
        if role:
            profile.role = role
            profile.save()
        
        # Return the updated profile
        return Response(UserProfileSerializer(profile).data)
    
    @action(detail=False, methods=['post'])
    def update_picture(self, request):
        profile = self.get_object()
        print(f"Request data: {request.data}")
        print(f"Request FILES: {request.FILES}")
        
        if 'profile_picture' not in request.FILES:
            return Response(
                {'error': 'No file was provided or the file field name is incorrect'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Get the uploaded file
        file = request.FILES['profile_picture']
        print(f"Received file: {file.name}, size: {file.size}, content type: {file.content_type}")
        
        # Check if the file is an image
        if not file.content_type.startswith('image'):
            return Response(
                {'error': 'The uploaded file is not an image'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update the profile picture
        profile.profile_picture = file
        profile.save()
        
        # Return the full profile data with the absolute URL
        serialized_profile = UserProfileSerializer(profile).data
        if profile.profile_picture:
            # Get the full URL including domain
            request_base_url = request.build_absolute_uri('/')[:-1]  # Remove trailing slash
            serialized_profile['profile_picture'] = request_base_url + profile.profile_picture.url
        
        return Response(serialized_profile)
    
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

# Authentication views
@api_view(['POST'])
@permission_classes([AllowAny])
def user_login(request):
    """Login view to authenticate users and return token"""
    username = request.data.get('username')
    password = request.data.get('password')
    
    if username is None or password is None:
        return Response({'error': 'Please provide both username and password'},
                        status=status.HTTP_400_BAD_REQUEST)
    
    user = authenticate(username=username, password=password)
    
    if not user:
        return Response({'error': 'Invalid credentials'},
                        status=status.HTTP_401_UNAUTHORIZED)
    
    # Login the user in the session
    login(request, user)
    
    # Get or create token
    token, _ = Token.objects.get_or_create(user=user)
    
    # Get user profile
    try:
        profile = UserProfile.objects.get(user=user)
        profile_data = UserProfileSerializer(profile).data
    except UserProfile.DoesNotExist:
        profile_data = None
    
    return Response({
        'token': token.key,
        'user_id': user.pk,
        'username': user.username,
        'email': user.email,
        'profile': profile_data
    })

@api_view(['POST'])
@permission_classes([AllowAny])
def user_signup(request):
    """Register a new user"""
    username = request.data.get('username')
    email = request.data.get('email')
    password = request.data.get('password')
    
    if username is None or password is None or email is None:
        return Response({'error': 'Please provide username, email and password'},
                        status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(username=username).exists():
        return Response({'error': 'Username already exists'},
                        status=status.HTTP_400_BAD_REQUEST)
    
    if User.objects.filter(email=email).exists():
        return Response({'error': 'Email already exists'},
                        status=status.HTTP_400_BAD_REQUEST)
    
    # Create user
    user = User.objects.create_user(username=username, email=email, password=password)
    
    # UserProfile is created automatically through the signal
    
    # Authenticate and login the user
    user = authenticate(username=username, password=password)
    login(request, user)
    
    # Create token
    token, _ = Token.objects.get_or_create(user=user)
    
    # Get user profile
    profile = UserProfile.objects.get(user=user)
    
    return Response({
        'token': token.key,
        'user_id': user.pk,
        'username': user.username,
        'email': user.email,
        'profile': UserProfileSerializer(profile).data
    }, status=status.HTTP_201_CREATED)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def user_logout(request):
    """Logout the user and invalidate token"""
    if request.user.is_authenticated:
        # Delete the user's token
        try:
            request.user.auth_token.delete()
        except:
            pass
        
        # Logout from the session
        logout(request)
        
        return Response({'success': 'User logged out successfully'})
    else:
        return Response({'error': 'User is not logged in'},
                        status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_user_info(request):
    """Get information about the currently logged in user"""
    user = request.user
    try:
        profile = UserProfile.objects.get(user=user)
        profile_data = UserProfileSerializer(profile).data
    except UserProfile.DoesNotExist:
        profile_data = None
    
    return Response({
        'user_id': user.pk,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'profile': profile_data
    })
