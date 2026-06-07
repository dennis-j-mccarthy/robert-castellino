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

const UpdateSchema = z.object({
  img: z.string().min(1).optional(),
  title: z.string().min(1).optional(),
  loc: z.string().min(1).optional(),
  blurb: z.string().min(1).optional(),
  order: z.number().int().optional(),
});

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await guard();
  if (blocked) return blocked;

  const { id } = await params;

  let json: unknown;
  try { json = await req.json(); } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = UpdateSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Invalid data" }, { status: 400 });
  }

  try {
    const photo = await prisma.photo.update({ where: { id }, data: parsed.data });
    return NextResponse.json(photo);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    if (msg.includes("Record to update not found")) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const blocked = await guard();
  if (blocked) return blocked;

  const { id } = await params;

  try {
    await prisma.photo.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    if (msg.includes("Record to delete does not exist")) {
      return NextResponse.json({ error: "Photo not found." }, { status: 404 });
    }
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
