import Link from "next/link";
import ComplianceFooter from "@/components/ComplianceFooter";
import {
  BUSINESS_EMAIL,
  BUSINESS_ADDRESS,
  BUSINESS_TYPE,
  BUSINESS_NAME,
  BUSINESS_OPERATOR,
  BUSINESS_PHONE_DISPLAY,
  BUSINESS_PHONE_HREF,
} from "@/lib/business";

export const metadata = {
  title: "About Us",
  description: "Learn about VibeCheck and its private digital-card service.",
};

export default function AboutPage() {
  return (
    <>
      <main className="min-h-screen bg-[var(--bg)] px-6 py-16 text-[var(--text2)]">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="border-b border-[var(--border)] pb-7">
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-widest text-[var(--accent)] hover:underline"
            >
              ← Back to Home
            </Link>
            <h1 className="mt-4 text-4xl font-black text-[var(--text)] md:text-5xl">
              About {BUSINESS_NAME}
            </h1>
          </div>

          <section className="grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7">
              <h2 className="text-xl font-black text-[var(--text)]">What we provide</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--text2)]">
                VibeCheck is an India-based service for creating private,
                personalised digital greeting cards for birthdays, friendship,
                apologies, romantic notes and proposals. Add your message,
                photos, song dedications, questions, passcode and theme, then
                share a private link with your chosen recipient.
              </p>
              <p className="mt-4 text-sm leading-7 text-[var(--text2)]">
                Each purchase covers creation and hosting of one personalised
                card. Cards carry no monetary balance or redemption value.
                You choose the recipient; VibeCheck provides no profile
                discovery or matching service.
              </p>
            </article>
            <article className="rounded-3xl border border-[var(--border)] bg-[var(--surface)] p-7">
              <h2 className="text-xl font-black text-[var(--text)]">How it is delivered</h2>
              <p className="mt-4 text-sm leading-7 text-[var(--text2)]">
                The product is delivered digitally after payment verification. No
                physical goods are sold or shipped. Clear pricing, access duration
                and support information are shown before purchase.
              </p>
            </article>
          </section>

          <section className="rounded-3xl border border-pink-400/20 bg-[#c75765]/5 p-7">
            <h2 className="text-xl font-black text-[var(--text)]">Business information</h2>
            <p className="mt-3 text-sm">{BUSINESS_TYPE}. VibeCheck is operated by {BUSINESS_OPERATOR}; it is not represented as an incorporated company.</p>
            <address className="mt-3 text-sm not-italic">{BUSINESS_ADDRESS}, India</address>
            <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">
                  Brand
                </dt>
                <dd className="mt-1 text-[var(--text2)]">{BUSINESS_NAME}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">
                  Operator
                </dt>
                <dd className="mt-1 text-[var(--text2)]">{BUSINESS_OPERATOR}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">
                  Email
                </dt>
                <dd className="mt-1">
                  <a href={`mailto:${BUSINESS_EMAIL}`} className="text-[var(--accent)]">
                    {BUSINESS_EMAIL}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-[var(--text2)]">
                  Phone
                </dt>
                <dd className="mt-1">
                  <a href={`tel:${BUSINESS_PHONE_HREF}`} className="text-[var(--accent)]">
                    {BUSINESS_PHONE_DISPLAY}
                  </a>
                </dd>
              </div>
            </dl>
          </section>
        </div>
      </main>
      <ComplianceFooter />
    </>
  );
}
