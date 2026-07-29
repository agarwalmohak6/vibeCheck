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
    <main className="min-h-screen bg-neutral-950 text-neutral-200 px-6 py-16 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-white/10 pb-6">
        <Link href="/" className="text-xs font-bold text-pink-400 uppercase tracking-widest hover:underline">
          ← Back to Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-black text-white mt-4">Privacy Policy</h1>
        <p className="text-xs text-neutral-400 mt-2">Effective date: {POLICY_EFFECTIVE_DATE}</p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed text-neutral-300">
        <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
        <p>
          We collect information necessary to create and deliver private digital cards, including creator and recipient names, custom messages, uploaded media, optional passcodes, account contact details, card interactions, and payment identifiers supplied by payment providers.
        </p>

        <h2 className="text-lg font-bold text-white">2. How Information is Used</h2>
        <p>
          We use this information to create and deliver the purchased card, secure access, provide creator analytics, process support requests, prevent fraud, and meet legal obligations. We do not sell personal data or private card messages.
        </p>

        <h2 className="text-lg font-bold text-white">3. Payment Security</h2>
        <p>
          Payment transactions are processed by Razorpay. We do not store complete card numbers, CVVs, net-banking passwords, or UPI PINs.
        </p>

        <h2 className="text-lg font-bold text-white">4. Data Retention & Expiry</h2>
        <p>
          Digital cards remain accessible for the purchased duration. Related transaction and support records may be retained as required for accounting, fraud prevention, dispute handling and applicable law.
        </p>

        <h2 className="text-lg font-bold text-white">5. Cookies & Local Storage</h2>
        <p>
          We use essential cookies or local browser storage for sign-in state, creator access tokens, checkout recovery and security. We do not use this storage to retain card or UPI credentials.
        </p>

        <h2 className="text-lg font-bold text-white">6. Service Providers</h2>
        <p>
          We use service providers such as Supabase for application data and storage, Render for hosting, Razorpay for payment processing, and media-search providers when those features are used. They process data only for providing their contracted services.
        </p>

        <h2 className="text-lg font-bold text-white">7. Your Choices</h2>
        <p>
          You may request access, correction or deletion of eligible personal data. Some records may be retained where required for transactions, security or legal compliance.
        </p>

        <h2 className="text-lg font-bold text-white">8. Contact & Data Support</h2>
        <p>
          VibeCheck is operated by {BUSINESS_OPERATOR}. For privacy questions or requests, contact <a href={`mailto:${BUSINESS_EMAIL}`} className="text-pink-400 hover:underline">{BUSINESS_EMAIL}</a>.
        </p>
      </section>
    </main>
    <ComplianceFooter />
    </>
  );
}
