import { getBrandEssence } from "@/lib/creator/essence-store";
import { loadLibrary } from "@/lib/creator/library";
import { loadPillars } from "@/lib/creator/pillar-store";
import { isDatabaseConfigured } from "@/lib/prisma";
import { hasAnthropicKey } from "@/lib/creator/ai";
import KitTabs from "@/components/creator/KitTabs";
import LibraryClient from "./LibraryClient";

export const dynamic = "force-dynamic";

// Creative → Library: a view over the gallery (Photo rows), the committed
// ad-image manifest and the Creator-page tags. No uploads here — those
// stay in /admin/collections. Mockups are badged red and never ad-eligible.
export default async function LibraryPage() {
  const [lib, pillars, essence] = await Promise.all([loadLibrary(), loadPillars(), getBrandEssence()]);
  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">Brand kit</div>
      <h1>Pictures</h1>
      <p>
        {lib.counts.total} images · {lib.counts.inBook} in the book · {lib.counts.tagged} tagged with a pillar
        {lib.counts.mockups ? ` · ${lib.counts.mockups} mockup${lib.counts.mockups === 1 ? "" : "s"} (never for ads or posts)` : ""}.
      </p>
      <KitTabs />
      <LibraryClient key={`${lib.counts.total}-${lib.counts.tagged}`} initial={lib} pillars={pillars} messages={essence.messages} db={isDatabaseConfigured()} ai={hasAnthropicKey()} imageAi={!!process.env.OPENAI_API_KEY} />
    </section>
  );
}
