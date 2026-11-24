import { NextResponse } from "next/server";
import { AI_NOT_CONFIGURED, aiErrorMessage, generateJson, hasAnthropicKey } from "@/lib/creator/ai";
import { brandSystemPrompt, loadBrandContext } from "@/lib/creator/brand-context";
import { creatorGuard, readJson } from "@/lib/creator/guard";

/*
  POST /api/creator/essence/suggest { kind, ...fields } — the AI assist on
  the Essence page. Nothing is saved here; the client shows the options and
  Bob clicks the one he wants.

  kind:
    "line" | "purpose" | "promise" | "cta"  { current, note? } → { options: string[] }   (3)
    "dos" | "donts"                         { have: string[] }  → { options: string[] }   (5)
    "voice-sample"                          { voice }           → { options: string[] }   (1 sentence)
    "messages"                              { pillarId }        → { messages: [{ text, headlines[2], captions[2] }] } (3)
    "tone"                                  {}                  → { tone: { voice, audience, style, dos, donts } }
*/
export const runtime = "nodejs";

type Body = { kind: string; current?: string; note?: string; have?: string[]; pillarId?: string; voice?: { playful: number; formal: number; bold: number } };

const FIELD_GUIDE: Record<string, string> = {
  line: "THE LINE: one sentence a stranger could repeat. Not a slogan, not a claim; the truest short thing about this work. Under 10 words each.",
  purpose: "PURPOSE: why the work exists, one or two sentences, in his voice. Not a mission statement.",
  promise: "PROMISE: what every buyer can count on, one or two sentences, concrete (real place, signed by hand).",
  cta: "CALL TO ACTION: one quiet sentence to use when a piece needs one. No urgency words.",
};

export async function POST(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  if (!hasAnthropicKey()) return NextResponse.json({ error: AI_NOT_CONFIGURED }, { status: 503 });
  const b = await readJson<Body>(req);
  if (!b?.kind) return NextResponse.json({ error: "kind is required" }, { status: 400 });
  try {
    const ctx = await loadBrandContext({ pillarId: b.pillarId ?? null });
    const role = "You help Robert Castellino sharpen the brand essence his studio writes from.";
    const strList = { type: "object", additionalProperties: false, required: ["options"], properties: { options: { type: "array", items: { type: "string" } } } };

    if (b.kind in FIELD_GUIDE) {
      const out = await generateJson<{ options: string[] }>({
        system: brandSystemPrompt(ctx, { role, includePillars: true, extra: FIELD_GUIDE[b.kind] }),
        user: `Current ${b.kind}: "${b.current ?? ""}".${b.note ? ` Bob's note: "${b.note}".` : ""}\nGive 3 alternatives. Keep what is true in the current one; vary rhythm and emphasis, not facts. Return JSON { options: [3 strings] }.`,
        schema: strList, maxTokens: 800,
      });
      return NextResponse.json({ options: out.options.slice(0, 3) });
    }
    if (b.kind === "dos" || b.kind === "donts") {
      const out = await generateJson<{ options: string[] }>({
        system: brandSystemPrompt(ctx, { role, includePillars: true }),
        user: `Here is his ${b.kind === "dos" ? "ALWAYS say" : "NEVER say"} list: ${JSON.stringify(b.have ?? [])}. Suggest 5 more short phrases (2–6 words) that belong on it and are not already there, in the same register. Return JSON { options: [5 strings] }.`,
        schema: strList, maxTokens: 600,
      });
      return NextResponse.json({ options: out.options.slice(0, 5) });
    }
    if (b.kind === "voice-sample") {
      const v = b.voice ?? ctx.voice;
      const out = await generateJson<{ options: string[] }>({
        system: brandSystemPrompt({ ...ctx, voice: v }, { role, extra: "Write exactly one sentence of 18–30 words that sounds like him at these dial settings, about a real Colorado place at a real hour. No hype." }),
        user: `Dials: playful ${v.playful}/100, formal ${v.formal}/100, bold ${v.bold}/100. Return JSON { options: [one sentence] }.`,
        schema: strList, maxTokens: 300,
      });
      return NextResponse.json({ options: out.options.slice(0, 1) });
    }
    if (b.kind === "messages") {
      if (!ctx.pillar) return NextResponse.json({ error: "pillarId is required" }, { status: 400 });
      const have = ctx.messages.filter((m) => m.pillar === ctx.pillar!.id).map((m) => m.text);
      const out = await generateJson<{ messages: { text: string; headlines: string[]; captions: string[] }[] }>({
        system: brandSystemPrompt(ctx, { role, extra: "A core message is one sentence the studio can land again and again under this pillar: a belief, not a feature. Headlines are 3–7 words; captions are one or two sentences that end with a real place." }),
        user: `Pillar: ${ctx.pillar.name} — ${ctx.pillar.message}. Existing core messages under it: ${JSON.stringify(have)}. Suggest 3 NEW core messages that do not repeat these, each with 2 headlines and 2 sample captions in his voice. Return JSON { messages: [{ text, headlines: [2], captions: [2] }] }.`,
        schema: { type: "object", additionalProperties: false, required: ["messages"], properties: { messages: { type: "array", items: { type: "object", additionalProperties: false, required: ["text", "headlines", "captions"], properties: { text: { type: "string" }, headlines: { type: "array", items: { type: "string" } }, captions: { type: "array", items: { type: "string" } } } } } } },
        maxTokens: 1600,
      });
      return NextResponse.json({ messages: out.messages.slice(0, 3) });
    }
    if (b.kind === "tone") {
      const out = await generateJson<{ tone: { voice: string; audience: string; style: string; dos: string; donts: string } }>({
        system: brandSystemPrompt(ctx, { role, includePillars: true, extra: "Write the TONE BRIEF the blog, captions and newsletter will follow, derived ONLY from the essence, dials and lists above. Plain sentences, no bullet characters." }),
        user: `Return JSON { tone: { voice (2 sentences), audience (1–2 sentences), style (length, paragraphs, how it ends), dos (one line, semicolon-separated), donts (one line, semicolon-separated) } }.`,
        schema: { type: "object", additionalProperties: false, required: ["tone"], properties: { tone: { type: "object", additionalProperties: false, required: ["voice", "audience", "style", "dos", "donts"], properties: { voice: { type: "string" }, audience: { type: "string" }, style: { type: "string" }, dos: { type: "string" }, donts: { type: "string" } } } } },
        maxTokens: 900,
      });
      return NextResponse.json({ tone: out.tone });
    }
    return NextResponse.json({ error: `Unknown kind "${b.kind}"` }, { status: 400 });
  } catch (e) {
    return NextResponse.json({ error: aiErrorMessage(e) }, { status: 502 });
  }
}
