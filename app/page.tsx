'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import LiveSimulator from '@/components/LiveSimulator';
import AmbientBackground from '@/components/AmbientBackground';
import { TIERS } from '@/lib/themes';
import { LANDING_STRINGS } from '@/lib/strings';

const EXPERIENCE_STACK = [
  { label: 'Envelope reveal', value: 'Cinematic open' },
  { label: 'Secret gate', value: 'Private passcode' },
  { label: 'Music cue', value: 'Tap-to-play safe' },
  { label: 'Live tracker', value: 'Creator activity feed' },
];

const MARKET_EDGES = [
  {
    title: 'More premium than a template',
    body: 'Every card feels like a designed reveal, not a static greeting image with text pasted on top.',
  },
  {
    title: 'More personal than a video sticker',
    body: 'Names, themes, passcodes, music, photos, and buttons make each link feel built for one person.',
  },
  {
    title: 'More useful after sending',
    body: 'Creators get opens, passcode unlocks, dodge attempts, acceptance moments, and follow-up replies.',
  },
  {
    title: 'Made for mobile sharing',
    body: 'The flow is optimized for WhatsApp, DMs, UPI checkout, and one-thumb recipient interactions.',
  },
];

const LAUNCH_STATS = [
  { value: '<3 min', label: 'to build a card' },
  { value: '5', label: 'emotional templates' },
  { value: '₹29', label: 'starting price' },
  { value: '0 apps', label: 'needed to open' },
];

const SIGNATURE_THEMES = [
  {
    name: 'Midnight Romance',
    image: '/themes/midnight_romance.png',
    mood: 'Neon confession energy',
    colors: ['#FF2E93', '#a855f7', '#06b6d4'],
  },
  {
    name: 'Soft Coquette',
    image: '/themes/soft_coquette.png',
    mood: 'Pastel, delicate, dreamy',
    colors: ['#e91e8c', '#d4a017', '#fff0f5'],
  },
  {
    name: 'Desi Festive',
    image: '/themes/desi_festive.png',
    mood: 'Royal wax-seal drama',
    colors: ['#FACC15', '#D97706', '#4C0519'],
  },
  {
    name: 'K-Drama Magic',
    image: '/themes/kdrama_romance.png',
    mood: 'Soft, elegant, cinematic',
    colors: ['#FF85A1', '#7D82B8', '#FAFAFD'],
  },
];

const FLOW_ACTS = [
  {
    act: 'Act I',
    title: 'The creator feels in control',
    body: 'Pick a template, write the message, add a photo, choose the music, and decide whether the card needs a secret gate.',
  },
  {
    act: 'Act II',
    title: 'The recipient feels chosen',
    body: 'They open a cinematic envelope, unlock the moment, hear the cue, and interact with buttons that feel alive.',
  },
  {
    act: 'Act III',
    title: 'The story keeps going',
    body: 'You see opens, unlocks, dodges, accepts, and replies in a success hub built for the post-send dopamine.',
  },
];

export default function LandingPage() {
  return (
    <main className="min-h-screen vc-market" style={{ background: 'var(--bg)' }}>
      <AmbientBackground />
      <div className="vc-conversion-dock" aria-label="Quick start">
        <span>Private cards that feel handcrafted</span>
        <Link href="/customize">Make yours now</Link>
      </div>

      {/* Nav */}
      <nav className="vc-nav sticky top-0 z-40 px-6 py-4 flex items-center justify-between">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="text-xl font-black"
          style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}
        >
          VibeCheck 🎴
        </motion.div>
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex items-center gap-3"
        >
          <Link href="/customize">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.96 }}
              className="theme-btn px-4 py-2 rounded-full text-sm font-bold text-white"
            >
              {LANDING_STRINGS.NAV_BUTTON}
            </motion.button>
          </Link>
        </motion.div>
      </nav>

      {/* Hero */}
      <section className="vc-hero relative px-6 pt-16 pb-8 text-center overflow-hidden">
        <div className="vc-hero__image" aria-hidden />
        <div className="vc-hero__veil" aria-hidden />
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="vc-hero__content relative z-10 max-w-4xl mx-auto"
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(255,46,147,0.15)', border: '1px solid rgba(255,46,147,0.3)', color: 'var(--accent)' }}>
            {LANDING_STRINGS.HERO_BADGE}
          </div>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight capitalize drop-shadow-2xl"
            style={{
              fontFamily: 'var(--font-display)',
              filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))'
            }}
          >
            <span className="gradient-text">VibeCheck</span>
          </h1>

          <p className="vc-hero-kicker mx-auto mb-5">
            Premium cards for proposals, apologies, birthdays, best friends, and anniversaries.
          </p>

          <p className="text-base md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text3)' }}>
            Create a private experience that feels premium, emotionally loaded, and impossible to ignore.
          </p>

          <div className="vc-proof-strip mx-auto mb-8">
            <span>Passcode gates</span>
            <span>Live tracker</span>
            <span>Music reveal</span>
            <span>Follow-up chat</span>
          </div>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
            <Link href="/customize">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: '0 20px 60px var(--glow)' }}
                whileTap={{ scale: 0.96 }}
                className="theme-btn px-8 py-4 rounded-2xl text-lg font-black text-white animate-pulse-glow"
              >
                {LANDING_STRINGS.HERO_BUTTON}
              </motion.button>
            </Link>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>{LANDING_STRINGS.HERO_PRICE_NOTE}</p>
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

      {/* Theme runway */}
      <section className="px-6 py-16">
        <div className="vc-container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="vc-section-copy vc-section-copy--center"
          >
            <span className="vc-eyebrow">Mood before message</span>
            <h2>Themes that feel like scenes, not skins.</h2>
            <p>
              Every visual direction changes the envelope, surface, glow, typography, and emotional tone.
              The card feels personal before the first sentence is read.
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
                <div className="vc-theme-card__image" style={{ backgroundImage: `url(${theme.image})` }} />
                <div className="vc-theme-card__body">
                  <h3>{theme.name}</h3>
                  <p>{theme.mood}</p>
                  <div className="vc-swatch-row" aria-hidden>
                    {theme.colors.map((color) => (
                      <span key={color} style={{ background: color }} />
                    ))}
                  </div>
                </div>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Experience stack */}
      <section className="px-6 py-14">
        <div className="vc-container vc-experience-grid">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="vc-section-copy"
          >
            <span className="vc-eyebrow">Built to feel expensive</span>
            <h2>Not another e-card. A tiny emotional product.</h2>
            <p>
              Competitors stop at templates or videos. VibeCheck combines the thrill of opening,
              the privacy of a secret gate, and the feedback loop creators actually care about.
            </p>
          </motion.div>

          <div className="vc-stack-panel" aria-label="VibeCheck experience stack">
            {EXPERIENCE_STACK.map((item, index) => (
              <motion.div
                key={item.label}
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

      {/* Emotional flow */}
      <section className="px-6 py-16">
        <div className="vc-container vc-flow-stage">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="vc-section-copy"
          >
            <span className="vc-eyebrow">The product loop</span>
            <h2>A card that behaves like a story.</h2>
          </motion.div>

          <div className="vc-flow-grid">
            {FLOW_ACTS.map((item, index) => (
              <motion.article
                key={item.title}
                initial={{ opacity: 0, y: 22 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="vc-flow-card"
              >
                <span>{item.act}</span>
                <h3>{item.title}</h3>
                <p>{item.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* Live Simulator */}
      <section className="px-6 py-12 max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.7 }}
        >
          <div className="text-center mb-8">
            <h2 className="text-2xl md:text-3xl font-bold mb-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
              {LANDING_STRINGS.SIMULATOR_TITLE}
            </h2>
            <p className="text-sm" style={{ color: 'var(--text3)' }}>{LANDING_STRINGS.SIMULATOR_SUBTITLE}</p>
          </div>
          <LiveSimulator />
        </motion.div>
      </section>

      {/* Competitive edge */}
      <section className="vc-band px-6 py-16">
        <div className="vc-container">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="vc-section-copy vc-section-copy--center"
          >
            <span className="vc-eyebrow">Why people share it</span>
            <h2>Designed for the moment after they open it.</h2>
            <p>
              The product is not just card creation. It is anticipation, reveal, reaction, and the follow-up.
            </p>
          </motion.div>

          <div className="vc-edge-grid">
            {MARKET_EDGES.map((edge, index) => (
              <motion.article
                key={edge.title}
                initial={{ opacity: 0, y: 18 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.08 }}
                className="vc-edge-card"
              >
                <span>{String(index + 1).padStart(2, '0')}</span>
                <h3>{edge.title}</h3>
                <p>{edge.body}</p>
              </motion.article>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="px-6 py-12 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-10"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            {LANDING_STRINGS.HOW_IT_WORKS_TITLE}
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {LANDING_STRINGS.HOW_IT_WORKS_STEPS.map((step, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                className="rounded-2xl p-6 text-center relative glass glow-border"
                style={{ background: 'var(--surface)' }}
              >
                <div className="text-4xl mb-4">{step.icon}</div>
                <div
                  className="absolute -top-3 -right-3 w-7 h-7 rounded-full flex items-center justify-center text-xs font-black text-white"
                  style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}
                >
                  {i + 1}
                </div>
                <h3 className="font-bold mb-2" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>{step.title}</h3>
                <p className="text-sm" style={{ color: 'var(--text3)' }}>{step.desc}</p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* Pricing */}
      <section className="px-6 py-12 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          <h2 className="text-2xl md:text-3xl font-bold text-center mb-3"
            style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>
            {LANDING_STRINGS.PRICING_TITLE}
          </h2>
          <p className="text-center text-sm mb-10" style={{ color: 'var(--text3)' }}>
            {LANDING_STRINGS.PRICING_SUBTITLE}
          </p>
          <div className="grid md:grid-cols-3 gap-5">
            {TIERS.map((tier, i) => (
              <motion.div
                key={tier.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 }}
                whileHover={{ scale: 1.03, y: -4 }}
                className={`rounded-2xl p-6 relative transition-all ${tier.popular ? 'tier-popular' : 'theme-surface'}`}
              >
                {tier.popular && (
                  <div
                    className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-xs font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}
                  >
                    🔥 Most Popular
                  </div>
                )}
                <div className="text-3xl mb-3">{tier.icon}</div>
                <div className="text-3xl font-black mb-1" style={{ color: 'var(--text)' }}>₹{tier.price}</div>
                <div className="text-sm font-semibold mb-1" style={{ color: 'var(--accent)' }}>{tier.duration}</div>
                <div className="text-sm mb-4" style={{ color: 'var(--text3)' }}>{tier.description}</div>
                <ul className="vc-tier-list">
                  <li>Interactive reveal</li>
                  <li>Tracker + replies</li>
              <li>High-conversion share link</li>
                </ul>
                <Link href={`/customize?tier=${tier.id}`}>
                  <motion.button
                    whileTap={{ scale: 0.96 }}
                    className="w-full py-2.5 rounded-xl font-bold text-sm"
                    style={{
                      background: tier.popular
                        ? 'linear-gradient(135deg, var(--accent), var(--accent2))'
                        : 'var(--surface2)',
                      color: tier.popular ? 'white' : 'var(--text)',
                      border: tier.popular ? 'none' : '1px solid var(--border)',
                    }}
                  >
                    Get Started →
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
            animate={{ x: [0, '-50%'] }}
            transition={{ repeat: Infinity, duration: 28, ease: 'linear' }}
          >
            {[...LANDING_STRINGS.TESTIMONIALS, ...LANDING_STRINGS.TESTIMONIALS].map((t, i) => (
              <div
                key={i}
                className="inline-flex flex-col gap-1 px-5 py-4 rounded-2xl shrink-0"
                style={{ background: 'var(--surface)', border: '1px solid var(--border)', minWidth: 220, maxWidth: 260 }}
              >
                <p className="text-sm whitespace-normal" style={{ color: 'var(--text)' }}>{t.text}</p>
                <p className="text-xs" style={{ color: 'var(--accent)' }}>{t.handle}</p>
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
          <h2 className="text-3xl md:text-5xl font-black mb-4" style={{ fontFamily: 'var(--font-display)', color: 'var(--text)' }}>
            {LANDING_STRINGS.CTA_TITLE}
          </h2>
          <p className="text-base mb-8 max-w-md mx-auto" style={{ color: 'var(--text3)' }}>
            {LANDING_STRINGS.CTA_SUBTITLE}
          </p>
          <Link href="/customize">
            <motion.button
              whileHover={{ scale: 1.06, boxShadow: '0 30px 80px var(--glow)' }}
              whileTap={{ scale: 0.96 }}
              className="theme-btn px-10 py-5 rounded-2xl text-xl font-black text-white"
            >
              {LANDING_STRINGS.CTA_BUTTON}
            </motion.button>
          </Link>
        </motion.div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-8 text-center border-t" style={{ borderColor: 'var(--border)' }}>
        <p className="text-sm" style={{ color: 'var(--text3)' }}>
          {LANDING_STRINGS.FOOTER_TEXT}<a href={`mailto:${LANDING_STRINGS.FOOTER_EMAIL}`} style={{ color: 'var(--accent)' }}>{LANDING_STRINGS.FOOTER_EMAIL}</a>
        </p>
      </footer>
    </main>
  );
}
