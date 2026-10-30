import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";

/*
  Shared guards for /api/creator/*. The Creator page is gated by the SAME
  admin session cookie as /admin (src/lib/auth.ts) — no passcode.
*/

export const DB_MISSING_MESSAGE = "Database not configured. Provision Postgres on Vercel first.";

/** 401 when there is no admin session; null when the caller may proceed. */
export async function creatorGuard(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  return null;
}

/** 401 / 503 guard for routes that must write to the database. */
export async function creatorDbGuard(): Promise<NextResponse | null> {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  if (!isDatabaseConfigured()) return NextResponse.json({ error: DB_MISSING_MESSAGE, db: false }, { status: 503 });
  return null;
}

/** Parse a JSON body, tolerating an empty one. */
export async function readJson<T extends object>(req: Request): Promise<T | null> {
  try {
    const text = await req.text();
    if (!text.trim()) return {} as T;
    return JSON.parse(text) as T;
  } catch {
    return null;
  }
}

export function errorResponse(err: unknown, fallback = "Request failed.", status = 500) {
  const msg = err instanceof Error && err.message ? err.message : fallback;
  return NextResponse.json({ error: msg }, { status });
}
