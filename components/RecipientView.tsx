"use client";

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { TEMPLATE_TYPES, type StoryQuestion } from "@/lib/themes";
import { getMoodStory } from "@/lib/moodStories";
import { SCRATCH_REVEAL_PERCENT, scratchCoverage, scratchPoint } from "@/lib/revealEffects";
import FitStage from "@/components/FitStage";
import FollowUpReplies from "@/components/FollowUpReplies";
import { LETTER_OPEN_MS, PHOTO_HOLD_MS } from "@/lib/romanceMotion";
import { paginateLetter, letterParagraphs } from "@/lib/letterPages";
import MoodTypewriter from "@/components/MoodTypewriter";
import EnvelopeReveal from "@/components/EnvelopeReveal";
import RomanceButtons from "@/components/RomanceButtons";
import VinylDisk from "@/components/VinylDisk";
import SecretCodeGate from "@/components/SecretCodeGate";
import HeartCanvas from "@/components/HeartCanvas";
import AmbientBackground from "@/components/AmbientBackground";
import confetti from "canvas-confetti";
import {
  RECIPIENT_COPY,
  formatPersonName,
  type RecipientLocale,
} from "@/lib/recipientI18n";
import type { PublicCard } from "@/types/vibecheck";

interface RecipientViewProps {
  card: PublicCard;
  initialRoomMode?: boolean;
  isCreator?: boolean;
}

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

  return unique.slice(0, 8);
}

export default function RecipientView({ card, initialRoomMode = false, isCreator = false }: RecipientViewProps) {
  const shellRef = useRef<HTMLDivElement>(null);
  const [envelopeOpened, setEnvelopeOpened] = useState(initialRoomMode);
  const [secretUnlocked, setSecretUnlocked] = useState(
    isCreator || !card.card_data.has_secret_code,
  );
  const [roomOpen, setRoomOpen] = useState(initialRoomMode);
  const language: RecipientLocale = "en";
  const templateMeta = TEMPLATE_TYPES.find((t) => t.id === card.template_type);
  const hasRunaway = templateMeta?.hasRunaway || false;
  const recipientCopy = RECIPIENT_COPY.en;
  const creatorName = formatPersonName(card.creator_name, "Someone");
  const recipientName = formatPersonName(card.recipient_name, "you");
  const templateLabel = templateMeta?.label || "A private note";
  const preset = getMoodStory(card.template_type).messagePresets[0];
  const rawTitle = card.card_data.message_title?.trim();
  const rawBody = card.card_data.main_body?.trim();
  const displayMessageTitle = !rawTitle || /^A message from\s+/i.test(rawTitle) ? preset.title : rawTitle;
  const displayMainBody = !rawBody || rawBody === "Tap YES to accept!" ? preset.body : rawBody;
  const displayYesText = card.card_data.yes_btn_text?.trim() || templateMeta?.defaultYesText;
  const displayNoText = card.card_data.no_btn_text?.trim() || templateMeta?.defaultNoText;
  const revealStory = useMemo(
    () => getRevealStory(card.template_type, creatorName, recipientName),
    [card.template_type, creatorName, recipientName],
  );
  const coverImages = useMemo(
    () => buildCoverImages(card.card_data.cover_image_urls, card.card_data.cover_image_url),
    [card.card_data.cover_image_urls, card.card_data.cover_image_url],
  );
  const storyQuestions = card.card_data.story_questions?.length
    ? card.card_data.story_questions
    : templateMeta?.storyQuestions;

  const [yesClicked, setYesClicked] = useState(false);
  const reducedMotion = useReducedMotion();
  const celebrationTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (celebrationTimer.current) clearTimeout(celebrationTimer.current); confetti.reset(); }, []);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const creatorToken = new URLSearchParams(window.location.search).get("ct");
      if (creatorToken && isCreator) {
        localStorage.setItem(`creator_token_${card.id}`, creatorToken);
      }
    }
  }, [card.id, isCreator]);

  useEffect(() => {
    const viewport = window.visualViewport;
    const resize = () => shellRef.current?.style.setProperty('--recipient-height', `${viewport?.height || window.innerHeight}px`);
    resize();
    viewport?.addEventListener('resize', resize);
    window.addEventListener('resize', resize);
    return () => { viewport?.removeEventListener('resize', resize); window.removeEventListener('resize', resize); };
  }, []);

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

  };

  const handleUnlock = () => { setSecretUnlocked(true); };

  const handleYes = () => {
    setYesClicked(true);
    const colors = ["#e8ba72", "#d87982", "#f3b4a0", "#f6d7b3", "#fffaf0"];
    if (!reducedMotion) {
      confetti({ particleCount: 65, spread: 95, origin: { y: .8 }, startVelocity: 22, gravity: .5, ticks: 240, colors, disableForReducedMotion: true });
      celebrationTimer.current = setTimeout(() => confetti({ particleCount: 35, spread: 105, origin: { y: .75 }, startVelocity: 18, gravity: .5, ticks: 240, colors, disableForReducedMotion: true }), 800);
    }

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
      ref={shellRef}
      className="vc-recipient-shell no-capture min-h-screen relative overflow-hidden flex flex-col"
      style={{
        background: "var(--bg)",
        color: "var(--text)",
        fontFamily: "var(--font-body)",
      }}
      data-theme={card.template_type === "shoot_shot" && card.theme_selected === "midnight_romance" ? "proposal_glow" : card.theme_selected}
      data-template={card.template_type}
      lang="en-IN"
      data-locale={language}
      data-room-mode={roomOpen ? "true" : "false"}
    >
      {/* Floating hearts canvas background for Soft Coquette theme */}
      {card.theme_selected === "soft_coquette" && <HeartCanvas />}

      {/* Warm celebration on success */}
      <AnimatePresence>
        {yesClicked && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1 }}
            className="vc-recipient-celebration"
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

      <VinylDisk trackId={card.music_track_id || undefined} musicUrl={card.card_data.music_url || undefined} musicLabel={card.card_data.music_label || undefined} />

      {/* Card content */}
      <AnimatePresence>
        {envelopeOpened && secretUnlocked && (
          <motion.main
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            data-room-mode={roomOpen ? "true" : "false"}
          >
            {roomOpen ? (
              <section className="vc-romance-room">
                <button type="button" className="vc-romance-back" onClick={() => setRoomOpen(false)}>← Back to your card</button>
                <FollowUpReplies card={card} isCreator={isCreator} locale={language} />
              </section>
            ) : !yesClicked ? (
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
              <FitStage><RecipientFinalReveal
                onReplay={() => setYesClicked(false)}
                onReply={() => { if (celebrationTimer.current) clearTimeout(celebrationTimer.current); confetti.reset(); setRoomOpen(true); }}
                coverImages={coverImages}
                displayMessageTitle={displayMessageTitle}
                displayMainBody={displayMainBody}
                recipientName={recipientName}
                creatorName={creatorName}
                successEmoji={getMoodStory(card.template_type).emoji}
                successHeading={revealStory.ending}
                successSubtext="Come back whenever you need a little smile. This moment is yours."
              /></FitStage>
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

type RevealStory = ReturnType<typeof getMoodStory>["narrative"];

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

function getRevealStory(templateType: string, creatorName: string, recipientName: string): RevealStory {
  const story = getMoodStory(templateType).narrative;
  return { ...story, intro: `${recipientName}, this is from ${creatorName}, just for you. ${story.intro}` };
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
  const goToFinale = () => setStage("finale");

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
              title={revealStory.scratchTitle}
              body={revealStory.scratchBody}
              recipientName={recipientName}
              onNext={() => setStage("question")}
            />
          </KoikoiStageShell>
        )}

        {stage === "question" && (
          <KoikoiQuestionStage
            key="question"
            cardId={cardId}
            creatorName={creatorName}
            recipientName={recipientName}
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
            templateType={templateType}
            creatorName={creatorName}
            recipientName={recipientName}
            onNext={onYes}
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
      transition={{ duration: 1.05, ease: [0.16, 1, 0.3, 1] }}
    >
      <FitStage>{children}</FitStage>
    </motion.section>
  );
}

function KoikoiGateStage({
  creatorName,
  templateEmoji,
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
        <p>With love, from {creatorName}</p>
        <h1>{revealStory.headline}</h1>
        <span>{revealStory.intro}</span>
        <p className="vc-koikoi-soft-note">Take your time. This little moment is yours.</p>
        <button type="button" onClick={onNext}>
          Open your note
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
  const [unfolding, setUnfolding] = useState(false);
  const unfoldTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();
  useEffect(() => () => { if (unfoldTimer.current) clearTimeout(unfoldTimer.current); }, []);
  const noteBody = body || getMoodStory(templateType).messagePresets[0].body;
  const pages = useMemo(() => paginateLetter(noteBody), [noteBody]);
  const [page, setPage] = useState(0);

  return (
    <KoikoiStageShell className="vc-koikoi-stage--letter">
      {!opened ? (
        <button type="button" className={`vc-koikoi-envelope ${unfolding ? "is-unfolding" : ""}`} disabled={unfolding} onClick={() => { setUnfolding(true); unfoldTimer.current = setTimeout(() => setOpened(true), reducedMotion ? 100 : LETTER_OPEN_MS); }}>
          <span aria-hidden>💌</span>
          <strong>A little letter for you</strong>
          <em>From {creatorName}, with a little courage and a lot of care.</em>
        </button>
      ) : (
        <motion.article className="vc-koikoi-letter" data-template={templateType} initial={{ opacity: 0, y: 14 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1.2 }}>
          <p>Dear {recipientName},</p>
          <h2>{title}</h2>
          <MoodTypewriter key={`${page}-${noteBody}`} text={pages[page]} templateType={templateType} />
          {pages.length > 1 && <nav className="vc-letter-pages" aria-label="Letter pages"><button type="button" disabled={page === 0} onClick={() => setPage(p => p - 1)}>← Previous</button><span>{page + 1} / {pages.length}</span><button type="button" disabled={page === pages.length - 1} onClick={() => setPage(p => p + 1)}>Next →</button></nav>}
          <strong>— {creatorName}</strong>
          <button type="button" onClick={onNext}>
            A few little moments <span aria-hidden>→</span>
          </button>
        </motion.article>
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
        <p>{revealStory.eyebrow}</p>
        <h2>{revealStory.lineup[1].title}</h2>
        <span>{revealStory.proof}</span>
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
        One more thing for you
        <span aria-hidden>✨</span>
      </button>
    </KoikoiStageShell>
  );
}

function KoikoiQuestionStage({
  cardId, creatorName, recipientName, templateType, revealStory, storyQuestions, hasRunaway, yesText, noText, onYes, onDodge,
}: {
  cardId: string; creatorName: string; recipientName: string; templateType: string;
  revealStory: RevealStory; storyQuestions?: StoryQuestion[]; hasRunaway: boolean;
  ctaPrompt: string; noButtonWarning: string; yesText?: string; noText?: string;
  onYes: () => void; onDodge: (label: string, dodgeCount: number) => void;
}) {
  const prompts = storyQuestions || [];
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [response, setResponse] = useState("");
  const [detail, setDetail] = useState<number | null>(null);
  const question = detail == null ? null : prompts[detail];
  const saveAnswer = (questionText: string, answer: string, step?: number) => {
    void fetch(`/api/cards/${cardId}/events`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ event_type: "story_answered", metadata: { question: questionText, answer, ...(step == null ? {} : { step }) } }),
    }).catch(() => {});
  };
  return <KoikoiStageShell className="vc-koikoi-stage--question">
    <article className="vc-koikoi-card vc-koikoi-card--question">
      {question ? <>
        <p>A little detail, if you’d like</p>
        <h2>{question.question}</h2>
        <div className="vc-story-choice vc-story-choice--single">
          {question.options.map(option => <button key={option} type="button" aria-pressed={answers[question.id] === option} onClick={() => { setAnswers(previous => ({ ...previous, [question.id]: option })); saveAnswer(question.question, option, (detail || 0) + 1); }}>{option}</button>)}
        </div>
        <div className="vc-story-detail-nav">
          <button type="button" onClick={() => setDetail(null)}>Back to your moment</button>
          <button type="button" onClick={() => setDetail(detail != null && detail < prompts.length - 1 ? detail + 1 : null)}>{detail === prompts.length - 1 ? 'That’s lovely ♡' : 'One more little detail →'}</button>
        </div>
      </> : <>
        <p>{recipientName}, one little question</p>
        <span className="vc-question-keepsake" aria-hidden="true">{getMoodStory(templateType).emoji}</span>
        <h2>{revealStory.answerCue}</h2>
        <div className="vc-question-note"><MoodTypewriter text={revealStory.signal} templateType={templateType} /></div>
        <strong className="vc-question-signature">— {creatorName}</strong>
        {hasRunaway ? <RomanceButtons onYes={onYes} yesText={yesText} noText={noText} onDodge={onDodge} onLater={() => { setResponse("Take your time. I’m here whenever you’re ready."); saveAnswer(revealStory.answerCue, "I’d like some time"); }} /> : <div className="vc-story-response">
          <button type="button" onClick={onYes}>{yesText || "Send answer"}</button>
          {noText && <button type="button" className="vc-story-response__secondary" onClick={() => { setResponse("Your pace matters. Take all the time you need."); saveAnswer(revealStory.answerCue, noText); }}>{noText}</button>}
        </div>}
        {response && <p className="vc-question-response">{response}</p>}
        {prompts.length > 0 && <button type="button" className="vc-story-details-toggle" onClick={() => setDetail(0)}>Add a little detail, if you’d like</button>}
      </>}
    </article>
  </KoikoiStageShell>;
}

function KoikoiFinaleStage({ templateType, creatorName, recipientName, onNext }: {
  templateType: string; creatorName: string; recipientName: string; onNext: () => void;
}) {
  const story = getMoodStory(templateType);
  return <KoikoiStageShell className="vc-koikoi-stage--finale">
    <div className="vc-pair-moment">
      <div className="vc-pair-petals" aria-hidden="true">{story.narrative.emojis.map((emoji, index) => <span key={index} style={{ animationDelay: `${index * 1.2}s` }}>{emoji}</span>)}</div>
      <article className="vc-koikoi-card vc-koikoi-card--center">
        <p>{story.narrative.eyebrow}</p>
        <h1 className="vc-pair-names"><span>{recipientName}</span><i aria-hidden="true">♡</i><span>{creatorName}</span></h1>
        <span>A little moment between the two of you.</span>
        <p className="vc-koikoi-soft-note">No rush. Let this one sink in.</p>
        <button type="button" onClick={onNext}>Keep this little moment ♡</button>
      </article>
    </div>
  </KoikoiStageShell>;
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
  const images = coverImages.slice(0, 8);

  useEffect(() => {
    if (images.length <= 1) return;

    const intervalId = window.setInterval(() => {
      setActiveIndex((current) => (current + 1) % images.length);
    }, PHOTO_HOLD_MS);

    return () => window.clearInterval(intervalId);
  }, [images.length, activeIndex]);

  if (!images.length) {
    return (
      <div className="vc-photo-clip-light vc-photo-clip-light--empty" aria-label="Photo clip reveal">
        <div className="vc-photo-clip-light__empty">
          <span aria-hidden>{templateEmoji}</span>
          <strong>No uploaded photos in this card</strong>
          <p>Every word is still here, just for you.</p>
        </div>
      </div>
    );
  }

  const activeSource = images[activeIndex];
  const activeCaption = captions[activeIndex % captions.length] || `for ${recipientName}`;
  const orbitImages = images.filter((_, index) => index !== activeIndex).slice(0, 3);

  return (
    <div className="vc-photo-clip-light" aria-label="Photo clip reveal">
      <div className="vc-photo-clip-light__rail" aria-hidden />
      <div className="vc-photo-clip-light__stage">
        <div
          className="vc-photo-clip-light__aura"
          style={{ backgroundImage: `url("${activeSource}")` }}
          aria-hidden
        />
        <div className="vc-photo-clip-light__spotlight">
          <AnimatePresence mode="sync"><motion.img key={activeSource} src={activeSource} alt="A memory chosen just for you" draggable={false} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 1.5 }} /></AnimatePresence>
          <span>{String(activeIndex + 1).padStart(2, "0")} / {String(images.length).padStart(2, "0")}</span>
          <strong>{activeCaption}</strong>
        </div>
        {orbitImages.length > 0 && (
          <div className="vc-photo-clip-light__mini-stack" aria-hidden>
            {orbitImages.map((source, index) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                key={`clip-orbit-${index}-${source.slice(0, 24)}`}
                src={source}
                alt=""
                draggable={false}
              />
            ))}
          </div>
        )}
      </div>
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
        Little memories, worth lingering over.
      </p>
    </div>
  );
}

function CuteGestureLayer({ templateType }: { templateType: string }) {
  const stickers = getMoodStory(templateType).narrative.emojis;

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
  const lastPointRef = useRef<{ x: number; y: number } | null>(null);
  const sampleCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const lastMeasureRef = useRef(0);
  const [scratched, setScratched] = useState(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    const note = noteRef.current;
    if (!canvas || !note) return;

    const drawOverlay = () => {
      const rect = { width: note.clientWidth, height: note.clientHeight };
      const ratio = window.devicePixelRatio || 1;
      const width = Math.max(1, Math.floor(rect.width * ratio));
      const height = Math.max(1, Math.floor(rect.height * ratio));
      if (canvas.width === width && canvas.height === height && canvas.dataset.ready) return;
      const previous = document.createElement("canvas");
      previous.width = canvas.width;
      previous.height = canvas.height;
      if (canvas.dataset.ready) previous.getContext("2d")?.drawImage(canvas, 0, 0);
      canvas.width = width;
      canvas.height = height;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      ctx.setTransform(ratio, 0, 0, ratio, 0, 0);
      if (canvas.dataset.ready) {
        ctx.drawImage(previous, 0, 0, rect.width, rect.height);
        lastPointRef.current = null;
        return;
      }
      canvas.dataset.ready = "true";
      const gradient = ctx.createLinearGradient(0, 0, rect.width, rect.height);
      gradient.addColorStop(0, "#efbdc2");
      gradient.addColorStop(0.48, "#f5dfbb");
      gradient.addColorStop(1, "#edb395");
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
      ctx.font = "600 13px Quicksand, system-ui, sans-serif";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText("A LITTLE NOTE, JUST FOR YOU", rect.width / 2, rect.height / 2 - 10, Math.max(1, rect.width - 24));
      ctx.font = "500 11px Quicksand, system-ui, sans-serif";
      ctx.fillStyle = "rgba(61, 26, 46, 0.48)";
      ctx.fillText("Gently brush here to find it", rect.width / 2, rect.height / 2 + 18, Math.max(1, rect.width - 24));

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

  const measureCoverage = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const sample = sampleCanvasRef.current || document.createElement("canvas");
    sampleCanvasRef.current = sample;
    sample.width = 100;
    sample.height = 100;
    const ctx = sample.getContext("2d", { willReadFrequently: true });
    if (!ctx) return;
    ctx.drawImage(canvas, 0, 0, 100, 100);
    const coverage = scratchCoverage(ctx.getImageData(0, 0, 100, 100).data);
    setScratched(current => Math.max(current, coverage));
    lastMeasureRef.current = performance.now();
  };

  const scratchAt = (event: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas || scratched >= SCRATCH_REVEAL_PERCENT) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const point = scratchPoint(event.clientX, event.clientY, rect, canvas.clientWidth, canvas.clientHeight);
    const radius = event.pointerType === "mouse" ? 26 : 32;
    const previous = lastPointRef.current || point;
    ctx.globalCompositeOperation = "destination-out";
    ctx.lineWidth = radius * 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";
    ctx.beginPath();
    ctx.moveTo(previous.x, previous.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(point.x, point.y, radius, 0, Math.PI * 2);
    ctx.fill();
    lastPointRef.current = point;
    if (performance.now() - lastMeasureRef.current >= 60) measureCoverage();
  };

  const bodyLines = body
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean);

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
        <p>A little secret</p>
        <h2>One little thing, tucked away.</h2>
        <span>{recipientName}, gently brush away the shimmer. There’s something underneath, just for you.</span>
      </div>

      <div className="vc-scratch-note__card" ref={noteRef}>
        <div className="vc-scratch-note__content" aria-hidden={scratched < SCRATCH_REVEAL_PERCENT}>
          <span>A note just for you</span>
          <h3>{title}</h3>
          {bodyLines.map((line, index) => (
            <p key={`${line}-${index}`}>{line}</p>
          ))}
        </div>
        <canvas
          ref={canvasRef}
          className={`vc-scratch-note__canvas ${scratched >= SCRATCH_REVEAL_PERCENT ? "is-cleared" : ""}`}
          aria-label="Scratch to reveal the note"
          onPointerDown={(event) => {
            drawingRef.current = true;
            lastPointRef.current = null;
            event.currentTarget.setPointerCapture(event.pointerId);
            scratchAt(event);
          }}
          onPointerMove={(event) => {
            if (drawingRef.current) scratchAt(event);
          }}
          onPointerUp={(event) => {
            drawingRef.current = false;
            lastPointRef.current = null;
            measureCoverage();
            if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
          }}
          onPointerCancel={() => {
            drawingRef.current = false;
            lastPointRef.current = null;
            measureCoverage();
          }}
        />

      </div>
      {scratched < SCRATCH_REVEAL_PERCENT && (
        <button type="button" className="vc-scratch-accessible" onClick={() => setScratched(SCRATCH_REVEAL_PERCENT)}>Reveal without scratching</button>
      )}
      {onNext && (
        <button
          type="button"
          className="vc-koikoi-next vc-scratch-note__next"
          onClick={onNext}
          disabled={scratched < SCRATCH_REVEAL_PERCENT}
        >
          {scratched < SCRATCH_REVEAL_PERCENT ? "A little more shimmer to brush away" : "One little question ♡"}
          <span aria-hidden>{scratched < SCRATCH_REVEAL_PERCENT ? "👆" : "💖"}</span>
        </button>
      )}
    </motion.article>
  );
}

function RecipientFinalReveal({
  onReplay,
  onReply,
  coverImages,
  displayMessageTitle,
  displayMainBody,
  recipientName,
  creatorName,
  successEmoji,
  successHeading,
  successSubtext,
}: {
  onReplay: () => void;
  onReply: () => void;
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
  const pages = useMemo(() => paginateLetter(displayMainBody, 320), [displayMainBody]);
  const [page, setPage] = useState(0);

  return (
    <motion.section
      className="vc-final-reveal"
      initial={{ opacity: 0, y: 28, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 1.3, ease: [0.16, 1, 0.3, 1] }}
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
        <p>For {recipientName}, from {creatorName}</p>
        <h1>{successHeading}</h1>
        <strong>{recipientName}, a little moment from {creatorName}, yours to keep.</strong>
        <div className="vc-final-reveal__note">
          <span>{displayMessageTitle}</span>
          {letterParagraphs(pages[page]).map((paragraph, index) => <p key={index}>{paragraph}</p>)}
          {pages.length > 1 && <nav className="vc-letter-pages" aria-label="Saved letter pages"><button type="button" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}>←</button><span>{page + 1} / {pages.length}</span><button type="button" onClick={() => setPage(p => Math.min(pages.length - 1, p + 1))} disabled={page === pages.length - 1}>→</button></nav>}
        </div>
        <small>{successSubtext}</small>
        <div className="vc-romance-final-actions"><button type="button" onClick={onReply}>Send a reply ♡</button><button type="button" onClick={onReplay}>See the moments again</button></div>
      </div>
    </motion.section>
  );
}
