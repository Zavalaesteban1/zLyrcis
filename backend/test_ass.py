from api.tasks import create_animated_subtitles
import json

song_info = {"title": "Test Title", "artist": "Test Artist"}
synced_lyrics = [
    {"text": "Hello world", "start_time": 1.0, "end_time": 3.0, "duration": 2.0, "words": []}
]
create_animated_subtitles(synced_lyrics, song_info, "test_out.ass")
with open("test_out.ass", "r") as f:
    print(f.read())
