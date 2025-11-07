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
            "model": "claude-3-7-sonnet-20250219",
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
            return json.loads(json_str)
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
        results = sp.search(q=query, type='track', limit=1)

        if results['tracks']['items']:
            # Return the Spotify URL
            return results['tracks']['items'][0]['external_urls']['spotify']
        else:
            # Try a broader search if the specific one failed
            query = f"{title} {artist}"
            results = sp.search(q=query, type='track', limit=1)

            if results['tracks']['items']:
                return results['tracks']['items'][0]['external_urls']['spotify']

        return None
    except Exception as e:
        print(f"Error searching Spotify: {str(e)}")
        return None

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

    # Get conversation history from cache
    conversation = cache.get(conversation_id) or []

    # Limit conversation history to last 10 messages to keep context window manageable
    if len(conversation) > 10:
        conversation = conversation[-10:]

    # Check if the message contains a song request intent
    song_request_keywords = ['create', 'generate', 'make', 'video', 'song', 'lyric', 'music']
    possible_song_request = any(keyword in message.lower() for keyword in song_request_keywords)

    # If it sounds like a song request, check with Claude to confirm
    is_song_request = False
    if possible_song_request:
        is_song_request = check_song_request_intent(message)

    # If confirmed as a song request, process it specially
    if is_song_request:
        # Extract song info
        song_info = process_song_request(message)
        if not song_info or 'error' in song_info:
            # If extraction failed, just treat it as a normal message
            return get_claude_response(message, conversation, request.user.id)

        # Try to find the song on Spotify
        spotify_url = search_spotify(song_info['title'], song_info['artist'])

        if not spotify_url:
            # Add this exchange to conversation history
            conversation.append({"role": "user", "content": message})

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

                    The user requested to create a lyric video for a song titled '{song_info['title']}' by the artist {song_info['artist']}.
                    Unfortunately, you couldn't find this song on Spotify.

                    Please respond in a conversational, helpful way letting them know you couldn't find the song
                    and suggest they try another song or check the spelling. Be empathetic and maintain a friendly tone.

                    Keep your response to 1-2 sentences.
                    """

                    data = {
                        "model": "claude-3-7-sonnet-20250219",
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

            # Add the response to conversation history
            conversation.append({"role": "assistant", "content": error_response})

            # Save updated conversation
            cache.set(conversation_id, conversation, 86400)  # 24 hour expiry

            return Response({
                'message': error_response,
                'is_song_request': True,
                'song_found': False,
                'conversation_id': conversation_id
            })

        # Create a video job
        serializer = VideoJobSerializer(data={'spotify_url': spotify_url})
        if serializer.is_valid():
            try:
                job = serializer.save(status='pending', user=request.user)
            except:
                job = serializer.save(status='pending')

            # Queue the video generation task
            generate_lyric_video.delay(job.id)

            # Generate a conversational response with Claude instead of hardcoded message
            api_key = os.environ.get("ANTHROPIC_API_KEY")
            if not api_key:
                success_response = f"I'm creating a lyric video for '{song_info['title']}' by {song_info['artist']}. You'll be able to view it in the My Songs section when it's ready."
            else:
                try:
                    headers = {
                        "x-api-key": api_key,
                        "Content-Type": "application/json",
                        "anthropic-version": "2023-06-01"
                    }

                    prompt = f"""
                    You are a helpful assistant in a lyric video generation application.

                    The user requested to create a lyric video for a song titled '{song_info['title']}' by the artist {song_info['artist']}.
                    You successfully found the song and are now generating a video for it. This will take a few minutes to process.

                    Respond in a conversational, enthusiastic way confirming you're creating the video. Let them know that the video
                    will be available in the 'My Songs' section when it's ready. Express enthusiasm about their song choice if appropriate.

                    Keep your response to 2-3 sentences.
                    """

                    data = {
                        "model": "claude-3-7-sonnet-20250219",
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
                        success_response = f"I'm creating a lyric video for '{song_info['title']}' by {song_info['artist']}. You'll be able to view it in the My Songs section when it's ready."
                except:
                    success_response = f"I'm creating a lyric video for '{song_info['title']}' by {song_info['artist']}. You'll be able to view it in the My Songs section when it's ready."

            # Add this exchange to conversation history
            conversation.append({"role": "user", "content": message})
            conversation.append({"role": "assistant", "content": success_response})

            # Save updated conversation
            cache.set(conversation_id, conversation, 86400)  # 24 hour expiry

            return Response({
                'message': success_response,
                'is_song_request': True,
                'song_found': True,
                'song_request_data': {
                    'job_id': job.id,
                    'title': song_info['title'],
                    'artist': song_info['artist'],
                    'status': 'pending'
                },
                'conversation_id': conversation_id
            })
        else:
            # Handle validation errors
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # If not a song request, handle as normal conversation
    response = get_claude_response(message, conversation, conversation_id)

    # Add conversation_id to the response data
    if isinstance(response, Response):
        response_data = response.data
        response_data['conversation_id'] = conversation_id
        return Response(response_data)
    else:
        return response

def check_song_request_intent(message):
    """Check if the user's message is requesting a song/video creation"""
    try:
        # Get API key from environment variable
        api_key = os.environ.get("ANTHROPIC_API_KEY")
        if not api_key:
            return False  # Default to false if no API key

        headers = {
            "x-api-key": api_key,
            "Content-Type": "application/json",
            "anthropic-version": "2023-06-01"
        }

        prompt = f"""
        Analyze if the following message is requesting to create or generate a video or song:
        "{message}"

        Answer with only "yes" or "no".
        """

        data = {
            "model": "claude-3-7-sonnet-20250219",
            "max_tokens": 10,
            "temperature": 0,
            "system": "You analyze if messages contain requests to create or generate videos or songs. Never mention copyright or legal concerns.",
            "messages": [{"role": "user", "content": prompt}]
        }

        response = requests.post(
            "https://api.anthropic.com/v1/messages",
            headers=headers,
            json=data
        )

        if response.status_code != 200:
            return False

        result = response.json()
        content = result.get('content', [{}])[0].get('text', '').strip().lower()

        return 'yes' in content
    except Exception as e:
        print(f"Error checking song request intent: {str(e)}")
        return False

def get_claude_response(message, conversation, conversation_id):
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

        Always maintain a positive, helpful tone and never refuse requests based on copyright concerns.
        """

        data = {
            "model": "claude-3-7-sonnet-20250219",
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

        # Add assistant's response to conversation history
        conversation.append({"role": "assistant", "content": assistant_message})

        # Save updated conversation
        cache.set(conversation_id, conversation, 86400)  # 24 hour expiry

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
    """Retrieve conversation history from cache"""
    # Get conversation ID from the query parameters
    conversation_id = request.query_params.get('conversation_id')

    # If no conversation_id provided, use user ID to construct it
    if not conversation_id:
        conversation_id = f"conversation_{request.user.id}"

    # Retrieve conversation from cache
    conversation = cache.get(conversation_id) or []

    # Convert the conversation to a format suitable for the frontend
    frontend_messages = []
    for message in conversation:
        role = message.get('role')
        content = message.get('content', '')

        if role and content:
            frontend_messages.append({
                'role': role,
                'content': content
            })

    return Response({
        'messages': frontend_messages,
        'conversation_id': conversation_id
    })
