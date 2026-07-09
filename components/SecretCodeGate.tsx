'use client';
import { motion } from 'framer-motion';
import { useState, useRef } from 'react';
import confetti from 'canvas-confetti';

interface SecretCodeGateProps {
  cardId: string;
  unlockQuestion?: string;
  onUnlock: () => void;
}

export default function SecretCodeGate({ cardId, unlockQuestion, onUnlock }: SecretCodeGateProps) {
  const [input, setInput] = useState('');
  const [shake, setShake] = useState(false);
  const [, setAttempts] = useState(0);
  const [hint, setHint] = useState('');
  const [checking, setChecking] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const isNumeric = !unlockQuestion;

  const handleSubmit = async () => {
    if (!input.trim() || checking) return;
    setChecking(true);

    const res = await fetch(`/api/cards/${cardId}/unlock`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code: input }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.unlock_token) {
        localStorage.setItem(`unlock_token_${cardId}`, data.unlock_token);
      }
      confetti({ particleCount: 80, spread: 80, origin: { y: 0.6 } });
      onUnlock();
    } else {
      setAttempts((p) => {
        const next = p + 1;
        if (next >= 3) setHint('Psst... ask them for the code.');
        return next;
      });
      setShake(true);
      setInput('');
      setTimeout(() => setShake(false), 600);
      inputRef.current?.focus();
    }
    setChecking(false);
  };

  return (
    <motion.div
      className="fixed inset-0 z-50 flex items-center justify-center"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{ background: 'rgba(0,0,0,0.9)', backdropFilter: 'blur(12px)' }}
    >
      <motion.div
        className="flex flex-col items-center gap-6 p-8 rounded-3xl max-w-sm w-full mx-4"
        style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
        initial={{ scale: 0.8, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      >
        <motion.div
          animate={{ rotate: [0, -10, 10, -10, 10, 0] }}
          transition={{ repeat: Infinity, duration: 3, repeatDelay: 2 }}
          className="text-5xl"
        >
          🔐
        </motion.div>

        <div className="text-center">
          <h3 className="text-xl font-bold mb-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            This one&apos;s locked.
          </h3>
          {unlockQuestion && (
            <p className="text-sm mb-2" style={{ color: 'var(--accent)' }}>
              {unlockQuestion}
            </p>
          )}
          <p className="text-xs" style={{ color: 'var(--text3)' }}>
            {isNumeric ? 'Enter the PIN to open it.' : 'Type the answer to open it.'}
          </p>
        </div>

        <motion.div
          animate={shake ? { x: [-8, 8, -8, 8, -4, 4, 0] } : {}}
          transition={{ duration: 0.5 }}
          className="w-full"
        >
          {isNumeric ? (
            // PIN dots display
            <div className="flex justify-center gap-3 mb-4">
              {[0, 1, 2, 3].map((i) => (
                <motion.div
                  key={i}
                  className="w-12 h-14 rounded-xl flex items-center justify-center text-2xl font-bold"
                  style={{
                    background: 'var(--surface2)',
                    border: `2px solid ${input.length > i ? 'var(--accent)' : 'var(--border)'}`,
                    color: 'var(--text)',
                  }}
                  animate={input.length > i ? { scale: [0.8, 1.1, 1] } : {}}
                >
                  {input.length > i ? '•' : ''}
                </motion.div>
              ))}
            </div>
          ) : (
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && void handleSubmit()}
              placeholder="Write your answer..."
              className="w-full px-4 py-3 rounded-xl text-center text-base outline-none mb-4"
              style={{
                background: 'var(--surface2)',
                border: '2px solid var(--border)',
                color: 'var(--text)',
              }}
            />
          )}

          {/* Numeric keypad */}
          {isNumeric && (
            <div className="grid grid-cols-3 gap-2">
              {[1,2,3,4,5,6,7,8,9,'',0,'⌫'].map((k, i) => (
                <motion.button
                  key={i}
                  whileTap={{ scale: 0.9 }}
                  onClick={() => {
                    if (k === '⌫') setInput((p) => p.slice(0, -1));
                    else if (k === '') return;
                    else if (input.length < 4) setInput((p) => p + String(k));
                  }}
                  className="h-12 rounded-xl font-bold text-lg"
                  style={{
                    background: k === '' ? 'transparent' : 'var(--surface2)',
                    color: 'var(--text)',
                    border: k === '' ? 'none' : '1px solid var(--border)',
                    cursor: k === '' ? 'default' : 'pointer',
                  }}
                >
                  {k}
                </motion.button>
              ))}
            </div>
          )}
        </motion.div>

        {hint && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-center"
            style={{ color: 'var(--accent2)' }}
          >
            {hint}
          </motion.p>
        )}

        {shake && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="text-xs"
            style={{ color: '#ff4444' }}
          >
            That&apos;s not it - give it another try.
          </motion.p>
        )}

        <motion.button
          onClick={() => void handleSubmit()}
          whileTap={{ scale: 0.95 }}
          whileHover={{ scale: 1.03 }}
          disabled={!input || checking}
          className="w-full py-3 rounded-xl font-bold text-white"
          style={{
            background: input && !checking ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'var(--surface2)',
            boxShadow: input ? '0 8px 30px var(--glow)' : 'none',
            transition: 'all 0.2s ease',
          }}
        >
          {checking ? 'Checking...' : 'Open card'}
        </motion.button>
      </motion.div>
    </motion.div>
  );
}
