import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";

export const runtime = "nodejs";

// Read the auto-generated social post drafts for review. Admin-only.
// Optionally filter by ?musingId=...
export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  if (!isDatabaseConfigured()) {
    return NextResponse.json({ items: [], dbMissing: true });
  }

  const musingId = new URL(req.url).searchParams.get("musingId") ?? undefined;
  try {
    const items = await prisma.socialDraft.findMany({
      where: musingId ? { musingId } : undefined,
      orderBy: [{ createdAt: "desc" }, { platform: "asc" }],
      take: 200,
    });
    return NextResponse.json({ items });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Database error";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
