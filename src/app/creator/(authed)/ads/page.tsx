import { CONCEPT_COUNT, CONCEPT_SETS } from "@/lib/creator/concepts";
import { BOOK_CAMPAIGN_ID } from "@/lib/creator/in-market";
import { loadLibrary } from "@/lib/creator/library";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import NextSteps from "./NextSteps";
import PaidSocialClient from "./PaidSocialClient";

export const dynamic = "force-dynamic";

// Which live ads were built from an in-book plate: the Ads maker's drafts
// remember the image each Meta ad was created with, and the library knows
// each plate's page. Ad id → page. Anything we can't match gets no chip.
async function bookPagesByAdId(plates: { src: string; page: number | null }[]): Promise<Record<string, number>> {
  const out: Record<string, number> = {};
  if (!isDatabaseConfigured()) return out;
  try {
    const rows = await prisma.adDraft.findMany({ where: { metaAdId: { not: null } }, select: { metaAdId: true, imageUrl: true } });
    const byPath = new Map(plates.filter((p) => p.page).map((p) => [p.src, p.page as number]));
    for (const r of rows) {
      if (!r.metaAdId) continue;
      let path = r.imageUrl;
      try { path = new URL(r.imageUrl).pathname; } catch {}
      const page = byPath.get(path) ?? byPath.get(decodeURIComponent(path));
      if (page) out[r.metaAdId] = page;
    }
  } catch {}
  return out;
}

// Channels → Paid social: the control room for the book campaign. Campaign →
// ad sets → ads with Meta's own names/statuses and Ads Manager links; on/off
// switches (ON asks for confirmation since it can spend); concepts become
// PAUSED ads from in-book plates. Next steps plan sits on top.
export default async function PaidSocialPage() {
  const lib = await loadLibrary();
  const plates = lib.items.filter((i) => i.inBook && !i.mockup).map((i) => ({ src: i.src, label: i.title ?? i.label, page: i.bookPage }));
  const bookPages = await bookPagesByAdId(plates);
  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">Paid social</div>
      <h1>Ads, built here — launched in Meta</h1>
      <p>
        The book campaign, run from here. Same names and statuses as Meta Ads Manager, with a direct link at every
        level. Ads are created switched off and only from plates that are in the book. {CONCEPT_COUNT} concepts on the
        bench · campaign <code>{BOOK_CAMPAIGN_ID}</code>.
      </p>
      <NextSteps />
      <PaidSocialClient sets={CONCEPT_SETS} plates={plates} bookPages={bookPages} />
    </section>
  );
}
