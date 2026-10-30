import { NextResponse } from "next/server";
import { creatorDbGuard, creatorGuard, errorResponse, readJson } from "@/lib/creator/guard";
import { cancelScheduled, listQueue } from "@/lib/creator/social-queue";
import { getConnection, isConnected } from "@/lib/meta/store";

/*
  /api/creator/social/queue — what's scheduled and what went out.
    GET  → { items }
    POST { action: "cancel", id } → deletes the scheduled Graph object with the
         Page token and returns the row to draft. Only "scheduled" rows can be
         cancelled — a published post is never deleted from here.
*/

export const runtime = "nodejs";

export async function GET() {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  try {
    return NextResponse.json({ items: await listQueue() });
  } catch (err) {
    return errorResponse(err, "Database error");
  }
}

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const body = await readJson<{ action?: string; id?: string }>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  if (body.action !== "cancel") return NextResponse.json({ error: `Unknown action: ${body.action ?? ""}` }, { status: 400 });
  const id = String(body.id ?? "").trim();
  if (!id) return NextResponse.json({ error: "Missing id." }, { status: 400 });
  const conn = await getConnection();
  if (!isConnected(conn)) return NextResponse.json({ error: "Facebook isn't connected — can't cancel on Meta without a Page token." }, { status: 409 });
  try {
    const r = await cancelScheduled(id, conn.pageToken!);
    if (!r.ok) return NextResponse.json({ error: r.error }, { status: r.status });
    return NextResponse.json({ ok: true, item: r.item });
  } catch (err) {
    return errorResponse(err, "Cancel failed");
  }
}
