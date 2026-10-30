import { CONCEPT_COUNT, CONCEPT_SETS } from "@/lib/creator/concepts";
import { BOOK_CAMPAIGN_ID } from "@/lib/creator/in-market";
import { loadLibrary } from "@/lib/creator/library";
import NextSteps from "./NextSteps";
import PaidSocialClient from "./PaidSocialClient";

export const dynamic = "force-dynamic";

// Channels → Paid social: the control room for the book campaign. Campaign →
// ad sets → ads with Meta's own names/statuses and Ads Manager links; on/off
// switches (ON asks for confirmation since it can spend); concepts become
// PAUSED ads from in-book plates. Next steps plan sits on top.
export default async function PaidSocialPage() {
  const lib = await loadLibrary();
  const plates = lib.items.filter((i) => i.inBook && !i.mockup).map((i) => ({ src: i.src, label: i.title ?? i.label, page: i.bookPage }));
  return (
    <section className="admin-page cr-page">
      <h1>Paid social</h1>
      <p>
        The book campaign, run from here. Same names and statuses as Meta Ads Manager, with a direct link at every
        level. Ads are created switched off and only from plates that are in the book. {CONCEPT_COUNT} concepts on the
        bench · campaign <code>{BOOK_CAMPAIGN_ID}</code>.
      </p>
      <NextSteps />
      <PaidSocialClient sets={CONCEPT_SETS} plates={plates} />
    </section>
  );
}
