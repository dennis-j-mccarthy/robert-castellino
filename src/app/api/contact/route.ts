import { NextResponse } from "next/server";
import { z } from "zod";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const runtime = "nodejs";

const Body = z.object({
  firstName: z.string().trim().min(1).max(80),
  lastName: z.string().trim().min(1).max(80),
  email: z.string().trim().email().max(160),
  message: z.string().trim().min(1).max(5000),
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
      { error: "Invalid form data", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const { firstName, lastName, email, message } = parsed.data;

  // 1) Persist to DB if configured (so nothing is lost if email fails).
  if (isDatabaseConfigured()) {
    try {
      const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "";
      const ipHash = ip ? await hashIp(ip) : null;
      const userAgent = req.headers.get("user-agent") ?? null;
      await prisma.contactSubmission.create({
        data: {
          firstName,
          lastName,
          email,
          message,
          userAgent,
          ipHash,
        },
      });
    } catch (err) {
      // Don't fail the user request on DB issues — log and continue to
      // the email attempt.
      console.error("[contact] DB write failed:", err);
    }
  }

  // 2) Send email via Resend if configured.
  const resendKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL;
  const from = process.env.CONTACT_FROM_EMAIL;

  if (resendKey && to && from) {
    try {
      const { Resend } = await import("resend");
      const resend = new Resend(resendKey);
      const subject = `New note from ${firstName} ${lastName}`;
      await resend.emails.send({
        from,
        to,
        replyTo: email,
        subject,
        text:
          `From: ${firstName} ${lastName} <${email}>\n\n` +
          `${message}\n\n` +
          `---\nSent from the robertcastellino.com contact form.`,
      });
    } catch (err) {
      console.error("[contact] Resend send failed:", err);
      // If DB is configured, the message was at least captured there.
      // If neither DB nor email is configured, return an error so the
      // form can warn the user.
      if (!isDatabaseConfigured()) {
        return NextResponse.json(
          { error: "Unable to deliver message" },
          { status: 502 },
        );
      }
    }
  } else if (!isDatabaseConfigured()) {
    // Nothing is wired — fail loudly rather than silently swallow.
    return NextResponse.json(
      { error: "Contact form is not yet configured" },
      { status: 503 },
    );
  }

  return NextResponse.json({ ok: true });
}
