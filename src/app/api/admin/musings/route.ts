import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { MUSINGS } from "@/data/musings";

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
    return NextResponse.json({ items: MUSINGS, dbMissing: true });
  }
  try {
    const rows = await prisma.musing.findMany({
      orderBy: [{ order: "asc" }, { id: "asc" }],
    });
    return NextResponse.json({ items: rows });
  } catch {
    return NextResponse.json({ items: MUSINGS, dbMissing: true });
  }
}

const CAT = ["reflections", "light", "land", "locations", "wilderness"] as const;

const CreateSchema = z.object({
  cat: z.enum(CAT),
  title: z.string().min(1),
  date: z.string().min(1),
  loc: z.string().nullable().optional(),
  img: z.string().nullable().optional(),
  size: z.enum(["sm", "md", "lg"]).nullable().optional(),
  excerpt: z.string().min(1),
  body: z.array(z.string()).min(1),
  published: z.boolean().default(true),
  order: z.number().int().default(0),
});

async function generateIdAndNum(): Promise<{ id: string; num: string }> {
  const musings = await prisma.musing.findMany({ select: { id: true, num: true } });
  const maxId = musings
    .map(m => parseInt(m.id.replace(/\D/g, ""), 10))
    .filter(n => !isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  const maxNum = musings
    .map(m => parseInt(m.num.replace(/\D/g, ""), 10))
    .filter(n => !isNaN(n))
    .reduce((a, b) => Math.max(a, b), 0);
  return {
    id: `m${String(maxId + 1).padStart(2, "0")}`,
    num: `M.${String(maxNum + 1).padStart(3, "0")}`,
  };
}

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
    const { id, num } = await generateIdAndNum();
    const musing = await prisma.musing.create({ data: { id, num, ...parsed.data } });
    return NextResponse.json(musing, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
