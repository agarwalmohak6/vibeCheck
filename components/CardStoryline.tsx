'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useState } from 'react';
import { TEMPLATE_TYPES, type StoryQuestion } from '@/lib/themes';
import {
  RECIPIENT_COPY,
  getLocalizedStoryQuestions,
  type RecipientLocale,
} from '@/lib/recipientI18n';

interface CardStorylineProps {
  cardId?: string;
  templateType: string;
  questions?: StoryQuestion[];
  recipientName?: string;
  compact?: boolean;
  locale?: RecipientLocale;
  onComplete?: () => void;
}

type StoryAnswer = {
  question: StoryQuestion;
  answer: string;
};

const DEFAULT_STORY: StoryQuestion[] = [
  { id: 'first', eyebrow: 'First glance', question: 'Did this feel made for you?', options: ['Yes', 'A little'] },
  { id: 'words', eyebrow: 'The words', question: 'What landed first?', options: ['The message', 'The effort'] },
  { id: 'mood', eyebrow: 'The mood', question: 'What are you feeling now?', options: ['Soft', 'Curious'] },
  { id: 'reply', eyebrow: 'Reply style', question: 'How should the reply sound?', options: ['Sweet', 'Honest'] },
  { id: 'final', eyebrow: 'Final check', question: 'Ready to answer?', options: ['Ready', 'Almost'] },
];

export default function CardStoryline({
  cardId,
  templateType,
  questions: customQuestions,
  recipientName = 'you',
  compact = false,
  locale = 'en',
  onComplete,
}: CardStorylineProps) {
  const hasCustomQuestions = Boolean(customQuestions?.length);
  const sourceQuestions = customQuestions?.length
    ? customQuestions
    : TEMPLATE_TYPES.find((template) => template.id === templateType)?.storyQuestions || DEFAULT_STORY;
  const questions = hasCustomQuestions
    ? sourceQuestions
    : getLocalizedStoryQuestions(templateType, locale, sourceQuestions);
  const copy = RECIPIENT_COPY[locale].story;
  const [activeIndex, setActiveIndex] = useState(0);
  const [answers, setAnswers] = useState<StoryAnswer[]>([]);
  const [isComplete, setIsComplete] = useState(false);

  const activeQuestion = questions[activeIndex];
  const progress = Math.round((answers.length / questions.length) * 100);

  const recordAnswer = (question: StoryQuestion, answer: string, nextIndex: number) => {
    if (!cardId) return;

    void fetch(`/api/cards/${cardId}/events`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        event_type: 'story_answered',
        metadata: {
          step: nextIndex,
          question: question.question,
          answer,
        },
      }),
    });
  };

  const handleAnswer = (answer: string) => {
    if (!activeQuestion || isComplete) return;

    const nextAnswers = [
      ...answers.filter((item) => item.question.id !== activeQuestion.id),
      { question: activeQuestion, answer },
    ];
    const nextIndex = Math.min(activeIndex + 1, questions.length - 1);

    setAnswers(nextAnswers);
    recordAnswer(activeQuestion, answer, activeIndex + 1);

    if (activeIndex >= questions.length - 1) {
      setIsComplete(true);
      onComplete?.();
      return;
    }

    setActiveIndex(nextIndex);
  };

  if (compact) {
    return (
      <div className="vc-storyline-preview rounded-2xl p-3">
        <div className="flex items-center justify-between gap-3">
          <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'var(--text3)' }}>
            {copy.compactEyebrow}
          </p>
          <span className="text-[9px] font-bold" style={{ color: 'var(--accent)' }}>
            {questions.length} {copy.promptsLabel}
          </span>
        </div>
        <div className="mt-2 space-y-1.5">
          {questions.slice(0, 3).map((question, index) => (
            <div key={question.id} className="vc-storyline-preview__row">
              <span>{index + 1}</span>
              <p>{question.question}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section className="vc-storyline-card">
      <div className="vc-storyline-card__header">
        <div>
          <p className="vc-storyline-card__eyebrow">{copy.eyebrow}</p>
          <h2>{copy.title(recipientName)}</h2>
        </div>
      </div>

      <div className="vc-storyline-card__track" aria-hidden>
        <motion.div
          initial={false}
          animate={{ width: `${isComplete ? 100 : progress}%` }}
          transition={{ type: 'spring', stiffness: 260, damping: 28 }}
        />
      </div>

      <div className="vc-storyline-card__steps" aria-label={copy.progressLabel}>
        {questions.map((question, index) => {
          const answered = answers.some((item) => item.question.id === question.id);
          const current = index === activeIndex && !isComplete;
          return (
            <button
              key={question.id}
              type="button"
              onClick={() => setActiveIndex(index)}
              className={answered ? 'is-answered' : current ? 'is-current' : ''}
              aria-label={copy.questionAria(index, question.eyebrow)}
            >
              {index + 1}
            </button>
          );
        })}
      </div>

      <AnimatePresence mode="wait">
        {!isComplete && activeQuestion ? (
          <motion.div
            key={activeQuestion.id}
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.22 }}
            className="vc-storyline-card__question"
          >
            <p>{activeQuestion.eyebrow}</p>
            <h3>{activeQuestion.question}</h3>
            <div>
              {activeQuestion.options.map((option) => (
                <motion.button
                  key={option}
                  type="button"
                  whileHover={{ y: -2 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={() => handleAnswer(option)}
                >
                  {option}
                </motion.button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="complete"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            className="vc-storyline-card__complete"
          >
            <span>{copy.completeIcon}</span>
            <h3>{copy.completeTitle}</h3>
            <p>{copy.completeBody}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
