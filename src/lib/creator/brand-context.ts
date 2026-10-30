import { tonePrompt, type BlogTone } from "@/lib/creator/blog-tone";
import { getBrandEssence } from "@/lib/creator/essence-store";
import {
  BOOK,
  SITE,
  pillarIn,
  pillarPrompt,
  type BrandEssenceRecord,
  type CoreMessage,
  type Pillar,
  type VoiceSliders,
} from "@/lib/creator/pillars";
import { loadPillars } from "@/lib/creator/pillar-store";
import { getTone } from "@/lib/creator/tone-store";

/*
  ONE brand context for every generator (titles, the musing writer, captions,
  the newsletter). SERVER ONLY.

    const ctx = await loadBrandContext({ pillarId });
    system: brandSystemPrompt(ctx, { role: "…", extra: "…" })

  Reads the BrandEssence singleton (essence + voice dials + core messages),
  the Pillar rows and the BlogSettings tone; falls back to the seed defaults
  when there is no database.
*/

export interface BrandContext {
  essence: BrandEssenceRecord;
  voice: VoiceSliders;
  tone: BlogTone;
  /** The chosen pillar, or null (unknown ids resolve to null, never throw). */
  pillar: Pillar | null;
  /** Every active pillar, in display order. */
  pillars: Pillar[];
  messages: CoreMessage[];
  /** The chosen core message, when one was named. */
  message: CoreMessage | null;
}

export async function loadBrandContext(
  opts: { pillarId?: string | null; messageId?: string | null } = {},
): Promise<BrandContext> {
  const [essence, pillars, { tone }] = await Promise.all([getBrandEssence(), loadPillars(), getTone()]);
  const message = opts.messageId ? (essence.messages.find((m) => m.id === opts.messageId) ?? null) : null;
  const pillarId = opts.pillarId ?? message?.pillar ?? null;
  return {
    essence,
    voice: essence.voice,
    tone,
    pillar: pillarIn(pillars, pillarId),
    pillars,
    messages: essence.messages,
    message,
  };
}

function lean(v: number, low: string, high: string): string {
  const d = v - 50;
  if (Math.abs(d) < 8) return `balanced between ${low} and ${high}`;
  const strength = Math.abs(d) >= 35 ? "strongly" : Math.abs(d) >= 18 ? "clearly" : "slightly";
  return `${strength} ${d > 0 ? high : low} (${v}/100)`;
}

/** The three dials as prose the model can act on. */
export function voicePrompt(v: VoiceSliders): string {
  return [
    `- Playful ↔ Serious: ${lean(v.playful, "serious", "playful")}`,
    `- Formal ↔ Casual: ${lean(v.formal, "casual", "formal")}`,
    `- Bold ↔ Gentle: ${lean(v.bold, "gentle", "bold")}`,
  ].join("\n");
}

export function essenceBlock(e: BrandEssenceRecord): string {
  return [
    `BRAND LINE: ${e.line}`,
    `PURPOSE: ${e.purpose}`,
    `PROMISE: ${e.promise}`,
    `DO: ${e.doList.join("; ")}`,
    `DON'T: ${e.dontList.join("; ")}`,
    `CALL TO ACTION (when one is wanted): ${e.cta}`,
  ].join("\n");
}

/** The paragraph that never changes: who Bob is and the facts that are fixed. */
export const BRAND_PARAGRAPH =
  `The brand is "${SITE.name}" (${SITE.domain}): Robert "Bob" Castellino, a large-format landscape photographer of fifty years — Colorado first (the Flatirons, the Maroon Bells, Red Mountain Pass, Rocky Mountain National Park), then the wider West. He works from his studio in Boulder County, Colorado, and signs every book and print himself. ` +
  `His book is "${BOOK.title}": ${BOOK.facts}. Those facts are fixed — never change the plate count, page count, printing or price, and never invent other numbers, dates, awards, quotes or place names. ` +
  `Limited prints are at ${SITE.url}${SITE.galleryPath}; the signed book is at ${SITE.url}${SITE.bookPath}; the writing lives at ${SITE.url}${SITE.musingsPath}. ` +
  `Speak as Bob, first person, unless told otherwise. No hype, no countdowns, no "sale", no emoji, no exclamation marks. Never call the work "content". Never mention AI, mockups or renderings.`;

/**
 * The shared system prompt. `role` is the one-paragraph job description for
 * this generator; `extra` is appended last (platform brief, format notes…).
 * `includePillars` lists every active pillar when no single one is chosen.
 */
export function brandSystemPrompt(
  ctx: BrandContext,
  opts: { role: string; extra?: string; includePillars?: boolean },
): string {
  const parts: string[] = [
    `${opts.role} ${BRAND_PARAGRAPH}`,
    `BRAND ESSENCE:\n${essenceBlock(ctx.essence)}`,
    `VOICE DIALS:\n${voicePrompt(ctx.voice)}`,
    `TONE BRIEF:\n${tonePrompt(ctx.tone)}`,
  ];
  if (ctx.pillar) {
    parts.push(`CONTENT PILLAR — carry this message (naturally, never as a slogan):\n${pillarPrompt(ctx.pillar, ctx.messages)}`);
  } else if (opts.includePillars && ctx.pillars.length) {
    parts.push(`CONTENT PILLARS (draw on any; each piece should land one):\n${ctx.pillars.map((p) => `- ${p.name}: ${p.message}`).join("\n")}`);
  }
  if (ctx.message) {
    parts.push(
      `THE CORE MESSAGE FOR THIS PIECE: "${ctx.message.text}". Sample lines in his voice (for register, not to copy):\n${ctx.message.captions.map((c) => `- ${c}`).join("\n")}`,
    );
  }
  if (opts.extra) parts.push(opts.extra);
  return parts.join("\n\n");
}
