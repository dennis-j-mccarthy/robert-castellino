import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { runWeeklyPlan } from "@/lib/creator/plan";

/*
  The Monday-noon run. Two doors:
    GET  with `Authorization: Bearer <CRON_SECRET>` — Vercel Cron (vercel.json)
    POST with the admin session, body { force?, weekOffset? } — the "Build it now" button
  Builds the week's PlanItems, saves the WeeklyPlan row, emails the summary.
*/
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const secret = process.env.CRON_SECRET;
  const auth = req.headers.get("authorization");
  if (!secret || auth !== `Bearer ${secret}`) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "No database" }, { status: 503 });
  // Cron fires Monday 19:00 UTC (noon MST / 1 pm MDT): build THIS week, which began a few hours earlier.
  return NextResponse.json(await runWeeklyPlan({ weekOffset: 0 }));
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "No database" }, { status: 503 });
  let body: { force?: boolean; weekOffset?: 0 | 1 } = {};
  try { body = await req.json(); } catch {}
  return NextResponse.json(await runWeeklyPlan({ force: !!body.force, weekOffset: body.weekOffset === 1 ? 1 : 0 }));
}
