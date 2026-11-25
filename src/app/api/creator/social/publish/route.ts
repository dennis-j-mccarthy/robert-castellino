import { NextResponse } from "next/server";
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

type Input = { caption: string; imageUrl?: string; scheduledAt?: string; pillarId?: string; draftId?: string };
function parse(b: unknown): Input | string {
  if (!b || typeof b !== "object") return "Invalid request.";
  const o = b as Record<string, unknown>;
  const caption = String(o.caption ?? "").trim();
  if (!caption) return "Write a caption.";
  if (caption.length > 5000) return "Caption is too long.";
  const imageUrl = typeof o.imageUrl === "string" && o.imageUrl ? o.imageUrl : undefined;
  if (imageUrl && !/^https?:\/\//i.test(imageUrl)) return "Image URL must be absolute.";
  const str = (k: string) => (typeof o[k] === "string" && o[k] ? String(o[k]) : undefined);
  return { caption, imageUrl, scheduledAt: str("scheduledAt"), pillarId: str("pillarId"), draftId: str("draftId") };
}

export async function POST(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  const parsed = parse(await req.json().catch(() => null));
  if (typeof parsed === "string") return NextResponse.json({ error: parsed }, { status: 400 });
  const input = parsed;
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
