import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { getConnection, isConnected } from "@/lib/meta/store";
import { publishPagePost, MetaError } from "@/lib/meta/graph";
import { recordPost } from "@/lib/creator/social-queue";
import { resolvePillarId } from "@/lib/creator/pillar-store";

export const runtime = "nodejs";

const Schema = z.object({
  caption: z.string().min(1, "Write a caption.").max(5000),
  // Public image URL (Graph fetches it). Must be https and reachable.
  imageUrl: z.string().url().optional(),
  // ISO datetime to schedule; omit/empty to publish now.
  scheduledAt: z.string().optional(),
  // Creator page extras (optional, backward-compatible): the pillar the post
  // carries and an existing SocialDraft row to write the result onto.
  pillarId: z.string().optional(),
  draftId: z.string().optional(),
});

// The real thing: publish or schedule a post on Bob's Facebook Page,
// straight from the app — no browser automation. Used by /admin/social and
// the Creator page's Post maker; the outcome is recorded on SocialDraft so
// the Creator page's queue shows what went out (best-effort, never blocks).
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  let input: z.infer<typeof Schema>;
  try {
    input = Schema.parse(await req.json());
  } catch (e: unknown) {
    const msg = e instanceof z.ZodError ? e.issues[0]?.message : "Invalid request.";
    return NextResponse.json({ error: msg }, { status: 400 });
  }

  const conn = await getConnection();
  if (!isConnected(conn)) {
    return NextResponse.json(
      { error: "Facebook isn't connected yet. Click “Connect Facebook” first." },
      { status: 409 },
    );
  }

  const pillarId = (await resolvePillarId(input.pillarId)) ?? undefined;
  const scheduledAt = input.scheduledAt && input.scheduledAt.trim() ? input.scheduledAt : undefined;

  try {
    const result = await publishPagePost({
      pageId: conn.pageId!,
      pageToken: conn.pageToken!,
      message: input.caption,
      imageUrl: input.imageUrl,
      scheduledAt,
    });
    const draftId = await recordPost({
      draftId: input.draftId,
      platform: "facebook",
      caption: input.caption,
      imageUrl: input.imageUrl ?? null,
      pillarId,
      outcome: { ok: true, id: result.id, scheduled: result.scheduled, scheduledAt: result.scheduledAt ?? null },
    });
    return NextResponse.json({
      ok: true,
      id: result.id,
      scheduled: result.scheduled,
      scheduledAt: result.scheduledAt ?? null,
      page: conn.pageName,
      draftId,
    });
  } catch (e: unknown) {
    const msg = e instanceof MetaError || e instanceof Error ? e.message : "Post failed.";
    await recordPost({
      draftId: input.draftId,
      platform: "facebook",
      caption: input.caption,
      imageUrl: input.imageUrl ?? null,
      pillarId,
      outcome: { ok: false, error: msg },
    });
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
