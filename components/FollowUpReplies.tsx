'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';
import type { PublicCard, ChatMessageDTO } from '@/types/vibecheck';
import {
  RECIPIENT_COPY,
  formatPersonName,
  type RecipientLocale,
} from '@/lib/recipientI18n';

interface FollowUpRepliesProps {
  card: PublicCard;
  isCreator: boolean;
  locale?: RecipientLocale;
}

type RoomMeta = {
  emoji: string;
  name: string;
};


const ROOM_NAMES: Record<string, Record<RecipientLocale, RoomMeta>> = {
  maan_jao: {
    en: { emoji: '🕊️', name: 'A fresh start' },
    hi: { emoji: '🕊️', name: 'रीसेट रूम' },
  },
  birthday_roast: {
    en: { emoji: '🎂', name: 'Birthday wishes' },
    hi: { emoji: '🎂', name: 'बर्थडे बैकस्टेज' },
  },
  bestie_check: {
    en: { emoji: '🍹', name: 'Just between us' },
    hi: { emoji: '🍹', name: 'बेस्टी हॉटलाइन' },
  },
  shoot_shot: {
    en: { emoji: '💌', name: 'Our next chapter' },
    hi: { emoji: '💌', name: 'सॉफ्ट लॉन्च रूम' },
  },
  netflix_chill: {
    en: { emoji: '🍿', name: 'A little time together' },
    hi: { emoji: '🍿', name: 'स्नैक पैक्ट रूम' },
  },
};

const CHAT_COPY = {
  en: {
    roomLabel: 'Private reply room',
    live: 'Live',
    copyRoom: 'Copy room link',
    copied: 'Room link copied',
    sendFailed: 'Could not send that message. Check the room link and try again.',
    expired: 'This room is closed because the card expired.',
    emptyCreator: (recipientName: string) =>
      `${recipientName} has not replied yet. Their words will appear right here.`,
    emptyRecipient: (creatorName: string) =>
      `Write back to ${creatorName} in your own words. Take your time. I’m listening.`,
    placeholderCreator: (recipientName: string) => `Reply to ${recipientName}...`,
    placeholderRecipient: 'Write your real reply...',
    sending: 'Sending...',
    sent: 'Message sent.',
    you: 'You',
    emptyTime: 'just now',
  },
  hi: {
    roomLabel: 'निजी जवाब रूम',
    live: 'लाइव',
    copyRoom: 'रूम लिंक कॉपी करें',
    copied: 'रूम लिंक कॉपी हो गया',
    sendFailed: 'मैसेज नहीं भेज पाए। रूम लिंक चेक करके फिर कोशिश करें।',
    expired: 'कार्ड expire हो गया है, इसलिए यह रूम बंद है।',
    emptyCreator: (recipientName: string) =>
      `${recipientName} ने अभी जवाब नहीं दिया है। जवाब आएगा तो यह comments section नहीं, एक छोटा private chat लगेगा।`,
    emptyRecipient: (creatorName: string) =>
      `${creatorName} को अपने शब्दों में जवाब लिखें। यहां canned quick answers नहीं हैं।`,
    placeholderCreator: (recipientName: string) => `${recipientName} को जवाब लिखें...`,
    placeholderRecipient: 'अपना सच्चा जवाब लिखें...',
    sending: 'भेज रहे हैं...',
    sent: 'मैसेज भेज दिया गया।',
    you: 'आप',
    emptyTime: 'अभी',
  },
} satisfies Record<RecipientLocale, {
  roomLabel: string;
  live: string;
  copyRoom: string;
  copied: string;
  sendFailed: string;
  expired: string;
  emptyCreator: (recipientName: string) => string;
  emptyRecipient: (creatorName: string) => string;
  placeholderCreator: (recipientName: string) => string;
  placeholderRecipient: string;
  sending: string;
  sent: string;
  you: string;
  emptyTime: string;
}>;

function getInitial(name: string) {
  return name.trim().charAt(0).toLocaleUpperCase() || 'V';
}

function getRoomMeta(templateType: string, locale: RecipientLocale) {
  return ROOM_NAMES[templateType]?.[locale] || ROOM_NAMES.maan_jao[locale];
}

function mergeMessages (previous: ChatMessageDTO[], incoming: ChatMessageDTO[]) {
  return [...new Map([...previous, ...incoming].map(message => [message.id, message])).values()].sort((a, b) => a.created_at.localeCompare(b.created_at));
}

export default function FollowUpReplies({ card, isCreator, locale = 'en' }: FollowUpRepliesProps) {
  const [messages, setMessages] = useState<ChatMessageDTO[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const activeRef = useRef(true);
  const inFlightRef = useRef(false);
  const sendingRef = useRef(false);
  const requestRef = useRef<AbortController | null>(null);
  const pendingRef = useRef<{ id: string; text: string } | null>(null);
  const [sendError, setSendError] = useState('');
  const [roomCopied, setRoomCopied] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  const copy = RECIPIENT_COPY[locale].followUp;
  const chatCopy = CHAT_COPY[locale];
  const creatorName = formatPersonName(card.creator_name, locale === 'hi' ? 'भेजने वाले' : 'someone');
  const recipientName = formatPersonName(card.recipient_name, locale === 'hi' ? 'आप' : 'you');
  const senderType = isCreator ? 'creator' : 'recipient';
  const room = getRoomMeta(card.template_type, locale);

  const getRoomHref = () => {
    if (typeof window === 'undefined') return '';
    const url = new URL(window.location.href);
    url.searchParams.set('room', 'chat');
    if (isCreator && !url.searchParams.get('ct')) {
      const token = localStorage.getItem(`creator_token_${card.id}`);
      if (token) url.searchParams.set('ct', token);
    }
    return url.toString();
  };

  const roomHeaders = useCallback((): Record<string, string> => {
    const token = new URLSearchParams(window.location.search).get('ct') || localStorage.getItem(`creator_token_${card.id}`);
    const unlock = localStorage.getItem(`unlock_token_${card.id}`);
    return { ...(isCreator && token ? { 'x-vibecheck-creator-token': token } : {}), ...(unlock ? { 'x-vibecheck-unlock-token': unlock } : {}) };
  }, [card.id, isCreator]);



  const fetchMessages = useCallback(async () => {
    if (inFlightRef.current) return;
    inFlightRef.current = true;
    const controller = new AbortController();
    requestRef.current = controller;
    try {
      const res = await fetch(`/api/messages?card_id=${card.id}`, { cache: 'no-store', headers: roomHeaders(), signal: controller.signal });
      if (!activeRef.current) return;
      if (res.ok) {
        const data = await res.json() as ChatMessageDTO[];
        if (!activeRef.current) return;
        setMessages(previous => mergeMessages(previous, data));
        setLoadError('');
      } else setLoadError(res.status === 410 ? chatCopy.expired : 'Your replies are taking a little longer to load. We’ll keep trying.');
    } catch (error) {
      if (activeRef.current && !(error instanceof Error && error.name === 'AbortError')) setLoadError('Connection paused. Your words are safe here; we’ll reconnect.');
    } finally {
      if (requestRef.current === controller) {
        inFlightRef.current = false;
        if (activeRef.current) setIsLoading(false);
      }
    }
  }, [card.id, chatCopy.expired, roomHeaders]);

  useEffect(() => {
    activeRef.current = true;
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMessages();
    const interval = setInterval(() => { if (!document.hidden) void fetchMessages(); }, 5000);
    const refresh = () => { if (!document.hidden) void fetchMessages(); };
    document.addEventListener('visibilitychange', refresh);
    return () => { activeRef.current = false; inFlightRef.current = false; clearInterval(interval); requestRef.current?.abort(); document.removeEventListener('visibilitychange', refresh); };
  }, [fetchMessages]);

  useEffect(() => {
    bodyRef.current?.scrollTo({ top: bodyRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages.length]);

  const handleSend = async (text: string) => {
    if (!text.trim() || sendingRef.current) return;
    sendingRef.current = true;
    const trimmed = text.trim();
    if (pendingRef.current?.text !== trimmed) pendingRef.current = { id: crypto.randomUUID(), text: trimmed };
    setIsSending(true);
    setSendError('');

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...roomHeaders() },
        body: JSON.stringify({
          card_id: card.id,
          sender: senderType,
          text: trimmed,
          message_id: pendingRef.current.id,
        }),
      });

      if (!activeRef.current) return;
      if (res.ok) {
        const message = await res.json() as ChatMessageDTO;
        if (!activeRef.current) return;
        setMessages(previous => mergeMessages(previous, [message]));
        setInputText(current => current.trim() === trimmed ? '' : current);
        pendingRef.current = null;
        await fetchMessages();
      } else if (res.status === 410) {
        setSendError(chatCopy.expired);
      } else {
        setSendError(chatCopy.sendFailed);
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
      setSendError(chatCopy.sendFailed);
    } finally {
      sendingRef.current = false;
      if (activeRef.current) setIsSending(false);
    }
  };

  const copyRoomLink = async () => {
    const roomHref = getRoomHref();
    if (!roomHref) return;
    try {
      if (!navigator.clipboard) throw new Error('Clipboard is unavailable');
      await navigator.clipboard.writeText(roomHref);
      setRoomCopied(true);

    } catch {
      setSendError(roomHref);
    }
  };

  const emptyText = isCreator
    ? chatCopy.emptyCreator(recipientName)
    : chatCopy.emptyRecipient(creatorName);
  const placeholder = isCreator
    ? chatCopy.placeholderCreator(recipientName)
    : chatCopy.placeholderRecipient;

  return (
    <section className="vc-chat-room" aria-label={chatCopy.roomLabel}>
      <div className="vc-chat-room__floaters" aria-hidden>
        <span>{room.emoji}</span>
        <span>💬</span>
        <span>✨</span>
        <span>💌</span>
      </div>

      <div className="vc-chat-room__header">
        <div className="vc-chat-room__avatars" aria-hidden>
          <span>{getInitial(creatorName)}</span>
          <span>{getInitial(recipientName)}</span>
        </div>
        <div className="min-w-0">
          <p>{chatCopy.roomLabel}</p>
          <h3>
            <span>{room.emoji}</span>
            {room.name}
          </h3>
          <small>{creatorName} + {recipientName}</small>
        </div>
        <div className="vc-chat-room__header-actions">
          <span>{isLoading ? 'Connecting…' : loadError ? 'Reconnecting…' : 'Just us'}</span>
          {isCreator && <button type="button" onClick={() => void copyRoomLink()}>
            {roomCopied ? chatCopy.copied : chatCopy.copyRoom}
          </button>}
        </div>
      </div>

      <p className="vc-chat-room__statusline">
        A little space for your words, just between the two of you.
      </p>

      <div className="vc-chat-room__body" ref={bodyRef} role="log" aria-live="polite" aria-relevant="additions text" aria-busy={isLoading}>
        {isLoading ? <div className="vc-chat-room__empty"><span aria-hidden="true">{room.emoji}</span><p>Making a little space for your words…</p></div> : messages.length === 0 ? (
          <div className="vc-chat-room__empty">
            <span>{room.emoji}</span>
            <p>{emptyText}</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isMine = msg.sender === senderType;
            const senderName = msg.sender === 'creator' ? creatorName : recipientName;
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 8, scale: 0.98 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                className={`vc-chat-bubble ${isMine ? 'is-mine' : 'is-theirs'}`}
              >
                <div>
                  <strong>{isMine ? chatCopy.you : senderName}</strong>
                  <time dateTime={msg.created_at}>
                    {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) || chatCopy.emptyTime}
                  </time>
                </div>
                <p>{msg.text}</p>
              </motion.div>
            );
          })
        )}
      </div>

      <form
        className="vc-chat-room__composer"
        onSubmit={(event) => {
          event.preventDefault();
          void handleSend(inputText);
        }}
      >
        <input
          type="text"
          aria-label={placeholder}
          autoComplete="off"
          enterKeyHint="send"
          value={inputText}
          onChange={(event) => setInputText(event.target.value)}
          placeholder={placeholder}
          maxLength={500}
        />
        <button type="submit" disabled={!inputText.trim() || isSending}>
          {isSending ? chatCopy.sending : copy.send}
        </button>
      </form>

      {(sendError || loadError) && (
        <p className="vc-chat-room__error" role="status">
          {sendError || loadError}
        </p>
      )}


    </section>
  );
}
