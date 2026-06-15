// lib/themes.ts
export type ThemeId = 'midnight_romance' | 'kdrama_romance' | 'soft_coquette' | 'desi_festive';

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
    id: 'midnight_romance',
    label: 'Midnight Romance',
    emoji: '🌙',
    description: 'Dark, cinematic, and high-conversion',
    coverImage: '/themes/midnight_romance.png',
    preview: {
      bg: '#0B0F19',
      accent: '#FF2E93',
      accent2: '#a855f7',
      text: '#f8f0ff',
    },
  },
  {
    id: 'kdrama_romance',
    label: 'K-Drama Magic',
    emoji: '☔',
    description: 'Soft, elegant, and instantly romantic',
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
    label: 'Soft Coquette',
    emoji: '🎀',
    description: 'Delicate pastel pink with luxury shimmer',
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
    label: 'Desi Festive',
    emoji: '✨',
    description: 'Crimson and gold with royal ceremony energy',
    coverImage: '/themes/desi_festive.png',
    preview: {
      bg: '#4C0519',
      accent: '#FACC15',
      accent2: '#D97706',
      text: '#FDE047',
    },
  },
];

export type TemplateId = 'shoot_shot' | 'maan_jao' | 'birthday_roast' | 'bestie_check' | 'netflix_chill';

export interface MessagePreset {
  style: string;
  title: string;
  body: string;
}

export const TEMPLATE_TYPES: {
  id: TemplateId;
  label: string;
  emoji: string;
  hasRunaway: boolean;
  defaultCoverImage: string;
  recommendedTheme: ThemeId;
  defaultYesText: string;
  defaultNoText: string;
  messagePresets: MessagePreset[];
}[] = [
  {
    id: 'shoot_shot',
    label: 'Shoot Your Shot 💘',
    emoji: '💍',
    hasRunaway: true,
    defaultCoverImage: '/themes/midnight_romance.png',
    recommendedTheme: 'midnight_romance',
    defaultYesText: 'YES 💖',
    defaultNoText: 'No 💔',
    messagePresets: [
      {
        style: '🎬 Filmy',
        title: 'This one is personal',
        body: 'I wanted this to feel more special than a text.\nMore honest than a story.\nAnd a lot harder to forget.\nSo here it is — just for you.',
      },
      {
        style: '💀 Honest',
        title: "I have to say this properly",
        body: "I keep trying to send a normal message and it never feels enough.\nYou matter to me more than a quick text can say.\nSo I made this instead.",
      },
      {
        style: '❤️ Direct',
        title: 'No games, just this',
        body: "I've been trying to say this for a while.\nYou make everything better.\nWould you give us a real chance?",
      },
    ],
  },
  {
    id: 'maan_jao',
    label: 'Maan Jao Na 🥺',
    emoji: '🥺',
    hasRunaway: true,
    defaultCoverImage: '/themes/maan_jao_cover.png',
    recommendedTheme: 'soft_coquette',
    defaultYesText: 'Forgiven! 🥺❤️',
    defaultNoText: 'No way 😒',
    messagePresets: [
      {
        style: '😭 Sincere',
        title: 'Please hear me out',
        body: 'I know I messed up.\nI am sorry for the hurt.\nIf you can, give me one chance to make it right.',
      },
      {
        style: '🍕 Thoughtful',
        title: 'I come with peace, not excuses',
        body: "I know I messed up, and I am not here to dodge it.\nI care enough to show up properly.\nCan we talk and reset this?",
      },
      {
        style: '😂 Light but real',
        title: 'Officially submitting my apology',
        body: "This is me owning the mistake.\nNo excuses, no drama.\nJust a genuine sorry and the hope we can move forward.",
      },
    ],
  },
  {
    id: 'birthday_roast',
    label: 'Birthday Roast 🎂',
    emoji: '🎂',
    hasRunaway: true,
    defaultCoverImage: '/themes/birthday_roast_cover.png',
    recommendedTheme: 'kdrama_romance',
    defaultYesText: 'Aww, thanks! 🎂',
    defaultNoText: 'Still an idiot 🙄',
    messagePresets: [
      {
        style: '🔥 Playful',
        title: 'Happy leveling up',
        body: "Another year older, still somehow iconic.\nThe chaos remains, the standards rise.\nWishing you the best kind of birthday.",
      },
      {
        style: '🎉 Warm',
        title: 'For my favorite person',
        body: "You're older, wiser, and still very much you.\nThat is exactly why you are loved so much.\nHappy birthday — you deserve a great year.",
      },
      {
        style: '💅 Soft finish',
        title: "Don't cry reading this",
        body: "I've joked with you for years, but the truth is simple.\nHaving you in my life is a gift.\nHappy birthday — I love you a lot.",
      },
    ],
  },
  {
    id: 'bestie_check',
    label: 'Bestie Vibe Check ✨',
    emoji: '✨',
    hasRunaway: true,
    defaultCoverImage: '/themes/bestie_cover.png',
    recommendedTheme: 'soft_coquette',
    defaultYesText: 'Love you bestie! 👯‍♀️',
    defaultNoText: 'Eww, cringe 💀',
    messagePresets: [
      {
        style: '🥺 Sincere',
        title: 'This is for you',
        body: "You should know this without me needing a big reason.\nYou are one of the best people in my life.\nThank you for being you, bestie.",
      },
      {
        style: '💀 Funny',
        title: 'Okay fine, I love you',
        body: "Apparently a normal message was not dramatic enough.\nYou are my person, my chaos partner, my emotional support human.\nNow accept the compliment.",
      },
      {
        style: '✨ Soft',
        title: 'My forever person 🌟',
        body: "From day one to forever.\nThrough every spiral, every 2am call, every bad decision.\nYou're stuck with me, and I mean that lovingly.",
      },
    ],
  },
  {
    id: 'netflix_chill',
    label: 'Netflix & Chill 🍿',
    emoji: '🍿',
    hasRunaway: true,
    defaultCoverImage: '/themes/netflix_chill_cover.png',
    recommendedTheme: 'midnight_romance',
    defaultYesText: "I'll bring snacks! 🍿",
    defaultNoText: "I'm busy sleeping 😴",
    messagePresets: [
      {
        style: '😏 Lowkey flirty',
        title: 'No plans this weekend?',
        body: "I cleared my schedule on purpose.\nI also stocked snacks.\nCome watch something with me?",
      },
      {
        style: '💬 Direct',
        title: 'Let me be honest',
        body: "This is half Netflix invite, half confession.\nI like being around you more than I should admit.\nWatch something with me?",
      },
      {
        style: '🛋️ Cozy',
        title: 'Couch, blanket, good vibes?',
        body: "It's been a week.\nWe both need a slow night.\nCome over, I'll handle the food and the playlist.",
      },
    ],
  },
];

export const TIERS = [
  {
    id: '1_day',
    label: 'Short & Sweet',
    price: 29,
    duration: '1 Day',
    durationHours: 24,
    icon: '⚡',
    description: 'Best for fast, high-intent sends',
    popular: false,
  },
  {
    id: '3_day',
    label: 'Most Popular',
    price: 49,
    duration: '3 Days',
    durationHours: 72,
    icon: '🔥',
    description: 'Best balance of urgency and shareability',
    popular: true,
  },
  {
    id: 'forever',
    label: 'Infinite Legacy',
    price: 119,
    duration: 'Forever',
    durationHours: null,
    icon: '♾️',
    description: 'Best for keepsake moments and long runs',
    popular: false,
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
    "I am genuinely sorry 🥺",
    "Please hear me out 🙏",
    "I want to make this right",
    "I will do better, promise",
    "Let me earn the forgiveness"
  ],
  birthday_roast: [
    "Keep up, legend 🎂",
    "You are too iconic to miss this",
    "No birthday dodge allowed",
    "This one is for you, seriously",
    "Tap yes before the cake melts"
  ],
  bestie_check: [
    "You know it is true 💅",
    "Stop pretending, bestie 🙄",
    "This is your sign to accept it",
    "Soft launch the friendship ✨",
    "We both know this is the answer"
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
