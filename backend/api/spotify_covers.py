import os
import re
from typing import Optional

import spotipy
from spotipy.oauth2 import SpotifyClientCredentials


def extract_spotify_track_id(spotify_url: str) -> Optional[str]:
    if not spotify_url:
        return None
    match = re.search(r'track/([a-zA-Z0-9]+)', spotify_url)
    if match:
        return match.group(1)
    match = re.search(r'spotify:track:([a-zA-Z0-9]+)', spotify_url)
    return match.group(1) if match else None


def _get_spotify_client():
    client_id = os.environ.get('SPOTIFY_CLIENT_ID')
    client_secret = os.environ.get('SPOTIFY_CLIENT_SECRET')
    if not client_id or not client_secret:
        return None
    return spotipy.Spotify(
        auth_manager=SpotifyClientCredentials(
            client_id=client_id,
            client_secret=client_secret,
        )
    )


def parse_lyric_video_message(content: str) -> Optional[tuple]:
    """Extract (title, artist) from persisted lyric-video user messages."""
    text = (content or '').strip()
    match = re.match(r'^Lyric video:\s*"([^"]+)"\s+by\s+(.+)$', text, re.I)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    match = re.match(r"^Lyric video:\s*'([^']+)'\s+by\s+(.+)$", text, re.I)
    if match:
        return match.group(1).strip(), match.group(2).strip()
    return None


def fetch_album_cover_url(spotify_url: str) -> Optional[str]:
    """Fetch album cover URL for a Spotify track URL. Returns None on failure."""
    track_id = extract_spotify_track_id(spotify_url)
    if not track_id:
        return None

    sp = _get_spotify_client()
    if not sp:
        return None

    try:
        track = sp.track(track_id)
        images = track.get('album', {}).get('images') or []
        return images[0]['url'] if images else None
    except Exception:
        return None


def backfill_missing_album_covers(jobs, limit: int = 5) -> None:
    """Fill album_cover for jobs missing it, up to `limit` per call (rate-limit safe)."""
    pending = [job for job in jobs if not job.album_cover and job.spotify_url][:limit]
    for job in pending:
        cover = fetch_album_cover_url(job.spotify_url)
        if not cover:
            continue
        job.album_cover = cover
        job.save(update_fields=['album_cover'])
