"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { TEMPLATE_TYPES, type MessagePreset, type StoryQuestion } from "@/lib/themes";
import EnvelopeReveal from "@/components/EnvelopeReveal";
import RunawayButton from "@/components/RunawayButton";
import VinylDisk from "@/components/VinylDisk";
import SecretCodeGate from "@/components/SecretCodeGate";
import HeartCanvas from "@/components/HeartCanvas";
import AmbientBackground from "@/components/AmbientBackground";
import confetti from "canvas-confetti";
import {
  RECIPIENT_COPY,
  formatPersonName,
  getLocalizedActionLabels,
  getTemplateLocaleCopy,
  type RecipientLocale,
} from "@/lib/recipientI18n";
import type { PublicCard } from "@/types/vibecheck";

interface RecipientViewProps {
  card: PublicCard;
  initialRoomMode?: boolean;
}

type HinglishTemplateCopy = {
  label: string;
  defaultYesText: string;
  defaultNoText: string;
  storyQuestions: StoryQuestion[];
  messagePresets: Array<Pick<MessagePreset, "title" | "body">>;
};

const HINGLISH_RECIPIENT_COPY = {
  ...RECIPIENT_COPY.en,
  privateCard: "Private VibeCheck",
  languageLabel: "Hinglish-only card",
  ctaPrompt: "Final answer ka time.",
  noButtonWarning: "No button thoda drama karega, bas cute wala.",
  successHeading: "Answer send ho gaya.",
  successSubtext: "Moment lock ho gaya. Creator ko signal mil jayega, aur yeh memory safe rahegi.",
  story: {
    ...RECIPIENT_COPY.en.story,
    compactEyebrow: "5-step reveal",
    eyebrow: "Answer se pehle thoda build-up",
    title: (recipientName: string) => `${recipientName} ko moment feel karne do first.`,
    completeTitle: "Story warm ho gayi.",
    completeBody: "Ab woh answer jo actually matter karta hai.",
  },
} satisfies typeof RECIPIENT_COPY.en;

const HINGLISH_TEMPLATE_COPY: Record<string, HinglishTemplateCopy> = {
  shoot_shot: {
    label: "Dil wali baat 💍",
    defaultYesText: "Haan, obviously 💖",
    defaultNoText: "Thoda ruk jao",
    storyQuestions: [
      { id: "noticed", eyebrow: "First feel", question: "Yeh sirf tumhare liye bana hua laga?", options: ["Haan, bilkul", "I am listening"] },
      { id: "signal", eyebrow: "Signal", question: "Answer se pehle unhe kya pata hona chahiye?", options: ["Cute effort", "Brave move", "Unexpected tha"] },
      { id: "pace", eyebrow: "Pace", question: "Isko kaise move karna chahiye?", options: ["Slow and real", "Pehle baat", "I am ready"] },
      { id: "feeling", eyebrow: "Feeling", question: "Abhi kya win kar raha hai?", options: ["Butterflies", "Soft smile", "Curiosity"] },
      { id: "answer", eyebrow: "Final check", question: "Answer dene ke mood mein ho?", options: ["Haan, show me", "One more second"] },
    ],
    messagePresets: [
      {
        title: "Yeh personal hai",
        body: "Normal text se zyada special banana tha.\nStory se zyada honest.\nAur thoda unforgettable.\nToh yeh raha, sirf tumhare liye.",
      },
      {
        title: "Mujhe yeh properly bolna tha",
        body: "Main normal message bhejne ki koshish karta raha, but enough nahi laga.\nTum mere liye ek quick text se kaafi zyada matter karti ho.\nIsliye maine yeh banaya.",
      },
      {
        title: "No games, bas sach",
        body: "Main kaafi time se yeh bolna chahta tha.\nTum sab kuch better feel kara deti ho.\nKya tum humein ek real chance dogi?",
      },
    ],
  },
  maan_jao: {
    label: "Maan jao card 🥺",
    defaultYesText: "Theek hai, maaf",
    defaultNoText: "Abhi nahi",
    storyQuestions: [
      { id: "readiness", eyebrow: "Start se pehle", question: "Unki baat sunne ka thoda sa mood hai?", options: ["Theek hai, sunungi", "Carefully"] },
      { id: "hurt", eyebrow: "Honest part", question: "Apology ne samjha ki hurt kahan hua?", options: ["Mostly yes", "Aur care chahiye"] },
      { id: "effort", eyebrow: "Effort", question: "Normal sorry text se zyada thoughtful laga?", options: ["Definitely", "Thoda sa"] },
      { id: "next_step", eyebrow: "Next", question: "Cheezein light karne ke liye kya help karega?", options: ["Real talk", "Better actions", "Thoda time"] },
      { id: "answer", eyebrow: "Final check", question: "Ab reply karna hai?", options: ["I can reply", "Let me decide"] },
    ],
    messagePresets: [
      {
        title: "Mujhse galti hui",
        body: "Mujhse galti hui, aur main isko excuses se cover nahi karunga.\nMeri baat se tumhe hurt hua, aur tum deserve nahi karti thi.\nMain baar-baar soch raha hoon ki mujhe better words choose karne chahiye the.\nI am sorry, truly. Ek chance aur?",
      },
      {
        title: "No excuses here",
        body: "No excuses, bas apni galti own kar raha hoon.\nSorry sab erase nahi karta, but mujhe samajh aa raha hai ki tumhe kaisa laga.\nCan we hit reset?",
      },
      {
        title: "Okay, maine mess kiya",
        body: "Okay, maine actual mess kiya.\nIspe joke nahi banaunga.\nBas itna kehna hai: I am sorry, I mean it, aur mujhe hamari easy wali vibe miss ho rahi hai.",
      },
    ],
  },
  birthday_roast: {
    label: "Birthday scene 🎂",
    defaultYesText: "Aww, thanks",
    defaultNoText: "Still annoying",
    storyQuestions: [
      { id: "birthday_mood", eyebrow: "Birthday mood", question: "Real birthday moment jaisa feel ho raha hai?", options: ["Haan cute", "Very extra"] },
      { id: "memory", eyebrow: "Memory check", question: "Tumhare baare mein kya yaad rahe?", options: ["The chaos", "The love", "The cake"] },
      { id: "wish", eyebrow: "Wish", question: "Is year ka mood kya claim kar rahe ho?", options: ["Soft wins", "Big glow-up", "Peace and cake"] },
      { id: "reaction", eyebrow: "Reaction", question: "Smile kitni aa rahi hai?", options: ["Bahut", "Hide kar rahi hoon", "Caught me"] },
      { id: "answer", eyebrow: "Final check", question: "Birthday love accept karein?", options: ["Obviously", "Make me blush"] },
    ],
    messagePresets: [
      {
        title: "Still iconic",
        body: "Ek aur year down, aur somehow tum abhi bhi itni iconic ho.\nBirthday tumhari tarah extra ho: cake first, adulting later.\nMore stories, more chaos, aur tumhe celebrate karne ki more reasons.",
      },
      {
        title: "Exactly tum jaisi",
        body: "Aaj bas yeh kehna hai ki tum loved ho, not for what you do, but exactly for who you are.\nAnother year of being unapologetically you.\nHappy birthday.",
      },
      {
        title: "Jokes aside",
        body: "Jokes aside for one second, tum genuinely is world ki good things mein se ho.\nAaj tumhe celebrate karne ka day hai.\nHappy birthday. I hope this year gives you everything you deserve.",
      },
    ],
  },
  bestie_check: {
    label: "Dil ki baat 💗",
    defaultYesText: "Mujhe bhi feel hota hai 💗",
    defaultNoText: "Thoda sochne do",
    storyQuestions: [
      { id: "vibe", eyebrow: "Vibe check", question: "Yeh person officially tumhara chaos partner hai?", options: ["Unfortunately yes", "Certified"] },
      { id: "memory", eyebrow: "Receipts", question: "Yeh bond dangerous kyun hai?", options: ["Inside jokes", "Late calls", "Bad ideas"] },
      { id: "softness", eyebrow: "Soft corner", question: "Kitna sentimental allowed hai?", options: ["Thoda", "Fully emotional"] },
      { id: "reply_style", eyebrow: "Reply energy", question: "Reply ka vibe kya hona chahiye?", options: ["Sweet", "Roast them", "Both"] },
      { id: "answer", eyebrow: "Final check", question: "Ready ho admit karne ke liye?", options: ["Fine, yes", "Never escaping"] },
    ],
    messagePresets: [
      {
        title: "Mujhe yeh properly bolna tha",
        body: "Perfect tareeka nahi pata, toh honest version bol raha hoon.\nTum mere liye usually jitna bolta hoon, usse kaafi zyada matter karti ho.\nNormal text ke peeche hide nahi karna tha, isliye yeh banaya.",
      },
      {
        title: "Tiny confession",
        body: "Yeh main approx thirty seconds ke liye brave hoke bol raha hoon.\nI like you. A lot.\nPlease kindness ke saath reply karna, aur thoda honesty bhi.",
      },
      {
        title: "No mixed signals",
        body: "Jab tum life mein hoti ho, everything better feel hota hai.\nMain pretend nahi karna chahta ki yeh mere liye casual hai.\nWould you give this a real chance?",
      },
    ],
  },
  netflix_chill: {
    label: "Movie night 🍿",
    defaultYesText: "Snacks meri taraf 🍿",
    defaultNoText: "Main so rahi hoon",
    storyQuestions: [
      { id: "plan", eyebrow: "Plan", question: "Slow movie night ka mood hai?", options: ["Very good", "Snacks pe depend"] },
      { id: "snacks", eyebrow: "Snacks first", question: "Non-negotiable kya hai?", options: ["Popcorn", "Dessert", "Cold drinks"] },
      { id: "genre", eyebrow: "Movie rule", question: "Kya pick nahi karna chahiye?", options: ["Horror", "Boring drama", "Anything sad"] },
      { id: "company", eyebrow: "Real reason", question: "Movie ke liye ya company ke liye?", options: ["Company", "Both obviously"] },
      { id: "answer", eyebrow: "Final check", question: "Invite accept karein?", options: ["I am in", "Convince me"] },
    ],
    messagePresets: [
      {
        title: "Weekend free hai?",
        body: "Maine schedule on purpose clear kiya.\nSnacks bhi stocked hain.\nCome watch something with me?",
      },
      {
        title: "Honestly bolun?",
        body: "Yeh half Netflix invite hai, half confession.\nMujhe tumhare around rehna zyada pasand hai than I should admit.\nWatch something with me?",
      },
      {
        title: "Couch, blanket, vibes?",
        body: "Week heavy tha.\nDono ko slow night chahiye.\nCome over, food and playlist meri responsibility.",
      },
    ],
  },
};

function buildCoverImages(uploadedCovers?: string[], primaryCover?: string): string[] {
  const seen = new Set<string>();
  const unique = [...(uploadedCovers || []), primaryCover].filter(
    (source): source is string => {
      const normalized = source?.trim();
      if (!normalized || normalized.startsWith("/themes/") || seen.has(normalized)) return false;
      seen.add(normalized);
      return true;
    },
  );

  return unique.slice(0, 4);
}

export default function RecipientView({ card, initialRoomMode = false }: RecipientViewProps) {
  const [envelopeOpened, setEnvelopeOpened] = useState(initialRoomMode);
  const [secretUnlocked, setSecretUnlocked] = useState(
    initialRoomMode || !card.card_data.has_secret_code,
  );
  const language: RecipientLocale = "en";
  const templateMeta = TEMPLATE_TYPES.find((t) => t.id === card.template_type);
  const hasRunaway = templateMeta?.hasRunaway || false;
  const hinglishTemplate = HINGLISH_TEMPLATE_COPY[card.template_type];
  const localizedTemplate = getTemplateLocaleCopy(card.template_type, language);
  const localizedActionLabels = getLocalizedActionLabels(card.template_type, language);
  const recipientCopy = HINGLISH_RECIPIENT_COPY;
  const creatorName = formatPersonName(card.creator_name, "Someone");
  const recipientName = formatPersonName(card.recipient_name, "you");
  const templateLabel =
    hinglishTemplate?.label || localizedTemplate?.label || templateMeta?.label || "Private card";
  const rawMessageTitle = card.card_data.message_title?.trim() || "";
  const rawMainBody = card.card_data.main_body?.trim() || "";
  const titlePresetIndex =
    !rawMessageTitle || /^A message from\s+/i.test(rawMessageTitle)
      ? 0
      : templateMeta?.messagePresets?.findIndex(
          (preset) => preset.title.trim() === rawMessageTitle,
        ) ?? -1;
  const bodyPresetIndex =
    !rawMainBody || rawMainBody === "Tap YES to accept!"
      ? 0
      : templateMeta?.messagePresets?.findIndex(
          (preset) => preset.body.trim() === rawMainBody,
        ) ?? -1;
  const displayMessageTitle =
    titlePresetIndex >= 0
      ? hinglishTemplate?.messagePresets?.[titlePresetIndex]?.title ||
        localizedTemplate?.messagePresets?.[titlePresetIndex]?.title ||
        templateMeta?.messagePresets?.[titlePresetIndex]?.title ||
        templateMeta?.label.replace(/\s[^\s]*$/, "") ||
        rawMessageTitle
      : rawMessageTitle;
  const displayMainBody =
    bodyPresetIndex >= 0
      ? hinglishTemplate?.messagePresets?.[bodyPresetIndex]?.body ||
        localizedTemplate?.messagePresets?.[bodyPresetIndex]?.body ||
        templateMeta?.messagePresets?.[bodyPresetIndex]?.body ||
        templateMeta?.builderHint ||
        rawMainBody
      : rawMainBody;
  const cardYesText = card.card_data.yes_btn_text?.trim();
  const cardNoText = card.card_data.no_btn_text?.trim();
  const displayYesText =
    localizedActionLabels &&
    (!cardYesText || cardYesText === templateMeta?.defaultYesText)
      ? hinglishTemplate?.defaultYesText || localizedActionLabels.yesText
      : card.card_data.yes_btn_text;
  const displayNoText =
    localizedActionLabels &&
    (!cardNoText || cardNoText === templateMeta?.defaultNoText)
      ? hinglishTemplate?.defaultNoText || localizedActionLabels.noText
      : card.card_data.no_btn_text;
  const revealStory = useMemo(
    () => getRevealStory(card.template_type, creatorName, recipientName, templateLabel),
    [card.template_type, creatorName, recipientName, templateLabel],
  );
  const coverImages = useMemo(
    () => buildCoverImages(card.card_data.cover_image_urls, card.card_data.cover_image_url),
    [card.card_data.cover_image_urls, card.card_data.cover_image_url],
  );
  const storyQuestions = card.card_data.story_questions?.length
    ? card.card_data.story_questions
    : hinglishTemplate?.storyQuestions || templateMeta?.storyQuestions;

  const [yesClicked, setYesClicked] = useState(false);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const creatorToken = new URLSearchParams(window.location.search).get("ct");
      if (creatorToken) {
        localStorage.setItem(`creator_token_${card.id}`, creatorToken);
      }
    }
  }, [card.id]);

  const handleEnvelopeOpen = () => {
    setEnvelopeOpened(true);
    void fetch(`/api/cards/${card.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "envelope_opened",
        metadata: { gated: Boolean(card.card_data.has_secret_code) },
      }),
    });

    // Trigger music using the gestured audio hook exposed globally
    setTimeout(() => {
      if (typeof window !== "undefined") {
        const win = window as Window &
          typeof globalThis & { __startMusic?: () => void };
        if (win.__startMusic) {
          win.__startMusic();
        }
      }
    }, 100);
  };

  const handleUnlock = () => {
    setSecretUnlocked(true);
    setTimeout(() => {
      if (typeof window !== "undefined") {
        const win = window as Window &
          typeof globalThis & { __startMusic?: () => void };
        if (win.__startMusic) {
          win.__startMusic();
        }
      }
    }, 100);
  };

  const handleYes = () => {
    setYesClicked(true);
    const colors = ["#FACC15", "#FF2E93", "#a855f7", "#00FF66", "#ffffff"];
    // Massive blast from bottom
    [0, 200, 400, 600, 800].forEach((d) =>
      setTimeout(
        () =>
          confetti({
            particleCount: 200,
            spread: 180,
            origin: { y: 1 },
            startVelocity: 60,
            colors,
          }),
        d,
      ),
    );

    // Automatically send an acceptance message to the database
    const positiveLabel = displayYesText || card.card_data.yes_btn_text || "YES 💖";
    void fetch(`/api/cards/${card.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "cta_accepted",
        metadata: { label: positiveLabel },
      }),
    });
  };

  const handleDodge = (label: string, dodgeCount: number) => {
    void fetch(`/api/cards/${card.id}/events`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        event_type: "runaway_dodged",
        metadata: { label, dodge_count: dodgeCount },
      }),
    });
  };

  return (
    <div
      className="vc-recipient-shell no-capture min-h-screen relative overflow-hidden flex flex-col"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-body)",
      }}
      data-theme={card.theme_selected}
      data-template={card.template_type}
      lang="en-IN"
      data-locale={language}
      data-room-mode="false"
    >
      {/* Floating hearts canvas background for Soft Coquette theme */}
      {card.theme_selected === "soft_coquette" && <HeartCanvas />}

      {/* Neon Celebration Morph on Success */}
      <AnimatePresence>
        {yesClicked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="fixed inset-0 pointer-events-none z-1"
            style={{
              background:
                "radial-gradient(circle at center, color-mix(in srgb, var(--accent), transparent 58%) 0%, color-mix(in srgb, var(--accent2), transparent 68%) 42%, color-mix(in srgb, var(--bg), #000 8%) 100%)",
            }}
          />
        )}
      </AnimatePresence>

      <AmbientBackground />

      {/* Secret code gate */}
      {envelopeOpened && !secretUnlocked && (
        <SecretCodeGate
          cardId={card.id}
          unlockQuestion={card.card_data.unlock_question}
          onUnlock={handleUnlock}
        />
      )}

      {/* Envelope reveal overlay */}
      {!envelopeOpened && (
        <EnvelopeReveal
          creatorName={card.creator_name}
          recipientName={recipientName}
          templateType={card.template_type}
          gifUrl={card.card_data.gif_url || undefined}
          theme={card.theme_selected}
          onOpen={handleEnvelopeOpen}
        />
      )}

      {/* Music player (using trackId or fallback musicUrl) */}
      {envelopeOpened &&
        secretUnlocked &&
        (card.music_track_id || card.card_data.music_url) && (
          <VinylDisk
            trackId={card.music_track_id || undefined}
            musicUrl={card.card_data.music_url || undefined}
            musicLabel={card.card_data.music_label || undefined}
          />
        )}

      {/* Card content */}
      <AnimatePresence>
        {envelopeOpened && secretUnlocked && (
          <motion.main
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            data-room-mode="false"
          >
            {!yesClicked ? (
              <RecipientRevealDrive
                cardId={card.id}
                coverImages={coverImages}
                displayMessageTitle={displayMessageTitle}
                displayMainBody={displayMainBody}
                creatorName={creatorName}
                recipientName={recipientName}
                templateType={card.template_type}
                templateLabel={templateLabel}
                templateEmoji={templateMeta?.emoji || "💌"}
                revealStory={revealStory}
                storyQuestions={storyQuestions}
                hasRunaway={hasRunaway}
                ctaPrompt={recipientCopy.ctaPrompt}
                noButtonWarning={recipientCopy.noButtonWarning}
                yesText={displayYesText}
                noText={displayNoText}
                onYes={handleYes}
                onDodge={handleDodge}
              />
            ) : (
              <RecipientFinalReveal
                coverImages={coverImages}
                displayMessageTitle={displayMessageTitle}
                displayMainBody={displayMainBody}
                recipientName={recipientName}
                creatorName={creatorName}
                successEmoji={recipientCopy.successEmoji}
                successHeading={recipientCopy.successHeading}
                successSubtext={recipientCopy.successSubtext}
              />
            )}

            {/* Footer */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="vc-recipient-footer text-center py-4 mt-2"
            >
              <p
                className="text-xs font-semibold"
                style={{ color: "var(--text3)" }}
              >
                {recipientCopy.footerMadeWith}
                <Link
                  href="/"
                  style={{ color: "var(--accent)" }}
                  className="font-bold underline hover:opacity-80"
                >
                  {recipientCopy.footerLink}
                </Link>
                {recipientCopy.footerSuffix}
              </p>
            </motion.div>
          </motion.main>
        )}
      </AnimatePresence>
    </div>
  );
}

type RevealStory = {
  eyebrow: string;
  headline: string;
  intro: string;
  signal: string;
  proof: string;
  messageCue: string;
  answerCue: string;
  beats: string[];
  scribbles: string[];
  lineup: Array<{
    number: string;
    title: string;
    body: string;
  }>;
};

type RecipientRevealDriveProps = {
  cardId: string;
  coverImages: string[];
  displayMessageTitle: string;
  displayMainBody: string;
  creatorName: string;
  recipientName: string;
  templateType: string;
  templateLabel: string;
  templateEmoji: string;
  revealStory: RevealStory;
  storyQuestions?: StoryQuestion[];
  hasRunaway: boolean;
  ctaPrompt: string;
  noButtonWarning: string;
  yesText?: string;
  noText?: string;
  onYes: () => void;
  onDodge: (label: string, dodgeCount: number) => void;
};

const REVEAL_STORIES: Record<string, Omit<RevealStory, "headline" | "intro">> = {
  shoot_shot: {
    eyebrow: "Dil wali baat",
    signal: "Signal tab loud ho gaya jab casual rehna almost impossible ho gaya.",
    proof: "Har chhoti receipt same baat bol rahi hai: yeh dry text ke liye nahi bana.",
    messageCue: "Real words scribble ke neeche hain. Slow scroll karo, feeling load hone do.",
    answerCue: "Last checkpoint. Pressure nahi, bas honest answer ka moment hai.",
    beats: ["private launch", "heart rate up", "soft proof", "answer pending"],
    scribbles: ["not casual", "sirf tum", "properly bolo", "one real chance"],
    lineup: [
      { number: "01", title: "Scene set karo", body: "Link forwarded nahi, made-for-you feel hona chahiye." },
      { number: "02", title: "Receipts dikhao", body: "Main words se pehle tiny signals stack hote hain." },
      { number: "03", title: "Ask reveal karo", body: "Message handwritten confession ki tarah land karta hai." },
      { number: "04", title: "Answer lo", body: "Soft final checkpoint, phir real choice." },
    ],
  },
  maan_jao: {
    eyebrow: "Maan jao sequence",
    signal: "Yeh forwarded sorry nahi hai. Yeh naam ke saath ek proper repair attempt hai.",
    proof: "Effort hi point hai: slow, clean, aur itna honest ki thoda ruk ke feel ho.",
    messageCue: "Apology layers mein reveal hogi, kyunki rush karne se whole vibe kharab hoti.",
    answerCue: "Final checkpoint. Reply tabhi jab tumhe fair lage.",
    beats: ["own it", "no excuses", "gentle proof", "reply jab ready"],
    scribbles: ["galti meri", "no excuses", "sun lo na", "soft reset"],
    lineup: [
      { number: "01", title: "Cleanly own karo", body: "Dramatic intro nahi, copied caption nahi. Bas ownership." },
      { number: "02", title: "Personal banao", body: "Page slow hota hai taaki apology specific feel kare." },
      { number: "03", title: "Note reveal karo", body: "Real words soft scratch aur scribble layer se aate hain." },
      { number: "04", title: "Control do", body: "Next step woh tab decide karein jab ready ho." },
    ],
  },
  birthday_roast: {
    eyebrow: "Birthday ignition",
    signal: "Day ko proper entrance milni chahiye. Lazy story post ya copied caption nahi.",
    proof: "Tiny birthday arena, main-character energy aur private chaos ke liye built.",
    messageCue: "Wish scribbles ke neeche wrapped hai. Reveal ko drama karne do.",
    answerCue: "Last checkpoint. Birthday love accept karo aur moment lock karo.",
    beats: ["main character", "receipts loaded", "cake-level effort", "birthday reply"],
    scribbles: ["still iconic", "cake first", "main character", "wish pending"],
    lineup: [
      { number: "01", title: "Stage light karo", body: "Birthday moment ko proper first scene milta hai." },
      { number: "02", title: "Proof drop karo", body: "Thoda chaos, thoda love, full main-character energy." },
      { number: "03", title: "Wish reveal karo", body: "Note dramatic handwritten reveal ke saath enters." },
      { number: "04", title: "Love accept", body: "Birthday love accept hota hai aur moment save." },
    ],
  },
  bestie_check: {
    eyebrow: "Soft launch vibes",
    signal: "Yeh woh part hai jahan normal text awkward act karna start kar deta.",
    proof: "Inside jokes, soft corners, aur tiny receipts finally line up ho rahe hain.",
    messageCue: "Honest part scribble layer ke neeche hai. Isko proper entrance chahiye.",
    answerCue: "Last checkpoint. Reply energy choose karo, phir final answer.",
    beats: ["vibe locked", "receipts stacked", "soft corner", "reply energy"],
    scribbles: ["bol do", "normal text nahi", "soft launch", "you matter"],
    lineup: [
      { number: "01", title: "Vibe catch karo", body: "Opening bolta hai yeh normal disposable message nahi." },
      { number: "02", title: "Receipts stack", body: "Little details feeling ko earned bana dete hain." },
      { number: "03", title: "Thing bolo", body: "Honest note ek saath dump nahi hota, reveal hota hai." },
      { number: "04", title: "Energy match", body: "Reply mood choose hota hai before final answer." },
    ],
  },
  netflix_chill: {
    eyebrow: "Cinematic invite",
    signal: "Plan simple hai, but reveal boring allowed nahi hai.",
    proof: "Snacks, timing, aur suspicious amount of effort already queued hai.",
    messageCue: "Invite scribble layer ke neeche hai. Thoda suspense deserve karta hai.",
    answerCue: "Last checkpoint. Credits roll hone se pehle answer pick karo.",
    beats: ["press play", "snacks queued", "blanket reserved", "answer scene"],
    scribbles: ["movie night", "press play", "snacks ready", "company matters"],
    lineup: [
      { number: "01", title: "Press play", body: "Invite tiny trailer ki tarah open hota hai." },
      { number: "02", title: "Details queue", body: "Snacks, timing, aur real reason frame mein aate hain." },
      { number: "03", title: "Plan reveal", body: "Note woh scene ban ke aata hai jiska wait tha." },
      { number: "04", title: "Ending choose", body: "Credits se pehle answer pick hota hai." },
    ],
  },
};

function getRevealStory(
  templateType: string,
  creatorName: string,
  recipientName: string,
  templateLabel: string,
): RevealStory {
  const base = REVEAL_STORIES[templateType] || REVEAL_STORIES.bestie_check;
  return {
    ...base,
    headline: `${recipientName}, ${creatorName} ne yeh sirf tumhare liye banaya`,
    intro: `${templateLabel} hai, but boring text nahi: scroll karo, decode karo, phir dil se answer.`,
  };
}

function RecipientRevealDrive({
  cardId,
  coverImages,
  displayMessageTitle,
  displayMainBody,
  creatorName,
  recipientName,
  templateType,
  templateLabel,
  templateEmoji,
  revealStory,
  storyQuestions,
  hasRunaway,
  ctaPrompt,
  noButtonWarning,
  yesText,
  noText,
  onYes,
  onDodge,
}: RecipientRevealDriveProps) {
  const [stage, setStage] = useState<RevealStage>("gate");
  const previewLine = displayMainBody
    .split(/\s+/)
    .slice(0, 16)
    .join(" ");
  const goToFinale = () => {
    setStage("finale");
    window.setTimeout(onYes, 2300);
  };

  return (
    <section
      className="vc-reveal-drive vc-koikoi-flow"
      data-template={templateType}
      aria-label="Private reveal sequence"
    >
      <CuteGestureLayer templateType={templateType} />

      <AnimatePresence mode="wait">
        {stage === "gate" && (
          <KoikoiGateStage
            key="gate"
            creatorName={creatorName}
            recipientName={recipientName}
            templateEmoji={templateEmoji}
            templateLabel={templateLabel}
            revealStory={revealStory}
            onNext={() => setStage("letter")}
          />
        )}

        {stage === "letter" && (
          <KoikoiLetterStage
            key="letter"
            title={displayMessageTitle}
            body={displayMainBody}
            creatorName={creatorName}
            recipientName={recipientName}
            templateType={templateType}
            onNext={() => setStage("cards")}
          />
        )}

        {stage === "cards" && (
          <KoikoiCardsStage
            key="cards"
            coverImages={coverImages}
            recipientName={recipientName}
            templateEmoji={templateEmoji}
            templateLabel={templateLabel}
            displayMessageTitle={displayMessageTitle}
            previewLine={previewLine}
            revealStory={revealStory}
            onNext={() => setStage("scratch")}
          />
        )}

        {stage === "scratch" && (
          <KoikoiStageShell key="scratch" className="vc-koikoi-stage--scratch">
            <ScratchLoveNote
              templateType={templateType}
              title={displayMessageTitle}
              body={displayMainBody}
              recipientName={recipientName}
              onNext={() => setStage("question")}
            />
          </KoikoiStageShell>
        )}

        {stage === "question" && (
          <KoikoiQuestionStage
            key="question"
            cardId={cardId}
            templateType={templateType}
            revealStory={revealStory}
            storyQuestions={storyQuestions}
            hasRunaway={hasRunaway}
            ctaPrompt={ctaPrompt}
            noButtonWarning={noButtonWarning}
            yesText={yesText}
            noText={noText}
            onYes={goToFinale}
            onDodge={onDodge}
          />
        )}

        {stage === "finale" && (
          <KoikoiFinaleStage
            key="finale"
            creatorName={creatorName}
            recipientName={recipientName}
          />
        )}
      </AnimatePresence>
    </section>
  );
}

type RevealStage = "gate" | "letter" | "cards" | "scratch" | "question" | "finale";

function KoikoiStageShell({
  className = "",
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <motion.section
      className={`vc-koikoi-stage ${className}`}
      initial={{ opacity: 0, y: 28, scale: 0.985 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -18, scale: 0.985 }}
      transition={{ duration: 0.52, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.section>
  );
}

function KoikoiGateStage({
  creatorName,
  recipientName,
  templateEmoji,
  templateLabel,
  revealStory,
  onNext,
}: {
  creatorName: string;
  recipientName: string;
  templateEmoji: string;
  templateLabel: string;
  revealStory: RevealStory;
  onNext: () => void;
}) {
  return (
    <KoikoiStageShell className="vc-koikoi-stage--gate">
      <div className="vc-koikoi-gift-pop" aria-hidden>
        <span>{templateEmoji}</span>
      </div>
      <article className="vc-koikoi-card vc-koikoi-card--center">
        <p>{templateLabel}</p>
        <h1>A private drop just landed</h1>
        <span>{recipientName} ke liye {creatorName} ne sirf message nahi, pura reveal build kiya hai.</span>
        <div className="vc-koikoi-lineup">
          {revealStory.lineup.map((step) => (
            <div key={step.number}>
              <b>{step.number}</b>
              <strong>{step.title}</strong>
            </div>
          ))}
        </div>
        <button type="button" onClick={onNext}>
          Open the drop
          <span aria-hidden>💝</span>
        </button>
      </article>
    </KoikoiStageShell>
  );
}

function KoikoiLetterStage({
  title,
  body,
  creatorName,
  recipientName,
  templateType,
  onNext,
}: {
  title: string;
  body: string;
  creatorName: string;
  recipientName: string;
  templateType: string;
  onNext: () => void;
}) {
  const [opened, setOpened] = useState(false);
  const [typedBody, setTypedBody] = useState("");
  const noteBody = body || "You mean more than a normal text can say.";

  useEffect(() => {
    if (!opened) return;

    let index = 0;
    const intervalId = window.setInterval(() => {
      index += 1;
      setTypedBody(noteBody.slice(0, index));
      if (index >= noteBody.length) window.clearInterval(intervalId);
    }, 28);

    return () => window.clearInterval(intervalId);
  }, [opened, noteBody]);

  return (
    <KoikoiStageShell className="vc-koikoi-stage--letter">
      {!opened ? (
        <button type="button" className="vc-koikoi-envelope" onClick={() => setOpened(true)}>
          <span aria-hidden>💌</span>
          <strong>Seal kholo</strong>
          <em>{creatorName} ka honest part yahin se start hota hai.</em>
        </button>
      ) : (
        <article className="vc-koikoi-letter" data-template={templateType}>
          <p>Dear {recipientName},</p>
          <h2>{title}</h2>
          <span>
            {typedBody}
            {typedBody.length < noteBody.length && <i aria-hidden />}
          </span>
          <strong>- {creatorName}</strong>
          {typedBody.length >= noteBody.length && (
            <button type="button" onClick={onNext}>
              Photo strip dekho
              <span aria-hidden>→</span>
            </button>
          )}
        </article>
      )}
    </KoikoiStageShell>
  );
}

function KoikoiCardsStage({
  coverImages,
  recipientName,
  templateEmoji,
  templateLabel,
  displayMessageTitle,
  previewLine,
  revealStory,
  onNext,
}: {
  coverImages: string[];
  recipientName: string;
  templateEmoji: string;
  templateLabel: string;
  displayMessageTitle: string;
  previewLine: string;
  revealStory: RevealStory;
  onNext: () => void;
}) {
  return (
    <KoikoiStageShell className="vc-koikoi-stage--cards">
      <div className="vc-koikoi-cards-copy">
        <p>photo clip light</p>
        <h2>Receipts on, drama low.</h2>
        <span>Images ek-ek karke open hongi, like a tiny private gallery made for this mood.</span>
      </div>
      <PhotoClipAccordion
        coverImages={coverImages}
        recipientName={recipientName}
        templateEmoji={templateEmoji}
        captions={[
          `made for ${recipientName}`,
          ...revealStory.beats,
          templateLabel,
          displayMessageTitle,
          previewLine,
        ]}
      />
      <button type="button" className="vc-koikoi-next" onClick={onNext}>
        Scratch note unlock karo
        <span aria-hidden>✨</span>
      </button>
    </KoikoiStageShell>
  );
}

function KoikoiQuestionStage({
  cardId,
  templateType,
  revealStory,
  storyQuestions,
  hasRunaway,
  ctaPrompt,
  noButtonWarning,
  yesText,
  noText,
  onYes,
  onDodge,
}: {
  cardId: string;
  templateType: string;
  revealStory: RevealStory;
  storyQuestions?: StoryQuestion[];
  hasRunaway: boolean;
  ctaPrompt: string;
  noButtonWarning: string;
  yesText?: string;
  noText?: string;
  onYes: () => void;
  onDodge: (label: string, dodgeCount: number) => void;
}) {
  const prompts = storyQuestions?.slice(0, 3) || [];

  return (
    <KoikoiStageShell className="vc-koikoi-stage--question">
      <article className="vc-koikoi-card vc-koikoi-card--question">
        <p>final question</p>
        <h2>{revealStory.answerCue}</h2>
        <div className="vc-koikoi-prompt-stack">
          {prompts.map((question, index) => (
            <button
              key={question.id}
              type="button"
              onClick={() => {
                void fetch(`/api/cards/${cardId}/events`, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    event_type: "story_answered",
                    metadata: {
                      step: index + 1,
                      question: question.question,
                      answer: question.options[0],
                    },
                  }),
                });
              }}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {question.question}
            </button>
          ))}
        </div>
        {hasRunaway ? (
          <div className="vc-koikoi-runaway">
            <p>{ctaPrompt}</p>
            <small>{noButtonWarning}</small>
            <RunawayButton
              onYes={onYes}
              memeMode={templateType === "shoot_shot"}
              templateType={templateType}
              yesText={yesText}
              noText={noText}
              onDodge={onDodge}
            />
          </div>
        ) : (
          <button type="button" onClick={onYes}>
            {yesText || "Send answer"}
          </button>
        )}
      </article>
    </KoikoiStageShell>
  );
}

function KoikoiFinaleStage({
  creatorName,
  recipientName,
}: {
  creatorName: string;
  recipientName: string;
}) {
  return (
    <KoikoiStageShell className="vc-koikoi-stage--finale">
      <div className="vc-koikoi-confetti" aria-hidden>
        {Array.from({ length: 42 }, (_, index) => (
          <span
            key={index}
            style={
              {
                "--confetti-left": `${(index * 11) % 100}%`,
                "--confetti-sway": `${((index % 7) - 3) * 12}px`,
                "--confetti-size": `${1 + (index % 4) * 0.28}rem`,
                "--confetti-duration": `${2.4 + (index % 5) * 0.24}s`,
                "--confetti-delay": `${(index % 12) * -0.12}s`,
              } as React.CSSProperties
            }
          >
            {["💖", "✨", "🎀", "🫶", "💌", "⭐"][index % 6]}
          </span>
        ))}
      </div>
      <article className="vc-koikoi-card vc-koikoi-card--center">
        <p>moment locked</p>
        <h1>{recipientName} + {creatorName}</h1>
        <span>Answer send ho raha hai. Cute scene officially complete.</span>
      </article>
    </KoikoiStageShell>
  );
}

function PhotoClipAccordion({
  coverImages,
  recipientName,
  templateEmoji,
  captions,
}: {
  coverImages: string[];
  recipientName: string;
  templateEmoji: string;
  captions: string[];
}) {
  const [activeIndex, setActiveIndex] = useState(0);
  const images = coverImages.slice(0, Math.min(coverImages.length, 4));

  useEffect(() => {
    if (images.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, 2400);

    return () => window.clearInterval(intervalId);
  }, [images.length]);

  if (!images.length) {
    return (
      <div className="vc-photo-clip-light vc-photo-clip-light--empty" aria-label="Photo clip reveal">
        <div className="vc-photo-clip-light__empty">
          <span aria-hidden>{templateEmoji}</span>
          <strong>No uploaded photos in this card</strong>
          <p>Creator ne photos add nahi kiye, so this reveal stays text-only.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="vc-photo-clip-light" aria-label="Photo clip reveal">
      <div className="vc-photo-clip-light__rail" aria-hidden />
      <div className="vc-photo-clip-light__frames">
        {images.map((source, index) => {
          const isActive = index === activeIndex;
          return (
            <button
              key={`clip-${index}-${source.slice(0, 24)}`}
              type="button"
              className={isActive ? "is-active" : ""}
              onClick={() => setActiveIndex(index)}
              aria-label={`Show cover ${index + 1}`}
            >
              <span>{String(index + 1).padStart(2, "0")}</span>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={source} alt="" draggable={false} />
              <strong>{captions[index % captions.length] || `for ${recipientName}`}</strong>
            </button>
          );
        })}
      </div>
      <p>
        <span aria-hidden>{templateEmoji}</span>
        Tap a frame. The spotlight moves with the memory.
      </p>
    </div>
  );
}

function CuteGestureLayer({ templateType }: { templateType: string }) {
  const stickers =
    templateType === "maan_jao"
      ? ["🧸", "🥺", "🫶", "🎀", "💌", "✨"]
      : ["🧸", "💗", "🫶", "✨", "🌸", "💫"];

  return (
    <div className="vc-cute-gesture-layer" aria-hidden>
      {stickers.map((sticker, index) => (
        <span key={`${sticker}-${index}`} style={{ "--sticker-index": index } as React.CSSProperties}>
          {sticker}
        </span>
      ))}
    </div>
  );
}

function ScratchLoveNote({
  templateType,
  title,
  body,
  recipientName,
  onNext,
}: {
  templateType: string;
  title: string;
  body: string;
  recipientName: string;
  onNext?: () => void;
}) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const noteRef = useRef<HTMLDivElement | null>(null);
  const drawingRef = useRef(false);
  const scratchCountRef = useRef(0);
  const [scratched, setScratched] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const note = noteRef.current;
    if (!canvas || !note) return;

    const drawOverlay = () => {
      const rect = note.getBoundingClientRect();
      const ratio = window.devicePixelRatio || 1;
      canvas.width = Math.max(1, Math.floor(rect.width * ratio));
      canvas.height = Math.max(1, Math.floor(rect.height * ratio));
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, "rgba(255, 133, 161, 0.96)");
      gradient.addColorStop(0.48, "rgba(255, 214, 165, 0.98)");
      gradient.addColorStop(1, "rgba(166, 137, 255, 0.92)");
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, rect.width, rect.height);

      ctx.fillStyle = "rgba(255,255,255,0.22)";
      for (let x = -rect.height; x < rect.width; x += 34) {
        ctx.save();
        ctx.translate(x, 0);
        ctx.rotate(-0.42);
        ctx.fillRect(0, 0, 12, rect.height * 1.8);
        ctx.restore();
      }

      ctx.fillStyle = "rgba(61, 26, 46, 0.72)";
      ctx.font = "900 13px Inter, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("SCRATCH KARO", rect.width / 2, rect.height / 2 - 10);
      ctx.font = "800 11px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(61, 26, 46, 0.48)";
      ctx.fillText("cursor ya finger se love note reveal karo", rect.width / 2, rect.height / 2 + 18);
      scratchCountRef.current = 0;
      setScratched(0);
    };

    drawOverlay();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", drawOverlay);
      return () => window.removeEventListener("resize", drawOverlay);
    }

    const observer = new ResizeObserver(drawOverlay);
    observer.observe(note);
    return () => observer.disconnect();
  }, [title, body]);

  const scratchAt = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const x = event.clientX - rect.left;
    const y = event.clientY - rect.top;
    const brushSize = event.pointerType === "mouse" ? 34 : 42;

    ctx.globalCompositeOperation = "destination-out";
    ctx.beginPath();
    ctx.arc(x, y, brushSize, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(x + 18, y - 10, brushSize * 0.46, 0, Math.PI * 2);
    ctx.fill();

    scratchCountRef.current += 1;
    setScratched(Math.min(100, Math.round(scratchCountRef.current * 4.4)));
  };

  const bodyLines = body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 5);

  return (
    <motion.article
      className="vc-scratch-note"
      data-template={templateType}
      initial={{ opacity: 0, y: 28, rotateX: 8 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, amount: 0.32 }}
      transition={{ duration: 0.72, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="vc-scratch-note__copy">
        <p>scratch note</p>
        <h2>Secret layer hai.</h2>
        <span>{recipientName}, bas 10% scratch karo. Neeche asli note glow karega.</span>
      </div>

      <div className="vc-scratch-note__card" ref={noteRef}>
        <div className="vc-scratch-note__content">
          <span>love note unlocked</span>
          <h3>{title}</h3>
          {bodyLines.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          className={`vc-scratch-note__canvas ${scratched >= 10 ? "is-cleared" : ""}`}
          aria-label="Scratch to reveal the love note"
          onPointerDown={(event) => {
            drawingRef.current = true;
            event.currentTarget.setPointerCapture(event.pointerId);
            scratchAt(event);
          }}
          onPointerMove={(event) => {
            if (drawingRef.current) scratchAt(event);
          }}
          onPointerUp={(event) => {
            drawingRef.current = false;
            event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => {
            drawingRef.current = false;
          }}
        />
        <div className="vc-scratch-note__meter" aria-hidden>
          <span style={{ width: `${scratched}%` }} />
        </div>
      </div>
      {onNext && (
        <button
          type="button"
          className="vc-koikoi-next vc-scratch-note__next"
          onClick={onNext}
          disabled={scratched < 10}
        >
          {scratched < 10 ? "Scratch 10% reveal" : "Go to final answer"}
          <span aria-hidden>{scratched < 10 ? "👆" : "💖"}</span>
        </button>
      )}
    </motion.article>
  );
}

function RecipientFinalReveal({
  coverImages,
  displayMessageTitle,
  displayMainBody,
  recipientName,
  creatorName,
  successEmoji,
  successHeading,
  successSubtext,
}: {
  coverImages: string[];
  displayMessageTitle: string;
  displayMainBody: string;
  recipientName: string;
  creatorName: string;
  successEmoji: string;
  successHeading: string;
  successSubtext: string;
}) {
  const heroImage = coverImages[0];
  const supportingImages = coverImages.slice(1, 4);
  const bodyLines = displayMainBody
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 4);

  return (
    <motion.section
      className="vc-final-reveal"
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.62, ease: [0.16, 1, 0.3, 1] }}
    >
      <div className="vc-final-reveal__media">
        {heroImage ? (
          <>
            <div
              className="vc-final-reveal__glow"
              style={{ backgroundImage: `url("${heroImage}")` }}
              aria-hidden
            />
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={heroImage} alt="" draggable={false} />
          </>
        ) : (
          <span>{successEmoji}</span>
        )}
        <div className="vc-final-reveal__thumbs" aria-hidden>
          {supportingImages.map((source, index) => (
            // eslint-disable-next-line @next/next/no-img-element
            <img key={`final-thumb-${index}-${source.slice(0, 24)}`} src={source} alt="" draggable={false} />
          ))}
        </div>
      </div>

      <div className="vc-final-reveal__copy">
        <p>{successEmoji} final reveal</p>
        <h1>{successHeading}</h1>
        <strong>{recipientName}, yeh moment {creatorName} tak pahunch gaya.</strong>
        <div className="vc-final-reveal__note">
          <span>{displayMessageTitle}</span>
          {bodyLines.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
        <small>{successSubtext}</small>
      </div>
    </motion.section>
  );
}
