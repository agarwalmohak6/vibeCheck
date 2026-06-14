'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef, useEffect } from 'react';
import { getTrackById } from '@/lib/tracks';

interface VinylDiskProps {
  musicUrl?: string; // v1 compatibility
  trackId?: string;  // v2 track ID
}

function getMusicType(url: string): 'youtube' | 'spotify' | 'mp3' | 'none' {
  if (!url) return 'none';
  if (url.includes('youtube.com') || url.includes('youtu.be') || /^[a-zA-Z0-9_-]{11}$/.test(url)) return 'youtube';
  if (url.includes('spotify.com')) return 'spotify';
  if (url.match(/\.(mp3|ogg|wav|m4a)(\?.*)?$/i)) return 'mp3';
  return 'none';
}

function getYouTubeId(url: string): string {
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;
  const match = url.match(/(?:v=|youtu\.be\/|embed\/)([a-zA-Z0-9_-]{11})/);
  return match ? match[1] : '';
}

function getSpotifyEmbed(url: string): string {
  if (url.includes('spotify.com/embed/')) return url;
  return url.replace('https://open.spotify.com/', 'https://open.spotify.com/embed/');
}

export default function VinylDisk({ musicUrl, trackId }: VinylDiskProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [showPlayer, setShowPlayer] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 1. Resolve track details from catalog or direct URL
  const resolvedTrack = trackId ? getTrackById(trackId) : null;
  let type: 'youtube' | 'spotify' | 'mp3' | 'none' = 'none';
  let resolvedUrl = '';
  let trackLabel = 'Background Music';

  if (resolvedTrack) {
    trackLabel = `${resolvedTrack.label} · ${resolvedTrack.artist}`;
    // Prefer mp3 preview if it exists, otherwise fall back to spotify/youtube embed
    if (resolvedTrack.previewUrl) {
      type = 'mp3';
      resolvedUrl = resolvedTrack.previewUrl;
    } else if (resolvedTrack.spotifyId) {
      type = 'spotify';
      resolvedUrl = `https://open.spotify.com/embed/track/${resolvedTrack.spotifyId}`;
    } else if (resolvedTrack.youtubeId) {
      type = 'youtube';
      resolvedUrl = resolvedTrack.youtubeId;
    }
  } else if (musicUrl) {
    type = getMusicType(musicUrl);
    resolvedUrl = musicUrl;
    if (type === 'youtube') trackLabel = 'YouTube Track';
    else if (type === 'spotify') trackLabel = 'Spotify Track';
    else trackLabel = 'Background MP3';
  }

  // 2. Initialize and trigger autoplay once gesture starts
  useEffect(() => {
    if (!hasStarted) return;
    
    if (type === 'mp3' && resolvedUrl) {
      if (!audioRef.current) {
        audioRef.current = new Audio(resolvedUrl);
        audioRef.current.loop = true;
      }
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(err => {
          console.warn("Autoplay audio failed:", err);
          setIsPlaying(false);
        });
    } else if (type !== 'none') {
      setTimeout(() => setIsPlaying(true), 0);
    }
  }, [hasStarted, type, resolvedUrl]);

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
    if (!hasStarted) {
      setHasStarted(true);
      return;
    }

    if (type === 'mp3' && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
        setIsPlaying(false);
      } else {
        audioRef.current.play().then(() => setIsPlaying(true)).catch(() => {});
      }
    } else {
      setIsPlaying(!isPlaying);
      setShowPlayer(!showPlayer && (type === 'youtube' || type === 'spotify' || !!resolvedTrack?.spotifyId));
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

  if (type === 'none' && !resolvedTrack) return null;

  // Calculate secondary embed URL in case preview MP3 is playing but user wants to open Spotify iframe player
  const spotifyEmbedUrl = resolvedTrack?.spotifyId 
    ? `https://open.spotify.com/embed/track/${resolvedTrack.spotifyId}`
    : type === 'spotify' 
      ? getSpotifyEmbed(resolvedUrl) 
      : null;

  const youtubeEmbedId = resolvedTrack?.youtubeId 
    ? resolvedTrack.youtubeId 
    : type === 'youtube' 
      ? getYouTubeId(resolvedUrl) 
      : null;

  return (
    <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3 select-none">
      
      {/* Embedded Spotify/YouTube player overlay */}
      <AnimatePresence>
        {showPlayer && (spotifyEmbedUrl || youtubeEmbedId) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: 20 }}
            className="rounded-2xl overflow-hidden shadow-2xl bg-neutral-950/80 backdrop-blur"
            style={{ width: 280, border: '1px solid var(--border)' }}
          >
            {spotifyEmbedUrl && (
              <iframe
                src={spotifyEmbedUrl}
                width="280"
                height="152"
                frameBorder="0"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
                className="w-full"
              />
            )}
            {!spotifyEmbedUrl && youtubeEmbedId && (
              <iframe
                width="280"
                height="158"
                src={`https://www.youtube.com/embed/${youtubeEmbedId}?autoplay=1&controls=1`}
                allow="autoplay; encrypted-media"
                frameBorder="0"
                className="w-full"
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

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
