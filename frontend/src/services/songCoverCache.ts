const cacheKey = (title: string, artist: string) =>
  `song_cover_${title.trim().toLowerCase()}||${artist.trim().toLowerCase()}`;

export function primeSongCoverCache(title: string, artist: string, albumUrl: string | null): void {
  if (!albumUrl) return;
  try {
    localStorage.setItem(cacheKey(title, artist), albumUrl);
  } catch {
    /* ignore quota */
  }
}

export function getSongCoverFromCache(title: string, artist: string): string | null {
  try {
    return localStorage.getItem(cacheKey(title, artist));
  } catch {
    return null;
  }
}
