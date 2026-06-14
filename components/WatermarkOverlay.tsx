'use client';
import { motion } from 'framer-motion';
import { useEffect } from 'react';

export default function WatermarkOverlay() {
  // Block screen capture key combos
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      // PrintScreen
      if (e.key === 'PrintScreen') {
        e.preventDefault();
        navigator.clipboard?.writeText('').catch(() => {});
        return;
      }
      // Ctrl+P / Cmd+P (print)
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        return;
      }
      // Cmd+Shift+4 (macOS screenshot)
      if (e.metaKey && e.shiftKey && e.key === '4') {
        e.preventDefault();
        return;
      }
      // Cmd+Shift+3 (macOS full screenshot)
      if (e.metaKey && e.shiftKey && e.key === '3') {
        e.preventDefault();
        return;
      }
      // F12 / DevTools
      if (e.key === 'F12') {
        e.preventDefault();
        return;
      }
      // Ctrl+Shift+I
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'I') {
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  const watermarkText = 'VibeCheck Private Protocol • Capture Prohibited •';
  const rows = 8;

  return (
    <div
      className="fixed inset-0 z-30 overflow-hidden pointer-events-none select-none"
      style={{ mixBlendMode: 'overlay' }}
      aria-hidden="true"
    >
      {[...Array(rows)].map((_, rowIdx) => (
        <motion.div
          key={rowIdx}
          className="absolute whitespace-nowrap text-xs font-mono tracking-widest"
          style={{
            top: `${(rowIdx / rows) * 110 - 5}%`,
            left: '-20%',
            color: 'rgba(255,255,255,0.06)',
            transform: 'rotate(-20deg)',
          }}
          animate={{ x: [0, 20, 0], y: [0, -4, 0] }}
          transition={{
            repeat: Infinity,
            duration: 6 + rowIdx * 0.5,
            ease: 'easeInOut',
            delay: rowIdx * 0.3,
          }}
        >
          {watermarkText.repeat(12)}
        </motion.div>
      ))}
    </div>
  );
}
