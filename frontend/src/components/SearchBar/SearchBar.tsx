import React, { useState, useEffect, useRef } from 'react';
import { MdSearch, MdClose, MdArrowBack } from 'react-icons/md';
import { searchSongs, SongSuggestion } from '../../services/api';
import './SearchBar.css';

interface SearchBarProps {
  onSelectSong: (song: SongSuggestion) => void;
  placeholder?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectSong, placeholder = "Search for a song..." }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SongSuggestion[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isMobileModalOpen, setIsMobileModalOpen] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // Click outside to close dropdown
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Auto-focus input when mobile modal opens
  useEffect(() => {
    if (isMobileModalOpen && inputRef.current) {
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [isMobileModalOpen]);

  const handleSearch = (searchQuery: string) => {
    setQuery(searchQuery);
    
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (!searchQuery.trim()) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    setIsLoading(true);
    setIsOpen(true);

    debounceTimerRef.current = setTimeout(async () => {
      try {
        const data = await searchSongs(searchQuery);
        setResults(data);
      } catch (error) {
        console.error("Error searching songs:", error);
        setResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 500); // 500ms debounce
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }
  };

  const handleSelect = (song: SongSuggestion) => {
    onSelectSong(song);
    setIsOpen(false);
    setIsMobileModalOpen(false);
    // Optionally clear query after selection
    // setQuery(''); 
  };

  return (
    <>
      <button 
        className="search-mobile-toggle-btn" 
        onClick={() => setIsMobileModalOpen(true)}
        aria-label="Open search"
      >
        {MdSearch({ size: 24 })}
      </button>

      <div className={`search-bar-wrapper ${isMobileModalOpen ? 'mobile-modal-open' : 'desktop-only'}`} ref={wrapperRef}>
        <div className={`search-input-container ${isOpen && results.length > 0 ? 'open' : ''}`}>
          {isMobileModalOpen ? (
            <button 
              className="search-mobile-back-btn" 
              onClick={() => setIsMobileModalOpen(false)}
              aria-label="Close search"
            >
              {MdArrowBack({ size: 24 })}
            </button>
          ) : (
            <div className="search-icon">
              {MdSearch({ size: 24 })}
            </div>
          )}
          <input
            ref={inputRef}
            type="text"
          className="search-input"
          placeholder={placeholder}
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          onFocus={() => {
            if (query.trim()) setIsOpen(true);
          }}
        />
        {query && (
          <button className="search-clear-btn" onClick={handleClear}>
            {MdClose({ size: 20 })}
          </button>
        )}
      </div>

      {isOpen && query.trim() && (
        <div className="search-dropdown">
          {isLoading ? (
            <div className="search-loading">
              <div className="spinner"></div>
              <span>Searching...</span>
            </div>
          ) : results.length > 0 ? (
            <ul className="search-results-list">
              {results.map((song) => (
                <li 
                  key={song.id} 
                  className="search-result-item"
                  onClick={() => handleSelect(song)}
                >
                  <div className="search-result-cover">
                    {song.album_cover ? (
                      <img src={song.album_cover} alt={`${song.title} cover`} />
                    ) : (
                      <div className="search-result-cover-placeholder">
                        {MdSearch({ size: 24 })}
                      </div>
                    )}
                  </div>
                  <div className="search-result-info">
                    <div className="search-result-title">{song.title}</div>
                    <div className="search-result-meta">
                      <span className="search-result-runtime">{song.runtime}</span>
                      <span className="search-result-dot">•</span>
                      <span className="search-result-artist">{song.artist}</span>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="search-no-results">
              No results found for "{query}"
            </div>
          )}
        </div>
      )}
      </div>
    </>
  );
};
