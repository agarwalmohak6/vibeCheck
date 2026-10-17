'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
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
  isPaid?: boolean;
}

function eventText(event: TrackerEvent) {
  const labels: Record<string, string> = {
    envelope_opened: 'Opened the envelope', passcode_unlocked: 'Unlocked the card',
    passcode_failed: 'Tried the private lock', card_viewed: 'Viewed the card',
    cta_accepted: `Chose "${String(event.metadata?.label || 'Yes')}"`,
    story_answered: `Answered "${String(event.metadata?.answer || '')}"`,
    runaway_dodged: 'Played with the answer buttons',
  };
  return labels[event.event_type] || 'A new card interaction';
}

export default function SuccessHub({ cardId, recipientName, creatorName, creatorToken, orderId, isPaid = true }: SuccessHubProps) {
  const router = useRouter();
  const [notice, setNotice] = useState('');
  const [expanded, setExpanded] = useState(false);
  const [activity, setActivity] = useState<{ id: string; text: string; created_at: string }[]>([]);
  const [activityStatus, setActivityStatus] = useState('Loading activity…');
  const baseUrl = (process.env.NEXT_PUBLIC_BASE_URL?.trim() || (typeof window !== 'undefined' ? window.location.origin : '')).replace(/\/+$/, '');
  const cardUrl = `${baseUrl}/card/${cardId}`;
  const creatorUrl = creatorToken ? `${cardUrl}?ct=${encodeURIComponent(creatorToken)}` : undefined;

  useEffect(() => {
    if (!expanded || !creatorToken) return;
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout>;
    const load = async () => {
      try {
        const headers = { 'x-vibecheck-creator-token': creatorToken };
        const options = { headers, signal: controller.signal, cache: 'no-store' as const };
        const messagesRes = await fetch(`/api/messages?card_id=${encodeURIComponent(cardId)}`, options);
        const eventsRes = await fetch(`/api/cards/${cardId}/events`, options);
        if (!messagesRes.ok || !eventsRes.ok) throw new Error('Activity unavailable');
        const messages: ChatMessageDTO[] = await messagesRes.json();
        const events: TrackerEvent[] = await eventsRes.json();
        if (controller.signal.aborted) return;
        const rows = [
          ...messages.map(message => ({ ...message, id: `message:${message.id}`, text: `${message.sender === 'creator' ? 'You' : recipientName}: ${message.text}` })),
          ...events.map(event => ({ id: `event:${event.id}`, text: eventText(event), created_at: event.created_at })),
        ].sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
        setActivity(rows);
        setActivityStatus(rows.length ? '' : 'No activity yet. Their first open will appear here.');
      } catch {
        if (!controller.signal.aborted) setActivityStatus('Activity is temporarily unavailable. Retrying shortly.');
      } finally {
        if (!controller.signal.aborted) timer = setTimeout(load, 10_000);
      }
    };
    void load();
    return () => { controller.abort(); clearTimeout(timer); };
  }, [expanded, creatorToken, cardId, recipientName]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => {
      setNotice('');
    }, 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const copy = async (value: string, label: string) => {
    try {
      await navigator.clipboard.writeText(value);
      setNotice(`${label} copied.`);
    } catch {
      setNotice('Copy is unavailable in this browser. Use the share button or open the card instead.');
    }
  };

  return (
    <section className="vc-ready" aria-labelledby="ready-title">
      <nav className="vc-ready__nav" aria-label="Creator navigation">
        <Link href="/" className="vc-ready__brand">VibeCheck</Link>
        <Link href="/customize?new=1" className="vc-ready__new">+ Make another</Link>
      </nav>
      <header className="vc-ready__header">
        <span className="vc-ready__status">{isPaid ? 'Ready to share' : 'Payment pending'}</span>
        <h1 id="ready-title">{isPaid ? 'Made with love. Ready for them.' : 'Your moment is saved.'}</h1>
        <p>{isPaid ? <>A little surprise for <strong>{recipientName}</strong>, from you.</> : 'We will email you when your payment is verified and your card is ready.'}</p>
      </header>
      {isPaid ? <>
        <div className="vc-ready__actions">
          <a href={whatsappLink(cardUrl, creatorName, recipientName)} target="_blank" rel="noopener noreferrer" className="vc-ready__share">Share on WhatsApp</a>
          <button type="button" onClick={() => void copy(cardUrl, 'Recipient link')}>Copy link</button>
        </div>
        <a href={cardUrl} target="_blank" rel="noopener noreferrer" className="vc-ready__preview">Open their card ↗</a>
      </> : <button type="button" className="vc-ready__refresh" onClick={() => router.refresh()}>Refresh payment status</button>}
      <p className="vc-ready__notice" role="status">{notice}</p>
      {creatorUrl && <div className="vc-ready__private">
        <div><strong>Just for you</strong><p>Your private tracking link. Keep this one safe.</p></div>
        <button type="button" onClick={() => void copy(creatorUrl, 'Private tracking link')}>Copy tracking link</button>
      </div>}
      {creatorToken && <details className="vc-ready__activity" onToggle={event => setExpanded(event.currentTarget.open)}>
        <summary>Activity & order details</summary>
        <p className="vc-ready__order">Order {orderId || cardId}</p>
        <p role="status">{activityStatus}</p>
        {activity.length > 0 && <ol>{activity.map(item => <li key={item.id}><span>{item.text}</span><time dateTime={item.created_at}>{new Date(item.created_at).toLocaleString()}</time></li>)}</ol>}
      </details>}
    </section>
  );
}
