import { NextResponse } from "next/server";
import { aiErrorMessage, generateJson, hasAnthropicKey } from "@/lib/creator/ai";
import { brandSystemPrompt, loadBrandContext } from "@/lib/creator/brand-context";
import { createEmailDraft } from "@/lib/creator/email-store";
import { creatorDbGuard, errorResponse, readJson } from "@/lib/creator/guard";
import { fallbackNewsletterCopy, renderNewsletter, stripTags, type NewsletterCopy, type NewsletterMusing } from "@/lib/creator/newsletter";
import { findPillar } from "@/lib/creator/pillar-store";
import { prisma } from "@/lib/prisma";

/*
  POST /api/creator/email/generate — the newsletter maker (/creator/email).
  Body: { musingIds: string[1..3], pillarId?, topic? }
  Returns: { draft, subjects: string[3], preheader, copy, generated }

  Pulls the chosen PUBLISHED Musings, asks the model for the COPY only
  (three subject lines, a preheader, an intro, a blurb per Musing, an outro)
  in Bob's voice, renders HTML + text deterministically
  (src/lib/creator/newsletter.ts) and saves an EmailDraft. Without
  ANTHROPIC_API_KEY the deterministic copy is used.
*/

export const runtime = "nodejs";
export const maxDuration = 120;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    subjects: { type: "array", items: { type: "string" }, description: "Exactly three distinct subject lines, each under 60 characters, no emoji, no clickbait, in his register ('The light before the light')." },
    preheader: { type: "string", description: "One sentence (under 110 characters) that extends the first subject line in the inbox preview." },
    intro: { type: "string", description: "A 1–3 sentence opening paragraph from Bob, first person, framing this month's notes. No pitch." },
    blurbs: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          musingId: { type: "string" },
          heading: { type: "string", description: "The Musing's title, or a sharper rewording of it." },
          blurb: { type: "string", description: "2–4 sentences on what the reader will find in the Musing. Stay inside what it says. No URL — the link is added by the template." },
        },
        required: ["musingId", "heading", "blurb"],
      },
    },
    outro: { type: "string", description: "A one- or two-sentence sign-off. It may mention, quietly, that signed copies of the book and limited prints are on the site — the buttons carry the links." },
  },
  required: ["subjects", "preheader", "intro", "blurbs", "outro"],
};

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const body = await readJson<{ musingIds?: unknown; pillarId?: string; topic?: string }>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const ids = (Array.isArray(body.musingIds) ? body.musingIds : []).map((v) => String(v).trim()).filter(Boolean).slice(0, 3);
  if (!ids.length) return NextResponse.json({ error: "Pick 1–3 published Musings." }, { status: 400 });
  const pillar = typeof body.pillarId === "string" ? await findPillar(body.pillarId) : null;
  const topic = String(body.topic ?? "").trim().slice(0, 300);

  const musings: (NewsletterMusing & { body: string })[] = [];
  for (const id of ids) {
    const m = await prisma.musing.findUnique({ where: { id } }).catch(() => null);
    if (!m || !m.published) return NextResponse.json({ error: `Musing ${id} isn't published (or doesn't exist).` }, { status: 400 });
    musings.push({ id: m.id, title: m.title, excerpt: m.excerpt, img: m.img, loc: m.loc, body: m.body.map(stripTags).join("\n\n") });
  }

  let copy: NewsletterCopy = fallbackNewsletterCopy(musings, topic || undefined);
  let subjects: string[] = [musings[0].title];
  let preheader = stripTags(musings[0].excerpt).slice(0, 110);
  let generated = false;

  if (hasAnthropicKey()) {
    try {
      const ctx = await loadBrandContext({ pillarId: pillar?.id });
      const data = await generateJson<Partial<NewsletterCopy & { subjects: unknown; preheader: unknown }>>({
        system: brandSystemPrompt(ctx, {
          role: "You write Bob's email to the people who asked to hear from the studio. It rounds up one to three recent Musings. Short, warm, specific; a note from the photographer, not a marketing blast.",
          includePillars: true,
          extra: "FORMAT: return the copy only — layout, images, buttons and links are added by the template. Use the exact musingId values given for the blurbs, one blurb per Musing, in the order given.",
        }),
        user: `Write the newsletter copy for these Musings.${topic ? `\n\nTHEME FOR THIS ISSUE: ${topic}` : ""}\n\n${musings
          .map((m, i) => `MUSING ${i + 1} — musingId: ${m.id}\nTITLE: ${m.title}${m.loc ? `\nPLACE: ${m.loc}` : ""}\nEXCERPT: ${stripTags(m.excerpt)}\nBODY:\n${m.body.slice(0, 3500)}`)
          .join("\n\n---\n\n")}`,
        schema: SCHEMA,
        maxTokens: 4000,
        effort: "low",
      });
      const subs = (Array.isArray(data.subjects) ? data.subjects : []).map((s) => String(s).trim()).filter(Boolean).slice(0, 3);
      if (subs.length) subjects = subs;
      if (typeof data.preheader === "string" && data.preheader.trim()) preheader = data.preheader.trim().slice(0, 160);
      const blurbs = (Array.isArray(data.blurbs) ? data.blurbs : [])
        .map((b) => ({ musingId: String(b?.musingId ?? ""), heading: String(b?.heading ?? "").trim(), blurb: String(b?.blurb ?? "").trim() }))
        .filter((b) => musings.some((m) => m.id === b.musingId));
      copy = {
        intro: String(data.intro ?? copy.intro).trim(),
        blurbs: blurbs.length ? blurbs : copy.blurbs,
        outro: String(data.outro ?? copy.outro).trim(),
      };
      generated = true;
    } catch (err) {
      console.error("[creator/email/generate] model failed, using fallback copy:", aiErrorMessage(err));
    }
  }

  const subject = subjects[0];
  const rendered = renderNewsletter(musings, copy, { subject, preheader });
  try {
    const draft = await createEmailDraft({
      name: subject,
      subject,
      preheader,
      html: rendered.html,
      text: rendered.text,
      pillarId: pillar?.id ?? null,
      musingIds: musings.map((m) => m.id),
    });
    return NextResponse.json({ draft, subjects, preheader, copy, generated });
  } catch (err) {
    return errorResponse(err, "Database error");
  }
}
