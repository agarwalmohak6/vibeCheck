import Link from 'next/link';

export const metadata = {
  title: 'Contact Us',
  description: 'Get in touch with the VibeCheck support team.',
};

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 px-6 py-16 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-white/10 pb-6">
        <Link href="/" className="text-xs font-bold text-pink-400 uppercase tracking-widest hover:underline">
          ← Back to Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-black text-white mt-4">Contact Us</h1>
        <p className="text-xs text-neutral-400 mt-2">We are here to help with your digital card purchases & queries.</p>
      </div>

      <section className="grid md:grid-cols-2 gap-6">
        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Customer Support</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            Have questions about a payment, card delivery, or refund? Email our dedicated support team directly.
          </p>
          <div className="pt-2">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Email Address</p>
            <a href="mailto:agarwalmohak6@gmail.com" className="text-sm font-bold text-pink-400 hover:underline">
              agarwalmohak6@gmail.com
            </a>
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Response Time</p>
            <p className="text-xs text-neutral-300 font-medium">Within 24 hours</p>
          </div>
        </div>

        <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 space-y-4">
          <h2 className="text-lg font-bold text-white">Merchant & Business Info</h2>
          <p className="text-xs text-neutral-400 leading-relaxed">
            VibeCheck is an online interactive card platform operating from India.
          </p>
          <div className="pt-2">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Operating Location</p>
            <p className="text-xs text-neutral-300 font-medium">India</p>
          </div>
          <div>
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider">Services Offered</p>
            <p className="text-xs text-neutral-300 font-medium">Digital Greeting & Interactive Experience Creation</p>
          </div>
        </div>
      </section>
    </main>
  );
}
