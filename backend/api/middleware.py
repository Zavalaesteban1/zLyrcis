import os
import mimetypes
import json

class ContentTypeMiddleware:
    """
    Middleware to ensure proper Content-Type headers for media files,
    especially for video files.
    """
    
    def __init__(self, get_response):
        self.get_response = get_response
        
    def __call__(self, request):
        response = self.get_response(request)
        
        # Check if this is a media file request
        if request.path.startswith('/media/videos/'):
            file_path = request.path
            file_ext = os.path.splitext(file_path)[1].lower()
            
            # Set appropriate Content-Type for video files
            if file_ext == '.mp4':
                response['Content-Type'] = 'video/mp4'
                print(f"DEBUG: Setting Content-Type to video/mp4 for {file_path}")
            elif file_ext == '.webm':
                response['Content-Type'] = 'video/webm'
            elif file_ext == '.ogg':
                response['Content-Type'] = 'video/ogg'
            elif file_ext == '.mp3':
                response['Content-Type'] = 'audio/mpeg'
                response['X-Content-Type-Debug'] = 'Set by middleware: audio/mpeg'
            elif file_ext == '.wav':
                response['Content-Type'] = 'audio/wav'
            elif file_ext == '.jpg' or file_ext == '.jpeg':
                response['Content-Type'] = 'image/jpeg'
            elif file_ext == '.png':
                response['Content-Type'] = 'image/png'
            
            # Add Cache-Control header to prevent caching issues
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            
            # Add CORS headers for all media files
            response['Access-Control-Allow-Origin'] = '*'
            response['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
            response['Access-Control-Allow-Headers'] = 'Content-Type, Accept, X-Requested-With, Range'
            
            # Debug headers if in development
            try:
                # Use the Django settings to check debug mode
                from django.conf import settings
                if settings.DEBUG:
                    # Log some debug info
                    print(f"DEBUG: Media file request: {file_path}")
                    print(f"DEBUG: Content-Type: {response.get('Content-Type', 'Not Set')}")
                    print(f"DEBUG: Response headers: {json.dumps({k: v for k, v in response.items()})}")
            except ImportError:
                pass
            
        return response 