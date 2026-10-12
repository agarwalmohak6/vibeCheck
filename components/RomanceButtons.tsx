'use client';

import { useState, type CSSProperties } from 'react';
import { useReducedMotion } from 'framer-motion';

export default function RomanceButtons({ onYes, yesText, noText, onDodge, onLater }: {
  onYes: () => void; yesText?: string; noText?: string;
  onDodge: (label: string, count: number) => void; onLater: () => void;
}) {
  const [dodges, setDodges] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const reduced = useReducedMotion();
  const dodge = () => {
    const next = dodges + 1;
    setDodges(next); onDodge(noText || 'No', next);
  };
  const shifts = [[0, 0], [8, -12], [-2, 12], [10, -6], [0, 0]];
  const [x, y] = shifts[Math.min(dodges, 4)];
  return <div className="vc-romance-answer">
    <div className="vc-romance-answer__buttons" style={{ '--yes-scale': Math.min(1.15, 1 + dodges * .035), '--no-scale': Math.max(.7, 1 - dodges * .07), '--no-x': `${reduced ? 0 : x}px`, '--no-y': `${reduced ? 0 : y}px` } as CSSProperties}>
      <button type="button" className="vc-romance-yes" disabled={accepted} onClick={() => { setAccepted(true); onYes(); }}>{yesText || 'Yes ♡'}</button>
      <div className="vc-romance-no-wrap"><button type="button" className="vc-romance-no" onClick={dodge}>{noText || 'No'}</button></div>
    </div>
    <p aria-live="polite">{dodges ? 'A shy little button. Take all the time you need.' : 'A little courage. A lot of heart.'}</p>
    <button type="button" className="vc-romance-later" onClick={onLater}>I’d like some time</button>
  </div>;
}
