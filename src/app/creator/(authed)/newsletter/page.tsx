import EmailTabs from "@/components/creator/EmailTabs";
import { hasAnthropicKey } from "@/lib/creator/ai";
import { loadPillars } from "@/lib/creator/pillar-store";
import { isDatabaseConfigured } from "@/lib/prisma";
import EmailMaker from "./EmailMaker";

export const dynamic = "force-dynamic";

// Channels → Email: a newsletter from one to three published Musings.
// HTML + text, copy or download — no ESP is wired.
export default async function EmailPage() {
  const pillars = await loadPillars();
  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">5 · Email</div>
      <h1>Newsletter</h1>
      <p>
        A note from the studio built from one to three Musings, with the signed book and the prints as the
        two quiet buttons at the end. Copy the HTML into whatever sends it.
      </p>
      <EmailTabs />
      <EmailMaker pillars={pillars} ai={hasAnthropicKey()} db={isDatabaseConfigured()} />
    </section>
  );
}
