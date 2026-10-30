import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { creatorGuard } from "@/lib/creator/guard";
import { getInMarket, invalidateInMarket } from "@/lib/creator/in-market";
import { ADS_NOT_CONFIGURED, deleteEntity, errorMessage, isAdsConfigured } from "@/lib/meta/ads";

/*
  POST /api/creator/ads/remove — pull an ad out of Meta (delete it there).
  Only ads inside the book campaign are accepted. Deleted ads stop appearing
  in the campaign; the concept card goes back to "Not in Meta" and can be
  put in again. Nothing here can start spend.
*/

export const runtime = "nodejs";

const Body = z.object({ id: z.string().trim().min(1) });

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
  const market = await getInMarket();
  if (!market.ads.some((a) => a.id === body.id))
    return NextResponse.json({ error: "That ad isn't part of the book campaign." }, { status: 403 });

  try {
    await deleteEntity(body.id);
    // Forget the Ads-maker draft row so the old tool doesn't show a ghost.
    await prisma.adDraft.deleteMany({ where: { metaAdId: body.id } }).catch(() => undefined);
    invalidateInMarket();
    return NextResponse.json(await getInMarket({ refresh: true }));
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 502 });
  }
}
