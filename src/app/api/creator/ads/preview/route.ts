import { NextResponse } from "next/server";
import { creatorGuard } from "@/lib/creator/guard";
import { PREVIEW_FORMATS, getPreview, isAdsConfigured } from "@/lib/meta/ads";

/*
  GET /api/creator/ads/preview?creativeId=…&format=… → { src }
  Meta's own rendered preview (iframe src) for a creative. Read-only.
*/

export const runtime = "nodejs";

export async function GET(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  if (!isAdsConfigured()) return NextResponse.json({ error: "META_ADS_TOKEN is not set." }, { status: 503 });
  const q = new URL(req.url).searchParams;
  const creativeId = (q.get("creativeId") ?? "").trim();
  if (!/^\d+$/.test(creativeId)) return NextResponse.json({ error: "Missing creativeId." }, { status: 400 });
  const fmt = q.get("format") ?? "MOBILE_FEED_STANDARD";
  const format = (PREVIEW_FORMATS as readonly string[]).includes(fmt) ? fmt : "MOBILE_FEED_STANDARD";
  try {
    const p = await getPreview(creativeId, format);
    return NextResponse.json({ src: p.src, format });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Preview failed." }, { status: 502 });
  }
}
