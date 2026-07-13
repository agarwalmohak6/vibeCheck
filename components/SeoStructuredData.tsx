import { absoluteUrl, SITE_DESCRIPTION, SITE_NAME, SITE_URL } from "@/lib/site";
import { TIERS } from "@/lib/themes";

const faqItems = [
  {
    question: "What is VibeCheck?",
    answer:
      "VibeCheck is a private interactive greeting card maker for one person. You can create a sorry card, birthday card, bestie card, love note, or private digital card with a photo, music, questions, and a shareable link.",
  },
  {
    question: "Can I make a private sorry card online?",
    answer:
      "Yes. VibeCheck lets you make a private sorry card online with a soft reveal, a custom apology message, a song, and a private reply room.",
  },
  {
    question: "Does the recipient need to install an app?",
    answer:
      "No. The recipient opens the VibeCheck card from a private browser link. No app install is required.",
  },
  {
    question: "Can I track my VibeCheck card?",
    answer:
      "Creators can use the dashboard to track created cards, payment status, recipient links, private rooms, and replies.",
  },
];

function serializeJsonLd(data: unknown) {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export default function SeoStructuredData() {
  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "Organization",
      name: SITE_NAME,
      url: SITE_URL,
      logo: absoluteUrl("/favicon.ico"),
      sameAs: [
        "https://instagram.com/vibecheck.cards",
        "https://facebook.com/vibecheckcards",
      ],
    },
    {
      "@context": "https://schema.org",
      "@type": "WebSite",
      name: SITE_NAME,
      alternateName: ["VibeCheck Private Cards", "VibeCheck Cards"],
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      inLanguage: "en-IN",
    },
    {
      "@context": "https://schema.org",
      "@type": "SoftwareApplication",
      name: SITE_NAME,
      applicationCategory: "LifestyleApplication",
      operatingSystem: "Web",
      url: SITE_URL,
      description: SITE_DESCRIPTION,
      offers: {
        "@type": "OfferCatalog",
        name: "VibeCheck private card plans",
        itemListElement: TIERS.map((tier) => ({
          "@type": "Offer",
          name: `${tier.duration} VibeCheck card`,
          price: tier.price,
          priceCurrency: "INR",
          availability: "https://schema.org/InStock",
          url: absoluteUrl(`/customize?tier=${tier.id}&new=1`),
        })),
      },
    },
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faqItems.map((item) => ({
        "@type": "Question",
        name: item.question,
        acceptedAnswer: {
          "@type": "Answer",
          text: item.answer,
        },
      })),
    },
  ];

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: serializeJsonLd(jsonLd) }}
    />
  );
}
