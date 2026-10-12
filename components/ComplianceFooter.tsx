import Link from "next/link";
import {
  BUSINESS_EMAIL,
  BUSINESS_NAME,
  BUSINESS_OPERATOR,
  BUSINESS_PHONE_DISPLAY,
  BUSINESS_PHONE_HREF,
} from "@/lib/business";

const POLICY_LINKS = [
  { href: "/about", label: "About Us" },
  { href: "/pricing", label: "Pricing" },
  { href: "/terms", label: "Terms & Conditions" },
  { href: "/privacy", label: "Privacy Policy" },
  { href: "/refund-policy", label: "Cancellation & Refunds" },
  { href: "/shipping-policy", label: "Digital Delivery Policy" },
  { href: "/contact", label: "Contact Us" },
];

export default function ComplianceFooter() {
  return (
    <footer className="border-t border-[var(--border)] bg-[var(--bg)] px-6 py-10 text-[var(--text2)]">
      <div className="mx-auto grid w-full max-w-6xl gap-8 md:grid-cols-[1fr_1.6fr] md:items-start">
        <div className="space-y-2">
          <p className="text-lg font-black text-[var(--text)]">{BUSINESS_NAME}</p>
          <p className="text-sm leading-relaxed text-[var(--text2)]">
            Private interactive digital greeting cards, delivered online after
            successful payment.
          </p>
          <p className="text-xs text-[var(--text2)]">
            Operated in India by {BUSINESS_OPERATOR}.
          </p>
        </div>

        <div className="space-y-5">
          <nav
            aria-label="Business and policy links"
            className="flex flex-wrap gap-x-5 gap-y-3 text-xs font-bold"
          >
            {POLICY_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-[var(--text2)] transition hover:text-[var(--accent)]"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex flex-wrap gap-x-5 gap-y-2 text-xs text-[var(--text2)]">
            <a href={`mailto:${BUSINESS_EMAIL}`} className="hover:text-[var(--accent)]">
              {BUSINESS_EMAIL}
            </a>
            <a href={`tel:${BUSINESS_PHONE_HREF}`} className="hover:text-[var(--accent)]">
              {BUSINESS_PHONE_DISPLAY}
            </a>
          </div>
        </div>
      </div>

      <p className="mx-auto mt-8 max-w-6xl border-t border-[var(--border)] pt-5 text-xs text-[var(--text2)]">
        © 2026 {BUSINESS_NAME}. All rights reserved.
      </p>
    </footer>
  );
}

