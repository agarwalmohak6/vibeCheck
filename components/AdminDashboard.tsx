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

export default function AdminDashboard({ configuredAdminEmail }: { configuredAdminEmail: string }) {
  const [otp, setOtp] = useState('');
  const [otpRequested, setOtpRequested] = useState(false);
  const [manualUtr, setManualUtr] = useState('');
  const [adminEmail, setAdminEmail] = useState(configuredAdminEmail);
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
      setAdminEmail(configuredAdminEmail);
      setPayments([]);
      setCards([]);
      return;
    }

    if (!res.ok) {
      throw new Error(data.error || 'Could not load admin payments.');
    }

    setAdminEmail(data.admin_email || configuredAdminEmail);
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
        setAdminEmail(configuredAdminEmail);
        setPayments([]);
        setCards([]);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error || 'Could not load admin cards.');
      }

      setAdminEmail(data.admin_email || configuredAdminEmail);
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
        body: JSON.stringify({}),
      });
      const data = await res.json() as OtpResponse;

      if (!res.ok || !data.success || !data.email_sent) {
        setError(data.error || 'Could not send OTP.');
        return;
      }

      setOtpRequested(true);
      setOtp('');
      setAdminEmail(data.email || configuredAdminEmail);
      setNotice(`OTP sent to ${data.email || configuredAdminEmail}. Check your inbox and spam folder.`);
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
    <main className="min-h-screen overflow-hidden bg-[var(--bg)] text-[var(--text2)]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute inset-0 bg-[linear-gradient(rgba(184,137,67,0.045)_1px,transparent_1px),linear-gradient(90deg,rgba(184,137,67,0.045)_1px,transparent_1px)] bg-[size:38px_38px]" />
        <div className="absolute -left-24 top-[-12%] h-96 w-96 rounded-full bg-[#efb3aa]/20 blur-3xl" />
        <div className="absolute right-[-8%] top-10 h-96 w-96 rounded-full bg-[#efb3aa]/20 blur-3xl" />
        <div className="absolute bottom-[-14%] left-[35%] h-96 w-96 rounded-full bg-emerald-400/12 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(233,173,145,0.16),transparent_30%),radial-gradient(circle_at_80%_40%,rgba(239,179,170,0.12),transparent_28%)]" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-7xl flex-col px-5 py-8 sm:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl shadow-[#bd8461]/10 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="font-mono text-xs font-black uppercase tracking-[0.28em] text-[var(--accent)]">VibeCheck admin service</p>
            <h1 className="mt-2 font-[var(--font-outfit)] text-4xl font-black leading-none text-[var(--text)] sm:text-5xl">
              Payment Ops Dashboard
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-bold text-[var(--text2)]">
              OTP-gated control room for UPI verification, test-mode skips, card inventory, and delivery links.
            </p>
          </div>

          {status === 'ready' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-[var(--border)] bg-white/[0.04] px-4 py-3 font-mono text-sm font-black text-[var(--accent)] shadow-lg shadow-[#bd8461]/10">
                <span className="block text-[10px] uppercase tracking-[0.2em] text-[var(--text2)]">Signed in</span>
                {adminEmail}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-sm font-black text-[var(--text2)] shadow-lg shadow-[#bd8461]/10 transition hover:-translate-y-0.5 hover:border-[var(--border)]"
              >
                Logout
              </button>
            </div>
          )}
        </header>

        {status === 'checking' && (
          <div className="grid flex-1 place-items-center">
            <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-8 text-center shadow-2xl shadow-[#bd8461]/10">
              <p className="font-mono text-sm font-black uppercase tracking-[0.22em] text-[var(--accent)]">Checking admin session</p>
              <p className="mt-3 text-[var(--text2)]">One moment...</p>
            </div>
          </div>
        )}

        {status === 'login' && (
          <div className="grid flex-1 place-items-center">
            <form
              onSubmit={handleLogin}
              className="w-full max-w-xl rounded-[1.75rem] border border-[var(--border)] bg-[var(--surface)] p-6 shadow-2xl shadow-[#bd8461]/10 backdrop-blur"
            >
              <p className="font-mono text-xs font-black uppercase tracking-[0.24em] text-[var(--accent)]">Owner OTP only</p>
              <h2 className="mt-3 font-[var(--font-outfit)] text-4xl font-black text-[var(--text)]">VibeCheck Ops Login</h2>
              <p className="mt-2 text-sm font-bold text-[var(--text2)]">
                Request a fresh one-time code at your configured owner email to sign in.
              </p>

              <div className="mt-6 rounded-2xl border border-[var(--border)] bg-white/[0.035] p-4">
                <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[var(--text2)]">OTP destination</p>
                <p className="mt-1 break-all font-mono text-sm font-black text-[var(--accent)]">{adminEmail}</p>
              </div>

              <button
                type="button"
                onClick={() => void requestOtp()}
                disabled={loading}
                className="mt-4 w-full rounded-2xl border border-[var(--border)] bg-[#efb3aa]/20 px-5 py-4 font-mono text-sm font-black uppercase tracking-[0.14em] text-[var(--accent)] shadow-xl shadow-[#bd8461]/10 transition hover:-translate-y-0.5 hover:bg-[#efb3aa]/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Sending OTP...' : otpRequested ? 'Resend OTP' : 'Send OTP'}
              </button>

              <label className="mt-4 block font-mono text-xs font-black uppercase tracking-[0.18em] text-[var(--text2)]">
                6-digit OTP
              </label>
              <input
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, '').slice(0, 6))}
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="000000"
                className="mt-2 w-full rounded-2xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-4 text-center font-mono text-3xl font-black tracking-[0.35em] text-[var(--text)] outline-none transition placeholder:text-[var(--text2)] focus:border-[var(--border)] focus:ring-4 focus:ring-[#efb3aa]/20"
              />

              <button
                type="submit"
                disabled={loading || !otpRequested || otp.length !== 6}
                className="mt-6 w-full rounded-2xl bg-linear-to-r from-[#f3b4a0] via-[#efb3aa] to-[#ebae91] px-5 py-4 font-mono text-sm font-black uppercase tracking-[0.16em] text-[var(--text2)] shadow-xl shadow-[#bd8461]/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? 'Verifying OTP...' : 'Enter dashboard'}
              </button>

              {(notice || error) && (
                <p className={`mt-4 text-sm font-bold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>
                  {error || notice}
                </p>
              )}
            </form>
          </div>
        )}

        {status === 'ready' && (
          <div className="grid gap-5 lg:grid-cols-[0.78fr_1.22fr]">
            <aside className="space-y-5">
              <div className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-5 shadow-2xl shadow-[#bd8461]/10 backdrop-blur">
                <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[var(--accent)]">Quick approve</p>
                <h2 className="mt-2 font-[var(--font-outfit)] text-3xl font-black text-[var(--text)]">Verify a UTR</h2>
                <p className="mt-2 text-sm font-bold text-[var(--text2)]">
                  Paste a submitted UTR. If it exists, the card unlocks immediately.
                </p>
                <div className="mt-4 flex gap-2">
                  <input
                    value={manualUtr}
                    onChange={(event) => setManualUtr(event.target.value)}
                    placeholder="UTR / ref no."
                    className="min-w-0 flex-1 rounded-2xl border border-[var(--border)] bg-[var(--surface2)] px-4 py-3 font-mono text-sm font-black uppercase text-[var(--text)] outline-none transition placeholder:text-[var(--text2)] focus:border-[var(--border)] focus:ring-4 focus:ring-[#efb3aa]/20"
                  />
                  <button
                    type="button"
                    onClick={() => verifyUtr(manualUtr)}
                    disabled={Boolean(verifyingRef)}
                    className="rounded-2xl bg-linear-to-r from-[#f3b4a0] via-[#efb3aa] to-[#ebae91] px-4 py-3 font-mono text-sm font-black text-[var(--text2)] shadow-lg shadow-[#bd8461]/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Approve
                  </button>
                </div>
                {(notice || error) && (
                  <p className={`mt-4 text-sm font-bold ${error ? 'text-rose-700' : 'text-emerald-700'}`}>
                    {error || notice}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[1.25rem] border border-amber-300/20 bg-amber-300/[0.07] p-4 shadow-xl shadow-[#bd8461]/10">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-amber-800">Pending UTR</p>
                  <p className="mt-1 text-4xl font-black text-amber-800">{pendingCount}</p>
                </div>
                <div className="rounded-[1.25rem] border border-emerald-300/20 bg-emerald-300/[0.07] p-4 shadow-xl shadow-[#bd8461]/10">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-emerald-700">Paid UTR</p>
                  <p className="mt-1 text-4xl font-black text-emerald-700">{paidCount}</p>
                </div>
                <div className="rounded-[1.25rem] border border-[var(--border)] bg-[#efb3aa]/20 p-4 shadow-xl shadow-[#bd8461]/10">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">Cards</p>
                  <p className="mt-1 text-4xl font-black text-[var(--accent)]">{cards.length}</p>
                </div>
                <div className="rounded-[1.25rem] border border-[var(--border)] bg-[#efb3aa]/20 p-4 shadow-xl shadow-[#bd8461]/10">
                  <p className="font-mono text-[10px] font-black uppercase tracking-[0.18em] text-[var(--accent)]">Conversion</p>
                  <p className="mt-1 text-4xl font-black text-[var(--accent)]">{conversionRate}%</p>
                </div>
              </div>

              <div className="rounded-[1.5rem] border border-rose-400/20 bg-rose-500/[0.07] p-5 shadow-xl shadow-[#bd8461]/10">
                <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-rose-700">Danger zone</p>
                <h2 className="mt-2 font-[var(--font-outfit)] text-3xl font-black text-[var(--text)]">Clear test data</h2>
                <p className="mt-2 text-sm font-bold text-rose-700">
                  Deletes cards and payment rows. Use only when you intentionally want a clean testing slate.
                </p>
                <input
                  value={cleanupConfirm}
                  onChange={(event) => setCleanupConfirm(event.target.value)}
                  placeholder="Type CLEAR_TEST_DATA"
                  className="mt-4 w-full rounded-2xl border border-rose-300/20 bg-[var(--surface2)] px-4 py-3 font-mono text-sm font-black text-[var(--text)] outline-none transition placeholder:text-[var(--text2)] focus:border-rose-300 focus:ring-4 focus:ring-rose-500/20"
                />
                <button
                  type="button"
                  onClick={handleCleanup}
                  disabled={cleanupLoading || cleanupConfirm !== 'CLEAR_TEST_DATA'}
                  className="mt-3 w-full rounded-2xl border border-rose-300/30 bg-rose-400/15 px-4 py-3 font-mono text-sm font-black text-rose-700 shadow-lg shadow-[#bd8461]/10 transition hover:-translate-y-0.5 hover:bg-rose-400/20 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cleanupLoading ? 'Clearing...' : 'Clear cards and payments'}
                </button>
              </div>
            </aside>

            <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl shadow-[#bd8461]/10 backdrop-blur sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[var(--accent)]">Recent direct UPI</p>
                  <h2 className="mt-2 font-[var(--font-outfit)] text-3xl font-black text-[var(--text)]">Submitted references</h2>
                </div>
                <button
                  type="button"
                  onClick={() => loadAdminData().catch((err: Error) => setError(err.message))}
                  className="rounded-2xl border border-[var(--border)] bg-white/[0.04] px-4 py-3 font-mono text-sm font-black text-[var(--accent)] shadow-lg shadow-[#bd8461]/10 transition hover:-translate-y-0.5 hover:border-[var(--border)]"
                >
                  Refresh
                </button>
              </div>

              <div className="max-h-[68vh] space-y-3 overflow-y-auto pr-1">
                {payments.length === 0 && (
                  <div className="rounded-[1.25rem] border border-dashed border-[var(--border)] bg-white/[0.035] p-8 text-center">
                    <p className="text-lg font-black text-[var(--text)]">No UTR submissions yet.</p>
                    <p className="mt-2 text-sm font-bold text-[var(--text2)]">
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
                      className="rounded-[1.25rem] border border-[var(--border)] bg-white/[0.045] p-4 shadow-xl shadow-[#bd8461]/10"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.12em] ${
                              isPaid
                                ? 'bg-emerald-300/12 text-emerald-700'
                                : 'bg-amber-300/12 text-amber-800'
                            }`}>
                              {isPaid ? 'Paid' : payment.status}
                            </span>
                            <span className="rounded-full bg-[#efb3aa]/20 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">
                              {payment.card?.template_type || 'Card'}
                            </span>
                          </div>
                          <h3 className="mt-3 truncate text-xl font-black text-[var(--text)]">{title}</h3>
                          <p className="mt-1 break-all font-mono text-sm font-black text-[var(--accent)]">
                            {payment.payment_reference || 'Missing reference'}
                          </p>
                          <p className="mt-2 text-xs font-bold text-[var(--text2)]">
                            Submitted {formatDate(payment.created_at)}
                            {payment.verified_at ? ` - Verified ${formatDate(payment.verified_at)}` : ''}
                          </p>
                          <p className="mt-1 break-all font-mono text-[11px] font-bold text-[var(--text2)]">Card ID: {payment.card_id}</p>
                        </div>

                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => verifyUtr(payment.payment_reference)}
                            disabled={verifyingRef === payment.payment_reference}
                            className="rounded-2xl bg-linear-to-r from-[#f3b4a0] via-[#efb3aa] to-[#ebae91] px-4 py-3 font-mono text-sm font-black text-[var(--text2)] shadow-lg shadow-[#bd8461]/10 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
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

            <section className="rounded-[1.5rem] border border-[var(--border)] bg-[var(--surface)] p-4 shadow-2xl shadow-[#bd8461]/10 backdrop-blur sm:p-5 lg:col-start-2">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="font-mono text-xs font-black uppercase tracking-[0.22em] text-[var(--accent)]">Admin inventory</p>
                  <h2 className="mt-2 font-[var(--font-outfit)] text-3xl font-black text-[var(--text)]">All cards</h2>
                  <p className="mt-1 text-xs font-bold text-[var(--text2)]">
                    Admin-only list. Private creator views never receive this global inventory.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => loadCards().catch((err: Error) => setError(err.message))}
                  className="rounded-2xl border border-[var(--border)] bg-white/[0.04] px-4 py-3 font-mono text-sm font-black text-[var(--accent)] shadow-lg shadow-[#bd8461]/10 transition hover:-translate-y-0.5 hover:border-[var(--border)]"
                >
                  {cardsLoading ? 'Loading...' : 'Refresh cards'}
                </button>
              </div>

              <div className="max-h-[68vh] space-y-3 overflow-y-auto pr-1">
                {cards.length === 0 && (
                  <div className="rounded-[1.25rem] border border-dashed border-[var(--border)] bg-white/[0.035] p-8 text-center">
                    <p className="text-lg font-black text-[var(--text)]">No cards found.</p>
                    <p className="mt-2 text-sm font-bold text-[var(--text2)]">
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
                      className="rounded-[1.25rem] border border-[var(--border)] bg-white/[0.045] p-4 shadow-xl shadow-[#bd8461]/10"
                    >
                      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-start">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.12em] ${
                              card.is_paid ? 'bg-emerald-300/12 text-emerald-700' : 'bg-amber-300/12 text-amber-800'
                            }`}>
                              {card.is_paid ? 'Paid' : card.payment_status}
                            </span>
                            <span className="rounded-full bg-[#efb3aa]/20 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">
                              {card.template_type}
                            </span>
                            <span className="rounded-full bg-[#efb3aa]/20 px-3 py-1 font-mono text-[11px] font-black uppercase tracking-[0.12em] text-[var(--accent)]">
                              {card.tier_selected}
                            </span>
                          </div>
                          <h3 className="mt-3 truncate text-xl font-black text-[var(--text)]">
                            {card.creator_name} to {card.recipient_name}
                          </h3>
                          <p className="mt-1 text-xs font-bold text-[var(--text2)]">
                            Created {formatDate(card.created_at)} - Expires {formatDate(card.expires_at)}
                          </p>
                          <p className="mt-1 break-all font-mono text-[11px] font-bold text-[var(--text2)]">
                            Card ID: {card.id}
                          </p>
                          <p className="mt-1 break-all font-mono text-[11px] font-bold text-[var(--text2)]">
                            Account: {card.account_id || 'Unclaimed / guest'}
                          </p>
                          {card.payment_reference && (
                            <p className="mt-1 break-all font-mono text-[11px] font-black text-[var(--accent)]">
                              UTR: {card.payment_reference}
                            </p>
                          )}
                        </div>

                        <div className="grid gap-2 sm:grid-cols-3 xl:w-[430px]">
                          <a href={recipientUrl} className="rounded-2xl border border-[var(--border)] bg-[#efb3aa]/20 px-4 py-3 text-center font-mono text-xs font-black text-[var(--accent)] transition hover:border-[var(--border)]">
                            Recipient
                          </a>
                          <a href={creatorUrl} className="rounded-2xl border border-[var(--border)] bg-white/[0.045] px-4 py-3 text-center font-mono text-xs font-black text-[var(--text2)] transition hover:border-[var(--border)]">
                            Creator
                          </a>
                          <a href={roomUrl} className="rounded-2xl bg-linear-to-r from-[#f3b4a0] via-[#efb3aa] to-[#ebae91] px-4 py-3 text-center font-mono text-xs font-black text-[var(--text2)] transition hover:-translate-y-0.5">
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
