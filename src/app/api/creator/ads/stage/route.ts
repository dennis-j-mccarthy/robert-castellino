import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { creatorGuard } from "@/lib/creator/guard";
import { getInMarket, invalidateInMarket } from "@/lib/creator/in-market";
import { loadLibrary } from "@/lib/creator/library";
import { DraftSchema, submitDraft, toCreateData } from "@/lib/ads-drafts";
import { ADS_NOT_CONFIGURED, errorMessage, isAdsConfigured } from "@/lib/meta/ads";

/*
  POST /api/creator/ads/stage — turn a concept into a real ad in the book
  campaign, created PAUSED. The image must be a plate that is in the book
  (never a mockup); the ad set must belong to the campaign. Nothing spends
  until someone turns the ad, its audience and the campaign on.
*/

export const runtime = "nodejs";

const Body = z.object({
  name: z.string().trim().min(1).max(200),
  headline: z.string().trim().min(1).max(255),
  message: z.string().trim().min(1).max(2000),
  description: z.string().trim().max(255).optional().or(z.literal("")),
  imageUrl: z.string().trim().min(1),
  adsetId: z.string().trim().min(1),
});

export async function POST(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  if (!isAdsConfigured()) return NextResponse.json({ error: ADS_NOT_CONFIGURED }, { status: 409 });

  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch {
    return NextResponse.json({ error: "Fill in the headline, text, plate and audience." }, { status: 400 });
  }

  const [lib, market] = await Promise.all([loadLibrary(), getInMarket()]);
  const plate = lib.items.find((i) => i.src === body.imageUrl);
  if (!plate || !plate.inBook || plate.mockup)
    return NextResponse.json({ error: "Book ads only use plates that are in the book." }, { status: 400 });
  if (!market.adsets.some((s) => s.id === body.adsetId))
    return NextResponse.json({ error: "Pick an audience from the book campaign." }, { status: 400 });

  try {
    const input = DraftSchema.parse({
      name: body.name,
      imageUrl: body.imageUrl,
      message: body.message,
      headline: body.headline,
      description: body.description || "",
      campaignId: market.campaign?.id || "",
      adsetId: body.adsetId,
    });
    const row = await prisma.adDraft.create({ data: toCreateData(input) });
    await submitDraft(row.id, body.adsetId); // creates creative + ad, status PAUSED
    invalidateInMarket();
    return NextResponse.json(await getInMarket({ refresh: true }), { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 502 });
  }
}
