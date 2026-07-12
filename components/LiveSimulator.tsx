"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import confetti from "canvas-confetti";
import { useTheme } from "@/components/ThemeProvider";
import { PRIMARY_TEMPLATE_TYPES, TEMPLATE_TYPES } from "@/lib/themes";
import HeartCanvas from "@/components/HeartCanvas";

// Per-template sample content for the simulator
const TEMPLATE_SAMPLES: Record<
  string,
  { emoji: string; badge: string; title: string; body: string }
> = {
  shoot_shot: {
    emoji: "💍",
    badge: "Shoot Your Shot",
    title: "A little something I made for you",
    body: "I wanted this to feel more personal than a text.\nMore private than a story.\nAnd more memorable than a screenshot.\nSo here it is, just for you.",
  },
  maan_jao: {
    emoji: "🥺",
    badge: "Sorry Card",
    title: "I was wrong",
    body: "I was wrong, and I'm not going to dress it up with excuses.\nWhat I said hurt you, and you did not deserve that.\nI'm sorry, truly. Give me one more chance to be the person you know I can be.",
  },
  birthday_roast: {
    emoji: "🎂",
    badge: "Happy Birthday",
    title: "Still iconic",
    body: "Another year down, and somehow you're still this iconic.\nWishing you a birthday as extra as you are, cake first, adulting later.\nHere's to more stories, more chaos, and more reasons to celebrate you.",
  },
  bestie_check: {
    emoji: "✨",
    badge: "Bestie Card",
    title: "One of the best parts",
    body: "I don't say this enough, but you're one of the best parts of my life.\nThank you for being exactly who you are, every late-night call, every ridiculous plan.\nI've got you, always.",
  },
  netflix_chill: {
    emoji: "🍿",
    badge: "Netflix & Chill",
    title: "A quiet invite, just for you",
    body: "No big speech, just a cozy plan.\nA good movie, good snacks, and a little time together.\nFeels simple, but the good kind of simple.",
  },
};

export default function LiveSimulator() {
  const { theme, setTheme } = useTheme();
  const [activeTemplate, setActiveTemplate] = useState("maan_jao");
  const [previewMode, setPreviewMode] = useState<"mobile" | "desktop">("mobile");
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const sample =
    TEMPLATE_SAMPLES[activeTemplate] || TEMPLATE_SAMPLES.shoot_shot;
  const tmplMeta = TEMPLATE_TYPES.find((t) => t.id === activeTemplate);
  const coverImage = tmplMeta?.defaultCoverImage;

  const handleSwitchTemplate = (templateId: string) => {
    setActiveTemplate(templateId);
    // Auto-switch theme to match template's recommended theme
    const tmpl = TEMPLATE_TYPES.find((t) => t.id === templateId);
    if (tmpl?.recommendedTheme) setTheme(tmpl.recommendedTheme);
    setEnvelopeOpen(false);
    setIsOpening(false);
  };

  const handleOpen = () => {
    setIsOpening(true);
    setTimeout(() => {
      setEnvelopeOpen(true);
      setIsOpening(false);
      const colors = ["#FACC15", "#FF2E93", "#a855f7", "#00FF66", "#ffffff"];
      confetti({ particleCount: 80, spread: 100, origin: { y: 0.5 }, colors });
    }, 600);
  };

  const handleReset = () => {
    setEnvelopeOpen(false);
    setIsOpening(false);
  };

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Template tabs */}
      <div className="flex flex-wrap justify-center gap-2 max-w-2xl">
        {PRIMARY_TEMPLATE_TYPES.map((t) => (
          <motion.button
            key={t.id}
            onClick={() => handleSwitchTemplate(t.id)}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05, y: -1 }}
            className="px-4 py-2 rounded-full text-xs font-bold flex items-center gap-2 cursor-pointer"
            style={{
              background:
                activeTemplate === t.id
                  ? "linear-gradient(135deg, var(--accent), var(--accent2))"
                  : "var(--surface)",
              color: activeTemplate === t.id ? "white" : "var(--text2)",
              border:
                activeTemplate === t.id ? "none" : "1px solid var(--border)",
              boxShadow:
                activeTemplate === t.id ? "0 4px 20px var(--glow)" : "none",
              transition: "all 0.2s ease",
            }}
          >
            {t.emoji} {t.label.split(" ").slice(0, 2).join(" ")}
          </motion.button>
        ))}
      </div>

      <div className="vc-simulator-view-toggle" aria-label="Choose preview size">
        {(["mobile", "desktop"] as const).map((mode) => (
          <button
            key={mode}
            type="button"
            aria-pressed={previewMode === mode}
            className={previewMode === mode ? "is-active" : ""}
            onClick={() => setPreviewMode(mode)}
          >
            {mode === "mobile" ? "Mobile view" : "Desktop view"}
          </button>
        ))}
      </div>

      {/* Phone frame */}
      {previewMode === "mobile" && (
      <motion.div
        className="relative mx-auto"
        style={{ width: 320, height: 660 }}
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 24px var(--glow)",
              "0 0 48px var(--glow)",
              "0 0 24px var(--glow)",
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        />

        {/* Phone bezel */}
        <div
          className="absolute inset-0 rounded-[2.5rem] border-[7px] overflow-hidden shadow-2xl"
          style={{
            background:
              "linear-gradient(180deg, color-mix(in srgb, var(--surface), white 6%), var(--surface2))",
            borderColor: "color-mix(in srgb, var(--border), transparent 10%)",
            boxShadow:
              "0 30px 70px rgba(0,0,0,0.22), inset 0 0 60px rgba(255,255,255,0.05)",
          }}
        >
          {/* Status bar */}
          <div
            className="flex justify-between items-center px-5 pt-3 pb-1 z-20 relative"
            style={{ color: "var(--text2)" }}
          >
            <span className="text-[9px] font-bold">12:00</span>
            <div
              className="w-14 h-3.5 rounded-b-xl mx-auto absolute left-1/2 -translate-x-1/2 top-0"
              style={{ background: "rgba(11,15,25,0.88)" }}
            />
            <div className="flex gap-1 text-[9px]">📶 🔋</div>
          </div>

          {/* Soft Coquette hearts */}
          {theme === "soft_coquette" && <HeartCanvas />}

          {/* Screen content */}
          <div
            className="relative h-full overflow-hidden"
            style={{ paddingTop: 6 }}
          >
            <AnimatePresence mode="wait">
              {/* ── ENVELOPE CLOSED ── */}
              {!envelopeOpen && (
                <motion.div
                  key={`env-${activeTemplate}`}
                  initial={{ opacity: 0, scale: 0.92 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.08, y: -20 }}
                  transition={{ duration: 0.35 }}
                  className="vc-sim-phone-closed flex flex-col items-center h-full gap-3 px-5 relative z-10"
                >
                  {/* Badge */}
                  <motion.div
                    animate={{ scale: [1, 1.04, 1] }}
                    transition={{ repeat: Infinity, duration: 2 }}
                    className="px-3 py-1 rounded-full text-[10px] font-black text-white uppercase tracking-wider"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--accent), var(--accent2))",
                    }}
                  >
                    {sample.emoji} For Priya
                  </motion.div>

                  <p
                    className="text-center text-xs font-medium"
                    style={{ color: "var(--text2)" }}
                  >
                    You have a private card from
                  </p>
                  <p
                    className="text-2xl font-black text-center"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--accent)",
                    }}
                  >
                    Aarav ✨
                  </p>

                  {/* Envelope */}
                  <motion.div
                    animate={
                      isOpening
                        ? { rotateX: 180, scale: 0.8 }
                        : { y: [0, -10, 0] }
                    }
                    transition={
                      isOpening
                        ? { duration: 0.5 }
                        : { repeat: Infinity, duration: 2.5 }
                    }
                    onClick={!isOpening ? handleOpen : undefined}
                    className="cursor-pointer relative"
                    style={{ perspective: 600 }}
                  >
                    {theme === "desi_festive" ? (
                      <div className="w-40 h-28 rounded-2xl relative flex items-center justify-center bg-rose-950 border-2 border-yellow-400 shadow-[0_0_30px_rgba(250,204,21,0.3)]">
                        <div className="absolute inset-2 border border-yellow-500/20 rounded-xl" />
                        <div className="w-14 h-14 rounded-full bg-linear-to-br from-yellow-300 to-amber-600 border-2 border-amber-500 flex items-center justify-center text-yellow-100 font-serif font-black text-base shadow-xl">
                          MC
                        </div>
                      </div>
                    ) : (
                      <div
                        className="w-40 h-28 rounded-2xl relative flex items-end justify-center pb-3"
                        style={{
                          background:
                            "linear-gradient(135deg, color-mix(in srgb, var(--surface), white 6%), color-mix(in srgb, var(--surface2), white 4%))",
                          border: "1px solid color-mix(in srgb, var(--border), transparent 5%)",
                          boxShadow: "0 0 32px var(--glow)",
                        }}
                      >
                        <div
                          className="absolute top-0 left-0 right-0 h-16 rounded-t-2xl"
                          style={{
                            background: "var(--envelope-flap)",
                            clipPath: "polygon(0 0, 100% 0, 50% 100%)",
                          }}
                        />
                        <span className="relative z-10 text-2xl">💌</span>
                      </div>
                    )}
                  </motion.div>

                  <motion.p
                    animate={{ opacity: [0.4, 1, 0.4] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="text-[11px] font-bold tracking-wider"
                    style={{ color: "var(--accent)" }}
                  >
                    {isOpening
                      ? "✨ Opening..."
                      : theme === "desi_festive"
                        ? "✨ Tap the seal to open"
                        : "✨ Tap to open"}
                  </motion.p>

                  <div className="vc-sim-unlock-stack">
                    <div className="vc-sim-unlock-card vc-sim-unlock-card--cover">
                      {coverImage && (
                        <>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={coverImage} alt="" draggable={false} />
                        </>
                      )}
                      <span>Cover reveal</span>
                      <strong>{sample.badge}</strong>
                    </div>
                    <div className="vc-sim-unlock-card">
                      <span>Tiny story</span>
                      <strong>3 questions before the answer</strong>
                    </div>
                    <div className="vc-sim-unlock-card">
                      <span>After they reply</span>
                      <strong>Private chat opens live</strong>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* ── CARD TEASER ── */}
              {envelopeOpen && (
                <motion.div
                  key={`card-${activeTemplate}`}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="vc-simulator-teaser-screen h-full relative z-10"
                >
                  <div className="vc-simulator-teaser-blur h-full flex flex-col overflow-y-auto px-4 gap-3 pt-3 pb-14">
                    {/* Template badge */}
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.15, type: "spring", stiffness: 260 }}
                      className="text-center"
                    >
                      <span
                        className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--accent), var(--accent2))",
                        }}
                      >
                        {sample.emoji} {sample.badge}
                      </span>
                    </motion.div>

                    {coverImage && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.25 }}
                        className="rounded-xl overflow-hidden border border-white/5 shadow-lg shrink-0 bg-black/20"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={coverImage}
                          alt="Cover"
                          className="w-full h-auto aspect-video object-contain"
                          draggable={false}
                        />
                      </motion.div>
                    )}

                    <motion.div
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.35 }}
                      className="rounded-2xl p-3.5 glow-border text-left"
                      style={{
                        background:
                          "linear-gradient(145deg, color-mix(in srgb, var(--surface), white 5%), color-mix(in srgb, var(--surface2), white 4%))",
                        flexShrink: 0,
                      }}
                    >
                      <h3
                        className="text-base font-black mb-2 capitalize tracking-tight"
                        style={{
                          fontFamily: "var(--font-display)",
                          color: "var(--accent)",
                        }}
                      >
                        {sample.title}
                      </h3>
                      <p
                        className="text-[11px] leading-relaxed font-medium"
                        style={{ color: "var(--text2)" }}
                      >
                        {sample.body.split("\n").map((line, i) => (
                          <span key={i}>
                            {line}
                            <br />
                          </span>
                        ))}
                      </p>
                    </motion.div>

                    <div className="vc-simulator-locked-card">
                      <span>A tiny story before the answer</span>
                      <strong>Questions, buttons, and replies continue here.</strong>
                    </div>
                  </div>

                  <div className="vc-simulator-paywall">
                    <span>Preview unlocked</span>
                    <h3>Want to see the full card?</h3>
                    <p>
                      Create your card and pay to unlock the full reveal,
                      answer flow, reply room, and private send link.
                    </p>
                    <Link href={`/customize?type=${activeTemplate}&new=1`}>
                      See full card & pay
                    </Link>
                    <button type="button" onClick={handleReset}>
                      Reset demo
                    </button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Home indicator */}
        <div
          className="absolute bottom-2 left-1/2 -translate-x-1/2 w-20 h-1 rounded-full"
          style={{ background: "rgba(255,255,255,0.15)" }}
        />
      </motion.div>
      )}

      {previewMode === "desktop" && (
        <motion.div
          key={`desktop-${activeTemplate}`}
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 0.32 }}
          className="vc-simulator-desktop"
        >
          <div className="vc-simulator-desktop__chrome">
            <span />
            <span />
            <span />
            <strong>recipient preview · desktop</strong>
          </div>

          <div className="vc-simulator-desktop__grid">
            <section className="vc-simulator-desktop__visual">
              <div className="vc-simulator-desktop__badge">
                {sample.emoji} {sample.badge} · for Priya
              </div>

              {coverImage && (
                <div className="vc-simulator-desktop__cover">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={coverImage} alt={`${sample.badge} preview`} draggable={false} />
                </div>
              )}

              <div className="vc-simulator-desktop__mini-timeline" aria-label="Demo flow">
                <span className={envelopeOpen ? "is-done" : "is-active"}>Envelope</span>
                <span className={envelopeOpen ? "is-active" : ""}>Preview</span>
                <span className={envelopeOpen ? "is-locked" : ""}>Pay</span>
              </div>
            </section>

            <section className="vc-simulator-desktop__content">
              {!envelopeOpen && (
                <motion.div
                  key="desktop-closed"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="vc-simulator-desktop__sealed"
                >
                  <span>{sample.emoji} Private card from Aarav</span>
                  <h3>Open the card to reveal the full moment.</h3>
                  <p>
                    The recipient gets a polished card preview first. The full
                    story, answers, replies, and private link stay locked until
                    it feels worth paying for.
                  </p>
                  <button type="button" onClick={handleOpen} disabled={isOpening}>
                    {isOpening ? "Opening..." : "Open demo card"}
                  </button>
                </motion.div>
              )}

              {envelopeOpen && (
                <motion.div
                  key="desktop-open"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="vc-simulator-desktop__open vc-simulator-desktop__teaser"
                >
                  <div className="vc-simulator-desktop__teaser-blur">
                    <div className="vc-simulator-desktop__message">
                      <span>{sample.emoji} Message preview</span>
                      <h3>{sample.title}</h3>
                      <p>{sample.body}</p>
                    </div>

                    <div className="vc-simulator-desktop__story">
                      <small>A tiny story before the answer</small>
                      <strong>The questions, choices, replies, and ending unlock after payment.</strong>
                      <div>
                        <span>Custom questions</span>
                        <span>Private answer</span>
                        <span>Reply room</span>
                      </div>
                    </div>
                  </div>

                  <div className="vc-simulator-paywall vc-simulator-paywall--desktop">
                    <span>Preview unlocked</span>
                    <h3>See the full card</h3>
                    <p>
                      Pay only when the demo feels send-worthy. The real card
                      opens with the complete story, answer flow, and private
                      link for your person.
                    </p>
                    <Link href={`/customize?type=${activeTemplate}&new=1`}>
                      See full card & pay
                    </Link>
                    <button type="button" onClick={handleReset}>
                      Reset demo
                    </button>
                  </div>
                </motion.div>
              )}
            </section>
          </div>
        </motion.div>
      )}

      <p
        className="text-[10px] font-semibold text-center max-w-[260px] leading-relaxed"
        style={{ color: "var(--text2)" }}
      >
        Live demo · Switch views · Open the teaser
      </p>
    </div>
  );
}
