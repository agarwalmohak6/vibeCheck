'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useRef } from 'react';
import { TEMPLATE_RUNAWAY_TEXTS } from '@/lib/themes';
import confetti from 'canvas-confetti';
import MemeRejection from '@/components/MemeRejection';

interface RunawayButtonProps {
  onYes: () => void;
  memeMode?: boolean;
  templateType?: string;
  compact?: boolean;
}

const FAREWELL_MESSAGES = [
  { text: 'Abba Nahi Maanenge! 🙅‍♂️', color: '#FF3D00' },
  { text: 'Main Ja Raha Hun 😤', color: '#FF2E93' },
  { text: 'Nahi Milega Itna Achha! 💅', color: '#a855f7' },
  { text: 'Log Kya Kahenge? 👀', color: '#FFD700' },
  { text: 'Theek Hai Phir 😒', color: '#06b6d4' },
];

const DODGE_LIMIT = 5; // After this many dodges, NO disappears

export default function RunawayButton({
  onYes,
  memeMode = false,
  templateType = 'shoot_shot',
  compact = false,
}: RunawayButtonProps) {
  const [dodgeCount, setDodgeCount] = useState(0);
  const [noText, setNoText] = useState('No 💔');
  const [noGone, setNoGone] = useState(false);
  const [farewellMsg, setFarewellMsg] = useState<{ text: string; color: string } | null>(null);
  const [yesClicked, setYesClicked] = useState(false);
  const [showRejection, setShowRejection] = useState(false);

  // NO button position — translate from natural flex position
  const [noTranslate, setNoTranslate] = useState({ x: 0, y: 0 });
  const noButtonRef = useRef<HTMLButtonElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  // Timestamp-based throttle: only one dodge per 400ms
  const lastDodgeTime = useRef<number>(0);

  const dodge = () => {
    const now = Date.now();
    if (now - lastDodgeTime.current < 400 || noGone) return;
    lastDodgeTime.current = now;

    setDodgeCount((prev) => {
      const next = prev + 1;
      const texts = TEMPLATE_RUNAWAY_TEXTS[templateType] || TEMPLATE_RUNAWAY_TEXTS['shoot_shot'];
      setNoText(texts[next % texts.length]);

      if (next >= DODGE_LIMIT) {
        // Final dodge — fly off and disappear
        const farewell = FAREWELL_MESSAGES[Math.floor(Math.random() * FAREWELL_MESSAGES.length)];
        setFarewellMsg(farewell);
        // Fly far off screen before disappearing
        setNoTranslate({ x: 300, y: -200 });
        setTimeout(() => {
          setNoGone(true);
          // Clear farewell after 2.5s
          setTimeout(() => setFarewellMsg(null), 2500);
        }, 600);
        return next;
      }

      // Normal dodge: move within safe bounded area
      const container = containerRef.current;
      if (container) {
        const cW = container.offsetWidth;
        const btnW = noButtonRef.current?.offsetWidth || 80;
        const maxX = (cW / 2) - (btnW / 2) - 8;
        const maxY = 28;
        const newX = (Math.random() * 2 - 1) * maxX;
        const newY = (Math.random() * 2 - 1) * maxY;
        setNoTranslate({ x: newX, y: newY });
      }
      return next;
    });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    const btn = noButtonRef.current;
    if (!btn || noGone) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (Math.hypot(e.clientX - cx, e.clientY - cy) < 65) dodge();
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    const btn = noButtonRef.current;
    if (!btn || noGone || !e.touches[0]) return;
    const rect = btn.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    if (Math.hypot(e.touches[0].clientX - cx, e.touches[0].clientY - cy) < 65) dodge();
  };

  const handleYes = () => {
    setYesClicked(true);
    const colors = ['#FACC15', '#FF2E93', '#a855f7', '#00FF66', '#ffffff'];
    confetti({ particleCount: 180, spread: 150, origin: { y: 0.5 }, colors });
    setTimeout(() => confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 }, colors, angle: 60 }), 200);
    setTimeout(() => confetti({ particleCount: 100, spread: 90, origin: { y: 0.6 }, colors, angle: 120 }), 400);
    setTimeout(() => onYes(), 500);
  };

  const handleNoClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (memeMode) setShowRejection(true);
    else dodge();
  };

  const py = compact ? 'py-2.5' : 'py-3';
  const px = compact ? 'px-5' : 'px-7';
  const fontSize = compact ? 'text-sm' : 'text-base';

  return (
    <div
      ref={containerRef}
      className="relative w-full"
      onMouseMove={handleMouseMove}
      onTouchMove={handleTouchMove}
    >
      {/* Button row — visible overflow so YES can grow massive without clipping */}
      <div
        className="flex items-center justify-center gap-3 w-full"
        style={{ minHeight: compact ? 52 : 60, position: 'relative' }}
      >
        {/* YES — grows larger and slides to center after dodges */}
        <motion.button
          layout
          onClick={handleYes}
          disabled={yesClicked}
          animate={yesClicked
            ? { scale: [1, 1.4, 0], opacity: [1, 1, 0] }
            : {
                scale: noGone ? [1.6, 1.7, 1.6] : Math.min(1.6, 1 + dodgeCount * 0.15),
                boxShadow: noGone ? ['0 0 20px var(--glow)', '0 0 40px var(--glow)', '0 0 20px var(--glow)'] : 'none'
              }
          }
          transition={{
            layout: { type: 'spring', stiffness: 300, damping: 25 },
            duration: noGone && !yesClicked ? 0.8 : 0.3,
            repeat: noGone && !yesClicked ? Infinity : 0
          }}
          whileHover={{ scale: Math.min(1.6, 1 + dodgeCount * 0.15) + 0.05 }}
          whileTap={{ scale: 0.93 }}
          className={`theme-btn ${py} ${px} rounded-2xl font-black ${fontSize} shadow-xl select-none cursor-pointer shrink-0 relative z-20`}
        >
          YES 💖
        </motion.button>

        {/* NO — starts in flex row, becomes absolute on first dodge so YES can center */}
        <AnimatePresence>
          {!noGone && (
            <motion.button
              layout
              ref={noButtonRef}
              onClick={handleNoClick}
              animate={{
                x: dodgeCount > 0 ? noTranslate.x : 0,
                y: dodgeCount > 0 ? noTranslate.y : 0
              }}
              exit={{ x: 300, y: -200, opacity: 0, scale: 0.3, rotate: 30 }}
              transition={{ type: 'spring', stiffness: 350, damping: 15 }}
              whileTap={{ scale: 0.9 }}
              className={`${py} px-4 rounded-2xl font-bold text-xs border select-none whitespace-nowrap cursor-not-allowed`}
              style={{
                background: 'var(--surface2)',
                color: 'var(--text3)',
                borderColor: 'var(--border)',
                opacity: Math.max(0.5, 1 - dodgeCount * 0.1),
                position: dodgeCount > 0 ? 'absolute' : 'relative',
                zIndex: 10
              }}
            >
              {noText}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Farewell message — slides in when NO disappears */}
      <AnimatePresence>
        {farewellMsg && (
          <motion.div
            initial={{ opacity: 0, y: 8, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.9 }}
            className="text-center mt-1.5"
          >
            <span
              className="inline-block text-[11px] font-black px-3 py-1 rounded-full"
              style={{ background: farewellMsg.color + '22', color: farewellMsg.color, border: `1px solid ${farewellMsg.color}44` }}
            >
              {farewellMsg.text}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dodge counter */}
      <AnimatePresence>
        {dodgeCount > 0 && !noGone && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-center mt-1"
          >
            <span
              className="text-[9px] font-extrabold px-2 py-0.5 rounded-full"
              style={{ background: 'var(--accent)', color: 'var(--bg)' }}
            >
              {dodgeCount} dodge{dodgeCount > 1 ? 's' : ''} 💀
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hearts on YES */}
      <AnimatePresence>
        {yesClicked && [...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 1, y: 0, scale: 1 }}
            animate={{ opacity: 0, y: -70, scale: 0.4 }}
            transition={{ duration: 0.9, delay: i * 0.07 }}
            className="absolute text-lg pointer-events-none"
            style={{ bottom: '60%', left: `${10 + i * 14}%` }}
          >
            💖
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Rejection Modal */}
      <AnimatePresence>
        {showRejection && <MemeRejection onClose={() => setShowRejection(false)} />}
      </AnimatePresence>
    </div>
  );
}
