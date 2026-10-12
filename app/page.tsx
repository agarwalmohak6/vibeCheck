"use client";

import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import AmbientBackground from "@/components/AmbientBackground";
import { useTheme } from "@/components/ThemeProvider";
import { TIERS } from "@/lib/themes";

const HERO_CLIPS = [
  {
    title: "Confession",
    image: "/themes/blush_cream.svg",
    tone: "A little courage, wrapped in a little love.",
  },
  {
    title: "Sorry",
    image: "/themes/sorry_cream.svg",
    tone: "Own the mistake with a reveal that feels thoughtful.",
  },
  {
    title: "Birthday",
    image: "/themes/birthday_cream.svg",
    tone: "Make the wish feel like a tiny event.",
  },
];

const FLOW_STEPS = [
  ["01", "Choose the mood", "Pick a confession, proposal, apology, birthday, or movie night."],
  ["02", "Add the truth", "Write the note, add photos, music, lock, and your order contact."],
  ["03", "Share one link", "Pay by UPI, get your recipient link, and track the order privately."],
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

export default function LandingPage() {
  const { setTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    setTheme("soft_coquette");
    const handleScroll = () => setScrolled(window.scrollY > 12);
    handleScroll();
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [setTheme]);

  return (
    <main className="min-h-screen vc-market vc-market-lite" style={{ background: "var(--bg)" }}>
      <AmbientBackground />

      <nav className={`vc-nav ${scrolled ? "vc-nav--scrolled" : ""}`}>
        <div className="vc-nav-container flex items-center justify-between mx-auto w-full">
          <Link href="/" className="vc-logo-link flex items-center gap-3">
            <div className="vc-brand-lockup">
              <span className="vc-wordmark font-black font-display tracking-tight">VibeCheck</span>
              <span className="vc-brand-tagline">Private reveal cards</span>
            </div>
          </Link>

          <div className="vc-nav-actions">
            <div className="vc-social-links" aria-label="Social links">
              <a href="https://instagram.com/vibecheck.cards" aria-label="VibeCheck on Instagram" target="_blank" rel="noreferrer">
                <InstagramIcon />
              </a>
              <a href="https://facebook.com/vibecheckcards" aria-label="VibeCheck on Facebook" target="_blank" rel="noreferrer">
                <FacebookIcon />
              </a>
            </div>
            <Link href="/customize?new=1" className="vc-nav-cta theme-btn rounded-full font-black text-white uppercase">
              Make one
            </Link>
          </div>
        </div>
      </nav>

      <section className="vc-lite-hero">
        <div className="vc-lite-hero__copy">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="vc-eyebrow"
          >
            A little courage. A lot of heart.
          </motion.span>
          <motion.h1
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.06 }}
          >
            Something just for them.
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.12 }}
          >
            Build a private reveal with photos, a scratch note, music, UPI checkout, and order tracking in minutes.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
            className="vc-lite-hero__actions"
          >
            <Link href="/customize?new=1">Start the card</Link>
            <span>From ₹{TIERS[0]?.price || 99} · works on mobile</span>
          </motion.div>
        </div>

        <motion.div
          className="vc-lite-hero__clips"
          initial={{ opacity: 0, y: 24, rotateX: 8 }}
          animate={{ opacity: 1, y: 0, rotateX: 0 }}
          transition={{ delay: 0.16, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          aria-label="VibeCheck mood previews"
        >
          {HERO_CLIPS.map((clip, index) => (
            <article
              key={clip.title}
              style={
                {
                  "--clip-top": `${6 + index * 22}%`,
                  "--clip-rotate": `${(index - 1) * 5}deg`,
                } as React.CSSProperties
              }
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={clip.image} alt="" draggable={false} />
              <div>
                <span>{clip.title}</span>
                <strong>{clip.tone}</strong>
              </div>
            </article>
          ))}
        </motion.div>
      </section>

      <section className="vc-lite-flow" aria-label="How VibeCheck works">
        {FLOW_STEPS.map(([number, title, body]) => (
          <article key={number}>
            <span>{number}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className="vc-lite-pricing" aria-label="Pricing">
        <div>
          <span className="vc-eyebrow">Simple pricing</span>
          <h2>One private link. One clear order ID.</h2>
          <p>A personal note, your favourite photos, and a little music. Made for one person, ready to keep.</p>
        </div>
        <div className="vc-lite-price-grid">
          {TIERS.map((tier) => (
            <Link key={tier.id} href={`/customize?tier=${tier.id}&new=1`} className={tier.popular ? "is-popular" : ""}>
              <span>{tier.icon}</span>
              <strong>₹{tier.price}</strong>
              <em>{tier.duration}</em>
              <small>{tier.description}</small>
            </Link>
          ))}
        </div>
      </section>

      <footer className="vc-lite-footer">
        <p>VibeCheck · Private cards that feel made, not forwarded.</p>
        <div>
          <Link href="/terms">Terms</Link>
          <Link href="/privacy">Privacy</Link>
          <Link href="/contact">Contact</Link>
        </div>
      </footer>
    </main>
  );
}
