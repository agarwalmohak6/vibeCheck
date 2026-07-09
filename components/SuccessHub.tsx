'use client';

import { motion } from 'framer-motion';
import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import confetti from 'canvas-confetti';
import { whatsappLink } from '@/lib/utils';
import type { ChatMessageDTO, TrackerEvent } from '@/types/vibecheck';

interface SuccessHubProps {
  cardId: string;
  recipientName: string;
  creatorName: string;
  creatorToken?: string;
}

export default function SuccessHub({ cardId, recipientName, creatorName, creatorToken }: SuccessHubProps) {
  const [copied, setCopied] = useState(false);
  const [creatorCopied, setCreatorCopied] = useState(false);
  const [roomCopied, setRoomCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [activity, setActivity] = useState<ChatMessageDTO[]>([]);
  const [showCreatorLink, setShowCreatorLink] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const cardUrl = `${baseUrl}/card/${cardId}`;
  const creatorUrl = creatorToken ? `${cardUrl}?ct=${encodeURIComponent(creatorToken)}` : cardUrl;
  const creatorRoomUrl = creatorToken
    ? `${cardUrl}?ct=${encodeURIComponent(creatorToken)}&room=chat`
    : `${cardUrl}?room=chat`;
  const waLink = whatsappLink(cardUrl, creatorName, recipientName);

  const copyText = async (text: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }

    const textarea = document.createElement('textarea');
    textarea.value = text;
    textarea.setAttribute('readonly', '');
    textarea.style.position = 'fixed';
    textarea.style.opacity = '0';
    document.body.appendChild(textarea);
    textarea.select();
    document.execCommand('copy');
    document.body.removeChild(textarea);
  };

  const eventToLog = useCallback((event: TrackerEvent): ChatMessageDTO => {
    const textByType: Record<string, string> = {
      envelope_opened: event.metadata?.gated
        ? 'Opened Envelope (facing Secret Gate)'
        : 'Opened Envelope & Card!',
      passcode_unlocked: 'Unlocked Secret Gate',
      passcode_failed: 'Tried the wrong passcode',
      story_answered: `Answered "${String(event.metadata?.question || 'a story question')}" with "${String(event.metadata?.answer || '')}"`,
      runaway_dodged: `Tried to click "${String(event.metadata?.label || 'No')}" (Dodge #${String(event.metadata?.dodge_count || 1)})`,
      cta_accepted: `Clicked "${String(event.metadata?.label || 'YES')}"`,
      card_viewed: 'Viewed the card',
    };

    return {
      id: event.id,
      card_id: event.card_id,
      sender: 'recipient',
      text: textByType[event.event_type] || event.event_type,
      created_at: event.created_at,
    };
  }, []);

  const fetchActivity = useCallback(async () => {
    try {
      const [messagesRes, eventsRes] = await Promise.all([
        fetch(`/api/messages?card_id=${cardId}`),
        creatorToken
          ? fetch(`/api/cards/${cardId}/events`, { headers: { 'x-vibecheck-creator-token': creatorToken } })
          : Promise.resolve(null),
      ]);
      const messages: ChatMessageDTO[] = messagesRes.ok ? await messagesRes.json() : [];
      const events: TrackerEvent[] = eventsRes && eventsRes.ok ? await eventsRes.json() : [];
      setActivity([...messages, ...events.map(eventToLog)].sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()));
    } catch (err) {
      console.error('Failed to load activity:', err);
    }
  }, [cardId, creatorToken, eventToLog]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchActivity();
    const interval = setInterval(fetchActivity, 3000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  const handleCopy = async () => {
    try {
      await copyText(cardUrl);
      setCopyError(false);
      setCopied(true);
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopyError(true);
    }
  };

  const handleCreatorCopy = async () => {
    try {
      await copyText(creatorUrl);
      setCopyError(false);
      setCreatorCopied(true);
      setTimeout(() => setCreatorCopied(false), 2500);
    } catch {
      setCopyError(true);
    }
  };

  const handleRoomCopy = async () => {
    try {
      await copyText(creatorRoomUrl);
      setCopyError(false);
      setRoomCopied(true);
      setTimeout(() => setRoomCopied(false), 2500);
    } catch {
      setCopyError(true);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="vc-success-hub flex flex-col items-center gap-8 py-12 px-8 max-w-5xl mx-auto text-center glass glow-border rounded-[2.5rem] relative z-10"
    >
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
            filter: 'drop-shadow(0px 4px 8px rgba(0,0,0,0.4))',
          }}
        >
          Your VibeCheck is ready.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm"
          style={{ color: 'var(--text3)' }}
        >
          Here&apos;s your private link for {recipientName}. Send it when the moment is right.
        </motion.p>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="w-full rounded-2xl p-4"
        style={{ background: 'var(--surface2)', border: '1px solid var(--border)' }}
      >
        <p className="text-xs mb-2 font-medium" style={{ color: 'var(--text2)' }}>Private link</p>
        <p className="text-sm font-mono break-all font-bold select-all" style={{ color: 'var(--accent)' }}>{cardUrl}</p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.8 }}
        className="vc-success-creator-card w-full rounded-2xl p-4 text-left"
      >
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-xs mb-1 font-black uppercase tracking-widest" style={{ color: 'var(--accent)' }}>
              Creator dashboard
            </p>
            <p className="text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
              Keep this private. It lets you see opens, passcode attempts, story answers, and replies.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreatorLink((value) => !value)}
            className="shrink-0 rounded-full px-3 py-1.5 text-[10px] font-black uppercase tracking-widest"
          >
            {showCreatorLink ? 'Hide' : 'Show'}
          </button>
        </div>
        {showCreatorLink && (
          <div className="vc-success-private-link mt-3 rounded-xl p-3">
            <p className="text-[10px] font-bold mb-1" style={{ color: 'var(--text3)' }}>
              Private creator link
            </p>
            <p className="text-xs font-mono break-all select-all" style={{ color: 'var(--text)' }}>{creatorUrl}</p>
          </div>
        )}
        <button
          onClick={() => void handleCreatorCopy()}
          className="mt-3 text-[10px] font-black uppercase tracking-widest underline underline-offset-4 cursor-pointer"
          style={{ color: 'var(--accent)' }}
        >
          {creatorCopied ? 'Creator link copied' : 'Copy creator link'}
        </button>

        <div className="vc-success-room-actions mt-4">
          <div>
            <p>Private chat room</p>
            <span>Use this in-app room to reply until the card expires.</span>
          </div>
          <Link href={creatorRoomUrl}>
            Open room
          </Link>
          <button
            type="button"
            onClick={() => void handleRoomCopy()}
          >
            {roomCopied ? 'Room link copied' : 'Copy room link'}
          </button>
        </div>
      </motion.div>

      {copyError && (
        <p role="status" className="text-[11px] font-bold text-amber-300 -mt-5">
          Copy did not auto-complete. Long-press the link above and copy it manually.
        </p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="vc-success-actions flex flex-col sm:flex-row gap-3 w-full"
      >
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
          {copied ? 'Copied' : 'Copy link'}
        </motion.button>

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
          Share on WhatsApp
        </motion.a>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="vc-success-activity w-full rounded-3xl p-6 text-left glow-border"
        style={{ background: 'var(--surface)' }}
      >
        <div className="flex justify-between items-center mb-4 pb-2 border-b border-white/5">
          <h3 className="text-sm font-black flex items-center gap-1.5 uppercase tracking-wider" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse inline-block"></span>
            See how they reacted
          </h3>
          <span className="text-[10px] text-neutral-300 font-bold uppercase">Live</span>
        </div>

        {activity.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-xs text-neutral-200">No activity yet. Once they open it, the timeline starts here.</p>
            <p className="text-[10px] text-neutral-400 mt-1">Updates live automatically</p>
          </div>
        ) : (
          <div className="space-y-4 max-h-[220px] overflow-y-auto pr-1 select-text">
            {activity.map((log) => {
              const dateStr = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              let isSpecialEvent = false;
              let storyText = log.text;
              let icon = '💬';
              let textColor = 'text-white';
              let bubbleBg = 'bg-white/5';
              let borderStyle = 'border-white/5';

              if (log.sender === 'recipient') {
                if (log.text.includes('Opened Envelope (facing Secret Gate)')) {
                  storyText = `${recipientName} arrived, opened the envelope, and is facing the secret code lock screen 🔐`;
                  isSpecialEvent = true;
                  icon = '📬';
                  textColor = 'text-pink-300';
                  bubbleBg = 'bg-pink-500/10';
                  borderStyle = 'border-pink-500/20';
                } else if (log.text.includes('Opened Envelope & Card!')) {
                  storyText = `${recipientName} broke the wax seal and opened your card! 🔓✨`;
                  isSpecialEvent = true;
                  icon = '📬';
                  textColor = 'text-pink-300';
                  bubbleBg = 'bg-pink-500/10';
                  borderStyle = 'border-pink-500/20';
                } else if (log.text.includes('Unlocked Secret Gate')) {
                  storyText = `${recipientName} entered the correct passcode and unlocked the secret gate! 🔑🌟`;
                  isSpecialEvent = true;
                  icon = '🔑';
                  textColor = 'text-yellow-300';
                  bubbleBg = 'bg-yellow-500/10';
                  borderStyle = 'border-yellow-500/20';
                } else if (log.text.includes('Answered "')) {
                  const match = log.text.match(/Answered "([^"]+)" with "([^"]*)"/);
                  storyText = match
                    ? `${recipientName} answered: "${match[2]}" to "${match[1]}" ✨`
                    : `${recipientName} answered a story question ✨`;
                  isSpecialEvent = true;
                  icon = '✨';
                  textColor = 'text-fuchsia-300';
                  bubbleBg = 'bg-fuchsia-500/10';
                  borderStyle = 'border-fuchsia-500/20';
                } else if (log.text.includes('Tried to click "')) {
                  const match = log.text.match(/Tried to click "([^"]+)" \(Dodge #(\d+)\)/);
                  storyText = match
                    ? `${recipientName} tried to click "${match[1]}" but the button dodged them! (Attempt #${match[2]}) 🎯`
                    : `${recipientName} tried to click the negative button! 💀`;
                  isSpecialEvent = true;
                  icon = '🎯';
                  textColor = 'text-cyan-300';
                  bubbleBg = 'bg-cyan-500/10';
                  borderStyle = 'border-cyan-500/20';
                } else if (log.text.includes('Clicked "')) {
                  const match = log.text.match(/Clicked "([^"]+)"/);
                  storyText = match
                    ? `${recipientName} clicked "${match[1]}"! The card is accepted! 🎉💖`
                    : `${recipientName} clicked YES! 🎉💖`;
                  isSpecialEvent = true;
                  icon = '💖';
                  textColor = 'text-emerald-300';
                  bubbleBg = 'bg-emerald-500/15';
                  borderStyle = 'border-emerald-500/30';
                }
              }

              if (!isSpecialEvent) {
                const isFromCreator = log.sender === 'creator';
                icon = isFromCreator ? '💌' : '💬';
                textColor = isFromCreator ? 'text-purple-300' : 'text-neutral-200';
                bubbleBg = isFromCreator ? 'bg-purple-950/20 ml-8' : 'bg-white/5 mr-8';
                borderStyle = isFromCreator ? 'border-purple-500/20' : 'border-white/5';
              }

              return (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log.id}
                  className={`border rounded-2xl p-3.5 flex gap-2.5 items-start transition-all duration-300 ${bubbleBg} ${borderStyle}`}
                >
                  <span className="text-base shrink-0">{icon}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-baseline gap-2">
                      <span className="text-[9px] text-neutral-400 font-extrabold uppercase tracking-wider">
                        {log.sender === 'creator' ? 'You' : recipientName}
                      </span>
                      <span className="text-[8px] text-neutral-500 font-semibold">{dateStr}</span>
                    </div>
                    <p className={`text-xs font-semibold leading-relaxed mt-1 ${textColor} break-words`}>
                      {storyText}
                    </p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="text-xs"
        style={{ color: 'var(--text3)' }}
      >
          The link works on any device. No app needed.
      </motion.p>

      <Link href="/customize" className="text-xs font-black underline underline-offset-4" style={{ color: 'var(--accent)' }}>
        Make another VibeCheck
      </Link>
    </motion.div>
  );
}
