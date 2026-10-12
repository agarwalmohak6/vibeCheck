'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import { useReducedMotion } from 'framer-motion';
import { dodgePosition } from '@/lib/romanceMotion';

export default function RomanceButtons({ onYes, yesText, noText, onDodge, onLater }: {
  onYes: () => void; yesText?: string; noText?: string;
  onDodge: (label: string, count: number) => void; onLater: () => void;
}) {
  const [dodges, setDodges] = useState(0);
  const [accepted, setAccepted] = useState(false);
  const [position, setPosition] = useState<{ x: number; y: number } | null>(null);
  const laneRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const countRef = useRef(0);
  const reduced = useReducedMotion();
  const positionButton = (count: number) => {
    const lane = laneRef.current, button = buttonRef.current;
    if (!lane || !button) return;
    const size = { width: lane.clientWidth, height: lane.clientHeight, buttonWidth: button.offsetWidth, buttonHeight: button.offsetHeight };
    setPosition(count ? dodgePosition(size.width, size.height, size.buttonWidth, size.buttonHeight, count) : { x: Math.max(8, (size.width - size.buttonWidth) / 2), y: Math.max(8, (size.height - size.buttonHeight) / 2) });
  };
  useEffect(() => {
    const lane = laneRef.current;
    if (!lane) return;
    const observer = new ResizeObserver(() => positionButton(countRef.current));
    observer.observe(lane);
    return () => observer.disconnect();
  }, []);
  const dodge = () => {
    const next = ++countRef.current;
    setDodges(next);
    if (!reduced) positionButton(next);
    onDodge(noText || 'No', next);
  };
  return <div className="vc-romance-answer">
    <div className="vc-romance-answer__buttons" style={{ '--yes-scale': Math.min(1.14, 1 + dodges * .025) } as CSSProperties}>
      <button type="button" className="vc-romance-yes" disabled={accepted} onClick={() => { setAccepted(true); onYes(); }}>{yesText || 'Yes ♡'}</button>
      <div className="vc-romance-no-lane" ref={laneRef}>
        <button ref={buttonRef} type="button" className="vc-romance-no" style={{ left: position?.x ?? '50%', top: position?.y ?? 26, transform: position ? undefined : 'translateX(-50%)' }}
          onPointerEnter={event => { if (event.pointerType === 'mouse') dodge(); }}
          onPointerDown={event => { event.preventDefault(); dodge(); }}
          onClick={event => { if (event.detail === 0) dodge(); }}>{noText || 'No'}</button>
      </div>
    </div>
    <button type="button" className="vc-romance-later" onClick={onLater}>I’d like some time</button>
  </div>;
}
