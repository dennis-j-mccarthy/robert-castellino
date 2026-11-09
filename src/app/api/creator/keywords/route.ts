import { NextResponse } from "next/server";
import { creatorDbGuard, creatorGuard, errorResponse, readJson } from "@/lib/creator/guard";
import { KEYWORD_KINDS, keywordId, type KeywordKind } from "@/lib/creator/keywords";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

/*
  /api/creator/keywords

    GET  → { keywords, db }
    POST { phrase, kind, priority?, source?, note? } → { keyword }   (409 when the phrase exists)
*/

export const runtime = "nodejs";

export async function GET() {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  if (!isDatabaseConfigured()) return NextResponse.json({ keywords: [], db: false });
  const keywords = await prisma.keyword.findMany({ orderBy: [{ priority: "desc" }, { phrase: "asc" }] });
  return NextResponse.json({ keywords, db: true });
}

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const b = await readJson<{ phrase?: unknown; kind?: unknown; priority?: unknown; source?: unknown; note?: unknown }>(req);
  if (!b) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const phrase = String(b.phrase ?? "").trim().replace(/\s+/g, " ").slice(0, 120);
  if (phrase.length < 3) return NextResponse.json({ error: "Type a keyword or phrase." }, { status: 400 });
  const kind = KEYWORD_KINDS.includes(b.kind as KeywordKind) ? (b.kind as KeywordKind) : "gift";
  const priority = Math.max(0, Math.min(100, Math.round(Number(b.priority)) || 50));
  const source = b.source === "claude" ? "claude" : "manual";
  const id = keywordId(phrase);
  if (!id) return NextResponse.json({ error: "Type a keyword or phrase." }, { status: 400 });
  try {
    const exists = await prisma.keyword.findFirst({ where: { OR: [{ id }, { phrase: { equals: phrase, mode: "insensitive" } }] } });
    if (exists) return NextResponse.json({ error: "That phrase is already on the list." }, { status: 409 });
    const keyword = await prisma.keyword.create({
      data: { id, phrase, kind, priority, source, note: b.note ? String(b.note).slice(0, 200) : null },
    });
    return NextResponse.json({ keyword });
  } catch (err) {
    return errorResponse(err, "Database error");
  }
}
