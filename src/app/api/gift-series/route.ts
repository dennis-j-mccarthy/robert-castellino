import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const ID = "current";
const EMPTY = { edits: {} as Record<string, string>, images: {} as Record<string, string> };

function cleanRecord(
  value: unknown,
  keyOk: (key: string) => boolean,
  valueOk: (value: string) => boolean,
): Record<string, string> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const out: Record<string, string> = {};
  for (const [key, raw] of Object.entries(value)) {
    if (!keyOk(key) || typeof raw !== "string" || raw.length > 8000 || !valueOk(raw)) {
      return null;
    }
    out[key] = raw;
  }
  if (Object.keys(out).length > 800) return null;
  return out;
}

export async function GET() {
  const session = await getSession();
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ...EMPTY, signedIn: !!session, savedAt: null });
  }
  try {
    const row = await prisma.giftDraft.findUnique({ where: { id: ID } });
    return NextResponse.json({
      edits: (row?.edits as Record<string, string>) ?? {},
      images: (row?.images as Record<string, string>) ?? {},
      signedIn: !!session,
      savedAt: row?.updatedAt ?? null,
    });
  } catch {
    return NextResponse.json({ ...EMPTY, signedIn: !!session, savedAt: null });
  }
}

export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to save." }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "The database is not connected." }, { status: 503 });
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const edits = cleanRecord(
    (body as { edits?: unknown })?.edits,
    (key) => /^\d{2}:\d+$/.test(key),
    (value) => !/<\s*script|javascript:|onerror\s*=|onload\s*=/i.test(value),
  );
  const images = cleanRecord(
    (body as { images?: unknown })?.images,
    (key) => /^rc-gift-img-\d{2}-\d+$/.test(key),
    (value) => /^\/(gift-series|assets)\/[a-zA-Z0-9_./-]+$/.test(value) && !value.includes(".."),
  );
  if (!edits || !images) {
    return NextResponse.json({ error: "Those edits could not be saved." }, { status: 400 });
  }

  const row = await prisma.giftDraft.upsert({
    where: { id: ID },
    create: { id: ID, edits, images },
    update: { edits, images },
  });
  return NextResponse.json({ ok: true, savedAt: row.updatedAt });
}
