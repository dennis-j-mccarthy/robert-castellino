import { getBrandEssence } from "@/lib/creator/essence-store";
import { loadAllPillars } from "@/lib/creator/pillar-store";
import { getTone } from "@/lib/creator/tone-store";
import { isDatabaseConfigured } from "@/lib/prisma";
import EssenceClient from "./EssenceClient";

export const dynamic = "force-dynamic";

// Strategy → Essence: the one line, purpose, promise, do / don't, voice
// dials, CTA, the five pillars, the ten core messages and the six audiences.
// Every generator on the Creator page reads from here.
export default async function EssencePage() {
  const [essence, pillars, tone] = await Promise.all([getBrandEssence(), loadAllPillars(), getTone()]);
  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">Strategy</div>
      <h1>Essence</h1>
      <p>
        What everything else is written from. Change a line here and the next title, Musing, caption and
        newsletter follow it.
      </p>
      <EssenceClient essence={essence} pillars={pillars} tone={tone.tone} db={isDatabaseConfigured()} />
    </section>
  );
}
