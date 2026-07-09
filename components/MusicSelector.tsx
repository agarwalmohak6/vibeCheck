'use client';

import { useCallback, useEffect, useRef, useState, type MouseEvent } from 'react';

interface MusicSelectorProps {
  selectedTrackId: string;
  selectedLabel?: string;
  onSelectTrack: (trackId: string, musicUrl?: string, label?: string) => void;
}

type SongSearchResult = {
  id: string;
  label: string;
  artist: string;
  album?: string;
  previewUrl: string;
  artworkUrl?: string;
  sourceUrl?: string;
  provider: 'itunes';
};

type MusicItem = {
  id: string;
  label: string;
  artist: string;
  album?: string;
  previewUrl?: string;
  artworkUrl?: string;
  source: 'search';
};

function searchToItem(track: SongSearchResult): MusicItem {
  return {
    id: track.id,
    label: track.label,
    artist: track.artist,
    album: track.album,
    previewUrl: track.previewUrl,
    artworkUrl: track.artworkUrl,
    source: 'search',
  };
}

export default function MusicSelector({ selectedTrackId, selectedLabel, onSelectTrack }: MusicSelectorProps) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SongSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const trimmedQuery = query.trim();
  const isSearching = trimmedQuery.length >= 2;

  const handleQueryChange = (nextQuery: string) => {
    setQuery(nextQuery);
    if (nextQuery.trim().length < 2) {
      setSearchResults([]);
      setLoading(false);
      setError('');
    }
  };

  const stopPreview = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
    setPlayingTrackId(null);
  }, []);

  useEffect(() => {
    if (!isSearching) {
      return;
    }

    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError('');

      try {
        const res = await fetch(`/api/music/search?q=${encodeURIComponent(trimmedQuery)}`, {
          signal: controller.signal,
        });
        const data = (await res.json()) as { results?: SongSearchResult[]; error?: string };

        if (!res.ok) {
          throw new Error(data.error || 'Song search failed.');
        }

        setSearchResults(data.results || []);
      } catch (err) {
        if (controller.signal.aborted) return;
        console.error(err);
        setError('Could not search songs right now. Try again in a moment.');
        setSearchResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);

    return () => {
      controller.abort();
      window.clearTimeout(timeout);
    };
  }, [isSearching, trimmedQuery]);

  useEffect(() => stopPreview, [stopPreview]);

  const handlePlayPause = (e: MouseEvent<HTMLButtonElement>, track: MusicItem) => {
    e.stopPropagation();
    if (!track.previewUrl) return;

    if (playingTrackId === track.id) {
      stopPreview();
      return;
    }

    stopPreview();
    const audio = new Audio(track.previewUrl);
    audio.volume = 0.55;
    audioRef.current = audio;
    audio
      .play()
      .then(() => setPlayingTrackId(track.id))
      .catch((err) => {
        console.error('Preview playback failed:', err);
        setPlayingTrackId(null);
      });

    audio.onended = () => setPlayingTrackId(null);
  };

  const handleSelect = (track: MusicItem) => {
    onSelectTrack(track.id, track.previewUrl, `${track.label} · ${track.artist}`);
  };

  const handleClear = () => {
    stopPreview();
    onSelectTrack('', '', '');
  };

  const renderTrack = (track: MusicItem) => {
    const isSelected = selectedTrackId === track.id;
    const isPlaying = playingTrackId === track.id;

    return (
      <div
        key={track.id}
        role="button"
        tabIndex={0}
        onClick={() => handleSelect(track)}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleSelect(track);
          }
        }}
        className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer text-left ${
          isSelected
            ? 'bg-white/10 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.15)]'
            : 'bg-neutral-900/40 border-white/5 hover:border-white/10 hover:bg-neutral-900/60'
        }`}
      >
        <div className="flex items-center gap-3 min-w-0">
          {track.artworkUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={track.artworkUrl} alt="" className="w-10 h-10 rounded-xl object-cover border border-white/10" />
          ) : (
            <div
              className={`w-10 h-10 rounded-full bg-neutral-950 flex items-center justify-center border border-white/10 relative overflow-hidden shrink-0 ${
                isPlaying ? 'animate-spin-slow' : ''
              }`}
            >
              <div className="w-3 h-3 rounded-full bg-neutral-800 border border-white/20 z-10" />
              <div className="absolute inset-1 rounded-full border border-neutral-800/40" />
              <div className="absolute inset-2 rounded-full border border-neutral-800/40" />
            </div>
          )}

          <div className="min-w-0">
            <h4 className={`text-xs font-bold truncate ${isSelected ? 'text-pink-400' : 'text-white'}`}>
              {track.label}
            </h4>
            <p className="text-[10px] text-neutral-400 font-medium truncate">{track.artist}</p>
            {track.album && <p className="text-[9px] text-neutral-500 truncate">{track.album}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {track.previewUrl && (
            <button
              type="button"
              onClick={(e) => handlePlayPause(e, track)}
              className={`p-2 rounded-full cursor-pointer hover:scale-110 active:scale-95 transition-transform flex items-center justify-center ${
                isPlaying ? 'bg-pink-500 text-white' : 'bg-white/10 text-neutral-300 hover:bg-white/25'
              }`}
              title={isPlaying ? 'Pause preview' : 'Play preview'}
            >
              {isPlaying ? (
                <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M8 5v14l11-7z" />
                </svg>
              )}
            </button>
          )}

          <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${
            isSelected ? 'border-pink-500 bg-pink-500' : 'border-white/20'
          }`}>
            {isSelected && (
              <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="relative">
          <input
            type="search"
            value={query}
            onChange={(e) => handleQueryChange(e.target.value)}
            placeholder="Search any song or artist..."
            className="vc-builder-input w-full px-4 py-3 pr-12 outline-none text-sm"
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-xs" style={{ color: 'var(--text3)' }}>
            {loading ? '...' : 'Search'}
          </div>
        </div>

        {selectedLabel && (
          <div className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2">
            <p className="min-w-0 truncate text-[11px] font-bold" style={{ color: 'var(--accent)' }}>
              Selected: {selectedLabel}
            </p>
            <button
              type="button"
              onClick={handleClear}
              className="shrink-0 text-[10px] font-black uppercase tracking-widest cursor-pointer"
              style={{ color: 'var(--text3)' }}
            >
              Remove
            </button>
          </div>
        )}
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-black uppercase tracking-widest" style={{ color: 'var(--text2)' }}>
            Live song search
          </p>
          <p className="text-[10px]" style={{ color: 'var(--text3)' }}>Apple Music previews</p>
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
          {searchResults.map((track) => renderTrack(searchToItem(track)))}

          {!isSearching && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center">
              <p className="text-xs" style={{ color: 'var(--text3)' }}>
                Search any song or artist above. Select a preview to use it in the card.
              </p>
            </div>
          )}

          {isSearching && !loading && searchResults.length === 0 && !error && (
            <div className="rounded-xl border border-white/10 bg-white/5 px-4 py-6 text-center">
              <p className="text-xs" style={{ color: 'var(--text3)' }}>No songs found yet. Try artist + song name.</p>
            </div>
          )}

          {error && (
            <div className="rounded-xl border border-red-400/25 bg-red-500/10 px-4 py-3">
              <p className="text-xs text-red-200">{error}</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
