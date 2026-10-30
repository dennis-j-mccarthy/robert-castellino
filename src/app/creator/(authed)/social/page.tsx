import { hasAnthropicKey } from "@/lib/creator/ai";
import { getBrandEssence } from "@/lib/creator/essence-store";
import { loadLibrary } from "@/lib/creator/library";
import { loadPillars } from "@/lib/creator/pillar-store";
import { getConnection, isConnected } from "@/lib/meta/store";
import PostMaker from "./PostMaker";

export const dynamic = "force-dynamic";

// Channels → Post maker: image → platform → pillar → caption → preview →
// publish / schedule to Bob's Facebook Page through the existing
// /api/admin/facebook/post route. Below it: the drafts picker and the queue.
export default async function SocialPage() {
  const [lib, pillars, essence, conn] = await Promise.all([loadLibrary(), loadPillars(), getBrandEssence(), getConnection()]);
  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">Channels</div>
      <h1>Post machine</h1>
      <p>
        One post at a time, from a real plate. Facebook publishes through Meta; Instagram is copy-only until
        a Business account is linked to the Page.
      </p>
      <PostMaker
        // The picker never offers mockups — adEligible is the real-plates set.
        library={lib.items.filter((i) => i.adEligible)}
        pillars={pillars}
        messages={essence.messages}
        config={{ connected: isConnected(conn), page: conn?.pageName ?? null, pageId: conn?.pageId ?? null, ai: hasAnthropicKey() }}
      />
    </section>
  );
}
