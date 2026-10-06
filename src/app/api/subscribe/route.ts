import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().trim().email().max(160),
  source: z.string().trim().max(40).optional(),
});

async function hashIp(ip: string): Promise<string> {
  const data = new TextEncoder().encode(ip);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return Buffer.from(digest).toString("hex").slice(0, 24);
}

export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Please enter a valid email address." },
      { status: 400 },
    );
  }
  const email = parsed.data.email.toLowerCase();
  const source = parsed.data.source ?? "popup";

  // No DB in this environment (e.g. local dev) — accept gracefully so the
  // client still shows its confirmation state.
  if (!isDatabaseConfigured()) {
    return NextResponse.json({ ok: true, stored: false });
  }

  try {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
    const ipHash = ip ? await hashIp(ip) : null;
    const userAgent = req.headers.get("user-agent") ?? null;
    // Upsert so a repeat signup is idempotent and re-activates a lapsed one.
    await prisma.subscriber.upsert({
      where: { email },
      create: { email, source, ipHash, userAgent },
      update: { active: true },
    });
    return NextResponse.json({ ok: true, stored: true });
  } catch (err) {
    console.error("[subscribe] DB write failed:", err);
    return NextResponse.json(
      { error: "Something went wrong — please try again." },
      { status: 500 },
    );
  }
}
