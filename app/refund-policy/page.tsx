import Link from 'next/link';
import ComplianceFooter from '@/components/ComplianceFooter';
import { BUSINESS_EMAIL, POLICY_EFFECTIVE_DATE } from '@/lib/business';

export const metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'Cancellation and refund policy for digital purchases on VibeCheck.',
};

export default function RefundPolicyPage() {
  return (
    <>
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text2)] px-6 py-16 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-[var(--border)] pb-6">
        <Link href="/" className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest hover:underline">
          ← Back to Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-black text-[var(--text)] mt-4">Cancellation & Refund Policy</h1>
        <p className="text-xs text-[var(--text2)] mt-2">Effective date: {POLICY_EFFECTIVE_DATE}</p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed text-[var(--text2)]">
        <h2 className="text-lg font-bold text-[var(--text)]">1. Nature of Digital Goods</h2>
        <p>
          VibeCheck provides personalised digital greeting cards, unlocked after payment verification. Direct UPI orders require manual verification. A draft can be abandoned before payment without charge. Once the personalised card is delivered, change-of-mind cancellations are generally unavailable; eligible defects, non-delivery and statutory rights remain covered.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)]">2. Eligible Refund Conditions</h2>
        <p>
          We offer full refunds under the following circumstances:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-[var(--text2)]">
          <li><strong>Duplicate Payments:</strong> More than one completed payment was received for the same order; the duplicate amount is refundable.</li>
          <li><strong>Non-Delivery:</strong> We received your payment but cannot deliver or unlock the purchased card.</li>
          <li><strong>Material Technical Defect:</strong> The paid service substantially fails to match its description and we cannot resolve the issue.</li>
        </ul>

        <h2 className="text-lg font-bold text-[var(--text)]">3. How to Request a Refund</h2>
        <p>
          To request a refund, email <a href={`mailto:${BUSINESS_EMAIL}`} className="text-[var(--accent)] hover:underline">{BUSINESS_EMAIL}</a> within 7 calendar days of the transaction. Include:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-[var(--text2)]">
          <li>Your Transaction ID and the amount paid</li>
          <li>Card ID (if available)</li>
          <li>Screenshot or description of the issue</li>
        </ul>

        <h2 className="text-lg font-bold text-[var(--text)]">4. Refund Timeline</h2>
        <p>
          We aim to review complete requests within 2 business days. Approved refunds are initiated to the original payment source within 5 to 7 business days. Your bank or payment provider may require additional processing time before the credit appears. We will provide the refund reference when available. We never ask for an OTP or UPI PIN to issue a refund.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)]">5. Cancellations</h2>
        <p>
          If you paid but the card has not been delivered, contact support promptly to request cancellation; we will check payment and fulfilment status before confirming it. No physical return or exchange is required for a digital product. The seven-day request window does not override rights or remedies available under applicable law. A failed bank debit not received by us must also be reported to your bank or UPI app for reversal tracking.
        </p>
      </section>
    </main>
    <ComplianceFooter />
    </>
  );
}
