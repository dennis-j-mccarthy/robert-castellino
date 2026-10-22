import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { DraftSchema, guard, parseError, serialize, toCreateData } from "@/lib/ads-drafts";

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

// Edit a draft. Once a creative exists on Meta the copy is frozen there
// (Meta creatives are immutable), so edits reset creativeId/imageHash
// ONLY while the row has no live ad. Live ads: name/campaign/adset only.
export async function PATCH(req: Request, { params }: Ctx) {
  const blocked = await guard();
  if (blocked) return blocked;
  const { id } = await params;
  try {
    const existing = await prisma.adDraft.findUnique({ where: { id } });
    if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });

    const input = DraftSchema.partial().parse(await req.json());
    const merged = DraftSchema.parse({
      name: existing.name,
      imageUrl: existing.imageUrl,
      message: existing.message,
      headline: existing.headline,
      description: existing.description ?? "",
      link: existing.link,
      ctaType: existing.ctaType,
      campaignId: existing.campaignId ?? "",
      adsetId: existing.adsetId ?? "",
      ...input,
    });
    const data = toCreateData(merged);

    if (existing.metaAdId) {
      // Live: only non-creative fields may change.
      const row = await prisma.adDraft.update({
        where: { id },
        data: { name: data.name, campaignId: data.campaignId, adsetId: data.adsetId },
      });
      return NextResponse.json({ item: serialize(row), note: "Live ad — only name/destination updated." });
    }

    const creativeChanged =
      data.imageUrl !== existing.imageUrl ||
      data.message !== existing.message ||
      data.headline !== existing.headline ||
      data.description !== existing.description ||
      data.link !== existing.link ||
      data.ctaType !== existing.ctaType;

    const row = await prisma.adDraft.update({
      where: { id },
      data: {
        ...data,
        ...(data.imageUrl !== existing.imageUrl ? { imageHash: null } : {}),
        ...(creativeChanged ? { creativeId: null, previewUrl: null } : {}),
        ...(existing.status === "failed" ? { status: "draft", error: null } : {}),
      },
    });
    return NextResponse.json({ item: serialize(row) });
  } catch (e) {
    return NextResponse.json({ error: parseError(e) }, { status: 400 });
  }
}

// Delete a draft that never became an ad. Live ads are managed in Meta.
export async function DELETE(_req: Request, { params }: Ctx) {
  const blocked = await guard();
  if (blocked) return blocked;
  const { id } = await params;
  const existing = await prisma.adDraft.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (existing.metaAdId)
    return NextResponse.json(
      { error: "This ad exists on Meta — pause or delete it in Ads Manager." },
      { status: 409 },
    );
  await prisma.adDraft.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
