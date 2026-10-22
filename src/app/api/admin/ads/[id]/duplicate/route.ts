import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ADS_NOT_CONFIGURED, isAdsConfigured, listAdSets } from "@/lib/meta/ads";
import { guard, parseError, serialize, submitDraft } from "@/lib/ads-drafts";

export const runtime = "nodejs";

const Body = z.object({ adsetIds: z.array(z.string().trim().min(1)).min(1, "Pick at least one ad set.") });

// Same creative → several ad sets (audiences). Each becomes its own draft
// row + PAUSED ad, reusing the uploaded image and creative.
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await guard();
  if (blocked) return blocked;
  if (!isAdsConfigured()) return NextResponse.json({ error: ADS_NOT_CONFIGURED }, { status: 409 });

  const { id } = await params;
  let body: z.infer<typeof Body>;
  try {
    body = Body.parse(await req.json());
  } catch (e) {
    return NextResponse.json({ error: parseError(e) }, { status: 400 });
  }

  const src = await prisma.adDraft.findUnique({ where: { id } });
  if (!src) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!src.creativeId)
    return NextResponse.json({ error: "Send the original to Meta first." }, { status: 409 });

  // Ad set names, for readable ad names. Best-effort.
  const names: Record<string, string> = {};
  if (src.campaignId) {
    try {
      for (const s of await listAdSets(src.campaignId)) names[s.id] = s.name;
    } catch {
      /* fall back to ids */
    }
  }

  const baseName = src.name.replace(/\s·\s[^·]+$/, "");
  const created: ReturnType<typeof serialize>[] = [];
  const errors: Array<{ adsetId: string; error: string }> = [];

  for (const adsetId of body.adsetIds) {
    if (adsetId === src.adsetId) continue;
    const row = await prisma.adDraft.create({
      data: {
        name: `${baseName} · ${names[adsetId] ?? adsetId}`,
        imageUrl: src.imageUrl,
        imageHash: src.imageHash,
        message: src.message,
        headline: src.headline,
        description: src.description,
        link: src.link,
        ctaType: src.ctaType,
        campaignId: src.campaignId,
        adsetId,
        creativeId: src.creativeId,
        previewUrl: src.previewUrl,
        status: "draft",
      },
    });
    try {
      created.push(serialize(await submitDraft(row.id, adsetId)));
    } catch (e) {
      errors.push({ adsetId, error: e instanceof Error ? e.message : "Failed." });
    }
  }

  return NextResponse.json({ items: created, errors }, { status: errors.length && !created.length ? 502 : 200 });
}
