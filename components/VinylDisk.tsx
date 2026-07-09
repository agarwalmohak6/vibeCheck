'use client';

import { motion } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';

interface VinylDiskProps {
  musicUrl?: string;
  trackId?: string; // Kept for old saved payloads; live search now stores musicUrl.
  musicLabel?: string;
}

function isAudioPreviewUrl(url?: string): url is string {
  if (!url) return false;
  return /\.(mp3|ogg|wav|m4a|aac)(\?.*)?$/i.test(url) || url.includes('audio-ssl.itunes.apple.com');
}

export default function VinylDisk({ musicUrl, musicLabel }: VinylDiskProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const resolvedUrl = isAudioPreviewUrl(musicUrl) ? musicUrl : '';
  const trackLabel = musicLabel || 'Background Music Preview';

  // Start the saved live-search preview after the recipient taps the card.
  useEffect(() => {
    if (!hasStarted || !resolvedUrl) return;
    
    if (!audioRef.current || audioRef.current.src !== resolvedUrl) {
      audioRef.current?.pause();
      audioRef.current = new Audio(resolvedUrl);
      audioRef.current.loop = true;
    }

    audioRef.current.play()
      .then(() => setIsPlaying(true))
      .catch(err => {
        console.warn('Autoplay audio failed:', err);
        setIsPlaying(false);
      });
  }, [hasStarted, resolvedUrl]);

  // Exposed globally so EnvelopeReveal can trigger on user tap
  useEffect(() => {
    const win = window as Window & typeof globalThis & { __startMusic?: () => void };
    win.__startMusic = () => {
      setHasStarted(true);
    };
    return () => {
      delete win.__startMusic;
    };
  }, []);

  const toggle = () => {
    if (!resolvedUrl) return;

    if (!hasStarted) {
      setHasStarted(true);
      return;
    }

    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  if (!resolvedUrl) return null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 select-none">
      {/* Vinyl disk button */}
      <motion.button
        onClick={toggle}
        whileTap={{ scale: 0.92 }}
        className="relative w-16 h-16 rounded-full shadow-2xl flex items-center justify-center cursor-pointer"
        style={{
          background: 'var(--surface)',
          border: '2px solid var(--accent)',
          boxShadow: isPlaying ? '0 0 30px var(--glow), 0 0 60px var(--glow2)' : '0 4px 20px rgba(0,0,0,0.5)',
        }}
      >
        {/* Spinning vinyl */}
        <motion.div
          animate={isPlaying ? { rotate: 360 } : { rotate: 0 }}
          transition={isPlaying ? { duration: 3.5, repeat: Infinity, ease: 'linear' } : { duration: 0.3 }}
          className="absolute inset-1 rounded-full flex items-center justify-center"
          style={{
            background: 'conic-gradient(from 0deg, var(--accent), var(--accent2), var(--accent3), var(--accent))',
            opacity: 0.82,
          }}
        >
          {/* Decorative Groove rings */}
          <div className="absolute inset-1.5 rounded-full border border-black/10"></div>
          <div className="absolute inset-3.5 rounded-full border border-black/15"></div>
          <div className="absolute inset-5 rounded-full border border-black/15"></div>
        </motion.div>

        {/* Center hole */}
        <div 
          className="relative z-10 w-5 h-5 rounded-full flex items-center justify-center"
          style={{ background: 'var(--surface)', border: '2px solid var(--border)' }}
        >
          <div className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--accent)' }} />
        </div>

        {/* Playing pulse ring */}
        {isPlaying && (
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ scale: [1, 1.4, 1], opacity: [0.6, 0, 0.6] }}
            transition={{ repeat: Infinity, duration: 1.5 }}
            style={{ border: '2px solid var(--accent)', pointerEvents: 'none' }}
          />
        )}
      </motion.button>

      {/* Label */}
      <div className="text-right">
        <p className="text-[10px] font-bold tracking-tight text-white line-clamp-1 max-w-[150px]">
          {trackLabel}
        </p>
        <p className="text-[9px] text-neutral-400 mt-0.5">
          {isPlaying ? '🎵 Playing Preview' : '▶ Tap to play'}
        </p>
      </div>
    </div>
  );
}
