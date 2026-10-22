import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { PREVIEW_FORMATS, errorMessage, getPreview } from "@/lib/meta/ads";
import { guard } from "@/lib/ads-drafts";

export const runtime = "nodejs";

// Meta's own rendered preview for a submitted draft's creative.
// GET /api/admin/ads/[id]/preview?format=MOBILE_FEED_STANDARD
export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await guard();
  if (blocked) return blocked;
  const { id } = await params;
  const raw = new URL(req.url).searchParams.get("format") || "MOBILE_FEED_STANDARD";
  const format = (PREVIEW_FORMATS as readonly string[]).includes(raw) ? raw : "MOBILE_FEED_STANDARD";

  const draft = await prisma.adDraft.findUnique({ where: { id } });
  if (!draft) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!draft.creativeId)
    return NextResponse.json({ error: "No creative yet — send to Meta first." }, { status: 409 });

  try {
    const p = await getPreview(draft.creativeId, format);
    if (format === "MOBILE_FEED_STANDARD" && p.src && p.src !== draft.previewUrl) {
      await prisma.adDraft.update({ where: { id }, data: { previewUrl: p.src } });
    }
    return NextResponse.json({ format, src: p.src, html: p.html, formats: PREVIEW_FORMATS });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 502 });
  }
}
