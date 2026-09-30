import { NextResponse } from "next/server";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ID = "current";

// Shared punch-list state for the Castellino/Fluid Pathways tracker.
// One row holds the whole state map { itemId: {status, own, notes, link, ...} }.
// GET is public (both Dennis and Bob read); PUT is open so either party can
// save without an admin login — the page is unlisted (noindex). Payload is
// size- and shape-bounded to keep it safe.

export async function GET() {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ data: {}, savedAt: null });
  }
  try {
    const row = await prisma.punchList.findUnique({ where: { id: ID } });
    return NextResponse.json({
      data: (row?.data as Record<string, unknown>) ?? {},
      savedAt: row?.updatedAt ?? null,
    });
  } catch {
    return NextResponse.json({ data: {}, savedAt: null });
  }
}

export async function PUT(req: Request) {
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "The database is not connected." }, { status: 503 });
  }
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const data = (body as { data?: unknown })?.data;
  if (!data || typeof data !== "object" || Array.isArray(data)) {
    return NextResponse.json({ error: "Bad data" }, { status: 400 });
  }
  const keys = Object.keys(data as Record<string, unknown>);
  if (keys.length > 3000) {
    return NextResponse.json({ error: "Too many items" }, { status: 400 });
  }
  const serialized = JSON.stringify(data);
  if (serialized.length > 700000) {
    return NextResponse.json({ error: "Payload too large" }, { status: 413 });
  }
  try {
    const row = await prisma.punchList.upsert({
      where: { id: ID },
      create: { id: ID, data: data as object },
      update: { data: data as object },
    });
    return NextResponse.json({ ok: true, savedAt: row.updatedAt });
  } catch {
    return NextResponse.json({ error: "Save failed" }, { status: 500 });
  }
}
