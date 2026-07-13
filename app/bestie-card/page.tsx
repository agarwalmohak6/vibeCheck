import type { Metadata } from "next";
import SeoUseCasePage from "@/components/SeoUseCasePage";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Bestie Card Online - Private Best Friend Digital Card",
  description:
    "Create a private bestie card online for your best friend with a personal message, music, inside-joke questions, and a private reply room.",
  alternates: {
    canonical: "/bestie-card",
  },
  openGraph: {
    title: `Bestie Card Online - ${SITE_NAME}`,
    description:
      "A private digital card for best friends, inside jokes, and tiny emotional moments.",
    url: "/bestie-card",
    images: [
      {
        url: absoluteUrl("/themes/bestie_cover.png"),
        width: 1024,
        height: 1024,
        alt: "VibeCheck bestie card cover",
      },
    ],
  },
};

export default function BestieCardPage() {
  return (
    <SeoUseCasePage
      eyebrow="Private best friend card"
      title="Make a bestie card for the person who gets every inside joke."
      description="VibeCheck lets you create a private digital bestie card with your message, a bright cover, music, tiny questions, and a reply room for the two of you."
      image="/themes/bestie_cover.png"
      imageAlt="Bestie greeting card cover"
      ctaHref="/customize?type=bestie_check&new=1"
      ctaLabel="Create a bestie card"
      accentEmoji="✨"
      benefits={[
        "Celebrate your best friend without making it feel like a generic post.",
        "Add inside-joke questions and a song that only they understand.",
        "Keep replies private inside the card room.",
      ]}
      steps={[
        "Choose the Bestie Card mood.",
        "Write the message like you actually talk to them.",
        "Add a song and customize three to five questions.",
        "Share the private link and keep the reply room open while the card is active.",
      ]}
      faqs={[
        {
          question: "Can I make a bestie card online?",
          answer:
            "Yes. VibeCheck gives you a private bestie card link with music, questions, and a reply room.",
        },
        {
          question: "Is the bestie card public?",
          answer:
            "No. VibeCheck cards are designed as private links for one recipient, not public feed posts.",
        },
      ]}
    />
  );
}
