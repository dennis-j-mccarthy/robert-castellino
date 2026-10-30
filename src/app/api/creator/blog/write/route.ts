import { NextResponse } from "next/server";
import { AI_NOT_CONFIGURED, aiErrorMessage, generateJson, hasAnthropicKey } from "@/lib/creator/ai";
import { brandSystemPrompt, loadBrandContext } from "@/lib/creator/brand-context";
import { creatorGuard, readJson } from "@/lib/creator/guard";

/*
  POST /api/creator/blog/write — step 3 of the blog generator.
  Body: { title, pillarId?, notes?, loc? }
  Returns: { draft: { title, excerpt, body: string[], loc, cat, pillarId } }

  Writes a full Musing in Bob's voice from the brand brief. NOTHING is
  saved here — the client reviews it and then POSTs to the existing
  /api/admin/musings (published: false for a draft, true to publish), so
  Musings keep one write path and the publish hooks (revalidate, IndexNow,
  social drafts) keep firing exactly as today.
*/

export const runtime = "nodejs";
export const maxDuration = 120;

const CATS = ["reflections", "light", "land", "locations", "wilderness"] as const;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    excerpt: {
      type: "string",
      description: "One or two sentences (under 200 characters) for the listing card — a line from the piece or a distillation of it, in his voice. No clickbait.",
    },
    paragraphs: {
      type: "array",
      items: { type: "string" },
      description: "The Musing as 3–5 plain-prose paragraphs, 150–400 words total. No headings, no bullet points, no markdown, no title. Inline <em>…</em> is allowed for a single emphasised phrase.",
    },
    loc: {
      type: "string",
      description: "The place the piece is grounded in, short ('Maroon Lake', 'Red Mountain Pass', 'Boulder studio'), or an empty string.",
    },
    cat: {
      type: "string",
      enum: [...CATS],
      description: "The Musings category this belongs to: reflections (practice, craft, years), light, land (geology, terrain), locations (a named place), wilderness (solitude, animals, conservation).",
    },
  },
  required: ["excerpt", "paragraphs", "loc", "cat"],
};

export async function POST(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  if (!hasAnthropicKey()) return NextResponse.json({ error: AI_NOT_CONFIGURED }, { status: 503 });
  const body = await readJson<{ title?: string; pillarId?: string; notes?: string; loc?: string }>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const title = String(body.title ?? "").trim().slice(0, 200);
  if (!title) return NextResponse.json({ error: "Pick a title to write from." }, { status: 400 });
  const notes = String(body.notes ?? "").trim().slice(0, 3000);
  const loc = String(body.loc ?? "").trim().slice(0, 120);
  const ctx = await loadBrandContext({ pillarId: typeof body.pillarId === "string" ? body.pillarId : null });

  try {
    const data = await generateJson<{ excerpt?: unknown; paragraphs?: unknown; loc?: unknown; cat?: unknown }>({
      system: brandSystemPrompt(ctx, {
        role: "You write Robert Castellino's Musings: short first-person essays for his site, in the register of 'Why I Rise Early' and 'The Fifty-Second Light'. Make ONE observation and land it. Plain prose, unhurried, specific to a real place and hour. Never pitch the book or prints inside a Musing; it ends on the observation.",
        includePillars: true,
      }),
      user: `Write the full Musing for this title (use it as-is; do not change it):\n\n"${title}"${loc ? `\n\nPLACE: ${loc}` : ""}${notes ? `\n\nBOB'S ROUGH NOTES (use what's here; invent nothing beyond it):\n${notes}` : ""}\n\nReturn the excerpt, the paragraphs, the place and the category.`,
      schema: SCHEMA,
      maxTokens: 6000,
      effort: "medium",
    });

    const paragraphs = (Array.isArray(data.paragraphs) ? data.paragraphs : [])
      .map((p) => String(p).trim())
      .filter(Boolean);
    if (!paragraphs.length) return NextResponse.json({ error: "No Musing came back — try again." }, { status: 502 });
    const cat = (CATS as readonly string[]).includes(String(data.cat)) ? String(data.cat) : "reflections";
    return NextResponse.json({
      draft: {
        title,
        excerpt: String(data.excerpt ?? "").trim().slice(0, 300),
        body: paragraphs,
        loc: String(data.loc ?? loc).trim().slice(0, 120),
        cat,
        pillarId: ctx.pillar?.id ?? null,
      },
    });
  } catch (err) {
    console.error("[creator/blog/write]", err);
    return NextResponse.json({ error: aiErrorMessage(err) }, { status: 502 });
  }
}
