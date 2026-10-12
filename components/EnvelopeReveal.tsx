'use client';

import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { getMoodStory } from '@/lib/moodStories';
import FitStage from '@/components/FitStage';

interface EnvelopeRevealProps {
  creatorName: string;
  recipientName?: string;
  templateType?: string;
  gifUrl?: string;
  onOpen: () => void;
  theme?: string;
}

export default function EnvelopeReveal({ creatorName, recipientName = 'you', templateType = 'maan_jao', gifUrl, onOpen }: EnvelopeRevealProps) {
  const [opening, setOpening] = useState(false);
  const opened = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();
  const mood = getMoodStory(templateType);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const open = () => {
    if (opened.current) return;
    opened.current = true;
    const win = window as Window & { __startMusic?: () => void };
    // The player is already mounted: invoke playback synchronously on this tap.
    win.__startMusic?.();
    setOpening(true);
    timer.current = setTimeout(onOpen, reducedMotion ? 150 : 1850);
  };
  return (
    <div className="vc-romance-overlay">
      <FitStage>
        <div className={`vc-romance-opening ${opening ? 'is-opening' : ''}`}>
          <p className="vc-romance-eyebrow">Special delivery</p>
          <h1>Something just for you.</h1>
          <p className="vc-romance-subtitle">From {creatorName}, with a little love.</p>
          <button type="button" className="vc-romance-envelope-button" onClick={open} disabled={opening} aria-label={`Open ${creatorName}'s card for ${recipientName}`}>
            <span className="vc-romance-envelope">
              <span className="vc-romance-letter-peek" aria-hidden="true"><b>{mood.emoji}</b><span>{mood.narrative.eyebrow}</span></span>
              <span className="vc-romance-pocket" />
              <svg className="vc-romance-pocket-lines" viewBox="0 0 390 252" preserveAspectRatio="none" aria-hidden="true"><path d="M0 252 149 107M390 252 241 107" /></svg>
              <span className="vc-romance-flap" /><span className="vc-romance-seal" aria-hidden="true">♥</span>
              <span className="vc-romance-address">For {recipientName}</span>
            </span>
          </button>
          <p className="vc-romance-open-hint">♡ &nbsp; {opening ? 'Opening your little moment…' : 'Tap to open'} &nbsp; ♡</p>
          {gifUrl && <div className="vc-romance-cameo">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={gifUrl} alt="A little animated surprise from the sender" />
          </div>}
        </div>
      </FitStage>
    </div>
  );
}
