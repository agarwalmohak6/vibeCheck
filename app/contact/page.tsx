import Link from 'next/link';
import ComplianceFooter from '@/components/ComplianceFooter';
import {
  BUSINESS_COUNTRY,
  BUSINESS_ADDRESS,
  BUSINESS_TYPE,
  BUSINESS_EMAIL,
  BUSINESS_NAME,
  BUSINESS_OPERATOR,
  BUSINESS_PHONE_DISPLAY,
  BUSINESS_PHONE_HREF,
} from '@/lib/business';

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the VibeCheck support team.',
};

export default function ContactPage() {
  return (
    <>
      <main className="mx-auto min-h-screen max-w-4xl space-y-8 bg-[var(--bg)] px-6 py-16 font-sans text-[var(--text2)]">
        <div className="border-b border-[var(--border)] pb-6">
          <Link href="/" className="text-xs font-bold text-[var(--accent)] uppercase tracking-widest hover:underline">
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-[var(--text)] mt-4">Contact Us</h1>
          <p className="text-xs text-[var(--text2)] mt-2">Support for purchases, digital delivery, privacy and refunds.</p>
        </div>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-[var(--text)]">Customer Support</h2>
            <p className="text-xs text-[var(--text2)] leading-relaxed">
              Contact us with your card ID and payment reference for faster assistance.
            </p>
            <div className="pt-2">
              <p className="text-[10px] font-bold text-[var(--text2)] uppercase tracking-wider">Email Address</p>
              <a href={`mailto:${BUSINESS_EMAIL}`} className="text-sm font-bold text-[var(--accent)] hover:underline">
                {BUSINESS_EMAIL}
              </a>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--text2)] uppercase tracking-wider">Phone</p>
              <a href={`tel:${BUSINESS_PHONE_HREF}`} className="text-sm font-bold text-[var(--accent)] hover:underline">
                {BUSINESS_PHONE_DISPLAY}
              </a>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--text2)] uppercase tracking-wider">Support Hours</p>
              <p className="text-xs text-[var(--text2)] font-medium">Monday–Saturday, 10:00 AM–7:00 PM IST</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--text2)] uppercase tracking-wider">Response Time</p>
              <p className="text-xs text-[var(--text2)] font-medium">Within 1 business day</p>
            </div>
          </div>

          <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-[var(--text)]">Merchant & Business Information</h2>
            <p className="text-sm">{BUSINESS_TYPE}. VibeCheck is the trading name of {BUSINESS_OPERATOR}.</p>
            <div><h3 className="text-sm font-bold">Business contact location</h3><address className="text-sm not-italic">{BUSINESS_ADDRESS}, {BUSINESS_COUNTRY}</address></div>
            <div>
              <p className="text-[10px] font-bold text-[var(--text2)] uppercase tracking-wider">Brand Name</p>
              <p className="text-xs text-[var(--text2)] font-medium">{BUSINESS_NAME}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--text2)] uppercase tracking-wider">Operator</p>
              <p className="text-xs text-[var(--text2)] font-medium">{BUSINESS_OPERATOR}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--text2)] uppercase tracking-wider">Operating Country</p>
              <p className="text-xs text-[var(--text2)] font-medium">{BUSINESS_COUNTRY}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--text2)] uppercase tracking-wider">Services Offered</p>
              <p className="text-xs text-[var(--text2)] font-medium">Private digital greeting-card creation and online delivery</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-[var(--text2)] uppercase tracking-wider">Physical Shipping</p>
              <p className="text-xs text-[var(--text2)] font-medium">Not applicable — digital services only</p>
            </div>
          </div>
        </section>
        <section className="space-y-3 text-sm leading-relaxed">
          <h2 className="text-lg font-bold">Order support and complaints</h2>
          <p>For delivery, refunds, privacy requests or complaints, contact {BUSINESS_OPERATOR} using the email or phone above. Include your order ID, purchase email and a description of the issue. For a payment issue, include the UTR or transaction reference.</p>
          <p>Never send your UPI PIN, OTP, CVV, full card number or account password. We aim to respond within one business day during support hours. Refund review and processing timelines are listed in our <Link href="/refund-policy" className="underline">Cancellation & Refund Policy</Link>.</p>
        </section>
      </main>
      <ComplianceFooter />
    </>
  );
}
