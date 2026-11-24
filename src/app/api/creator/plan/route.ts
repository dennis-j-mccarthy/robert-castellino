import { NextResponse } from "next/server";
import { creatorDbGuard, creatorGuard, errorResponse, readJson } from "@/lib/creator/guard";
import { getPlanSettings, getWeeklyPlan, savePlanSettings, weekStart } from "@/lib/creator/plan";

// GET  /api/creator/plan        → { settings, thisWeek, nextWeek }
// PUT  /api/creator/plan { settings } → { settings }
export const runtime = "nodejs";

export async function GET() {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  const [settings, thisWeek, nextWeek] = await Promise.all([getPlanSettings(), getWeeklyPlan(weekStart()), getWeeklyPlan(weekStart(new Date(), true))]);
  return NextResponse.json({ settings, thisWeek, nextWeek });
}

export async function PUT(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const body = await readJson<{ settings?: unknown }>(req);
  if (!body) return NextResponse.json({ error: "Bad JSON" }, { status: 400 });
  try {
    const settings = await savePlanSettings(body.settings ?? body);
    return NextResponse.json({ settings });
  } catch (e) {
    return errorResponse(e, "Could not save the plan.");
  }
}
