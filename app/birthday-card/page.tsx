import type { Metadata } from "next";
import SeoUseCasePage from "@/components/SeoUseCasePage";
import { absoluteUrl, SITE_NAME } from "@/lib/site";

export const metadata: Metadata = {
  title: "Happy Birthday Card Online - Private Digital Birthday Card",
  description:
    "Create a private happy birthday card online with a gift-like reveal, birthday cover, music, personal message, and reply room.",
  alternates: {
    canonical: "/birthday-card",
  },
  openGraph: {
    title: `Happy Birthday Card Online - ${SITE_NAME}`,
    description:
      "A private digital birthday card that feels like a real little gift.",
    url: "/birthday-card",
    images: [
      {
        url: absoluteUrl("/themes/birthday_roast_cover.png"),
        width: 1024,
        height: 1024,
        alt: "VibeCheck happy birthday card cover",
      },
    ],
  },
};

export default function BirthdayCardPage() {
  return (
    <SeoUseCasePage
      eyebrow="Private birthday card"
      title="Make a happy birthday card that feels like more than a story post."
      description="Build a private digital birthday card with a polished reveal, birthday visuals, a song, personal wishes, and tiny questions that make the recipient smile before they reply."
      image="/themes/birthday_roast_cover.png"
      imageAlt="Happy birthday greeting card cover"
      ctaHref="/customize?type=birthday_roast&new=1"
      ctaLabel="Create a birthday card"
      accentEmoji="🎂"
      benefits={[
        "Send birthday wishes that feel made for them, not everyone.",
        "Use music, cake energy, and a playful reveal to make the link feel giftable.",
        "Track opens and replies from your creator dashboard.",
      ]}
      steps={[
        "Choose the Happy Birthday card.",
        "Add your birthday message, cover photo, and song.",
        "Customize at least three birthday questions.",
        "Send one private link and let the moment unfold.",
      ]}
      faqs={[
        {
          question: "Is this better than a normal birthday text?",
          answer:
            "VibeCheck adds a reveal, cover, music, questions, and a private reply space, so the birthday card feels more like a small gift.",
        },
        {
          question: "Can I make the birthday card funny or emotional?",
          answer:
            "Yes. You can write your own message and customize the questions so the card can feel funny, warm, dramatic, or sentimental.",
        },
      ]}
    />
  );
}
