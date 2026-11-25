import { hasAnthropicKey } from "@/lib/creator/ai";
import type { LandingSections } from "@/lib/creator/landing";
import { loadLibrary } from "@/lib/creator/library";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import LandingClient from "./LandingClient";

// Search → Landing pages: pick a phrase, the studio writes the page with a
// real plate as the hero; read it, change anything, Publish.
export default async function LandingSection({ preselect }: { preselect?: string }) {
  const db = isDatabaseConfigured();
  const [pages, keywords, lib] = await Promise.all([
    db ? prisma.landingPage.findMany({ orderBy: { updatedAt: "desc" } }).catch(() => []) : Promise.resolve([]),
    db ? prisma.keyword.findMany({ where: { status: { not: "dropped" } }, orderBy: [{ priority: "desc" }, { phrase: "asc" }] }).catch(() => []) : Promise.resolve([]),
    loadLibrary().catch(() => null),
  ]);
  const plates = (lib?.items ?? []).filter((i) => i.adEligible && !i.mockup).map((i) => ({ src: i.src, title: i.title ?? i.label, loc: i.loc }));
  return (
    <div className="sr-sec">
      <div className="kw-explain">
        <div className="tl-eyebrow">What this does</div>
        <p>A landing page is a page built for one search, like &ldquo;Colorado coffee table book.&rdquo; Someone who searches that, or clicks an ad for it, lands on a page about exactly what they wanted, in your voice, with one of your plates at the top and the signed book to order. The studio writes the first draft from Essence and the pillars. You read it, change anything that does not sound like you, and press Publish. Drafts are private until then.</p>
      </div>
      {!db && <p className="ui-notice ui-notice--warn">The database isn&rsquo;t connected, so pages can&rsquo;t be saved here.</p>}
      <LandingClient
        ai={hasAnthropicKey()}
        db={db}
        initialPages={pages.map((p) => ({ ...p, faq: (Array.isArray(p.faq) ? p.faq : []) as { q: string; a: string }[], sections: (p.sections ?? null) as LandingSections | null, createdAt: p.createdAt.toISOString(), updatedAt: p.updatedAt.toISOString() }))}
        keywords={keywords.map((k) => ({ phrase: k.phrase, kind: k.kind, priority: k.priority, landingSlug: k.landingSlug }))}
        plates={plates}
        preselect={preselect ?? ""}
      />
    </div>
  );
}
