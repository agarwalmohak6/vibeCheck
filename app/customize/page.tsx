'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { THEMES, TEMPLATE_TYPES, TIERS, ThemeId } from '@/lib/themes';
import GiphyModal from '@/components/GiphyModal';
import SuccessHub from '@/components/SuccessHub';
import MusicSelector from '@/components/MusicSelector';
import QRCheckout from '@/components/QRCheckout';
import { compressImage } from '@/lib/imageCompressor';
import { isMobileDevice, buildUpiIntent } from '@/lib/upi';
import HeartCanvas from '@/components/HeartCanvas';
import AmbientBackground from '@/components/AmbientBackground';

interface FormData {
  recipientName: string;
  creatorName: string;
  templateType: string;
  theme: ThemeId;
  messageTitle: string;
  mainBody: string;
  musicTrackId: string;
  gifUrl: string;
  coverImageUrl: string;
  hasSecretCode: boolean;
  unlockCode: string;
  unlockQuestion: string;
  useCustomQuestion: boolean;
  tierId: string;
  yesBtnText: string;
  noBtnText: string;
  customMusicUrl: string;
}

type Notice = {
  tone: 'error' | 'success' | 'info';
  message: string;
};

const STEPS = ['basics', 'theme', 'content', 'lock', 'payment'];
const STEP_LABELS = ['Basics', 'Theme', 'Content', 'Lock', 'Payment'];

function CustomizePageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { setTheme } = useTheme();

  const [step, setStep] = useState(0);
  const initialTemplate = params.get('type') || 'shoot_shot';
  const initialTmplMeta = TEMPLATE_TYPES.find(t => t.id === initialTemplate);
  const [form, setForm] = useState<FormData>({
    recipientName: '',
    creatorName: '',
    templateType: initialTemplate,
    theme: 'midnight_romance',
    messageTitle: '',
    mainBody: '',
    musicTrackId: 'rom_tum_hi_ho', // default track
    gifUrl: '',
    coverImageUrl: TEMPLATE_TYPES.find(t => t.id === 'shoot_shot')?.defaultCoverImage || '',
    hasSecretCode: false,
    unlockCode: '',
    unlockQuestion: '',
    useCustomQuestion: false,
    tierId: params.get('tier') || '3_day',
    yesBtnText: initialTmplMeta?.defaultYesText || 'YES 💖',
    noBtnText: initialTmplMeta?.defaultNoText || 'No 💔',
    customMusicUrl: '',
  });

  const [showGiphy, setShowGiphy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [createdCardId, setCreatedCardId] = useState<string | null>(null);
  const [creatorToken, setCreatorToken] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const allowMockPayments = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS !== 'false';

  // Check device type on mount
  useEffect(() => {
    setTimeout(() => setIsMobile(isMobileDevice()), 0);
  }, []);

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm(p => ({ ...p, [k]: v }));

  const handleThemeChange = (t: ThemeId, coverImage: string) => {
    set('theme', t);
    set('coverImageUrl', coverImage);
    setTheme(t);
  };

  const handleTemplateChange = (templateId: string) => {
    const tmpl = TEMPLATE_TYPES.find(t => t.id === templateId);
    set('templateType', templateId);
    if (tmpl) {
      // Auto-apply the template's default cover image
      set('coverImageUrl', tmpl.defaultCoverImage);
      // Auto-apply the recommended theme
      handleThemeChange(tmpl.recommendedTheme, THEMES.find(t => t.id === tmpl.recommendedTheme)?.coverImage || '');
      // Auto-apply default button texts
      set('yesBtnText', tmpl.defaultYesText);
      set('noBtnText', tmpl.defaultNoText);
    }
  };

  const applyPreset = (preset: { title: string; body: string }) => {
    set('messageTitle', preset.title);
    set('mainBody', preset.body);
  };

  const selectedTier = TIERS.find(t => t.id === form.tierId)!;

  // Compress image on select
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsCompressing(true);
    setNotice(null);
    try {
      const result = await compressImage(file);
      set('coverImageUrl', result.dataUrl); // store base64 in coverImageUrl
    } catch (err) {
      console.error(err);
      setNotice({
        tone: 'error',
        message: 'That photo is too heavy for a smooth card. Try a smaller image or screenshot.',
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async () => {
    if (!form.recipientName || !form.creatorName) return;
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_name: form.recipientName,
          creator_name: form.creatorName,
          template_type: form.templateType,
          theme_selected: form.theme,
          tier_selected: form.tierId,
          music_track_id: form.musicTrackId,
          card_data: {
            message_title: form.messageTitle || `A message from ${form.creatorName}`,
            main_body: form.mainBody || "Tap YES to accept!",
            gif_url: form.gifUrl,
            cover_image_url: form.coverImageUrl,
            unlock_code: form.hasSecretCode ? form.unlockCode : '',
            unlock_question: form.hasSecretCode && form.useCustomQuestion ? form.unlockQuestion : '',
            yes_btn_text: form.yesBtnText,
            no_btn_text: form.noBtnText,
            music_url: form.customMusicUrl || undefined,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setCreatedCardId(data.id);
        if (data.creator_token) {
          setCreatorToken(data.creator_token);
          localStorage.setItem(`creator_token_${data.id}`, data.creator_token);
        }
        // Identify this browser as the creator of the card
        localStorage.setItem(`creator_of_${data.id}`, 'true');
        setPaymentStep(true);
      } else {
        setNotice({
          tone: 'error',
          message: data.error || 'We could not create the card yet. Check the required fields and try again.',
        });
      }
    } catch {
      setNotice({
        tone: 'error',
        message: 'Network hiccup. Your design is still here, so try again in a moment.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleMobilePaymentTrigger = async () => {
    if (!createdCardId) return;

    // Auto pay simulator webhook triggers 2s later
    const vpa = process.env.NEXT_PUBLIC_UPI_VPA || 'vibecheck@upi';
    const txnId = createdCardId.replace(/-/g, '').substring(0, 32);
    const payeeName = "VibeCheck";
    const upiLink = buildUpiIntent(vpa, payeeName, txnId, selectedTier.price);

    // Open UPI deep link
    window.location.href = upiLink;

    // Start checking for payment webhook success
    setLoading(true);
  };

  // Poll for mobile payment verification if loading
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (loading && createdCardId && isMobile) {
      interval = setInterval(async () => {
        try {
          const res = await fetch(`/api/cards?id=${createdCardId}&status=payment`);
          if (res.ok) {
            const card = await res.json();
            if (card.is_paid) {
              setIsPaid(true);
              setLoading(false);
            }
          }
        } catch (e) {
          console.warn(e);
        }
      }, 2500);
    }
    return () => clearInterval(interval);
  }, [loading, createdCardId, isMobile]);

  // Handle mock trigger on mobile viewport
  const handleMobileMockSuccess = async () => {
    if (!createdCardId) return;
    setLoading(true);
    try {
      await fetch('/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vibecheck-mock-payment': 'true' },
        body: JSON.stringify({
          card_id: createdCardId,
          payment_id: `mock_mobile_${Date.now()}`,
          status: 'success'
        }),
      });
    } catch (e) {
      console.error(e);
    }
  };

  // ── Success phase ───────────────────────────────────
  if (isPaid && createdCardId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <AmbientBackground />
        <SuccessHub
          cardId={createdCardId}
          recipientName={form.recipientName}
          creatorName={form.creatorName}
          creatorToken={creatorToken || localStorage.getItem(`creator_token_${createdCardId}`) || undefined}
        />
      </main>
    );
  }

  // ── Mobile Payment Screen ────────────────────────────
  if (paymentStep && createdCardId && isMobile && !isPaid) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6" style={{ background: 'var(--bg)' }}>
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <div className="space-y-2">
          <span className="text-5xl">📱</span>
          <h2 className="text-2xl font-black text-white font-serif">Complete Payment</h2>
          <p className="text-sm text-neutral-200">Launch any UPI app to pay ₹{selectedTier.price}</p>
        </div>

        <div className="w-full max-w-sm space-y-3">
          <button
            onClick={handleMobilePaymentTrigger}
            disabled={loading}
            className="w-full bg-linear-to-r from-pink-500 to-purple-600 hover:scale-102 active:scale-98 text-white font-bold py-4 px-6 rounded-2xl text-base shadow-xl transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <span>⚡</span>
            <span>{loading ? 'Waiting for App...' : 'Pay via UPI App'}</span>
          </button>

          {allowMockPayments && (
            <button
              onClick={handleMobileMockSuccess}
              className="w-full bg-white/8 border border-white/15 hover:bg-white/12 text-neutral-100 font-bold py-3 px-6 rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Simulate Mock Success Payment 🛠️
            </button>
          )}

          <button
            onClick={() => setIsPaid(true)}
            className="w-full bg-white/12 border border-white/20 hover:bg-white/18 text-white font-bold py-3 px-6 rounded-2xl text-xs tracking-wide transition-colors cursor-pointer shadow-lg shadow-black/20"
          >
            Bypass payment locally
          </button>
        </div>

        {loading && (
          <div className="flex flex-col items-center gap-2 mt-4">
            <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} className="text-xl">🌀</motion.div>
            <p className="text-xs text-neutral-200">Waiting for payment confirmation from bank...</p>
          </div>
        )}
      </main>
    );
  }

  // ── Desktop Payment Screen ────────────────────────────
  if (paymentStep && createdCardId && !isMobile && !isPaid) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 relative" style={{ background: 'var(--bg)' }}>
        <div className="w-full max-w-5xl flex flex-col items-center gap-4">
          <QRCheckout
            cardId={createdCardId}
            amount={selectedTier.price}
            onPaid={() => setIsPaid(true)}
          />
          <div className="flex flex-col items-center gap-2">
            <button
              onClick={() => setIsPaid(true)}
              className="px-5 py-2.5 rounded-full text-xs font-black tracking-wide text-white border border-white/20 bg-white/12 hover:bg-white/18 transition-colors cursor-pointer shadow-lg shadow-black/20"
            >
              Bypass payment locally
            </button>
            <p className="text-[11px] text-neutral-300">Use this only for local testing.</p>
          </div>
        </div>
      </main>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="flex flex-col gap-5">
          <h2 className="text-3xl font-black capitalize tracking-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Start with the people 📝</h2>
          {[
            { label: "Your name", key: 'creatorName' as keyof FormData, placeholder: 'Aarav' },
            { label: "Their name", key: 'recipientName' as keyof FormData, placeholder: 'Priya' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>{f.label}</label>
              <input
                value={form[f.key] as string}
                onChange={e => set(f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: 'var(--text)' }}
              />
            </div>
          ))}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>Card type</label>
            <div className="grid grid-cols-2 gap-2">
              {TEMPLATE_TYPES.map(t => (
                <motion.button key={t.id} whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => handleTemplateChange(t.id)}
                  className="py-2.5 px-3 rounded-xl text-sm font-medium text-left cursor-pointer"
                  style={{
                    background: form.templateType === t.id ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'rgba(255,255,255,0.06)',
                    color: form.templateType === t.id ? 'white' : 'var(--text2)',
                    border: form.templateType === t.id ? 'none' : '1px solid rgba(255,255,255,0.15)',
                  }}>
                  {t.label}
                </motion.button>
              ))}
            </div>
          </div>
        </div>
      );

      case 1: return (
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-black capitalize tracking-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Choose the mood 🎨</h2>
          {THEMES.map(t => (
            <motion.button key={t.id} whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => handleThemeChange(t.id as ThemeId, t.coverImage)}
              className="flex items-center gap-4 p-4 rounded-2xl text-left cursor-pointer w-full"
              style={{
                background: form.theme === t.id ? 'rgba(255,255,255,0.06)' : 'var(--surface)',
                border: form.theme === t.id ? '2px solid var(--accent)' : '1px solid var(--border)',
                boxShadow: form.theme === t.id ? '0 0 20px var(--glow)' : 'none',
              }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl shrink-0"
                style={{ background: t.preview.bg, border: `2px solid ${t.preview.accent}` }}>
                {t.emoji}
              </div>
              <div className="flex-1">
                <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>{t.label}</p>
                <p className="text-xs" style={{ color: 'var(--text2)' }}>{t.description}</p>
              </div>
              {form.theme === t.id && <span className="text-lg">✅</span>}
            </motion.button>
          ))}
        </div>
      );

      case 2: return (
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-black capitalize tracking-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Write the message ✍️</h2>
          {/* Message Style Presets */}
          {(() => {
            const tmpl = TEMPLATE_TYPES.find(t => t.id === form.templateType);
            if (!tmpl?.messagePresets?.length) return null;
            return (
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>⚡ Quick starters — tap to auto-fill</label>
                <div className="flex flex-col gap-2">
                  {tmpl.messagePresets.map((preset, i) => (
                    <motion.button
                      key={i}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => applyPreset(preset)}
                      className="w-full text-left px-4 py-3 rounded-xl text-sm font-medium cursor-pointer transition-all"
                      style={{
                        background: 'rgba(255,255,255,0.06)',
                        border: '1px solid rgba(255,255,255,0.16)',
                        color: 'var(--text2)',
                      }}
                    >
                      <span className="font-bold block" style={{ color: 'var(--accent)' }}>{preset.style}</span>
                      <span className="text-xs opacity-95 block mt-0.5 truncate">{preset.title}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })()}

          {[
            { label: 'Card headline', key: 'messageTitle' as keyof FormData, placeholder: "okay I'm down bad 💀", multi: false },
            { label: 'Your message', key: 'mainBody' as keyof FormData, placeholder: 'Write what your heart wants to say...', multi: true },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>{f.label}</label>
              {f.multi ? (
                <textarea rows={4} value={form[f.key] as string}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm resize-none"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: 'var(--text)' }} />
              ) : (
                <input value={form[f.key] as string}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: 'var(--text)' }} />
              )}
            </div>
          ))}



          {/* Custom Action Buttons */}
          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl bg-neutral-900/30 border border-white/5">
            <div>
              <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--text2)' }}>💚 Positive Response Button</label>
              <input
                value={form.yesBtnText}
                onChange={e => set('yesBtnText', e.target.value)}
                placeholder="e.g. YES 💖"
                className="w-full px-3 py-2 rounded-lg outline-none text-xs"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: 'var(--text)' }}
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--text2)' }}>💔 Negative Response Button</label>
              <input
                value={form.noBtnText}
                onChange={e => set('noBtnText', e.target.value)}
                placeholder="e.g. No 💔"
                className="w-full px-3 py-2 rounded-lg outline-none text-xs"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: 'var(--text)' }}
              />
            </div>
          </div>

          {/* Music Selector component instead of raw link */}
          <div className="space-y-2">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>🎵 Background music</label>
            <MusicSelector
              selectedTrackId={form.musicTrackId}
              onSelectTrack={(trackId) => set('musicTrackId', trackId)}
            />
            <div className="pt-1">
              <label className="block text-[10px] font-bold mb-1" style={{ color: 'var(--text2)' }}>Or paste a custom song link</label>
              <input
                value={form.customMusicUrl}
                onChange={e => set('customMusicUrl', e.target.value)}
                placeholder="e.g. https://open.spotify.com/track/..."
                className="w-full px-3 py-2 rounded-lg outline-none text-xs"
                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: 'var(--text)' }}
              />
            </div>
          </div>

          {/* Cover image file input with canvas compression */}
          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>🖼️ Cover photo</label>
            {form.coverImageUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ height: 160 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.coverImageUrl} alt="Cover" className="w-full h-full object-cover" />
                <button
                  type="button"
                  onClick={() => set('coverImageUrl', '')}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-black/80 hover:bg-black text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload-input"
                  disabled={isCompressing}
                />
                <label
                  htmlFor="image-upload-input"
                  className={`w-full py-6 rounded-xl text-sm font-medium border-2 border-dashed flex flex-col items-center justify-center gap-1.5 cursor-pointer transition-colors ${
                    isCompressing
                      ? 'border-neutral-800 bg-neutral-900/20 text-neutral-500 cursor-not-allowed'
                      : 'border-white/10 hover:border-white/20 bg-neutral-900/40 text-neutral-400 hover:text-white'
                  }`}
                >
                  {isCompressing ? (
                    <>
                      <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-xl">🌀</motion.span>
                      <span>Preparing photo for fast delivery...</span>
                    </>
                  ) : (
                    <>
                      <span className="text-2xl">📸</span>
                      <span>Upload photo</span>
                      <span className="text-[10px] text-neutral-500 font-medium">Optimized locally for faster loading</span>
                    </>
                  )}
                </label>
              </div>
            )}
          </div>

          {/* Giphy */}
          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>🎬 GIF (optional)</label>
            {form.gifUrl ? (
              <div className="relative rounded-xl overflow-hidden border border-white/10" style={{ height: 120 }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={form.gifUrl} alt="GIF" className="w-full h-full object-cover animate-pulse" />
                <button
                  type="button"
                  onClick={() => set('gifUrl', '')}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-black/80 hover:bg-black text-white cursor-pointer"
                >
                  ✕
                </button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setShowGiphy(true)}
                className="w-full py-3 rounded-xl text-sm font-medium bg-neutral-900/40 border-2 border-dashed border-white/15 hover:border-white/25 text-neutral-200 hover:text-white cursor-pointer"
              >
                🔍 Search GIFs
              </motion.button>
            )}
          </div>
        </div>
      );

      case 3: return (
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-black capitalize tracking-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Add a private gate 🔐</h2>
          <div className="flex items-center justify-between p-4 rounded-2xl bg-neutral-900/40 border border-white/10">
            <div>
              <p className="font-medium text-sm text-white">Make it private</p>
              <p className="text-xs text-neutral-200">Only the right person can open it</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.9 }}
              type="button"
              onClick={() => set('hasSecretCode', !form.hasSecretCode)}
              className="w-12 h-6 rounded-full relative cursor-pointer"
              style={{ background: form.hasSecretCode ? 'var(--accent)' : 'var(--surface2)' }}
            >
              <motion.div animate={{ x: form.hasSecretCode ? 24 : 2 }}
                className="absolute top-1 w-4 h-4 rounded-full bg-white" />
            </motion.button>
          </div>
          <AnimatePresence>
            {form.hasSecretCode && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }} className="flex flex-col gap-3 overflow-hidden">
                <div className="flex gap-2">
                  {[false, true].map(isQ => (
                    <button
                      key={String(isQ)}
                      type="button"
                      onClick={() => set('useCustomQuestion', isQ)}
                      className="flex-1 py-2 rounded-xl text-sm font-medium cursor-pointer"
                      style={{
                        background: form.useCustomQuestion === isQ ? 'linear-gradient(135deg, var(--accent), var(--accent2))' : 'rgba(255,255,255,0.06)',
                        color: form.useCustomQuestion === isQ ? 'white' : 'var(--text2)',
                        border: form.useCustomQuestion === isQ ? 'none' : '1px solid rgba(255,255,255,0.16)',
                      }}
                    >
                      {isQ ? '💬 Custom question' : '🔢 4-digit code'}
                    </button>
                  ))}
                </div>
                {form.useCustomQuestion && (
                  <input value={form.unlockQuestion} onChange={e => set('unlockQuestion', e.target.value)}
                  placeholder='e.g. What do you call me?'
                    className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                    style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: 'var(--text)' }} />
                )}
                <input value={form.unlockCode}
                  onChange={e => set('unlockCode', form.useCustomQuestion ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder={form.useCustomQuestion ? 'Expected answer...' : '4-digit code (e.g. 2004)'}
                  className="w-full px-4 py-3 rounded-xl outline-none text-sm"
                  style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.16)', color: 'var(--text)' }} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );

      case 4: return (
        <div className="flex flex-col gap-4">
          <h2 className="text-3xl font-black capitalize tracking-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Choose your plan 💳</h2>
          {TIERS.map(t => (
            <motion.button key={t.id} whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => set('tierId', t.id)}
              className={`p-5 rounded-2xl text-left cursor-pointer w-full relative overflow-hidden ${t.popular && form.tierId === t.id ? 'tier-popular' : ''}`}
              style={{
                background: form.tierId === t.id ? 'rgba(255,255,255,0.08)' : 'rgba(255,255,255,0.05)',
                border: form.tierId === t.id ? '2px solid var(--accent)' : '1px solid rgba(255,255,255,0.14)',
                boxShadow: form.tierId === t.id ? '0 0 20px var(--glow)' : 'none',
              }}
            >
              <div className="flex items-center justify-between mb-1 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.icon}</span>
                  <span className="font-bold text-sm text-white">{t.label}</span>
                  {t.popular && <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold text-black bg-yellow-400">🔥 POPULAR</span>}
                </div>
                <span className="text-xl font-black text-white">₹{t.price}</span>
              </div>
              <p className="text-xs text-neutral-200 relative z-10 mt-1">{t.duration} · {t.description}</p>
            </motion.button>
          ))}
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={loading || !form.recipientName || !form.creatorName}
            whileHover={{ scale: 1.02, boxShadow: '0 20px 60px var(--glow)' }}
            whileTap={{ scale: 0.96 }}
            className="w-full py-4 rounded-2xl text-lg font-black text-white mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              boxShadow: '0 8px 30px var(--glow)',
            }}
          >
            {loading ? '⏳ Generating Link...' : `Pay ₹${selectedTier?.price || 49} & Send Magic ✨`}
          </motion.button>
            <p className="text-xs text-center text-neutral-300 font-medium leading-relaxed">
              Secure payment · UPI deep links / QR codes accepted · Instant confirmation
            </p>
        </div>
      );

      default: return null;
    }
  };

  return (
    <main className="min-h-screen" style={{ background: 'var(--bg)' }}>

      {/* Soft Coquette background canvas */}
      {form.theme === 'soft_coquette' && <HeartCanvas />}

      <AmbientBackground />

      <AnimatePresence>
        {notice && (
          <motion.div
            role={notice.tone === 'error' ? 'alert' : 'status'}
            initial={{ opacity: 0, y: -18, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 360, damping: 28 }}
            className={`vc-form-notice vc-form-notice--${notice.tone}`}
          >
            <span>{notice.message}</span>
            <button type="button" aria-label="Dismiss notification" onClick={() => setNotice(null)}>×</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Navigation */}
      <nav className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b"
        style={{ background: 'rgba(11,15,25,0.85)', backdropFilter: 'blur(20px)', borderColor: 'var(--border)' }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-lg text-neutral-400 hover:text-white cursor-pointer select-none">←</button>
          <span className="text-lg font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>VibeCheck 🎴</span>
        </div>

        {/* Stepper headers */}
        <div className="hidden md:flex gap-1.5">
          {STEP_LABELS.map((label, idx) => {
            const isActive = step === idx;
            return (
              <button
                key={idx}
                onClick={() => setStep(idx)}
                className={`px-3 py-1 rounded-full text-xs font-bold select-none cursor-pointer transition-all duration-200 ${
                  isActive
                    ? 'bg-linear-to-r from-pink-500 to-purple-600 text-white shadow-lg'
                    : 'bg-neutral-900 border border-white/5 text-neutral-400 hover:text-white'
                }`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main layout container (2 Columns on large screen, 1 Column on mobile) */}
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-8 relative z-10">

        {/* Column 1: Customizer Form */}
        <div className="space-y-6">
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full" style={{ background: 'var(--surface2)' }}>
            <motion.div className="h-full rounded-full"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent2))' }} />
          </div>

          <div className="bg-neutral-950/40 backdrop-blur rounded-3xl p-6 border border-white/5 shadow-2xl relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Back / Next Buttons */}
            <div className="flex gap-3 mt-8 pt-4 border-t border-white/5">
              {step > 0 && (
                <button
                  onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-3.5 rounded-xl font-extrabold text-sm bg-neutral-900 hover:bg-neutral-800 text-neutral-300 border border-white/10 transition-colors cursor-pointer select-none"
                >
                  ← Back
                </button>
              )}
              {step < STEPS.length - 1 && (
                <button
                  onClick={() => setStep(s => s + 1)}
                  className="flex-1 py-3.5 rounded-xl font-extrabold text-sm text-white bg-linear-to-r from-pink-500 to-purple-600 hover:opacity-95 shadow-xl transition-all cursor-pointer select-none"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Sticky Live Preview Mirror */}
        <div className="hidden lg:block">
          <div className="sticky top-24 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Live Simulator Preview</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full animate-pulse">AUTOSAVING</span>
            </div>

            {/* Mock Viewport Container */}
            <div
              className="w-full max-w-sm mx-auto aspect-9/16 rounded-[36px] border-8 border-neutral-900 shadow-2xl overflow-y-auto no-scrollbar relative flex flex-col justify-between p-4"
              style={{ background: 'var(--bg)' }}
              data-theme={form.theme}
            >
              {/* Phone Status Notch */}
              <div className="absolute top-0 inset-x-0 h-4 flex justify-between items-center px-6 text-[9px] font-mono text-neutral-500 pointer-events-none z-30">
                <span>9:41</span>
                <div className="w-16 h-3.5 bg-black rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0"></div>
                <div className="flex gap-1">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>

              {/* Live Card Content Preview */}
              <div className="pt-6 pb-4 flex flex-col gap-4 w-full">

                {/* Creator Badge */}
                <div className="text-center mt-2">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}
                  >
                    <span>💍</span>
                    <span>from {form.creatorName || 'Aarav'}</span>
                  </div>
                </div>

                {/* Uploaded Cover Image preview */}
                {form.coverImageUrl && (
                  <div className="rounded-2xl overflow-hidden border border-white/5 bg-black/20 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.coverImageUrl}
                      alt="Cover Preview"
                      className="w-full h-auto max-h-[350px] object-contain rounded-2xl mx-auto block"
                      draggable={false}
                    />
                  </div>
                )}

                {/* Main Message Display */}
                <div
                  className="rounded-2xl p-4 border shadow-md space-y-2 text-left glow-border"
                  style={{ background: 'var(--surface)' }}
                >
                  <h3
                    className="text-2xl font-black mb-2 capitalize tracking-tight drop-shadow-md"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--accent)',
                    }}
                  >
                    {form.messageTitle || "headline preview"}
                  </h3>
                  <p
                    className="text-xs leading-relaxed font-medium first-letter:uppercase first-letter:text-lg first-letter:font-bold"
                    style={{ color: 'var(--text2)' }}
                  >
                    {form.mainBody || "Your main message contents will render live in this card container."}
                  </p>
                </div>

                {/* Custom GIF preview */}
                {form.gifUrl && (
                  <div className="rounded-xl overflow-hidden border border-white/5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.gifUrl}
                      alt="GIF Preview"
                      className="w-full object-cover"
                      draggable={false}
                    />
                  </div>
                )}

                {/* Runaway buttons mock */}
                {TEMPLATE_TYPES.find(t => t.id === form.templateType)?.hasRunaway && (
                  <div
                    className="rounded-2xl p-4 border space-y-3 text-center"
                    style={{ background: 'var(--surface)', borderColor: 'var(--border)' }}
                  >
                    <p className="text-[10px] font-bold text-white">So... what do you say? 👀</p>
                    <div className="flex gap-2 justify-center">
                      <button className="theme-btn px-4 py-2 rounded-xl text-xs font-bold cursor-not-allowed">{form.yesBtnText || 'YES 💖'}</button>
                      <button className="px-4 py-2 rounded-xl text-xs font-bold border border-white/10 text-neutral-400 bg-white/5 cursor-not-allowed">{form.noBtnText || 'No 💔'}</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Watermark brand overlay */}
              <div className="text-center py-2 border-t border-white/5 pointer-events-none mt-auto">
                <span className="text-[8px] text-neutral-500 uppercase tracking-widest">VibeCheck · Live Preview</span>
              </div>
            </div>
          </div>
        </div>

      </div>

      {showGiphy && (
        <GiphyModal
          onSelect={url => { set('gifUrl', url); setShowGiphy(false); }}
          onClose={() => setShowGiphy(false)}
        />
      )}
    </main>
  );
}

export default function CustomizePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white" style={{ background: 'var(--bg)' }}>Loading...</div>}>
      <CustomizePageContent />
    </Suspense>
  );
}
