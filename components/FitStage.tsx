'use client';

import { useLayoutEffect, useRef, type ReactNode } from 'react';

/** Fit a reveal chapter inside its available viewport without clipping its content. */
export default function FitStage({ children, className = '' }: { children: ReactNode; className?: string }) {
  const frameRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  useLayoutEffect(() => {
    const frame = frameRef.current, content = contentRef.current;
    if (!frame || !content) return;
    const fit = () => {
      const scale = Math.max(.01, Math.min(1, (frame.clientWidth - 12) / Math.max(1, content.offsetWidth, content.scrollWidth), (frame.clientHeight - 12) / Math.max(1, content.offsetHeight, content.scrollHeight)));
      content.style.setProperty('--stage-fit', String(scale));
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(frame); observer.observe(content);
    window.visualViewport?.addEventListener('resize', fit);
    let active = true;
    void document.fonts.ready.then(() => { if (active) fit(); });
    return () => { active = false; observer.disconnect(); window.visualViewport?.removeEventListener('resize', fit); };
  }, []);
  return <div className={`vc-fit-stage ${className}`} ref={frameRef}><div className="vc-fit-stage__content" ref={contentRef}>{children}</div></div>;
}
