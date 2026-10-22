import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ADS_NOT_CONFIGURED, errorMessage, isAdsConfigured, listAdSets } from "@/lib/meta/ads";

export const runtime = "nodejs";

// Ad sets for a campaign: GET /api/admin/ads/adsets?campaignId=…
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const campaignId = new URL(req.url).searchParams.get("campaignId")?.trim();
  if (!campaignId) return NextResponse.json({ error: "campaignId is required." }, { status: 400 });
  if (!isAdsConfigured() && !process.env.META_PAGE_TOKEN)
    return NextResponse.json({ error: ADS_NOT_CONFIGURED, items: [] }, { status: 409 });
  try {
    return NextResponse.json({ items: await listAdSets(campaignId) });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e), items: [] }, { status: 502 });
  }
}
