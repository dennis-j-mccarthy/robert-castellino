import { getBrandEssence } from "@/lib/creator/essence-store";
import { loadLibrary } from "@/lib/creator/library";
import { loadPillars } from "@/lib/creator/pillar-store";
import { isDatabaseConfigured } from "@/lib/prisma";
import LibraryClient from "./LibraryClient";

export const dynamic = "force-dynamic";

// Creative → Library: a view over the gallery (Photo rows), the committed
// ad-image manifest and the Creator-page tags. No uploads here — those
// stay in /admin/collections. Mockups are badged red and never ad-eligible.
export default async function LibraryPage() {
  const [lib, pillars, essence] = await Promise.all([loadLibrary(), loadPillars(), getBrandEssence()]);
  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">Creative</div>
      <h1>Library</h1>
      <p>
        {lib.counts.total} images · {lib.counts.inBook} in the book · {lib.counts.tagged} tagged with a pillar
        {lib.counts.mockups ? ` · ${lib.counts.mockups} mockup${lib.counts.mockups === 1 ? "" : "s"} (never for ads or posts)` : ""}.
        Uploads live in <a href="/admin/collections">Collections</a>.
      </p>
      <LibraryClient initial={lib} pillars={pillars} messages={essence.messages} db={isDatabaseConfigured()} />
    </section>
  );
}
