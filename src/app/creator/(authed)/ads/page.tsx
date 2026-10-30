import { CONCEPT_COUNT, CONCEPT_SETS } from "@/lib/creator/concepts";
import { BOOK_CAMPAIGN_ID } from "@/lib/creator/in-market";
import { loadLibrary } from "@/lib/creator/library";
import NextSteps from "./NextSteps";
import PaidSocialClient from "./PaidSocialClient";

export const dynamic = "force-dynamic";

// Channels → Paid social. (a) In market: the live ads in the book campaign,
// read-only, from the Marketing API. (b) Concepts: the 37 book concepts,
// each with "Stage in Ads maker" — a deep link into the existing /admin/ads,
// which alone creates ads (paused) and enforces the in-book plate rule.
// Nothing on this page can spend money.
export default async function PaidSocialPage() {
  const lib = await loadLibrary();
  const plates = lib.items.filter((i) => i.inBook && !i.mockup).map((i) => ({ src: i.src, label: i.title ?? i.label, page: i.bookPage }));
  return (
    <section className="admin-page cr-page">
      <h1>Paid social</h1>
      <p>
        What&rsquo;s in market and what&rsquo;s on the bench. Read-only here — ads are made, paused, in the{" "}
        <a href="/admin/ads">Ads maker</a>, and only from plates that are in the book. {CONCEPT_COUNT} concepts ·
        campaign <code>{BOOK_CAMPAIGN_ID}</code>.
      </p>
      <NextSteps />
      <PaidSocialClient sets={CONCEPT_SETS} plates={plates} />
    </section>
  );
}
