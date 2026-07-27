import Link from 'next/link';

export const metadata = {
  title: 'Terms & Conditions',
  description: 'Terms and conditions for using VibeCheck services.',
};

export default function TermsPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 px-6 py-16 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-white/10 pb-6">
        <Link href="/" className="text-xs font-bold text-pink-400 uppercase tracking-widest hover:underline">
          ← Back to Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-black text-white mt-4">Terms & Conditions</h1>
        <p className="text-xs text-neutral-400 mt-2">Last updated: July 2026</p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed text-neutral-300">
        <h2 className="text-lg font-bold text-white">1. Overview</h2>
        <p>
          Welcome to VibeCheck (&quot;we&quot;, &quot;our&quot;, or &quot;us&quot;). By accessing or using our website and services, you agree to be bound by these Terms and Conditions. VibeCheck provides private interactive digital greeting card creation and delivery services.
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
          Prices for various card duration tiers are clearly displayed prior to purchase. Payments are processed securely via integrated payment gateways (Razorpay, UPI). Taxes or service fees, if applicable, are included in the checkout total.
        </p>

        <h2 className="text-lg font-bold text-white">5. Intellectual Property</h2>
        <p>
          All software, design elements, animations, and branding associated with VibeCheck are the property of VibeCheck. Users retain ownership of personal custom messages and images uploaded.
        </p>

        <h2 className="text-lg font-bold text-white">6. Contact Information</h2>
        <p>
          For queries regarding these terms, please contact us at <a href="mailto:agarwalmohak6@gmail.com" className="text-pink-400 hover:underline">agarwalmohak6@gmail.com</a>.
        </p>
      </section>
    </main>
  );
}
