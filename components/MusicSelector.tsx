'use client';

import { useEffect, useState } from 'react';
import { isOfficialMusicLink } from '@/lib/musicLinks';
import OfficialSongPlayer from '@/components/OfficialSongPlayer';

interface MusicSelectorProps {
  selectedTrackId: string;
  selectedLabel?: string;
  selectedPreviewUrl?: string;
  selectedMusicLink?: string;
  onSelectTrack: (trackId: string, musicUrl?: string, label?: string, musicLink?: string) => void;
}

type Song = { id: string; label: string; artist: string; sourceUrl?: string };

export default function MusicSelector({ selectedTrackId, selectedLabel, selectedMusicLink, onSelectTrack }: MusicSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const search = query.trim();
  const searching = search.length >= 2;

  useEffect(() => {
    if (!searching) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      try {
        const response = await fetch(`/api/music/search?q=${encodeURIComponent(search)}`, { signal: controller.signal });
        if (!response.ok) throw new Error('Search failed');
        const data = await response.json() as { results?: Song[] };
        if (!controller.signal.aborted) setResults((data.results || []).filter(song => isOfficialMusicLink(song.sourceUrl || '')));
      } catch {
        if (!controller.signal.aborted) { setError('Search is unavailable. Please try again later.'); setResults([]); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [search, searching]);

  const choose = (song: Song) => {
    if (!isOfficialMusicLink(song.sourceUrl || '')) return;
    onSelectTrack(song.id, '', `${song.label} · ${song.artist}`, song.sourceUrl);
    setQuery(''); setResults([]); setLoading(false); setError('');
  };

  const songRow = (song: Song) => (
    <div key={song.id} className="vc-music-row" data-selected={song.id === selectedTrackId}>
      <button type="button" className="vc-music-track" onClick={() => choose(song)} aria-label={`Select ${song.label} by ${song.artist}`} aria-pressed={song.id === selectedTrackId}>
        <span className="vc-song-marker" aria-hidden="true">{song.id === selectedTrackId ? '✓' : '♫'}</span>
        <span className="vc-music-info"><strong>{song.label}</strong><span>{song.artist}</span></span>
      </button>
      <a className="vc-song-listen" href={song.sourceUrl} target="_blank" rel="noopener noreferrer" aria-label={`Listen to ${song.label} on Apple Music`}>Listen ↗</a>
    </div>
  );

  return (
    <section className="vc-music-selector" aria-label="Dedicate a song">
      {selectedTrackId && <div className="vc-music-saved">
        <div className="vc-music-saved__heading"><span>Your song</span><button type="button" onClick={() => onSelectTrack('', '', '', '')}>Remove</button></div>
        <strong>{selectedLabel || 'Your selected song'}</strong>
        {selectedMusicLink && <OfficialSongPlayer key={selectedMusicLink} url={selectedMusicLink} label={selectedLabel} />}
      </div>}
      <label className="vc-music-search"><span>Search for a song</span>
        <input type="search" maxLength={80} value={query} placeholder="Song title or artist" className="vc-builder-input" onChange={event => {
          setQuery(event.target.value); setResults([]); setLoading(event.target.value.trim().length >= 2); setError('');
        }} />
      </label>
      {searching && <div className="vc-music-results" aria-busy={loading}>
        {results.map(songRow)}
        <p role="status">{loading ? 'Finding your song…' : !results.length && !error ? 'No matches. Try the song title and artist.' : ''}</p>
      </div>}
      {error && <p className="vc-music-error" role="status">{error}</p>}
      <p className="vc-music-credit">Song dedication · Apple Music link</p>
    </section>
  );
}
