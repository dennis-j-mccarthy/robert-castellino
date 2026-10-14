import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { toPlan, parseRow } from "@/lib/gift-plan";

export const runtime = "nodejs";

// Plan state for the gift-series posts (organic post and/or paid ad, schedule
// date, and a reminder for Bob to cross-post to his personal FB/IG). Stored in
// the GiftDraft table under its own row (id="ads"); `edits` maps a 2-digit post
// key to a JSON string of PlanState — no schema change. The response key stays
// `ads` for backward compatibility with older open tabs. Migration + validation
// live in src/lib/gift-plan.ts (toPlan), used on both read and write.
const ID = "ads";

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

/** Upsert or clear one post's plan: { post: "07", state: {...} | null }. */
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

  // state null (or an empty plan) clears the row; otherwise store the plan.
  const plan = body.state === null ? null : toPlan(body.state);

  const row = await prisma.giftDraft.findUnique({ where: { id: ID } });
  const edits: Record<string, string> = {};
  for (const [k, v] of Object.entries((row?.edits as Record<string, unknown>) ?? {})) {
    if (typeof v === "string") edits[k] = v;
  }
  if (plan) edits[post] = JSON.stringify(plan);
  else delete edits[post];

  const saved = await prisma.giftDraft.upsert({
    where: { id: ID },
    create: { id: ID, edits, images: {} },
    update: { edits },
  });
  return NextResponse.json({ ok: true, ads: parseRow(saved.edits), savedAt: saved.updatedAt });
}
