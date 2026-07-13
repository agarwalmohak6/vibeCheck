import Link from "next/link";

type SeoUseCasePageProps = {
  eyebrow: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  ctaHref: string;
  ctaLabel: string;
  accentEmoji: string;
  benefits: string[];
  steps: string[];
  faqs: { question: string; answer: string }[];
};

export default function SeoUseCasePage({
  eyebrow,
  title,
  description,
  image,
  imageAlt,
  ctaHref,
  ctaLabel,
  accentEmoji,
  benefits,
  steps,
  faqs,
}: SeoUseCasePageProps) {
  return (
    <main className="vc-seo-page">
      <section className="vc-seo-hero">
        <div className="vc-seo-hero__copy">
          <span className="vc-eyebrow">{eyebrow}</span>
          <h1>{title}</h1>
          <p>{description}</p>
          <div className="vc-seo-actions">
            <Link href={ctaHref} className="theme-btn">
              {ctaLabel}
            </Link>
            <Link href="/" className="vc-seo-secondary-link">
              Explore VibeCheck
            </Link>
          </div>
        </div>
        <div className="vc-seo-hero__card" aria-hidden="true">
          <span>{accentEmoji}</span>
          <img src={image} alt={imageAlt} />
        </div>
      </section>

      <section className="vc-seo-panel">
        <div>
          <span className="vc-eyebrow">Why it works</span>
          <h2>Built to feel more personal than a forwarded template.</h2>
        </div>
        <div className="vc-seo-grid">
          {benefits.map((benefit) => (
            <article key={benefit}>
              <span>{accentEmoji}</span>
              <p>{benefit}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="vc-seo-panel vc-seo-panel--split">
        <div>
          <span className="vc-eyebrow">How it opens</span>
          <h2>One private link, one small reveal, one real reply.</h2>
        </div>
        <ol className="vc-seo-steps">
          {steps.map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
      </section>

      <section className="vc-seo-panel">
        <span className="vc-eyebrow">Questions people ask</span>
        <div className="vc-seo-faq-list">
          {faqs.map((faq) => (
            <article key={faq.question}>
              <h2>{faq.question}</h2>
              <p>{faq.answer}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
