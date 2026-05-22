import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import "./globals.css";
import { Aurora } from "@/components/aurora";
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

export const metadata: Metadata = {
  title: "Robert Castellino — Nature & Landscape Photography, Boulder CO",
  description:
    "Four decades of large-format landscape photography from the Colorado Rockies and the wider American West — a working archive by Robert Castellino.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${cormorant.variable} ${manrope.variable}`}>
      <body>
        <Aurora />
        <Nav />
        <main className="stage">{children}</main>
        <Footer />
        <Ticker />
      </body>
    </html>
  );
}
