'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useTheme } from '@/components/ThemeProvider';
import { PRIMARY_TEMPLATE_TYPES, TEMPLATE_TYPES, TIERS, ThemeId, type StoryQuestion } from '@/lib/themes';
import GiphyModal from '@/components/GiphyModal';
import SuccessHub from '@/components/SuccessHub';
import MusicSelector from '@/components/MusicSelector';
import QRCheckout from '@/components/QRCheckout';
import RazorpayCheckout from '@/components/RazorpayCheckout';
import { compressImage } from '@/lib/imageCompressor';
import HeartCanvas from '@/components/HeartCanvas';
import AmbientBackground from '@/components/AmbientBackground';
import CardStoryline from '@/components/CardStoryline';

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
  selectedMusicUrl: string;
  musicLabel: string;
  storyQuestions: StoryQuestion[];
}

type Notice = {
  tone: 'error' | 'success' | 'info';
  message: string;
};

const STEPS = ['basics', 'content', 'lock', 'payment'];
const STEP_LABELS = ['Card', 'Message', 'Privacy', 'Pay'];
const DEFAULT_TEMPLATE = 'maan_jao';
const MIN_STORY_QUESTIONS = 3;
const MAX_STORY_QUESTIONS = 5;
const CARD_DECOR: Record<string, string[]> = {
  maan_jao: ['🥺', '💌', '🧸', '🕊️'],
  birthday_roast: ['🎂', '🎉', '🎩', '🧸'],
  bestie_check: ['🍹', '🥂', '✨', '💅'],
  shoot_shot: ['💌', '💍', '✨', '🌙'],
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

function cloneStoryQuestions(templateType: string): StoryQuestion[] {
  const template = TEMPLATE_TYPES.find(t => t.id === templateType) || PRIMARY_TEMPLATE_TYPES[0];
  return template.storyQuestions.slice(0, MAX_STORY_QUESTIONS).map((question, index) => ({
    id: question.id || `story-${index + 1}`,
    eyebrow: question.eyebrow,
    question: question.question,
    options: question.options.slice(0, 3),
  }));
}

function createBlankStoryQuestion(index: number): StoryQuestion {
  return {
    id: `custom-${Date.now()}-${index + 1}`,
    eyebrow: `Moment ${index + 1}`,
    question: '',
    options: ['', '', ''],
  };
}

function sanitizeStoryQuestions(questions: StoryQuestion[]): StoryQuestion[] {
  return questions
    .slice(0, MAX_STORY_QUESTIONS)
    .map((question, index) => ({
      id: question.id?.trim() || `custom-${index + 1}`,
      eyebrow: question.eyebrow.trim() || `Moment ${index + 1}`,
      question: question.question.trim(),
      options: question.options.map(option => option.trim()).filter(Boolean).slice(0, 3),
    }))
    .filter(question => question.question && question.options.length >= 2);
}

function CustomizePageContent() {
  const router = useRouter();
  const params = useSearchParams();
  const { setTheme } = useTheme();

  const [step, setStep] = useState(0);
  const requestedTemplate = params.get('type') || DEFAULT_TEMPLATE;
  const initialTemplate = PRIMARY_TEMPLATE_TYPES.some(t => t.id === requestedTemplate) ? requestedTemplate : DEFAULT_TEMPLATE;
  const initialTmplMeta = TEMPLATE_TYPES.find(t => t.id === initialTemplate);
  const [form, setForm] = useState<FormData>({
    recipientName: '',
    creatorName: '',
    templateType: initialTemplate,
    theme: initialTmplMeta?.recommendedTheme || 'soft_coquette',
    messageTitle: '',
    mainBody: '',
    musicTrackId: '',
    gifUrl: '',
    coverImageUrl: initialTmplMeta?.defaultCoverImage || TEMPLATE_TYPES.find(t => t.id === 'shoot_shot')?.defaultCoverImage || '',
    hasSecretCode: false,
    unlockCode: '',
    unlockQuestion: '',
    useCustomQuestion: false,
    tierId: params.get('tier') || '3_day',
    yesBtnText: initialTmplMeta?.defaultYesText || 'YES 💖',
    noBtnText: initialTmplMeta?.defaultNoText || 'No 💔',
    selectedMusicUrl: '',
    musicLabel: '',
    storyQuestions: cloneStoryQuestions(initialTemplate),
  });

  const [showGiphy, setShowGiphy] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false);
  const [createdCardId, setCreatedCardId] = useState<string | null>(null);
  const [creatorToken, setCreatorToken] = useState<string | null>(null);
  const [paymentStep, setPaymentStep] = useState(false);
  const [isPaid, setIsPaid] = useState(false);
  const [notice, setNotice] = useState<Notice | null>(null);
  const allowMockPayments = process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_ENABLE_MOCK_PAYMENTS !== 'false';
  const paymentVpa = (process.env.NEXT_PUBLIC_UPI_VPA || '').trim();

  const set = <K extends keyof FormData>(k: K, v: FormData[K]) => setForm(p => ({ ...p, [k]: v }));

  const handleTemplateChange = (templateId: string) => {
    const tmpl = TEMPLATE_TYPES.find(t => t.id === templateId);
    if (tmpl) {
      setForm(prev => ({
        ...prev,
        templateType: templateId,
        theme: tmpl.recommendedTheme,
        coverImageUrl: tmpl.defaultCoverImage,
        yesBtnText: tmpl.defaultYesText,
        noBtnText: tmpl.defaultNoText,
        messageTitle: '',
        mainBody: '',
        storyQuestions: cloneStoryQuestions(templateId),
      }));
      setTheme(tmpl.recommendedTheme);
    }
  };

  const applyPreset = (preset: { title: string; body: string }) => {
    set('messageTitle', preset.title);
    set('mainBody', preset.body);
  };

  const selectedTier = TIERS.find(t => t.id === form.tierId)!;
  const selectedTemplate = TEMPLATE_TYPES.find(t => t.id === form.templateType) || initialTmplMeta || PRIMARY_TEMPLATE_TYPES[0];
  const previewTitle = form.messageTitle || selectedTemplate.messagePresets[0]?.title || selectedTemplate.label.replace(/\s[^\s]*$/, '');
  const previewBody = form.mainBody || selectedTemplate.messagePresets[0]?.body || selectedTemplate.builderHint;
  const displayRecipientName = formatPersonName(form.recipientName, 'Priya');
  const displayCreatorName = formatPersonName(form.creatorName, 'Aarav');
  const submitRecipientName = formatPersonName(form.recipientName);
  const submitCreatorName = formatPersonName(form.creatorName);
  const gifSearchTerms = selectedTemplate.gifSearchTerms?.length
    ? selectedTemplate.gifSearchTerms
    : [`${stripEmojiLabel(selectedTemplate.label)} reaction`];
  const cleanStoryQuestions = sanitizeStoryQuestions(form.storyQuestions);
  const hasSelectedSong = Boolean(
    form.musicTrackId.trim() || form.selectedMusicUrl.trim() || form.musicLabel.trim(),
  );

  const isStoryQuestionComplete = (question: StoryQuestion) => {
    const options = question.options.map(option => option.trim()).filter(Boolean);
    return Boolean(question.question.trim() && options.length >= 2);
  };

  const getStepIssues = (stepIndex: number): string[] => {
    const issues: string[] = [];

    if (stepIndex === 0) {
      if (!submitRecipientName) issues.push('Add the recipient name before moving ahead.');
      if (!submitCreatorName) issues.push('Add your sender name before moving ahead.');
    }

    if (stepIndex === 1) {
      if (!form.messageTitle.trim()) issues.push('Write a headline or choose a starting point.');
      if (!form.mainBody.trim()) issues.push('Write the main message or choose a starting point.');
      if (!hasSelectedSong) issues.push('Select one song. The card cannot be created without music.');

      if (form.storyQuestions.length < MIN_STORY_QUESTIONS) {
        issues.push(`Add at least ${MIN_STORY_QUESTIONS} story questions.`);
      }

      if (form.storyQuestions.length > MAX_STORY_QUESTIONS) {
        issues.push(`Keep story questions to ${MAX_STORY_QUESTIONS} or fewer.`);
      }

      const incompleteIndexes = form.storyQuestions
        .map((question, index) => isStoryQuestionComplete(question) ? null : index + 1)
        .filter((index): index is number => index !== null);

      if (incompleteIndexes.length) {
        issues.push(`Complete question ${incompleteIndexes[0]} with a question and at least 2 answers.`);
      }

      if (cleanStoryQuestions.length < MIN_STORY_QUESTIONS) {
        issues.push(`You need ${MIN_STORY_QUESTIONS} complete questions before payment.`);
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

  const updateStoryQuestion = (
    index: number,
    patch: Partial<StoryQuestion> | { optionIndex: number; option: string },
  ) => {
    setForm(prev => ({
      ...prev,
      storyQuestions: prev.storyQuestions.map((question, questionIndex) => {
        if (questionIndex !== index) return question;
        if ('optionIndex' in patch) {
          return {
            ...question,
            options: question.options.map((option, optionIndex) =>
              optionIndex === patch.optionIndex ? patch.option : option
            ),
          };
        }
        return { ...question, ...patch };
      }),
    }));
  };

  const addStoryQuestion = () => {
    setForm(prev => {
      if (prev.storyQuestions.length >= MAX_STORY_QUESTIONS) return prev;

      return {
        ...prev,
        storyQuestions: [
          ...prev.storyQuestions,
          createBlankStoryQuestion(prev.storyQuestions.length),
        ],
      };
    });
  };

  const removeStoryQuestion = (index: number) => {
    setForm(prev => {
      if (prev.storyQuestions.length <= MIN_STORY_QUESTIONS) return prev;

      return {
        ...prev,
        storyQuestions: prev.storyQuestions.filter((_, questionIndex) => questionIndex !== index),
      };
    });
  };

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
            cover_image_url: form.coverImageUrl,
            unlock_code: form.hasSecretCode ? form.unlockCode : '',
            unlock_question: form.hasSecretCode && form.useCustomQuestion ? form.unlockQuestion : '',
            yes_btn_text: form.yesBtnText,
            no_btn_text: form.noBtnText,
            music_url: form.selectedMusicUrl || undefined,
            music_label: form.musicLabel || undefined,
            story_questions: cleanStoryQuestions,
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

  // Handle mock trigger on mobile viewport
  const handleMobileMockSuccess = async () => {
    if (!createdCardId) return;
    setLoading(true);
    try {
      const res = await fetch('/api/payment/webhook', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-vibecheck-mock-payment': 'true' },
        body: JSON.stringify({
          card_id: createdCardId,
          payment_id: `mock_mobile_${Date.now()}`,
          status: 'success'
        }),
      });
      if (res.ok) setIsPaid(true);
    } catch (e) {
      console.error(e);
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
        />
      </main>
    );
  }

  // ── Payment Screen ────────────────────────────
  if (paymentStep && createdCardId && !isPaid) {
    return (
      <main className="min-h-screen flex flex-col items-center justify-center p-6 text-center space-y-6" style={{ background: 'var(--bg)' }}>
        <div className="absolute -top-10 -left-10 w-44 h-44 bg-pink-500/10 rounded-full blur-3xl pointer-events-none"></div>

        <RazorpayCheckout
          cardId={createdCardId}
          amount={selectedTier.price}
          onPaid={() => {
            setIsPaid(true);
            setLoading(false);
          }}
          fallback={(
            <QRCheckout
              cardId={createdCardId}
              amount={selectedTier.price}
              onPaid={() => {
                setIsPaid(true);
                setLoading(false);
              }}
              vpa={paymentVpa}
            />
          )}
        />

        <div className="w-full max-w-sm space-y-3">
          {allowMockPayments && (
            <button
              onClick={handleMobileMockSuccess}
              className="w-full bg-white/8 border border-white/15 hover:bg-white/12 text-neutral-100 font-bold py-3 px-6 rounded-2xl text-xs transition-colors cursor-pointer"
            >
              Simulate Mock Success Payment 🛠️
            </button>
          )}

          {allowMockPayments && (
            <button
              onClick={() => setIsPaid(true)}
              className="w-full bg-white/12 border border-white/20 hover:bg-white/18 text-white font-bold py-3 px-6 rounded-2xl text-xs tracking-wide transition-colors cursor-pointer shadow-lg shadow-black/20"
            >
              Bypass payment locally
            </button>
          )}
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

  const renderStep = () => {
    switch (step) {
      case 0: return (
        <div className="flex flex-col gap-5">
          <div className="space-y-2">
            <p className="vc-builder-eyebrow">Choose your card</p>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>What&apos;s the moment?</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              Pick the card first. The cover, colors, buttons, and mood will match automatically.
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold mb-2" style={{ color: 'var(--text2)' }}>Card type</label>
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

          <div className="vc-question-editor vc-soft-panel">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--text2)' }}>Tiny story questions *</label>
                <p className="text-[11px] leading-relaxed" style={{ color: 'var(--text3)' }}>
                  Add {MIN_STORY_QUESTIONS}-{MAX_STORY_QUESTIONS} questions. Each one needs a question and at least 2 answer choices.
                </p>
              </div>
              <div className="flex shrink-0 flex-wrap justify-end gap-2">
                <button
                  type="button"
                  onClick={addStoryQuestion}
                  disabled={form.storyQuestions.length >= MAX_STORY_QUESTIONS}
                  className="vc-mini-action disabled:opacity-45 disabled:cursor-not-allowed"
                >
                  Add
                </button>
                <button
                  type="button"
                  onClick={() => set('storyQuestions', cloneStoryQuestions(form.templateType))}
                  className="vc-mini-action"
                >
                  Reset
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {form.storyQuestions.map((question, questionIndex) => (
                <div key={question.id} className="vc-question-editor__item">
                  <div className="flex items-center gap-2 mb-2">
                    <span>{questionIndex + 1}</span>
                    <input
                      value={question.eyebrow}
                      onChange={e => updateStoryQuestion(questionIndex, { eyebrow: e.target.value })}
                      placeholder="Tiny label"
                      maxLength={60}
                      className="vc-builder-input flex-1 px-3 py-2 outline-none text-xs"
                    />
                    {form.storyQuestions.length > MIN_STORY_QUESTIONS && (
                      <button
                        type="button"
                        onClick={() => removeStoryQuestion(questionIndex)}
                        className="vc-question-editor__remove"
                        aria-label={`Remove question ${questionIndex + 1}`}
                      >
                        Remove
                      </button>
                    )}
                  </div>
                  <input
                    value={question.question}
                    onChange={e => updateStoryQuestion(questionIndex, { question: e.target.value })}
                    placeholder="Question they will answer..."
                    maxLength={160}
                    className="vc-builder-input w-full px-3 py-2.5 outline-none text-xs mb-2"
                  />
                  <div className="grid md:grid-cols-3 gap-2">
                    {question.options.slice(0, 3).map((option, optionIndex) => (
                      <input
                        key={`${question.id}-option-${optionIndex}`}
                        value={option}
                        onChange={e => updateStoryQuestion(questionIndex, { optionIndex, option: e.target.value })}
                        placeholder={`Answer ${optionIndex + 1}`}
                        maxLength={60}
                        className="vc-builder-input px-3 py-2 outline-none text-xs"
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>Add a song *</label>
            <p className="text-[11px]" style={{ color: 'var(--text3)' }}>Required. One good song does more than a paragraph.</p>
            <MusicSelector
              selectedTrackId={form.musicTrackId}
              selectedLabel={form.musicLabel}
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

          <div>
            <label className="block text-xs font-semibold mb-1.5" style={{ color: 'var(--text2)' }}>Add a cover photo</label>
            <p className="mb-2 text-[11px]" style={{ color: 'var(--text3)' }}>A photo of you two makes it ten times more personal.</p>
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
                className="w-full py-3 rounded-xl text-sm font-medium bg-neutral-900/40 border-2 border-dashed border-white/15 hover:border-white/25 text-neutral-200 hover:text-white cursor-pointer"
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
            <p className="vc-builder-eyebrow">Preview and send</p>
            <h2 className="text-3xl font-black tracking-tight" style={{ color: 'var(--text)', fontFamily: 'var(--font-display)' }}>This is exactly what they&apos;ll see.</h2>
            <p className="text-sm leading-relaxed" style={{ color: 'var(--text2)' }}>
              Pay once, get the private link, and share it while the moment is still warm.
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
            {loading ? 'Generating link...' : `Looks good - send it for ₹${selectedTier?.price || 49}`}
          </motion.button>
          <p className="text-xs text-center font-medium leading-relaxed" style={{ color: 'var(--text2)' }}>
            Secure payment · UPI deep links / QR codes accepted · instant confirmation
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
      <nav className="sticky top-0 z-40 px-6 py-4 flex items-center justify-between border-b"
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
      <div className="max-w-6xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-[1.15fr_0.95fr] gap-10 relative z-10">

        {/* Column 1: Customizer Form */}
        <div className="space-y-6">
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
          <div className="sticky top-24 space-y-4">
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

                {/* Uploaded Cover Image preview */}
                {form.coverImageUrl && (
                  <div className="vc-preview-cover rounded-2xl overflow-hidden">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={form.coverImageUrl}
                      alt="Cover Preview"
                      className="vc-preview-cover__image rounded-2xl mx-auto block"
                      draggable={false}
                    />
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

                <CardStoryline
                  templateType={form.templateType}
                  questions={cleanStoryQuestions}
                  compact
                />

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
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-white" style={{ background: 'var(--bg)' }}>Loading...</div>}>
      <CustomizePageContent />
    </Suspense>
  );
}
