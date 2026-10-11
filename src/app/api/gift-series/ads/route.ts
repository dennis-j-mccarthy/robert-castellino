import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Ad state for the gift-series posts: which post runs in which ad set and
// whether it is built / running. Stored in the GiftDraft table under its own
// row so no schema change is needed: `edits` maps post number ("01".."99") to
// a JSON string of AdState.
const ID = "ads";

const AD_SETS = ["", "1", "2", "3", "4", "5", "6"] as const;
const STATUSES = ["marked", "built", "running", "stopped"] as const;

type AdState = {
  adSet: (typeof AD_SETS)[number];
  status: (typeof STATUSES)[number];
  adId: string;
  note: string;
  by: string;
  at: string;
};

function clean(raw: unknown): AdState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;
  const adSet = typeof r.adSet === "string" ? r.adSet : "";
  const status = typeof r.status === "string" ? r.status : "";
  const adId = typeof r.adId === "string" ? r.adId.trim() : "";
  const note = typeof r.note === "string" ? r.note.trim() : "";
  if (!(AD_SETS as readonly string[]).includes(adSet)) return null;
  if (!(STATUSES as readonly string[]).includes(status)) return null;
  if (!/^\d{0,24}$/.test(adId) || note.length > 300) return null;
  return {
    adSet: adSet as AdState["adSet"],
    status: status as AdState["status"],
    adId,
    note,
    by: typeof r.by === "string" ? r.by.slice(0, 80) : "",
    at: new Date().toISOString(),
  };
}

function parseRow(edits: unknown): Record<string, AdState> {
  const out: Record<string, AdState> = {};
  if (!edits || typeof edits !== "object") return out;
  for (const [k, v] of Object.entries(edits as Record<string, unknown>)) {
    if (!/^\d{2}$/.test(k) || typeof v !== "string") continue;
    try {
      out[k] = JSON.parse(v) as AdState;
    } catch {
      // skip a corrupt entry rather than failing the whole list
    }
  }
  return out;
}

export async function GET() {
  const session = await getSession();
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ads: {}, signedIn: !!session, savedAt: null });
  }
  try {
    const row = await prisma.giftDraft.findUnique({ where: { id: ID } });
    return NextResponse.json({
      ads: parseRow(row?.edits),
      signedIn: !!session,
      savedAt: row?.updatedAt ?? null,
    });
  } catch {
    return NextResponse.json({ ads: {}, signedIn: !!session, savedAt: null });
  }
}

/** Upsert or clear one post's ad state: { post: "07", state: {...} | null }. */
export async function PUT(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Sign in to save." }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "The database is not connected." }, { status: 503 });
  }

  let body: { post?: unknown; state?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const post = typeof body.post === "string" ? body.post : "";
  if (!/^\d{2}$/.test(post)) {
    return NextResponse.json({ error: "Unknown post." }, { status: 400 });
  }
  const state = body.state === null ? null : clean(body.state);
  if (body.state !== null && !state) {
    return NextResponse.json({ error: "That ad setting could not be saved." }, { status: 400 });
  }

  const row = await prisma.giftDraft.findUnique({ where: { id: ID } });
  const edits: Record<string, string> = {};
  for (const [k, v] of Object.entries((row?.edits as Record<string, unknown>) ?? {})) {
    if (typeof v === "string") edits[k] = v;
  }
  if (state) edits[post] = JSON.stringify(state);
  else delete edits[post];

  const saved = await prisma.giftDraft.upsert({
    where: { id: ID },
    create: { id: ID, edits, images: {} },
    update: { edits },
  });
  return NextResponse.json({ ok: true, ads: parseRow(saved.edits), savedAt: saved.updatedAt });
}
