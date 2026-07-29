import Link from "next/link";
import ComplianceFooter from "@/components/ComplianceFooter";
import { TIERS } from "@/lib/themes";
import { POLICY_EFFECTIVE_DATE } from "@/lib/business";

export const metadata = {
  title: "Pricing",
  description:
    "Transparent VibeCheck pricing for private interactive digital greeting cards.",
};

export default function PricingPage() {
  return (
    <>
      <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-200">
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto max-w-2xl text-center">
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-widest text-pink-400 hover:underline"
            >
              ← Back to Home
            </Link>
            <h1 className="mt-5 text-4xl font-black text-white md:text-5xl">
              Simple, transparent pricing
            </h1>
            <p className="mt-4 text-sm leading-relaxed text-neutral-400">
              One payment per card. No subscription, hidden platform charge, or
              physical-delivery fee.
            </p>
          </div>

          <section className="mt-12 grid gap-5 md:grid-cols-3">
            {TIERS.map((tier) => (
              <article
                key={tier.id}
                className={`rounded-3xl border p-7 ${
                  tier.popular
                    ? "border-pink-400/60 bg-pink-500/10"
                    : "border-white/10 bg-neutral-900"
                }`}
              >
                <span className="text-3xl" aria-hidden>
                  {tier.icon}
                </span>
                <h2 className="mt-4 text-xl font-black text-white">{tier.label}</h2>
                <p className="mt-2 text-4xl font-black text-pink-300">
                  ₹{tier.price}
                </p>
                <p className="mt-1 text-sm font-bold text-neutral-300">
                  {tier.duration}
                </p>
                <p className="mt-4 min-h-12 text-sm leading-relaxed text-neutral-400">
                  {tier.description}
                </p>
                <ul className="mt-5 space-y-2 text-sm text-neutral-300">
                  <li>✓ Interactive private reveal</li>
                  <li>✓ One-person shareable link</li>
                  <li>✓ Creator tracker and replies</li>
                </ul>
                <Link
                  href={`/customize?tier=${tier.id}&new=1`}
                  className="mt-7 inline-flex w-full justify-center rounded-xl bg-pink-500 px-4 py-3 text-sm font-black text-white transition hover:bg-pink-400"
                >
                  Create this card
                </Link>
              </article>
            ))}
          </section>

          <div className="mt-10 rounded-2xl border border-white/10 bg-neutral-900 p-6 text-sm leading-relaxed text-neutral-400">
            <p>
              Prices are displayed in Indian Rupees and are the final product
              prices shown before checkout. Any payment-provider information is
              displayed securely inside the payment window. Pricing last
              confirmed on {POLICY_EFFECTIVE_DATE}.
            </p>
          </div>
        </div>
      </main>
      <ComplianceFooter />
    </>
  );
}

