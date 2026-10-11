'use client';

import { motion } from 'framer-motion';

const FINALES: Record<string, {
  eyebrow: string;
  title: string;
  body: string;
  action: 'rose' | 'sorry' | 'highfive' | 'cake' | 'movie';
}> = {
  shoot_shot: {
    eyebrow: 'One brave final moment',
    title: 'A rose, a question, and a heart held out honestly.',
    body: 'Some feelings deserve more than a hurried message. This one arrived with courage.',
    action: 'rose',
  },
  maan_jao: {
    eyebrow: 'No excuses. Just care.',
    title: 'A softer sorry, offered with both hands.',
    body: 'The words cannot undo the moment. The next action can still make things gentler.',
    action: 'sorry',
  },
  bestie_check: {
    eyebrow: 'Certified chaos partners',
    title: 'Same team. Same nonsense. Always.',
    body: 'For the friend who turns ordinary days into stories worth keeping.',
    action: 'highfive',
  },
  birthday_roast: {
    eyebrow: 'Main-character birthday energy',
    title: 'Cake, confetti, and one very loud celebration.',
    body: 'Today is for making a wish and remembering how loved you already are.',
    action: 'cake',
  },
  netflix_chill: {
    eyebrow: 'The coziest ending',
    title: 'Two seats, one bowl, zero boring plans.',
    body: 'Pick the movie. The snacks and good company are already waiting.',
    action: 'movie',
  },
};

function Person({ x, color, flip = false }: { x: number; color: string; flip?: boolean }) {
  return (
    <g transform={`translate(${x} 24) scale(${flip ? -1 : 1} 1)`}>
      <circle cx="0" cy="32" r="20" fill="#f4b991" />
      <path d="M-19 29c3-24 38-27 40 1-13-9-26-11-40-1Z" fill="#3d1a2e" />
      <path d="M-28 74c0-18 12-29 28-29s28 11 28 29v58h-56Z" fill={color} />
      <path d="M-20 132v46M20 132v46" stroke="#3d1a2e" strokeWidth="13" strokeLinecap="round" />
      <circle cx="-7" cy="34" r="2" fill="#3d1a2e" />
      <circle cx="7" cy="34" r="2" fill="#3d1a2e" />
      <path d="M-6 43q6 5 12 0" fill="none" stroke="#a44b63" strokeWidth="2" strokeLinecap="round" />
    </g>
  );
}

function MomentIllustration({ action }: { action: 'rose' | 'sorry' | 'highfive' | 'cake' | 'movie' }) {
  const shared = (
    <>
      <defs>
        <linearGradient id="sceneGlow" x1="0" y1="0" x2="1" y2="1">
          <stop stopColor="var(--accent)" stopOpacity=".22" />
          <stop offset="1" stopColor="var(--accent2)" stopOpacity=".08" />
        </linearGradient>
      </defs>
      <rect width="420" height="260" rx="36" fill="url(#sceneGlow)" />
      <ellipse cx="210" cy="226" rx="145" ry="18" fill="var(--accent)" opacity=".1" />
      <Person x={118} color="var(--accent)" />
      <Person x={302} color="var(--accent2)" flip />
    </>
  );

  return (
    <svg viewBox="0 0 420 260" role="img" aria-label={`${action} celebration illustration`}>
      {shared}
      {action === 'rose' && (
        <motion.g
          initial={{ rotate: -12, y: 12 }}
          whileInView={{ rotate: 0, y: 0 }}
          transition={{ type: 'spring', stiffness: 120, damping: 12, delay: 0.25 }}
          viewport={{ once: true }}
        >
          <path d="M190 151c32-17 51-38 66-65" stroke="#1f9d55" strokeWidth="5" strokeLinecap="round" />
          <path d="M252 84c-18-20 13-36 20-13 13-18 36 7 16 22-12 9-23 13-36-9Z" fill="#ef476f" />
          <path d="M198 151c-16 0-24 4-31 13" stroke="#f4b991" strokeWidth="11" strokeLinecap="round" />
        </motion.g>
      )}
      {action === 'sorry' && (
        <motion.g initial={{ opacity: 0, scale: .7 }} whileInView={{ opacity: 1, scale: 1 }} viewport={{ once: true }}>
          <path d="M170 125q40 28 80 0" fill="none" stroke="#f4b991" strokeWidth="11" strokeLinecap="round" />
          <rect x="169" y="91" width="82" height="49" rx="12" fill="#fff8ed" stroke="var(--accent)" strokeWidth="3" />
          <text x="210" y="122" textAnchor="middle" fill="var(--accent)" fontSize="17" fontWeight="900">I&apos;M SORRY</text>
        </motion.g>
      )}
      {action === 'highfive' && (
        <motion.g
          initial={{ scale: .7, rotate: -8 }}
          whileInView={{ scale: [1, 1.12, 1], rotate: 0 }}
          transition={{ delay: .2, duration: .7 }}
          viewport={{ once: true }}
        >
          <path d="M163 115 202 74M257 115 218 74" stroke="#f4b991" strokeWidth="13" strokeLinecap="round" />
          <path d="m210 45 4 15 14-7-9 14 15 4-15 4 8 14-13-8-4 15-4-15-14 8 8-14-15-4 15-4-8-14 14 7Z" fill="#ffd166" />
        </motion.g>
      )}
      {action === 'cake' && (
        <motion.g initial={{ y: 22 }} whileInView={{ y: 0 }} viewport={{ once: true }}>
          <rect x="170" y="126" width="80" height="42" rx="8" fill="#ffb3c7" />
          <path d="M170 138q10 12 20 0t20 0t20 0t20 0v-12h-80Z" fill="#fff8ed" />
          <path d="M190 126v-22M210 126v-26M230 126v-22" stroke="#d4a017" strokeWidth="4" />
          <path d="m190 101 5-9 5 9M210 97l5-9 5 9M230 101l5-9 5 9" fill="#ff8c42" />
        </motion.g>
      )}
      {action === 'movie' && (
        <motion.g initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <path d="M170 132h80l-10 45h-60Z" fill="#ef476f" />
          <path d="M179 126q8-20 18 0 8-24 18 0 8-20 18 0" fill="#fff8ed" />
          <path d="M157 76h106v28H157Z" fill="#3d1a2e" />
          <path d="m172 76 18 28m18-28 18 28m18-28 18 28" stroke="#fff" strokeWidth="6" />
        </motion.g>
      )}
    </svg>
  );
}

export default function ThemeFinale({
  templateType,
  creatorName,
  recipientName,
}: {
  templateType: string;
  creatorName: string;
  recipientName: string;
}) {
  const finale = FINALES[templateType] || FINALES.shoot_shot;

  return (
    <motion.section
      initial={{ opacity: 0, y: 70 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: .2 }}
      transition={{ duration: .75 }}
      className="vc-theme-finale"
    >
      <div className="vc-theme-finale__copy">
        <p>{finale.eyebrow}</p>
        <h2>{finale.title}</h2>
        <span>{finale.body}</span>
        <strong>Made by {creatorName}, only for {recipientName}.</strong>
      </div>
      <div className="vc-theme-finale__art">
        <MomentIllustration action={finale.action} />
      </div>
    </motion.section>
  );
}
