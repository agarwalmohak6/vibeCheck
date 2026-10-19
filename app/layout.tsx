import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./romance.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import SeoStructuredData from "@/components/SeoStructuredData";
import {
  absoluteUrl,
  SITE_DESCRIPTION,
  SITE_KEYWORDS,
  SITE_NAME,
  SITE_TITLE,
  SITE_URL,
} from "@/lib/site";
const fontVariables = {
  '--font-quicksand': "'Quicksand', Arial, sans-serif",
  '--font-romance-heading': "'Pacifico', cursive",
  '--font-outfit': "'Outfit', Arial, sans-serif",
  '--font-caveat-brush': "'Caveat Brush', cursive",
  '--font-dancing-script': "'Dancing Script', cursive",
  '--font-cormorant-garamond': "'Cormorant Garamond', Georgia, serif",
  '--font-cinzel-decorative': "'Cinzel Decorative', Georgia, serif",
  '--font-body': "'Quicksand', Arial, sans-serif",
} as React.CSSProperties;

// Fonts now load in the browser, avoiding Turbopack's intermittent
// next/font/google generated import-map failure during Render builds.

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_TITLE,
    template: `%s | ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  authors: [{ name: SITE_NAME, url: SITE_URL }],
  creator: SITE_NAME,
  publisher: SITE_NAME,
  category: "Private emotional messages",
  keywords: SITE_KEYWORDS,
  alternates: {
    canonical: "/",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION,
  },
  openGraph: {
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    url: "/",
    siteName: SITE_NAME,
    images: [
      {
        url: absoluteUrl("/images/hero_image.png"),
        width: 1024,
        height: 1024,
        alt: "VibeCheck private emotional message preview",
      },
    ],
    locale: "en_IN",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [absoluteUrl("/images/hero_image.png")],
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
      data-theme="soft_coquette"
      style={fontVariables}
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Caveat+Brush&family=Cinzel+Decorative:wght@400;700;900&family=Cormorant+Garamond:wght@400;600;700&family=Dancing+Script:wght@400;700&family=Outfit:wght@400;500;600;700;900&family=Pacifico&family=Quicksand:wght@400;500;600;700&display=swap"
        />
      </head>
      <body data-scroll-behavior="smooth">
        <SeoStructuredData />
        <ThemeProvider initial="soft_coquette">
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
