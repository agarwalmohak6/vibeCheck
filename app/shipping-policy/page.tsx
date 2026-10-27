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
      <main className="mx-auto min-h-screen max-w-4xl space-y-8 bg-[var(--bg)] px-6 py-16 font-sans text-[var(--text2)]">
        <div className="border-b border-[var(--border)] pb-6">
          <Link
            href="/"
            className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] hover:underline"
          >
            ← Back to Home
          </Link>
          <h1 className="mt-4 text-3xl font-black text-[var(--text)] md:text-4xl">
            Digital Delivery Policy
          </h1>
          <p className="mt-2 text-xs text-[var(--text2)]">
            Effective date: {POLICY_EFFECTIVE_DATE}
          </p>
        </div>

        <section className="space-y-5 text-sm leading-relaxed text-[var(--text2)]">
          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">
              1. No Physical Shipping
            </h2>
            <p className="mt-2">
              VibeCheck sells digital interactive greeting-card services only.
              We do not manufacture or ship physical goods, so no courier or
              postal delivery is involved.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">
              2. Delivery Method and Timeline
            </h2>
            <p className="mt-2">
              Your order ID is generated during checkout. With the current direct
              UPI checkout, submit the payment Transaction ID after paying. When bank-alert matching
              is enabled, complete matching credit alerts can be verified automatically. Other payments are reviewed
              during support hours, Monday–Saturday, 10:00 AM–7:00 PM IST, and aim
              to verify them within one business day after receiving the payment
              and its reference. Orders submitted outside these hours may be
              reviewed on the next business day. Instant confirmation is not guaranteed.
            </p>
            <p className="mt-2">After verification, the recipient link becomes available on the checkout/tracking page and a ready email is sent to the creator. The creator shares the recipient link themselves. Email and third-party messaging delivery can be delayed; access on the tracking page does not depend on opening the email.</p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">
              3. Access Duration
            </h2>
            <p className="mt-2">
              The current one-time card plan has no scheduled expiry. Access
              continues while VibeCheck operates, subject to our Terms and Conditions.
              This is not a promise of perpetual hosting. There are no recurring subscription charges.
            </p>
          </div>

          <div>
            <h2 className="text-lg font-bold text-[var(--text)]">
              4. Delivery Problems
            </h2>
            <p className="mt-2">
              If you have submitted the Transaction ID and the card has not unlocked within
              one business day, email{" "}
              <a
                href={`mailto:${BUSINESS_EMAIL}`}
                className="text-[var(--accent)] hover:underline"
              >
                {BUSINESS_EMAIL}
              </a>{" "}
              or call{" "}
              <a
                href={`tel:${BUSINESS_PHONE_HREF}`}
                className="text-[var(--accent)] hover:underline"
              >
                {BUSINESS_PHONE_DISPLAY}
              </a>
              . Include the payment reference and card ID. Eligible
              non-delivery cases are handled under our{" "}
              <Link href="/refund-policy" className="text-[var(--accent)] hover:underline">
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

