import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { ADS_NOT_CONFIGURED, errorMessage, isAdsConfigured, listCampaigns } from "@/lib/meta/ads";

export const runtime = "nodejs";

// Campaigns in Bob's ad account (for the Destination step).
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isAdsConfigured() && !process.env.META_PAGE_TOKEN)
    return NextResponse.json({ error: ADS_NOT_CONFIGURED, items: [] }, { status: 409 });
  try {
    return NextResponse.json({ items: await listCampaigns() });
  } catch (e) {
    return NextResponse.json({ error: errorMessage(e), items: [] }, { status: 502 });
  }
}
