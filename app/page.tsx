"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import LiveSimulator from "@/components/LiveSimulator";
import AmbientBackground from "@/components/AmbientBackground";
import ComplianceFooter from "@/components/ComplianceFooter";
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

const SEO_FAQS = [
  {
    question: "What is VibeCheck?",
    answer:
      "VibeCheck is a private interactive greeting card maker for moments that need more than a normal text. You can create a sorry card, happy birthday card, bestie card, love note, or private digital card with a photo, music, tiny questions, and one private link.",
  },
  {
    question: "Why not just send a WhatsApp message?",
    answer:
      "A normal message disappears in the chat. A VibeCheck opens like a small experience: cover first, message next, song and questions after that, then a private reply room for the two people involved.",
  },
  {
    question: "Can I make cards for India and US friends?",
    answer:
      "Yes. VibeCheck works in the browser, so your recipient only needs the private link. The writing style is built for Indian and US audiences: warm, direct, playful, and easy to share.",
  },
  {
    question: "Which VibeCheck card should I start with?",
    answer:
      "Start with the moment: use Sorry Card when the apology needs effort, Happy Birthday when a story post feels lazy, and Bestie Card when you want inside-joke energy without making it public.",
  },
];

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
          <Link href="/customize?new=1">Make a VibeCheck</Link>
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
            <Link
              href="/dashboard"
              className="hidden rounded-full border border-pink-200 bg-white/70 px-4 py-3 text-xs font-black uppercase tracking-[0.14em] text-[#7b3f6e] shadow-sm shadow-pink-100 transition hover:-translate-y-0.5 hover:bg-white sm:inline-flex"
            >
              Dashboard
            </Link>
            <Link href="/about" className="hidden text-xs font-black uppercase text-[#7b3f6e] lg:inline-flex">
              About
            </Link>
            <Link href="/contact" className="hidden text-xs font-black uppercase text-[#7b3f6e] lg:inline-flex">
              Contact
            </Link>
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
                <Link href="/customize?new=1">
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
              <div className="grid md:grid-cols-3 gap-5 max-w-4xl mx-auto">
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
                    <Link href={`/customize?tier=${tier.id}&new=1`}>
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

          {/* Purchase assurances */}
          <section className="px-6 py-10">
            <div className="vc-container grid gap-4 md:grid-cols-3">
              {[
                {
                  icon: "₹",
                  title: "Transparent pricing",
                  text: "The exact card price and access duration are shown before payment.",
                },
                {
                  icon: "⚡",
                  title: "Digital delivery",
                  text: "Your private card link unlocks online after payment is successfully captured.",
                },
                {
                  icon: "↩",
                  title: "Real support",
                  text: "Duplicate charges and verified non-delivery are covered by our refund policy.",
                },
              ].map((item) => (
                <article
                  key={item.title}
                  className="rounded-2xl border p-6"
                  style={{
                    background: "var(--surface)",
                    borderColor: "var(--border)",
                  }}
                >
                  <span
                    className="text-2xl font-black"
                    style={{ color: "var(--accent)" }}
                    aria-hidden
                  >
                    {item.icon}
                  </span>
                  <h3 className="mt-3 font-black" style={{ color: "var(--text)" }}>
                    {item.title}
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: "var(--text2)" }}>
                    {item.text}
                  </p>
                </article>
              ))}
            </div>
          </section>

          {/* SEO trust copy */}
          <section className="vc-seo-section px-6 py-16" aria-labelledby="vibecheck-seo-heading">
            <div className="vc-container">
              <div className="vc-section-copy vc-section-copy--center">
                <span className="vc-eyebrow">Private greeting cards online</span>
                <h2 id="vibecheck-seo-heading">
                  VibeCheck turns one message into a private card they can actually feel.
                </h2>
                <p>
                  Make a private interactive greeting card for the exact moment:
                  a sincere apology, a birthday surprise, a best friend note, or
                  a small confession that deserves more than a forwarded template.
                </p>
              </div>

              <div className="vc-seo-link-grid" aria-label="Popular VibeCheck card types">
                <Link href="/sorry-card">Sorry card online</Link>
                <Link href="/birthday-card">Happy birthday card online</Link>
                <Link href="/bestie-card">Bestie card online</Link>
              </div>

              <div className="vc-seo-faq-grid">
                {SEO_FAQS.map((faq, index) => (
                  <motion.article
                    key={faq.question}
                    initial={{ opacity: 0, y: 18 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: index * 0.06 }}
                    className="vc-seo-faq-card"
                  >
                    <h3>{faq.question}</h3>
                    <p>{faq.answer}</p>
                  </motion.article>
                ))}
              </div>
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
              <Link href="/customize?new=1">
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

          <ComplianceFooter />
          <div className="scroll-roll-bottom"></div>
        </div>
      </div>
    </main>
  );
}
