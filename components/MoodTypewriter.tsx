'use client';

import { useEffect, useMemo, useState } from 'react';
import { useReducedMotion } from 'framer-motion';
import { getMoodStory } from '@/lib/moodStories';
import { splitGraphemes, typingDelay } from '@/lib/revealEffects';

export default function MoodTypewriter({ text, templateType }: { text: string; templateType: string }) {
  const characters = useMemo(() => splitGraphemes(text), [text]);
  const [position, setPosition] = useState(0);
  const reduceMotion = useReducedMotion();
  const complete = !!reduceMotion || position >= characters.length;
  const emojis = getMoodStory(templateType).narrative.emojis;
  const visibleText = complete ? text : characters.slice(0, position).join('');

  useEffect(() => {
    if (complete) return;
    const timer = window.setTimeout(() => setPosition(current => current + 1), typingDelay(characters[position - 1] || ''));
    return () => window.clearTimeout(timer);
  }, [characters, position, complete]);

  return (
    <div className="vc-mood-typewriter">
      <span className="sr-only">{text}</span>
      <div className="vc-mood-typewriter__page" aria-hidden="true">
        <span className="vc-mood-typewriter__spacer">{text}</span>
        <span className="vc-mood-typewriter__words">{visibleText}{!complete && <i className="vc-mood-typewriter__cursor" />}</span>
      </div>
      <div className="vc-mood-typewriter__foot">
        <span className="vc-mood-typewriter__emojis" aria-hidden="true">
          {emojis.map((emoji, index) => <span key={emoji} className={complete || position / Math.max(1, characters.length) >= index / emojis.length ? 'is-visible' : ''}>{emoji}</span>)}
        </span>
      </div>
    </div>
  );
}
