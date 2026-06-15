'use client';

export default function AmbientBackground() {
  return (
    <div className="vc-ambient fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      <div className="vc-ambient__wash" />
      <div className="vc-ambient__grain" />
      <div className="vc-ambient__lines" />
    </div>
  );
}
