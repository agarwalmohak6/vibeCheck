import Link from "next/link";
import ComplianceFooter from "@/components/ComplianceFooter";
import {
  BUSINESS_EMAIL,
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
      <main className="min-h-screen bg-neutral-950 px-6 py-16 text-neutral-200">
        <div className="mx-auto max-w-4xl space-y-10">
          <div className="border-b border-white/10 pb-7">
            <Link
              href="/"
              className="text-xs font-bold uppercase tracking-widest text-pink-400 hover:underline"
            >
              ← Back to Home
            </Link>
            <h1 className="mt-4 text-4xl font-black text-white md:text-5xl">
              About {BUSINESS_NAME}
            </h1>
          </div>

          <section className="grid gap-6 md:grid-cols-2">
            <article className="rounded-3xl border border-white/10 bg-neutral-900 p-7">
              <h2 className="text-xl font-black text-white">What we provide</h2>
              <p className="mt-4 text-sm leading-7 text-neutral-300">
                VibeCheck is an India-based digital service for creating private
                interactive greeting cards. Customers can personalise a message,
                music, questions, passcode and theme, then share one private link
                with the intended recipient.
              </p>
            </article>
            <article className="rounded-3xl border border-white/10 bg-neutral-900 p-7">
              <h2 className="text-xl font-black text-white">How it is delivered</h2>
              <p className="mt-4 text-sm leading-7 text-neutral-300">
                The product is delivered digitally after successful payment. No
                physical goods are sold or shipped. Clear pricing, access duration
                and support information are shown before purchase.
              </p>
            </article>
          </section>

          <section className="rounded-3xl border border-pink-400/20 bg-pink-500/5 p-7">
            <h2 className="text-xl font-black text-white">Business information</h2>
            <dl className="mt-5 grid gap-4 text-sm md:grid-cols-2">
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Brand
                </dt>
                <dd className="mt-1 text-neutral-200">{BUSINESS_NAME}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Operator
                </dt>
                <dd className="mt-1 text-neutral-200">{BUSINESS_OPERATOR}</dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Email
                </dt>
                <dd className="mt-1">
                  <a href={`mailto:${BUSINESS_EMAIL}`} className="text-pink-400">
                    {BUSINESS_EMAIL}
                  </a>
                </dd>
              </div>
              <div>
                <dt className="text-xs font-bold uppercase tracking-wider text-neutral-500">
                  Phone
                </dt>
                <dd className="mt-1">
                  <a href={`tel:${BUSINESS_PHONE_HREF}`} className="text-pink-400">
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
