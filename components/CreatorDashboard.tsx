'use client';

import Link from 'next/link';
import { FormEvent, useEffect, useState } from 'react';

type CreatorAccount = {
  id: string;
  email: string | null;
  phone: string | null;
  display_name: string | null;
};

type CreatorCard = {
  id: string;
  recipient_name: string;
  creator_name: string;
  template_type: string;
  tier_selected: string;
  is_paid: boolean;
  payment_status: string;
  payment_id: string | null;
  payment_reference: string | null;
  expires_at?: string | null;
  created_at: string;
  creator_token: string;
};

type AccountResponse = {
  success?: boolean;
  account?: CreatorAccount;
  cards?: CreatorCard[];
  error?: string;
};

function splitIdentifier(identifier: string) {
  const cleaned = identifier.trim();
  if (cleaned.includes('@')) return { email: cleaned, phone: '' };
  return { email: '', phone: cleaned };
}

function formatDate(value: string | null | undefined) {
  if (!value) return 'No expiry';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function getBaseUrl() {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

export default function CreatorDashboard() {
  const [status, setStatus] = useState<'checking' | 'login' | 'ready'>('checking');
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [account, setAccount] = useState<CreatorAccount | null>(null);
  const [cards, setCards] = useState<CreatorCard[]>([]);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [copiedId, setCopiedId] = useState('');

  const loadAccount = async () => {
    const res = await fetch('/api/account/me', { cache: 'no-store' });
    const data = await res.json() as AccountResponse;

    if (res.status === 401) {
      setStatus('login');
      setAccount(null);
      setCards([]);
      return false;
    }

    if (!res.ok) throw new Error(data.error || 'Could not load dashboard.');

    setAccount(data.account || null);
    setCards(data.cards || []);
    setStatus('ready');
    return true;
  };

  useEffect(() => {
    loadAccount()
      .catch((err: Error) => {
        setError(err.message);
        setStatus('login');
      });
  }, []);

  const handleAuth = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    const { email, phone } = splitIdentifier(identifier);
    try {
      const res = await fetch(mode === 'login' ? '/api/auth/login' : '/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, phone, password, name }),
      });
      const data = await res.json() as AccountResponse;

      if (!res.ok) {
        setError(data.error || 'Could not continue.');
        return;
      }

      setPassword('');
      setNotice(mode === 'login' ? 'Welcome back.' : 'Account created.');
      await loadAccount();
    } catch {
      setError('Network issue while signing in.');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setStatus('login');
    setAccount(null);
    setCards([]);
    setNotice('Logged out.');
  };

  const copyText = async (id: string, value: string) => {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(value);
    } else {
      const textarea = document.createElement('textarea');
      textarea.value = value;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    }
    setCopiedId(id);
    setTimeout(() => setCopiedId(''), 1800);
  };

  const paidCount = cards.filter((card) => card.is_paid).length;
  const pendingCount = cards.length - paidCount;

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff0f6] text-[#3d1a2e]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-24 -top-24 h-96 w-96 rounded-full bg-pink-300/45 blur-3xl" />
        <div className="absolute right-[-6rem] top-20 h-96 w-96 rounded-full bg-amber-200/55 blur-3xl" />
        <div className="absolute bottom-[-8rem] left-1/3 h-96 w-96 rounded-full bg-rose-300/35 blur-3xl" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-pink-200/80 bg-white/75 p-5 shadow-2xl shadow-pink-200/40 backdrop-blur lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link href="/" className="text-xs font-black uppercase tracking-[0.24em] text-pink-500">
              VibeCheck
            </Link>
            <h1 className="mt-2 font-[var(--font-display)] text-5xl font-black leading-none">
              Your creator dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-bold text-[#7b3f6e]">
              Track cards you created, payment status, recipient links, private creator rooms, and reactions.
            </p>
          </div>

          {status === 'ready' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-pink-200 bg-white/80 px-4 py-3 text-sm font-black shadow-lg shadow-pink-100">
                <span className="block text-[10px] uppercase tracking-[0.2em] text-[#9e6b8a]">Logged in</span>
                {account?.display_name || account?.email || account?.phone}
              </div>
              <Link
                href="/customize?new=1"
                className="rounded-2xl bg-linear-to-r from-pink-500 to-amber-500 px-5 py-3 text-sm font-black text-white shadow-lg shadow-pink-300/40"
              >
                Create card
              </Link>
              <button
                type="button"
                onClick={logout}
                className="rounded-2xl border border-pink-200 bg-white px-4 py-3 text-sm font-black text-[#7b3f6e] shadow-lg shadow-pink-100"
              >
                Logout
              </button>
            </div>
          )}
        </header>

        {status === 'checking' && (
          <div className="grid flex-1 place-items-center">
            <p className="rounded-3xl border border-pink-200 bg-white/75 px-6 py-5 text-sm font-black shadow-xl shadow-pink-100">
              Loading dashboard...
            </p>
          </div>
        )}

        {status === 'login' && (
          <div className="grid flex-1 place-items-center">
            <form
              onSubmit={handleAuth}
              className="w-full max-w-xl rounded-[2rem] border border-pink-200/80 bg-white/85 p-6 shadow-2xl shadow-pink-200/50 backdrop-blur"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-500">
                Save your cards
              </p>
              <h2 className="mt-3 font-[var(--font-display)] text-4xl font-black">
                {mode === 'login' ? 'Log in' : 'Create creator account'}
              </h2>
              <p className="mt-2 text-sm font-bold text-[#7b3f6e]">
                Use email or mobile number with a password. Future paid cards will stay here.
              </p>

              {mode === 'register' && (
                <>
                  <label className="mt-6 block text-xs font-black uppercase tracking-[0.18em] text-[#9e6b8a]">Name</label>
                  <input
                    value={name}
                    onChange={(event) => setName(event.target.value)}
                    placeholder="Mohak"
                    className="mt-2 w-full rounded-2xl border border-pink-200 bg-white px-4 py-3 text-base font-black outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60"
                  />
                </>
              )}

              <label className="mt-5 block text-xs font-black uppercase tracking-[0.18em] text-[#9e6b8a]">
                Email or mobile number
              </label>
              <input
                value={identifier}
                onChange={(event) => setIdentifier(event.target.value)}
                placeholder="agarwalmohak6@gmail.com or 9565814426"
                autoComplete="username"
                className="mt-2 w-full rounded-2xl border border-pink-200 bg-white px-4 py-3 text-base font-black outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60"
              />

              <label className="mt-5 block text-xs font-black uppercase tracking-[0.18em] text-[#9e6b8a]">
                Password
              </label>
              <input
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                type="password"
                autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
                className="mt-2 w-full rounded-2xl border border-pink-200 bg-white px-4 py-3 text-base font-black outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60"
              />

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-linear-to-r from-pink-500 to-amber-500 px-5 py-4 text-base font-black text-white shadow-xl shadow-pink-300/50 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Please wait...' : mode === 'login' ? 'Log in' : 'Create account'}
              </button>

              <button
                type="button"
                onClick={() => {
                  setMode(mode === 'login' ? 'register' : 'login');
                  setError('');
                  setNotice('');
                }}
                className="mt-4 w-full text-sm font-black text-pink-500 underline underline-offset-4"
              >
                {mode === 'login' ? 'New here? Create account' : 'Already have an account? Log in'}
              </button>

              {(notice || error) && (
                <p className={`mt-4 text-sm font-bold ${error ? 'text-red-600' : 'text-emerald-700'}`}>
                  {error || notice}
                </p>
              )}
            </form>
          </div>
        )}

        {status === 'ready' && (
          <div className="grid gap-5 lg:grid-cols-[0.35fr_0.65fr]">
            <aside className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[1.5rem] border border-pink-200 bg-white/75 p-4 shadow-xl shadow-pink-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9e6b8a]">Paid</p>
                  <p className="mt-1 text-4xl font-black text-emerald-600">{paidCount}</p>
                </div>
                <div className="rounded-[1.5rem] border border-pink-200 bg-white/75 p-4 shadow-xl shadow-pink-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9e6b8a]">Pending</p>
                  <p className="mt-1 text-4xl font-black text-amber-600">{pendingCount}</p>
                </div>
              </div>
              <div className="rounded-[2rem] border border-pink-200 bg-white/75 p-5 shadow-xl shadow-pink-100">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-500">Ownership</p>
                <p className="mt-2 text-sm font-bold leading-relaxed text-[#7b3f6e]">
                  This dashboard now shows only cards created while logged into this account. Admin-only controls live separately.
                </p>
                <Link
                  href="/customize?new=1"
                  className="mt-4 inline-flex w-full justify-center rounded-2xl border border-pink-200 bg-white px-4 py-3 text-sm font-black text-pink-500"
                >
                  Create another card
                </Link>
              </div>
            </aside>

            <section className="rounded-[2rem] border border-pink-200/80 bg-white/80 p-4 shadow-2xl shadow-pink-200/40 backdrop-blur sm:p-5">
              <div className="mb-4 flex items-end justify-between gap-3">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-500">Your cards</p>
                  <h2 className="mt-2 font-[var(--font-display)] text-3xl font-black">Created by you</h2>
                </div>
                <button
                  type="button"
                  onClick={() => loadAccount()}
                  className="rounded-2xl border border-pink-200 bg-white px-4 py-3 text-sm font-black text-[#7b3f6e] shadow-lg shadow-pink-100"
                >
                  Refresh
                </button>
              </div>

              {cards.length === 0 ? (
                <div className="rounded-[1.5rem] border border-dashed border-pink-200 bg-pink-50/60 p-8 text-center">
                  <p className="text-lg font-black">No cards here yet.</p>
                  <p className="mt-2 text-sm font-bold text-[#7b3f6e]">Create your next VibeCheck while logged in.</p>
                  <Link href="/customize?new=1" className="mt-5 inline-flex rounded-2xl bg-linear-to-r from-pink-500 to-amber-500 px-5 py-3 text-sm font-black text-white">
                    Create card
                  </Link>
                </div>
              ) : (
                <div className="space-y-3">
                  {cards.map((card) => {
                    const baseUrl = getBaseUrl();
                    const recipientUrl = `${baseUrl}/card/${card.id}`;
                    const creatorUrl = `${recipientUrl}?ct=${encodeURIComponent(card.creator_token)}`;
                    const roomUrl = `${creatorUrl}&room=chat`;

                    return (
                      <article key={card.id} className="rounded-[1.5rem] border border-pink-200 bg-white p-4 shadow-xl shadow-pink-100/70">
                        <div className="flex flex-col gap-4 xl:flex-row xl:items-start xl:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${
                                card.is_paid ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                              }`}>
                                {card.is_paid ? 'Paid' : card.payment_status}
                              </span>
                              <span className="rounded-full bg-pink-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-pink-500">
                                {card.template_type}
                              </span>
                            </div>
                            <h3 className="mt-3 truncate text-xl font-black">
                              {card.creator_name} to {card.recipient_name}
                            </h3>
                            <p className="mt-1 text-xs font-bold text-[#7b3f6e]">
                              Created {formatDate(card.created_at)} - Expires {formatDate(card.expires_at)}
                            </p>
                            {card.payment_reference && (
                              <p className="mt-1 font-mono text-[11px] font-black text-pink-500">UTR: {card.payment_reference}</p>
                            )}
                          </div>

                          <div className="grid gap-2 sm:grid-cols-2 xl:min-w-[360px]">
                            <Link href={recipientUrl} className="rounded-2xl border border-pink-200 bg-pink-50 px-4 py-3 text-center text-xs font-black text-pink-600">
                              Recipient link
                            </Link>
                            <Link href={creatorUrl} className="rounded-2xl border border-pink-200 bg-white px-4 py-3 text-center text-xs font-black text-[#7b3f6e]">
                              Creator view
                            </Link>
                            <Link href={roomUrl} className="rounded-2xl border border-pink-200 bg-white px-4 py-3 text-center text-xs font-black text-[#7b3f6e]">
                              Chat room
                            </Link>
                            <button
                              type="button"
                              onClick={() => copyText(card.id, creatorUrl)}
                              className="rounded-2xl bg-linear-to-r from-pink-500 to-amber-500 px-4 py-3 text-xs font-black text-white"
                            >
                              {copiedId === card.id ? 'Copied' : 'Copy creator link'}
                            </button>
                          </div>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
