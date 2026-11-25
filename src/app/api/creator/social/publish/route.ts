import { NextResponse } from "next/server";
import { z } from "zod";
import { creatorGuard } from "@/lib/creator/guard";
import { resolvePillarId } from "@/lib/creator/pillar-store";
import { recordPost } from "@/lib/creator/social-queue";
import { MetaError, publishPagePost } from "@/lib/studio-meta/graph";
import { getConnection, isConnected } from "@/lib/studio-meta/store";

/*
  POST /api/creator/social/publish — publish or schedule a post on the
  connected Facebook Page (Make a post, Instant post). The outcome is
  recorded on SocialDraft (best-effort) so the board can show it.
*/
export const runtime = "nodejs";

const Schema = z.object({
  caption: z.string().min(1, "Write a caption.").max(5000),
  imageUrl: z.string().url().optional(),
  scheduledAt: z.string().optional(),
  pillarId: z.string().optional(),
  draftId: z.string().optional(),
});

export async function POST(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  let input: z.infer<typeof Schema>;
  try { input = Schema.parse(await req.json()); } catch (e: unknown) {
    return NextResponse.json({ error: e instanceof z.ZodError ? e.issues[0]?.message : "Invalid request." }, { status: 400 });
  }
  const conn = await getConnection();
  if (!isConnected(conn)) return NextResponse.json({ error: "Facebook isn't connected yet." }, { status: 409 });
  const pillarId = (await resolvePillarId(input.pillarId)) ?? undefined;
  const scheduledAt = input.scheduledAt && input.scheduledAt.trim() ? input.scheduledAt : undefined;
  try {
    const result = await publishPagePost({ pageId: conn.pageId!, pageToken: conn.pageToken!, message: input.caption, imageUrl: input.imageUrl, scheduledAt });
    const draftId = await recordPost({ draftId: input.draftId, platform: "facebook", caption: input.caption, imageUrl: input.imageUrl ?? null, pillarId, outcome: { ok: true, id: result.id, scheduled: result.scheduled, scheduledAt: result.scheduledAt ?? null } });
    return NextResponse.json({ ok: true, id: result.id, scheduled: result.scheduled, scheduledAt: result.scheduledAt ?? null, page: conn.pageName, draftId });
  } catch (e: unknown) {
    const msg = e instanceof MetaError || e instanceof Error ? e.message : "Post failed.";
    await recordPost({ draftId: input.draftId, platform: "facebook", caption: input.caption, imageUrl: input.imageUrl ?? null, pillarId, outcome: { ok: false, error: msg } }).catch(() => undefined);
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
