import { parseLyricVideoPickFromTranscript, formatSongPickPreview } from './api';
import { getSongCoverFromCache } from './songCoverCache';

export type HydratedSongPick = {
  title: string;
  artist: string;
  albumCover: string | null;
};

/** Build songPick from raw user transcript (API/localStorage) and attach cached cover if any. */
export function hydrateSongPickFromUserContent(text: string): HydratedSongPick | null {
  const parsed = parseLyricVideoPickFromTranscript(text);
  if (!parsed) return null;
  return {
    title: parsed.title,
    artist: parsed.artist,
    albumCover: getSongCoverFromCache(parsed.title, parsed.artist)
  };
}

export function fillCachedCover(pick: HydratedSongPick): HydratedSongPick {
  if (pick.albumCover) return pick;
  const url = getSongCoverFromCache(pick.title, pick.artist);
  return url ? { ...pick, albumCover: url } : pick;
}

/** Preview line used when normalizing stored agent strings in the sidebar/transcript. */
export function previewFromHydratedPick(pick: HydratedSongPick): string {
  return formatSongPickPreview(pick);
}

/** Use for chat rendering: song card + cover from cache when transcript only has plain agent text. */
export function resolveUserSongPickForDisplay(message: {
  isUser: boolean;
  text: string;
  songPick?: { title: string; artist: string; albumCover: string | null };
}): HydratedSongPick | null {
  if (!message.isUser) return null;
  if (message.songPick) return fillCachedCover(message.songPick);
  return hydrateSongPickFromUserContent(message.text);
}
