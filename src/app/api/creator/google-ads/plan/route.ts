import { NextResponse } from "next/server";
import { cleanPlan, loadAdsPlan, saveAdsPlan } from "@/lib/creator/ads-plan";
import { creatorDbGuard, creatorGuard, errorResponse, readJson } from "@/lib/creator/guard";

/* GET → the saved Google Ads plan. PUT { plan } → save the owner's edits. */
export const runtime = "nodejs";

export async function GET() {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  return NextResponse.json({ plan: await loadAdsPlan() });
}

export async function PUT(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const b = await readJson<{ plan?: unknown }>(req);
  if (!b?.plan) return NextResponse.json({ error: "plan is required" }, { status: 400 });
  try {
    return NextResponse.json({ plan: await saveAdsPlan(cleanPlan(b.plan)) });
  } catch (e) {
    return errorResponse(e, "Could not save the plan.");
  }
}
