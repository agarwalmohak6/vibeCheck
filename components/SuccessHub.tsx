'use client';
import { motion } from 'framer-motion';
import { useState } from 'react';
import confetti from 'canvas-confetti';
import { whatsappLink } from '@/lib/utils';

interface SuccessHubProps {
  cardId: string;
  recipientName: string;
  creatorName: string;
}

export default function SuccessHub({ cardId, recipientName, creatorName }: SuccessHubProps) {
  const [copied, setCopied] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const cardUrl = `${baseUrl}/card/${cardId}`;
  const waLink = whatsappLink(cardUrl, creatorName, recipientName);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(cardUrl);
    setCopied(true);
    confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="flex flex-col items-center gap-8 py-12 px-8 max-w-lg mx-auto text-center glass glow-border rounded-[2.5rem] relative z-10"
    >
      {/* Celebration icon */}
      <motion.div
        animate={{ rotate: [0, 15, -15, 10, -10, 0], scale: [1, 1.2, 1] }}
        transition={{ duration: 0.8, delay: 0.3 }}
        className="text-7xl"
      >
        🎉
      </motion.div>

      <div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="text-4xl md:text-5xl font-black mb-4 capitalize tracking-tighter"
          style={{ 
            fontFamily: 'var(--font-display)',
            backgroundImage: 'linear-gradient(135deg, var(--accent), var(--accent2))',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            color: 'transparent',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.4))'
          }}
        >
          Your card is live! ✨
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm"
          style={{ color: 'var(--text3)' }}
        >
          Share this with {recipientName} and watch the magic unfold 💌
        </motion.p>
      </div>

      {/* URL display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full rounded-2xl p-4"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text3)' }}>Your card link 🔗</p>
        <p className="text-sm font-mono break-all" style={{ color: 'var(--accent)' }}>{cardUrl}</p>
      </motion.div>

      {/* Creator link display */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="w-full rounded-2xl p-4 bg-white/5 border border-white/10"
      >
        <p className="text-xs mb-2 font-medium text-neutral-400">To check replies on another device (or phone) 📱</p>
        <p className="text-xs font-mono break-all" style={{ color: 'var(--accent2)' }}>{cardUrl}?c=true</p>
        <button
          onClick={() => {
            void navigator.clipboard.writeText(`${cardUrl}?c=true`);
            alert('Creator replies link copied! Open this on your phone/other device to check responses.');
          }}
          className="mt-2 text-[10px] font-bold text-neutral-300 hover:text-white underline cursor-pointer"
        >
          Copy Creator Link
        </button>
      </motion.div>

      {/* Actions */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="flex flex-col sm:flex-row gap-3 w-full"
      >
        {/* Copy button */}
        <motion.button
          onClick={handleCopy}
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className="flex-1 py-4 rounded-2xl font-bold text-white relative overflow-hidden"
          style={{
            background: copied
              ? 'linear-gradient(135deg, #10b981, #059669)'
              : 'linear-gradient(135deg, var(--accent), var(--accent2))',
            boxShadow: '0 8px 30px var(--glow)',
            transition: 'all 0.3s ease',
          }}
        >
          {copied ? '✅ Copied!' : '📋 One-Tap Copy'}
        </motion.button>

        {/* WhatsApp CTA */}
        <motion.a
          href={waLink}
          target="_blank"
          rel="noopener noreferrer"
          whileTap={{ scale: 0.96 }}
          whileHover={{ scale: 1.02 }}
          className="flex-1 py-4 rounded-2xl font-bold text-white text-center flex items-center justify-center gap-2"
          style={{
            background: 'linear-gradient(135deg, #25D366, #128C7E)',
            boxShadow: '0 8px 30px rgba(37, 211, 102, 0.4)',
          }}
        >
          <span className="text-xl">📱</span>
          Send via WhatsApp
        </motion.a>
      </motion.div>

      {/* Tip */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-xs"
        style={{ color: 'var(--text3)' }}
      >
        💡 The link works on any device. No app needed — pure magic 🪄
      </motion.p>
    </motion.div>
  );
}
