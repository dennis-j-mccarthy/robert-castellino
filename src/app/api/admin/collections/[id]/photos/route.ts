import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";

async function guard() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDatabaseConfigured()) return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  return null;
}

const CreateSchema = z.object({
  img: z.string().min(1),
  title: z.string().min(1),
  loc: z.string().min(1),
  blurb: z.string().min(1),
  order: z.number().int().default(0),
});

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await guard();
  if (blocked) return blocked;

  const { id: collectionId } = await params;

  let json: unknown;
  try { json = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = CreateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  try {
    const photo = await prisma.photo.create({
      data: { ...parsed.data, collectionId },
    });
    return NextResponse.json(photo, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
