import { MOOD_STORIES } from './moodStories';
// lib/themes.ts
export type ThemeId = 'midnight_romance' | 'kdrama_romance' | 'soft_coquette' | 'desi_festive' | 'proposal_glow';

export interface Theme {
  id: ThemeId;
  label: string;
  emoji: string;
  description: string;
  coverImage: string;
  preview: {
    bg: string;
    accent: string;
    accent2: string;
    text: string;
  };
}

export const THEMES: Theme[] = [
  {
    id: 'proposal_glow', label: 'The Next Chapter', emoji: '🤍',
    description: 'Warm ivory, rose, and champagne. A love letter to your future together.',
    coverImage: '/themes/proposal_glow.svg',
    preview: { bg: '#fff9f0', accent: '#9b4654', accent2: '#aa7738', text: '#3e2929' },
  },
  {
    id: 'midnight_romance',
    label: 'Midnight Romance',
    emoji: '🌙',
    description: 'After-dark colour, soft neon, and movie-night atmosphere',
    coverImage: '/themes/proposal_universal_cover.png',
    preview: {
      bg: '#0B0F19',
      accent: '#FF2E93',
      accent2: '#a855f7',
      text: '#f8f0ff',
    },
  },
  {
    id: 'kdrama_romance',
    label: 'First Blush',
    emoji: '☔',
    description: 'Pink, lavender, and the butterflies before an honest confession',
    coverImage: '/themes/kdrama_romance.png',
    preview: {
      bg: '#FAFAFD',
      accent: '#FF85A1',
      accent2: '#7D82B8',
      text: '#413C58',
    },
  },
  {
    id: 'soft_coquette',
    label: 'Soft Sorry',
    emoji: '🎀',
    description: 'Soft pink, pearl, teddy, and handwritten apology energy',
    coverImage: '/themes/soft_coquette.png',
    preview: {
      bg: '#fff0f5',
      accent: '#e91e8c',
      accent2: '#d4a017',
      text: '#3d1a2e',
    },
  },
  {
    id: 'desi_festive',
    label: 'Birthday Gold',
    emoji: '✨',
    description: 'Cream, gold, cake, and polished birthday celebration',
    coverImage: '/themes/desi_festive.png',
    preview: {
      bg: '#FFF8EA',
      accent: '#D97706',
      accent2: '#E91E8C',
      text: '#432818',
    },
  },
];

export type TemplateId = 'shoot_shot' | 'maan_jao' | 'birthday_roast' | 'bestie_check' | 'netflix_chill';

export interface MessagePreset {
  style: string;
  title: string;
  body: string;
}

export interface StoryQuestion {
  id: string;
  eyebrow: string;
  question: string;
  options: string[];
}

export const TEMPLATE_TYPES = (Object.keys(MOOD_STORIES) as TemplateId[]).map((id) => {
  const { narrative: _narrative, ...template } = MOOD_STORIES[id];
  void _narrative;
  return { id, ...template, hasRunaway: false, gifSearchTerms: [template.label] };
});

export const PRIMARY_TEMPLATE_IDS: TemplateId[] = ['bestie_check', 'shoot_shot', 'maan_jao', 'birthday_roast', 'netflix_chill'];
export const PRIMARY_TEMPLATE_TYPES = PRIMARY_TEMPLATE_IDS
  .map((id) => TEMPLATE_TYPES.find((template) => template.id === id))
  .filter((template): template is (typeof TEMPLATE_TYPES)[number] => Boolean(template));

export const TIERS = [
  {
    id: 'one_moment',
    label: 'One unforgettable moment',
    price: 199,
    duration: 'Keep it forever',
    durationHours: null,
    icon: '💌',
    description: 'Private link, interactive reveal, photo, music, and replies',
    popular: true,
  },
];

export const TEMPLATE_RUNAWAY_TEXTS: Record<string, string[]> = {
  shoot_shot: [
    "Come on, say yes 🙈",
    "The answer is clearly yes 🚫",
    "One chance is all I need 👀",
    "You know this is cute, right? ❤️",
    "Fine, tap the yes button already"
  ],
  maan_jao: [
    "Nice try 👀",
    "Not today",
    "C'mon, one more chance?",
    "Try the other one"
  ],
  birthday_roast: [
    "Wow, rude",
    "Try again",
    "That's not very nice",
    "Pick the nice one"
  ],
  bestie_check: [
    "Rude, but okay, try again",
    "We both know that's not true",
    "Nice try",
    "Pick the other one, you know it's true"
  ],
  netflix_chill: [
    "I already made the plan 🍿",
    "Snacks are included, obviously",
    "Do not leave me on read 🥺",
    "You pick the movie, I pick the snacks",
    "Just tap yes and make my day"
  ]
};

// Deprecated - kept for backwards compat
export type DialogueThemeId = 'desi_genz';
export const DIALOGUE_TEXTS: Record<string, string[]> = {
  desi_genz: TEMPLATE_RUNAWAY_TEXTS.shoot_shot,
};
export const DIALOGUE_THEMES = [{ id: 'desi_genz', label: 'Desi GenZ', emoji: '🇮🇳' }];
