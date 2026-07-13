import type { Metadata } from "next";
import SeoUseCasePage from "@/components/SeoUseCasePage";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Sorry Card Online - Make a Private Apology Card",
  description:
    "Create a private sorry card online with a soft reveal, personal apology message, music, tiny questions, and a private reply room.",
  alternates: {
    canonical: "/sorry-card",
  },
  openGraph: {
    title: `Sorry Card Online - ${SITE_NAME}`,
    description:
      "A private digital apology card that feels more thoughtful than a text.",
    url: "/sorry-card",
    images: [
      {
        url: absoluteUrl("/themes/maan_jao_cover.png"),
        width: 1024,
        height: 1024,
        alt: "VibeCheck sorry card cover",
      },
    ],
  },
};

export default function SorryCardPage() {
  return (
    <SeoUseCasePage
      eyebrow="Private apology card"
      title="Make a sorry card that feels honest, private, and worth opening."
      description="VibeCheck helps you send a private apology card online when a plain sorry message feels too small. Add your words, a soft cover, a song, a few tiny questions, and one private link."
      image="/themes/maan_jao_cover.png"
      imageAlt="Soft puppy sorry card cover"
      ctaHref="/customize?type=maan_jao&new=1"
      ctaLabel="Create a sorry card"
      accentEmoji="🥺"
      benefits={[
        "Turn a rushed apology into a calm, intentional digital card.",
        "Use a private link instead of forwarding a generic template.",
        "Let the recipient reply inside a safe two-person room.",
      ]}
      steps={[
        "Choose the Sorry Card mood.",
        "Write the apology in your own words.",
        "Add a song and at least three tiny questions.",
        "Pay, send the private link, and track replies in your dashboard.",
      ]}
      faqs={[
        {
          question: "Can I create a sorry card online for one person?",
          answer:
            "Yes. VibeCheck creates one private apology card link for one recipient, so it feels more personal than a copied message.",
        },
        {
          question: "Does the sorry card include a reply room?",
          answer:
            "Yes. The recipient can reply inside a private room that stays available while the card is active.",
        },
      ]}
    />
  );
}
