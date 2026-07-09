'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import confetti from 'canvas-confetti';
import WaxSeal from '@/components/WaxSeal';

interface EnvelopeRevealProps {
  creatorName: string;
  recipientName?: string;
  templateType?: string;
  gifUrl?: string;
  onOpen: () => void;
  theme?: string;
}

const REVEAL_WITH_CAMEO_MS = 2600;
const REVEAL_DEFAULT_MS = 1250;

const ENVELOPE_MOMENTS: Record<string, {
  icon: string;
  title: string;
  hint: (recipientName: string) => string;
  messages: string[];
}> = {
  maan_jao: {
    icon: '🥺',
    title: 'A softer sorry is waiting',
    hint: (recipientName) => `Made gently for ${recipientName}. No forwarded energy here.`,
    messages: ['I am sorry', 'one honest chance', 'no excuses', 'please hear me out', 'made just for you'],
  },
  birthday_roast: {
    icon: '🎂',
    title: 'Birthday chaos inside',
    hint: (recipientName) => `A private birthday moment for ${recipientName}, with cake-level effort.`,
    messages: ['happy birthday', 'cake first', 'main character day', 'one wish pending', 'party starts here'],
  },
  bestie_check: {
    icon: '🍹',
    title: 'Bestie hotline unlocked',
    hint: (recipientName) => `A tiny private chaos room for ${recipientName}.`,
    messages: ['bestie check', 'no refunds', 'inside jokes only', 'you are my person', 'drinks soon?'],
  },
  shoot_shot: {
    icon: '💌',
    title: 'A brave little letter',
    hint: (recipientName) => `A private confession made only for ${recipientName}.`,
    messages: ['just us', 'say it properly', 'soft launch?', 'one real chance', 'heart doing things'],
  },
  netflix_chill: {
    icon: '🍿',
    title: 'Movie-night invite inside',
    hint: (recipientName) => `A cozy plan for ${recipientName}, snacks emotionally included.`,
    messages: ['movie night', 'snacks ready', 'blanket reserved', 'press play?', 'no boring picks'],
  },
};

export default function EnvelopeReveal({
  creatorName,
  recipientName = 'you',
  templateType = 'maan_jao',
  gifUrl,
  onOpen,
  theme,
}: EnvelopeRevealProps) {
  const [phase, setPhase] = useState<'sealed' | 'opening' | 'open'>('sealed');
  const hasOpened = useRef(false);
  const moment = ENVELOPE_MOMENTS[templateType] || ENVELOPE_MOMENTS.maan_jao;

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
    }, gifUrl ? REVEAL_WITH_CAMEO_MS : REVEAL_DEFAULT_MS);
  };

  // 1. Desi Festive Royal Wax Seal envelope
  if (theme === 'desi_festive') {
    return (
      <AnimatePresence>
        {phase !== 'open' && (
          <motion.div
            className="vc-envelope-overlay vc-envelope-overlay--festive fixed inset-0 z-50 flex items-center justify-center overflow-hidden"
            exit={{ opacity: 0, scale: 0.8 }}
            transition={{ duration: 0.6 }}
          >
            <EnvelopeMomentLayer messages={moment.messages} icon={moment.icon} />
            <RevealGifCameo gifUrl={gifUrl} phase={phase} icon={moment.icon} />
            <div className="flex flex-col items-center gap-6 px-6">
              <motion.p
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="text-center text-xs font-bold tracking-widest uppercase text-amber-500 font-serif"
              >
                A private card from
              </motion.p>
              
              <motion.h2
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.4, type: 'spring', stiffness: 200 }}
                className="text-3xl font-serif font-black text-center drop-shadow-[0_4px_12px_rgba(250,204,21,0.25)]"
                style={{ color: 'var(--accent)' }}
              >
                {creatorName}
              </motion.h2>

              <div className="vc-envelope-moment-copy">
                <span>{moment.icon}</span>
                <strong>{moment.title}</strong>
                <p>{moment.hint(recipientName)}</p>
              </div>

              {/* Crimson Envelope Card box */}
              <motion.div
                className="vc-envelope-seal-box relative w-[280px] h-[200px] rounded-2xl shadow-2xl flex items-center justify-center overflow-hidden"
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
                className="text-xs font-serif tracking-wider"
                style={{ color: 'var(--accent)' }}
              >
                {phase === 'sealed' ? 'Tap the seal to open' : 'Opening your card...'}
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
          className="vc-envelope-overlay fixed inset-0 z-50 flex flex-col items-center justify-center p-6 overflow-hidden"
        >
          <EnvelopeMomentLayer messages={moment.messages} icon={moment.icon} />
          <RevealGifCameo gifUrl={gifUrl} phase={phase} icon={moment.icon} />
          {/* Cinematic Backdrop Image */}
          <div 
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage: 'url(/images/envelope_reveal.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
            }}
          />
        
          {/* Ambient glow behind envelope */}
          <div className="vc-envelope-card flex flex-col items-center gap-6 px-6">
            <motion.p
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="text-center text-sm font-medium tracking-widest uppercase"
              style={{ color: 'var(--text3)' }}
            >
              You have a private card from
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
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
              className="vc-envelope-moment-copy"
            >
              <span>{moment.icon}</span>
              <strong>{moment.title}</strong>
              <p>{moment.hint(recipientName)}</p>
            </motion.div>

            <motion.button
              type="button"
              aria-label={`Open private card from ${creatorName}`}
              className="vc-envelope-button relative cursor-pointer select-none"
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
            </motion.button>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ repeat: Infinity, duration: 1.8 }}
              className="text-sm"
              style={{ color: 'var(--accent)' }}
            >
              {phase === 'sealed' ? 'Tap to open the envelope' : 'Opening your card...'}
            </motion.p>

            <p className="vc-envelope-hint">
              A private note. A few tiny questions. One honest answer.
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function EnvelopeMomentLayer({ messages, icon }: { messages: string[]; icon: string }) {
  return (
    <div className="vc-envelope-moment-layer" aria-hidden>
      <span className="vc-envelope-orb vc-envelope-orb--one" />
      <span className="vc-envelope-orb vc-envelope-orb--two" />
      <span className="vc-envelope-orb vc-envelope-orb--three" />
      {messages.map((message, index) => (
        <motion.span
          key={`${message}-${index}`}
          className={`vc-envelope-note vc-envelope-note--${index + 1}`}
          initial={{ opacity: 0, y: 18, rotate: index % 2 ? 5 : -5 }}
          animate={{ opacity: 1, y: [0, -8, 0], rotate: index % 2 ? [5, 2, 5] : [-5, -2, -5] }}
          transition={{ delay: 0.2 + index * 0.08, duration: 5 + index * 0.35, repeat: Infinity, ease: 'easeInOut' }}
        >
          <em>{icon}</em>
          {message}
        </motion.span>
      ))}
    </div>
  );
}

function RevealGifCameo({
  gifUrl,
  phase,
  icon,
}: {
  gifUrl?: string;
  phase: 'sealed' | 'opening' | 'open';
  icon: string;
}) {
  return (
    <AnimatePresence>
      {gifUrl && phase === 'opening' && (
        <motion.div
          className="vc-envelope-gif-cameo"
          initial={{ opacity: 0, scale: 0.42, rotateY: -82, rotate: -7, y: 24 }}
          animate={{
            opacity: [0, 1, 1, 1, 0],
            scale: [0.42, 1.08, 1, 1, 0.86],
            rotateY: [-82, 16, 0, 0, 12],
            rotate: [-7, 2, 0, 0, -2],
            y: [24, -14, -18, -18, -36],
          }}
          exit={{ opacity: 0, scale: 0.72, y: -48 }}
          transition={{ duration: 2.35, times: [0, 0.18, 0.38, 0.78, 1], ease: [0.2, 0.72, 0.2, 1] }}
          aria-hidden
        >
          <span className="vc-envelope-gif-cameo__spark vc-envelope-gif-cameo__spark--one">{icon}</span>
          <span className="vc-envelope-gif-cameo__spark vc-envelope-gif-cameo__spark--two">✦</span>
          <span className="vc-envelope-gif-cameo__spark vc-envelope-gif-cameo__spark--three">♡</span>
          <div className="vc-envelope-gif-cameo__frame">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gifUrl} alt="" draggable={false} />
          </div>
          <p>one tiny reaction first</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
