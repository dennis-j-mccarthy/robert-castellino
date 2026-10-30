import type { Metadata } from "next";
import { Bricolage_Grotesque, Instrument_Sans, JetBrains_Mono } from "next/font/google";
import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { loadLibrary } from "@/lib/creator/library";
import { ensureCreatorSeeded } from "@/lib/creator/seed";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import CreatorShell, { type NavCounts } from "./CreatorShell";
import "../creator.css";

export const metadata: Metadata = {
  title: "Creator — Robert Castellino",
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// The Throughline type stack, loaded for /creator only (the public site
// keeps Cormorant + Manrope). Exposed as CSS variables the scoped
// creator.css reads under `.tl`.
const disp = Bricolage_Grotesque({ variable: "--tl-font-disp", subsets: ["latin"], weight: ["400", "600", "700", "800"], display: "swap" });
const sans = Instrument_Sans({ variable: "--tl-font-sans", subsets: ["latin"], weight: ["400", "500", "600", "700"], display: "swap" });
const mono = JetBrains_Mono({ variable: "--tl-font-mono", subsets: ["latin"], weight: ["400", "500", "700"], display: "swap" });

// Cheap counts for the rail chips. Never let them break the page.
async function navCounts(): Promise<NavCounts> {
  const [library, queued] = await Promise.all([
    loadLibrary().then((l) => l.counts.total).catch(() => null),
    isDatabaseConfigured() ? prisma.socialDraft.count({ where: { status: "scheduled" } }).catch(() => null) : Promise.resolve(null),
  ]);
  return { library, queued };
}

// The Creator page shell. Gated by the SAME admin session as /admin
// (src/middleware.ts bounces logged-out visits to /admin/login?next=…; this
// is the server-side belt to that suspender). First visit seeds the brand
// essence, pillars, tone and library tags if the tables are still empty.
export default async function CreatorLayout({ children }: { children: React.ReactNode }) {
  const session = await getSession();
  if (!session) redirect("/admin/login?next=/creator");
  await ensureCreatorSeeded();
  const counts = await navCounts();

  return (
    <CreatorShell fontClass={`${disp.variable} ${sans.variable} ${mono.variable}`} counts={counts}>
      {children}
    </CreatorShell>
  );
}
