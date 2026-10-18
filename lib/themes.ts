import { MOOD_STORIES } from './moodStories';
export type ThemeId = 'midnight_romance' | 'kdrama_romance' | 'soft_coquette' | 'desi_festive' | 'proposal_glow';
export interface Theme {
  id: ThemeId; label: string; emoji: string; description: string; coverImage: string;
  preview: { bg: string; accent: string; accent2: string; text: string };
}
const creamPreview = { bg: '#fff2e9', accent: '#c75765', accent2: '#b88943', text: '#714337' };
// Keep existing IDs so previously purchased cards and saved drafts still work.
export const THEMES: Theme[] = [
  { id: 'proposal_glow', label: 'The Next Chapter', emoji: '🤍', description: 'Cream stationery, rose ink, and a promise of tomorrow.', coverImage: '/themes/proposal_glow.svg', preview: creamPreview },
  { id: 'midnight_romance', label: 'Peach Evening', emoji: '🌙', description: 'Peach, cream, and a little golden glow for a cosy evening.', coverImage: '/themes/movie_cream.svg', preview: { ...creamPreview, bg: '#fff0e2' } },
  { id: 'kdrama_romance', label: 'Blush & Butterflies', emoji: '💗', description: 'Blush pink, warm cream, and a little courage.', coverImage: '/themes/blush_cream.svg', preview: { ...creamPreview, bg: '#fff0ed' } },
  { id: 'soft_coquette', label: 'Soft Sorry', emoji: '🌿', description: 'A gentle apology on warm cream stationery.', coverImage: '/themes/sorry_cream.svg', preview: creamPreview },
  { id: 'desi_festive', label: 'Birthday Gold', emoji: '✨', description: 'Cream, peach, and gold for their favourite day.', coverImage: '/themes/birthday_cream.svg', preview: { ...creamPreview, bg: '#fff6e9' } },
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
  return { id, ...template, hasRunaway: ['shoot_shot', 'bestie_check', 'netflix_chill'].includes(id), gifSearchTerms: [template.label] };
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
    duration: 'No scheduled expiry',
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
