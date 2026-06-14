'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Track, getTracksByMood } from '@/lib/tracks';

interface MusicSelectorProps {
  selectedTrackId: string;
  onSelectTrack: (trackId: string) => void;
}

type MoodTab = 'romantic' | 'birthday' | 'apology';

export default function MusicSelector({ selectedTrackId, onSelectTrack }: MusicSelectorProps) {
  const [activeTab, setActiveTab] = useState<MoodTab>('romantic');
  const [playingTrackId, setPlayingTrackId] = useState<string | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Filter tracks
  const filteredTracks = getTracksByMood(activeTab);

  const handlePlayPause = (e: React.MouseEvent, track: Track) => {
    e.stopPropagation(); // Don't select the track just by clicking preview

    if (!track.previewUrl) return;

    if (playingTrackId === track.id) {
      // Pause
      audioRef.current?.pause();
      setPlayingTrackId(null);
    } else {
      // Play new
      if (audioRef.current) {
        audioRef.current.pause();
      }
      audioRef.current = new Audio(track.previewUrl);
      audioRef.current.volume = 0.5;
      audioRef.current.play()
        .then(() => {
          setPlayingTrackId(track.id);
        })
        .catch(err => {
          console.error("Preview playback failed:", err);
        });

      audioRef.current.onended = () => {
        setPlayingTrackId(null);
      };
    }
  };

  // Cleanup audio on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, []);

  // Set default track when tab changes if none selected or if we want to auto-select
  // Just let user explicitly select

  const tabs: { id: MoodTab; label: string; emoji: string }[] = [
    { id: 'romantic', label: 'Romantic', emoji: '❤️' },
    { id: 'birthday', label: 'Birthday', emoji: '🎂' },
    { id: 'apology', label: 'Apology / Closure', emoji: '🥺' },
  ];

  return (
    <div className="space-y-4">
      {/* Tab Navigation */}
      <div className="flex border border-white/10 rounded-xl overflow-hidden bg-white/5 p-1">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => {
                setActiveTab(tab.id);
                // Pause preview if playing
                if (audioRef.current) {
                  audioRef.current.pause();
                  setPlayingTrackId(null);
                }
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-bold rounded-lg transition-all duration-200 select-none cursor-pointer ${
                isActive
                  ? 'bg-gradient-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                  : 'text-neutral-400 hover:text-white hover:bg-white/5'
              }`}
            >
              <span>{tab.emoji}</span>
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Tracks List */}
      <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
        {filteredTracks.map((track) => {
          const isSelected = selectedTrackId === track.id;
          const isPlaying = playingTrackId === track.id;

          return (
            <div
              key={track.id}
              onClick={() => onSelectTrack(track.id)}
              className={`flex items-center justify-between p-3 rounded-xl border transition-all duration-200 cursor-pointer ${
                isSelected
                  ? 'bg-white/10 border-pink-500/50 shadow-[0_0_15px_rgba(236,72,153,0.15)]'
                  : 'bg-neutral-900/40 border-white/5 hover:border-white/10 hover:bg-neutral-900/60'
              }`}
            >
              <div className="flex items-center gap-3">
                {/* Vinyl/Disk representation */}
                <div
                  className={`w-10 h-10 rounded-full bg-neutral-950 flex items-center justify-center border border-white/10 relative overflow-hidden ${
                    isPlaying ? 'animate-spin-slow' : ''
                  }`}
                >
                  <div className="w-3 h-3 rounded-full bg-neutral-800 border border-white/20 z-10"></div>
                  {/* Outer design grooves */}
                  <div className="absolute inset-1 rounded-full border border-neutral-800/40"></div>
                  <div className="absolute inset-2 rounded-full border border-neutral-800/40"></div>
                </div>

                <div className="text-left">
                  <h4 className={`text-xs font-bold ${isSelected ? 'text-pink-400' : 'text-white'}`}>
                    {track.label}
                  </h4>
                  <p className="text-[10px] text-neutral-400 font-medium">{track.artist}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {/* Play/Pause Preview Button */}
                {track.previewUrl && (
                  <button
                    type="button"
                    onClick={(e) => handlePlayPause(e, track)}
                    className={`p-2 rounded-full cursor-pointer hover:scale-110 active:scale-95 transition-transform flex items-center justify-center ${
                      isPlaying
                        ? 'bg-pink-500 text-white'
                        : 'bg-white/10 text-neutral-300 hover:bg-white/25'
                    }`}
                    title="Play Preview"
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

                {/* Radio selection check */}
                <div
                  className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                    isSelected ? 'border-pink-500 bg-pink-500' : 'border-white/20'
                  }`}
                >
                  {isSelected && (
                    <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
