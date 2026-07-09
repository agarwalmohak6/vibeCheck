"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import LiveSimulator from "@/components/LiveSimulator";
import AmbientBackground from "@/components/AmbientBackground";
import { useTheme } from "@/components/ThemeProvider";
import { TIERS } from "@/lib/themes";
import { LANDING_STRINGS } from "@/lib/strings";

const EXPERIENCE_STACK = [
  {
    id: "feature-envelope-reveal",
    label: "Envelope reveal",
    value: "Feels personal before the message appears",
  },
  {
    id: "feature-passcode-gates",
    label: "Passcode gates",
    value: "Keep it just between the two of you",
  },
  {
    id: "feature-music-reveal",
    label: "Music reveal",
    value: "One good song does more than a paragraph",
  },
  {
    id: "feature-live-tracker",
    label: "Live tracker",
    value: "See opens, unlocks, taps, and replies",
  },
];

const LAUNCH_STATS = [
  { value: "<3 min", label: "to make it" },
  { value: "3", label: "high-intent moments" },
  { value: "1 link", label: "made for one person" },
  { value: "0 apps", label: "needed to open" },
];

const SIGNATURE_THEMES = [
  {
    name: "Sorry",
    image: "/themes/maan_jao_cover.png",
    mood: 'For when "sorry" over text just does not cut it',
    decor: ["🥺", "💌", "🧸"],
    colors: ["#FF85A1", "#FDE68A", "#FFFFFF"],
  },
  {
    name: "Happy Birthday",
    image: "/themes/birthday_roast_cover.png",
    mood: "A birthday card that actually feels like a gift",
    decor: ["🎂", "🎩", "🧸"],
    colors: ["#FACC15", "#D97706", "#4C0519"],
  },
  {
    name: "Bestie",
    image: "/themes/bestie_cover.png",
    mood: "Tell your person they are one of the best parts of your life",
    decor: ["🍹", "🥂", "✨"],
    colors: ["#FF2E93", "#7D82B8", "#FAFAFD"],
  },
];

function InstagramIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4.1" />
      <circle cx="17.2" cy="6.8" r="1" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M14.2 8.5V7.1c0-.8.4-1.2 1.3-1.2h1.9V3.2c-.8-.1-1.7-.2-2.6-.2-2.7 0-4.5 1.6-4.5 4.5v1H7.5v3.1h2.8V21h3.4v-9.4h2.8l.5-3.1h-3Z" />
    </svg>
  );
}

function FacebookIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" focusable="false">
      <path d="M14.2 8.5V7.1c0-.8.4-1.2 1.3-1.2h1.9V3.2c-.8-.1-1.7-.2-2.6-.2-2.7 0-4.5 1.6-4.5 4.5v1H7.5v3.1h2.8V21h3.4v-9.4h2.8l.5-3.1h-3Z" />
    </svg>
  );
}

export default function LandingPage() {
  const { setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [showDock, setShowDock] = useState(false);

  useEffect(() => {
    setTheme("soft_coquette");
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
      setShowDock(window.scrollY > window.innerHeight * 0.8);
    };
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setTheme]);

  return (
    <main
      className="min-h-screen vc-market"
      style={{ background: "var(--bg)", overflowX: "hidden" }}
    >
      <AmbientBackground />

      {showDock && (
        <div className="vc-conversion-dock" aria-label="Quick start">
          <span>One link, one person, not another forwarded template</span>
          <Link href="/customize">Make a VibeCheck</Link>
        </div>
      )}

      {/* Nav */}
      <nav className={`vc-nav ${scrolled ? "vc-nav--scrolled" : ""}`}>
        <div className="vc-nav-container flex items-center justify-between mx-auto w-full">
          <Link href="/" className="vc-logo-link flex items-center gap-3">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              className="vc-brand-lockup"
            >
              <span className="vc-wordmark font-black font-display tracking-tight">
                VibeCheck
              </span>
              <span className="vc-brand-tagline">Private cards</span>
            </motion.div>
          </Link>

          {/* Desktop Navigation Links */}
          <div className="hidden md:flex items-center gap-8 vc-nav-links">
            <a href="#features" className="vc-nav-link">
              FEATURES
            </a>
            <a href="#demo" className="vc-nav-link">
              SIMULATOR
            </a>
            <a href="#pricing" className="vc-nav-link">
              PRICING
            </a>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="vc-nav-actions"
          >
            <div className="vc-social-links" aria-label="Social links">
              <a
                href="https://instagram.com/vibecheck.cards"
                aria-label="VibeCheck on Instagram"
                target="_blank"
                rel="noreferrer"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://facebook.com/vibecheckcards"
                aria-label="VibeCheck on Facebook"
                target="_blank"
                rel="noreferrer"
              >
                <FacebookIcon />
              </a>
            </div>
            <Link href="#demo">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 15px var(--glow)" }}
                whileTap={{ scale: 0.96 }}
                className="vc-nav-cta theme-btn rounded-full font-black text-white uppercase"
              >
                SEE HOW IT WORKS
              </motion.button>
            </Link>
          </motion.div>
        </div>
      </nav>

      <div className="vc-page-body-wrap">
        {/* Front Side of the 3D Scroll */}
        <div className="vc-page-body-front">
          {/* Hero */}
          <section className="vc-hero relative text-center overflow-hidden">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="vc-hero__content relative z-10 max-w-4xl mx-auto"
            >
              <div
                className="vc-hero-badge inline-flex items-center gap-2 rounded-full font-black uppercase"
                style={{
                  background:
                    "color-mix(in srgb, var(--accent), transparent 88%)",
                  border:
                    "1px solid color-mix(in srgb, var(--accent), transparent 75%)",
                  color: "var(--accent)",
                }}
              >
                ✨ {LANDING_STRINGS.HERO_BADGE}
              </div>

              <h1 className="vc-hero-kicker mx-auto mb-6 text-center">
                {LANDING_STRINGS.HERO_TITLE_1}
                <br />
                {LANDING_STRINGS.HERO_TITLE_2}
              </h1>

              <p
                className="vc-hero-body mx-auto text-center"
                style={{ color: "var(--text2)" }}
              >
                {LANDING_STRINGS.HERO_SUBTITLE}
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link href="/customize">
                  <motion.button
                    whileHover={{
                      scale: 1.05,
                      boxShadow: "0 20px 60px var(--glow)",
                    }}
                    whileTap={{ scale: 0.96 }}
                    className="theme-btn px-8 py-4 rounded-2xl text-lg font-black text-white animate-pulse-glow"
                  >
                    {LANDING_STRINGS.HERO_BUTTON}
                  </motion.button>
                </Link>
                <p className="text-sm" style={{ color: "var(--text2)" }}>
                  {LANDING_STRINGS.HERO_PRICE_NOTE}
                </p>
              </div>
            </motion.div>
          </section>

          {/* Launch credibility */}
          <section className="vc-band px-6 py-10">
            <div className="vc-container">
              <div className="vc-stat-grid">
                {LAUNCH_STATS.map((stat, index) => (
                  <motion.div
                    key={stat.label}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="vc-stat"
                  >
                    <strong>{stat.value}</strong>
                    <span>{stat.label}</span>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Scene runway */}
          <section id="themes" className="px-6 py-16">
            <div className="vc-container">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="vc-section-copy vc-section-copy--center"
              >
                <span className="vc-eyebrow">Mood before message</span>
                <h2>Pick a card that feels giftable in 10 seconds.</h2>
                <p>
                  Sorry, Happy Birthday, or Bestie. Each one gets its own cover,
                  mood, buttons, and storyline so the card feels made for the
                  person before they read a word.
                </p>
              </motion.div>

              <div className="vc-theme-runway">
                {SIGNATURE_THEMES.map((theme, index) => (
                  <motion.article
                    key={theme.name}
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.08 }}
                    className="vc-theme-card"
                  >
                    <div
                      className="vc-theme-card__image"
                      style={{ backgroundImage: `url(${theme.image})` }}
                    />
                    <div className="vc-theme-card__body">
                      <div className="vc-theme-card__decor" aria-hidden>
                        {theme.decor.map((item) => (
                          <span key={item}>{item}</span>
                        ))}
                      </div>
                      <span className="vc-theme-card__label">Greeting cover</span>
                      <h3>{theme.name}</h3>
                      <p>{theme.mood}</p>
                    </div>
                  </motion.article>
                ))}
              </div>
            </div>
          </section>

          {/* Experience stack */}
          <section id="features" className="px-6 py-14">
            <div className="vc-container vc-experience-grid">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="vc-section-copy"
              >
                <span className="vc-eyebrow">Built to feel personal</span>
                <h2>Not another forwarded template.</h2>
                <p>
                  VibeCheck turns a text into a private reveal people can open,
                  hear, unlock, and reply to. It takes minutes, but feels like
                  much more effort than that.
                </p>
              </motion.div>

              <div
                className="vc-stack-panel"
                aria-label="VibeCheck experience stack"
              >
                {EXPERIENCE_STACK.map((item, index) => (
                  <motion.div
                    key={item.label}
                    id={item.id}
                    initial={{ opacity: 0, x: 18 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.1 }}
                    className="vc-stack-row"
                  >
                    <span>0{index + 1}</span>
                    <div>
                      <strong>{item.label}</strong>
                      <p>{item.value}</p>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </section>

          {/* Live Simulator */}
          <section id="demo" className="vc-demo-section px-6 py-16 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="space-y-8"
            >
              <div className="text-center">
                <h2
                  className="text-3xl md:text-4xl font-bold mb-3"
                  style={{
                    color: "var(--text)",
                    fontFamily: "var(--font-display)",
                  }}
                >
                  {LANDING_STRINGS.SIMULATOR_TITLE}
                </h2>
                <p className="text-base" style={{ color: "var(--text2)" }}>
                  {LANDING_STRINGS.SIMULATOR_SUBTITLE}
                </p>
              </div>

              <div className="space-y-4">
                <div className="text-center">
                  <span className="text-xs font-black uppercase tracking-widest text-[var(--accent)]">
                    VibeCheck Simulator
                  </span>
                  <p className="text-sm text-[var(--text2)] mt-1">
                    Watch a Sorry card come together, then switch cards to see
                    how each moment changes automatically.
                  </p>
                </div>
                <LiveSimulator />
              </div>
            </motion.div>
          </section>

          {/* Pricing */}
          <section id="pricing" className="px-6 py-12 max-w-4xl mx-auto">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2
                className="text-2xl md:text-3xl font-bold text-center mb-3"
                style={{
                  color: "var(--text)",
                  fontFamily: "var(--font-display)",
                }}
              >
                {LANDING_STRINGS.PRICING_TITLE}
              </h2>
              <p
                className="text-center text-sm mb-10"
                style={{ color: "var(--text2)" }}
              >
                {LANDING_STRINGS.PRICING_SUBTITLE}
              </p>
              <div className="grid md:grid-cols-2 gap-5 max-w-2xl mx-auto">
                {TIERS.map((tier, i) => (
                  <motion.div
                    key={tier.id}
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15 }}
                    whileHover={{ scale: 1.03, y: -4 }}
                    className={`rounded-2xl p-6 relative transition-all ${tier.popular ? "tier-popular" : "theme-surface"}`}
                  >
                    {tier.popular && (
                      <div
                        className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--accent), var(--accent2))",
                        }}
                      >
                        🔥 Most Popular
                      </div>
                    )}
                    <div className="text-3xl mb-3">{tier.icon}</div>
                    <div
                      className="text-3xl font-black mb-1"
                      style={{ color: "var(--text)" }}
                    >
                      ₹{tier.price}
                    </div>
                    <div
                      className="text-sm font-semibold mb-1"
                      style={{ color: "var(--accent)" }}
                    >
                      {tier.duration}
                    </div>
                    <div
                      className="text-sm mb-4"
                      style={{ color: "var(--text2)" }}
                    >
                      {tier.description}
                    </div>
                    <ul className="vc-tier-list">
                      <li>Interactive reveal</li>
                      <li>Private one-person link</li>
                      <li>Tracker and replies</li>
                    </ul>
                    <Link href={`/customize?tier=${tier.id}`}>
                      <motion.button
                        whileTap={{ scale: 0.96 }}
                        className="w-full py-2.5 rounded-xl font-bold text-sm"
                        style={{
                          background: tier.popular
                            ? "linear-gradient(135deg, var(--accent), var(--accent2))"
                            : "var(--surface2)",
                          color: tier.popular ? "white" : "var(--text)",
                          border: tier.popular
                            ? "none"
                            : "1px solid var(--border)",
                        }}
                      >
                        Make a VibeCheck
                      </motion.button>
                    </Link>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </section>

          {/* Social proof ticker */}
          <section className="py-8 overflow-hidden">
            <div className="relative">
              <motion.div
                className="flex gap-4 whitespace-nowrap"
                animate={{ x: [0, "-50%"] }}
                transition={{ repeat: Infinity, duration: 28, ease: "linear" }}
              >
                {[
                  ...LANDING_STRINGS.TESTIMONIALS,
                  ...LANDING_STRINGS.TESTIMONIALS,
                ].map((t, i) => (
                  <div
                    key={i}
                    className="inline-flex flex-col gap-1 px-5 py-4 rounded-2xl shrink-0"
                    style={{
                      background: "var(--surface)",
                      border: "1px solid var(--border)",
                      minWidth: 220,
                      maxWidth: 260,
                    }}
                  >
                    <p
                      className="text-sm whitespace-normal"
                      style={{ color: "var(--text)" }}
                    >
                      {t.text}
                    </p>
                    <p className="text-xs" style={{ color: "var(--accent)" }}>
                      {t.handle}
                    </p>
                  </div>
                ))}
              </motion.div>
            </div>
          </section>

          {/* Final CTA */}
          <section className="px-6 py-16 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <h2
                className="text-3xl md:text-5xl font-black mb-4"
                style={{
                  fontFamily: "var(--font-display)",
                  color: "var(--text)",
                }}
              >
                {LANDING_STRINGS.CTA_TITLE}
              </h2>
              <p
                className="text-base mb-8 max-w-md mx-auto"
                style={{ color: "var(--text2)" }}
              >
                {LANDING_STRINGS.CTA_SUBTITLE}
              </p>
              <Link href="/customize">
                <motion.button
                  whileHover={{
                    scale: 1.06,
                    boxShadow: "0 30px 80px var(--glow)",
                  }}
                  whileTap={{ scale: 0.96 }}
                  className="theme-btn px-10 py-5 rounded-2xl text-xl font-black text-white"
                >
                  {LANDING_STRINGS.CTA_BUTTON}
                </motion.button>
              </Link>
            </motion.div>
          </section>

          {/* Footer */}
          <footer
            className="vc-footer px-6 py-8 text-center border-t"
            style={{ borderColor: "var(--border)" }}
          >
            <p className="text-sm" style={{ color: "var(--text2)" }}>
              {LANDING_STRINGS.FOOTER_TEXT}
              <a
                href={`mailto:${LANDING_STRINGS.FOOTER_EMAIL}`}
                style={{ color: "var(--accent)" }}
              >
                {LANDING_STRINGS.FOOTER_EMAIL}
              </a>
            </p>
            <div className="vc-footer-social" aria-label="Social links">
              <a
                href="https://instagram.com/vibecheck.cards"
                aria-label="VibeCheck on Instagram"
                target="_blank"
                rel="noreferrer"
              >
                <InstagramIcon />
              </a>
              <a
                href="https://facebook.com/vibecheckcards"
                aria-label="VibeCheck on Facebook"
                target="_blank"
                rel="noreferrer"
              >
                <FacebookIcon />
              </a>
            </div>
          </footer>
          <div className="scroll-roll-bottom"></div>
        </div>

        {/* Back Side of the 3D Scroll */}
        <div className="vc-page-body-back">
          <div className="scroll-roll-top"></div>

          <div className="scroll-back-content max-w-4xl mx-auto py-12 px-6 flex flex-col gap-10">
            {/* Header */}
            <div className="text-center space-y-3">
              <span className="text-xs font-black tracking-widest uppercase text-amber-700">
                📜 VibeCheck Archives
              </span>
              <h2 className="text-4xl md:text-5xl font-black font-serif text-amber-900 leading-tight">
                Best Simulators & Recipient Reviews
              </h2>
              <p className="text-sm text-amber-800/80 max-w-lg mx-auto">
                See how VibeCheck interactive cards perform in the wild and what
                creators & recipients say.
              </p>
            </div>

            {/* Simulators Grid */}
            <div className="grid md:grid-cols-2 gap-6">
              <div className="bg-amber-900/5 border border-amber-900/15 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-pink-100 text-pink-700 border border-pink-200">
                    💓 ACTIVE SIMULATOR
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold">
                    14 mins ago
                  </span>
                </div>
                <h4 className="font-bold text-lg text-amber-900">
                  Midnight Confession #882
                </h4>
                <p className="text-xs text-amber-900/80 leading-relaxed font-serif">
                  {"\"I stayed up till 2 AM drafting this. Added the Midnight Romance scene and a custom track. She guessed the passcode '2024' on the first try and typed: 'YES of course!' live in the chat. Best ₹29 I ever spent.\""}
                </p>
                <div className="border-t border-amber-900/10 pt-2 flex justify-between text-[10px] font-bold text-amber-800">
                  <span>Recipient: Priya</span>
                  <span>Conversion: 100% ✅</span>
                </div>
              </div>

              <div className="bg-amber-900/5 border border-amber-900/15 rounded-2xl p-6 space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-xs font-bold px-2.5 py-0.5 rounded-full bg-yellow-100 text-yellow-700 border border-yellow-200">
                    🎂 COMPLETED SIMULATOR
                  </span>
                  <span className="text-[10px] text-amber-700 font-bold">
                    2 hrs ago
                  </span>
                </div>
                <h4 className="font-bold text-lg text-amber-900">
                  Retro Birthday surprise #104
                </h4>
                <p className="text-xs text-amber-900/80 leading-relaxed font-serif">
                  {"\"Sent to my brother Kabir. The passcode was our childhood dog's name. The tracker showed he tried 3 wrong passcodes before getting it, then played the background music 4 times. He called me immediately!\""}
                </p>
                <div className="border-t border-amber-900/10 pt-2 flex justify-between text-[10px] font-bold text-amber-800">
                  <span>Recipient: Kabir</span>
                  <span>Clicks: 6 tracker hits 📊</span>
                </div>
              </div>
            </div>

            {/* Testimonials Columns */}
            <div className="space-y-4">
              <h3 className="text-xl font-bold text-amber-900 font-serif border-b border-amber-900/10 pb-2">
                What Our Community Says 💬
              </h3>
              <div className="grid md:grid-cols-3 gap-5">
                {[
                  {
                    user: "@tanya.s",
                    role: "Creator",
                    text: "The passcode gate is absolute genius. My best friend had to guess our inside joke to unlock the card. Highly recommend!",
                  },
                  {
                    user: "@rohan_99",
                    role: "Developer",
                    text: "Testing mock payments locally is seamless. The live activity dashboard is super addicting to watch!",
                  },
                  {
                    user: "@sneha.desai",
                    role: "Recipient",
                    text: "I received a custom Coquette card. Opening the envelope, hearing the music, and replying in real time felt so premium.",
                  },
                ].map((r, i) => (
                  <div
                    key={i}
                    className="bg-white/40 border border-amber-900/10 rounded-xl p-4 space-y-2"
                  >
                    <p className="text-xs text-amber-950 font-serif leading-relaxed">
                      {"\""}{r.text}{"\""}
                    </p>
                    <div className="flex justify-between items-center text-[10px] font-bold text-amber-800">
                      <span>{r.user}</span>
                      <span className="opacity-75">{r.role}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Scroll bottom quote */}
            <div className="text-center py-4 border-t border-amber-900/10">
              <span className="text-[10px] text-amber-800/60 uppercase tracking-widest font-black">
                VibeCheck · Handcrafted in 3D Space
              </span>
            </div>
          </div>

          <div className="scroll-roll-bottom"></div>
        </div>
      </div>
    </main>
  );
}
