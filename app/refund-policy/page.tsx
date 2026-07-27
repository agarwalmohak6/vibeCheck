import Link from 'next/link';

export const metadata = {
  title: 'Refund & Cancellation Policy',
  description: 'Cancellation and refund policy for digital purchases on VibeCheck.',
};

export default function RefundPolicyPage() {
  return (
    <main className="min-h-screen bg-neutral-950 text-neutral-200 px-6 py-16 max-w-4xl mx-auto space-y-8 font-sans">
      <div className="border-b border-white/10 pb-6">
        <Link href="/" className="text-xs font-bold text-pink-400 uppercase tracking-widest hover:underline">
          ← Back to Home
        </Link>
        <h1 className="text-3xl md:text-4xl font-black text-white mt-4">Cancellation & Refund Policy</h1>
        <p className="text-xs text-neutral-400 mt-2">Last updated: July 2026</p>
      </div>

      <section className="space-y-4 text-sm leading-relaxed text-neutral-300">
        <h2 className="text-lg font-bold text-white">1. Nature of Digital Goods</h2>
        <p>
          VibeCheck provides digital products (interactive greeting cards) that are delivered instantly upon payment authorization. Because access is generated immediately, cancellations are generally not permitted once a card link has been unlocked.
        </p>

        <h2 className="text-lg font-bold text-white">2. Eligible Refund Conditions</h2>
        <p>
          We offer full refunds under the following circumstances:
        </p>
        <ul className="list-disc pl-6 space-y-2 text-neutral-300">
          <li><strong>Duplicate Charges:</strong> You were charged multiple times for a single card transaction due to a network glitch.</li>
          <li><strong>Technical Non-Delivery:</strong> Payment was debited from your account, but the system failed to generate or unlock your card link.</li>
        </ul>

        <h2 className="text-lg font-bold text-white">3. How to Request a Refund</h2>
        <p>
          To request a refund, please send an email to <a href="mailto:agarwalmohak6@gmail.com" className="text-pink-400 hover:underline">agarwalmohak6@gmail.com</a> within 7 days of the transaction. Include:
        </p>
        <ul className="list-disc pl-6 space-y-1 text-neutral-300">
          <li>Your Payment Reference / Transaction ID / Razorpay Payment ID</li>
          <li>Card ID (if available)</li>
          <li>Screenshot or description of the issue</li>
        </ul>

        <h2 className="text-lg font-bold text-white">4. Refund Timeline</h2>
        <p>
          Approved refunds will be processed back to the original payment source (Bank account, Credit/Debit card, or UPI) within 5 to 7 business days as per banking standard settlement cycles.
        </p>
      </section>
    </main>
  );
}
