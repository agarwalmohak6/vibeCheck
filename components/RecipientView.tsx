'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { Card } from '@/lib/supabase';
import { TEMPLATE_TYPES } from '@/lib/themes';
import EnvelopeReveal from '@/components/EnvelopeReveal';
import RunawayButton from '@/components/RunawayButton';
import VinylDisk from '@/components/VinylDisk';
import SecretCodeGate from '@/components/SecretCodeGate';
import WatermarkOverlay from '@/components/WatermarkOverlay';
import HeartCanvas from '@/components/HeartCanvas';
import AmbientBackground from '@/components/AmbientBackground';
import confetti from 'canvas-confetti';
import { RECIPIENT_STRINGS } from '@/lib/strings';
import FollowUpReplies from './FollowUpReplies';

interface RecipientViewProps {
  card: Card;
}

export default function RecipientView({ card }: RecipientViewProps) {
  const [envelopeOpened, setEnvelopeOpened] = useState(false);
  const [secretUnlocked, setSecretUnlocked] = useState(!card.card_data.unlock_code);
  const templateMeta = TEMPLATE_TYPES.find(t => t.id === card.template_type);
  const hasRunaway = templateMeta?.hasRunaway || false;

  const [yesClicked, setYesClicked] = useState(false);
  const [isCreator, setIsCreator] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const creatorFlag = localStorage.getItem(`creator_of_${card.id}`);
      const isCreatorParam = new URLSearchParams(window.location.search).get('c') === 'true';
      if (creatorFlag === 'true' || isCreatorParam) {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsCreator(true);
      }
    }
  }, [card.id]);

  const handleEnvelopeOpen = () => {
    setEnvelopeOpened(true);
    // Trigger music using the gestured audio hook exposed globally
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const win = window as Window & typeof globalThis & { __startMusic?: () => void };
        if (win.__startMusic) {
          win.__startMusic();
        }
      }
    }, 100);
  };

  const handleUnlock = () => {
    setSecretUnlocked(true);
    setTimeout(() => {
      if (typeof window !== 'undefined') {
        const win = window as Window & typeof globalThis & { __startMusic?: () => void };
        if (win.__startMusic) {
          win.__startMusic();
        }
      }
    }, 100);
  };

  const handleYes = () => {
    setYesClicked(true);
    const colors = ['#FACC15', '#FF2E93', '#a855f7', '#00FF66', '#ffffff'];
    // Massive blast from bottom
    [0, 200, 400, 600, 800].forEach(d => setTimeout(() =>
      confetti({ particleCount: 200, spread: 180, origin: { y: 1 }, startVelocity: 60, colors }), d));

    // Automatically send an acceptance message to the database
    void fetch('/api/messages', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        card_id: card.id,
        sender: 'recipient',
        text: 'Said YES! 💖'
      })
    });
  };

  return (
    <div
      className="no-capture min-h-screen relative overflow-hidden flex flex-col"
      style={{ background: 'var(--bg)', color: 'var(--text)', fontFamily: 'var(--font-body)' }}
      data-theme={card.theme_selected}
    >
      <WatermarkOverlay />

      {/* Floating hearts canvas background for Soft Coquette theme */}
      {card.theme_selected === 'soft_coquette' && <HeartCanvas />}

      {/* Neon Celebration Morph on Success */}
      <AnimatePresence>
        {yesClicked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 pointer-events-none z-1"
            style={{ background: 'radial-gradient(circle at center, #ff007f 0%, #7928ca 50%, #000000 100%)' }}
          />
        )}
      </AnimatePresence>

      <AmbientBackground />

      {/* Secret code gate */}
      {envelopeOpened && !secretUnlocked && (
        <SecretCodeGate
          unlockCode={card.card_data.unlock_code}
          unlockQuestion={card.card_data.unlock_question}
          onUnlock={handleUnlock}
        />
      )}

      {/* Envelope reveal overlay */}
      {!envelopeOpened && (
        <EnvelopeReveal
          creatorName={card.creator_name}
          theme={card.theme_selected}
          onOpen={handleEnvelopeOpen}
        />
      )}

      {/* Music player (using trackId or fallback musicUrl) */}
      {envelopeOpened && secretUnlocked && (card.music_track_id || card.card_data.music_url) && (
        <VinylDisk
          trackId={card.music_track_id || undefined}
          musicUrl={card.card_data.music_url || undefined}
        />
      )}

      {/* Card content */}
      <AnimatePresence>
        {envelopeOpened && secretUnlocked && (
          <motion.main
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-lg w-full mx-auto px-4 py-10 flex flex-col gap-6 relative z-10"
          >
            {/* Header badge */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring' }}
              className="text-center"
            >
              <div
                className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-bold shadow-md"
                style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))', color: 'var(--bg)' }}
              >
                {templateMeta?.label} · from {card.creator_name}
              </div>
            </motion.div>

            {/* Cover image (Compressed WebP base64 or raw URL) */}
            {card.card_data.cover_image_url && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="rounded-3xl overflow-hidden shadow-xl border border-white/5 bg-black/20 flex justify-center"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={card.card_data.cover_image_url}
                  alt="Cover"
                  className="w-full h-auto max-h-[450px] object-contain rounded-3xl mx-auto block"
                  draggable={false}
                />
              </motion.div>
            )}

            {/* Main card text */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4 }}
              className="rounded-3xl p-6 glow-border"
              style={{ background: 'var(--surface)' }}
            >
              <h1
                className="text-4xl sm:text-5xl lg:text-6xl font-black mb-6 capitalize tracking-tight drop-shadow-lg"
                style={{
                  fontFamily: 'var(--font-display)',
                  color: 'var(--accent)',
                  filter: 'drop-shadow(0px 8px 16px rgba(0,0,0,0.6))'
                }}
              >
                {card.card_data.message_title}
              </h1>
              <p className="text-lg leading-relaxed whitespace-pre-wrap font-medium first-letter:uppercase first-letter:text-2xl first-letter:font-bold" style={{ color: 'var(--text2)' }}>
                {card.card_data.main_body}
              </p>
            </motion.div>

            {/* GIF */}
            {card.card_data.gif_url && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="rounded-2xl overflow-hidden shadow-lg border border-white/5"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={card.card_data.gif_url} alt="GIF" className="w-full" draggable={false} />
              </motion.div>
            )}

            {/* Runaway button or YES success */}
            {hasRunaway && !yesClicked && !isCreator && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="rounded-3xl p-5"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)' }}
              >
                <p className="text-sm font-bold mb-1 text-center" style={{ color: 'var(--text)' }}>
                  {RECIPIENT_STRINGS.SO_WHAT_DO_YOU_SAY}
                </p>
                <p className="text-xs text-center mb-4" style={{ color: 'var(--text3)' }}>
                  {RECIPIENT_STRINGS.NO_BUTTON_WARNING}
                </p>
                <RunawayButton
                  onYes={handleYes}
                  memeMode={card.template_type === 'shoot_shot'}
                  templateType={card.template_type}
                />
              </motion.div>
            )}

            {/* Creator Follow-Up replies list (when YES not clicked yet) */}
            {isCreator && !yesClicked && (
              <FollowUpReplies card={card} isCreator={true} />
            )}

            {/* YES success state */}
            <AnimatePresence>
              {yesClicked && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.8, y: 50 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ type: "spring", stiffness: 200, damping: 20 }}
                  className="rounded-3xl p-8 text-center glass glow-border relative z-20"
                >
                  <motion.div
                    animate={{ scale: [1, 1.3, 1], rotate: [0, 5, -5, 0] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="text-6xl mb-6"
                  >
                    {RECIPIENT_STRINGS.SUCCESS_EMOJI}
                  </motion.div>
                  <h2
                    className="text-3xl md:text-4xl font-black mb-4 capitalize tracking-tighter"
                    style={{
                      fontFamily: 'var(--font-display)',
                      backgroundImage: 'linear-gradient(135deg, #00FF66, #00ccff)',
                      backgroundSize: 'cover',
                      WebkitBackgroundClip: 'text',
                      color: 'transparent',
                      filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.4))'
                    }}
                  >
                    {RECIPIENT_STRINGS.SUCCESS_HEADING}
                  </h2>
                  <p className="text-base font-bold text-white shadow-sm leading-relaxed mb-6" style={{ textShadow: '0 2px 10px rgba(0,0,0,0.8)' }}>
                    {RECIPIENT_STRINGS.SUCCESS_SUBTEXT}
                  </p>
                  
                  {/* Follow-up Replies for Recipient */}
                  <FollowUpReplies card={card} isCreator={false} />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="text-center py-4 mt-6"
            >
              <p className="text-xs font-semibold" style={{ color: 'var(--text3)' }}>
                {RECIPIENT_STRINGS.FOOTER_MADE_WITH}
                <Link href="/" style={{ color: 'var(--accent)' }} className="font-bold underline hover:opacity-80">
                  {RECIPIENT_STRINGS.FOOTER_LINK}
                </Link>
                {RECIPIENT_STRINGS.FOOTER_SUFFIX}
              </p>
            </motion.div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}
