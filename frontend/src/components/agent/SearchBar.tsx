import React, { useCallback, useEffect, useRef, useState } from 'react';
import { MdSearch, MdArrowBack, MdMusicNote } from 'react-icons/md';
import { searchSongs, SongSuggestion } from '../../services/api';
import * as Styles from '../../styles/AgentPageStyles';

const DEBOUNCE_MS = 500;

export type SearchBarVariant = 'page' | 'modal';

interface SearchBarCoreProps {
  variant: SearchBarVariant;
  onSelect: (song: SongSuggestion) => void;
  autoFocus?: boolean;
}

/**
 * Debounced remote search, dropdown (page) or scrollable panel (modal).
 * variant="page" on narrow viewports: floating FAB opens full-screen sheet with the same search UI.
 */
const SearchBarCore: React.FC<SearchBarCoreProps> = ({ variant, onSelect, autoFocus }) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [results, setResults] = useState<SongSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [panelOpen, setPanelOpen] = useState(true);

  const isModalLayout = variant === 'modal';

  useEffect(() => {
    const t = window.setTimeout(() => setDebouncedQuery(query), DEBOUNCE_MS);
    return () => window.clearTimeout(t);
  }, [query]);

  useEffect(() => {
    const q = debouncedQuery.trim();
    if (!q) {
      setResults([]);
      setIsSearching(false);
      setFetchError(null);
      return;
    }

    let cancelled = false;
    setIsSearching(true);
    setFetchError(null);

    searchSongs(q)
      .then((rows) => {
        if (!cancelled) setResults(rows);
      })
      .catch((err) => {
        if (!cancelled) {
          setResults([]);
          setFetchError(err instanceof Error ? err.message : 'Search failed');
        }
      })
      .finally(() => {
        if (!cancelled) setIsSearching(false);
      });

    return () => {
      cancelled = true;
    };
  }, [debouncedQuery]);

  useEffect(() => {
    if (!query.trim()) {
      setPanelOpen(false);
      setResults([]);
    } else {
      setPanelOpen(true);
    }
  }, [query]);

  useEffect(() => {
    if (isModalLayout || !panelOpen || !query.trim()) return;
    const onDown = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setPanelOpen(false);
      }
    };
    document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isModalLayout, panelOpen, query]);

  useEffect(() => {
    if (autoFocus) {
      const id = window.requestAnimationFrame(() => inputRef.current?.focus());
      return () => cancelAnimationFrame(id);
    }
  }, [autoFocus]);

  const onChangeQuery = useCallback((v: string) => {
    setQuery(v);
    if (v.trim()) setPanelOpen(true);
  }, []);

  const showPanel = Boolean(query.trim()) && panelOpen;
  const trimmed = query.trim();

  const inner = (
    <>
      <Styles.SearchBarInputRow>
        <Styles.SearchBarField
          ref={inputRef}
          type="text"
          inputMode="search"
          value={query}
          placeholder="Search by song or artist…"
          onChange={(e) => onChangeQuery(e.target.value)}
          autoComplete="off"
          enterKeyHint="search"
        />
      </Styles.SearchBarInputRow>

      <Styles.SearchBarResultsPanel $open={showPanel} $modal={isModalLayout}>
        {isSearching ? (
          <Styles.SearchBarStateRow>
            <Styles.SearchSpinner />
            <span>Searching…</span>
          </Styles.SearchBarStateRow>
        ) : fetchError ? (
          <Styles.SearchBarStateRow>{fetchError}</Styles.SearchBarStateRow>
        ) : results.length > 0 ? (
          <Styles.SearchBarResultsScroll $modal={isModalLayout}>
            {results.map((song) => (
              <Styles.SearchResultRow
                key={song.id}
                type="button"
                onClick={() => onSelect(song)}
              >
                {song.album_cover ? (
                  <Styles.SearchResultThumb src={song.album_cover} alt="" />
                ) : (
                  <Styles.SearchResultThumbPlaceholder>
                    {MdMusicNote({ size: 22 })}
                  </Styles.SearchResultThumbPlaceholder>
                )}
                <Styles.SearchResultText>
                  <Styles.SearchResultTitle>{song.title}</Styles.SearchResultTitle>
                  <Styles.SearchResultMeta>
                    {song.runtime} • {song.artist}
                  </Styles.SearchResultMeta>
                </Styles.SearchResultText>
              </Styles.SearchResultRow>
            ))}
          </Styles.SearchBarResultsScroll>
        ) : trimmed ? (
          <Styles.SearchBarStateRow>No results for &ldquo;{trimmed}&rdquo;</Styles.SearchBarStateRow>
        ) : null}
      </Styles.SearchBarResultsPanel>
    </>
  );

  return (
    <Styles.SearchBarRoot ref={rootRef} $modal={isModalLayout}>
      {inner}
    </Styles.SearchBarRoot>
  );
};

interface SearchBarProps {
  variant: SearchBarVariant;
  onSelect: (song: SongSuggestion) => void;
  autoFocus?: boolean;
}

export const SearchBar: React.FC<SearchBarProps> = ({ variant, onSelect, autoFocus }) => {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(() => typeof window !== 'undefined' && window.innerWidth <= 768);

  useEffect(() => {
    const onResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  if (variant === 'page' && isMobile) {
    return (
      <>
        <Styles.SearchMobileFab type="button" onClick={() => setMobileSheetOpen(true)} aria-label="Search for a song">
          {MdSearch({ size: 26 })}
        </Styles.SearchMobileFab>
        {mobileSheetOpen ? (
          <Styles.SearchMobileSheet role="dialog" aria-modal="true" aria-label="Search for a song">
            <Styles.SearchMobileSheetBar>
              <Styles.SearchMobileSheetBack type="button" onClick={() => setMobileSheetOpen(false)} aria-label="Back">
                {MdArrowBack({ size: 22 })}
              </Styles.SearchMobileSheetBack>
              <span style={{ fontWeight: 600, fontSize: 16 }}>Search for a Song</span>
            </Styles.SearchMobileSheetBar>
            <Styles.SearchMobileSheetBody>
              <SearchBarCore
                variant="modal"
                autoFocus
                onSelect={(song) => {
                  setMobileSheetOpen(false);
                  onSelect(song);
                }}
              />
            </Styles.SearchMobileSheetBody>
          </Styles.SearchMobileSheet>
        ) : null}
      </>
    );
  }

  return <SearchBarCore variant={variant} onSelect={onSelect} autoFocus={autoFocus} />;
};
