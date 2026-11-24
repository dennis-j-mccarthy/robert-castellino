import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { absoluteImageUrl } from "@/lib/creator/library";
import { fmtDay, fmtTime } from "@/lib/creator/plan";
import { listPublishedPosts, listScheduledPosts } from "@/lib/meta/graph";
import { getConnection, isConnected } from "@/lib/meta/store";
import PostCards, { type PostCard } from "./PostCards";

/*
  Posts leads with every post as a card, 4 across like the Blog, with filter
  chips: All · Published · Scheduled · Drafts (· Failed when any).

  Published and Scheduled come from the Facebook Page itself (Graph API), so
  the board shows what is really on the Page, not only what this maker
  sent. Drafts and failures come from SocialDraft. A SocialDraft row that
  already matches a Page post (by metaPostId) is folded into the Page card.
*/

const when = (d: Date | null) => (d ? `${fmtDay(d)} · ${fmtTime(d)}` : "");

export async function loadPosts(): Promise<PostCard[]> {
  const conn = await getConnection();
  const [published, scheduled, rows] = await Promise.all([
    isConnected(conn) ? listPublishedPosts(conn.pageId ?? "", conn.pageToken ?? "").catch(() => []) : Promise.resolve([]),
    isConnected(conn) ? listScheduledPosts(conn.pageId ?? "", conn.pageToken ?? "").catch(() => []) : Promise.resolve([]),
    isDatabaseConfigured()
      ? prisma.socialDraft.findMany({ orderBy: [{ updatedAt: "desc" }], take: 200, select: { id: true, platform: true, caption: true, image: true, status: true, scheduledAt: true, publishedAt: true, updatedAt: true, metaPostId: true, error: true } }).catch(() => [])
      : Promise.resolve([]),
  ]);

  const byMeta = new Map(rows.filter((r) => r.metaPostId).map((r) => [r.metaPostId as string, r]));
  const seen = new Set<string>();
  const cards: PostCard[] = [];

  for (const p of published) {
    const row = byMeta.get(p.id) ?? byMeta.get(p.id.split("_")[1] ?? "");
    if (row) seen.add(row.id);
    cards.push({
      id: `fb:${p.id}`, platform: "facebook", caption: p.message, image: p.picture, imageId: row?.image ?? null,
      state: "published", approved: false, when: when(p.createdAt), sort: p.createdAt?.getTime() ?? 0,
      link: p.permalink ?? `https://www.facebook.com/${p.id}`, error: null,
    });
  }
  for (const p of scheduled) {
    const row = byMeta.get(p.id) ?? byMeta.get(p.id.split("_")[1] ?? "");
    if (row) seen.add(row.id);
    cards.push({
      id: row?.id ?? `fb:${p.id}`, platform: "facebook", caption: p.message, image: p.picture ?? (row?.image ? absoluteImageUrl(row.image) : null), imageId: row?.image ?? null,
      state: "scheduled", approved: false, when: when(p.scheduledFor), sort: p.scheduledFor?.getTime() ?? 0,
      link: null, error: null,
    });
  }
  for (const r of rows) {
    if (seen.has(r.id)) continue;
    if (r.status === "posted" && r.metaPostId) continue; // the Page feed is the truth for published; a deleted post should not linger here
    const state: PostCard["state"] = r.status === "scheduled" ? "scheduled" : r.status === "failed" ? "failed" : r.status === "posted" ? "published" : "draft";
    const at = state === "scheduled" ? r.scheduledAt : state === "published" ? r.publishedAt ?? r.updatedAt : r.updatedAt;
    cards.push({
      id: r.id, platform: r.platform, caption: r.caption, image: r.image ? absoluteImageUrl(r.image) : null, imageId: r.image,
      state, approved: r.status === "approved", when: when(at), sort: (at ?? r.updatedAt).getTime(),
      link: null, error: r.error,
    });
  }
  return cards;
}

export default function PostBoard({ rows }: { rows: PostCard[] }) {
  return <PostCards rows={rows} />;
}
