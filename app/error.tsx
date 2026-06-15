'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="vc-system-page">
      <section className="vc-system-panel">
        <span className="vc-eyebrow">Something glitched</span>
        <h1>The moment needs one more try.</h1>
        <p>Refresh the experience and keep going. Your launch flow should recover cleanly instead of leaving people stuck.</p>
        <button type="button" onClick={reset} className="vc-system-action">Try again</button>
      </section>
    </main>
  );
}
