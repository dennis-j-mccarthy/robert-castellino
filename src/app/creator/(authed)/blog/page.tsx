import { studio } from "@/studio.config";
import Link from "next/link";
import { loadLibrary } from "@/lib/creator/library";
import { loadPillars } from "@/lib/creator/pillar-store";
import { getTone } from "@/lib/creator/tone-store";
import { hasAnthropicKey } from "@/lib/creator/ai";
import BlogGenerator from "./BlogGenerator";
import MusingCards, { loadMusingCards } from "./MusingCards";
import BlogAccordion from "./BlogAccordion";

export const dynamic = "force-dynamic";

// Content → Blog generator: tone → titles → write → edit → publish.
// Publishes into the existing Musing model through /api/admin/musings, so
// the piece appears at /musings exactly like one typed in /admin/musings.
export default async function BlogPage() {
  const [pillars, tone, library, musings] = await Promise.all([loadPillars(), getTone(), loadLibrary(), loadMusingCards()]);
  return (
    <section className="admin-page cr-page">
      <div className="cr-pagehead">
        <div>
          <div className="tl-eyebrow">Blog</div>
          <h1>Blog</h1>
        </div>
        <Link className="btn btn--ghost ui-btn-sm" href="/creator/blog/posts">All blog posts →</Link>
      </div>
      <p>Write a new post, then see it with everything already published. Star posts to put them in the next newsletter. {studio.brand.blog.label !== "Blog" ? ` On the public site they appear as ${studio.brand.blog.label}.` : ""}</p>
      <BlogAccordion
        live={musings.cards.filter((c) => c.published).length}
        drafts={musings.cards.filter((c) => !c.published).length}
        write={<BlogGenerator pillars={pillars} tone={tone.tone} ai={hasAnthropicKey()} library={library.items.filter((i) => !i.mockup)} />}
        musings={<MusingCards cards={musings.cards} db={musings.db} />}
      />
    </section>
  );
}
