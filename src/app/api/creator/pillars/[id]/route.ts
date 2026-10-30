import { NextResponse } from "next/server";
import { creatorDbGuard, errorResponse, readJson } from "@/lib/creator/guard";
import { PillarError, cleanPillarInput, deletePillar, updatePillar } from "@/lib/creator/pillar-store";

/*
  /api/creator/pillars/[id]
    PATCH  { name?, message?, angles?, hashtags?, target?, sortOrder?, active? } → { pillar }
    DELETE → { ok }   (rows pointing at it are cleared, not deleted)
*/

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };

export async function PATCH(req: Request, { params }: Ctx) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const body = await readJson<Record<string, unknown>>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const { id } = await params;
  try {
    const input = cleanPillarInput(body);
    delete input.id;
    const pillar = await updatePillar(id, input);
    if (!pillar) return NextResponse.json({ error: "Pillar not found." }, { status: 404 });
    return NextResponse.json({ pillar });
  } catch (err) {
    if (err instanceof PillarError) return NextResponse.json({ error: err.message }, { status: err.status });
    return errorResponse(err, "Database error");
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const { id } = await params;
  try {
    const ok = await deletePillar(id);
    if (!ok) return NextResponse.json({ error: "Pillar not found." }, { status: 404 });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err, "Database error");
  }
}
