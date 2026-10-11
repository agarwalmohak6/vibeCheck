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
  orderId?: string;
  creatorEmail?: string;
  creatorWhatsapp?: string;
}

function formatWhatsAppNumber(value?: string) {
  return (value || '').replace(/[^\d]/g, '');
}

export default function SuccessHub({
  cardId,
  recipientName,
  creatorName,
  creatorToken,
  orderId,
  creatorEmail,
  creatorWhatsapp,
}: SuccessHubProps) {
  const [copied, setCopied] = useState(false);
  const [creatorCopied, setCreatorCopied] = useState(false);
  const [copyError, setCopyError] = useState(false);
  const [activity, setActivity] = useState<ChatMessageDTO[]>([]);
  const [showCreatorLink, setShowCreatorLink] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000');
  const cardUrl = `${baseUrl}/card/${cardId}`;
  const creatorUrl = creatorToken ? `${cardUrl}?ct=${encodeURIComponent(creatorToken)}` : cardUrl;
  const waLink = whatsappLink(cardUrl, creatorName, recipientName);
  const trackingId = orderId || cardId.slice(0, 8).toUpperCase();
  const creatorTrackingMessage = encodeURIComponent(
    `Your VibeCheck order ${trackingId} is ready to track: ${creatorUrl}`,
  );
  const creatorWhatsAppUrl = creatorWhatsapp
    ? `https://wa.me/${formatWhatsAppNumber(creatorWhatsapp)}?text=${creatorTrackingMessage}`
    : '';

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

  return (
    <motion.section
      initial={{ opacity: 0, scale: 0.9, y: 40 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className="vc-success-hub vc-success-hub--launch relative z-10"
    >
      <div className="vc-success-orbit" aria-hidden />

      <header className="vc-success-launch-hero">
        <div className="vc-success-launch-kicker">
          <span aria-hidden />
          Card ready
        </div>
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          {recipientName}&apos;s link is ready.
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Send the recipient link now. Keep the creator link private for tracking opens, answers, and payment status.
        </motion.p>
        <div className="vc-success-launch-badges" aria-label="Order summary">
          <span>
            Order <b>{trackingId}</b>
          </span>
          <span>Tracking armed</span>
          <span>No app needed</span>
        </div>
      </header>

      <div className="vc-success-launch-grid">
        <motion.article
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.64 }}
          className="vc-success-share-card"
        >
          <div className="vc-success-card-top">
            <span aria-hidden>↗</span>
            <div>
              <p>Send to {recipientName}</p>
              <h3>Recipient link only.</h3>
            </div>
          </div>

          <div className="vc-success-link-capsule">
            <small>Recipient link</small>
            <p>{cardUrl}</p>
          </div>

          {copyError && (
            <p role="status" className="vc-success-copy-error">
              Copy did not auto-complete. Long-press the link and copy it manually.
            </p>
          )}

          <div className="vc-success-actions">
            <motion.a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              className="vc-success-action vc-success-action--whatsapp"
            >
              <span aria-hidden>▣</span>
              Share on WhatsApp
            </motion.a>
            <motion.button
              type="button"
              onClick={handleCopy}
              whileTap={{ scale: 0.96 }}
              whileHover={{ scale: 1.02 }}
              className="vc-success-action vc-success-action--copy"
            >
              {copied ? 'Copied' : 'Copy link'}
            </motion.button>
          </div>

          <div className="vc-success-warning-strip">
            <span aria-hidden>!</span>
            <p>Do not send the creator link to {recipientName}. That one is only for you.</p>
          </div>
        </motion.article>

        <div className="vc-success-side-stack">
          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.72 }}
            className="vc-success-order-card"
          >
            <div className="vc-success-card-top vc-success-card-top--small">
              <span aria-hidden>✓</span>
              <div>
                <p>Order cockpit</p>
                <h3>Saved for tracking.</h3>
              </div>
            </div>
            <div className="vc-success-order-list">
              <div>
                <span>Order ID</span>
                <strong>{trackingId}</strong>
              </div>
              <div>
                <span>Email</span>
                <strong>{creatorEmail || 'Saved'}</strong>
              </div>
              <div>
                <span>WhatsApp</span>
                <strong>{creatorWhatsapp || 'Saved'}</strong>
              </div>
            </div>
          </motion.article>

          <motion.article
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="vc-success-creator-card vc-success-creator-card--launch"
          >
            <div className="vc-success-creator-head">
              <div>
                <p>Creator link</p>
                <strong>Your private dashboard</strong>
              </div>
              <button
                type="button"
                onClick={() => setShowCreatorLink((value) => !value)}
              >
                {showCreatorLink ? 'Hide' : 'Show'}
              </button>
            </div>
            <p className="vc-success-creator-copy">
              Tracks opens, passcode attempts, story answers, and payment status for order {trackingId}.
            </p>
            {showCreatorLink && (
              <div className="vc-success-private-link">
                <small>Private creator link</small>
                <p>{creatorUrl}</p>
              </div>
            )}
            <div className="vc-success-creator-actions">
              <button
                type="button"
                onClick={() => void handleCreatorCopy()}
              >
                {creatorCopied ? 'Creator link copied' : 'Copy creator link'}
              </button>

              {creatorWhatsAppUrl && (
                <a
                  href={creatorWhatsAppUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Send to WhatsApp
                </a>
              )}
            </div>
          </motion.article>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.86 }}
        className="vc-success-send-ritual vc-success-send-ritual--launch"
      >
        <div>
          <span>1</span>
          <p>Share only the recipient link with {recipientName}.</p>
        </div>
        <div>
          <span>2</span>
          <p>Save order {trackingId} for support or manual payment checks.</p>
        </div>
        <div>
          <span>3</span>
          <p>Come back here to watch opens, answers, and final reactions live.</p>
        </div>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 1.0 }}
        className="vc-success-activity vc-success-activity--launch"
      >
        <div className="vc-success-activity-head">
          <div>
            <p>Live reaction timeline</p>
            <h3>What happens after they open it</h3>
          </div>
          <span>Live</span>
        </div>

        {activity.length === 0 ? (
          <div className="vc-success-empty-timeline">
            <div>
              <span aria-hidden>01</span>
              <strong>Waiting for first open</strong>
              <p>Once {recipientName} taps the link, this panel starts logging the whole reveal.</p>
            </div>
            <div>
              <span aria-hidden>02</span>
              <strong>Answers will stack here</strong>
              <p>Story answers, passcode attempts, and final clicks update automatically.</p>
            </div>
          </div>
        ) : (
          <div className="vc-success-activity-list select-text">
            {activity.map((log) => {
              const dateStr = new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
              let isSpecialEvent = false;
              let storyText = log.text;
              let icon = '💬';
              let tone = 'neutral';

              if (log.sender === 'recipient') {
                if (log.text.includes('Opened Envelope (facing Secret Gate)')) {
                  storyText = `${recipientName} opened the envelope and is facing the secret code lock screen`;
                  isSpecialEvent = true;
                  icon = '📬';
                  tone = 'pink';
                } else if (log.text.includes('Opened Envelope & Card!')) {
                  storyText = `${recipientName} opened your card`;
                  isSpecialEvent = true;
                  icon = '📬';
                  tone = 'pink';
                } else if (log.text.includes('Unlocked Secret Gate')) {
                  storyText = `${recipientName} entered the correct passcode`;
                  isSpecialEvent = true;
                  icon = '🔑';
                  tone = 'gold';
                } else if (log.text.includes('Answered "')) {
                  const match = log.text.match(/Answered "([^"]+)" with "([^"]*)"/);
                  storyText = match
                    ? `${recipientName} answered "${match[2]}" to "${match[1]}"`
                    : `${recipientName} answered a story question`;
                  isSpecialEvent = true;
                  icon = '✨';
                  tone = 'violet';
                } else if (log.text.includes('Tried to click "')) {
                  const match = log.text.match(/Tried to click "([^"]+)" \(Dodge #(\d+)\)/);
                  storyText = match
                    ? `${recipientName} tried "${match[1]}" but the button dodged them. Attempt ${match[2]}`
                    : `${recipientName} tried the negative button`;
                  isSpecialEvent = true;
                  icon = '🎯';
                  tone = 'cyan';
                } else if (log.text.includes('Clicked "')) {
                  const match = log.text.match(/Clicked "([^"]+)"/);
                  storyText = match
                    ? `${recipientName} clicked "${match[1]}"`
                    : `${recipientName} clicked YES`;
                  isSpecialEvent = true;
                  icon = '💖';
                  tone = 'green';
                }
              }

              if (!isSpecialEvent) {
                const isFromCreator = log.sender === 'creator';
                icon = isFromCreator ? '💌' : '💬';
                tone = isFromCreator ? 'violet' : 'neutral';
              }

              return (
                <motion.div
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  key={log.id}
                  className="vc-success-timeline-row"
                  data-tone={tone}
                >
                  <span className="vc-success-timeline-icon" aria-hidden>{icon}</span>
                  <div>
                    <div className="vc-success-timeline-meta">
                      <span>{log.sender === 'creator' ? 'You' : recipientName}</span>
                      <time>{dateStr}</time>
                    </div>
                    <p>{storyText}</p>
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      <footer className="vc-success-footer">
        <p>The link works on any device. No app needed.</p>
        <Link href="/customize?new=1">
          Make another VibeCheck
        </Link>
      </footer>
    </motion.section>
  );
}
