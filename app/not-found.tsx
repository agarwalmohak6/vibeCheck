import Link from 'next/link';

export default function NotFound() {
  return (
    <main className="vc-system-page">
      <section className="vc-system-panel">
        <span className="vc-eyebrow">404</span>
        <h1>This card slipped away.</h1>
        <p>The card may have expired, moved, or never existed. Create a fresh one and send something better than a dry text.</p>
        <Link href="/customize?new=1" className="vc-system-action">Create a card</Link>
      </section>
    </main>
  );
}
