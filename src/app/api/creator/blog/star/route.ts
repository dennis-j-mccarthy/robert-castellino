import { NextResponse } from "next/server";
import { creatorDbGuard, errorResponse, readJson } from "@/lib/creator/guard";
import { adapters } from "@/studio.adapters";

// POST { id, starred } — mark a Musing for the next newsletter.
export const runtime = "nodejs";

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const b = await readJson<{ id?: string; starred?: boolean }>(req);
  if (!b?.id || typeof b.starred !== "boolean") return NextResponse.json({ error: "id and starred are required" }, { status: 400 });
  try {
    await adapters.content.setStarred(b.id, b.starred);
    const m = { id: b.id, starred: b.starred };
    return NextResponse.json(m);
  } catch (e) {
    return errorResponse(e, "Could not update the star.");
  }
}
