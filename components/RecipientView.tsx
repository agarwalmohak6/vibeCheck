"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { TEMPLATE_TYPES, type StoryQuestion } from "@/lib/themes";
import { getMoodStory } from "@/lib/moodStories";
import { SCRATCH_REVEAL_PERCENT, scratchCoverage } from "@/lib/revealEffects";
import MoodTypewriter from "@/components/MoodTypewriter";
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
  type RecipientLocale,
} from "@/lib/recipientI18n";
import type { PublicCard } from "@/types/vibecheck";

interface RecipientViewProps {
  card: PublicCard;
  initialRoomMode?: boolean;
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
      data-theme={card.template_type === "shoot_shot" && card.theme_selected === "midnight_romance" ? "proposal_glow" : card.theme_selected}
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
                successEmoji={getMoodStory(card.template_type).emoji}
                successHeading={revealStory.ending}
                successSubtext="Your note and these little moments are here to revisit."
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
  const finaleTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (finaleTimer.current) clearTimeout(finaleTimer.current); }, []);
  const previewLine = displayMainBody
    .split(/\s+/)
    .slice(0, 16)
    .join(" ");
  const goToFinale = () => {
    setStage("finale");
    finaleTimer.current = setTimeout(onYes, 2300);
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
        <h1>{revealStory.headline}</h1>
        <span>{revealStory.intro}</span>
        <div className="vc-koikoi-lineup">
          {revealStory.lineup.map((step) => (
            <div key={step.number}>
              <b>{step.number}</b>
              <strong>{step.title}</strong>
            </div>
          ))}
        </div>
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
  const noteBody = body || getMoodStory(templateType).messagePresets[0].body;

  return (
    <KoikoiStageShell className="vc-koikoi-stage--letter">
      {!opened ? (
        <button type="button" className="vc-koikoi-envelope" onClick={() => setOpened(true)}>
          <span aria-hidden>💌</span>
          <strong>A little letter for you</strong>
          <em>From {creatorName}, with a little courage and a lot of care.</em>
        </button>
      ) : (
        <article className="vc-koikoi-letter" data-template={templateType}>
          <p>Dear {recipientName},</p>
          <h2>{title}</h2>
          <MoodTypewriter key={noteBody} text={noteBody} templateType={templateType} />
          <strong>— {creatorName}</strong>
          <button type="button" onClick={onNext}>
            A few little moments <span aria-hidden>→</span>
          </button>
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
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [response, setResponse] = useState("");

  return (
    <KoikoiStageShell className="vc-koikoi-stage--question">
      <article className="vc-koikoi-card vc-koikoi-card--question">
        <p>final question</p>
        <h2>{revealStory.answerCue}</h2>
        <div className="vc-koikoi-prompt-stack">
          {prompts.map((question, index) => (
            <fieldset key={question.id} className="vc-story-choice">
              <legend>{question.question}</legend>
              <div>
                {question.options.map(option => (
                  <button key={option} type="button" aria-pressed={answers[question.id] === option}
                    onClick={() => {
                      setAnswers(current => ({ ...current, [question.id]: option }));
                      void fetch(`/api/cards/${cardId}/events`, {
                        method: "POST", headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ event_type: "story_answered", metadata: { step: index + 1, question: question.question, answer: option } }),
                      }).catch(() => {});
                    }}>{option}</button>
                ))}
              </div>
            </fieldset>
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
          <div className="vc-story-response">
            <button type="button" onClick={onYes}>{yesText || "Send answer"}</button>
            {noText && <button type="button" className="vc-story-response__secondary" onClick={() => {
              setResponse("Your pace matters. You can come back to this whenever you are ready.");
              void fetch(`/api/cards/${cardId}/events`, {
                method: "POST", headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ event_type: "story_answered", metadata: { question: revealStory.answerCue, answer: noText } }),
              }).catch(() => {});
            }}>{noText}</button>}
            {response && <p role="status">{response}</p>}
          </div>
        )}
      </article>
    </KoikoiStageShell>
  );
}

function KoikoiFinaleStage({
  templateType,
  creatorName,
  recipientName,
}: {
  templateType: string;
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
            {getMoodStory(templateType).narrative.emojis[index % 3]}
          </span>
        ))}
      </div>
      <article className="vc-koikoi-card vc-koikoi-card--center">
        <p>{getMoodStory(templateType).narrative.ending}</p>
        <h1>{recipientName} + {creatorName}</h1>
        <span>A little moment between the two of you.</span>
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={activeSource} alt="" draggable={false} />
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
        Tap a frame. The spotlight moves with the memory.
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
      gradient.addColorStop(1, "#c8b5e6");
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
      ctx.fillText("A LITTLE SOMETHING UNDERNEATH", rect.width / 2, rect.height / 2 - 10, Math.max(1, rect.width - 24));
      ctx.font = "800 11px Inter, system-ui, sans-serif";
      ctx.fillStyle = "rgba(61, 26, 46, 0.48)";
      ctx.fillText(`Use your finger or cursor to reveal ${SCRATCH_REVEAL_PERCENT}%`, rect.width / 2, rect.height / 2 + 18, Math.max(1, rect.width - 24));

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
    const point = { x: event.clientX - rect.left, y: event.clientY - rect.top };
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
        <p>scratch note</p>
        <h2>One little thing, tucked away.</h2>
        <span>{recipientName}, scratch about {SCRATCH_REVEAL_PERCENT}% to uncover your note.</span>
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
        <div className="vc-scratch-note__meter" role="progressbar" aria-label="Note reveal progress" aria-valuemin={0} aria-valuemax={SCRATCH_REVEAL_PERCENT} aria-valuenow={Math.min(scratched, SCRATCH_REVEAL_PERCENT)}>
          <span style={{ width: `${Math.min(100, scratched / SCRATCH_REVEAL_PERCENT * 100)}%` }} />
        </div>
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
          {scratched < SCRATCH_REVEAL_PERCENT ? `Keep scratching · ${scratched}/${SCRATCH_REVEAL_PERCENT}%` : "Go to final answer"}
          <span aria-hidden>{scratched < SCRATCH_REVEAL_PERCENT ? "👆" : "💖"}</span>
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
