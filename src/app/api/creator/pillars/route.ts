import { NextResponse } from "next/server";
import { creatorDbGuard, creatorGuard, errorResponse, readJson } from "@/lib/creator/guard";
import { PillarError, cleanPillarInput, createPillar, loadAllPillars } from "@/lib/creator/pillar-store";
import { isDatabaseConfigured } from "@/lib/prisma";

/*
  /api/creator/pillars

    GET  [?all=1] → { pillars, db }   active pillars in order; all=1 includes inactive
    POST { id?, name, message, angles[], hashtags[], target? } → { pillar }
*/

export const runtime = "nodejs";

export async function GET(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  const all = new URL(req.url).searchParams.get("all") === "1";
  const pillars = await loadAllPillars();
  return NextResponse.json({ pillars: all ? pillars : pillars.filter((p) => p.active), db: isDatabaseConfigured() });
}

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  try {
    const pillar = await createPillar(cleanPillarInput(body));
    return NextResponse.json({ pillar });
  } catch (err) {
    if (err instanceof PillarError) return NextResponse.json({ error: err.message }, { status: err.status });
    return errorResponse(err, "Database error");
  }
}
