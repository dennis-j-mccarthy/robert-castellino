import { NextResponse } from "next/server";
import { z } from "zod";
import { ADS_NOT_CONFIGURED, isAdsConfigured } from "@/lib/meta/ads";
import { guard, serialize, submitDraft } from "@/lib/ads-drafts";

export const runtime = "nodejs";

const Body = z.object({ adsetId: z.string().trim().min(1).optional() }).default({});

// Send to Meta (paused): image → creative → ad. Resumable after a failure.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await guard();
  if (blocked) return blocked;
  if (!isAdsConfigured()) return NextResponse.json({ error: ADS_NOT_CONFIGURED }, { status: 409 });

  const { id } = await params;
  let body: z.infer<typeof Body> = {};
  try {
    body = Body.parse(await req.json().catch(() => ({})));
  } catch {
    /* optional body */
  }
  try {
    const row = await submitDraft(id, body.adsetId);
    return NextResponse.json({ item: serialize(row) });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Submit failed.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
