// lib/themes.ts
export type ThemeId = 'midnight_romance' | 'friends_sitcom' | 'kdrama_romance' | 'soft_coquette' | 'desi_festive' | 'bollywood_drama';

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
    description: 'Baddie aesthetic — neon pink & purple aura',
    coverImage: '/themes/midnight_romance.png',
    preview: {
      bg: '#0B0F19',
      accent: '#FF2E93',
      accent2: '#a855f7',
      text: '#f8f0ff',
    },
  },
  {
    id: 'bollywood_drama',
    label: 'Bollywood Drama',
    emoji: '🎬',
    description: 'Filmi feels — Abba Nahi Maanenge energy',
    coverImage: '/themes/bollywood_drama.png',
    preview: {
      bg: '#1A0008',
      accent: '#FF3D00',
      accent2: '#FFD700',
      text: '#FFE9C8',
    },
  },
  {
    id: 'friends_sitcom',
    label: 'F.R.I.E.N.D.S',
    emoji: '☕',
    description: 'Central Perk vibes — The one where you say yes',
    coverImage: '/themes/friends_sitcom.png',
    preview: {
      bg: '#F4F1EA',
      accent: '#5F4B8B',
      accent2: '#FFB81C',
      text: '#2B2824',
    },
  },
  {
    id: 'kdrama_romance',
    label: 'K-Drama Magic',
    emoji: '☔',
    description: 'Slow-mo eye contact & cherry blossoms',
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
    description: 'Elegant pastel pink & champagne gold',
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
    description: 'Crimson & gold royalty with Cinzel font',
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
  messagePresets: MessagePreset[];
}[] = [
  {
    id: 'shoot_shot',
    label: 'Shoot Your Shot 💘',
    emoji: '💍',
    hasRunaway: true,
    defaultCoverImage: '/themes/midnight_romance.png',
    recommendedTheme: 'midnight_romance',
    messagePresets: [
      {
        style: '🎬 Filmy',
        title: 'Dil ki baat sun le',
        body: 'Maine yeh moment 47 baar rehearse kiya hai.\nTu literally mera Roman Empire hai.\nBas ek chance de? 🥺',
      },
      {
        style: '💀 GenZ Chaos',
        title: "okay I'm down bad",
        body: "Not me spending 3 hours writing this and still fumbling.\nYou're literally it for me ngl.\nPlease say yes I'm begging 😭",
      },
      {
        style: '❤️ Raw Honest',
        title: 'No games, just this',
        body: "I've been trying to say this for a while.\nYou make everything better.\nWould you give us a shot?",
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
    messagePresets: [
      {
        style: '😭 Dramatic',
        title: 'Please maan jao yaar',
        body: 'Main maafi maangta/maangti hun.\nGalti ho gayi, I know.\nBus ek baar maaf kar do, I promise I will do better 🥺',
      },
      {
        style: '🍕 Humble + Bribe',
        title: 'I come in peace... and food',
        body: "Okay I messed up. I know.\nI bought your favourite food as a peace offering.\nCan we please go back to normal? 🙏",
      },
      {
        style: '😂 Funny Sorry',
        title: 'Officially submitting my apology',
        body: "This is a formal apology from my dumb brain.\nI have no excuse except I'm an idiot sometimes.\nPls forgive me, the world is boring without you 💀",
      },
    ],
  },
  {
    id: 'birthday_roast',
    label: 'Birthday Roast 🎂',
    emoji: '🎂',
    hasRunaway: true,
    defaultCoverImage: '/themes/birthday_roast_cover.png',
    recommendedTheme: 'friends_sitcom',
    messagePresets: [
      {
        style: '🔥 Pure Roast',
        title: 'Happy getting older lol',
        body: "Another year of you surviving on vibes and luck.\nCongrats on not giving up.\nSeriously though, you're my favourite idiot. HBD 🎂",
      },
      {
        style: '🎉 Sweet-Savage',
        title: 'For my favourite disaster',
        body: "You're older, wiser, and somehow still as chaotic.\nBut also genuinely one of the best people I know.\nHappy birthday, you absolute legend 🎉",
      },
      {
        style: '💅 Senti at the end',
        title: "Don't cry reading this (you will)",
        body: "I've been roasting you for years and honestly I'd do it forever.\nBecause having you in my life is the best thing.\nHappy birthday bestie. I love you (don't make it weird) 💖",
      },
    ],
  },
  {
    id: 'bestie_check',
    label: 'Bestie Vibe Check ✨',
    emoji: '✨',
    hasRunaway: true,
    defaultCoverImage: '/themes/bestie_cover.png',
    recommendedTheme: 'friends_sitcom',
    messagePresets: [
      {
        style: '🥺 Senti Mode',
        title: 'This is for you',
        body: "Okay I'm not being cringe but you need to know.\nYou are genuinely one of the best people in my life.\nThank you for existing, bestie 💗",
      },
      {
        style: '💀 Savage Bestie',
        title: 'Okay fine I love you',
        body: "I can't believe I have to send a whole card to say this.\nYou're my person. My chaos partner. My emotional support human.\nNow stop being weird about it 💅",
      },
      {
        style: '✨ Cringe-Cute',
        title: 'My forever person 🌟',
        body: "From day one to forever.\nThrough every spiral, every 2am call, every bad decision.\nYou're stuck with me. No refunds. Love you 🫶",
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
    messagePresets: [
      {
        style: '😏 Lowkey Flirty',
        title: 'No plans this weekend?',
        body: "I may have cleared my entire schedule.\nAnd I may have bought a lot of snacks.\nCome watch something with me? 🍿",
      },
      {
        style: '💬 Bold Move',
        title: 'Let me shoot my shot casually',
        body: "Okay so this is half Netflix suggestion, half confession.\nI like hanging out with you more than I should admit.\nWatch something with me? (no pressure, full pressure) 😅",
      },
      {
        style: '🛋️ Chill Invite',
        title: 'Couch, blanket, good vibes?',
        body: "It's been a week.\nWe both need a chill night.\nCome over, I'll handle the food. You handle the playlist.",
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
    description: 'Perfect for a quick vibe check',
    popular: false,
  },
  {
    id: '3_day',
    label: 'Most Popular',
    price: 49,
    duration: '3 Days',
    durationHours: 72,
    icon: '🔥',
    description: 'Enough time for them to show everyone',
    popular: true,
  },
  {
    id: 'forever',
    label: 'Infinite Legacy',
    price: 119,
    duration: 'Forever',
    durationHours: null,
    icon: '♾️',
    description: 'This card lives as long as you want it to',
    popular: false,
  },
];

export const TEMPLATE_RUNAWAY_TEXTS: Record<string, string[]> = {
  shoot_shot: [
    "Mummy nahi maanegi 🙈",
    "Error 404: Option Not Found 🚫",
    "Abba Nahi Maanenge! 👴",
    "Log kya kahenge? 👀",
    "Fine, click YES instead ❤️"
  ],
  maan_jao: [
    "I bought food 🍕",
    "Pls I'm crying 😭",
    "It was just one mistake!",
    "I'll never do it again 🙏",
    "I'll buy you iced coffee 🧋"
  ],
  birthday_roast: [
    "Too slow boomer 👴",
    "Your reflexes are aging 📉",
    "No cake for you 🎂",
    "Try again grandpa 🦯",
    "Maybe next year? 🤡"
  ],
  bestie_check: [
    "You literally are 💅",
    "Stop lying 🙄",
    "I have your ugly pics 📸",
    "Accept it bestie ✨",
    "We both know the truth 👯‍♀️"
  ],
  netflix_chill: [
    "You have no plans anyway 🛋️",
    "I have snacks 🍿",
    "Don't leave me hanging 🥺",
    "We can watch whatever you want 📺",
    "Just click YES already!"
  ]
};

// Deprecated - kept for backwards compat
export type DialogueThemeId = 'desi_genz';
export const DIALOGUE_TEXTS: Record<string, string[]> = {
  desi_genz: TEMPLATE_RUNAWAY_TEXTS.shoot_shot,
};
export const DIALOGUE_THEMES = [{ id: 'desi_genz', label: 'Desi GenZ', emoji: '🇮🇳' }];
