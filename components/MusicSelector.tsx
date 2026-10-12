'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface MusicSelectorProps {
  selectedTrackId: string;
  selectedLabel?: string;
  selectedPreviewUrl?: string;
  onSelectTrack: (trackId: string, musicUrl?: string, label?: string) => void;
}

type Song = {
  id: string;
  label: string;
  artist: string;
  album?: string;
  previewUrl?: string;
  artworkUrl?: string;
};

export default function MusicSelector({ selectedTrackId, selectedLabel, selectedPreviewUrl, onSelectTrack }: MusicSelectorProps) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Song[]>([]);
  const [selected, setSelected] = useState<Song | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [playingId, setPlayingId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const search = query.trim();
  const searching = search.length >= 2;
  const savedLabel = selectedLabel || 'Your selected song';
  const labelParts = savedLabel.split(' · ');
  const saved: Song | null = selectedTrackId ? selected?.id === selectedTrackId ? selected : {
    id: selectedTrackId, label: labelParts[0], artist: labelParts.slice(1).join(' · '), previewUrl: selectedPreviewUrl,
  } : null;

  const stop = useCallback(() => {
    const audio = audioRef.current;
    audioRef.current = null;
    audio?.pause();
    setPlayingId(null);
  }, []);

  useEffect(() => () => { audioRef.current?.pause(); audioRef.current = null; }, []);

  useEffect(() => {
    if (!searching) return;
    const controller = new AbortController();
    const timer = window.setTimeout(async () => {
      setLoading(true);
      setError('');
      try {
        const response = await fetch(`/api/music/search?q=${encodeURIComponent(search)}`, { signal: controller.signal });
        const data = await response.json() as { results?: Song[] };
        if (!response.ok) throw new Error('Search failed');
        if (!controller.signal.aborted) setResults(data.results || []);
      } catch {
        if (!controller.signal.aborted) { setError('Song search is unavailable right now. Please try again.'); setResults([]); }
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 350);
    return () => { controller.abort(); window.clearTimeout(timer); };
  }, [search, searching]);

  const play = (song: Song) => {
    if (playingId === song.id) { stop(); return; }
    stop();
    if (!song.previewUrl) return;
    const audio = new Audio(song.previewUrl);
    audio.volume = 0.55;
    audioRef.current = audio;
    setError('');
    void audio.play().then(() => {
      if (audioRef.current === audio) setPlayingId(song.id);
      else audio.pause();
    }).catch(() => {
      if (audioRef.current === audio) { setPlayingId(null); setError('This preview could not play. Try another song or try again.'); }
    });
    audio.onended = () => { if (audioRef.current === audio) setPlayingId(null); };
  };

  const choose = (song: Song) => {
    stop();
    setSelected(song);
    onSelectTrack(song.id, song.previewUrl, `${song.label} · ${song.artist}`);
    setQuery(''); setResults([]); setLoading(false); setError('');
  };

  const artwork = (song: Song) => song.artworkUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img className="vc-music-art" src={song.artworkUrl} alt="" width={44} height={44} />
  ) : <span className="vc-music-art vc-music-art--placeholder" aria-hidden="true">♫</span>;
  const preview = (song: Song) => song.previewUrl && <button type="button" className="vc-music-preview" onClick={() => play(song)} aria-label={`${playingId === song.id ? 'Pause' : 'Play'} preview of ${song.label}`} aria-pressed={playingId === song.id}>{playingId === song.id ? 'Ⅱ' : '▶'}</button>;

  return (
    <section className="vc-music-selector" aria-label="Choose a song">
      {saved && <div className="vc-music-saved">
        <div className="vc-music-saved__heading"><span>✓ Your soundtrack</span><button type="button" onClick={() => { stop(); setSelected(null); onSelectTrack('', '', ''); }}>Remove</button></div>
        <div className="vc-music-row">
          <div className="vc-music-track">{artwork(saved)}<div className="vc-music-info"><strong title={saved.label}>{saved.label}</strong><span title={saved.artist}>{saved.artist || 'Selected for your card'}</span></div></div>
          {preview(saved)}
        </div>
        <p>Saved to your card · audio preview</p>
      </div>}
      <label className="vc-music-search"><span>{saved ? 'Change your song' : 'Find your soundtrack'}</span>
        <input type="search" maxLength={80} value={query} placeholder="Song title or artist" className="vc-builder-input" onChange={event => {
          setQuery(event.target.value); setResults([]); setLoading(event.target.value.trim().length >= 2); setError('');
        }} />
      </label>
      {searching && <div className="vc-music-results" aria-busy={loading}>
        {results.map(song => <div key={song.id} className="vc-music-row" data-selected={song.id === selectedTrackId}>
          <button type="button" className="vc-music-track" onClick={() => choose(song)} aria-label={`Select ${song.label} by ${song.artist}`} aria-pressed={song.id === selectedTrackId}>
            {artwork(song)}<span className="vc-music-info"><strong title={song.label}>{song.label}</strong><span title={song.artist}>{song.artist}</span></span>
          </button>
          {preview(song)}
        </div>)}
        <p role="status">{loading ? 'Finding your song…' : !results.length && !error ? 'No matches. Try the song title and artist.' : ''}</p>
      </div>}
      {error && <p className="vc-music-error" role="status">{error}</p>}
      <p className="vc-music-credit">Apple Music previews · a little atmosphere for your note</p>
    </section>
  );
}
