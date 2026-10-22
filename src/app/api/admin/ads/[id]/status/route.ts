import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { ADS_NOT_CONFIGURED, errorMessage, isAdsConfigured, setStatus } from "@/lib/meta/ads";
import { guard, parseError, serialize } from "@/lib/ads-drafts";

export const runtime = "nodejs";

const Body = z.object({
  status: z.enum(["ACTIVE", "PAUSED"]),
  // Activating starts spend from the campaign budget — require an explicit ack.
  confirm: z.boolean().optional(),
});

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
  if (body.status === "ACTIVE" && body.confirm !== true)
    return NextResponse.json(
      { error: "Activating starts spending. Send confirm: true to proceed." },
      { status: 428 },
    );

  const draft = await prisma.adDraft.findUnique({ where: { id } });
  if (!draft) return NextResponse.json({ error: "Not found." }, { status: 404 });
  if (!draft.metaAdId)
    return NextResponse.json({ error: "Send this ad to Meta first." }, { status: 409 });

  try {
    await setStatus(draft.metaAdId, body.status);
    const row = await prisma.adDraft.update({
      where: { id },
      data: { status: body.status === "ACTIVE" ? "active" : "paused", error: null },
    });
    return NextResponse.json({ item: serialize(row) });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e) }, { status: 502 });
  }
}
