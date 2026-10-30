import Link from "next/link";
import { loadLibrary } from "@/lib/creator/library";
import { loadPillars } from "@/lib/creator/pillar-store";
import { getTone } from "@/lib/creator/tone-store";
import { hasAnthropicKey } from "@/lib/creator/ai";
import BlogGenerator from "./BlogGenerator";

export const dynamic = "force-dynamic";

// Content → Blog generator: tone → titles → write → edit → publish.
// Publishes into the existing Musing model through /api/admin/musings, so
// the piece appears at /musings exactly like one typed in /admin/musings.
export default async function BlogPage() {
  const [pillars, tone, library] = await Promise.all([loadPillars(), getTone(), loadLibrary()]);
  return (
    <section className="admin-page cr-page">
      <div className="cr-pagehead">
        <div>
          <div className="tl-eyebrow">Channels</div>
          <h1>Blog</h1>
        </div>
        <Link className="btn btn--ghost ads-btn-sm" href="/creator/blog/posts">All Musings →</Link>
      </div>
      <p>
        A new Musing in four steps. The draft lands in the same place as the ones written by hand, and
        publishing it fires the same hooks (revalidate, IndexNow, social drafts).
      </p>
      <BlogGenerator pillars={pillars} tone={tone.tone} ai={hasAnthropicKey()} library={library.items.filter((i) => !i.mockup)} />
    </section>
  );
}
