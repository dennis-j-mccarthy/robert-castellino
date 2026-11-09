import { NextResponse } from "next/server";
import { AI_NOT_CONFIGURED, aiErrorMessage, generateJson, hasAnthropicKey } from "@/lib/creator/ai";
import { brandSystemPrompt, loadBrandContext } from "@/lib/creator/brand-context";
import { creatorDbGuard, readJson } from "@/lib/creator/guard";
import { KEYWORD_KINDS, type KeywordKind } from "@/lib/creator/keywords";
import { BOOK } from "@/lib/creator/pillars";
import { prisma } from "@/lib/prisma";

/*
  POST { focus? } → { suggestions: [{ phrase, kind, priority, why }] }
  New phrases people type when looking for the book, a Colorado gift or
  Bob's photography, weighted toward gift searches. Not saved; the page adds
  the ones Bob picks. Priority is Claude's judgement (0–100), never a volume.
*/

export const runtime = "nodejs";
export const maxDuration = 60;

const SCHEMA = {
  type: "object",
  properties: {
    suggestions: {
      type: "array",
      items: {
        type: "object",
        properties: {
          phrase: { type: "string" },
          kind: { type: "string", enum: KEYWORD_KINDS },
          priority: { type: "integer" },
          why: { type: "string" },
        },
        required: ["phrase", "kind", "priority", "why"],
        additionalProperties: false,
      },
    },
  },
  required: ["suggestions"],
  additionalProperties: false,
};

type Suggestion = { phrase: string; kind: KeywordKind; priority: number; why: string };

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  if (!hasAnthropicKey()) return NextResponse.json({ error: AI_NOT_CONFIGURED }, { status: 503 });
  const b = (await readJson<{ focus?: unknown }>(req)) ?? {};
  const existing = (await prisma.keyword.findMany({ select: { phrase: true } })).map((k) => k.phrase);
  const ctx = await loadBrandContext();
  const user = [
    `Suggest 20 search phrases people type into Google when they are looking for something Robert Castellino makes: his signed coffee table book "${BOOK.title}" (${BOOK.facts}), a gift for someone who loves Colorado or the mountains, or Colorado landscape photography.`,
    "Mostly GIFT phrases (someone about to buy and not yet decided), then book phrases, a few photography phrases and a few questions. Include holiday-gift wording.",
    "Plain words people actually type. No brand names other than his own. Nothing about therapy, craniosacral work or Fluid Pathways.",
    b.focus ? `Focus on: ${String(b.focus).slice(0, 200)}` : "",
    existing.length ? `Skip these, already listed: ${existing.join("; ")}` : "",
    "priority is 0 to 100: how likely the searcher is to buy the book soon. why is one short sentence.",
  ].filter(Boolean).join("\n");
  try {
    const out = await generateJson<{ suggestions: Suggestion[] }>({
      system: brandSystemPrompt(ctx, { role: "You research search keywords for a photographer's website." }),
      user,
      schema: SCHEMA,
      effort: "low",
    });
    const lower = new Set(existing.map((p) => p.toLowerCase()));
    const suggestions = (out.suggestions ?? [])
      .filter((s) => s.phrase && !lower.has(s.phrase.toLowerCase()))
      .map((s) => ({
        phrase: String(s.phrase).slice(0, 120),
        kind: KEYWORD_KINDS.includes(s.kind) ? s.kind : "gift",
        priority: Math.max(0, Math.min(100, Math.round(Number(s.priority)) || 50)),
        why: String(s.why ?? "").slice(0, 200),
      }));
    return NextResponse.json({ suggestions });
  } catch (e) {
    return NextResponse.json({ error: aiErrorMessage(e, "Couldn't get suggestions. Try again.") }, { status: 502 });
  }
}
