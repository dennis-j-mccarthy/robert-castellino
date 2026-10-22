import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import {
  accountAdInsights,
  adAccountId,
  draftStatusFor,
  getAds,
  isAdsConfigured,
  type AdInsights,
} from "@/lib/meta/ads";
import { DraftSchema, guard, parseError, serialize, toCreateData } from "@/lib/ads-drafts";

export const runtime = "nodejs";

// Drafts + live Meta status/insights for the ones that exist as ads.
export async function GET() {
  const blocked = await guard();
  if (blocked) return blocked;

  const configured = isAdsConfigured();
  const rows = await prisma.adDraft.findMany({ orderBy: { createdAt: "desc" }, take: 200 });

  let liveError: string | null = null;
  const liveIds = rows.map((r) => r.metaAdId).filter((x): x is string => !!x);
  let live: Awaited<ReturnType<typeof getAds>> = {};
  let stats: Record<string, AdInsights> = {};

  if (configured && liveIds.length) {
    try {
      [live, stats] = await Promise.all([getAds(liveIds), accountAdInsights()]);
    } catch (e) {
      liveError = e instanceof Error ? e.message : "Couldn't read live status from Meta.";
    }
  }

  // Mirror Meta's effective_status into the row so the pill is right even
  // when the next load can't reach Meta.
  const updates: Promise<unknown>[] = [];
  const items = rows.map((r) => {
    const ad = r.metaAdId ? live[r.metaAdId] : undefined;
    let status = r.status;
    if (ad) {
      const mapped = draftStatusFor(ad.effectiveStatus);
      if (mapped !== r.status && !(mapped === "submitted" && r.status === "failed")) {
        status = mapped;
        updates.push(
          prisma.adDraft.update({ where: { id: r.id }, data: { status, error: null } }),
        );
      }
    }
    return serialize(
      { ...r, status },
      {
        metaStatus: ad?.effectiveStatus ?? null,
        adsetName: ad?.adsetName ?? null,
        insights: r.metaAdId ? (stats[r.metaAdId] ?? null) : null,
      },
    );
  });
  await Promise.allSettled(updates);

  return NextResponse.json({
    items,
    configured,
    account: adAccountId(),
    liveError,
  });
}

// Create a draft (nothing is sent to Meta yet).
export async function POST(req: Request) {
  const blocked = await guard();
  if (blocked) return blocked;
  try {
    const input = DraftSchema.parse(await req.json());
    const row = await prisma.adDraft.create({ data: toCreateData(input) });
    return NextResponse.json({ item: serialize(row) }, { status: 201 });
  } catch (e) {
    return NextResponse.json({ error: parseError(e) }, { status: 400 });
  }
}
