import Link from 'next/link';

export const metadata = {
  title: 'Privacy Policy',
  description: 'Privacy policy and data handling practices at VibeCheck.',
};

export default function PrivacyPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 px-6 py-16 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-white/10 pb-6">
        <Link href="/" className="text-xs font-bold text-pink-400 uppercase tracking-widest hover:underline">
          ← Back to Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-black text-white mt-4">Privacy Policy</h1>
        <p className="text-xs text-neutral-400 mt-2">Last updated: July 2026</p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed text-neutral-300">
        <h2 className="text-lg font-bold text-white">1. Information We Collect</h2>
        <p>
          We collect minimal information necessary to deliver private digital cards, including creator and recipient names, custom messages, optional secret passcodes, and transaction identifiers provided by payment providers.
        </p>

        <h2 className="text-lg font-bold text-white">2. How Information is Used</h2>
        <p>
          Data provided is strictly used to render the card experience for the recipient and provide analytics (link opens, response tracking) to the card creator. We do not sell your personal data or custom card messages to third parties.
        </p>

        <h2 className="text-lg font-bold text-white">3. Payment Security</h2>
        <p>
          Payment transactions are processed securely through RBI-compliant payment gateways like Razorpay. We do not store credit card numbers, CVVs, or UPI PINs on our servers.
        </p>

        <h2 className="text-lg font-bold text-white">4. Data Retention & Expiry</h2>
        <p>
          Digital cards remain accessible depending on the chosen tier (e.g. 24 Hours, 2 Days, or Lifetime). Expired cards are automatically deactivated.
        </p>

        <h2 className="text-lg font-bold text-white">5. Cookies & Local Storage</h2>
        <p>
          We use local browser storage to verify creator tokens and track session state for a seamless experience.
        </p>

        <h2 className="text-lg font-bold text-white">6. Contact & Data Support</h2>
        <p>
          If you have questions regarding your data or privacy, contact our support team at <a href="mailto:agarwalmohak6@gmail.com" className="text-pink-400 hover:underline">agarwalmohak6@gmail.com</a>.
        </p>
      </section>
    </main>
  );
}
