import { NextResponse } from "next/server";
import { listEmailDrafts } from "@/lib/creator/email-store";
import { creatorGuard, errorResponse } from "@/lib/creator/guard";
import { isDatabaseConfigured } from "@/lib/prisma";

/*
  GET /api/creator/email → { items, db }  — newsletter drafts, newest first.
  New drafts come from POST /api/creator/email/generate.
*/

export const runtime = "nodejs";

export async function GET() {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  if (!isDatabaseConfigured()) return NextResponse.json({ items: [], db: false });
  try {
    return NextResponse.json({ items: await listEmailDrafts(), db: true });
  } catch (err) {
    return errorResponse(err, "Database error");
  }
}
