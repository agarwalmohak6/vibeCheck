'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

interface VinylDiskProps {
  musicUrl?: string;
  trackId?: string;
  musicLabel?: string;
}

function isAudioPreviewUrl(url?: string): url is string {
  if (!url) return false;
  return /\.(mp3|ogg|wav|m4a|aac)(\?.*)?$/i.test(url) || url.includes('audio-ssl.itunes.apple.com');
}

export default function VinylDisk({ musicUrl, musicLabel }: VinylDiskProps) {
  const [playingUrl, setPlayingUrl] = useState('');
  const [error, setError] = useState('');
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const resolvedUrl = isAudioPreviewUrl(musicUrl) ? musicUrl : '';
  const isPlaying = !!resolvedUrl && playingUrl === resolvedUrl;
  const trackLabel = musicLabel || 'Your soundtrack';

  const play = useCallback(() => {
    if (!resolvedUrl) return;
    if (!audioRef.current) {
      audioRef.current = new Audio(resolvedUrl);
      audioRef.current.loop = true;
      audioRef.current.volume = 0.55;
    }
    const audio = audioRef.current;
    setError('');
    void audio.play().then(() => {
      if (audioRef.current === audio) setPlayingUrl(resolvedUrl);
      else audio.pause();
    }).catch(() => {
      if (audioRef.current === audio) { setPlayingUrl(''); setError('Tap to retry the preview'); }
    });
  }, [resolvedUrl]);

  useEffect(() => {
    const win = window as Window & { __startMusic?: () => void };
    win.__startMusic = play;
    return () => {
      if (win.__startMusic === play) delete win.__startMusic;
      audioRef.current?.pause();
      audioRef.current = null;
    };
  }, [play]);

  if (!resolvedUrl) return null;

  return (
    <aside className="vc-soundtrack" aria-label="Card soundtrack">
      <button type="button" className="vc-soundtrack__control" data-playing={isPlaying} aria-pressed={isPlaying}
        aria-label={`${isPlaying ? 'Pause' : 'Play'} ${trackLabel}`} onClick={() => {
          if (isPlaying) { audioRef.current?.pause(); setPlayingUrl(''); }
          else play();
        }}><span aria-hidden="true">{isPlaying ? 'Ⅱ' : '▶'}</span></button>
      <div className="vc-soundtrack__info"><strong title={trackLabel}>{trackLabel}</strong><span role="status">{error || (isPlaying ? 'Playing · audio preview' : 'Tap play · audio preview')}</span></div>
    </aside>
  );
}
