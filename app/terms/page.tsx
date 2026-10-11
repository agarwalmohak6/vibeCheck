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
    <main className="min-h-screen bg-neutral-950 text-neutral-200 px-6 py-16 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-white/10 pb-6">
        <Link href="/" className="text-xs font-bold text-pink-400 uppercase tracking-widest hover:underline">
          ← Back to Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-black text-white mt-4">Terms & Conditions</h1>
        <p className="text-xs text-neutral-400 mt-2">Effective date: {POLICY_EFFECTIVE_DATE}</p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed text-neutral-300">
        <h2 className="text-lg font-bold text-white">1. Overview</h2>
        <p>
          Welcome to VibeCheck, operated in India by {BUSINESS_OPERATOR} (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). By accessing or purchasing our services, you agree to these Terms and Conditions. VibeCheck provides private interactive digital greeting-card creation and online delivery services.
        </p>

        <h2 className="text-lg font-bold text-white">2. Digital Goods & Instant Delivery</h2>
        <p>
          Our services consist of digital, customizable interactive cards. Once a card is paid for and created, a unique access link is generated and delivered instantly on screen and stored in your session. No physical goods are shipped.
        </p>

        <h2 className="text-lg font-bold text-white">3. User Conduct & Content</h2>
        <p>
          You agree not to use VibeCheck to generate hate speech, illegal content, harassment, or non-consensual personal distribution. We reserve the right to remove non-compliant cards without refund.
        </p>

        <h2 className="text-lg font-bold text-white">4. Pricing & Payments</h2>
        <p>
          Current prices and access durations are listed on our <Link href="/pricing" className="text-pink-400 hover:underline">Pricing page</Link> and shown again before payment. Payments are processed through Razorpay. The final amount is displayed before the customer authorises payment.
        </p>

        <h2 className="text-lg font-bold text-white">5. Delivery, Cancellation & Refunds</h2>
        <p>
          Cards are delivered digitally after successful payment. No physical product is shipped. Delivery timing, cancellations and eligible refunds are governed by our <Link href="/shipping-policy" className="text-pink-400 hover:underline">Digital Delivery Policy</Link> and <Link href="/refund-policy" className="text-pink-400 hover:underline">Cancellation & Refund Policy</Link>.
        </p>

        <h2 className="text-lg font-bold text-white">6. Intellectual Property</h2>
        <p>
          All software, design elements, animations, and branding associated with VibeCheck are the property of VibeCheck. Users retain ownership of personal custom messages and images uploaded.
        </p>

        <h2 className="text-lg font-bold text-white">7. Service Availability</h2>
        <p>
          We aim to keep the service available but cannot guarantee uninterrupted access during maintenance, network failures, payment-provider outages or events beyond reasonable control.
        </p>

        <h2 className="text-lg font-bold text-white">8. Governing Law</h2>
        <p>
          These terms are governed by the laws of India. Subject to applicable consumer-protection law, disputes will be handled by courts having jurisdiction in India.
        </p>

        <h2 className="text-lg font-bold text-white">9. Contact Information</h2>
        <p>
          For questions regarding these terms, contact <a href={`mailto:${BUSINESS_EMAIL}`} className="text-pink-400 hover:underline">{BUSINESS_EMAIL}</a>.
        </p>
      </section>
    </main>
    <ComplianceFooter />
    </>
  );
}
