import type { KeywordRow } from "@/lib/creator/keywords";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import KeywordsClient from "./KeywordsClient";

export const dynamic = "force-dynamic";

// Strategy → Keywords: the phrases people type when looking for the book, a
// Colorado gift or Bob's photography. Tiles + a word cloud. Photography and
// the book only; Fluid Pathways keywords live in that studio.
export default async function KeywordsPage() {
  const db = isDatabaseConfigured();
  const rows: KeywordRow[] = db
    ? ((await prisma.keyword.findMany({ orderBy: [{ priority: "desc" }, { phrase: "asc" }] }).catch(() => [])) as KeywordRow[])
    : [];
  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">Strategy</div>
      <h1>Keywords</h1>
      <div className="kw-explain">
        <div className="tl-eyebrow">What this does</div>
        <p>
          These are the words people type into Google when they are looking for something you make: a Colorado gift, a
          coffee table book, landscape photography. Gift searches come first, because that person is ready to buy and has
          not picked anything yet. Bigger words in the cloud matter more. Click &ldquo;Suggest phrases&rdquo; for new
          ideas, add the ones that fit, and mark the best ones &ldquo;Target this&rdquo;. Those are the words to use in
          Musings, captions and ads. The sizes are our judgement, not Google&rsquo;s search counts.
        </p>
      </div>
      {!db && <p className="ads-notice ads-notice--warn">The database isn&rsquo;t connected, so nothing can be saved here yet.</p>}
      <KeywordsClient initial={rows} />
    </section>
  );
}
