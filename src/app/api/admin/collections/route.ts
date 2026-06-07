import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { COLLECTIONS } from "@/data/collections";

export const runtime = "nodejs";

async function guard() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

export async function GET() {
  const blocked = await guard();
  if (blocked) return blocked;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ items: COLLECTIONS.map(c => ({ ...c, id: c.slug, published: true, order: 0 })), dbMissing: true });
  }
  try {
    const rows = await prisma.collection.findMany({
      orderBy: { order: "asc" },
      include: { photos: { orderBy: { order: "asc" } } },
    });
    return NextResponse.json({ items: rows });
  } catch {
    return NextResponse.json({
      items: COLLECTIONS.map(c => ({ ...c, id: c.slug, published: true, order: 0 })),
      dbMissing: true,
    });
  }
}

const CreateSchema = z.object({
  slug: z.string().min(1).regex(/^[a-z0-9-]+$/, "Slug must be lowercase letters, numbers, and hyphens"),
  label: z.string().min(1),
  intro: z.string().min(1),
  order: z.number().int().default(0),
  published: z.boolean().default(true),
});

export async function POST(req: Request) {
  const blocked = await guard();
  if (blocked) return blocked;

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ error: "Database not configured. Provision Postgres on Vercel first." }, { status: 503 });
  }

  let json: unknown;
  try { json = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  try {
    const collection = await prisma.collection.create({ data: parsed.data, include: { photos: true } });
    return NextResponse.json(collection, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    if (msg.includes("Unique constraint")) {
      return NextResponse.json({ error: `Slug "${parsed.data.slug}" is already taken.` }, { status: 409 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
