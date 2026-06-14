'use client';
import { motion } from 'framer-motion';
import Link from 'next/link';
import LiveSimulator from '@/components/LiveSimulator';
import AmbientBackground from '@/components/AmbientBackground';
import { TIERS } from '@/lib/themes';
import { LANDING_STRINGS } from '@/lib/strings';



export default function LandingPage() {
  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>
      <AmbientBackground />

      {/* Nav */}
      <nav className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between"
        style={{ background: 'rgba(11,15,25,0.8)', backdropFilter: 'blur(20px)', borderBottom: '1px solid var(--border)' }}>
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
      <section className="relative px-6 pt-16 pb-8 text-center max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-semibold mb-6"
            style={{ background: 'rgba(255,46,147,0.15)', border: '1px solid rgba(255,46,147,0.3)', color: 'var(--accent)' }}>
            {LANDING_STRINGS.HERO_BADGE}
          </div>

          <h1
            className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight capitalize tracking-tighter drop-shadow-2xl"
            style={{
              fontFamily: 'var(--font-display)',
              filter: 'drop-shadow(0px 10px 20px rgba(0,0,0,0.5))'
            }}
          >
            <span className="gradient-text">Send Vibes,</span><br /><span className="gradient-text">Not Texts</span> 💌
          </h1>

          <p className="text-base md:text-xl mb-8 max-w-2xl mx-auto leading-relaxed" style={{ color: 'var(--text3)' }}>
            {LANDING_STRINGS.HERO_SUBTITLE}
          </p>

          <div className="relative mx-auto mb-10 max-w-lg hidden md:block">
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 5, ease: "easeInOut" }}
              className="rounded-[2.5rem] overflow-hidden shadow-[0_20px_60px_var(--glow)] border border-white/10"
            >
               {/* eslint-disable-next-line @next/next/no-img-element */}
               <img src="/images/hero_image.png" alt="Hero" className="w-full object-cover" />
            </motion.div>
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

      {/* Removed Viral Features as per user request */}

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
