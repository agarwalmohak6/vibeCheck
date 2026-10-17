'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createRomanceMelody } from '@/lib/romanceMelody';
import { isOfficialMusicLink } from '@/lib/musicLinks';
import OfficialSongPlayer from '@/components/OfficialSongPlayer';

interface VinylDiskProps { musicUrl?: string; trackId?: string; musicLabel?: string; musicLink?: string; }
export default function VinylDisk(props: VinylDiskProps) {
  if (props.musicLink && isOfficialMusicLink(props.musicLink)) return <OfficialSoundtrack url={props.musicLink} label={props.musicLabel} />;
  return <BackgroundSoundtrack {...props} />;
}

function OfficialSoundtrack({ url, label }: { url: string; label?: string }) {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    const reveal = () => setOpen(true);
    window.addEventListener('vibecheck:open-song', reveal);
    return () => window.removeEventListener('vibecheck:open-song', reveal);
  }, []);
  return <aside className="vc-official-soundtrack" aria-label="Selected song">
    <button type="button" aria-expanded={open} aria-controls="card-song-player" onClick={() => setOpen(value => !value)}>{open ? 'Close song' : 'Play song'}</button>
    {open && <div id="card-song-player"><OfficialSongPlayer url={url} label={label} /></div>}
  </aside>;
}

function BackgroundSoundtrack({ musicUrl, musicLabel }: VinylDiskProps) {
  const [playing, setPlaying] = useState(false);
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const melodyRef = useRef<ReturnType<typeof createRomanceMelody> | null>(null);
  const requestRef = useRef(0);
  const label = musicLabel || 'A little music-box melody';
  const play = useCallback(() => {
    const request = ++requestRef.current;
    setError('');
    try {
      let started: Promise<void>;
      if (musicUrl) {
        if (!audioRef.current) { audioRef.current = new Audio(musicUrl); audioRef.current.loop = true; audioRef.current.volume = .55; }
        started = audioRef.current.play();
      } else {
        melodyRef.current ||= createRomanceMelody();
        started = melodyRef.current.play();
      }
      void started.then(() => { if (requestRef.current === request) setPlaying(true); }).catch(() => {
        if (requestRef.current === request) { setPlaying(false); setError('Music could not play. Tap to retry.'); }
      });
    } catch { setError('Music could not play. Tap to retry.'); }
  }, [musicUrl]);
  useEffect(() => {
    const win = window as Window & { __startMusic?: () => void };
    win.__startMusic = play;
    const requests = requestRef;
    return () => {
      requests.current++;
      if (win.__startMusic === play) delete win.__startMusic;
      audioRef.current?.pause(); audioRef.current = null;
      melodyRef.current?.dispose(); melodyRef.current = null;
    };
  }, [play]);
  return <aside className="vc-romance-sound" aria-label="Card soundtrack">
    <button type="button" aria-label={`${playing ? 'Mute' : 'Play'} ${label}`} title={error || `${playing ? 'Mute' : 'Play'} ${label}`} aria-pressed={playing} onClick={() => {
      if (playing) { requestRef.current++; audioRef.current?.pause(); melodyRef.current?.pause(); setPlaying(false); }
      else play();
    }}>
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d="M11 5 6 9H3v6h3l5 4z" />{playing ? <path d="M15 8c2 2 2 6 0 8m3-11c4 4 4 10 0 14" /> : <path d="m16 9 5 6m0-6-5 6" />}</svg>
    </button>
    <span className="sr-only" role="status">{error}</span>
  </aside>;
}
