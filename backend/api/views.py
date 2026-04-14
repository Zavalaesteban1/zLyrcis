from django.shortcuts import render
from rest_framework import viewsets, status
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from .models import VideoJob, UserProfile, Conversation, ConversationMessage
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
import json
from django.conf import settings
import os
import logging
import time
from google.oauth2 import id_token
from google.auth.transport import requests as google_requests
import requests
import spotipy
from spotipy.oauth2 import SpotifyClientCredentials
from django.core.cache import cache

# Create your views here.

class VideoJobViewSet(viewsets.ModelViewSet):
    """ViewSet for handling video generation jobs"""
    queryset = VideoJob.objects.all().order_by('-created_at')
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        """
        Temporary solution to filter videos by user using session storage
        until database migrations can be applied to add user field
        """
        user = self.request.user

        # Store user_id in the session if not already there
        if not self.request.session.get('user_videos'):
            self.request.session['user_videos'] = []

        # Get all videos created in this session by this user
        user_videos = self.request.session.get('user_videos', [])

        # Return only videos in the user's session or filter by user if field exists
        try:
            # Try to filter by user field if it exists (after migration)
            return VideoJob.objects.filter(user=user).order_by('-created_at')
        except:
            # Fallback to filtering by IDs in session
            if user_videos:
                return VideoJob.objects.filter(id__in=user_videos).order_by('-created_at')
            else:
                # If no videos in session yet, return empty queryset
                return VideoJob.objects.none()

    def get_serializer_class(self):
        if self.action == 'status':
            return VideoStatusSerializer
        return VideoJobSerializer

    def create(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        # Create the job
        try:
            # Try to set user if field exists
            job = serializer.save(status='pending', user=request.user)
        except:
            # Fallback if user field doesn't exist yet
            job = serializer.save(status='pending')

        # Store the job ID in the session for this user
        user_videos = request.session.get('user_videos', [])
        user_videos.append(str(job.id))
        request.session['user_videos'] = user_videos
        request.session.modified = True

        # Queue the video generation task
        generate_lyric_video.delay(job.id)

        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    @action(detail=True, methods=['get'])
    def status(self, request, pk=None):
        """Get the status of a video generation job"""
        job = self.get_object()
        serializer = self.get_serializer(job, context={'request': request})
        return Response(serializer.data)

    @action(detail=True, methods=['post'])
    def start_generation(self, request, pk=None):
        """Start video generation with customized settings."""
        job = self.get_object()
        
        bg_color = request.data.get('bg_color')
        text_color = request.data.get('text_color')
        karaoke_color = request.data.get('karaoke_color')
        
        if bg_color:
            job.bg_color = bg_color
        if text_color:
            job.text_color = text_color
        if karaoke_color:
            job.karaoke_color = karaoke_color
            
        job.status = 'pending'
        job.save()
        
        # Queue the video generation task
        generate_lyric_video.delay(job.id)
        
        serializer = self.get_serializer(job)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def use_existing_variant(self, request):
        """Create a new job using an exact existing video variant to save processing"""
        variant_id = request.data.get('variant_id')
        if not variant_id:
            return Response({'error': 'variant_id is required'}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            source_job = VideoJob.objects.get(id=variant_id, status='completed')
        except VideoJob.DoesNotExist:
            return Response({'error': 'Variant not found or not completed'}, status=status.HTTP_404_NOT_FOUND)
            
        # Create a new job for this user with same settings
        try:
            new_job = VideoJob.objects.create(
                user=request.user,
                spotify_url=source_job.spotify_url,
                song_title=source_job.song_title,
                artist=source_job.artist,
                status='completed',
                video_file=source_job.video_file,
                bg_color=source_job.bg_color,
                text_color=source_job.text_color,
                karaoke_color=source_job.karaoke_color,
                is_favorite_only=False,
                is_favorite=False
            )
        except:
            # Fallback if user field doesn't work currently
            new_job = VideoJob.objects.create(
                spotify_url=source_job.spotify_url,
                song_title=source_job.song_title,
                artist=source_job.artist,
                status='completed',
                video_file=source_job.video_file,
                bg_color=source_job.bg_color,
                text_color=source_job.text_color,
                karaoke_color=source_job.karaoke_color,
                is_favorite_only=False,
                is_favorite=False
            )
            
        # Store in session
        user_videos = request.session.get('user_videos', [])
        user_videos.append(str(new_job.id))
        request.session['user_videos'] = user_videos
        request.session.modified = True
            
        serializer = self.get_serializer(new_job)
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
        serializer = self.get_serializer(profile, context={'request': request})
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
        return Response(UserProfileSerializer(profile, context={'request': request}).data)

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
        serialized_profile = UserProfileSerializer(profile, context={'request': request}).data
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
        profile_data = UserProfileSerializer(profile, context={'request': request}).data
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
def google_login(request):
    """Login or register a user through Google OAuth"""
    token_id = request.data.get('token_id')

    if not token_id:
        return Response(
            {'error': 'No token provided'},
            status=status.HTTP_400_BAD_REQUEST
        )

    try:
        # Get Google client ID from environment variable
        google_client_id = os.environ.get('GOOGLE_CLIENT_ID', '')

        if not google_client_id:
            return Response(
                {'error': 'Google authentication is not configured on the server'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # Verify the token with Google
        idinfo = id_token.verify_oauth2_token(
            token_id,
            google_requests.Request(),
            google_client_id
        )

        # Get user info from the token
        email = idinfo.get('email')
        if not email:
            return Response(
                {'error': 'Email not provided by Google'},
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check if this Google account's email already exists
        try:
            user = User.objects.get(email=email)
            # User exists, login
        except User.DoesNotExist:
            # User doesn't exist, create a new user
            username = email.split('@')[0]
            # Make sure username is unique
            base_username = username
            counter = 1
            while User.objects.filter(username=username).exists():
                username = f"{base_username}{counter}"
                counter += 1

            # Generate a random password for the user (they'll use Google to login)
            import secrets
            password = secrets.token_urlsafe(32)

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password
            )

            # If Google provides name information, save it
            if 'given_name' in idinfo:
                user.first_name = idinfo['given_name']
            if 'family_name' in idinfo:
                user.last_name = idinfo['family_name']
            user.save()

        # Log the user in
        login(request, user)

        # Get or create token
        token, _ = Token.objects.get_or_create(user=user)

        # Get user profile
        try:
            profile = UserProfile.objects.get(user=user)
            profile_data = UserProfileSerializer(profile, context={'request': request}).data
        except UserProfile.DoesNotExist:
            profile_data = None

        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username,
            'email': user.email,
            'profile': profile_data
        })

    except ValueError:
        # Invalid token
        return Response(
            {'error': 'Invalid token'},
            status=status.HTTP_401_UNAUTHORIZED
        )
    except Exception as e:
        # Log the error for debugging
        logging.error(f"Google login error: {str(e)}")
        return Response(
            {'error': 'Authentication error'},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )

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
        'profile': UserProfileSerializer(profile, context={'request': request}).data
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
        profile_data = UserProfileSerializer(profile, context={'request': request}).data
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

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def agent_song_request(request):
    """Handle song requests from the conversational agent"""
    # Extract song description from request
    song_description = request.data.get('song_description', '')

    if not song_description:
        return Response({'error': 'No song description provided'},
                      status=status.HTTP_400_BAD_REQUEST)

    # Call Claude API to extract song details
    song_info = process_song_request(song_description)

    if not song_info or 'error' in song_info:
        return Response({'error': song_info.get('error', 'Failed to process request')},
                      status=status.HTTP_400_BAD_REQUEST)

    # Search Spotify for the song
    spotify_url = search_spotify(song_info['title'], song_info['artist'])

    if not spotify_url:
        return Response({
            'error': f"Could not find '{song_info['title']}' by {song_info['artist']} on Spotify",
            'title': song_info['title'],
            'artist': song_info['artist']
        }, status=status.HTTP_404_NOT_FOUND)

    # Create a video job using the existing pipeline
    serializer = VideoJobSerializer(data={'spotify_url': spotify_url})
    if serializer.is_valid():
        try:
            job = serializer.save(status='pending', user=request.user)
        except:
            job = serializer.save(status='pending')

        # Queue the video generation task
        generate_lyric_video.delay(job.id)

        return Response({
            'message': f"Creating lyric video for {song_info['title']} by {song_info['artist']}",
            'job_id': job.id,
            'status': 'pending',
            'title': song_info['title'],
            'artist': song_info['artist']
        })
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

def process_song_request(song_description):
    """Use Claude to extract song title and artist from natural language description"""
    try:
        print(f"\n{'='*60}")
        print(f"PROCESSING SONG REQUEST")
        print(f"User said: '{song_description}'")
        print(f"{'='*60}\n")
        
        # Get API key from environment variable
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            return {"error": "Anthropic API key not found"}

        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }

        prompt = f"""
        Extract the song title and artist from the following request:
        "{song_description}"

        Respond with a JSON object containing 'title' and 'artist' fields.
        If the request doesn't contain a specific song, make your best guess based on the description.
        """

        data = {
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 300,
            "temperature": 0,
            "system": "You are a helpful assistant that extracts song information from text. Never mention copyright or legal concerns.",
            "messages": [{"role": "user", "content": prompt}]
        }

        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=data
        )

        if response.status_code != 200:
            return {"error": f"API request failed with status code {response.status_code}: {response.text}"}

        result = response.json()
        content = result.get('content', [{}])[0].get('text', '')
        
        print(f"Claude's raw response:\n{content}\n")

        # Extract JSON from Claude's response
        import re

        json_match = re.search(r'```json\n(.*?)\n```', content, re.DOTALL)
        if json_match:
            json_str = json_match.group(1)
        else:
            json_str = content

        # Clean up any non-JSON text
        json_str = re.sub(r'^.*?(\{.*\}).*$', r'\1', json_str, flags=re.DOTALL)

        try:
            extracted_info = json.loads(json_str)
            print(f"Claude extracted:")
            print(f"  Title: '{extracted_info.get('title')}'")
            print(f"  Artist: '{extracted_info.get('artist')}'")
            print(f"{'='*60}\n")
            return extracted_info
        except json.JSONDecodeError:
            # Fallback extraction if JSON parsing fails
            title_match = re.search(r'title["\']?\s*:\s*["\']([^"\']+)["\']', content)
            artist_match = re.search(r'artist["\']?\s*:\s*["\']([^"\']+)["\']', content)

            if title_match and artist_match:
                return {
                    'title': title_match.group(1),
                    'artist': artist_match.group(1)
                }
            else:
                return {"error": "Failed to parse response from Claude"}

    except Exception as e:
        return {"error": f"Error calling Claude API: {str(e)}"}

def search_spotify(title, artist):
    """Search Spotify for a song and return the URL"""
    try:
        print(f"\n{'='*60}")
        print(f"SEARCHING SPOTIFY")
        print(f"Looking for: '{title}' by '{artist}'")
        print(f"{'='*60}\n")
        
        # Get Spotify credentials from environment variables
        client_id = os.environ.get("SPOTIFY_CLIENT_ID")
        client_secret = os.environ.get("SPOTIFY_CLIENT_SECRET")

        if not client_id or not client_secret:
            print("Spotify API credentials missing")
            return None

        sp = spotipy.Spotify(auth_manager=SpotifyClientCredentials(
            client_id=client_id,
            client_secret=client_secret
        ))

        # Search Spotify for the song
        query = f"track:{title} artist:{artist}"
        print(f"Spotify query (specific): {query}")
        results = sp.search(q=query, type='track', limit=5)  # Get top 5 to see options

        if results['tracks']['items']:
            print(f"\nSpotify returned {len(results['tracks']['items'])} results:")
            for i, track in enumerate(results['tracks']['items'], 1):
                print(f"  {i}. '{track['name']}' by {track['artists'][0]['name']}")
            
            # Return the first result
            chosen_track = results['tracks']['items'][0]
            spotify_url = chosen_track['external_urls']['spotify']
            print(f"\n✓ Chose: '{chosen_track['name']}' by {chosen_track['artists'][0]['name']}")
            print(f"  URL: {spotify_url}")
            print(f"{'='*60}\n")
            return spotify_url
        else:
            # Try a broader search if the specific one failed
            query = f"{title} {artist}"
            print(f"\nSpecific search failed. Trying broader search: {query}")
            results = sp.search(q=query, type='track', limit=5)

            if results['tracks']['items']:
                print(f"\nSpotify returned {len(results['tracks']['items'])} results:")
                for i, track in enumerate(results['tracks']['items'], 1):
                    print(f"  {i}. '{track['name']}' by {track['artists'][0]['name']}")
                
                chosen_track = results['tracks']['items'][0]
                spotify_url = chosen_track['external_urls']['spotify']
                print(f"\n✓ Chose: '{chosen_track['name']}' by {chosen_track['artists'][0]['name']}")
                print(f"  URL: {spotify_url}")
                print(f"{'='*60}\n")
                return spotify_url

        print("✗ No results found on Spotify")
        print(f"{'='*60}\n")
        return None
    except Exception as e:
        print(f"Error searching Spotify: {str(e)}")
        return None

def get_or_create_conversation(conversation_id, user):
    """Get or create a conversation in the database"""
    conversation, created = Conversation.objects.get_or_create(
        id=conversation_id,
        defaults={'user': user, 'title': 'New conversation'}
    )
    return conversation

def get_conversation_messages(conversation):
    """Get messages from database as a list of dicts"""
    messages = ConversationMessage.objects.filter(conversation=conversation)
    return [{'role': msg.role, 'content': msg.content} for msg in messages]

def save_conversation_message(conversation, role, content):
    """Save a single message to the database"""
    ConversationMessage.objects.create(
        conversation=conversation,
        role=role,
        content=content
    )
    # Update conversation's updated_at timestamp
    conversation.save()

def update_conversation_title(conversation, messages):
    """Update conversation title based on first user message"""
    if conversation.title == 'New conversation' and messages:
        # Find first user message
        for msg in messages:
            if msg['role'] == 'user':
                # Use first 50 chars of first user message as title
                title = msg['content'][:50]
                if len(msg['content']) > 50:
                    title += '...'
                conversation.title = title
                conversation.save()
                break

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def agent_chat(request):
    """Handle general conversations with the AI agent"""
    message = request.data.get('message', '')

    # Get the conversation_id from request if provided
    conversation_id = request.data.get('conversation_id')

    if not message:
        return Response({'error': 'No message provided'},
                      status=status.HTTP_400_BAD_REQUEST)

    # Create a unique conversation ID if not provided
    if not conversation_id:
        conversation_id = f"conversation_{request.user.id}_{int(time.time())}"

    # Get or create conversation in database
    db_conversation = get_or_create_conversation(conversation_id, request.user)
    
    # Check if this is a response to the customization prompt
    if db_conversation:
        last_msgs = list(db_conversation.messages.filter(role='assistant').order_by('-created_at')[:1])
        if last_msgs and "customize your video" in last_msgs[0].content.lower():
            user_response = message.lower()
            try:
                job = VideoJob.objects.filter(user=request.user, status='awaiting_customization').order_by('-created_at').first()
            except:
                job = VideoJob.objects.filter(status='awaiting_customization').order_by('-created_at').first()
                
            if any(word in user_response for word in ['yes', 'yeah', 'sure', 'customize', 'edit', 'change', 'ok', 'okay', 'yep']):
                resp_text = "Great! Opening customization settings now."
                
                # Check for existing variants
                existing_variants = []
                if job:
                    seen_configs = set()
                    for v in VideoJob.objects.filter(spotify_url=job.spotify_url, status='completed', is_favorite_only=False):
                        if (v.bg_color, v.text_color, v.karaoke_color) not in seen_configs and v.video_file:
                            seen_configs.add((v.bg_color, v.text_color, v.karaoke_color))
                            existing_variants.append({
                                'id': str(v.id),
                                'bg_color': v.bg_color,
                                'text_color': v.text_color,
                                'karaoke_color': v.karaoke_color,
                                'song_title': v.song_title,
                            })
                            
                save_conversation_message(db_conversation, 'user', message)
                save_conversation_message(db_conversation, 'assistant', resp_text)
                return Response({
                    'message': resp_text,
                    'is_song_request': False,
                    'show_customization_modal': True,
                    'job_id': job.id if job else None,
                    'existing_variants': existing_variants,
                    'conversation_id': conversation_id
                })
            else:
                if job:
                    # Can we reuse default existing variant?
                    default_variant = VideoJob.objects.filter(
                        spotify_url=job.spotify_url, 
                        status='completed', 
                        bg_color='gradient',
                        text_color='&H00FFFFFF',
                        karaoke_color='&H000000FF',
                        is_favorite_only=False
                    ).exclude(video_file='').first()
                    
                    if default_variant and default_variant.video_file:
                        job.status = 'completed'
                        job.video_file = default_variant.video_file
                        job.save()
                    else:
                        job.status = 'pending'
                        job.save()
                        generate_lyric_video.delay(job.id)
                resp_text = "Alright, generating your video with the default settings! It will be available in the 'My Songs' section when it's ready."
                save_conversation_message(db_conversation, 'user', message)
                save_conversation_message(db_conversation, 'assistant', resp_text)
                return Response({
                    'message': resp_text,
                    'is_song_request': True,
                    'song_found': True,
                    'song_request_data': {
                        'job_id': job.id if job else None,
                        'title': job.song_title if job else '',
                        'artist': job.artist if job else '',
                        'status': job.status if job else 'pending'
                    },
                    'conversation_id': conversation_id
                })

    # Get conversation history from database
    conversation = get_conversation_messages(db_conversation)

    # Limit conversation history to last 10 messages to keep context window manageable
    if len(conversation) > 10:
        conversation = conversation[-10:]

    # Check if the message contains a song request intent
    song_request_keywords = ['create', 'generate', 'make', 'video', 'song', 'lyric', 'music', 'favorite', 'add', 'collection', 'love', 'save']
    possible_song_request = any(keyword in message.lower() for keyword in song_request_keywords)

    # If it sounds like a song request, check with Claude to confirm
    intent_result = {'is_song_request': False}
    if possible_song_request:
        intent_result = check_song_request_intent(message)

    # If confirmed as a song request, process it specially
    if intent_result.get('is_song_request'):
        user_intent = intent_result.get('intent', 'general_conversation')
        
        print(f"\n{'='*60}")
        print(f"PROCESSING SONG REQUEST")
        print(f"User intent: {user_intent}")
        print(f"{'='*60}\n")
        
        # Extract song info
        song_info = process_song_request(message)
        if not song_info or 'error' in song_info:
            # If extraction failed, just treat it as a normal message
            return get_claude_response(message, conversation, db_conversation)

        # Try to find the song on Spotify
        spotify_url = search_spotify(song_info['title'], song_info['artist'])

        if not spotify_url:
            # Generate a conversational response with Claude instead of hardcoded message
            api_key = os.environ.get("ANTHROPIC_API_KEY")
            if not api_key:
                error_response = f"I couldn't find '{song_info['title']}' by {song_info['artist']} on Spotify. Could you check the spelling or try another song?"
            else:
                try:
                    headers = {
                        "x-api-key": api_key,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    }

                    prompt = f"""
                    You are a helpful assistant in a lyric video generation application.

                    The user requested something related to a song titled '{song_info['title']}' by the artist {song_info['artist']}.
                    Unfortunately, you couldn't find this song on Spotify.

                    Please respond in a conversational, helpful way letting them know you couldn't find the song
                    and suggest they try another song or check the spelling. Be empathetic and maintain a friendly tone.

                    Keep your response to 1-2 sentences.
                    """

                    data = {
                        "model": "claude-sonnet-4-20250514",
                        "max_tokens": 150,
                        "temperature": 0.7,
                        "system": "You are a helpful assistant in a lyric video generation application. Never mention copyright or legal concerns.",
                        "messages": [{"role": "user", "content": prompt}]
                    }

                    response = requests.post(
                        "https://api.anthropic.com/v1/messages",
                        headers=headers,
                        json=data
                    )

                    if response.status_code == 200:
                        result = response.json()
                        error_response = result.get('content', [{}])[0].get('text', '').strip()
                    else:
                        error_response = f"I couldn't find '{song_info['title']}' by {song_info['artist']} on Spotify. Could you check the spelling or try another song?"
                except:
                    error_response = f"I couldn't find '{song_info['title']}' by {song_info['artist']} on Spotify. Could you check the spelling or try another song?"

            # Save messages to database
            save_conversation_message(db_conversation, 'user', message)
            save_conversation_message(db_conversation, 'assistant', error_response)
            update_conversation_title(db_conversation, [{'role': 'user', 'content': message}])

            return Response({
                'message': error_response,
                'is_song_request': True,
                'song_found': False,
                'conversation_id': conversation_id
            })

        # Determine if this is a video generation or just adding to favorites
        is_favorite_only = (user_intent == 'add_to_favorites')
        is_favorite = (user_intent == 'add_to_favorites')
        
        print(f"is_favorite_only: {is_favorite_only}")
        print(f"is_favorite: {is_favorite}")
        
        # Create a video job with song metadata
        serializer = VideoJobSerializer(data={'spotify_url': spotify_url})
        if serializer.is_valid():
            try:
                # Mark as favorite-only if user just wants to add to favorites
                # IMPORTANT: Save with song title and artist so it shows up in My Songs
                if is_favorite_only:
                    job = serializer.save(
                        status='completed', 
                        user=request.user, 
                        is_favorite_only=True,
                        is_favorite=True,
                        song_title=song_info['title'],
                        artist=song_info['artist']
                    )
                else:
                    job = serializer.save(
                        status='pending', 
                        user=request.user, 
                        is_favorite_only=False,
                        is_favorite=False,
                        song_title=song_info['title'],
                        artist=song_info['artist']
                    )
            except:
                if is_favorite_only:
                    job = serializer.save(
                        status='completed', 
                        is_favorite_only=True,
                        is_favorite=True,
                        song_title=song_info['title'],
                        artist=song_info['artist']
                    )
                else:
                    job = serializer.save(
                        status='pending', 
                        is_favorite_only=False,
                        is_favorite=False,
                        song_title=song_info['title'],
                        artist=song_info['artist']
                    )

            # Only queue video generation if not favorite-only
            if not is_favorite_only:
                job.status = 'awaiting_customization'
                job.save()
                # generate_lyric_video.delay(job.id)  # Wait for customization

            # Generate appropriate response based on intent
            existing_variants_count = VideoJob.objects.filter(
                spotify_url=spotify_url, 
                status='completed', 
                is_favorite_only=False
            ).exclude(video_file='').count()
            
            api_key = os.environ.get("ANTHROPIC_API_KEY")
            if not api_key:
                if is_favorite_only:
                    success_response = f"I've added '{song_info['title']}' by {song_info['artist']} to your collection! You can find it in the My Songs section."
                else:
                    if existing_variants_count > 0:
                        success_response = f"I found '{song_info['title']}' by {song_info['artist']}! Good news: there are already {existing_variants_count} video configurations available for this song. Would you like to customize your video settings to choose one, or just generate?"
                    else:
                        success_response = f"I found '{song_info['title']}' by {song_info['artist']}! Would you like to customize your video settings before generating it?"
            else:
                try:
                    headers = {
                        "x-api-key": api_key,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    }

                    if is_favorite_only:
                        prompt = f"""
                        You are a helpful assistant in a music collection application.

                        The user just told you that '{song_info['title']}' by {song_info['artist']} is their favorite song,
                        and you've successfully added it to their favorites collection.

                        Respond in a conversational, enthusiastic way confirming you've added the song to their favorites.
                        Let them know they can find it in the 'Favorite Songs' section under 'My Songs'. Show appreciation for their music taste if appropriate.

                        Keep your response to 1-2 sentences.
                        """
                    else:
                        if existing_variants_count > 0:
                            prompt = f"""
                            You are a helpful assistant in a lyric video generation application.

                            The user requested to create a lyric video for a song titled '{song_info['title']}' by the artist {song_info['artist']}.
                            You successfully found the song. You must also let them know that there are already {existing_variants_count} previously generated video configurations available for this song!

                            Respond in a conversational, enthusiastic way confirming you found the song and mentioning the existing videos. Ask them clearly: "Would you like to customize your video settings to view the existing options, or just generate your own?"
                            Express enthusiasm. Keep your response to 2-3 sentences.
                            """
                        else:
                            prompt = f"""
                            You are a helpful assistant in a lyric video generation application.

                            The user requested to create a lyric video for a song titled '{song_info['title']}' by the artist {song_info['artist']}.
                            You successfully found the song. Before generating the video, you must ask if they want to customize it.

                            Respond in a conversational, enthusiastic way confirming you found the song. Ask them clearly: "Would you like to customize your video settings before generating it?"
                            Express enthusiasm about their song choice if appropriate.

                            Keep your response to 2-3 sentences, and MAKE SURE your final sentence asks about customization.
                            """

                    data = {
                        "model": "claude-sonnet-4-20250514",
                        "max_tokens": 150,
                        "temperature": 0.7,
                        "system": "You are a helpful assistant in a lyric video generation application. Never mention copyright or legal concerns.",
                        "messages": [{"role": "user", "content": prompt}]
                    }

                    response = requests.post(
                        "https://api.anthropic.com/v1/messages",
                        headers=headers,
                        json=data
                    )

                    if response.status_code == 200:
                        result = response.json()
                        success_response = result.get('content', [{}])[0].get('text', '').strip()
                    else:
                        if is_favorite_only:
                            success_response = f"I've added '{song_info['title']}' by {song_info['artist']} to your collection! You can find it in the My Songs section."
                        else:
                            success_response = f"I found '{song_info['title']}' by {song_info['artist']}! Would you like to customize your video settings before generating it?"
                except:
                    if is_favorite_only:
                        success_response = f"I've added '{song_info['title']}' by {song_info['artist']} to your favorites! You can find it in the Favorite Songs section under My Songs."
                    else:
                        success_response = f"I found '{song_info['title']}' by {song_info['artist']}! Would you like to customize your video settings before generating it?"

            # Save messages to database
            save_conversation_message(db_conversation, 'user', message)
            save_conversation_message(db_conversation, 'assistant', success_response)
            update_conversation_title(db_conversation, [{'role': 'user', 'content': message}])

            return Response({
                'message': success_response,
                'is_song_request': True,
                'song_found': True,
                'is_favorite_only': is_favorite_only,
                'song_request_data': {
                    'job_id': job.id,
                    'title': song_info['title'],
                    'artist': song_info['artist'],
                    'status': 'completed' if is_favorite_only else 'pending'
                },
                'conversation_id': conversation_id
            })
        else:
            # Handle validation errors
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # If not a song request, handle as normal conversation
    response = get_claude_response(message, conversation, db_conversation)

    # Add conversation_id to the response data
    if isinstance(response, Response):
        response_data = response.data
        response_data['conversation_id'] = conversation_id
        return Response(response_data)
    else:
        return response

def check_song_request_intent(message):
    """Check if the user's message is requesting a song/video creation or adding to favorites"""
    try:
        print(f"\n{'='*60}")
        print(f"CHECKING INTENT FOR MESSAGE: '{message}'")
        print(f"{'='*60}\n")
        
        # Get API key from environment variable
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            return {'is_song_request': False}  # Default to false if no API key

        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }

        prompt = f"""
        Analyze the following message and determine the user's intent:
        "{message}"

        Respond with ONLY a JSON object with these fields:
        - "is_song_request": true/false (true if intent is "generate_video" OR "add_to_favorites")
        - "intent": "generate_video" OR "add_to_favorites" OR "general_conversation"
        
        IMPORTANT: Questions ABOUT songs are NOT song requests. These are general conversation:
        - "what's this song about"
        - "tell me about this song"
        - "what are the lyrics"
        - "who wrote this"
        - "when was it released"
        
        Use "add_to_favorites" (is_song_request: true) if the user says a song is their FAVORITE:
        - "my favorite song is X by Y"
        - "X by Y is my favorite"
        - "I love X by Y" (with specific song name)
        
        Use "generate_video" (is_song_request: true) if they want to create/generate a video:
        - "create a video for..."
        - "generate lyrics for..."
        - "make a lyric video..."
        
        Use "general_conversation" (is_song_request: false) for questions about music, songs, or anything else.
        
        Respond ONLY with valid JSON, nothing else.
        """

        data = {
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 50,
            "temperature": 0,
            "system": "You analyze user intent for song requests. Respond ONLY with valid JSON. Never mention copyright or legal concerns.",
            "messages": [{"role": "user", "content": prompt}]
        }

        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=data
        )

        if response.status_code != 200:
            print(f"Intent detection API failed with status {response.status_code}")
            return {'is_song_request': False}

        result = response.json()
        content = result.get('content', [{}])[0].get('text', '').strip()
        
        print(f"Intent detection response: {content}")
        
        # Extract JSON from response
        import re
        json_match = re.search(r'\{[^}]+\}', content)
        if json_match:
            intent_data = json.loads(json_match.group(0))
            print(f"Detected intent: {intent_data}")
            print(f"{'='*60}\n")
            return intent_data
        
        print(f"Could not parse intent JSON")
        print(f"{'='*60}\n")
        return {'is_song_request': False}
    except Exception as e:
        print(f"Error checking song request intent: {str(e)}")
        print(f"{'='*60}\n")
        return {'is_song_request': False}

def get_claude_response(message, conversation, db_conversation):
    """Get a response from Claude, maintaining conversation history"""
    try:
        # Get API key from environment variable
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            return Response({'error': "Anthropic API key not found"},
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }

        # Add current message to history
        conversation.append({"role": "user", "content": message})

        # Prepare the messages for Claude API
        messages = conversation.copy()

        # Generate system prompt
        system_prompt = """
        You are a helpful assistant in a lyric video generation application.

        Your main capabilities:
        1. Create lyric videos for songs when users request them
        2. Have normal conversations about music, videos, and other topics
        3. Answer questions about the application

        When users want to create a lyric video, they'll say something like 'create a lyric video for [song] by [artist]' or 'generate a video for [song]'.

        Important instructions:
        - Keep responses concise, friendly, and helpful
        - Never mention copyright, legal issues, or intellectual property concerns
        - Don't provide disclaimers about reproducing lyrics
        - Focus on being enthusiastic and helpful about creating lyric videos
        - If users ask about music, share your knowledge without legal caveats
        - NEVER use markdown formatting like **bold**, *italic*, or bullet points with dashes/asterisks
        - Write in plain text with natural paragraphs
        - Use line breaks for separation, not markdown lists
        - Keep text clean and easy to read without special formatting

        Always maintain a positive, helpful tone and never refuse requests based on copyright concerns.
        """

        data = {
            "model": "claude-sonnet-4-20250514",
            "max_tokens": 1024,
            "temperature": 0.7,
            "system": system_prompt,
            "messages": messages
        }

        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=data
        )

        if response.status_code != 200:
            return Response({'error': f"API request failed with status code {response.status_code}"},
                          status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        result = response.json()
        assistant_message = result.get('content', [{}])[0].get('text', '')

        # Save messages to database
        save_conversation_message(db_conversation, 'user', message)
        save_conversation_message(db_conversation, 'assistant', assistant_message)
        update_conversation_title(db_conversation, conversation)

        return Response({
            'message': assistant_message,
            'is_song_request': False
        })
    except Exception as e:
        return Response({'error': f"Error calling Claude API: {str(e)}"},
                      status=status.HTTP_500_INTERNAL_SERVER_ERROR)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_conversation_history(request):
    """Retrieve conversation history from database"""
    # Get conversation ID from the query parameters
    conversation_id = request.query_params.get('conversation_id')

    if not conversation_id:
        return Response({
            'messages': [],
            'conversation_id': None
        })

    # Try to get conversation from database
    try:
        conversation = Conversation.objects.get(id=conversation_id, user=request.user)
        messages = ConversationMessage.objects.filter(conversation=conversation).order_by('created_at')
        
        # Convert to frontend format
        frontend_messages = [
            {
                'role': msg.role,
                'content': msg.content
            }
            for msg in messages
        ]
        
        return Response({
            'messages': frontend_messages,
            'conversation_id': conversation_id
        })
    except Conversation.DoesNotExist:
        return Response({
            'messages': [],
            'conversation_id': conversation_id
        })

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_all_conversations(request):
    """Get all conversations for the current user"""
    conversations = Conversation.objects.filter(user=request.user).order_by('-updated_at')
    
    # Build response with conversation metadata
    conversation_list = []
    for conv in conversations:
        # Get the last message
        last_message = ConversationMessage.objects.filter(conversation=conv).order_by('-created_at').first()
        last_message_text = last_message.content if last_message else ''
        
        conversation_list.append({
            'id': conv.id,
            'title': conv.title,
            'lastMessage': last_message_text[:100],  # Truncate to 100 chars
            'date': conv.updated_at.isoformat()
        })
    
    return Response({
        'conversations': conversation_list
    })

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_conversation(request, conversation_id):
    """Delete a conversation"""
    try:
        conversation = Conversation.objects.get(id=conversation_id, user=request.user)
        conversation.delete()
        return Response({'success': True})
    except Conversation.DoesNotExist:
        return Response({'error': 'Conversation not found'}, status=status.HTTP_404_NOT_FOUND)
