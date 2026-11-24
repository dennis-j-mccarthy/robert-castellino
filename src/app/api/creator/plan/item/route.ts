import { NextResponse } from "next/server";
import { creatorDbGuard, readJson } from "@/lib/creator/guard";
import { setItemState, weekStart, type PlanItemState } from "@/lib/creator/plan";

// POST { id, state, week?: "this" | "next" } → { items }  (approve / skip a slot on the home screen)
export const runtime = "nodejs";
const STATES: PlanItemState[] = ["suggested", "drafted", "approved", "scheduled", "done", "skipped"];

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const body = await readJson<{ id?: string; state?: PlanItemState; week?: "this" | "next" }>(req);
  if (!body?.id || !body.state || !STATES.includes(body.state)) return NextResponse.json({ error: "id and a valid state are required" }, { status: 400 });
  const items = await setItemState(weekStart(new Date(), body.week === "next"), body.id, body.state);
  return NextResponse.json({ items });
}
