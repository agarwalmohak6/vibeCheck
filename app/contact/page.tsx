import Link from 'next/link';
import ComplianceFooter from '@/components/ComplianceFooter';
import {
  BUSINESS_COUNTRY,
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
      <main className="mx-auto min-h-screen max-w-4xl space-y-8 bg-neutral-950 px-6 py-16 font-sans text-neutral-200">
        <div className="border-b border-white/10 pb-6">
          <Link href="/" className="text-xs font-bold text-pink-400 uppercase tracking-widest hover:underline">
            ← Back to Home
          </Link>
          <h1 className="text-3xl md:text-4xl font-black text-white mt-4">Contact Us</h1>
          <p className="text-xs text-neutral-400 mt-2">Support for purchases, digital delivery, privacy and refunds.</p>
        </div>

        <section className="grid md:grid-cols-2 gap-6">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Customer Support</h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              Contact us with your card ID and payment reference for faster assistance.
            </p>
            <div className="pt-2">
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Email Address</p>
              <a href={`mailto:${BUSINESS_EMAIL}`} className="text-sm font-bold text-pink-400 hover:underline">
                {BUSINESS_EMAIL}
              </a>
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Phone</p>
              <a href={`tel:${BUSINESS_PHONE_HREF}`} className="text-sm font-bold text-pink-400 hover:underline">
                {BUSINESS_PHONE_DISPLAY}
              </a>
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Support Hours</p>
              <p className="text-xs text-neutral-300 font-medium">Monday–Saturday, 10:00 AM–7:00 PM IST</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Response Time</p>
              <p className="text-xs text-neutral-300 font-medium">Within 1 business day</p>
            </div>
          </div>

          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 space-y-4">
            <h2 className="text-lg font-bold text-white">Merchant & Business Information</h2>
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Brand Name</p>
              <p className="text-xs text-neutral-300 font-medium">{BUSINESS_NAME}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Operator</p>
              <p className="text-xs text-neutral-300 font-medium">{BUSINESS_OPERATOR}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Operating Country</p>
              <p className="text-xs text-neutral-300 font-medium">{BUSINESS_COUNTRY}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Services Offered</p>
              <p className="text-xs text-neutral-300 font-medium">Private digital greeting-card creation and online delivery</p>
            </div>
            <div>
              <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Physical Shipping</p>
              <p className="text-xs text-neutral-300 font-medium">Not applicable — digital services only</p>
            </div>
          </div>
        </section>
      </main>
      <ComplianceFooter />
    </>
  );
}
