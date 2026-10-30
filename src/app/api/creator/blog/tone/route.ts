import { NextResponse } from "next/server";
import { creatorDbGuard, creatorGuard, errorResponse, readJson } from "@/lib/creator/guard";
import { getTone, saveTone } from "@/lib/creator/tone-store";

/*
  /api/creator/blog/tone — the tone brief (BlogSettings singleton).
    GET → { tone, fromDb }
    PUT { tone } → { tone }
*/

export const runtime = "nodejs";

export async function GET() {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  return NextResponse.json(await getTone());
}

export async function PUT(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const body = await readJson<{ tone?: unknown }>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  try {
    const tone = await saveTone(body.tone ?? body);
    return NextResponse.json({ tone, fromDb: true });
  } catch (err) {
    return errorResponse(err, "Database error");
  }
}
