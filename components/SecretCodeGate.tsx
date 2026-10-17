'use client';

import { motion, useReducedMotion } from 'framer-motion';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { requestCardUnlock } from '@/lib/unlockCard';

interface SecretCodeGateProps {
  cardId: string;
  creatorName?: string;
  recipientName?: string;
  unlockQuestion?: string;
  onUnlock: () => void;
}

export default function SecretCodeGate({ cardId, creatorName, recipientName, unlockQuestion, onUnlock }: SecretCodeGateProps) {
  const [input, setInput] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [error, setError] = useState('');
  const [status, setStatus] = useState<'idle' | 'checking' | 'unlocked'>('idle');
  const inputRef = useRef<HTMLInputElement>(null);
  const requestRef = useRef<AbortController | null>(null);
  const revealTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reducedMotion = useReducedMotion();
  const isNumeric = !unlockQuestion?.trim();
  const busy = status !== 'idle';
  const valid = isNumeric ? /^\d{4}$/.test(input) : input.trim().length > 0;

  useEffect(() => () => {
    requestRef.current?.abort();
    requestRef.current = null;
    if (revealTimer.current) clearTimeout(revealTimer.current);
  }, []);

  const updateInput = (value: string) => {
    setInput(isNumeric ? value.replace(/\D/g, '').slice(0, 4) : value.slice(0, 80));
    setError('');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!valid || busy || requestRef.current) return;
    const controller = new AbortController();
    requestRef.current = controller;
    setStatus('checking');
    setError('');
    const timeout = setTimeout(() => controller.abort(), 15_000);
    const result = await requestCardUnlock(cardId, input, controller.signal);
    clearTimeout(timeout);
    if (requestRef.current !== controller) return;
    requestRef.current = null;

    if (result.status === 'unlocked') {
      try { localStorage.setItem(`unlock_token_${cardId}`, result.token); } catch {
        // Open this verified visit even if browser storage is blocked.
      }
      setStatus('unlocked');
      revealTimer.current = setTimeout(onUnlock, reducedMotion ? 0 : 650);
      return;
    }

    setStatus('idle');
    if (result.status === 'incorrect') {
      setAttempts(current => current + 1);
      setError(isNumeric ? 'That code did not match. Try once more.' : 'Not quite the answer. Give it another try.');
      setInput('');
    } else {
      setError(result.status === 'rate_limited'
        ? 'A few too many tries. Please wait 10 minutes before trying again.'
        : 'We could not check that just now. Your answer is saved here; try again.');
    }
    inputRef.current?.focus();
  };

  return (
    <motion.section className="vc-private-lock" aria-labelledby="private-lock-title"
      initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: reducedMotion ? 0 : .3 }}>
      <motion.form className={`vc-private-lock__form ${status === 'unlocked' ? 'is-unlocked' : ''}`}
        onSubmit={handleSubmit} aria-busy={status === 'checking'}
        initial={{ opacity: 0, y: reducedMotion ? 0 : 16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="vc-private-lock__seal" aria-hidden="true"><span className="vc-private-lock__shackle" /><span className="vc-private-lock__body">♡</span></div>
        <p className="vc-private-lock__eyebrow">A little secret, just for you</p>
        <h1 id="private-lock-title">One little lock.<br />A whole lot of love.</h1>
        <p className="vc-private-lock__intro">{recipientName ? `${recipientName}, this` : 'This'} moment is yours.{creatorName ? ` ${creatorName} left you the key.` : 'Only you have the key.'}</p>

        <fieldset disabled={busy} className="vc-private-lock__fields">
          <legend>{isNumeric ? 'Your four-digit code' : unlockQuestion}</legend>
          {isNumeric ? (
            <div className={`vc-private-lock__pin ${error ? 'has-error' : ''}`}>
              <div className="vc-private-lock__digits" aria-hidden="true">
                {[0, 1, 2, 3].map(index => <span key={index} className={input.length > index ? 'is-filled' : ''}>{input.length > index ? '●' : '·'}</span>)}
              </div>
              <input ref={inputRef} type="password" inputMode="numeric" pattern="[0-9]{4}" maxLength={4}
                autoComplete="off" value={input} onChange={event => updateInput(event.target.value)}
                aria-label="Four-digit private code" aria-invalid={!!error} aria-describedby="private-lock-feedback" />
            </div>
          ) : (
            <input ref={inputRef} className="vc-private-lock__answer" type="text" maxLength={80}
              autoComplete="off" autoCapitalize="none" spellCheck={false}
              value={input} onChange={event => updateInput(event.target.value)}
              aria-label="Your secret answer" aria-invalid={!!error} aria-describedby="private-lock-feedback"
              placeholder="Something only you would know..." />
          )}
          {isNumeric && <div className="vc-private-lock__keypad" aria-label="Code keypad">
            {[1, 2, 3, 4, 5, 6, 7, 8, 9].map(number => <button key={number} type="button" onClick={() => updateInput(`${input}${number}`)}>{number}</button>)}
            <span aria-hidden="true" />
            <button type="button" onClick={() => updateInput(`${input}0`)}>0</button>
            <button type="button" onClick={() => updateInput(input.slice(0, -1))} aria-label="Delete last digit" title="Delete last digit">⌫</button>
          </div>}
        </fieldset>

        <div id="private-lock-feedback" className="vc-private-lock__feedback" aria-live="polite" role="status">
          {status === 'unlocked' ? 'It is you. Opening your little moment...' : error || (attempts >= 3 ? `A little help? Ask ${creatorName || 'the sender'} for the key.` : 'Some things are meant for just two people.')}
        </div>
        <button className="vc-private-lock__submit" type="submit" disabled={!valid || busy}>
          {status === 'unlocked' ? 'Unlocked' : status === 'checking' ? 'Checking your key...' : 'Unlock my moment'}
        </button>
      </motion.form>
    </motion.section>
  );
}
