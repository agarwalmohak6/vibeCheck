export const SITE_NAME = "VibeCheck";

export const SITE_TITLE =
  "VibeCheck - Say the thing. Make it unforgettable.";

export const SITE_DESCRIPTION =
  "Create a beautiful private moment for feelings, proposals, and sincere apologies. Add your words, share one link, and let them respond on their phone.";

export const DEFAULT_SITE_URL = "https://vibecheck-gh7u.onrender.com";

export const SITE_URL = (
  process.env.NEXT_PUBLIC_BASE_URL || DEFAULT_SITE_URL
).replace(/\/+$/, "");

export const SITE_KEYWORDS = [
  "VibeCheck",
  "VibeCheck cards",
  "private emotional message",
  "interactive proposal",
  "digital apology card",
  "personalized feelings message",
  "private digital card",
  "private digital card",
  "sorry card online",
  "apology card",
  "proposal message online",
  "feelings message online",
  "private love message",
  "digital card India",
  "personalized card India",
];

export const PUBLIC_SEO_ROUTES = [
  ...['/about', '/pricing', '/contact', '/terms', '/privacy', '/refund-policy', '/shipping-policy'].map(path => ({
    path, priority: 0.5, changeFrequency: 'monthly' as const,
  })),
  {
    path: "/",
    priority: 1,
    changeFrequency: "weekly" as const,
  },
  {
    path: "/sorry-card",
    priority: 0.9,
    changeFrequency: "monthly" as const,
  },
];

export function absoluteUrl(path = "/") {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
