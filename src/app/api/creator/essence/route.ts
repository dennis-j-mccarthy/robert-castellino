import { NextResponse } from "next/server";
import { cleanEssenceInput, getBrandEssence, saveBrandEssence } from "@/lib/creator/essence-store";
import { creatorDbGuard, creatorGuard, errorResponse, readJson } from "@/lib/creator/guard";
import { loadAllPillars } from "@/lib/creator/pillar-store";
import { getTone } from "@/lib/creator/tone-store";
import { isDatabaseConfigured } from "@/lib/prisma";

/*
  /api/creator/essence — the BrandEssence singleton (/creator/essence).

    GET  → { essence, pillars, tone, db }
    PUT  { line?, purpose?, promise?, cta?, doList?, dontList?, voice?, messages?, audiences? }
         → { essence }   (503 when no DB)

  Gated by the admin session cookie. Without a database GET still answers
  with the seed defaults (db: false) so the page can show them read-only.
*/

export const runtime = "nodejs";

export async function GET() {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  const [essence, pillars, tone] = await Promise.all([getBrandEssence(), loadAllPillars(), getTone()]);
  return NextResponse.json({ essence, pillars, tone: tone.tone, db: isDatabaseConfigured() });
}

export async function PUT(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  try {
    const essence = await saveBrandEssence(cleanEssenceInput(body));
    return NextResponse.json({ essence, db: true });
  } catch (err) {
    return errorResponse(err, "Database error");
  }
}
