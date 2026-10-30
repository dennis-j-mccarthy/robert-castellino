import { NextResponse } from "next/server";
import { z } from "zod";
import { creatorGuard } from "@/lib/creator/guard";
import { BOOK_CAMPAIGN_ID, getInMarket, invalidateInMarket } from "@/lib/creator/in-market";
import { ADS_NOT_CONFIGURED, errorMessage, isAdsConfigured, setStatus } from "@/lib/meta/ads";

/*
  POST /api/creator/ads/status — switch an ad, an ad set (audience) or the
  book campaign on or off. Turning anything ON can start spend, so it needs
  confirm: true from a human click. Only entities inside the book campaign
  are accepted; nothing else in the ad account can be touched from here.
*/

export const runtime = "nodejs";

const Body = z.object({
  kind: z.enum(["ad", "adset", "campaign"]),
  id: z.string().trim().min(1),
  status: z.enum(["ACTIVE", "PAUSED"]),
  confirm: z.boolean().optional(),
});

export async function POST(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  if (!isAdsConfigured()) return NextResponse.json({ error: ADS_NOT_CONFIGURED }, { status: 409 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Bad request." }, { status: 400 });
  }
  if (body.status === "ACTIVE" && body.confirm !== true)
    return NextResponse.json({ error: "Turning this on can start spending. Confirm first." }, { status: 428 });

  // Scope check: the id must belong to the book campaign.
  const market = await getInMarket();
  const ok =
    (body.kind === "campaign" && body.id === BOOK_CAMPAIGN_ID) ||
    (body.kind === "adset" && market.adsets.some((s) => s.id === body.id)) ||
    (body.kind === "ad" && market.ads.some((a) => a.id === body.id));
  if (!ok) return NextResponse.json({ error: "That isn't part of the book campaign." }, { status: 403 });

  try {
    await setStatus(body.id, body.status);
    invalidateInMarket();
    return NextResponse.json(await getInMarket({ refresh: true }));
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 502 });
  }
}
