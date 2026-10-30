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
      <div className="tl-eyebrow">Channels</div>
      <h1>Email</h1>
      <p>
        A note from the studio built from one to three Musings, with the signed book and the prints as the
        two quiet buttons at the end. Copy the HTML into whatever sends it.
      </p>
      <EmailMaker pillars={pillars} ai={hasAnthropicKey()} db={isDatabaseConfigured()} />
    </section>
  );
}
