'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, ChatMessage } from '@/lib/supabase';

// Map of template_type to preset follow-up replies
const PRESET_REPLIES: Record<string, string[]> = {
  shoot_shot: [
    "Abba nahi maanenge, par main toh maan gayi/gaya 🤭",
    "Kuch kuch hota hai... okay let's do this! ✨",
    "Only if we go out for food first 🍕",
    "Okay fine, you got me 💖"
  ],
  maan_jao: [
    "Drama over. I missed you too 😭❤️",
    "Where is my iced coffee first? 🧋",
    "You're lucky you are cute 😒",
    "Fine, you are forgiven! 🍕"
  ],
  birthday_roast: [
    "Loved this! But you're still an idiot 🫶",
    "Where is my party? 🍻",
    "You are paying for the dinner tonight 💸",
    "Officially the best birthday card ever 😭✨"
  ],
  bestie_check: [
    "Aww, you got senti! 🥺",
    "No refunds, we are stuck together forever 👯‍♀️",
    "Love you too, now delete those ugly pictures 💅",
    "You are literally my favorite disaster too ❤️"
  ],
  netflix_chill: [
    "I'll bring the snacks, you pick the movie 🍿",
    "Deal! But no horror movies please ❌",
    "I was literally waiting for you to ask 😏",
    "Sure, let's chill! 🛋️"
  ]
};

// Fallback presets if type doesn't match
const DEFAULT_PRESETS = [
  "You had me at hello... and the food 🍕",
  "Okay fine, I'm sold 💖",
  "So you're saying there's a chance? 👀",
  "This is the best thing ever! ✨"
];

interface FollowUpRepliesProps {
  card: Card;
  isCreator: boolean;
}

export default function FollowUpReplies({ card, isCreator }: FollowUpRepliesProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [sentSuccess, setSentSuccess] = useState(false);

  const presets = PRESET_REPLIES[card.template_type] || DEFAULT_PRESETS;
  const senderType = isCreator ? 'creator' : 'recipient';

  const fetchMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/messages?card_id=${card.id}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data);
      }
    } catch (err) {
      console.error('Failed to fetch replies:', err);
    }
  }, [card.id]);

  // Poll for replies every 3.5 seconds
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMessages();
    const interval = setInterval(fetchMessages, 3500);
    return () => clearInterval(interval);
  }, [fetchMessages]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isSending) return;
    setIsSending(true);

    try {
      const res = await fetch('/api/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          card_id: card.id,
          sender: senderType,
          text: text.trim()
        }),
      });

      if (res.ok) {
        setInputText('');
        setSentSuccess(true);
        setTimeout(() => setSentSuccess(false), 2500);
        await fetchMessages();
      }
    } catch (err) {
      console.error('Failed to send reply:', err);
    } finally {
      setIsSending(false);
    }
  };

  const recipientReplies = messages.filter(m => m.sender === 'recipient');
  const creatorReplies = messages.filter(m => m.sender === 'creator');

  if (isCreator) {
    return (
      <div 
        className="rounded-3xl p-6 glow-border mt-6 text-left" 
        style={{ background: 'var(--surface)' }}
      >
        <h3 className="text-lg font-black mb-4 flex items-center gap-2" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>
          <span>💬</span> Recipient Responses
        </h3>
        
        {recipientReplies.length === 0 ? (
          <div className="text-center py-6">
            <p className="text-sm text-neutral-400">Waiting for {card.recipient_name} to say YES and reply...</p>
            <div className="mt-2 text-xs text-neutral-500 animate-pulse">Updates automatically</div>
          </div>
        ) : (
          <div className="space-y-3 max-h-[250px] overflow-y-auto pr-1">
            {recipientReplies.map((msg) => (
              <motion.div 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                key={msg.id}
                className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col gap-1"
              >
                <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold">
                  <span>{card.recipient_name}</span>
                  <span>{new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <p className="text-sm text-white font-medium">{msg.text}</p>
              </motion.div>
            ))}
          </div>
        )}

        {/* Creator reply interface (simple follow up if needed) */}
        {recipientReplies.length > 0 && (
          <div className="mt-4 pt-4 border-t border-white/5">
            <h4 className="text-xs font-bold text-neutral-400 mb-2">Send a follow-up:</h4>
            <div className="flex gap-2">
              <input
                type="text"
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
                placeholder={`Reply to ${card.recipient_name}...`}
                className="flex-1 bg-white/5 border border-white/10 text-white rounded-xl px-4 py-2.5 text-xs focus:outline-none focus:border-pink-500/50 transition-colors"
              />
              <button
                onClick={() => handleSend(inputText)}
                disabled={!inputText.trim() || isSending}
                className="bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-white font-bold text-xs px-4 py-2.5 rounded-xl transition-colors shrink-0"
              >
                Send
              </button>
            </div>
            {creatorReplies.length > 0 && (
              <div className="mt-3 space-y-2">
                <p className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider">Your Follow-Ups:</p>
                {creatorReplies.map(m => (
                  <div key={m.id} className="text-xs text-neutral-300 bg-white/5 py-1 px-3 rounded-lg inline-block mr-2 border border-white/5">
                    {m.text}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  // Recipient view: Simple Preset Chips and Custom input
  return (
    <div className="mt-8 text-left">
      <h3 className="text-base font-bold text-white mb-3" style={{ textShadow: '0 2px 5px rgba(0,0,0,0.5)' }}>
        Send {card.creator_name} a reply:
      </h3>

      {/* Preset replies grid */}
      <div className="flex flex-wrap gap-2.5 mb-5">
        {presets.map((reply, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.02, y: -1 }}
            whileTap={{ scale: 0.97 }}
            onClick={() => handleSend(reply)}
            disabled={isSending}
            className="bg-black/30 hover:bg-black/50 border border-white/10 text-white text-xs px-3.5 py-2 rounded-full transition-colors font-medium cursor-pointer"
          >
            {reply}
          </motion.button>
        ))}
      </div>

      {/* Custom reply input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend(inputText)}
          placeholder="Or write a custom reply..."
          className="flex-1 bg-white/5 border border-white/10 text-white rounded-2xl px-4 py-3 text-sm focus:outline-none focus:border-pink-500/50 transition-colors"
        />
        <button
          onClick={() => handleSend(inputText)}
          disabled={!inputText.trim() || isSending}
          className="bg-pink-500 hover:bg-pink-400 disabled:opacity-50 text-white font-black text-sm px-5 py-3 rounded-2xl transition-colors shrink-0"
        >
          Send
        </button>
      </div>

      {/* Message sent success message banner */}
      <AnimatePresence>
        {sentSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 text-xs text-green-400 font-extrabold flex items-center gap-1.5"
          >
            <span>✨</span> Reply sent to {card.creator_name}!
          </motion.div>
        )}
      </AnimatePresence>

      {/* History of sent replies */}
      {recipientReplies.length > 0 && (
        <div className="mt-6 pt-4 border-t border-white/10">
          <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-2">Sent Replies:</p>
          <div className="flex flex-wrap gap-2">
            {recipientReplies.map((msg) => (
              <div 
                key={msg.id} 
                className="text-xs bg-white/10 text-white border border-white/5 px-3 py-1.5 rounded-xl flex items-center gap-1.5"
              >
                <span>💬</span>
                <span>{msg.text}</span>
              </div>
            ))}
          </div>
          {creatorReplies.length > 0 && (
            <div className="mt-4">
              <p className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider mb-2">{card.creator_name}&apos;s Replies:</p>
              <div className="flex flex-wrap gap-2">
                {creatorReplies.map((msg) => (
                  <div 
                    key={msg.id} 
                    className="text-xs bg-pink-500/20 text-pink-300 border border-pink-500/20 px-3 py-1.5 rounded-xl flex items-center gap-1.5"
                  >
                    <span>💌</span>
                    <span>{msg.text}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
