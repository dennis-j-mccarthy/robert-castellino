import { NextResponse } from "next/server";
import { z } from "zod";
import {
  isAuthConfigured,
  mintToken,
  setSessionCookie,
  verifyCredentials,
} from "@/lib/auth";

export const runtime = "nodejs";

const Body = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

export async function POST(req: Request) {
  if (!isAuthConfigured()) {
    return NextResponse.json(
      { error: "Admin is not configured on this deployment." },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }
  const { email, password } = parsed.data;

  const ok = await verifyCredentials(email, password);
  if (!ok) {
    // Constant-ish response time helps obscure whether the email matched.
    await new Promise((r) => setTimeout(r, 250));
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const token = await mintToken(email);
  await setSessionCookie(token);
  return NextResponse.json({ ok: true });
}
