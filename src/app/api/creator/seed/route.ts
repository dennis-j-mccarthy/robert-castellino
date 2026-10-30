import { NextResponse } from "next/server";
import { creatorDbGuard, errorResponse, readJson } from "@/lib/creator/guard";
import { seedCreator } from "@/lib/creator/seed";

/*
  POST /api/creator/seed { force?: boolean } → { counts }
  Runs the idempotent Creator-page seed (src/lib/creator/seed.ts) against the
  live database — the same thing scripts/seed-creator.ts does from a shell.
  `force` overwrites essence / pillars / tone / tags with the seed values.
*/

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const body = (await readJson<{ force?: boolean }>(req)) ?? {};
  try {
    const counts = await seedCreator({ force: !!body.force });
    return NextResponse.json({ ok: true, counts });
  } catch (err) {
    return errorResponse(err, "Seed failed");
  }
}
