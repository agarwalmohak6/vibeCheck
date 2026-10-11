'use client';

import { FormEvent, useEffect, useState } from 'react';

type ManualPaymentSubmission = {
  id: string;
  card_id: string;
  payment_reference: string;
  status: string;
  created_at: string;
  verified_at: string | null;
  card: {
    recipient_name: string;
    creator_name: string;
    template_type: string;
    tier_selected: string;
    is_paid: boolean;
    expires_at?: string | null;
  } | null;
};

type AdminCard = {
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
  account_id: string | null;
};

type PaymentsResponse = {
  success?: boolean;
  admin_email?: string;
  payments?: ManualPaymentSubmission[];
  error?: string;
};

type CardsResponse = {
  success?: boolean;
  admin_email?: string;
  cards?: AdminCard[];
  error?: string;
};

type VerifyResponse = {
  success?: boolean;
  card_id?: string;
  payment_reference?: string;
  error?: string;
};

type CleanupResponse = {
  success?: boolean;
  cards_deleted?: number;
  payments_deleted?: number;
  error?: string;
};

type OtpResponse = {
  success?: boolean;
  email?: string;
  email_sent?: boolean;
  error?: string;
};

const ADMIN_EMAIL = 'agarwalmohak6@gmail.com';

function formatDate(value: string | null | undefined) {
  if (!value) return 'Not set';
  try {
    return new Intl.DateTimeFormat('en-IN', {
      dateStyle: 'medium',
      timeStyle: 'short',
    }).format(new Date(value));
  } catch {
    return value;
  }
}

function normalizeUtr(value: string) {
  return value.trim().replace(/\s+/g, '').toUpperCase();
}

function getBaseUrl() {
  if (typeof window === 'undefined') return '';
  return window.location.origin;
}

export default function AdminDashboard() {
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [manualUtr, setManualUtr] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [payments, setPayments] = useState<ManualPaymentSubmission[]>([]);
  const [cards, setCards] = useState<AdminCard[]>([]);
  const [status, setStatus] = useState<'checking' | 'login' | 'ready'>('checking');
  const [loading, setLoading] = useState(false);
  const [cardsLoading, setCardsLoading] = useState(false);
  const [verifyingRef, setVerifyingRef] = useState('');
  const [cleanupConfirm, setCleanupConfirm] = useState('');
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');

  const loadPayments = async () => {
    const res = await fetch('/api/admin/payments?limit=100', { cache: 'no-store' });
    const data = await res.json() as PaymentsResponse;

    if (res.status === 401) {
      setStatus('login');
      setAdminEmail('');
      setPayments([]);
      setCards([]);
      return;
    }

    if (!res.ok) {
      throw new Error(data.error || 'Could not load admin payments.');
    }

    setAdminEmail(data.admin_email || ADMIN_EMAIL);
    setPayments(data.payments || []);
    setStatus('ready');
  };

  const loadCards = async () => {
    setCardsLoading(true);
    try {
      const res = await fetch('/api/admin/cards?limit=200', { cache: 'no-store' });
      const data = await res.json() as CardsResponse;

      if (res.status === 401) {
        setStatus('login');
        setAdminEmail('');
        setPayments([]);
        setCards([]);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Could not load admin cards.');
      }

      setAdminEmail(data.admin_email || ADMIN_EMAIL);
      setCards(data.cards || []);
      setStatus('ready');
    } finally {
      setCardsLoading(false);
    }
  };

  const loadAdminData = async () => {
    await Promise.all([loadPayments(), loadCards()]);
  };

  useEffect(() => {
    const timer = window.setTimeout(() => {
      loadAdminData().catch((err: Error) => {
        setError(err.message);
        setStatus('login');
      });
    }, 0);

    return () => window.clearTimeout(timer);
    // loadAdminData is intentionally run once when the admin surface mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestOtp = async () => {
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const res = await fetch('/api/admin/request-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: ADMIN_EMAIL }),
      });
      const data = await res.json() as OtpResponse;

      if (!res.ok) {
        setError(data.error || 'Could not send OTP.');
        return;
      }

      setOtpRequested(true);
      setNotice(data.email_sent === false
        ? `Local OTP generated for ${data.email || ADMIN_EMAIL}. Check the dev server logs.`
        : `OTP sent to ${data.email || ADMIN_EMAIL}.`);
    } catch {
      setError('Network issue while sending OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ otp }),
      });
      const data = await res.json() as PaymentsResponse;

      if (!res.ok) {
        setError(data.error || 'OTP login failed.');
        return;
      }

      setOtp('');
      setOtpRequested(false);
      setNotice('Admin session started.');
      await loadAdminData();
    } catch {
      setError('Network issue while verifying OTP.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setStatus('login');
    setAdminEmail('');
    setPayments([]);
    setCards([]);
    setOtp('');
    setOtpRequested(false);
    setNotice('Logged out.');
  };

  const verifyUtr = async (utr: string) => {
    const normalized = normalizeUtr(utr);
    if (normalized.length < 6) {
      setError('Enter a valid UTR or reference number.');
      return;
    }

    setVerifyingRef(normalized);
    setError('');
    setNotice('');

    try {
      const res = await fetch('/api/admin/verify-utr', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ utr: normalized }),
      });
      const data = await res.json() as VerifyResponse;

      if (!res.ok) {
        setError(data.error || 'Could not approve this UTR.');
        return;
      }

      setNotice(`Approved ${data.payment_reference || normalized}. Card ${data.card_id || ''} is unlocked.`);
      setManualUtr('');
      await loadAdminData();
    } catch {
      setError('Network issue while approving UTR.');
    } finally {
      setVerifyingRef('');
    }
  };

  const handleCleanup = async () => {
    setCleanupLoading(true);
    setError('');
    setNotice('');

    try {
      const res = await fetch('/api/admin/cleanup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ confirm: cleanupConfirm }),
      });
      const data = await res.json() as CleanupResponse;

      if (!res.ok) {
        setError(data.error || 'Cleanup failed.');
        return;
      }

      setCleanupConfirm('');
      setNotice(`Cleared ${data.cards_deleted || 0} cards and ${data.payments_deleted || 0} payments.`);
      await loadAdminData();
    } catch {
      setError('Network issue while clearing test data.');
    } finally {
      setCleanupLoading(false);
    }
  };

  const pendingCount = payments.filter((payment) => payment.status !== 'paid').length;
  const paidCount = payments.filter((payment) => payment.status === 'paid').length;
  const paidCards = cards.filter((card) => card.is_paid).length;
  const conversionRate = cards.length ? Math.round((paidCards / cards.length) * 100) : 0;

  return (
    <main className="min-h-screen overflow-hidden bg-[#05070d] text-slate-100">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(56,189,248,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(56,189,248,0.045)_1px,transparent_1px)] bg-[size:38px_38px]" />
        <div className="absolute -left-24 top-[-12%] h-96 w-96 rounded-full bg-cyan-500/20 blur-3xl" />
        <div className="absolute right-[-8%] top-10 h-96 w-96 rounded-full bg-fuchsia-500/14 blur-3xl" />
        <div className="absolute bottom-[-14%] left-[35%] h-96 w-96 rounded-full bg-emerald-400/12 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(14,165,233,0.16),transparent_30%),radial-gradient(circle_at_80%_40%,rgba(168,85,247,0.12),transparent_28%)]" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-[1.5rem] border border-cyan-400/20 bg-slate-950/78 p-5 shadow-2xl shadow-cyan-950/40 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-cyan-300">VibeCheck admin service</p>
            <h1 className="mt-2 font-[var(--font-outfit)] text-4xl font-black leading-none text-white sm:text-5xl">
              Payment Ops Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-bold text-slate-300">
              OTP-gated control room for UPI verification, test-mode skips, card inventory, and delivery links.
            </p>
          </div>

          {status === 'ready' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-cyan-400/20 bg-white/[0.04] px-4 py-3 font-mono text-sm font-black text-cyan-100 shadow-lg shadow-cyan-950/30">
                <span className="block text-[10px] uppercase tracking-[0.2em] text-slate-500">Signed in</span>
                {adminEmail}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-slate-700 bg-slate-900 px-4 py-3 text-sm font-black text-slate-200 shadow-lg shadow-slate-950 transition hover:-translate-y-0.5 hover:border-cyan-400/40"
              >
                Logout
              </button>
            </div>
          )}
        </header>

        {status === 'checking' && (
          <div className="grid flex-1 place-items-center">
            <div className="rounded-[1.5rem] border border-cyan-400/20 bg-slate-950/80 p-8 text-center shadow-2xl shadow-cyan-950/40">
              <p className="font-mono text-sm font-black uppercase tracking-[0.22em] text-cyan-300">Checking admin session</p>
              <p className="mt-3 text-slate-400">One moment...</p>
            </div>
          </div>
        )}

        {status === 'login' && (
          <div className="grid flex-1 place-items-center">
            <form
              onSubmit={handleLogin}
              className="w-full max-w-xl rounded-[1.75rem] border border-cyan-400/20 bg-slate-950/86 p-6 shadow-2xl shadow-cyan-950/40 backdrop-blur"
            >
              <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-cyan-300">Owner OTP only</p>
              <h2 className="mt-3 font-[var(--font-outfit)] text-4xl font-black text-white">VibeCheck Ops Login</h2>
              <p className="mt-2 text-sm font-bold text-slate-300">
                No password field. No shared admin secret. A fresh OTP is always sent to {ADMIN_EMAIL}.
              </p>

              <div className="mt-6 rounded-2xl border border-slate-800 bg-white/[0.035] p-4">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-slate-500">OTP destination</p>
                <p className="mt-1 break-all font-mono text-sm font-black text-cyan-100">{ADMIN_EMAIL}</p>
              </div>

              <button
                type="button"
                onClick={() => void requestOtp()}
                disabled={loading}
                className="mt-4 w-full rounded-2xl border border-cyan-400/30 bg-cyan-400/10 px-5 py-4 font-mono text-sm font-black uppercase tracking-[0.14em] text-cyan-100 shadow-xl shadow-cyan-950/30 transition hover:-translate-y-0.5 hover:bg-cyan-400/15 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Sending OTP...' : otpRequested ? 'Resend OTP' : 'Send OTP'}
              </button>

              <label className="mt-4 block font-mono text-xs font-black uppercase tracking-[0.18em] text-slate-500">
                6-digit OTP
              </label>
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                className="mt-2 w-full rounded-2xl border border-slate-700 bg-black/40 px-4 py-4 text-center font-mono text-3xl font-black tracking-[0.35em] text-white outline-none transition placeholder:text-slate-700 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-500/20"
              />

              <button
                type="submit"
                disabled={loading || !otpRequested || otp.length !== 6}
                className="mt-6 w-full rounded-2xl bg-linear-to-r from-cyan-400 via-sky-500 to-fuchsia-500 px-5 py-4 font-mono text-sm font-black uppercase tracking-[0.16em] text-slate-950 shadow-xl shadow-cyan-950/50 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Verifying OTP...' : 'Enter dashboard'}
              </button>

              {(notice || error) && (
                <p className={`mt-4 text-sm font-bold ${error ? 'text-rose-300' : 'text-emerald-300'}`}>
                  {error || notice}
                </p>
              )}
            </form>
          </div>
        )}

        {status === 'ready' && (
          <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
            <aside className="space-y-5">
              <div className="rounded-[1.5rem] border border-cyan-400/20 bg-slate-950/82 p-5 shadow-2xl shadow-cyan-950/35 backdrop-blur">
                <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Quick approve</p>
                <h2 className="mt-2 font-[var(--font-outfit)] text-3xl font-black text-white">Verify a UTR</h2>
                <p className="mt-2 text-sm font-bold text-slate-400">
                  Paste a submitted UTR. If it exists, the card unlocks immediately.
                </p>
                <div className="mt-4 flex gap-2">
                  <input
                    value={manualUtr}
                    onChange={(event) => setManualUtr(event.target.value)}
                    placeholder="UTR / ref no."
                    className="min-w-0 flex-1 rounded-2xl border border-slate-700 bg-black/40 px-4 py-3 font-mono text-sm font-black uppercase text-white outline-none transition placeholder:text-slate-600 focus:border-cyan-300 focus:ring-4 focus:ring-cyan-500/20"
                  />
                  <button
                    type="button"
                    onClick={() => verifyUtr(manualUtr)}
                    disabled={Boolean(verifyingRef)}
                    className="rounded-2xl bg-linear-to-r from-emerald-300 via-cyan-300 to-sky-400 px-4 py-3 font-mono text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Approve
                  </button>
                </div>
                {(notice || error) && (
                  <p className={`mt-4 text-sm font-bold ${error ? 'text-rose-300' : 'text-emerald-300'}`}>
                    {error || notice}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[1.25rem] border border-amber-300/20 bg-amber-300/[0.07] p-4 shadow-xl shadow-slate-950/30">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-amber-200">Pending UTR</p>
                  <p className="mt-1 text-4xl font-black text-amber-200">{pendingCount}</p>
                </div>
                <div className="rounded-[1.25rem] border border-emerald-300/20 bg-emerald-300/[0.07] p-4 shadow-xl shadow-slate-950/30">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-emerald-200">Paid UTR</p>
                  <p className="mt-1 text-4xl font-black text-emerald-200">{paidCount}</p>
                </div>
                <div className="rounded-[1.25rem] border border-cyan-300/20 bg-cyan-300/[0.07] p-4 shadow-xl shadow-slate-950/30">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-cyan-200">Cards</p>
                  <p className="mt-1 text-4xl font-black text-cyan-200">{cards.length}</p>
                </div>
                <div className="rounded-[1.25rem] border border-fuchsia-300/20 bg-fuchsia-300/[0.07] p-4 shadow-xl shadow-slate-950/30">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-fuchsia-200">Conversion</p>
                  <p className="mt-1 text-4xl font-black text-fuchsia-200">{conversionRate}%</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-rose-400/20 bg-rose-500/[0.07] p-5 shadow-xl shadow-slate-950/30">
                <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-rose-300">Danger zone</p>
                <h2 className="mt-2 font-[var(--font-outfit)] text-3xl font-black text-white">Clear test data</h2>
                <p className="mt-2 text-sm font-bold text-rose-100/75">
                  Deletes cards and payment rows. Use only when you intentionally want a clean testing slate.
                </p>
                <input
                  value={cleanupConfirm}
                  onChange={(event) => setCleanupConfirm(event.target.value)}
                  placeholder="Type CLEAR_TEST_DATA"
                  className="mt-4 w-full rounded-2xl border border-rose-300/20 bg-black/40 px-4 py-3 font-mono text-sm font-black text-white outline-none transition placeholder:text-slate-600 focus:border-rose-300 focus:ring-4 focus:ring-rose-500/20"
                />
                <button
                  type="button"
                  onClick={handleCleanup}
                  disabled={cleanupLoading || cleanupConfirm !== 'CLEAR_TEST_DATA'}
                  className="mt-3 w-full rounded-2xl border border-rose-300/30 bg-rose-400/15 px-4 py-3 font-mono text-sm font-black text-rose-100 shadow-lg shadow-slate-950 transition hover:-translate-y-0.5 hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cleanupLoading ? 'Clearing...' : 'Clear cards and payments'}
                </button>
              </div>
            </aside>

            <section className="rounded-[1.5rem] border border-cyan-400/20 bg-slate-950/82 p-4 shadow-2xl shadow-cyan-950/35 backdrop-blur sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-cyan-300">Recent direct UPI</p>
                  <h2 className="mt-2 font-[var(--font-outfit)] text-3xl font-black text-white">Submitted references</h2>
                </div>
                <button
                  type="button"
                  onClick={() => loadAdminData().catch((err: Error) => setError(err.message))}
                  className="rounded-2xl border border-cyan-400/20 bg-white/[0.04] px-4 py-3 font-mono text-sm font-black text-cyan-100 shadow-lg shadow-slate-950 transition hover:-translate-y-0.5 hover:border-cyan-300/40"
                >
                  Refresh
                </button>
              </div>

              <div className="max-h-[68vh] space-y-3 overflow-y-auto pr-1">
                {payments.length === 0 && (
                  <div className="rounded-[1.25rem] border border-dashed border-cyan-400/20 bg-white/[0.035] p-8 text-center">
                    <p className="text-lg font-black text-white">No UTR submissions yet.</p>
                    <p className="mt-2 text-sm font-bold text-slate-400">
                      New references will appear here after users submit them from the payment screen.
                    </p>
                  </div>
                )}

                {payments.map((payment) => {
                  const isPaid = payment.status === 'paid' || payment.card?.is_paid;
                  const title = payment.card
                    ? `${payment.card.creator_name} to ${payment.card.recipient_name}`
                    : payment.card_id;

                  return (
                    <article
                      key={payment.id}
                      className="rounded-[1.25rem] border border-slate-800 bg-white/[0.045] p-4 shadow-xl shadow-slate-950/30"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.12em] ${
                              isPaid
                                ? 'bg-emerald-300/12 text-emerald-200'
                                : 'bg-amber-300/12 text-amber-200'
                            }`}>
                              {isPaid ? 'Paid' : payment.status}
                            </span>
                            <span className="rounded-full bg-cyan-300/10 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.12em] text-cyan-200">
                              {payment.card?.template_type || 'Card'}
                            </span>
                          </div>
                          <h3 className="mt-3 truncate text-xl font-black text-white">{title}</h3>
                          <p className="mt-1 break-all font-mono text-sm font-black text-cyan-200">
                            {payment.payment_reference || 'Missing reference'}
                          </p>
                          <p className="mt-2 text-xs font-bold text-slate-400">
                            Submitted {formatDate(payment.created_at)}
                            {payment.verified_at ? ` - Verified ${formatDate(payment.verified_at)}` : ''}
                          </p>
                          <p className="mt-1 break-all font-mono text-[11px] font-bold text-slate-500">Card ID: {payment.card_id}</p>
                        </div>

                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => verifyUtr(payment.payment_reference)}
                            disabled={verifyingRef === payment.payment_reference}
                            className="rounded-2xl bg-linear-to-r from-emerald-300 via-cyan-300 to-sky-400 px-4 py-3 font-mono text-sm font-black text-slate-950 shadow-lg shadow-cyan-950/40 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {verifyingRef === payment.payment_reference ? 'Approving...' : 'Approve'}
                          </button>
                        )}
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>

            <section className="rounded-[1.5rem] border border-fuchsia-400/20 bg-slate-950/82 p-4 shadow-2xl shadow-fuchsia-950/25 backdrop-blur sm:p-5 lg:col-start-2">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-fuchsia-300">Admin inventory</p>
                  <h2 className="mt-2 font-[var(--font-outfit)] text-3xl font-black text-white">All cards</h2>
                  <p className="mt-1 text-xs font-bold text-slate-400">
                    Admin-only list. Private creator views never receive this global inventory.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadCards().catch((err: Error) => setError(err.message))}
                  className="rounded-2xl border border-fuchsia-400/20 bg-white/[0.04] px-4 py-3 font-mono text-sm font-black text-fuchsia-100 shadow-lg shadow-slate-950 transition hover:-translate-y-0.5 hover:border-fuchsia-300/40"
                >
                  {cardsLoading ? 'Loading...' : 'Refresh cards'}
                </button>
              </div>

              <div className="max-h-[68vh] space-y-3 overflow-y-auto pr-1">
                {cards.length === 0 && (
                  <div className="rounded-[1.25rem] border border-dashed border-fuchsia-400/20 bg-white/[0.035] p-8 text-center">
                    <p className="text-lg font-black text-white">No cards found.</p>
                    <p className="mt-2 text-sm font-bold text-slate-400">
                      Cards created from the builder will show here for admin management.
                    </p>
                  </div>
                )}

                {cards.map((card) => {
                  const baseUrl = getBaseUrl();
                  const recipientUrl = `${baseUrl}/card/${card.id}`;
                  const creatorUrl = `${recipientUrl}?ct=${encodeURIComponent(card.creator_token)}`;
                  const roomUrl = `${creatorUrl}&room=chat`;

                  return (
                    <article
                      key={card.id}
                      className="rounded-[1.25rem] border border-slate-800 bg-white/[0.045] p-4 shadow-xl shadow-slate-950/30"
                    >
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.12em] ${
                              card.is_paid ? 'bg-emerald-300/12 text-emerald-200' : 'bg-amber-300/12 text-amber-200'
                            }`}>
                              {card.is_paid ? 'Paid' : card.payment_status}
                            </span>
                            <span className="rounded-full bg-cyan-300/10 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.12em] text-cyan-200">
                              {card.template_type}
                            </span>
                            <span className="rounded-full bg-fuchsia-300/10 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.12em] text-fuchsia-200">
                              {card.tier_selected}
                            </span>
                          </div>
                          <h3 className="mt-3 truncate text-xl font-black text-white">
                            {card.creator_name} to {card.recipient_name}
                          </h3>
                          <p className="mt-1 text-xs font-bold text-slate-400">
                            Created {formatDate(card.created_at)} - Expires {formatDate(card.expires_at)}
                          </p>
                          <p className="mt-1 break-all font-mono text-[11px] font-bold text-slate-500">
                            Card ID: {card.id}
                          </p>
                          <p className="mt-1 break-all font-mono text-[11px] font-bold text-slate-500">
                            Account: {card.account_id || 'Unclaimed / guest'}
                          </p>
                          {card.payment_reference && (
                            <p className="mt-1 break-all font-mono text-[11px] font-black text-cyan-200">
                              UTR: {card.payment_reference}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3 xl:w-[430px]">
                          <a href={recipientUrl} className="rounded-2xl border border-cyan-400/20 bg-cyan-300/10 px-4 py-3 text-center font-mono text-xs font-black text-cyan-100 transition hover:border-cyan-300/50">
                            Recipient
                          </a>
                          <a href={creatorUrl} className="rounded-2xl border border-slate-700 bg-white/[0.045] px-4 py-3 text-center font-mono text-xs font-black text-slate-200 transition hover:border-slate-500">
                            Creator
                          </a>
                          <a href={roomUrl} className="rounded-2xl bg-linear-to-r from-fuchsia-300 via-cyan-300 to-emerald-300 px-4 py-3 text-center font-mono text-xs font-black text-slate-950 transition hover:-translate-y-0.5">
                            Room
                          </a>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          </div>
        )}
      </section>
    </main>
  );
}
