import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { loadLibrary } from "@/lib/creator/library";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import CreatorShell, { type NavCounts } from "./CreatorShell";
import "../creator.css";
import { studio } from "@/studio.config";
import { adapters } from "@/studio.adapters";

export const metadata: Metadata = {
  title: `Creator — ${studio.site.short}`,
  robots: { index: false, follow: false },
};

export const dynamic = "force-dynamic";

// The Throughline type stack (Bricolage Grotesque, Instrument Sans, JetBrains
// Mono), loaded for /creator only as a Google Fonts stylesheet. creator.css
// names the families directly, so no CSS variables are needed. next/font is
// deliberately NOT used here: Turbopack's font replacer fails on Bricolage in
// some Next 16 builds ("queries have exactly one entry"), which broke two
// sites' builds.
const FONTS_HREF = "https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:wght@400;600;700;800&family=Instrument+Sans:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500;700&display=swap";

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
  const session = await adapters.auth.getSession();
  if (!session) redirect(`${studio.nav.loginPath ?? "/admin/login"}?next=/creator`);
  if (adapters.seed) await adapters.seed().catch(() => undefined);
  const counts = await navCounts();

  return (
    <>
      <link rel="preconnect" href="https://fonts.googleapis.com" />
      <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      <link rel="stylesheet" href={FONTS_HREF} precedence="default" />
      <CreatorShell fontClass="" counts={counts}>
        {children}
      </CreatorShell>
    </>
  );
}
