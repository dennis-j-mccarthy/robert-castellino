import { NextResponse } from "next/server";
import { creatorGuard } from "@/lib/creator/guard";
import { getInMarket } from "@/lib/creator/in-market";

/*
  GET /api/creator/ads/in-market [?refresh=1] — the live ads in Bob's book
  campaign, read-only, cached server-side for 5 minutes. There is no write
  path here; status changes happen only in the existing Ads maker.
*/

export const runtime = "nodejs";

export async function GET(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  const refresh = new URL(req.url).searchParams.get("refresh") === "1";
  return NextResponse.json(await getInMarket({ refresh }));
}
