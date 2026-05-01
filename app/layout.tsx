import type { Metadata } from "next";
import { Playfair_Display, Inter } from "next/font/google";
import "./globals.css";

// These CSS variables get overridden by Next.js fonts at runtime — see globals.css
// where @theme reads them.
const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
  weight: ["500", "600", "700"],
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
  display: "swap",
  weight: ["300", "400", "500", "600", "700"],
});

export const metadata: Metadata = {
  metadataBase: new URL("https://padel-leaf.vercel.app"),
  title: {
    default: "Padel Leaf — Outdoor padel, played right.",
    template: "%s · Padel Leaf",
  },
  description:
    "Three premium outdoor padel courts in Mezher, Bsalim, Mount Lebanon. Reserve by the hour. A club, not a court rental.",
  openGraph: {
    title: "Padel Leaf — Outdoor padel, played right.",
    description:
      "Three premium outdoor padel courts in Mezher, Bsalim, Mount Lebanon.",
    type: "website",
    locale: "en_US",
    siteName: "Padel Leaf",
  },
  robots: { index: true, follow: true },
  twitter: {
    card: "summary_large_image",
    title: "Padel Leaf — Outdoor padel, played right.",
    description: "Three premium outdoor padel courts in Mezher, Bsalim, Mount Lebanon. Reserve by the hour.",
  },
  alternates: { canonical: "https://padel-leaf.vercel.app" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className={`${playfair.variable} ${inter.variable}`}>
      <body className="min-h-screen flex flex-col">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": ["SportsActivityLocation", "LocalBusiness"],
            "name": "Padel Leaf",
            "description": "Three premium outdoor padel courts in Mezher, Bsalim, Mount Lebanon.",
            "url": "https://padel-leaf.vercel.app",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Mezher",
              "addressLocality": "Bsalim",
              "addressRegion": "Mount Lebanon",
              "addressCountry": "LB"
            },
            "geo": { "@type": "GeoCoordinates", "latitude": 33.8938, "longitude": 35.5731 },
            "openingHours": "Mo-Su 07:00-23:00",
            "priceRange": "$$",
            "sport": "Padel",
            "amenityFeature": [
              { "@type": "LocationFeatureSpecification", "name": "Outdoor courts", "value": true },
              { "@type": "LocationFeatureSpecification", "name": "LED lighting",   "value": true },
              { "@type": "LocationFeatureSpecification", "name": "Free parking",   "value": true }
            ]
          }) }}
        />
        {children}
      </body>
    </html>
  );
}
