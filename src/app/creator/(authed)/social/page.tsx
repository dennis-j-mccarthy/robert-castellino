import { hasAnthropicKey } from "@/lib/creator/ai";
import { getBrandEssence } from "@/lib/creator/essence-store";
import { loadLibrary } from "@/lib/creator/library";
import { loadPillars } from "@/lib/creator/pillar-store";
import { getConnection, isConnected } from "@/lib/meta/store";
import PostBoard, { loadPosts } from "./PostBoard";
import PostMaker from "./PostMaker";

export const dynamic = "force-dynamic";

// Channels → Post maker: image → platform → pillar → caption → preview →
// publish / schedule to Bob's Facebook Page through the existing
// /api/admin/facebook/post route. Below it: the drafts picker and the queue.
export default async function SocialPage() {
  const [lib, pillars, essence, conn, rows] = await Promise.all([loadLibrary(), loadPillars(), getBrandEssence(), getConnection(), loadPosts()]);
  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">Posts</div>
      <h1>Posts</h1>
      <p>Every post as a card. Filter by what is live, what is waiting, and what is still a draft. The maker is below.</p>
      <PostBoard rows={rows} />
      <h2 className="mc__h2" id="make">Make a post <span className="cr-h2sub">· picture, words, when</span></h2>
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
