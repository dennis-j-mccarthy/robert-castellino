import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { absoluteImageUrl } from "@/lib/creator/library";
import { fmtDay, fmtTime } from "@/lib/creator/plan";
import PostCards, { type PostCard } from "./PostCards";

/*
  Posts leads with every post as a card, 4 across like the Blog, with filter
  chips: All · Published · Scheduled · Drafts (· Failed when any). The maker
  sits below. This file loads and serialises; PostCards renders.
*/

export async function loadPosts(): Promise<PostCard[]> {
  if (!isDatabaseConfigured()) return [];
  try {
    const rows = await prisma.socialDraft.findMany({ orderBy: [{ updatedAt: "desc" }], take: 200, select: { id: true, platform: true, caption: true, image: true, status: true, scheduledAt: true, publishedAt: true, updatedAt: true, metaPostId: true, error: true, musingId: true } });
    return rows.map((r) => {
      const state: PostCard["state"] = r.status === "posted" ? "published" : r.status === "scheduled" ? "scheduled" : r.status === "failed" ? "failed" : "draft";
      const when = state === "scheduled" ? r.scheduledAt : state === "published" ? r.publishedAt ?? r.updatedAt : r.updatedAt;
      return {
        id: r.id,
        platform: r.platform,
        caption: r.caption,
        image: r.image ? absoluteImageUrl(r.image) : null,
        imageId: r.image,
        state,
        approved: r.status === "approved",
        when: when ? `${fmtDay(when)} · ${fmtTime(when)}` : "",
        sort: (when ?? r.updatedAt).getTime(),
        link: state === "published" && r.metaPostId ? `https://www.facebook.com/${r.metaPostId}` : null,
        error: r.error,
      };
    });
  } catch {
    return [];
  }
}

export default function PostBoard({ rows }: { rows: PostCard[] }) {
  return <PostCards rows={rows} />;
}
