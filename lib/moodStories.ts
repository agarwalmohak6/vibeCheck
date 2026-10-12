import type { MessagePreset, StoryQuestion, TemplateId, ThemeId } from './themes';

export interface MoodStory {
  label: string;
  emoji: string;
  description: string;
  builderHint: string;
  recommendedTheme: ThemeId;
  defaultCoverImage: string;
  defaultYesText: string;
  defaultNoText: string;
  messagePresets: MessagePreset[];
  storyQuestions: StoryQuestion[];
  narrative: {
    eyebrow: string;
    headline: string;
    intro: string;
    signal: string;
    proof: string;
    messageCue: string;
    answerCue: string;
    beats: string[];
    scribbles: string[];
    scratchTitle: string;
    scratchBody: string;
    ending: string;
    emojis: string[];
    lineup: Array<{ number: string; title: string; body: string }>;
  };
}

// One editorial source for the builder, preview, and recipient. Saved custom words stay intact.
export const MOOD_STORIES: Record<TemplateId, MoodStory> = {
  shoot_shot: {
    label: 'The next chapter 💍', emoji: '💍',
    description: 'A love letter, your favourite moments, and one life-changing question.',
    builderHint: 'A marriage proposal with a warm, handwritten feel. Add one memory that makes it yours.',
    recommendedTheme: 'proposal_glow', defaultCoverImage: '/themes/proposal_glow.svg',
    defaultYesText: 'Yes. A thousand times, yes 💍', defaultNoText: 'I need time to think',
    messagePresets: [
      { style: '🤍 The everyday kind of forever', title: 'My favourite future has you in it', body: 'I love the big moments with you. But it is the ordinary ones I keep coming back to.\nThe conversations with no real ending. The comfort of being myself. The way a day feels different because you are in it. 🤍\nI want more of that. More growing, more learning, more choosing each other when life is lovely and when it asks a little more of us.\nI cannot promise a perfect life. I can promise to keep showing up with love, honesty, and room for who we both become.\nSo here is the question behind all these words:\nWill you marry me? 💍' },
      { style: '✨ A little cinematic', title: 'If this were a film, I would stay for every scene', body: 'Somewhere along the way, you stopped being just part of my day and became part of the future I imagine. ✨\nI want the adventures, yes. But I also want the grocery lists, the sleepy conversations, and the quiet evenings when nothing much happens.\nI want to build a life with you, one real day at a time.\nNo perfect script. Just love, a little courage, and this question:\nWill you marry me? 💍' },
      { style: '💌 Simple & certain', title: 'You. Me. Whatever comes next.', body: 'I love you. I love who I am when I can be honest with you.\nAnd when I think about the life I want to build, I want you beside me. 🤍\nI want us to keep choosing each other, through the beautiful bits and the work in between.\nWill you marry me? 💍' },
    ],
    storyQuestions: [
      { id: 'future', eyebrow: 'A life together', question: 'What would you fill our next chapter with?', options: ['Little everyday joys 🤍', 'New adventures ✨', 'A little of everything'] },
      { id: 'pace', eyebrow: 'Room to feel', question: 'What feels right in this moment?', options: ['Let me take it in', 'I want to talk to you', 'I know my answer'] },
    ],
    narrative: {
      eyebrow: 'For all our tomorrows', headline: 'One question. All my heart.', intro: 'Before I ask about forever, a little reminder of why I want it with you.',
      signal: 'It was never just the grand moments. It was finding you in all the small ones.', proof: 'A few little pieces of the life that brought us here.', messageCue: 'There is something I want to ask you.', answerCue: 'Will you marry me?',
      beats: ['the little things', 'the life we share', 'all that comes next'], scribbles: ['you + me', 'still choosing you', 'our next chapter', 'with all my heart'],
      scratchTitle: 'Here is what forever means to me', scratchBody: 'It is not one perfect day.\nIt is choosing to build a life together, again and again.\nAnd I would love to build that life with you. 🤍', ending: 'Here is to the next chapter. 💍', emojis: ['🤍', '✨', '💍'],
      lineup: [{ number: '01', title: 'My heart, in words', body: 'The things I want you to know.' }, { number: '02', title: 'A little of us', body: 'Moments worth carrying forward.' }, { number: '03', title: 'One more promise', body: 'Something tucked away for you.' }, { number: '04', title: 'Our next chapter', body: 'One question, when you are ready.' }],
    },
  },
  maan_jao: {
    label: 'A real apology 🌿', emoji: '🌿', description: 'Take responsibility. Make space. Start an honest conversation.',
    builderHint: 'A gentle starting point. If you can, name what happened and one change you will follow through on.',
    recommendedTheme: 'soft_coquette', defaultCoverImage: '/themes/soft_coquette.png', defaultYesText: 'I am open to talking 🌿', defaultNoText: 'I need some space',
    messagePresets: [
      { style: '🌿 Honest & accountable', title: 'You deserve a real apology', body: 'I am sorry for hurting you. You deserved more care from me.\nI do not want to explain away the impact or ask you to make me feel better about it. I want to take responsibility.\nIf you want to tell me how this felt, I will listen without arguing with your experience. And if you need space, I will respect that too.\nA message cannot put everything right. What I do next matters more, and I want to put in that work.\nYou do not owe me a quick reply or forgiveness. I just wanted to start with an honest sorry. 🌿' },
      { style: '🤍 Soft & sincere', title: 'No excuses. Just an honest sorry.', body: 'I care about you, and I am sorry I caused you hurt.\nYou should not have to make your feelings smaller to make this easier for me.\nI want to understand, take responsibility, and do better in ways you can actually see.\nIf a conversation would help, I am here to listen. If space would help, I will respect it.\nTake the time you need. 🤍' },
      { style: '💬 Short & direct', title: 'I am sorry', body: 'I hurt you, and I am sorry.\nI want to own that without an excuse attached.\nIf you want to talk, I will listen. If you need distance, I will respect it.\nI know trust takes more than words. What happens next is mine to work on. 🌿' },
    ],
    storyQuestions: [
      { id: 'need', eyebrow: 'Your needs first', question: 'What would help right now?', options: ['Space, please', 'Being heard', 'A calm conversation'] },
      { id: 'next', eyebrow: 'At your pace', question: 'How would you prefer to take the next step?', options: ['A message', 'A conversation later', 'I am not ready yet'] },
    ],
    narrative: {
      eyebrow: 'An honest place to start', headline: 'I owe you more care.', intro: 'No perfect speech. Just an apology, and space for how you feel.',
      signal: 'Your feelings matter, including the ones that are difficult for me to hear.', proof: 'These moments matter to me. They do not erase what needs to change.', messageCue: 'One thing I want to be clear about.', answerCue: 'What feels right for you now?',
      beats: ['with care', 'without excuses', 'at your pace'], scribbles: ['I hear you', 'no rush', 'words into actions', 'room to breathe'],
      scratchTitle: 'There is no deadline on this', scratchBody: 'You do not need to be okay just because I have said sorry.\nTake the time and space you need.\nI will respect your pace. 🌿', ending: 'A conversation can begin with listening. 🌿', emojis: ['🌿', '🤍', '🕊️'],
      lineup: [{ number: '01', title: 'An honest sorry', body: 'Responsibility, without excuses.' }, { number: '02', title: 'What matters', body: 'Care, without a claim on your forgiveness.' }, { number: '03', title: 'Room to breathe', body: 'Something I want you to know.' }, { number: '04', title: 'Your own pace', body: 'You decide what comes next.' }],
    },
  },
  birthday_roast: {
    label: 'Your birthday era 🎂', emoji: '🎂', description: 'A little hype, a lot of love, and a wish worth keeping.',
    builderHint: 'Ready for their birthday. Make it extra personal with a favourite memory or an affectionate inside joke.',
    recommendedTheme: 'desi_festive', defaultCoverImage: '/themes/desi_festive.png', defaultYesText: 'Birthday love received 🎂', defaultNoText: 'Saving this for later',
    messagePresets: [
      { style: '🎂 All the love', title: 'The world got a little better the day you arrived', body: 'Happy birthday to someone I am really glad exists. 🎂\nToday is a good excuse to say what can get lost in an ordinary week: you matter, you are loved, and there is so much about you worth celebrating.\nI hope this next year brings you laughter that catches you off guard, people who show up, and little moments that feel completely your own.\nYou do not have to have it all figured out to deserve a beautiful year.\nMake a wish. Have the cake. Let yourself be celebrated. This day is yours. ✨' },
      { style: '🥳 Gentle roast, big love', title: 'Another year older. Still our favourite plot twist.', body: 'Happy birthday! Your annual reminder that being this iconic is apparently a full-time job. 🥳\nA little wiser? Possibly. Better at replying on time? No promises.\nJokes aside, I am so glad you are in my life. You bring something nobody else does, and I hope you know how loved you are.\nHere is to excellent cake, questionable dance moves, and a year with plenty to smile about.\nThe candles can count. We do not have to. 🎂' },
      { style: '✨ A wish to keep', title: 'A softer, brighter year for you', body: 'Happy birthday. 🤍\nI hope this year gives you more room to breathe, more reasons to laugh, and the courage to follow what feels like you.\nMay you be loved without having to earn it, celebrated without having to perform, and surprised by good things along the way.\nHere is to your next chapter, at your own pace. ✨' },
    ],
    storyQuestions: [
      { id: 'wish', eyebrow: 'Birthday wish list', question: 'What are we wishing more of for you?', options: ['Peace & good people 🤍', 'Adventure & new stories ✨', 'All of the above'] },
      { id: 'celebrate', eyebrow: 'Your day, your rules', question: 'What is your birthday energy?', options: ['Cake and a quiet evening', 'A proper celebration 🥳', 'Let the day surprise me'] },
    ],
    narrative: {
      eyebrow: 'A day for you', headline: 'Today, you get the spotlight.', intro: 'A little celebration of your existence. Cake is encouraged, reading this with a smile is optional.',
      signal: 'The best part of today is getting an excuse to celebrate you out loud.', proof: 'A few moments worth saving. Here is to many more.', messageCue: 'One more birthday wish, just for you.', answerCue: 'Ready to collect a little birthday love?',
      beats: ['very glad you exist', 'more of this, please', 'your next chapter'], scribbles: ['cake first', 'make a wish', 'big birthday love', 'your day'],
      scratchTitle: 'One wish I am making for you', scratchBody: 'More days that feel like you.\nMore people who make you feel loved.\nAnd plenty of tiny, ridiculous reasons to smile. 🎂✨', ending: 'A little birthday love, yours to keep. 🎂', emojis: ['🎂', '🥳', '✨'],
      lineup: [{ number: '01', title: 'Your birthday note', body: 'A few things worth saying out loud.' }, { number: '02', title: 'The good bits', body: 'Some moments for the memory box.' }, { number: '03', title: 'An extra wish', body: 'A tiny surprise for your new year.' }, { number: '04', title: 'All the birthday love', body: 'Yours, no special occasion required.' }],
    },
  },
  bestie_check: {
    label: 'A little more than a crush 💗', emoji: '💗', description: 'From almost saying it to finally saying it. Soft, brave, and honest.',
    builderHint: 'A romantic confession with room for an honest answer. Add a small detail you love about them.',
    recommendedTheme: 'kdrama_romance', defaultCoverImage: '/themes/kdrama_romance.png', defaultYesText: 'I feel it too 💗', defaultNoText: 'I need a little time',
    messagePresets: [
      { style: '💗 Soft & brave', title: 'I think you should know', body: 'I have been trying to find a casual way to say this. Turns out, the honest way is better.\nI like you. More than I have quite managed to say out loud. 💗\nI look forward to talking to you. You cross my mind in the middle of ordinary days. And I would like to find out what this could be, if you feel something too.\nYou do not have to answer right away, or feel the same way.\nI just did not want to keep hiding a real feeling inside another casual hello. ✨' },
      { style: '🙈 A little playful', title: 'This is me officially losing the plot', body: 'Small update: my attempt to act completely normal around you has not gone to plan. 🙈\nSomewhere between wanting to talk to you and smiling at my phone, I caught feelings.\nSo here is the brave bit: I like you, and I would love to see where this could go.\nIf you feel it too, tell me. If you do not, you can tell me that too.\nEither way, at least my very subtle hints can finally retire. 💗' },
      { style: '💌 Just the truth', title: 'No hints this time', body: 'I like you.\nI enjoy your company, I want to know you better, and I would love to take you on a date. 💗\nNo big performance and no pressure to match my feelings.\nJust one honest question: would you like to see where this goes?' },
    ],
    storyQuestions: [
      { id: 'feeling', eyebrow: 'A small check-in', question: 'How is this landing?', options: ['A little smile 💗', 'You surprised me', 'I need to sit with it'] },
      { id: 'next', eyebrow: 'If you feel it too', question: 'What would be a nice way to talk?', options: ['A coffee together ☕', 'A walk and a chat', 'A message first'] },
    ],
    narrative: {
      eyebrow: 'A little courage, a lot of feeling', headline: 'Okay. Here is the honest version.', intro: 'Some things get lost between typing a message and deleting it. This time, I am leaving the words in.',
      signal: 'You have become someone I look forward to. I wanted you to know.', proof: 'Small moments can take up a surprising amount of room in your heart.', messageCue: 'One last thing before you answer.', answerCue: 'Would you like to see where this goes?',
      beats: ['the little smiles', 'a familiar feeling', 'a brave little hello'], scribbles: ['okay, here goes', 'thinking of you', 'no more hints', 'a little courage'],
      scratchTitle: 'The part I do not want you to miss', scratchBody: 'This is an invitation, not an expectation.\nIf you feel it too, I would love to know.\nWhatever your answer, thank you for hearing me. 💗', ending: 'A brave little hello. A new possibility. 💗', emojis: ['💗', '🙈', '✨'],
      lineup: [{ number: '01', title: 'The honest bit', body: 'The words I finally kept.' }, { number: '02', title: 'Little moments', body: 'A few reasons this feels special.' }, { number: '03', title: 'One more thing', body: 'A note tucked under the surface.' }, { number: '04', title: 'Over to you', body: 'Your answer, in your own time.' }],
    },
  },
  netflix_chill: {
    label: 'Just us & a movie 🍿', emoji: '🍿', description: 'A cosy invitation where the company is the best part.',
    builderHint: 'A relaxed movie-night invite. Add a film, place, or date if you already have one in mind.',
    recommendedTheme: 'midnight_romance', defaultCoverImage: '/themes/netflix_chill_cover.png', defaultYesText: 'Let’s make a plan 🍿', defaultNoText: 'Another time?',
    messagePresets: [
      { style: '🍿 Cosy & casual', title: 'The film is negotiable. The company is the point.', body: 'Here is a small plan I would really like: a good movie, something to snack on, and a little time with you. 🍿\nWe can spend too long choosing what to watch, pause for commentary, and decide halfway through that the snacks were the real event.\nNo elaborate evening required. I just think an ordinary night would be better with you in it.\nUp for a movie night? We can pick a day that works for both of us. 🎬' },
      { style: '🎬 Trailer voice', title: 'Coming soon: a very good evening', body: 'Starring: you, me, and a film we may or may not finish. 🎬\nFeaturing: snacks, strong opinions about the plot, and the occasional pause to explain why that character absolutely should not go in there.\nNo dress code. No grand plan. Just a little time together.\nWant to choose a film and make an evening of it? 🍿' },
      { style: '🌙 Quiet & sweet', title: 'Can I borrow an evening?', body: 'Nothing complicated. A film, a few snacks, and some unhurried time together. 🌙\nYou can pick the movie. We can figure out the rest.\nI would just really like your company.\nShall we find a night that works? 🍿' },
    ],
    storyQuestions: [
      { id: 'film', eyebrow: 'Set the mood', question: 'What are we putting on?', options: ['A comfort rewatch 🌙', 'Something funny', 'Surprise me 🎬'] },
      { id: 'snacks', eyebrow: 'The important decision', question: 'What is your snack vote?', options: ['Something salty 🍿', 'Something sweet', 'A bit of both'] },
    ],
    narrative: {
      eyebrow: 'An evening worth making time for', headline: 'A small plan. Very good company.', intro: 'Consider this your invitation to put the day down for a while and press play on something nice.',
      signal: 'The real plan is spending time with you. The movie is a very good excuse.', proof: 'A little reminder that the best plans do not need to be complicated.', messageCue: 'A tiny spoiler before the credits.', answerCue: 'Movie night with me?',
      beats: ['good company', 'press pause on the day', 'something to look forward to'], scribbles: ['you pick the film', 'snack committee', 'one cosy evening', 'press play'],
      scratchTitle: 'A small spoiler', scratchBody: 'I might forget the plot.\nI am much more interested in spending time with you.\nLet’s find an evening that works for us. 🍿', ending: 'The start of a very good plan. 🍿', emojis: ['🍿', '🎬', '🌙'],
      lineup: [{ number: '01', title: 'The invitation', body: 'A small plan I would love to make.' }, { number: '02', title: 'The good company', body: 'The best part of any evening.' }, { number: '03', title: 'A little spoiler', body: 'The real reason I asked.' }, { number: '04', title: 'Shall we?', body: 'The details can come next.' }],
    },
  },
};

export function getMoodStory(templateType: string): MoodStory {
  return Object.hasOwn(MOOD_STORIES, templateType) ? MOOD_STORIES[templateType as TemplateId] : MOOD_STORIES.bestie_check;
}
