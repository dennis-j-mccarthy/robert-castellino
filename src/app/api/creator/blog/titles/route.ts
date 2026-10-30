import { NextResponse } from "next/server";
import { AI_NOT_CONFIGURED, aiErrorMessage, generateJson, hasAnthropicKey } from "@/lib/creator/ai";
import { brandSystemPrompt, loadBrandContext } from "@/lib/creator/brand-context";
import { creatorGuard, readJson } from "@/lib/creator/guard";

/*
  POST /api/creator/blog/titles — step 2 of the blog generator.
  Body: { topic?, pillarId?, count? }  → { titles: string[], pillarId }

  Title ideas for new Musings in Bob's voice: the brand brief
  (src/lib/creator/brand-context.ts) plus the chosen pillar's message and
  angles. Titles only — the Musing itself is /api/creator/blog/write.
*/

export const runtime = "nodejs";
export const maxDuration = 120;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    titles: {
      type: "array",
      items: { type: "string" },
      description:
        "Titles for new Musings, in the register of his existing ones ('Why I Rise Early', 'The Fifty-Second Light', 'Red Mountain Pass, in February', 'On the Discipline of Foreground'). Short, specific, unhurried. No colons-as-hype, no numbers-as-listicles, no questions.",
    },
  },
  required: ["titles"],
};

export async function POST(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  if (!hasAnthropicKey()) return NextResponse.json({ error: AI_NOT_CONFIGURED }, { status: 503 });
  const body = await readJson<{ topic?: string; pillarId?: string; count?: number }>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const topic = String(body.topic ?? "").trim().slice(0, 600);
  const count = Math.min(12, Math.max(1, Math.round(Number(body.count) || 6)));
  const ctx = await loadBrandContext({ pillarId: typeof body.pillarId === "string" ? body.pillarId : null });

  try {
    const data = await generateJson<{ titles: unknown }>({
      system: brandSystemPrompt(ctx, {
        role: "You suggest titles for Robert Castellino's Musings — short first-person essays on light, land and fifty years of looking. Each title must be one he could actually write: a real place, hour, weather or practice, never a vague theme. No numbering, no quotes.",
        includePillars: true,
      }),
      user: `Give me exactly ${count} Musing titles${topic ? ` about: "${topic}"` : ""}${ctx.pillar ? ` for the "${ctx.pillar.name}" pillar` : ""}. Spread them across different angles. Return them in the titles array.`,
      schema: SCHEMA,
      maxTokens: 2000,
      effort: "low",
    });
    const titles = (Array.isArray(data.titles) ? data.titles : [])
      .map((t) => String(t).trim())
      .filter(Boolean)
      .slice(0, count);
    if (!titles.length) return NextResponse.json({ error: "No titles came back — try again." }, { status: 502 });
    return NextResponse.json({ titles, pillarId: ctx.pillar?.id ?? null });
  } catch (err) {
    console.error("[creator/blog/titles]", err);
    return NextResponse.json({ error: aiErrorMessage(err) }, { status: 502 });
  }
}
