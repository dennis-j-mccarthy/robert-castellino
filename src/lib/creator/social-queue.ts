import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { deletePagePost, MetaError } from "@/lib/meta/graph";
import { SITE } from "@/lib/creator/pillars";

/*
  The existing SocialDraft table as the Post maker's queue. SERVER ONLY.

  The auto-generated drafts (one per platform per published Musing) keep
  working as before. The Post maker adds rows with musingId "post:<id>" —
  standalone posts — and writes Meta's result back (status, metaPostId,
  scheduledAt, publishedAt, error; migration 0009). Nothing here throws into
  the publish path; with no DB every function is a silent no-op.
*/

export type QueueStatus = "draft" | "approved" | "posted" | "scheduled" | "failed";

export interface QueueItem {
  id: string;
  musingId: string;
  standalone: boolean;
  platform: string;
  caption: string;
  image: string | null;
  link: string;
  status: QueueStatus;
  pillarId: string | null;
  metaPostId: string | null;
  scheduledAt: string | null;
  publishedAt: string | null;
  error: string | null;
  createdAt: string;
  updatedAt: string;
  /** Facebook permalink when we know the post id. */
  permalink: string | null;
}

type Row = {
  id: string;
  musingId: string;
  platform: string;
  caption: string;
  image: string | null;
  link: string;
  status: string;
  pillarId: string | null;
  metaPostId: string | null;
  scheduledAt: Date | null;
  publishedAt: Date | null;
  error: string | null;
  createdAt: Date;
  updatedAt: Date;
};

const STATUSES: QueueStatus[] = ["draft", "approved", "posted", "scheduled", "failed"];

export function toQueueItem(r: Row): QueueItem {
  return {
    id: r.id,
    musingId: r.musingId,
    standalone: r.musingId.startsWith("post:"),
    platform: r.platform,
    caption: r.caption,
    image: r.image,
    link: r.link,
    status: (STATUSES as string[]).includes(r.status) ? (r.status as QueueStatus) : "draft",
    pillarId: r.pillarId,
    metaPostId: r.metaPostId,
    scheduledAt: r.scheduledAt?.toISOString() ?? null,
    publishedAt: r.publishedAt?.toISOString() ?? null,
    error: r.error,
    createdAt: r.createdAt.toISOString(),
    updatedAt: r.updatedAt.toISOString(),
    permalink: r.metaPostId && r.status === "posted" ? `https://www.facebook.com/${r.metaPostId}` : null,
  };
}

/** Scheduled (soonest first), then posted / failed (latest first). */
export async function listQueue(): Promise<QueueItem[]> {
  if (!isDatabaseConfigured()) return [];
  const scheduled = await prisma.socialDraft.findMany({
    where: { status: "scheduled" },
    orderBy: [{ scheduledAt: "asc" }],
    take: 100,
  });
  const done = await prisma.socialDraft.findMany({
    where: { status: { in: ["posted", "failed"] }, metaPostId: { not: null } },
    orderBy: [{ updatedAt: "desc" }],
    take: 100,
  });
  const failed = await prisma.socialDraft.findMany({
    where: { status: "failed", metaPostId: null },
    orderBy: [{ updatedAt: "desc" }],
    take: 20,
  });
  return [...scheduled, ...done, ...failed].map(toQueueItem);
}

export interface PostOutcome {
  ok: boolean;
  id?: string;
  scheduled?: boolean;
  scheduledAt?: string | null;
  error?: string;
}

/**
 * Record what the Post maker just did. With a `draftId` (an existing
 * SocialDraft the user picked up) that row takes the result; otherwise a
 * standalone "post:<id>" row is created. Best-effort: never throws.
 */
export async function recordPost(input: {
  draftId?: string | null;
  platform: "facebook";
  caption: string;
  imageUrl: string | null;
  pillarId?: string | null;
  link?: string;
  outcome: PostOutcome;
}): Promise<string | null> {
  if (!isDatabaseConfigured()) return null;
  const o = input.outcome;
  const data = {
    caption: input.caption,
    image: input.imageUrl,
    ...(input.pillarId ? { pillarId: input.pillarId } : {}),
    status: !o.ok ? "failed" : o.scheduled ? "scheduled" : "posted",
    metaPostId: o.ok ? (o.id ?? null) : null,
    scheduledAt: o.ok && o.scheduled && o.scheduledAt ? new Date(o.scheduledAt) : null,
    publishedAt: o.ok && !o.scheduled ? new Date() : null,
    error: o.ok ? null : (o.error ?? "Post failed."),
  };
  try {
    if (input.draftId) {
      const existing = await prisma.socialDraft.findUnique({ where: { id: input.draftId } });
      if (existing) {
        const row = await prisma.socialDraft.update({ where: { id: existing.id }, data });
        return row.id;
      }
    }
    const row = await prisma.socialDraft.create({
      data: {
        musingId: `post:${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`,
        platform: input.platform,
        link: input.link ?? SITE.url,
        hashtags: null,
        ...data,
      },
    });
    return row.id;
  } catch (err) {
    console.error("[creator/queue] failed to record post:", err);
    return null;
  }
}

/**
 * Cancel a scheduled post: delete the Graph object with the Page token and
 * return the row to "draft". If Meta says it is already gone, reset anyway.
 */
export async function cancelScheduled(
  id: string,
  pageToken: string,
): Promise<{ ok: true; item: QueueItem } | { ok: false; error: string; status: number }> {
  const row = await prisma.socialDraft.findUnique({ where: { id } });
  if (!row) return { ok: false, error: "Not found.", status: 404 };
  if (row.status !== "scheduled" || !row.metaPostId) {
    return { ok: false, error: "Only scheduled posts can be cancelled.", status: 409 };
  }
  try {
    await deletePagePost(row.metaPostId, pageToken);
  } catch (e) {
    const gone = e instanceof MetaError && e.code === 100;
    if (!gone) return { ok: false, error: e instanceof Error ? e.message : "Couldn't cancel on Facebook.", status: 502 };
  }
  const updated = await prisma.socialDraft.update({
    where: { id },
    data: { status: "draft", metaPostId: null, scheduledAt: null, publishedAt: null, error: null },
  });
  return { ok: true, item: toQueueItem(updated) };
}
