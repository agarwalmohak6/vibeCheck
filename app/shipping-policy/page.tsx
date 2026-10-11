import Link from "next/link";
import ComplianceFooter from "@/components/ComplianceFooter";
import {
  BUSINESS_EMAIL,
  BUSINESS_PHONE_DISPLAY,
  BUSINESS_PHONE_HREF,
  POLICY_EFFECTIVE_DATE,
} from "@/lib/business";

export const metadata = {
  title: "Digital Delivery Policy",
  description:
    "Digital delivery and service fulfilment policy for VibeCheck purchases.",
};

export default function ShippingPolicyPage() {
  return (
    <>
      <main className="mx-auto min-h-screen max-w-4xl space-y-8 bg-neutral-950 px-6 py-16 font-sans text-neutral-200">
        <div className="border-b border-white/10 pb-6">
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-widest text-pink-400 hover:underline"
          >
            ← Back to Home
          </Link>
          <h1 className="mt-4 text-3xl font-black text-white md:text-4xl">
            Digital Delivery Policy
          </h1>
          <p className="mt-2 text-xs text-neutral-400">
            Effective date: {POLICY_EFFECTIVE_DATE}
          </p>
        </div>

        <section className="space-y-5 text-sm leading-relaxed text-neutral-300">
          <div>
            <h2 className="text-lg font-bold text-white">
              1. No Physical Shipping
            </h2>
            <p className="mt-2">
              VibeCheck sells digital interactive greeting-card services only.
              We do not manufacture or ship physical goods, so no courier or
              postal delivery is involved.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              2. Delivery Method and Timeline
            </h2>
            <p className="mt-2">
              After a successful payment is captured, the purchased card is
              unlocked and its private shareable link is displayed online.
              Delivery is normally immediate, but may take up to 15 minutes
              during temporary payment-provider or network delays.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              3. Access Duration
            </h2>
            <p className="mt-2">
              Access remains available for the duration selected at checkout:
              1 Day, 2 Days, or Lifetime. The selected duration and final price
              are shown before payment.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-white">
              4. Delivery Problems
            </h2>
            <p className="mt-2">
              If payment is debited but the card does not unlock within 15
              minutes, email{" "}
              <a
                href={`mailto:${BUSINESS_EMAIL}`}
                className="text-pink-400 hover:underline"
              >
                {BUSINESS_EMAIL}
              </a>{" "}
              or call{" "}
              <a
                href={`tel:${BUSINESS_PHONE_HREF}`}
                className="text-pink-400 hover:underline"
              >
                {BUSINESS_PHONE_DISPLAY}
              </a>
              . Include the payment reference and card ID. Eligible
              non-delivery cases are handled under our{" "}
              <Link href="/refund-policy" className="text-pink-400 hover:underline">
                Cancellation & Refund Policy
              </Link>
              .
            </p>
          </div>
        </section>
      </main>
      <ComplianceFooter />
    </>
  );
}

