import Link from 'next/link';
import ComplianceFooter from '@/components/ComplianceFooter';
import { BUSINESS_EMAIL, BUSINESS_OPERATOR, POLICY_EFFECTIVE_DATE } from '@/lib/business';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy and data handling practices at VibeCheck.',
};

export default function PrivacyPage() {
  return (
    <>
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text2)] px-6 py-16 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-[var(--border)] pb-6">
        <Link href="/" className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest hover:underline">
          ← Back to Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-black text-[var(--text)] mt-4">Privacy Policy</h1>
        <p className="text-xs text-[var(--text2)] mt-2">Effective date: {POLICY_EFFECTIVE_DATE}</p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed text-[var(--text2)]">
        <h2 className="text-lg font-bold text-[var(--text)]">1. Information We Collect</h2>
        <p>
          We collect creator and recipient names, messages, uploaded photos/media, optional private-lock answers in protected form, creator email and WhatsApp number, order IDs, payment references, replies and card interactions. Technical records may include IP addresses and request logs for security and rate limiting. You should share another person&apos;s information only with appropriate permission.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)]">2. How Information is Used</h2>
        <p>
          We use this information to create and deliver the purchased card, secure access, provide creator analytics, process support requests, prevent fraud, and meet legal obligations. We do not sell personal data or private card messages.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)]">3. Payment Security</h2>
        <p>
          Current checkout uses direct UPI through your bank or UPI app. We receive the order amount and transaction reference you submit for manual verification, not your UPI PIN or bank credentials. If a gateway payment method is enabled in future, its provider will be identified at checkout. We do not request or store complete card numbers, CVVs, net-banking passwords or UPI PINs.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)]">4. Data Retention & Expiry</h2>
        <p>
          Current cards have no scheduled expiry and their content is retained to provide ongoing access while the service operates. You can request deletion using the support email below. Related transaction and support records may be retained where needed for accounting, fraud prevention, disputes or legal obligations. Deletion from backups may take additional time; closing your browser does not delete an order.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)]">5. Cookies & Local Storage</h2>
        <p>
          We use essential cookies or local browser storage for sign-in state, creator access tokens, checkout recovery and security. We do not use this storage to retain card or UPI credentials.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)]">6. Service Providers</h2>
        <p>
          We use Supabase for application data/storage, Render for hosting, configured email delivery providers for order and security messages, and messaging providers where enabled. Music search and official embedded players use Apple services; their own privacy terms apply when you use them. Relevant providers may process data outside India. We share information needed for these functions, lawful requests and dispute resolution, rather than selling private card content.
        </p>
        <p>Anyone holding a recipient link may view its accessible content; an optional private lock adds an access step. Creator tracking links grant access to order activity and must be kept private. The creator can see events such as envelope opens, lock attempts, story answers and replies. Authorised operators may access records to provide support, verify payments or investigate abuse. No online service can guarantee absolute security.</p>

        <h2 className="text-lg font-bold text-[var(--text)]">7. Your Choices</h2>
        <p>
          Creators and recipients may request access, correction or deletion of their eligible personal data by emailing us with the order/card ID. We may request proportionate identity or ownership verification. Do not send identity documents unsolicited. Some records may be retained for transactions, security or legal compliance. Order emails are service messages, not a subscription to marketing.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)]">8. Contact & Data Support</h2>
        <p>
          VibeCheck is operated by {BUSINESS_OPERATOR}. For privacy questions or requests, contact <a href={`mailto:${BUSINESS_EMAIL}`} className="text-[var(--accent)] hover:underline">{BUSINESS_EMAIL}</a>.
        </p>
      </section>
    </main>
    <ComplianceFooter />
    </>
  );
}
