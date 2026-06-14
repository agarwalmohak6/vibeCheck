'use client';
import { motion } from 'framer-motion';
import { Card } from '@/lib/supabase';
import { useState } from 'react';

export default function ExpiredView({ card }: { card: Card }) {
  const [paying, setPaying] = useState(false);
  const [done, setDone] = useState(false);

  const handleExtend = async () => {
    setPaying(true);
    await new Promise(r => setTimeout(r, 2000));
    const newExpiry = new Date();
    newExpiry.setHours(newExpiry.getHours() + 72);
    await fetch('/api/payment/webhook', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ card_id: card.id, payment_id: `extend_${Date.now()}`, extends_at: newExpiry.toISOString() }),
    });
    setPaying(false);
    setDone(true);
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <main className="min-h-screen flex items-center justify-center px-6" style={{ background: 'var(--bg)' }}>
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }}
        className="max-w-sm w-full text-center flex flex-col items-center gap-6">
        <motion.div animate={{ rotate: [0, -10, 10, 0] }} transition={{ repeat: Infinity, duration: 3 }}
          className="text-6xl">⏰</motion.div>
        <div>
          <h1 className="text-2xl font-black mb-3" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>
            This magic link has expired
          </h1>
          <p className="text-sm leading-relaxed" style={{ color: 'var(--text3)' }}>
            The feelings shouldn&apos;t have to vanish. Extend this card&apos;s life for another 3 days for just <strong style={{ color: 'var(--accent)' }}>₹50</strong>.
          </p>
        </div>
        {done ? (
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-4xl">🎉</motion.div>
        ) : (
          <motion.button onClick={handleExtend} disabled={paying}
            whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}
            className="w-full py-4 rounded-2xl font-black text-white text-lg"
            style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', boxShadow: '0 8px 30px var(--glow)' }}>
            {paying ? '⏳ Processing...' : '💳 Extend for ₹50 →'}
          </motion.button>
        )}
        <p className="text-xs" style={{ color: 'var(--text3)' }}>
          Card from <strong style={{ color: 'var(--accent)' }}>{card.creator_name}</strong> to {card.recipient_name}
        </p>
      </motion.div>
    </main>
  );
}
