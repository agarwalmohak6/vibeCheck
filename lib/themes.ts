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
    label: 'Bestie Bloom',
    emoji: '☔',
    description: 'Pink-lavender, drinks, sparkle, and shared-chaos energy',
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

export const TEMPLATE_TYPES: {
  id: TemplateId;
  label: string;
  emoji: string;
  description: string;
  builderHint: string;
  hasRunaway: boolean;
  defaultCoverImage: string;
  recommendedTheme: ThemeId;
  defaultYesText: string;
  defaultNoText: string;
  gifSearchTerms: string[];
  storyQuestions: StoryQuestion[];
  messagePresets: MessagePreset[];
}[] = [
  {
    id: 'shoot_shot',
    label: 'Love Letter 💘',
    emoji: '💍',
    description: 'A cinematic confession for someone special',
    builderHint: 'Best when the message needs to feel brave, private, and memorable.',
    hasRunaway: true,
    defaultCoverImage: '/themes/midnight_romance.png',
    recommendedTheme: 'midnight_romance',
    defaultYesText: 'YES 💖',
    defaultNoText: 'No 💔',
    gifSearchTerms: ['romantic love letter', 'cute confession', 'soft hearts'],
    storyQuestions: [
      { id: 'noticed', eyebrow: 'First glance', question: 'Did this feel like it was made only for you?', options: ['Yes, very', 'I am listening'] },
      { id: 'signal', eyebrow: 'The signal', question: 'What should they know before you answer?', options: ['This is brave', 'This is sweet', 'This surprised me'] },
      { id: 'pace', eyebrow: 'Your pace', question: 'How fast should this move?', options: ['Slow and real', 'Let us talk', 'I am ready'] },
      { id: 'feeling', eyebrow: 'The feeling', question: 'What emotion is winning right now?', options: ['Butterflies', 'Curiosity', 'Soft smile'] },
      { id: 'reply', eyebrow: 'Final check', question: 'Ready to give them an answer?', options: ['Yes, show me', 'One more second'] },
    ],
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
    label: 'Sorry Card 🥺',
    emoji: '🥺',
    description: 'For when "sorry" over text just does not cut it.',
    builderHint: 'Best for apologizing without sounding lazy, copied, or performative.',
    hasRunaway: true,
    defaultCoverImage: '/themes/maan_jao_cover.png',
    recommendedTheme: 'soft_coquette',
    defaultYesText: 'Forgiven',
    defaultNoText: 'No way',
    gifSearchTerms: ['cute sorry teddy', 'apology please forgive me', 'sad puppy sorry'],
    storyQuestions: [
      { id: 'readiness', eyebrow: 'Before we begin', question: 'Are you ready to hear them out?', options: ['Okay, I will listen', 'Carefully'] },
      { id: 'hurt', eyebrow: 'The honest part', question: 'Did the apology understand what hurt?', options: ['Yes, mostly', 'It needs care'] },
      { id: 'effort', eyebrow: 'The effort', question: 'Does this feel more thoughtful than a text?', options: ['Definitely', 'A little'] },
      { id: 'next_step', eyebrow: 'What next', question: 'What would help things feel lighter?', options: ['A real talk', 'Better actions', 'Some time'] },
      { id: 'answer', eyebrow: 'Final check', question: 'Do you want to respond now?', options: ['I can respond', 'Let me decide'] },
    ],
    messagePresets: [
      {
        style: 'Sincere',
        title: 'I was wrong',
        body: "I was wrong, and I'm not going to dress it up with excuses.\nWhat I said hurt you, and you did not deserve that.\nI keep replaying it and wishing I'd chosen better words.\nI'm sorry, truly. Give me one more chance to be the person you know I can be.",
      },
      {
        style: 'Thoughtful',
        title: 'No excuses here',
        body: 'No excuses here, just me owning it.\nSorry does not erase what happened, but I want you to know I see how it landed on you, and that matters more to me than being right.\nCan we hit reset?',
      },
      {
        style: 'Light but real',
        title: 'Okay, I messed up',
        body: "Okay, I messed up. Like, actually messed up.\nI'm not going to joke about it much.\nI just want you to know I'm sorry, I mean it, and I miss things being easy between us.",
      },
    ],
  },
  {
    id: 'birthday_roast',
    label: 'Happy Birthday 🎂',
    emoji: '🎂',
    description: 'A birthday card that actually feels like a gift.',
    builderHint: 'Best for friends, siblings, and partners when a plain story post feels too lazy.',
    hasRunaway: true,
    defaultCoverImage: '/themes/birthday_roast_cover.png',
    recommendedTheme: 'desi_festive',
    defaultYesText: 'Aww, thanks',
    defaultNoText: 'Still an idiot',
    gifSearchTerms: ['happy birthday cake', 'birthday party celebration', 'birthday hat cute'],
    storyQuestions: [
      { id: 'birthday_mood', eyebrow: 'Birthday mood', question: 'Does this feel like a real birthday moment?', options: ['Yes, cute', 'Very extra'] },
      { id: 'memory', eyebrow: 'Memory check', question: 'What part should they remember about you?', options: ['The chaos', 'The love', 'The cake'] },
      { id: 'wish', eyebrow: 'Your wish', question: 'What kind of year are you claiming?', options: ['Soft wins', 'Big glow-up', 'Peace and cake'] },
      { id: 'reaction', eyebrow: 'Reaction', question: 'How hard are you smiling right now?', options: ['A lot', 'Trying not to', 'Caught me'] },
      { id: 'answer', eyebrow: 'Final check', question: 'Ready to accept the birthday love?', options: ['Yes, obviously', 'Make me blush'] },
    ],
    messagePresets: [
      {
        style: 'Playful',
        title: 'Still iconic',
        body: "Another year down, and somehow you're still this iconic.\nWishing you a birthday as extra as you are, cake first, adulting later.\nHere's to more stories, more chaos, and more reasons to celebrate you.",
      },
      {
        style: 'Warm',
        title: 'Exactly who you are',
        body: "On your day, I just want you to know how loved you are, not for what you do, but exactly for who you are.\nHere's to another year of being unapologetically you.\nHappy birthday.",
      },
      {
        style: 'Soft finish',
        title: 'Jokes aside',
        body: "Jokes aside for one second, you're a genuinely good thing in this world, and today's about celebrating that.\nHappy birthday.\nI hope this year gives you everything you deserve.",
      },
    ],
  },
  {
    id: 'bestie_check',
    label: 'Bestie Card ✨',
    emoji: '✨',
    description: "Tell your person they're one of the best parts of your life.",
    builderHint: 'Best for affection, inside jokes, and quick shareability without making it too heavy.',
    hasRunaway: true,
    defaultCoverImage: '/themes/bestie_cover.png',
    recommendedTheme: 'kdrama_romance',
    defaultYesText: 'Love you bestie',
    defaultNoText: 'Eww, cringe',
    gifSearchTerms: ['best friends cheers', 'bestie drinks toast', 'girls night sparkle'],
    storyQuestions: [
      { id: 'vibe', eyebrow: 'Vibe check', question: 'Is this person officially your chaos partner?', options: ['Unfortunately yes', 'Certified'] },
      { id: 'memory', eyebrow: 'Receipts', question: 'What makes this friendship dangerous?', options: ['Inside jokes', 'Late calls', 'Bad ideas'] },
      { id: 'softness', eyebrow: 'Soft corner', question: 'How sentimental are we allowed to get?', options: ['A little', 'Fully emotional'] },
      { id: 'reply_style', eyebrow: 'Reply energy', question: 'What reply energy fits best?', options: ['Sweet', 'Roast them', 'Both'] },
      { id: 'answer', eyebrow: 'Final check', question: 'Ready to admit you love them?', options: ['Fine, yes', 'Never escaping'] },
    ],
    messagePresets: [
      {
        style: 'Sincere',
        title: 'One of the best parts',
        body: "I don't say this enough, but you're one of the best parts of my life.\nThank you for being exactly who you are, every late-night call, every ridiculous plan.\nI've got you, always.",
      },
      {
        style: 'Funny',
        title: 'Official notice',
        body: "Official notice: you've been appointed my Chief Chaos Partner and Emotional Support Human, effective immediately.\nNo refunds, no returns.\nLove you, bestie.",
      },
      {
        style: 'Soft',
        title: 'My person',
        body: 'Some people come and go, but you feel like forever.\nThank you for being my person through everything.\nJust a tiny reminder that I love you, always.',
      },
    ],
  },
  {
    id: 'netflix_chill',
    label: 'Movie Night 🍿',
    emoji: '🍿',
    description: 'A cozy private invite with a cinematic reveal',
    builderHint: 'Best for a casual plan that still needs a little drama.',
    hasRunaway: true,
    defaultCoverImage: '/themes/netflix_chill_cover.png',
    recommendedTheme: 'midnight_romance',
    defaultYesText: "I'll bring snacks! 🍿",
    defaultNoText: "I'm busy sleeping 😴",
    gifSearchTerms: ['movie night popcorn', 'netflix snacks cozy', 'watching movie together'],
    storyQuestions: [
      { id: 'plan', eyebrow: 'The plan', question: 'Does a slow movie night sound good?', options: ['Very good', 'Depends on snacks'] },
      { id: 'snacks', eyebrow: 'Snacks first', question: 'What is non-negotiable?', options: ['Popcorn', 'Dessert', 'Cold drinks'] },
      { id: 'genre', eyebrow: 'Movie rule', question: 'What should they not pick?', options: ['Horror', 'Boring drama', 'Anything sad'] },
      { id: 'company', eyebrow: 'The real reason', question: 'Is this about the movie or the company?', options: ['The company', 'Both, obviously'] },
      { id: 'answer', eyebrow: 'Final check', question: 'Ready to accept the invite?', options: ['I am in', 'Convince me'] },
    ],
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

export const PRIMARY_TEMPLATE_IDS: TemplateId[] = ['maan_jao', 'birthday_roast', 'bestie_check'];
export const PRIMARY_TEMPLATE_TYPES = TEMPLATE_TYPES.filter((template) =>
  PRIMARY_TEMPLATE_IDS.includes(template.id)
);

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
