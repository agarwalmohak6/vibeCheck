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

type PaymentsResponse = {
  success?: boolean;
  admin_email?: string;
  payments?: ManualPaymentSubmission[];
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

export default function AdminDashboard() {
  const [email, setEmail] = useState(ADMIN_EMAIL);
  const [secret, setSecret] = useState('');
  const [manualUtr, setManualUtr] = useState('');
  const [adminEmail, setAdminEmail] = useState('');
  const [payments, setPayments] = useState<ManualPaymentSubmission[]>([]);
  const [status, setStatus] = useState<'checking' | 'login' | 'ready'>('checking');
  const [loading, setLoading] = useState(false);
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
      return;
    }

    if (!res.ok) {
      throw new Error(data.error || 'Could not load admin payments.');
    }

    setAdminEmail(data.admin_email || ADMIN_EMAIL);
    setPayments(data.payments || []);
    setStatus('ready');
  };

  useEffect(() => {
    loadPayments().catch((err: Error) => {
      setError(err.message);
      setStatus('login');
    });
  }, []);

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError('');
    setNotice('');

    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, secret }),
      });
      const data = await res.json() as PaymentsResponse;

      if (!res.ok) {
        setError(data.error || 'Admin login failed.');
        return;
      }

      setSecret('');
      setNotice('Admin session started.');
      await loadPayments();
    } catch {
      setError('Network issue while logging in.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = async () => {
    await fetch('/api/admin/logout', { method: 'POST' });
    setStatus('login');
    setAdminEmail('');
    setPayments([]);
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
      await loadPayments();
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
      await loadPayments();
    } catch {
      setError('Network issue while clearing test data.');
    } finally {
      setCleanupLoading(false);
    }
  };

  const pendingCount = payments.filter((payment) => payment.status !== 'paid').length;
  const paidCount = payments.filter((payment) => payment.status === 'paid').length;

  return (
    <main className="min-h-screen overflow-hidden bg-[#fff0f6] text-[#351727]">
      <div className="pointer-events-none fixed inset-0">
        <div className="absolute -left-24 top-[-12%] h-80 w-80 rounded-full bg-pink-300/40 blur-3xl" />
        <div className="absolute right-[-8%] top-10 h-96 w-96 rounded-full bg-amber-200/55 blur-3xl" />
        <div className="absolute bottom-[-14%] left-[35%] h-96 w-96 rounded-full bg-rose-300/35 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,rgba(233,30,140,0.12),transparent_28%),radial-gradient(circle_at_80%_40%,rgba(212,160,23,0.16),transparent_26%)]" />
      </div>

      <section className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-8 sm:px-8">
        <header className="mb-8 flex flex-col gap-4 rounded-[2rem] border border-pink-200/80 bg-white/70 p-5 shadow-2xl shadow-pink-200/40 backdrop-blur md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.28em] text-pink-500">VibeCheck admin</p>
            <h1 className="mt-2 font-[var(--font-display)] text-4xl font-black leading-none text-[#3d1a2e] sm:text-5xl">
              Payment control room
            </h1>
            <p className="mt-2 max-w-2xl text-sm font-bold text-[#7b3f6e]">
              Review direct UPI references and unlock cards without touching the database.
            </p>
          </div>

          {status === 'ready' && (
            <div className="flex flex-wrap items-center gap-3">
              <div className="rounded-2xl border border-pink-200 bg-white/80 px-4 py-3 text-sm font-black shadow-lg shadow-pink-100">
                <span className="block text-[10px] uppercase tracking-[0.2em] text-[#9e6b8a]">Signed in</span>
                {adminEmail}
              </div>
              <button
                type="button"
                onClick={handleLogout}
                className="rounded-2xl border border-pink-200 bg-white px-4 py-3 text-sm font-black text-[#7b3f6e] shadow-lg shadow-pink-100 transition hover:-translate-y-0.5"
              >
                Logout
              </button>
            </div>
          )}
        </header>

        {status === 'checking' && (
          <div className="grid flex-1 place-items-center">
            <div className="rounded-[2rem] border border-pink-200 bg-white/75 p-8 text-center shadow-2xl shadow-pink-200/40">
              <p className="text-sm font-black uppercase tracking-[0.22em] text-pink-500">Checking admin session</p>
              <p className="mt-3 text-[#7b3f6e]">One moment...</p>
            </div>
          </div>
        )}

        {status === 'login' && (
          <div className="grid flex-1 place-items-center">
            <form
              onSubmit={handleLogin}
              className="w-full max-w-lg rounded-[2rem] border border-pink-200/80 bg-white/85 p-6 shadow-2xl shadow-pink-200/50 backdrop-blur"
            >
              <p className="text-xs font-black uppercase tracking-[0.24em] text-pink-500">Owner only</p>
              <h2 className="mt-3 font-[var(--font-display)] text-4xl font-black text-[#3d1a2e]">Admin login</h2>
              <p className="mt-2 text-sm font-bold text-[#7b3f6e]">
                Only {ADMIN_EMAIL} can open this dashboard.
              </p>

              <label className="mt-6 block text-xs font-black uppercase tracking-[0.18em] text-[#9e6b8a]">
                Email
              </label>
              <input
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                className="mt-2 w-full rounded-2xl border border-pink-200 bg-white px-4 py-3 text-base font-black outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60"
              />

              <label className="mt-4 block text-xs font-black uppercase tracking-[0.18em] text-[#9e6b8a]">
                Admin secret
              </label>
              <input
                value={secret}
                onChange={(event) => setSecret(event.target.value)}
                type="password"
                autoComplete="current-password"
                placeholder="Paste your VIBECHECK_ADMIN_SECRET"
                className="mt-2 w-full rounded-2xl border border-pink-200 bg-white px-4 py-3 text-base font-black outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60"
              />

              <button
                type="submit"
                disabled={loading}
                className="mt-6 w-full rounded-2xl bg-linear-to-r from-pink-500 to-amber-500 px-5 py-4 text-base font-black text-white shadow-xl shadow-pink-300/50 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Opening dashboard...' : 'Open admin dashboard'}
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
          <div className="grid gap-5 lg:grid-cols-[0.75fr_1.25fr]">
            <aside className="space-y-5">
              <div className="rounded-[2rem] border border-pink-200/80 bg-white/80 p-5 shadow-2xl shadow-pink-200/40 backdrop-blur">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-500">Quick approve</p>
                <h2 className="mt-2 font-[var(--font-display)] text-3xl font-black">Verify a UTR</h2>
                <p className="mt-2 text-sm font-bold text-[#7b3f6e]">
                  Paste a submitted UTR. If it exists, the card unlocks immediately.
                </p>
                <div className="mt-4 flex gap-2">
                  <input
                    value={manualUtr}
                    onChange={(event) => setManualUtr(event.target.value)}
                    placeholder="UTR / ref no."
                    className="min-w-0 flex-1 rounded-2xl border border-pink-200 bg-white px-4 py-3 text-sm font-black uppercase outline-none transition focus:border-pink-400 focus:ring-4 focus:ring-pink-200/60"
                  />
                  <button
                    type="button"
                    onClick={() => verifyUtr(manualUtr)}
                    disabled={Boolean(verifyingRef)}
                    className="rounded-2xl bg-linear-to-r from-pink-500 to-amber-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-pink-300/50 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Approve
                  </button>
                </div>
                {(notice || error) && (
                  <p className={`mt-4 text-sm font-bold ${error ? 'text-red-600' : 'text-emerald-700'}`}>
                    {error || notice}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-[1.5rem] border border-pink-200 bg-white/75 p-4 shadow-xl shadow-pink-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9e6b8a]">Pending</p>
                  <p className="mt-1 text-4xl font-black text-pink-500">{pendingCount}</p>
                </div>
                <div className="rounded-[1.5rem] border border-pink-200 bg-white/75 p-4 shadow-xl shadow-pink-100">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-[#9e6b8a]">Paid</p>
                  <p className="mt-1 text-4xl font-black text-emerald-600">{paidCount}</p>
                </div>
              </div>

              <div className="rounded-[2rem] border border-red-200 bg-red-50/80 p-5 shadow-xl shadow-red-100">
                <p className="text-xs font-black uppercase tracking-[0.22em] text-red-500">Danger zone</p>
                <h2 className="mt-2 font-[var(--font-display)] text-3xl font-black text-red-950">Clear test data</h2>
                <p className="mt-2 text-sm font-bold text-red-700">
                  Deletes cards and payment rows. Use only when you intentionally want a clean testing slate.
                </p>
                <input
                  value={cleanupConfirm}
                  onChange={(event) => setCleanupConfirm(event.target.value)}
                  placeholder="Type CLEAR_TEST_DATA"
                  className="mt-4 w-full rounded-2xl border border-red-200 bg-white px-4 py-3 text-sm font-black outline-none transition focus:border-red-400 focus:ring-4 focus:ring-red-200/60"
                />
                <button
                  type="button"
                  onClick={handleCleanup}
                  disabled={cleanupLoading || cleanupConfirm !== 'CLEAR_TEST_DATA'}
                  className="mt-3 w-full rounded-2xl bg-red-600 px-4 py-3 text-sm font-black text-white shadow-lg shadow-red-200 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {cleanupLoading ? 'Clearing...' : 'Clear cards and payments'}
                </button>
              </div>
            </aside>

            <section className="rounded-[2rem] border border-pink-200/80 bg-white/80 p-4 shadow-2xl shadow-pink-200/40 backdrop-blur sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
                <div>
                  <p className="text-xs font-black uppercase tracking-[0.22em] text-pink-500">Recent direct UPI</p>
                  <h2 className="mt-2 font-[var(--font-display)] text-3xl font-black">Submitted references</h2>
                </div>
                <button
                  type="button"
                  onClick={() => loadPayments().catch((err: Error) => setError(err.message))}
                  className="rounded-2xl border border-pink-200 bg-white px-4 py-3 text-sm font-black text-[#7b3f6e] shadow-lg shadow-pink-100 transition hover:-translate-y-0.5"
                >
                  Refresh
                </button>
              </div>

              <div className="max-h-[68vh] space-y-3 overflow-y-auto pr-1">
                {payments.length === 0 && (
                  <div className="rounded-[1.5rem] border border-dashed border-pink-200 bg-pink-50/60 p-8 text-center">
                    <p className="text-lg font-black">No UTR submissions yet.</p>
                    <p className="mt-2 text-sm font-bold text-[#7b3f6e]">
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
                      className="rounded-[1.5rem] border border-pink-200 bg-white p-4 shadow-xl shadow-pink-100/70"
                    >
                      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                        <div className="min-w-0">
                          <div className="flex flex-wrap items-center gap-2">
                            <span className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] ${
                              isPaid
                                ? 'bg-emerald-100 text-emerald-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}>
                              {isPaid ? 'Paid' : payment.status}
                            </span>
                            <span className="rounded-full bg-pink-50 px-3 py-1 text-[11px] font-black uppercase tracking-[0.12em] text-pink-500">
                              {payment.card?.template_type || 'Card'}
                            </span>
                          </div>
                          <h3 className="mt-3 truncate text-xl font-black text-[#3d1a2e]">{title}</h3>
                          <p className="mt-1 break-all font-mono text-sm font-black text-pink-500">
                            {payment.payment_reference || 'Missing reference'}
                          </p>
                          <p className="mt-2 text-xs font-bold text-[#7b3f6e]">
                            Submitted {formatDate(payment.created_at)}
                            {payment.verified_at ? ` - Verified ${formatDate(payment.verified_at)}` : ''}
                          </p>
                          <p className="mt-1 break-all text-[11px] font-bold text-[#9e6b8a]">Card ID: {payment.card_id}</p>
                        </div>

                        {!isPaid && (
                          <button
                            type="button"
                            onClick={() => verifyUtr(payment.payment_reference)}
                            disabled={verifyingRef === payment.payment_reference}
                            className="rounded-2xl bg-linear-to-r from-pink-500 to-amber-500 px-4 py-3 text-sm font-black text-white shadow-lg shadow-pink-300/50 transition hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
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
          </div>
        )}
      </section>
    </main>
  );
}
