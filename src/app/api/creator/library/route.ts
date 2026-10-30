import { NextResponse } from "next/server";
import { creatorDbGuard, creatorGuard, errorResponse, readJson } from "@/lib/creator/guard";
import { loadLibrary, saveLibraryTag } from "@/lib/creator/library";
import { resolvePillarId } from "@/lib/creator/pillar-store";

/*
  /api/creator/library — the library VIEW over ad-images.json + Photo rows,
  enriched by LibraryTag.

    GET → { items, collections, counts }
    PATCH { src, pillarId?, messageId?, title?, blurb?, loc? } → { ok }
          (enrichment only — no bytes move; uploads stay in /admin/collections)
*/

export const runtime = "nodejs";

export async function GET() {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  try {
    return NextResponse.json(await loadLibrary());
  } catch (err) {
    return errorResponse(err, "Couldn't load the library.");
  }
}

export async function PATCH(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const body = await readJson<{ src?: string; pillarId?: string | null; messageId?: string | null; title?: string | null; blurb?: string | null; loc?: string | null }>(req);
  if (!body || !body.src || typeof body.src !== "string") return NextResponse.json({ error: "Missing src." }, { status: 400 });
  try {
    await saveLibraryTag({
      src: body.src,
      pillarId: body.pillarId === undefined ? undefined : await resolvePillarId(body.pillarId),
      messageId: body.messageId === undefined ? undefined : String(body.messageId ?? "").slice(0, 20) || null,
      title: body.title,
      blurb: body.blurb,
      loc: body.loc,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err, "Database error");
  }
}
