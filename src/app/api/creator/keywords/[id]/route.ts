import { NextResponse } from "next/server";
import { creatorDbGuard, errorResponse, readJson } from "@/lib/creator/guard";
import { KEYWORD_KINDS, type KeywordKind } from "@/lib/creator/keywords";
import { prisma } from "@/lib/prisma";

/*
  /api/creator/keywords/[id]
    PATCH  { status?, kind?, priority?, note? } → { keyword }
    DELETE → { ok }
*/

export const runtime = "nodejs";

type Ctx = { params: Promise<{ id: string }> };
const STATUSES = ["idea", "target", "dropped"];

export async function PATCH(req: Request, { params }: Ctx) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const b = await readJson<{ status?: unknown; kind?: unknown; priority?: unknown; note?: unknown }>(req);
  if (!b) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const { id } = await params;
  const data: { status?: string; kind?: string; priority?: number; note?: string | null } = {};
  if (typeof b.status === "string" && STATUSES.includes(b.status)) data.status = b.status;
  if (KEYWORD_KINDS.includes(b.kind as KeywordKind)) data.kind = b.kind as KeywordKind;
  if (b.priority !== undefined) data.priority = Math.max(0, Math.min(100, Math.round(Number(b.priority)) || 0));
  if (b.note !== undefined) data.note = b.note ? String(b.note).slice(0, 200) : null;
  try {
    const keyword = await prisma.keyword.update({ where: { id }, data });
    return NextResponse.json({ keyword });
  } catch (err) {
    return errorResponse(err, "Keyword not found.", 404);
  }
}

export async function DELETE(_req: Request, { params }: Ctx) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const { id } = await params;
  try {
    await prisma.keyword.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err) {
    return errorResponse(err, "Keyword not found.", 404);
  }
}
