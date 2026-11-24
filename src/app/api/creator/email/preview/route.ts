import { NextResponse } from "next/server";
import { creatorDbGuard, readJson } from "@/lib/creator/guard";
import { fallbackNewsletterCopy, renderNewsletter, stripTags, type NewsletterMusing } from "@/lib/creator/newsletter";
import { prisma } from "@/lib/prisma";

/*
  POST /api/creator/email/preview — the live picture in the Blog's
  "Make newsletter" popup. Body: { musingIds: string[1..6], intro? }
  Returns: { html } rendered with the deterministic copy (no model call),
  so it answers in milliseconds on every drag and keystroke. Save as HTML
  (generate) then writes the real copy into the same layout.
*/

export const runtime = "nodejs";

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const body = await readJson<{ musingIds?: unknown; intro?: string }>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const ids = (Array.isArray(body.musingIds) ? body.musingIds : []).map((v) => String(v).trim()).filter(Boolean).slice(0, 6);
  if (!ids.length) return NextResponse.json({ error: "No pieces." }, { status: 400 });
  const rows = await prisma.musing.findMany({ where: { id: { in: ids } } });
  const musings: NewsletterMusing[] = ids.map((id) => rows.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m).map((m) => ({ id: m.id, title: m.title, excerpt: m.excerpt, img: m.img, loc: m.loc }));
  if (!musings.length) return NextResponse.json({ error: "No pieces." }, { status: 400 });
  let copy = fallbackNewsletterCopy(musings);
  const intro = typeof body.intro === "string" ? body.intro.trim().slice(0, 1500) : "";
  if (intro) copy = { ...copy, intro };
  // The real subject lines are written on save; until then a neutral masthead so the lead title does not print twice.
  const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "America/Denver" });
  const { html } = renderNewsletter(musings, copy, { subject: `Notes from the studio · ${month}`, preheader: stripTags(musings[0].excerpt).slice(0, 110) });
  return NextResponse.json({ html });
}
