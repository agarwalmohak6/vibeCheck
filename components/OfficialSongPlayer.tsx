'use client';

import { appleMusicEmbedUrl } from '@/lib/musicLinks';

export default function OfficialSongPlayer({ url, label }: { url: string; label?: string }) {
  const source = appleMusicEmbedUrl(url);
  if (!source) return null;
  return <div className="vc-official-player">
    <iframe src={source} title={`Apple Music player: ${label || 'Your selected song'}`} height={175}
      allow="autoplay *; encrypted-media *; fullscreen *; clipboard-write" referrerPolicy="strict-origin-when-cross-origin" />
    <a href={url} target="_blank" rel="noopener noreferrer">Listen on Apple Music ↗</a>
  </div>;
}
