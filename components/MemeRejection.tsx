'use client';

import React, { useEffect } from 'react';
import { motion } from 'framer-motion';

interface MemeRejectionProps {
  onClose: () => void;
}

export default function MemeRejection({ onClose }: MemeRejectionProps) {
  useEffect(() => {
    // 1. Play Vine Boom sound
    const playVineBoom = () => {
      const audioUrl = "https://www.myinstants.com/media/sounds/vine-boom.mp3";
      const audio = new Audio(audioUrl);
      audio.volume = 0.8;
      
      const playPromise = audio.play();
      if (playPromise !== undefined) {
        playPromise.catch((err) => {
          console.warn("Audio autoplay blocked, using Web Audio synthesizer fallback:", err);
          playVineBoomSynth();
        });
      }
    };

    const playVineBoomSynth = () => {
      try {
        const AudioCtx = window.AudioContext || (window as Window & typeof globalThis & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        
        osc.connect(gain);
        gain.connect(ctx.destination);
        
        // Vine Boom frequency sweep from 140Hz down to 20Hz
        osc.frequency.setValueAtTime(140, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(25, ctx.currentTime + 0.9);
        
        // Distortion/Bass effect
        osc.type = 'sawtooth';
        
        // Lowpass filter for boomy sound
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(120, ctx.currentTime);
        filter.frequency.exponentialRampToValueAtTime(40, ctx.currentTime + 0.9);
        
        osc.disconnect(gain);
        osc.connect(filter);
        filter.connect(gain);

        // Volume decay
        gain.gain.setValueAtTime(1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.9);
        
        osc.start();
        osc.stop(ctx.currentTime + 0.9);
      } catch (e) {
        console.error("Synth fallback failed:", e);
      }
    };

    playVineBoom();

    // 2. Set screen to grayscale
    const originalFilter = document.documentElement.style.filter;
    document.documentElement.style.filter = 'grayscale(100%)';
    document.documentElement.style.transition = 'filter 0.5s ease';

    return () => {
      document.documentElement.style.filter = originalFilter;
    };
  }, []);

  return (
    <div className="fixed inset-0 bg-black/90 z-[9999] flex flex-col items-center justify-center p-4 overflow-y-auto font-sans">
      <div className="max-w-md w-full bg-neutral-900 border border-neutral-800 rounded-2xl p-6 text-center shadow-2xl space-y-6">
        
        {/* Banner */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="bg-red-950/50 border border-red-500/30 rounded-xl p-4"
        >
          <h2 className="text-red-500 font-extrabold text-xl tracking-tight uppercase">
            Kata Kya? 🥲
          </h2>
          <p className="text-neutral-300 text-sm mt-1">
            Standard operating procedure initialized.
          </p>
        </motion.div>

        {/* Gray Meme Reaction Grid */}
        <div className="grid grid-cols-3 gap-3">
          {[
            "https://media.giphy.com/media/d2lcHJTG5TGIg/giphy.gif", // Crying
            "https://media.giphy.com/media/2oUfvvUgQHnLsQ1u25/giphy.gif", // Facepalm
            "https://media.giphy.com/media/X3Gb6WWZO9T16/giphy.gif"  // Sad Cat
          ].map((src, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 * i + 0.2 }}
              className="relative aspect-square rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={src} 
                alt="rejection reaction" 
                className="object-cover w-full h-full"
              />
            </motion.div>
          ))}
        </div>

        {/* Text */}
        <div className="space-y-2">
          <p className="text-neutral-400 text-sm italic">
            &ldquo;You tried to click NO. That was a bad decision. You are now officially friendzoned in all 28 states and 8 union territories of India.&rdquo;
          </p>
          <p className="text-xs text-neutral-500 font-mono">
            Error: RejectCode_403_NoAccess
          </p>
        </div>

        {/* Action Button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onClose}
          className="w-full bg-white text-black font-bold py-3 px-6 rounded-xl hover:bg-neutral-200 transition-colors"
        >
          I will click YES next time, I promise 😭
        </motion.button>
      </div>
    </div>
  );
}
