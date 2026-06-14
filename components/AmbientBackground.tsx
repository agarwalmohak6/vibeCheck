'use client';

export default function AmbientBackground() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0" aria-hidden>
      <div className="orb w-96 h-96 top-0 -right-20 opacity-30" style={{ background: 'var(--accent)', animationDuration: '15s' }} />
      <div className="orb w-96 h-96 bottom-0 -left-20 opacity-30" style={{ background: 'var(--accent2)', animationDuration: '25s' }} />
      <div
        className="absolute inset-0 opacity-40 mix-blend-screen"
        style={{
          background: `radial-gradient(circle at 20% 30%, var(--accent) 0%, transparent 50%),
                       radial-gradient(circle at 80% 70%, var(--accent2) 0%, transparent 50%)`,
          filter: 'blur(80px)',
          animation: 'pulse-glow 8s ease-in-out infinite alternate'
        }}
      />
    </div>
  );
}
