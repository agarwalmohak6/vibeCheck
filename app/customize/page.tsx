'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { PRIMARY_TEMPLATE_TYPES, TEMPLATE_TYPES, TIERS, ThemeId } from '@/lib/themes';
import GiphyModal from '@/components/GiphyModal';
import SuccessHub from '@/components/SuccessHub';
import MusicSelector from '@/components/MusicSelector';
import QRCheckout from '@/components/QRCheckout';
import PaymentTestModeToggle from '@/components/PaymentTestModeToggle';
import { compressImage } from '@/lib/imageCompressor';
import { DEFAULT_UPI_VPA } from '@/lib/upi';
import HeartCanvas from '@/components/HeartCanvas';
import AmbientBackground from '@/components/AmbientBackground';

interface FormData {
  recipientName: string;
  creatorName: string;
  creatorEmail: string;
  creatorWhatsapp: string;
  templateType: string;
  theme: ThemeId;
  messageTitle: string;
  mainBody: string;
  musicTrackId: string;
  gifUrl: string;
  coverImageUrl: string;
  coverImageUrls: string[];
  hasSecretCode: boolean;
  unlockCode: string;
  unlockQuestion: string;
  useCustomQuestion: boolean;
  tierId: string;
  yesBtnText: string;
  noBtnText: string;
  selectedMusicUrl: string;
  musicLabel: string;
}

type Notice = {
  tone: 'error' | 'success' | 'info';
  message: string;
};

const STEPS = ['basics', 'content', 'lock', 'payment'];
const STEP_LABELS = ['Moment', 'Message', 'Privacy', 'Pay'];
const DEFAULT_TEMPLATE = 'bestie_check';
const DEFAULT_TIER = 'one_moment';
const ACTIVE_CHECKOUT_KEY = 'vibecheck_active_checkout';
const MAX_UPLOAD_IMAGES = 8;
const MIN_REVEAL_IMAGES = 3;

type CheckoutSession = {
  cardId: string;
  creatorToken?: string | null;
  recipientName?: string;
  creatorName?: string;
  creatorEmail?: string;
  creatorWhatsapp?: string;
  orderId?: string;
  tierId?: string;
  paid?: boolean;
  updatedAt?: string;
};

const CARD_DECOR: Record<string, string[]> = {
  maan_jao: ['🥺', '💌', '🧸', '🕊️'],
  birthday_roast: ['🎂', '🎉', '🎩', '🧸'],
  bestie_check: ['💗', '🙈', '✨', '💌'],
  shoot_shot: ['🤍', '💍', '✨', '💌'],
  netflix_chill: ['🍿', '🥤', '🎬', '✨'],
};

function formatPersonName(value: string, fallback = '') {
  const cleaned = value.trim().replace(/\s+/g, ' ');
  if (!cleaned) return fallback;

  return cleaned.replace(/[A-Za-zÀ-ÖØ-öø-ÿ]+/g, (part) =>
    part.charAt(0).toUpperCase() + part.slice(1).toLowerCase()
  );
}

function stripEmojiLabel(label: string) {
  return label.replace(/\s[^\s]*$/, '').trim();
}

function readCheckoutSession(): CheckoutSession | null {
  if (typeof window === 'undefined') return null;

  try {
    const raw = window.localStorage.getItem(ACTIVE_CHECKOUT_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CheckoutSession>;
    if (!parsed.cardId) return null;

    return {
      cardId: parsed.cardId,
      creatorToken: parsed.creatorToken || window.localStorage.getItem(`creator_token_${parsed.cardId}`),
      recipientName: parsed.recipientName || '',
      creatorName: parsed.creatorName || '',
      creatorEmail: parsed.creatorEmail || '',
      creatorWhatsapp: parsed.creatorWhatsapp || '',
      orderId: parsed.orderId || '',
      tierId: parsed.tierId || '',
      paid: Boolean(parsed.paid),
      updatedAt: parsed.updatedAt || '',
    };
  } catch {
    return null;
  }
}

function writeCheckoutSession(session: CheckoutSession) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(ACTIVE_CHECKOUT_KEY, JSON.stringify({
    ...session,
    updatedAt: new Date().toISOString(),
  }));

  if (session.creatorToken) {
    window.localStorage.setItem(`creator_token_${session.cardId}`, session.creatorToken);
  }
  window.localStorage.setItem(`creator_of_${session.cardId}`, 'true');
}

function getApiErrorMessage(data: unknown, fallback: string) {
  if (!data || typeof data !== 'object') return fallback;

  const response = data as {
    error?: unknown;
    issues?: {
      fieldErrors?: Record<string, unknown>;
      formErrors?: unknown[];
    };
  };
  const fieldErrors = response.issues?.fieldErrors
    ? Object.values(response.issues.fieldErrors).flat()
    : [];
  const firstFieldError = fieldErrors.find((message) => typeof message === 'string' && message);
  const firstFormError = response.issues?.formErrors?.find((message) => typeof message === 'string' && message);

  if (typeof response.error === 'string' && response.error !== 'Invalid card payload') return response.error;
  if (typeof firstFieldError === 'string') return firstFieldError;
  if (typeof firstFormError === 'string') return firstFormError;
  if (typeof response.error === 'string') return response.error;

  return fallback;
}

function CustomizePageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { setTheme } = useTheme();

  const [step, setStep] = useState(0);
  const requestedTemplate = params.get('type') || DEFAULT_TEMPLATE;
  const initialTemplate = PRIMARY_TEMPLATE_TYPES.some(t => t.id === requestedTemplate) ? requestedTemplate : DEFAULT_TEMPLATE;
  const initialTmplMeta = TEMPLATE_TYPES.find(t => t.id === initialTemplate);
  const requestedTier = params.get('tier') || DEFAULT_TIER;
  const initialTier = TIERS.some(t => t.id === requestedTier) ? requestedTier : DEFAULT_TIER;
  const [form, setForm] = useState<FormData>({
    recipientName: '',
    creatorName: '',
    creatorEmail: '',
    creatorWhatsapp: '',
    templateType: initialTemplate,
    theme: initialTmplMeta?.recommendedTheme || 'soft_coquette',
    messageTitle: initialTmplMeta?.messagePresets[0]?.title || '',
    mainBody: initialTmplMeta?.messagePresets[0]?.body || '',
    musicTrackId: '',
    gifUrl: '',
    coverImageUrl: '',
    coverImageUrls: [],
    hasSecretCode: false,
    unlockCode: '',
    unlockQuestion: '',
    useCustomQuestion: false,
    tierId: initialTier,
    yesBtnText: initialTmplMeta?.defaultYesText || 'YES 💖',
    noBtnText: initialTmplMeta?.defaultNoText || 'No 💔',
    selectedMusicUrl: '',
    musicLabel: '',
  });

  const [showGiphy, setShowGiphy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [createdCardId, setCreatedCardId] = useState<string | null>(null);
  const [creatorToken, setCreatorToken] = useState<string | null>(null);
  const [orderId, setOrderId] = useState<string>('');
  const [paymentStep, setPaymentStep] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const paymentVpa = (process.env.NEXT_PUBLIC_UPI_VPA || DEFAULT_UPI_VPA).trim();

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm(p => ({ ...p, [k]: v }));

  const handleTemplateChange = (templateId: string) => {
    const tmpl = TEMPLATE_TYPES.find(t => t.id === templateId);
    if (tmpl) {
      setForm(prev => ({
        ...prev,
        templateType: templateId,
        theme: tmpl.recommendedTheme,
        yesBtnText: tmpl.defaultYesText,
        noBtnText: tmpl.defaultNoText,
        messageTitle: tmpl.messagePresets[0]?.title || '',
        mainBody: tmpl.messagePresets[0]?.body || '',
      }));
      setTheme(tmpl.recommendedTheme);
    }
  };

  const applyPreset = (preset: { title: string; body: string }) => {
    set('messageTitle', preset.title);
    set('mainBody', preset.body);
  };

  const selectedTier = TIERS.find(t => t.id === form.tierId) || TIERS.find(t => t.id === DEFAULT_TIER) || TIERS[0];
  const selectedTemplate = TEMPLATE_TYPES.find(t => t.id === form.templateType) || initialTmplMeta || PRIMARY_TEMPLATE_TYPES[0];
  const previewTitle = form.messageTitle || selectedTemplate.messagePresets[0]?.title || selectedTemplate.label.replace(/\s[^\s]*$/, '');
  const previewBody = form.mainBody || selectedTemplate.messagePresets[0]?.body || selectedTemplate.builderHint;
  const displayRecipientName = formatPersonName(form.recipientName, 'Priya');
  const displayCreatorName = formatPersonName(form.creatorName, 'Aarav');
  const submitRecipientName = formatPersonName(form.recipientName);
  const submitCreatorName = formatPersonName(form.creatorName);
  const uploadedImages = form.coverImageUrls.filter((source) => source.trim());
  const primaryUploadedImage = uploadedImages[0] || '';
  const gifSearchTerms = selectedTemplate.gifSearchTerms?.length
    ? selectedTemplate.gifSearchTerms
    : [`${stripEmojiLabel(selectedTemplate.label)} reaction`];
  const rememberCheckout = (
    cardId: string,
    token: string | null | undefined,
    paid = false,
  ) => {
    const existing = readCheckoutSession();
    writeCheckoutSession({
      cardId,
      creatorToken: token || creatorToken || existing?.creatorToken || null,
      recipientName: submitRecipientName || displayRecipientName || existing?.recipientName || '',
      creatorName: submitCreatorName || displayCreatorName || existing?.creatorName || '',
      creatorEmail: form.creatorEmail.trim().toLowerCase() || existing?.creatorEmail || '',
      creatorWhatsapp: form.creatorWhatsapp.trim() || existing?.creatorWhatsapp || '',
      orderId: orderId || existing?.orderId || '',
      tierId: form.tierId || existing?.tierId || selectedTier.id,
      paid,
    });
  };

  const markCheckoutPaid = (cardId = createdCardId, token = creatorToken) => {
    if (cardId) rememberCheckout(cardId, token, true);
    setIsPaid(true);
    setPaymentStep(false);
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (params.get('new') === '1') {
        window.localStorage.removeItem(ACTIVE_CHECKOUT_KEY);
        return;
      }

      const stored = readCheckoutSession();
      if (!stored?.cardId || cancelled) return;

      // Recover the payment/result screen after a refresh.
      setCreatedCardId(stored.cardId);
      setCreatorToken(stored.creatorToken || null);
      setOrderId(stored.orderId || '');
      if (stored.recipientName || stored.creatorName || stored.tierId) {
        setForm(prev => ({
          ...prev,
          recipientName: stored.recipientName || prev.recipientName,
          creatorName: stored.creatorName || prev.creatorName,
          creatorEmail: stored.creatorEmail || prev.creatorEmail,
          creatorWhatsapp: stored.creatorWhatsapp || prev.creatorWhatsapp,
          tierId: stored.tierId || prev.tierId,
        }));
      }

      if (stored.paid) {
        setIsPaid(true);
        setPaymentStep(false);
        return;
      }

      setPaymentStep(true);
      fetch(`/api/cards?id=${stored.cardId}&status=payment`, { cache: 'no-store' })
        .then((res) => res.ok ? res.json() : null)
        .then((status) => {
          if (!cancelled && status?.order_id) {
            setOrderId(status.order_id);
          }
          if (!cancelled && status?.is_paid) {
            writeCheckoutSession({ ...stored, paid: true });
            setIsPaid(true);
            setPaymentStep(false);
          }
        })
        .catch(() => {
          // The payment screen will keep polling; avoid blocking the creator on transient errors.
        });
    }, 0);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!paymentStep || !createdCardId || isPaid) return;

    let cancelled = false;
    const checkStatus = async () => {
      try {
        const res = await fetch(`/api/cards?id=${createdCardId}&status=payment`, { cache: 'no-store' });
        const status = res.ok ? await res.json() : null;
        if (!cancelled && status?.order_id) {
          setOrderId(status.order_id);
        }
        if (!cancelled && status?.is_paid) {
          markCheckoutPaid(createdCardId, creatorToken);
        }
      } catch {
        // Keep polling. Direct UPI approval can arrive a few seconds later.
      }
    };

    void checkStatus();
    const interval = window.setInterval(checkStatus, 3000);
    return () => {
      cancelled = true;
      window.clearInterval(interval);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paymentStep, createdCardId, creatorToken, isPaid]);

  const getStepIssues = (stepIndex: number): string[] => {
    const issues: string[] = [];

    if (stepIndex === 0) {
      if (!submitRecipientName) issues.push('Add the recipient name before moving ahead.');
      if (!submitCreatorName) issues.push('Add your sender name before moving ahead.');
    }

    if (stepIndex === 1) {
      if (!form.messageTitle.trim()) issues.push('Write a headline or choose a starting point.');
      if (!form.mainBody.trim()) issues.push('Write the main message or choose a starting point.');
      if (uploadedImages.length < MIN_REVEAL_IMAGES) {
        issues.push(`Upload at least ${MIN_REVEAL_IMAGES} photos so the reveal uses only your images.`);
      }
    }

    if (stepIndex === 2 && form.hasSecretCode) {
      if (form.useCustomQuestion && !form.unlockQuestion.trim()) {
        issues.push('Add the private lock question.');
      }

      if (!form.unlockCode.trim()) {
        issues.push(form.useCustomQuestion ? 'Add the expected lock answer.' : 'Add the 4-digit lock code.');
      }

      if (!form.useCustomQuestion && form.unlockCode.trim().length !== 4) {
        issues.push('The private code must be exactly 4 digits.');
      }
    }

    if (stepIndex === 3) {
      const email = form.creatorEmail.trim();
      const whatsapp = form.creatorWhatsapp.trim();
      if (!email) issues.push('Add your email so we can send the order tracking link.');
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        issues.push('Enter a valid email for the order tracking link.');
      }
      if (!whatsapp) issues.push('Add your WhatsApp number for order tracking.');
      if (whatsapp && !/^[0-9+\-\s()]{8,24}$/.test(whatsapp)) {
        issues.push('Enter a valid WhatsApp number for order tracking.');
      }
    }

    return issues;
  };

  const showStepIssue = (message: string) => {
    setNotice({
      tone: 'error',
      message,
    });
  };

  const tryGoToStep = (targetStep: number) => {
    if (targetStep <= step) {
      setStep(targetStep);
      setNotice(null);
      return;
    }

    for (let index = 0; index < targetStep; index += 1) {
      const issues = getStepIssues(index);
      if (issues.length) {
        setStep(index);
        showStepIssue(issues[0]);
        return;
      }
    }

    setNotice(null);
    setStep(targetStep);
  };

  const validateBeforeCreate = () => {
    for (let index = 0; index < STEPS.length - 1; index += 1) {
      const issues = getStepIssues(index);
      if (issues.length) {
        setStep(index);
        showStepIssue(issues[0]);
        return false;
      }
    }

    return true;
  };

  const removeUploadedImage = (indexToRemove: number) => {
    setForm((prev) => {
      const nextImages = prev.coverImageUrls.filter((_, index) => index !== indexToRemove);
      return {
        ...prev,
        coverImageUrls: nextImages,
        coverImageUrl: nextImages[0] || '',
      };
    });
  };

  // Compress images on select
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(e.target.files || []).filter((file) =>
      file.type.startsWith('image/'),
    );
    const openSlots = Math.max(0, MAX_UPLOAD_IMAGES - form.coverImageUrls.length);
    const files = selectedFiles.slice(0, openSlots);

    e.target.value = '';

    if (!files.length) {
      if (selectedFiles.length && openSlots === 0) {
        setNotice({
          tone: 'info',
          message: `You can upload up to ${MAX_UPLOAD_IMAGES} photos for one reveal.`,
        });
      }
      return;
    }

    setIsCompressing(true);
    setNotice(null);
    try {
      const compressedImages: string[] = [];
      for (const file of files) {
        const result = await compressImage(file);
        compressedImages.push(result.dataUrl);
      }

      setForm((prev) => {
        const nextImages = [...prev.coverImageUrls, ...compressedImages].slice(0, MAX_UPLOAD_IMAGES);
        return {
          ...prev,
          coverImageUrls: nextImages,
          coverImageUrl: nextImages[0] || '',
        };
      });

      if (selectedFiles.length > files.length) {
        setNotice({
          tone: 'info',
          message: `Added ${files.length} photos. One card supports up to ${MAX_UPLOAD_IMAGES} photos.`,
        });
      }
    } catch (err) {
      console.error(err);
      setNotice({
        tone: 'error',
        message: 'One of those photos is too heavy for a smooth card. Try smaller images or screenshots.',
      });
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSubmit = async () => {
    if (!validateBeforeCreate()) return;
    setLoading(true);
    setNotice(null);
    try {
      const res = await fetch('/api/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recipient_name: submitRecipientName,
          creator_name: submitCreatorName,
          template_type: form.templateType,
          theme_selected: form.theme,
          tier_selected: form.tierId,
          music_track_id: form.musicTrackId,
          card_data: {
            message_title: form.messageTitle.trim(),
            main_body: form.mainBody.trim(),
            gif_url: form.gifUrl,
            cover_image_url: primaryUploadedImage,
            cover_image_urls: uploadedImages,
            creator_email: form.creatorEmail.trim().toLowerCase(),
            creator_whatsapp: form.creatorWhatsapp.trim(),
            unlock_code: form.hasSecretCode ? form.unlockCode : '',
            unlock_question: form.hasSecretCode && form.useCustomQuestion ? form.unlockQuestion : '',
            yes_btn_text: form.yesBtnText,
            no_btn_text: form.noBtnText,
            music_url: form.selectedMusicUrl || undefined,
            music_label: form.musicLabel || undefined,
          },
        }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setCreatedCardId(data.id);
        const newOrderId = data.card?.card_data?.order_id || data.id;
        setOrderId(newOrderId);
        if (data.creator_token) {
          setCreatorToken(data.creator_token);
          localStorage.setItem(`creator_token_${data.id}`, data.creator_token);
        }
        // Identify this browser as the creator of the card
        localStorage.setItem(`creator_of_${data.id}`, 'true');
        writeCheckoutSession({
          cardId: data.id,
          creatorToken: data.creator_token || null,
          recipientName: submitRecipientName || displayRecipientName,
          creatorName: submitCreatorName || displayCreatorName,
          creatorEmail: form.creatorEmail.trim().toLowerCase(),
          creatorWhatsapp: form.creatorWhatsapp.trim(),
          orderId: newOrderId,
          tierId: form.tierId,
          paid: false,
        });
        const orderEmail = data.notifications?.email;
        const orderWhatsapp = data.notifications?.whatsapp;
        if (orderEmail?.sent) {
          setNotice({
            tone: 'success',
            message: 'Tracking link emailed. Check your inbox or spam folder and keep this page open for payment verification.',
          });
        } else {
          setNotice({
            tone: 'info',
            message: orderWhatsapp?.sent
              ? 'Your order is saved. Email delivery failed, but your tracking link was sent on WhatsApp.'
              : 'Your order is saved, but we could not email your tracking link. Save the private tracking link below before leaving this page.',
          });
        }
        setPaymentStep(true);
      } else {
        setNotice({
          tone: 'error',
          message: getApiErrorMessage(data, 'We could not create the card yet. Check the required fields and try again.'),
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

  // ── Success phase ───────────────────────────────────
  if (isPaid && createdCardId) {
    return (
      <main className="min-h-screen flex items-center justify-center p-4" style={{ background: 'var(--bg)' }}>
        <AmbientBackground />
        <SuccessHub
          cardId={createdCardId}
          recipientName={displayRecipientName}
          creatorName={displayCreatorName}
          creatorToken={creatorToken || localStorage.getItem(`creator_token_${createdCardId}`) || undefined}
          orderId={orderId}
          creatorEmail={form.creatorEmail}
          creatorWhatsapp={form.creatorWhatsapp}
        />
      </main>
    );
  }

  // ── Payment Screen ────────────────────────────
  if (paymentStep && createdCardId && !isPaid) {
    return (
      <main className="relative min-h-screen overflow-hidden px-4 py-8 text-center sm:px-6" style={{ background: 'var(--bg)' }}>
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
        <div className="pointer-events-none absolute -left-16 top-10 h-64 w-64 rounded-full bg-pink-500/15 blur-3xl" />
        <div className="pointer-events-none absolute -right-20 bottom-10 h-72 w-72 rounded-full bg-amber-400/15 blur-3xl" />

        <div className="relative z-10 mx-auto flex min-h-[calc(100vh-4rem)] w-full max-w-6xl flex-col justify-center gap-5">
          <div className="mx-auto inline-flex w-fit items-center gap-2 rounded-full border border-pink-200/70 bg-white/75 px-4 py-2 text-[10px] font-black uppercase tracking-[0.2em] text-pink-500 shadow-lg shadow-pink-100">
            Final unlock step
          </div>

          <a
            href={`/card/${createdCardId}?ct=${encodeURIComponent(creatorToken || '')}`}
            className="mx-auto text-sm font-bold text-pink-700 underline underline-offset-4"
          >
            Open your private order tracking link — keep it for later
          </a>

          <QRCheckout
            cardId={createdCardId}
            amount={selectedTier.price}
            orderId={orderId}
            creatorEmail={form.creatorEmail}
            creatorWhatsapp={form.creatorWhatsapp}
            onPaid={() => {
              markCheckoutPaid(createdCardId, creatorToken);
            }}
            vpa={paymentVpa}
          />

          <PaymentTestModeToggle
            cardId={createdCardId}
            amount={selectedTier.price}
            creatorToken={creatorToken}
            onPaid={() => markCheckoutPaid(createdCardId, creatorToken)}
          />

          {loading && (
            <div className="mx-auto mt-1 flex w-fit flex-col items-center gap-2 rounded-2xl border border-white/10 bg-white/10 px-5 py-3 backdrop-blur">
              <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }} className="text-xl">🌀</motion.div>
              <p className="text-xs font-bold text-neutral-200">Waiting for payment confirmation...</p>
            </div>
          )}
        </div>
      </main>
    );
  }

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <p className="vc-builder-eyebrow">Choose your card</p>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>What&apos;s the moment?</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              Pick the feeling first. The colors, buttons, and reveal mood will match automatically.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>What are you trying to say?</label>
            <div className="grid md:grid-cols-3 gap-3">
              {PRIMARY_TEMPLATE_TYPES.map(t => (
                <motion.button key={t.id} whileTap={{ scale: 0.96 }}
                  type="button"
                  onClick={() => handleTemplateChange(t.id)}
                  className={`vc-template-option ${form.templateType === t.id ? 'is-active' : ''}`}
                  style={{
                    '--template-cover': `url(${t.defaultCoverImage})`,
                  } as React.CSSProperties}
                >
                  <span className="vc-template-option__image" aria-hidden />
                  <span className="vc-template-option__copy">
                    <strong>{t.label}</strong>
                    <small>{t.description}</small>
                  </span>
                  <span
                    className="vc-template-option__tone"
                    style={{
                      background: form.templateType === t.id ? 'rgba(255,255,255,0.18)' : 'color-mix(in srgb, var(--accent), transparent 86%)',
                      color: form.templateType === t.id ? 'white' : 'var(--accent)',
                    }}
                  >
                    {t.emoji}
                  </span>
                </motion.button>
              ))}
            </div>
            <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--text2)' }}>
              {selectedTemplate.builderHint}
            </p>
          </div>

          {[
            { label: "Who's this for? *", helper: 'Required. This appears the moment they open it.', key: 'recipientName' as keyof FormData, placeholder: 'e.g. Meera' },
            { label: "Who's it from? *", helper: 'Required. Use your name or a nickname so it feels personal.', key: 'creatorName' as keyof FormData, placeholder: 'You (or a nickname)' },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>{f.label}</label>
              <input
                value={form[f.key] as string}
                onChange={e => set(f.key, e.target.value)}
                onBlur={() => setForm(prev => ({ ...prev, [f.key]: formatPersonName(prev[f.key] as string) }))}
                placeholder={f.placeholder}
                className="vc-builder-input w-full px-4 py-3 outline-none text-sm"
              />
              <p className="mt-1 text-[11px]" style={{ color: 'var(--text3)' }}>{f.helper}</p>
            </div>
          ))}
        </div>
      );

      case 1: return (
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <p className="vc-builder-eyebrow">Write your message</p>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Make it sound like you.</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              Pick a starting point, then make it yours. Short and honest works better than perfect.
            </p>
          </div>

          {(() => {
            const tmpl = TEMPLATE_TYPES.find(t => t.id === form.templateType);
            if (!tmpl?.messagePresets?.length) return null;
            return (
              <div>
                <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>Pick a starting point</label>
                <div className="grid md:grid-cols-3 gap-2">
                  {tmpl.messagePresets.map((preset, i) => (
                    <motion.button
                      key={i}
                      type="button"
                      whileTap={{ scale: 0.97 }}
                      onClick={() => applyPreset(preset)}
                      className="vc-preset-option"
                    >
                      <span className="font-bold block" style={{ color: 'var(--accent)' }}>{preset.style}</span>
                      <span className="text-xs opacity-95 block mt-1">{preset.title}</span>
                    </motion.button>
                  ))}
                </div>
              </div>
            );
          })()}

          {[
            { label: 'Headline *', key: 'messageTitle' as keyof FormData, placeholder: previewTitle, multi: false },
            { label: 'Your message *', key: 'mainBody' as keyof FormData, placeholder: previewBody, multi: true },
          ].map(f => (
            <div key={f.key}>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>{f.label}</label>
              {f.multi ? (
                <>
                  <textarea rows={5} value={form[f.key] as string}
                    onChange={e => set(f.key, e.target.value)}
                    placeholder={f.placeholder}
                    className="vc-builder-input w-full px-4 py-3 outline-none text-sm resize-none" />
                  <p className="mt-1 text-[11px]" style={{ color: 'var(--text3)' }}>Short and honest works better than perfect.</p>
                </>
              ) : (
                <input value={form[f.key] as string}
                  onChange={e => set(f.key, e.target.value)}
                  placeholder={f.placeholder}
                  className="vc-builder-input w-full px-4 py-3 outline-none text-sm" />
              )}
            </div>
          ))}

          <div className="grid grid-cols-2 gap-3 p-4 rounded-2xl vc-soft-panel">
            <div>
              <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--text2)' }}>Positive button</label>
              <input
                value={form.yesBtnText}
                onChange={e => set('yesBtnText', e.target.value)}
                placeholder={selectedTemplate.defaultYesText}
                className="vc-builder-input w-full px-3 py-2 outline-none text-xs"
              />
            </div>
            <div>
              <label className="block text-[11px] font-bold mb-1" style={{ color: 'var(--text2)' }}>Playful no button</label>
              <input
                value={form.noBtnText}
                onChange={e => set('noBtnText', e.target.value)}
                placeholder={selectedTemplate.defaultNoText}
                className="vc-builder-input w-full px-3 py-2 outline-none text-xs"
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>Add a song <span className="font-normal opacity-70">(optional)</span></label>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>A song can deepen the reveal, but the message should stand on its own.</p>
            <MusicSelector
              selectedTrackId={form.musicTrackId}
              selectedLabel={form.musicLabel}
              selectedPreviewUrl={form.selectedMusicUrl}
              onSelectTrack={(trackId, musicUrl, label) => {
                setForm(prev => ({
                  ...prev,
                  musicTrackId: trackId,
                  selectedMusicUrl: musicUrl || '',
                  musicLabel: label || '',
                }));
              }}
            />
          </div>

          <div className="vc-bulk-upload-panel">
            <div className="vc-bulk-upload-head">
              <div>
                <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>Upload reveal photos *</label>
                <p className="text-[11px]" style={{ color: 'var(--text3)' }}>
                  Add at least {MIN_REVEAL_IMAGES}. Only your uploaded photos will appear in the recipient card.
                </p>
              </div>
              <span>{uploadedImages.length}/{MAX_UPLOAD_IMAGES}</span>
            </div>

            <input
              type="file"
              accept="image/*"
              multiple
              onChange={handleImageUpload}
              className="hidden"
              id="image-upload-input"
              disabled={isCompressing || uploadedImages.length >= MAX_UPLOAD_IMAGES}
            />
            <label
              htmlFor="image-upload-input"
              className={`vc-bulk-upload-drop ${
                isCompressing || uploadedImages.length >= MAX_UPLOAD_IMAGES
                  ? 'is-disabled'
                  : ''
              }`}
            >
              {isCompressing ? (
                <>
                  <motion.span animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 1 }} className="text-xl">🌀</motion.span>
                  <strong>Preparing photos...</strong>
                  <small>Compressing locally for faster loading</small>
                </>
              ) : uploadedImages.length >= MAX_UPLOAD_IMAGES ? (
                <>
                  <span className="text-2xl">✅</span>
                  <strong>Gallery full</strong>
                  <small>Remove a photo to add another</small>
                </>
              ) : (
                <>
                  <span className="text-2xl">📸</span>
                  <strong>Bulk upload photos</strong>
                  <small>Select multiple images at once</small>
                </>
              )}
            </label>

            {uploadedImages.length ? (
              <div className="vc-bulk-upload-grid" aria-label="Uploaded reveal photos">
                {uploadedImages.map((source, index) => (
                  <div key={`${source.slice(0, 42)}-${index}`} className="vc-bulk-upload-tile">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={source} alt={`Uploaded reveal photo ${index + 1}`} />
                    <span>{index === 0 ? 'Cover' : String(index + 1).padStart(2, '0')}</span>
                    <button
                      type="button"
                      onClick={() => removeUploadedImage(index)}
                      aria-label={`Remove uploaded photo ${index + 1}`}
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="vc-bulk-upload-empty">
                <strong>No photos yet</strong>
                <span>The reveal will stay image-free until you upload your own photos.</span>
              </div>
            )}
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>Add a reveal cameo GIF</label>
            {form.gifUrl ? (
              <div className="vc-gif-cameo-picker">
                <div className="vc-gif-cameo-picker__thumb">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={form.gifUrl} alt="Selected reveal GIF" />
                </div>
                <div>
                  <strong>Shown while the envelope opens</strong>
                  <span>It spins in for a second, then disappears before the card starts.</span>
                </div>
                <button
                  type="button"
                  onClick={() => set('gifUrl', '')}
                  className="vc-gif-cameo-picker__remove"
                  aria-label="Remove reveal GIF"
                >
                  ✕
                </button>
              </div>
            ) : (
              <motion.button
                whileTap={{ scale: 0.96 }}
                type="button"
                onClick={() => setShowGiphy(true)}
                className="w-full py-3 rounded-xl text-sm font-medium bg-[var(--surface2)] border-2 border-dashed border-[var(--border)] hover:border-[var(--accent)] text-[var(--text2)] hover:text-[var(--accent)] cursor-pointer"
              >
                Search GIFs
              </motion.button>
            )}
          </div>
        </div>
      );

      case 2: return (
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <p className="vc-builder-eyebrow">Private lock</p>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Keep it just between you two.</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              Set a PIN or answer only they would know, so the card stays private.
            </p>
          </div>
          <div className="flex items-center justify-between p-4 rounded-2xl vc-soft-panel">
            <div>
              <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>Add a private lock</p>
              <p className="text-xs" style={{ color: 'var(--text2)' }}>Only the right person can open it</p>
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
                      {isQ ? 'Custom question' : '4-digit code'}
                    </button>
                  ))}
                </div>
                {form.useCustomQuestion && (
                  <input value={form.unlockQuestion} onChange={e => set('unlockQuestion', e.target.value)}
                  placeholder='e.g. What do you call me?'
                    className="vc-builder-input w-full px-4 py-3 outline-none text-sm" />
                )}
                <input value={form.unlockCode}
                  onChange={e => set('unlockCode', form.useCustomQuestion ? e.target.value : e.target.value.replace(/\D/g, '').slice(0, 4))}
                  placeholder={form.useCustomQuestion ? 'Expected answer...' : '4-digit code (e.g. 2004)'}
                  className="vc-builder-input w-full px-4 py-3 outline-none text-sm" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      );

      case 3: return (
        <div className="flex flex-col gap-4">
          <div className="space-y-2">
            <p className="vc-builder-eyebrow">Order tracking</p>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>Where should we send your tracking link?</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              Before payment, add your email and WhatsApp. Every order gets a unique ID and a private creator link.
            </p>
          </div>
          <div className="vc-order-contact-card">
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>Email for tracking *</label>
              <input
                type="email"
                value={form.creatorEmail}
                onChange={e => set('creatorEmail', e.target.value)}
                placeholder="you@example.com"
                className="vc-builder-input w-full px-4 py-3 outline-none text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>WhatsApp number *</label>
              <input
                type="tel"
                inputMode="tel"
                value={form.creatorWhatsapp}
                onChange={e => set('creatorWhatsapp', e.target.value)}
                placeholder="+91 98765 43210"
                className="vc-builder-input w-full px-4 py-3 outline-none text-sm"
              />
            </div>
            <p>
              We keep this attached to your order only, so the tracking link and payment status do not get lost.
            </p>
          </div>
          {TIERS.map(t => (
            <motion.button key={t.id} whileTap={{ scale: 0.97 }}
              type="button"
              onClick={() => set('tierId', t.id)}
              className={`p-5 rounded-2xl text-left cursor-pointer w-full relative overflow-hidden vc-plan-option ${form.tierId === t.id ? 'is-active' : ''}`}
              style={{
                borderColor: form.tierId === t.id ? 'var(--accent)' : 'var(--border)',
              }}
            >
              <div className="flex items-center justify-between mb-1 relative z-10">
                <div className="flex items-center gap-2">
                  <span className="text-xl">{t.icon}</span>
                  <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>{t.label}</span>
                  {t.popular && <span className="text-[10px] px-2 py-0.5 rounded-full font-extrabold text-white" style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}>Popular</span>}
                </div>
                <span className="text-xl font-black" style={{ color: 'var(--text)' }}>₹{t.price}</span>
              </div>
              <p className="text-xs relative z-10 mt-1" style={{ color: 'var(--text2)' }}>{t.duration} · {t.description}</p>
            </motion.button>
          ))}
          <motion.button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            whileHover={{ scale: 1.02, boxShadow: '0 20px 60px var(--glow)' }}
            whileTap={{ scale: 0.96 }}
            className="w-full py-4 rounded-2xl text-lg font-black text-white mt-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent2))',
              boxShadow: '0 8px 30px var(--glow)',
            }}
          >
            {loading ? 'Generating link...' : `Looks good - send it for ₹${selectedTier.price}`}
          </motion.button>
          <p className="text-xs text-center font-medium leading-relaxed" style={{ color: 'var(--text2)' }}>
            Secure direct UPI · QR/deep links accepted · admin verified by UTR
          </p>
        </div>
      );

      default: return null;
    }
  };

  return (
    <main className="min-h-screen vc-customize-shell" data-theme={form.theme} data-card={form.templateType}>

      {/* Soft Coquette background canvas */}
      {form.theme === 'soft_coquette' && <HeartCanvas />}

      <AmbientBackground />
      <div className="vc-card-decor" aria-hidden>
        {(CARD_DECOR[form.templateType] || CARD_DECOR.maan_jao).map((item, index) => (
          <span key={`${item}-${index}`}>{item}</span>
        ))}
      </div>

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
      <nav className="vc-customize-nav sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b"
        style={{
          background: 'color-mix(in srgb, var(--bg), white 12%)',
          backdropFilter: 'blur(20px) saturate(1.15)',
          borderColor: 'color-mix(in srgb, var(--border), transparent 30%)',
        }}>
        <div className="flex items-center gap-3">
          <button onClick={() => router.push('/')} className="text-lg cursor-pointer select-none" style={{ color: 'var(--text2)' }}>←</button>
          <span className="text-lg font-black" style={{ fontFamily: 'var(--font-display)', color: 'var(--accent)' }}>VibeCheck</span>
        </div>

        {/* Stepper headers */}
        <div className="hidden md:flex gap-1.5">
          {STEP_LABELS.map((label, idx) => {
            const isActive = step === idx;
            return (
              <button
                key={idx}
                onClick={() => tryGoToStep(idx)}
                className={`vc-step-pill ${isActive ? 'is-active' : ''}`}
              >
                {label}
              </button>
            );
          })}
        </div>
      </nav>

      {/* Main layout container (2 Columns on large screen, 1 Column on mobile) */}
      <div className="vc-builder-workbench max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1.15fr_0.95fr] gap-10 relative z-10">

        {/* Column 1: Customizer Form */}
        <div className="vc-builder-column space-y-6">
          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full vc-progress-track">
            <motion.div className="h-full rounded-full"
              animate={{ width: `${((step + 1) / STEPS.length) * 100}%` }}
              style={{ background: 'linear-gradient(90deg, var(--accent), var(--accent2))' }} />
          </div>

          <div className="vc-builder-panel relative overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={step}
                initial={{ opacity: 0, y: 12, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -10, filter: 'blur(4px)' }}
                transition={{ duration: 0.26, ease: [0.16, 1, 0.3, 1] }}
              >
                {renderStep()}
              </motion.div>
            </AnimatePresence>

            {/* Back / Next Buttons */}
            <div className="flex gap-3 mt-8 pt-4 border-t border-white/5">
              {step > 0 && (
                <button
                  onClick={() => tryGoToStep(step - 1)}
                  className="flex-1 py-3.5 rounded-xl font-extrabold text-sm vc-secondary-action transition-colors cursor-pointer select-none"
                >
                  ← Back
                </button>
              )}
              {step < STEPS.length - 1 && (
                <button
                  onClick={() => tryGoToStep(step + 1)}
                  className="flex-1 py-3.5 rounded-xl font-extrabold text-sm text-white theme-btn hover:opacity-95 shadow-xl transition-all cursor-pointer select-none"
                >
                  Next →
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Column 2: Sticky Live Preview Mirror */}
        <div className="hidden lg:block">
          <div className="vc-preview-column sticky top-24 space-y-4">
            <div className="flex items-center justify-between px-2">
              <span className="text-xs font-bold text-neutral-400 uppercase tracking-widest">Live Simulator Preview</span>
              <span className="text-[10px] bg-emerald-500/20 text-emerald-400 font-extrabold px-2 py-0.5 rounded-full animate-pulse">AUTOSAVING</span>
            </div>

            {/* Mock Viewport Container */}
            <motion.div
              key={`${form.templateType}-${form.theme}`}
              initial={{ opacity: 0.82, y: 10, scale: 0.985 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
              className="vc-live-phone w-full max-w-sm mx-auto aspect-9/16 rounded-[36px] border-8 shadow-2xl overflow-hidden relative flex flex-col justify-between p-4"
              data-theme={form.theme}
            >
              {/* Phone Status Notch */}
              <div className="absolute top-0 inset-x-0 h-4 flex justify-between items-center px-6 text-[9px] font-mono pointer-events-none z-30" style={{ color: 'var(--text3)' }}>
                <span>9:41</span>
                <div className="w-16 h-3.5 bg-black rounded-b-xl absolute left-1/2 -translate-x-1/2 top-0"></div>
                <div className="flex gap-1">
                  <span>📶</span>
                  <span>🔋</span>
                </div>
              </div>

              {/* Live Card Content Preview */}
              <div className="vc-preview-stack w-full">

                {/* People Badge */}
                <div className="vc-preview-badge text-center space-y-2">
                  <div
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-bold text-white"
                    style={{ background: 'linear-gradient(135deg, var(--accent), var(--accent2))' }}
                  >
                    <span>{selectedTemplate.emoji}</span>
                    <span>{stripEmojiLabel(selectedTemplate.label)}</span>
                  </div>
                  <div className="vc-preview-people">
                    <span>
                      <em>For</em>
                      <strong>{displayRecipientName}</strong>
                    </span>
                    <span>
                      <em>From</em>
                      <strong>{displayCreatorName}</strong>
                    </span>
                  </div>
                </div>

                {form.gifUrl && (
                  <div className="vc-preview-cameo-chip">
                    <span>✨</span>
                    <strong>Reveal GIF cameo selected</strong>
                  </div>
                )}

                {/* Uploaded gallery preview */}
                {primaryUploadedImage ? (
                  <div className="vc-preview-cover rounded-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={primaryUploadedImage}
                      alt="Cover Preview"
                      className="vc-preview-cover__image rounded-2xl mx-auto block"
                      draggable={false}
                    />
                    {uploadedImages.length > 1 && (
                      <div className="vc-preview-cover-strip" aria-label="Uploaded photo count">
                        {uploadedImages.slice(0, 4).map((source, index) => (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img key={`${source.slice(0, 32)}-${index}`} src={source} alt="" draggable={false} />
                        ))}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="vc-preview-cover vc-preview-cover--empty rounded-2xl">
                    <strong>Upload {MIN_REVEAL_IMAGES} photos</strong>
                    <span>Your images become the full reveal gallery.</span>
                  </div>
                )}

                {/* Main Message Display */}
                <div
                  className="vc-preview-message vc-preview-copy rounded-2xl p-4 space-y-2 text-left"
                >
                  <h3
                    className="vc-preview-title text-2xl font-black mb-2 tracking-tight drop-shadow-md"
                    style={{
                      fontFamily: 'var(--font-display)',
                      color: 'var(--accent)',
                    }}
                  >
                    {previewTitle}
                  </h3>
                  <p
                    className="vc-preview-body text-xs leading-relaxed font-medium first-letter:uppercase first-letter:text-lg first-letter:font-bold whitespace-pre-line"
                    style={{ color: 'var(--text2)' }}
                  >
                    {previewBody}
                  </p>
                </div>

                {/* Runaway buttons mock */}
                {TEMPLATE_TYPES.find(t => t.id === form.templateType)?.hasRunaway && (
                  <div
                    className="vc-preview-message vc-preview-actions rounded-2xl p-4 space-y-3 text-center"
                  >
                    <p className="text-[10px] font-bold" style={{ color: 'var(--text)' }}>So, what feels right?</p>
                    <div className="flex gap-2 justify-center min-w-0">
                      <button className="theme-btn min-w-0 flex-1 px-3 py-2 rounded-xl text-xs font-bold cursor-not-allowed truncate">{form.yesBtnText || 'YES 💖'}</button>
                      <button className="min-w-0 flex-1 px-3 py-2 rounded-xl text-xs font-bold cursor-not-allowed vc-preview-no truncate">{form.noBtnText || 'No 💔'}</button>
                    </div>
                  </div>
                )}
              </div>

              {/* Watermark brand overlay */}
              <div className="text-center py-2 border-t border-white/5 pointer-events-none mt-auto">
                <span className="text-[8px] uppercase tracking-widest" style={{ color: 'var(--text3)' }}>VibeCheck · Live Preview</span>
              </div>
            </motion.div>
          </div>
        </div>

      </div>

      {showGiphy && (
        <GiphyModal
          onSelect={url => { set('gifUrl', url); setShowGiphy(false); }}
          onClose={() => setShowGiphy(false)}
          initialQuery={gifSearchTerms[0]}
          suggestedQueries={gifSearchTerms}
          cardLabel={stripEmojiLabel(selectedTemplate.label)}
        />
      )}
    </main>
  );
}

export default function CustomizePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[var(--text)]" style={{ background: 'var(--bg)' }}>Loading...</div>}>
      <CustomizePageContent />
    </Suspense>
  );
}
