"""
Configuration for special case songs that require specific handling.
"""

SPECIAL_CASES = {
    "time_pink_floyd": {
        "identifiers": [
            {"title": "time", "artist": "pink floyd"},
            {"title": "time", "artist": "floyd"}
        ],
        "vocal_start": 139.0,  # Seconds (2:19)
        "min_duration": 390.0,  # Seconds (6.5 minutes)
        "notes": "Critical special case - vocals start at 2:19"
    },
    "breathe_pink_floyd": {
        "identifiers": [
            {"title": "breathe", "artist": "pink floyd"}
        ],
        "vocal_start": 81.0,  # Seconds (1:21)
        "min_duration": None,  # Use 90% of Spotify's duration
        "notes": "Vocal start at 1:21"
    },
    "generation_larry_june": {
        "identifiers": [
            {"title": "generation", "artist": "larry june"}
        ],
        "vocal_start": 20.5,  # Seconds (0:20.5)
        "min_duration": None,  # Use 90% of Spotify's duration
        "notes": "Vocal start at 0:20.5"
    }
}

def identify_special_case(title, artist):
    """
    Check if a song is a special case based on title and artist.
    
    Args:
        title (str): The song title
        artist (str): The song artist
        
    Returns:
        dict: Special case configuration if found, None otherwise
    """
    title_lower = title.lower()
    artist_lower = artist.lower()
    
    for case_id, config in SPECIAL_CASES.items():
        for identifier in config["identifiers"]:
            if (identifier["title"] in title_lower and 
                identifier["artist"] in artist_lower):
                return config
    
    return None
