import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { Aurora } from "@/components/aurora";
import { GiftBanner } from "@/components/gift-banner";
import { Nav } from "@/components/nav";
import { Ticker } from "@/components/ticker";
import { Footer } from "@/components/footer";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700"],
  display: "swap",
});

const SITE = "https://robertcastellino.com";

export const metadata: Metadata = {
  metadataBase: new URL(SITE),
  title: {
    default: "Robert Castellino — Nature & Landscape Photography, Boulder CO",
    template: "%s · Robert Castellino",
  },
  description:
    "Half a century of large-format nature photography from the Colorado Rockies — mountains, streams, light, land, sky. A working archive by Robert Castellino.",
  keywords: [
    "Robert Castellino",
    "Colorado landscape photography",
    "nature photography",
    "Boulder photographer",
    "fine art prints",
    "Colorado: Life and Light on the Land",
  ],
  alternates: { canonical: "/" },
  openGraph: {
    type: "website",
    siteName: "Robert Castellino Photography",
    url: SITE,
    title: "Robert Castellino — Nature & Landscape Photography, Boulder CO",
    description:
      "Half a century of Colorado nature photography — prints and the monograph, Life & Light on the Land.",
    images: [{ url: "/assets/maroon-bells.jpg", alt: "Maroon Bells, Colorado" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "Robert Castellino — Colorado Nature Photography",
    description: "Half a century of Colorado nature photography.",
    images: ["/assets/maroon-bells.jpg"],
  },
};

const personLd = {
  "@context": "https://schema.org",
  "@type": "Person",
  name: "Robert Castellino",
  jobTitle: "Photographer & Author",
  url: SITE,
  image: SITE + "/assets/portrait-hat.png",
  worksFor: { "@type": "Organization", name: "Robert Castellino Photography" },
  address: {
    "@type": "PostalAddress",
    addressLocality: "Boulder",
    addressRegion: "CO",
    addressCountry: "US",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable}`}>
      <body>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(personLd) }}
        />
        <GiftBanner />
        <Aurora />
        <Nav />
        <main className="stage">{children}</main>
        <Footer />
        <Ticker />
      </body>
    </html>
  );
}
