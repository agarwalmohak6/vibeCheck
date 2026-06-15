import type { Metadata, Viewport } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { Inter, Outfit, Caveat_Brush, Dancing_Script, Cormorant_Garamond, Cinzel_Decorative } from 'next/font/google';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
});

const outfit = Outfit({
  subsets: ['latin'],
  variable: '--font-outfit',
  display: 'swap',
});

const caveatBrush = Caveat_Brush({
  weight: '400',
  subsets: ['latin'],
  variable: '--font-caveat-brush',
  display: 'swap',
});

const dancingScript = Dancing_Script({
  subsets: ['latin'],
  variable: '--font-dancing-script',
  display: 'swap',
});

const cormorantGaramond = Cormorant_Garamond({
  weight: ['400', '600', '700'],
  subsets: ['latin'],
  variable: '--font-cormorant-garamond',
  display: 'swap',
});

const cinzelDecorative = Cinzel_Decorative({
  weight: ['400', '700', '900'],
  subsets: ['latin'],
  variable: '--font-cinzel-decorative',
  display: 'swap',
});

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

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-theme="midnight_romance"
      className={`${inter.variable} ${outfit.variable} ${caveatBrush.variable} ${dancingScript.variable} ${cormorantGaramond.variable} ${cinzelDecorative.variable}`}
    >
      <body data-scroll-behavior="smooth">
        <ThemeProvider initial="midnight_romance">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
