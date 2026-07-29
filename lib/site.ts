export const SITE_NAME = "VibeCheck";

export const SITE_TITLE =
  "VibeCheck - Private interactive greeting cards for one person";

export const SITE_DESCRIPTION =
  "Create private interactive greeting cards for sorry, happy birthday, bestie, love, and special moments. Add a photo, song, tiny questions, and one private link.";

export const DEFAULT_SITE_URL = "https://vibecheck-gh7u.onrender.com";

const configuredSiteUrl = process.env.NEXT_PUBLIC_BASE_URL?.trim();
const configuredAsLocalhost = configuredSiteUrl
  ? /^https?:\/\/(?:localhost|127\.0\.0\.1)(?::\d+)?(?:\/|$)/i.test(configuredSiteUrl)
  : false;

export const SITE_URL = (
  process.env.NODE_ENV === "production" && configuredAsLocalhost
    ? DEFAULT_SITE_URL
    : configuredSiteUrl || DEFAULT_SITE_URL
).replace(/\/+$/, "");

export const SITE_KEYWORDS = [
  "VibeCheck",
  "VibeCheck cards",
  "private greeting cards",
  "interactive greeting cards",
  "digital greeting card",
  "personalized greeting card",
  "online greeting card",
  "private digital card",
  "sorry card online",
  "apology card",
  "happy birthday card online",
  "birthday digital card",
  "bestie card",
  "best friend card",
  "love card online",
  "digital card India",
  "personalized card India",
];

export const PUBLIC_SEO_ROUTES = [
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
  {
    path: "/birthday-card",
    priority: 0.85,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/bestie-card",
    priority: 0.85,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/about",
    priority: 0.7,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/pricing",
    priority: 0.8,
    changeFrequency: "weekly" as const,
  },
  {
    path: "/contact",
    priority: 0.6,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/terms",
    priority: 0.4,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/privacy",
    priority: 0.4,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/refund-policy",
    priority: 0.5,
    changeFrequency: "monthly" as const,
  },
  {
    path: "/shipping-policy",
    priority: 0.5,
    changeFrequency: "monthly" as const,
  },
];

export function absoluteUrl(path = "/") {
  if (path.startsWith("http")) return path;
  return `${SITE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
