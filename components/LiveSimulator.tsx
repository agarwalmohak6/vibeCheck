"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import confetti from "canvas-confetti";
import { useTheme } from "@/components/ThemeProvider";
import { THEMES, TEMPLATE_TYPES, ThemeId } from "@/lib/themes";
import RunawayButton from "@/components/RunawayButton";
import HeartCanvas from "@/components/HeartCanvas";

// Per-template sample content for the simulator
const TEMPLATE_SAMPLES: Record<
  string,
  { emoji: string; badge: string; title: string; body: string; yesMsg: string }
> = {
  shoot_shot: {
    emoji: "💍",
    badge: "Shoot Your Shot",
    title: "okay I'm down bad 💀",
    body: "I have rehearsed this in the mirror 47 times.\nYou're literally my Roman Empire.\nPlease be my person? 🥺",
    yesMsg: "SHE SAID YES!!! 🎉💖",
  },
  maan_jao: {
    emoji: "🥺",
    badge: "Maan Jao Na",
    title: "please maan jao yaar 😭",
    body: "Galti ho gayi, I know.\nMain maafi maangta hun.\nBas ek baar forgive karo?",
    yesMsg: "Maaf kar diya 💕 Let's go back!",
  },
  birthday_roast: {
    emoji: "🎂",
    badge: "Birthday Roast",
    title: "Happy getting older 💀",
    body: "Another year of surviving on vibes and luck.\nYour reflexes are aging but my love isn't.\nHappy birthday you absolute legend 🎉",
    yesMsg: "🎂 The roast was accepted! 🎉",
  },
  bestie_check: {
    emoji: "✨",
    badge: "Bestie Vibe Check",
    title: "okay fine I love you 💅",
    body: "You're my chaos partner. My 2am call person.\nStuck with me forever, no refunds.\nAccept it bestie 👯‍♀️",
    yesMsg: "Bestie forever accepted! 💗",
  },
  netflix_chill: {
    emoji: "🍿",
    badge: "Netflix & Chill",
    title: "No plans this weekend? 👀",
    body: "I may have cleared my entire schedule.\nAnd bought a lot of snacks.\nCome watch something with me? 🛋️",
    yesMsg: "Date night confirmed! 🍿💕",
  },
};

export default function LiveSimulator() {
  const { theme, setTheme } = useTheme();
  const [activeTemplate, setActiveTemplate] = useState("shoot_shot");
  const [envelopeOpen, setEnvelopeOpen] = useState(false);
  const [yesClicked, setYesClicked] = useState(false);
  const [isOpening, setIsOpening] = useState(false);

  const currentThemeData = THEMES.find((t) => t.id === theme);
  const sample =
    TEMPLATE_SAMPLES[activeTemplate] || TEMPLATE_SAMPLES.shoot_shot;
  const tmplMeta = TEMPLATE_TYPES.find((t) => t.id === activeTemplate);
  const yesText = tmplMeta?.defaultYesText || "YES 💖";
  const noText = tmplMeta?.defaultNoText || "No 💔";

  const handleSwitchTemplate = (templateId: string) => {
    setActiveTemplate(templateId);
    // Auto-switch theme to match template's recommended theme
    const tmpl = TEMPLATE_TYPES.find((t) => t.id === templateId);
    if (tmpl?.recommendedTheme) setTheme(tmpl.recommendedTheme as ThemeId);
    setEnvelopeOpen(false);
    setYesClicked(false);
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
    setYesClicked(false);
    setIsOpening(false);
  };

  const handleYes = () => {
    setYesClicked(true);
    const colors = ["#FACC15", "#FF2E93", "#a855f7", "#00FF66", "#ffffff"];
    confetti({ particleCount: 200, spread: 160, origin: { y: 0.5 }, colors });
    setTimeout(
      () =>
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.6, x: 0.3 },
          colors,
        }),
      300,
    );
    setTimeout(
      () =>
        confetti({
          particleCount: 100,
          spread: 90,
          origin: { y: 0.6, x: 0.7 },
          colors,
        }),
      500,
    );
  };

  return (
    <div className="flex flex-col items-center gap-5">
      {/* Template tabs */}
      <div className="flex flex-wrap justify-center gap-2 max-w-sm">
        {TEMPLATE_TYPES.map((t) => (
          <motion.button
            key={t.id}
            onClick={() => handleSwitchTemplate(t.id)}
            whileTap={{ scale: 0.92 }}
            whileHover={{ scale: 1.05, y: -1 }}
            className="px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1 cursor-pointer"
            style={{
              background:
                activeTemplate === t.id
                  ? "linear-gradient(135deg, var(--accent), var(--accent2))"
                  : "var(--surface)",
              color: activeTemplate === t.id ? "white" : "var(--text3)",
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

      {/* Theme tabs */}
      <div className="flex flex-wrap justify-center gap-1.5 max-w-sm">
        {THEMES.map((t) => (
          <motion.button
            key={t.id}
            onClick={() => setTheme(t.id as ThemeId)}
            whileTap={{ scale: 0.92 }}
            className="px-2.5 py-1 rounded-full text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
            style={{
              background: theme === t.id ? t.preview.accent : "var(--surface2)",
              color: theme === t.id ? "white" : "var(--text3)",
              border: `1px solid ${theme === t.id ? t.preview.accent : "var(--border)"}`,
              transition: "all 0.2s ease",
            }}
          >
            {t.emoji} {t.label}
          </motion.button>
        ))}
      </div>

      {/* Phone frame */}
      <motion.div
        className="relative mx-auto"
        style={{ width: 288, height: 590 }}
        animate={{ y: [0, -5, 0] }}
        transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
      >
        {/* Outer glow ring */}
        <motion.div
          className="absolute inset-0 rounded-[2.5rem] pointer-events-none"
          animate={{
            boxShadow: [
              "0 0 30px var(--glow)",
              "0 0 60px var(--glow)",
              "0 0 30px var(--glow)",
            ],
          }}
          transition={{ repeat: Infinity, duration: 2.5 }}
        />

        {/* Phone bezel */}
        <div
          className="absolute inset-0 rounded-[2.5rem] border-[7px] overflow-hidden shadow-2xl"
          style={{
            background: "var(--bg)",
            borderColor: "#1a1a2e",
            boxShadow:
              "0 35px 90px rgba(0,0,0,0.7), inset 0 0 80px rgba(0,0,0,0.3)",
          }}
        >
          {/* Status bar */}
          <div
            className="flex justify-between items-center px-5 pt-3 pb-1 z-20 relative"
            style={{ color: "var(--text3)" }}
          >
            <span className="text-[9px] font-bold">12:00</span>
            <div
              className="w-14 h-3.5 rounded-b-xl mx-auto absolute left-1/2 -translate-x-1/2 top-0"
              style={{ background: "#0a0a0f" }}
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
                  className="flex flex-col items-center justify-center h-full gap-3 px-5 relative z-10"
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
                    style={{ color: "var(--text3)" }}
                  >
                    You have an unread vibe from
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
                    {theme === "desi_festive" || theme === "bollywood_drama" ? (
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
                          background: "var(--surface)",
                          border: "2px solid var(--accent)",
                          boxShadow: "0 0 40px var(--glow)",
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
                      : theme === "desi_festive" || theme === "bollywood_drama"
                        ? "✨ Tap Wax Seal to Break"
                        : "✨ Tap to open"}
                  </motion.p>
                </motion.div>
              )}

              {/* ── CARD OPEN ── */}
              {envelopeOpen && !yesClicked && (
                <motion.div
                  key={`card-${activeTemplate}`}
                  initial={{ opacity: 0, y: 40 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.4 }}
                  className="h-full flex flex-col overflow-y-auto px-3 gap-2.5 pt-2 pb-14 relative z-10"
                  style={{ scrollbarWidth: "none" }}
                >
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

                  {/* Cover image — fixed aspect, no overflow */}
                  {currentThemeData?.coverImage && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{ delay: 0.25 }}
                      className="rounded-xl overflow-hidden border border-white/5 shadow-lg shrink-0 bg-black/20"
                    >
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={currentThemeData.coverImage}
                        alt="Cover"
                        className="w-full h-auto aspect-video object-contain"
                        draggable={false}
                      />
                    </motion.div>
                  )}

                  {/* Message card */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.35 }}
                    className="rounded-2xl p-3.5 glow-border text-left"
                    style={{ background: "var(--surface)", flexShrink: 0 }}
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

                  {/* YES/NO interactive section */}
                  <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.5 }}
                    className="rounded-2xl px-3 py-3"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      flexShrink: 0,
                    }}
                  >
                    <p
                      className="text-[10px] mb-1.5 font-black text-center"
                      style={{ color: "var(--text3)" }}
                    >
                      So... what do you say? 👀
                    </p>
                    <p
                      className="text-[9px] mb-2 text-center"
                      style={{ color: "var(--text3)", opacity: 0.7 }}
                    >
                      (The NO button has its own opinions 💀)
                    </p>
                    <RunawayButton
                      key={`${activeTemplate}-${yesText}-${noText}`}
                      onYes={handleYes}
                      memeMode={false}
                      templateType={activeTemplate}
                      compact={true}
                      yesText={yesText}
                      noText={noText}
                    />
                  </motion.div>

                  {/* Reset */}
                  <motion.button
                    onClick={handleReset}
                    whileTap={{ scale: 0.95 }}
                    className="text-[10px] py-1.5 rounded-xl font-bold cursor-pointer"
                    style={{
                      background: "var(--surface2)",
                      color: "var(--text3)",
                      flexShrink: 0,
                    }}
                  >
                    ↩ Reset demo
                  </motion.button>
                </motion.div>
              )}

              {/* ── YES SUCCESS ── */}
              {envelopeOpen && yesClicked && (
                <motion.div
                  key="yes"
                  initial={{ opacity: 0, scale: 0.75 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 18 }}
                  className="h-full flex flex-col items-center justify-center gap-3 px-4 relative z-10"
                >
                  <motion.div
                    animate={{ scale: [1, 1.4, 1], rotate: [0, 15, -15, 0] }}
                    transition={{ repeat: Infinity, duration: 1.2 }}
                    className="text-5xl"
                  >
                    🎉
                  </motion.div>
                  <p
                    className="text-base font-black text-center leading-snug"
                    style={{
                      fontFamily: "var(--font-display)",
                      color: "var(--accent)",
                    }}
                  >
                    {sample.yesMsg}
                  </p>
                  <p
                    className="text-[10px] text-center"
                    style={{ color: "var(--text3)" }}
                  >
                    This is what happens when they click YES 😭✨
                  </p>
                  <motion.button
                    onClick={handleReset}
                    whileTap={{ scale: 0.95 }}
                    className="px-5 py-2 rounded-xl text-xs font-bold cursor-pointer"
                    style={{
                      background: "var(--surface2)",
                      color: "var(--text3)",
                    }}
                  >
                    ↩ Try another
                  </motion.button>
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

      <p
        className="text-[10px] font-semibold text-center max-w-[260px] leading-relaxed"
        style={{ color: "var(--text3)" }}
      >
        👆 Live demo · Switch templates & themes · Try to hit NO
      </p>
    </div>
  );
}
