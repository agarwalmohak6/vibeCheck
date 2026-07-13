"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useEffect } from "react";
import Link from "next/link";
import { TEMPLATE_TYPES } from "@/lib/themes";
import EnvelopeReveal from "@/components/EnvelopeReveal";
import RunawayButton from "@/components/RunawayButton";
import VinylDisk from "@/components/VinylDisk";
import SecretCodeGate from "@/components/SecretCodeGate";
import HeartCanvas from "@/components/HeartCanvas";
import AmbientBackground from "@/components/AmbientBackground";
import CardStoryline from "@/components/CardStoryline";
import confetti from "canvas-confetti";
import {
  RECIPIENT_COPY,
  formatPersonName,
  getLocalizedActionLabels,
  getTemplateLocaleCopy,
  type RecipientLocale,
} from "@/lib/recipientI18n";
import FollowUpReplies from "./FollowUpReplies";
import type { PublicCard } from "@/types/vibecheck";

interface RecipientViewProps {
  card: PublicCard;
  initialRoomMode?: boolean;
}

export default function RecipientView({ card, initialRoomMode = false }: RecipientViewProps) {
  const [envelopeOpened, setEnvelopeOpened] = useState(initialRoomMode);
  const [secretUnlocked, setSecretUnlocked] = useState(
    initialRoomMode || !card.card_data.has_secret_code,
  );
  const [language, setLanguage] = useState<RecipientLocale>("en");
  const templateMeta = TEMPLATE_TYPES.find((t) => t.id === card.template_type);
  const hasRunaway = templateMeta?.hasRunaway || false;
  const localizedTemplate = getTemplateLocaleCopy(card.template_type, language);
  const localizedActionLabels = getLocalizedActionLabels(card.template_type, language);
  const recipientCopy = RECIPIENT_COPY[language];
  const creatorName = formatPersonName(card.creator_name, "Someone");
  const recipientName = formatPersonName(card.recipient_name, language === "hi" ? "आप" : "you");
  const templateLabel = localizedTemplate?.label || templateMeta?.label || "Private card";
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
      ? localizedTemplate?.messagePresets?.[titlePresetIndex]?.title ||
        templateMeta?.messagePresets?.[titlePresetIndex]?.title ||
        templateMeta?.label.replace(/\s[^\s]*$/, "") ||
        rawMessageTitle
      : rawMessageTitle;
  const displayMainBody =
    bodyPresetIndex >= 0
      ? localizedTemplate?.messagePresets?.[bodyPresetIndex]?.body ||
        templateMeta?.messagePresets?.[bodyPresetIndex]?.body ||
        templateMeta?.builderHint ||
        rawMainBody
      : rawMainBody;
  const cardYesText = card.card_data.yes_btn_text?.trim();
  const cardNoText = card.card_data.no_btn_text?.trim();
  const displayYesText =
    localizedActionLabels &&
    (!cardYesText || cardYesText === templateMeta?.defaultYesText)
      ? localizedActionLabels.yesText
      : card.card_data.yes_btn_text;
  const displayNoText =
    localizedActionLabels &&
    (!cardNoText || cardNoText === templateMeta?.defaultNoText)
      ? localizedActionLabels.noText
      : card.card_data.no_btn_text;

  const [yesClicked, setYesClicked] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [storyComplete, setStoryComplete] = useState(false);
  const [roomMode, setRoomMode] = useState(initialRoomMode);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const creatorToken = new URLSearchParams(window.location.search).get("ct");
      if (creatorToken) {
        localStorage.setItem(`creator_token_${card.id}`, creatorToken);
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsCreator(true);
        return;
      }
      // A normal recipient link must stay recipient-mode even on the creator's browser.
      // Saved local tokens are used only for explicit creator chat actions, not page identity.
      setIsCreator(false);
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
    setRoomMode(true);
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
      lang={language === "hi" ? "hi" : "en"}
      data-locale={language}
      data-room-mode={roomMode ? "true" : "false"}
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
            className="vc-recipient-stage"
            data-room-mode={roomMode ? "true" : "false"}
          >
            {/* Recipient identity header */}
            <motion.div
              initial={{ opacity: 0, y: -12, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 230, damping: 21 }}
              className="vc-recipient-badge-row"
            >
              <header className="vc-recipient-card-header" aria-label={recipientCopy.privateCard}>
                <div className="vc-recipient-card-mark">
                  <span className="vc-recipient-card-mark__emoji" aria-hidden>
                    {templateMeta?.emoji || "💌"}
                  </span>
                  <span>
                    <small>{recipientCopy.privateCard}</small>
                    <strong>{templateLabel}</strong>
                  </span>
                </div>

                <div className="vc-recipient-people" aria-label="Sender and recipient">
                  <div className="vc-recipient-person-chip">
                    <span>{recipientCopy.forLabel}</span>
                    <strong>{recipientName}</strong>
                  </div>
                  <div className="vc-recipient-person-chip">
                    <span>{recipientCopy.fromLabel}</span>
                    <strong>{creatorName}</strong>
                  </div>
                </div>

                <div className="vc-recipient-language" aria-label={recipientCopy.languageLabel}>
                  {(["en", "hi"] as const).map((locale) => (
                    <button
                      key={locale}
                      type="button"
                      className={language === locale ? "is-active" : ""}
                      aria-pressed={language === locale}
                      onClick={() => setLanguage(locale)}
                    >
                      {locale === "en" ? "EN" : "हिंदी"}
                    </button>
                  ))}
                </div>
              </header>
            </motion.div>

            <div className="vc-recipient-scene">
              <motion.section
                initial={{ opacity: 0, x: -18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25, duration: 0.45 }}
                className="vc-recipient-visual-panel"
              >
                {card.card_data.cover_image_url && (
                  <div className="vc-recipient-cover">
                    <div
                      className="vc-recipient-cover__backdrop"
                      style={{ backgroundImage: `url("${card.card_data.cover_image_url}")` }}
                      aria-hidden
                    />
                    <div className="vc-recipient-cover__shine" aria-hidden />
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={card.card_data.cover_image_url}
                      alt="Cover"
                      className="vc-recipient-cover__image"
                      draggable={false}
                    />
                  </div>
                )}

              </motion.section>

              <motion.section
                initial={{ opacity: 0, x: 18 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.35, duration: 0.45 }}
                className="vc-recipient-content-panel"
              >
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                  className="vc-recipient-message rounded-3xl p-6 glow-border"
                  style={{ background: "var(--surface)" }}
                >
                  <h1
                    className="vc-recipient-title"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--accent)",
                    }}
                  >
                    {displayMessageTitle}
                  </h1>
                  <p
                    className="vc-recipient-body text-lg leading-relaxed whitespace-pre-wrap font-medium"
                    style={{ color: "var(--text2)" }}
                  >
                    {displayMainBody}
                  </p>
                </motion.div>

                <AnimatePresence mode="wait">
                  {roomMode && !yesClicked && (
                    <motion.div
                      key="room-mode"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -14 }}
                      className="vc-recipient-chat-direct"
                    >
                      <div className="vc-recipient-chat-direct__intro">
                        <span>💬</span>
                        <div>
                          <p>Private room</p>
                          <h2>{creatorName} + {recipientName}</h2>
                        </div>
                      </div>
                      <FollowUpReplies card={card} isCreator={isCreator} locale={language} />
                    </motion.div>
                  )}

                  {!roomMode && !yesClicked && !isCreator && !storyComplete && (
                    <motion.div
                      key="story"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -14, scale: 0.98 }}
                      transition={{ duration: 0.28 }}
                    >
                      <CardStoryline
                        cardId={card.id}
                        templateType={card.template_type}
                        questions={card.card_data.story_questions}
                        recipientName={recipientName}
                        locale={language}
                        onComplete={() => setStoryComplete(true)}
                      />
                    </motion.div>
                  )}

                  {!roomMode && hasRunaway && !yesClicked && !isCreator && storyComplete && (
                    <motion.div
                      key="cta"
                      initial={{ opacity: 0, y: 20, scale: 0.98 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -12, scale: 0.98 }}
                      transition={{ type: "spring", stiffness: 220, damping: 22 }}
                      className="vc-recipient-cta rounded-3xl p-5"
                      style={{
                        background: "var(--surface)",
                        border: "1px solid var(--border)",
                      }}
                    >
                      <p
                        className="text-sm font-bold mb-1 text-center"
                        style={{ color: "var(--text)" }}
                      >
                        {recipientCopy.ctaPrompt}
                      </p>
                      <p
                        className="text-xs text-center mb-4"
                        style={{ color: "var(--text3)" }}
                      >
                        {recipientCopy.noButtonWarning}
                      </p>
                      <RunawayButton
                        onYes={handleYes}
                        memeMode={card.template_type === "shoot_shot"}
                        templateType={card.template_type}
                        yesText={displayYesText}
                        noText={displayNoText}
                        onDodge={handleDodge}
                      />
                    </motion.div>
                  )}

                  {!roomMode && isCreator && !yesClicked && (
                    <motion.div
                      key="creator-replies"
                      initial={{ opacity: 0, y: 18 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -14 }}
                      className="vc-recipient-reply-direct"
                    >
                      <FollowUpReplies card={card} isCreator={true} />
                    </motion.div>
                  )}

                  {yesClicked && (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.8, y: 50 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ type: "spring", stiffness: 200, damping: 20 }}
                      className="vc-recipient-success rounded-3xl p-8 text-center glass glow-border relative z-20"
                    >
                      <motion.div
                        animate={{ scale: [1, 1.3, 1], rotate: [0, 5, -5, 0] }}
                        transition={{ repeat: Infinity, duration: 2 }}
                        className="text-6xl mb-6"
                      >
                        {recipientCopy.successEmoji}
                      </motion.div>
                      <h2
                        className="text-3xl md:text-4xl font-black mb-4 tracking-tighter"
                        style={{
                          fontFamily: "var(--font-display)",
                          backgroundImage:
                            "linear-gradient(135deg, var(--accent), var(--accent2))",
                          backgroundSize: "cover",
                          WebkitBackgroundClip: "text",
                          color: "transparent",
                          filter: "drop-shadow(0px 4px 8px rgba(0,0,0,0.4))",
                        }}
                      >
                        {recipientCopy.successHeading}
                      </h2>
                      <p
                        className="text-base font-bold leading-relaxed mb-6"
                        style={{ color: "var(--text2)" }}
                      >
                        {recipientCopy.successSubtext}
                      </p>

                      <FollowUpReplies card={card} isCreator={false} locale={language} />
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.section>
            </div>

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
