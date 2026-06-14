'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import WaxSeal from '@/components/WaxSeal';

interface EnvelopeRevealProps {
  creatorName: string;
  onOpen: () => void;
  theme?: string;
}

export default function EnvelopeReveal({ creatorName, onOpen, theme }: EnvelopeRevealProps) {
  const [phase, setPhase] = useState<'sealed' | 'opening' | 'open'>('sealed');
  const hasOpened = useRef(false);

  const handleTap = () => {
    if (hasOpened.current || phase !== 'sealed') return;
    hasOpened.current = true;

    // Gestured audio initialization (runs synchronously in call stack)
    if (typeof window !== 'undefined') {
      const win = window as Window & typeof globalThis & { __startMusic?: () => void };
      if (win.__startMusic) {
        try {
          win.__startMusic();
        } catch (err) {
          console.warn("Failed to play audio synchronously on click:", err);
        }
      }
    }

    setPhase('opening');

    // Confetti burst
    const colors = ['#FF2E93', '#a855f7', '#06b6d4', '#FFD700', '#ffffff'];
    setTimeout(() => {
      confetti({ particleCount: 150, spread: 120, origin: { y: 0.55 }, colors });
    }, 400);

    setTimeout(() => {
      setPhase('open');
      onOpen();
    }, 1000);
  };

  // 1. Desi Festive Royal Wax Seal envelope
  if (theme === 'desi_festive') {
    return (
      <AnimatePresence>
        {phase !== 'open' && (
          <motion.div
            className="fixed inset-0 z-50 flex items-center justify-center"
            style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(10px)' }}
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6 }}
          >
            <div className="flex flex-col items-center gap-6 px-6">
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center text-xs font-bold tracking-widest uppercase text-amber-500 font-serif"
              >
                👑 Royal Invitation from 👑
              </motion.p>
              
              <motion.h2
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                className="text-3xl font-serif font-black text-center text-yellow-400 drop-shadow-[0_4px_12px_rgba(250,204,21,0.25)]"
              >
                {creatorName}
              </motion.h2>

              {/* Crimson Envelope Card box */}
              <motion.div
                className="relative w-[280px] h-[200px] rounded-2xl bg-rose-950 border-4 border-amber-500 shadow-2xl flex items-center justify-center overflow-hidden"
                animate={phase === 'sealed' ? { y: [0, -6, 0] } : {}}
                transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              >
                {/* Corner Ornaments */}
                <div className="absolute top-2 left-2 text-amber-500/60 font-serif text-sm">✦</div>
                <div className="absolute top-2 right-2 text-amber-500/60 font-serif text-sm">✦</div>
                <div className="absolute bottom-2 left-2 text-amber-500/60 font-serif text-sm">✦</div>
                <div className="absolute bottom-2 right-2 text-amber-500/60 font-serif text-sm">✦</div>

                {/* Decorative border */}
                <div className="absolute inset-2 border border-amber-500/20 rounded-lg pointer-events-none"></div>

                {/* Wax Seal trigger */}
                <WaxSeal onOpen={handleTap} />
              </motion.div>

              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: [0.5, 1, 0.5] }}
                transition={{ repeat: Infinity, duration: 1.8 }}
                className="text-xs font-serif text-amber-400 tracking-wider"
              >
                {phase === 'sealed' ? '✨ Tap the Wax Seal to Break Open' : '✨ Breaking Royal Seal...'}
              </motion.p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    );
  }

  // 2. Default SVG flap envelope for other themes
  return (
    <AnimatePresence>
      {phase !== 'open' && (
        <motion.div 
          initial={{ opacity: 0 }} 
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 1.1 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center p-6 overflow-hidden bg-black"
        >
          {/* Cinematic Backdrop Image */}
          <div 
            className="absolute inset-0 opacity-30 pointer-events-none"
            style={{
              backgroundImage: 'url(/images/envelope_reveal.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              filter: 'blur(10px)',
            }}
          />
        
          {/* Ambient glow behind envelope */}
          <div className="flex flex-col items-center gap-6 px-6">
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center text-sm font-medium tracking-widest uppercase"
              style={{ color: 'var(--text3)' }}
            >
              You have an unread vibe from
            </motion.p>
            
            <motion.h2
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
              className="text-3xl font-bold text-center"
              style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}
            >
              {creatorName} ✨
            </motion.h2>

            <motion.div
              className="relative cursor-pointer select-none"
              onClick={handleTap}
              animate={phase === 'sealed' ? { y: [0, -8, 0] } : {}}
              transition={{ repeat: Infinity, duration: 2.5, ease: 'easeInOut' }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.97 }}
            >
              <svg width="260" height="180" viewBox="0 0 260 180" fill="none">
                <motion.rect
                  x="10" y="60" width="240" height="110" rx="8"
                  fill="var(--envelope-color)"
                  stroke="var(--accent)"
                  strokeWidth="2"
                />
                <motion.path
                  d="M10 170 L130 110 L250 170Z"
                  fill="var(--surface2)"
                  stroke="var(--accent)"
                  strokeWidth="1"
                />
                <motion.path
                  d="M10 60 L130 110 L250 60Z"
                  fill="var(--surface)"
                  stroke="var(--accent)"
                  strokeWidth="1"
                />
                <motion.path
                  d="M10 60 L130 10 L250 60Z"
                  fill="var(--envelope-flap)"
                  stroke="var(--accent)"
                  strokeWidth="2"
                  animate={phase === 'opening' ? {
                    rotateX: 180,
                    originX: '50%',
                    originY: '0%',
                  } : {}}
                  transition={{ duration: 0.5 }}
                />
                <motion.text
                  x="130" y="42"
                  textAnchor="middle"
                  fontSize="22"
                  animate={phase === 'opening' ? { scale: 0, opacity: 0 } : { scale: 1, opacity: 1 }}
                >
                  💌
                </motion.text>
              </svg>

              <motion.div
                className="absolute inset-0 rounded-full pointer-events-none"
                animate={{ boxShadow: ['0 0 20px var(--glow)', '0 0 60px var(--glow)', '0 0 20px var(--glow)'] }}
                transition={{ repeat: Infinity, duration: 1.5 }}
              />
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="text-sm"
              style={{ color: 'var(--accent)' }}
            >
              {phase === 'sealed' ? '✨ Tap to rip open' : '🎉 Opening...'}
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
