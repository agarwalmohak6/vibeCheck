import Link from 'next/link';
import ComplianceFooter from '@/components/ComplianceFooter';
import { BUSINESS_EMAIL, BUSINESS_OPERATOR, POLICY_EFFECTIVE_DATE } from '@/lib/business';

export const metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions for using VibeCheck services.',
};

export default function TermsPage() {
  return (
    <>
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text2)] px-6 py-16 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-[var(--border)] pb-6">
        <Link href="/" className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest hover:underline">
          ← Back to Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-black text-[var(--text)] mt-4">Terms & Conditions</h1>
        <p className="text-xs text-[var(--text2)] mt-2">Effective date: {POLICY_EFFECTIVE_DATE}</p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed text-[var(--text2)]">
        <h2 className="text-lg font-bold text-[var(--text)]">1. Overview</h2>
        <p>
          Welcome to VibeCheck, operated in India by {BUSINESS_OPERATOR} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). By accessing or purchasing our services, you agree to these Terms and Conditions. VibeCheck provides private interactive digital greeting-card creation and online delivery services.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)]">2. Digital Products & Delivery</h2>
        <p>
          Our service creates personalised interactive greeting cards. After payment is verified, your recipient link becomes available on screen and a ready notification is sent to the creator email supplied at checkout. Direct UPI payments currently require a submitted transaction reference and manual verification. No physical goods are shipped. See our delivery policy for timing and support.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)]">3. User Conduct & Content</h2>
        <p>
          Purchasers must be at least 18 and able to enter into a contract. You must have permission to upload and share the photos, messages and other content you use. Do not use VibeCheck for illegal content, harassment, impersonation or non-consensual sharing. We may restrict unlawful or abusive content, subject to applicable consumer rights and law.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)]">4. Pricing & Payments</h2>
        <p>
          Current prices are listed in INR on our <Link href="/pricing" className="text-[var(--accent)] hover:underline">Pricing page</Link> and shown again before payment. Each purchase is a one-time payment for one card, not a subscription. Only payment methods actually displayed at checkout are available. Direct UPI payments are verified against the submitted Transaction ID and received funds. When bank-alert matching is enabled, complete matches can be verified automatically; other payments are reviewed manually. Opening a payment app, submitting a reference or uploading a screenshot does not confirm payment. We do not currently advertise Cashfree activation or card-payment availability.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)]">5. Delivery, Cancellation & Refunds</h2>
        <p>
          Cards are delivered digitally after successful payment. No physical product is shipped. Delivery timing, cancellations and eligible refunds are governed by our <Link href="/shipping-policy" className="text-[var(--accent)] hover:underline">Digital Delivery Policy</Link> and <Link href="/refund-policy" className="text-[var(--accent)] hover:underline">Cancellation & Refund Policy</Link>.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)]">6. Intellectual Property</h2>
        <p>
          Users retain their rights in uploaded messages and images and grant us permission to host and display them to provide the purchased service. Third-party software, artwork and recordings remain subject to their owners&apos; rights. Song dedications link to an official music service; playback availability, subscriptions and previews are controlled by that provider, and a card purchase does not include a music subscription or ownership of a recording.
        </p>

        <h2 className="text-lg font-bold text-[var(--text)]">7. Service Availability</h2>
        <p>
          We aim to keep the service available but cannot guarantee uninterrupted access during maintenance, network failures, payment-provider outages or events beyond reasonable control.
        </p>
        <p>The current plan has no scheduled card expiry. “Keep it forever” means ongoing access while VibeCheck operates and the content complies with these terms, not a guarantee of perpetual hosting. Save important original photos and messages separately. A recipient link is accessible to anyone it is shared with unless a private lock is enabled; keep creator tracking links confidential.</p>

        <h2 className="text-lg font-bold text-[var(--text)]">8. Governing Law</h2>
        <p>
          These terms are governed by the laws of India. Subject to applicable consumer-protection law, disputes will be handled by courts having jurisdiction in India.
        </p>
        <p>Nothing in these terms excludes mandatory statutory consumer rights. Contact us first about a problem so we can investigate and offer an appropriate resolution.</p>

        <h2 className="text-lg font-bold text-[var(--text)]">9. Contact Information</h2>
        <p>
          For questions regarding these terms, contact <a href={`mailto:${BUSINESS_EMAIL}`} className="text-[var(--accent)] hover:underline">{BUSINESS_EMAIL}</a>.
        </p>
      </section>
    </main>
    <ComplianceFooter />
    </>
  );
}
