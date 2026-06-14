import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

export const metadata: Metadata = {
  title: "VibeCheck — Send Vibes, Not Texts 💌",
  description:
    "Create interactive, chaotic, and ultra-aesthetic digital greeting cards. Proposals, apologies, birthdays — lock your card, drop the beat, and watch them dodge the NO button. High-key obsessed, no cap. 💅",
  keywords: ["digital greeting card", "interactive card", "Gen Z", "India", "proposal card", "viral card", "vibecheck"],
  openGraph: {
    title: "VibeCheck — Send Vibes, Not Texts 💌",
    description: "Create interactive cards with chaos mode buttons, secret codes, and viral share mechanics. High-key obsessed, no cap. 💅",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" data-theme="midnight_romance">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <ThemeProvider initial="midnight_romance">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
