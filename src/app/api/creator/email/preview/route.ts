import { NextResponse } from "next/server";
import { creatorDbGuard, readJson } from "@/lib/creator/guard";
import { fallbackNewsletterCopy, renderNewsletter, stripTags, type NewsletterMusing } from "@/lib/creator/newsletter";
import { adapters } from "@/studio.adapters";
import { studio } from "@/studio.config";
import { getBrandEssence } from "@/lib/creator/essence-store";
import { readCtas } from "@/lib/creator/newsletter-ctas";

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
  const body = await readJson<{ musingIds?: unknown; intro?: string; ctas?: unknown; cta?: unknown }>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  const ids = (Array.isArray(body.musingIds) ? body.musingIds : []).map((v) => String(v).trim()).filter(Boolean).slice(0, 6);
  if (!ids.length) return NextResponse.json({ error: "No pieces." }, { status: 400 });
  const all = await adapters.content.list();
  const musings: NewsletterMusing[] = ids.map((id) => all.find((m) => m.id === id)).filter((m): m is NonNullable<typeof m> => !!m).map((m) => ({ id: m.id, title: m.title, excerpt: m.excerpt, img: m.img, loc: m.loc, url: adapters.content.url(m.id) }));
  if (!musings.length) return NextResponse.json({ error: "No pieces." }, { status: 400 });
  const { perMusing, whole } = readCtas(body.ctas, body.cta);
  let copy = fallbackNewsletterCopy(musings);
  copy = { ...copy, blurbs: copy.blurbs.map((b) => ({ ...b, cta: perMusing[b.musingId] ?? null })), cta: whole };
  const intro = typeof body.intro === "string" ? body.intro.trim().slice(0, 1500) : "";
  copy = { ...copy, intro }; // blank intro → the placeholder paragraph, so the preamble slot is always visible
  const essence = await getBrandEssence().catch(() => null);
  // The real subject lines are written on save; until then a neutral masthead so the lead title does not print twice.
  const month = new Date().toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "America/Denver" });
  const { html } = renderNewsletter(musings, copy, {
    subject: `Notes from the studio · ${month}`,
    preheader: stripTags(musings[0].excerpt).slice(0, 110),
    tagline: essence?.line ?? null,
    introPlaceholder: `${studio.site.owner} opens the issue here: a few lines on what these posts have in common. Write it on the left, or leave it and the studio writes it when you save.`,
  });
  return NextResponse.json({ html });
}
