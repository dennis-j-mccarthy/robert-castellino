import { NextResponse } from "next/server";
import { AI_NOT_CONFIGURED, aiErrorMessage, generateJson, hasAnthropicKey } from "@/lib/creator/ai";
import { brandSystemPrompt, loadBrandContext } from "@/lib/creator/brand-context";
import { DESIGNED_THEMES, type DesignedPost } from "@/lib/creator/designed";
import { creatorGuard, readJson } from "@/lib/creator/guard";
import { absoluteImageUrl, loadLibrary, normalizeSrc } from "@/lib/creator/library";
import { CAPTION_LIMITS, PLATFORM_BRIEF, PLATFORM_LABELS, clamp, isSocialPlatform, type SocialPlatform } from "@/lib/creator/social";
import { adapters } from "@/studio.adapters";
import { studio } from "@/studio.config";

/*
  POST /api/creator/social/concepts — the Post maker's five concept tiles.
  Body: { pillarId, platform, messageId?, imageSrc?, musingId?, topic?, count? }
  Returns: { posts: DesignedPost[] }

  Not five captions: five ANGLES on the pillar, each a designed graphic
  (a bold statement in one of the layout archetypes) plus the platform
  caption. Claude is briefed as the brand's creative director, on top of
  the owner's Essence, pillars and voice. When a picture is chosen it looks
  at it, and at least one concept is a photo-hero built on it.
*/
export const runtime = "nodejs";
export const maxDuration = 120;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["posts"],
  properties: {
    posts: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["angle", "theme", "tone", "eyebrow", "statement", "sub", "statLabel", "items", "caption", "hashtags"],
        properties: {
          angle: { type: "string" },
          theme: { type: "string", enum: [...DESIGNED_THEMES] },
          tone: { type: "string", enum: ["field", "paper", "ink"] },
          eyebrow: { type: "string" },
          statement: { type: "string" },
          sub: { type: "string" },
          statLabel: { type: "string" },
          items: { type: "array", items: { type: "string" } },
          caption: { type: "string" },
          hashtags: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
};

const DIRECTOR = `You are also the brand's CREATIVE DIRECTOR. Every concept must be a distinct ANGLE, not a rewording: a contrarian truth, a number that stops the thumb, a tiny ritual, a confession, a before/after, a rule the owner lives by, a question the reader is already asking, a line a client actually said. Name the angle in "angle" (two or three words).

GRAPHIC COPY is the heart of it: short, bold, clever, confident STATEMENTS that could sit on a poster — usually one line, often ending in a period. Specific beats generic. No hype, no exclamation stacks, no emoji on the graphic, no hashtags on the graphic. Never invent numbers, awards, places, quotes or dates; a "stat" is allowed only when the brand facts above contain a true number, otherwise do not use "stat". A "quote" must be a line the owner would plausibly say in first person, or a client remark marked as such in "sub" (first name and a role, no surnames).

ARCHETYPES (pick the one the angle needs; vary across the set):
- "statement": one bold line + one supporting "sub". The default.
- "stat": the number in "statement" (e.g. "50"), an ALL-CAPS "statLabel" (e.g. "YEARS OF COLORADO LIGHT"), one-line context in "sub".
- "checklist": a headline "statement" + 3–5 short "items" (2–5 words each).
- "steps": a headline "statement" + 3–4 short ordered "items".
- "quote": the quote in "statement", attribution in "sub".
- "photo-hero": the bold statement sits over the owner's real picture; write only "statement" (+ optional short "sub"). Only when a picture is supplied; then make at least one, ideally two, of the set photo-hero, and let the statement answer what is actually in the frame.

TONE sets the colour field: "field" = the brand accent colour, "paper" = light paper, "ink" = near-black. Mix them across the set. Fields you do not use: "" or [].

CAPTION: the platform caption for this concept, in the owner's voice, per the platform brief — it carries the angle further than the graphic can, and never repeats the statement word for word. "hashtags": 0–3 words, no # symbol.`;

export async function POST(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  if (!hasAnthropicKey()) return NextResponse.json({ error: AI_NOT_CONFIGURED }, { status: 503 });
  const body = await readJson<{ pillarId?: string; platform?: string; messageId?: string; imageSrc?: string; musingId?: string; topic?: string; count?: number }>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const ctx = await loadBrandContext({ pillarId: typeof body.pillarId === "string" ? body.pillarId : null, messageId: typeof body.messageId === "string" ? body.messageId : null });
  if (!ctx.pillar) return NextResponse.json({ error: "Choose a pillar first (step 3)." }, { status: 400 });
  const platform: SocialPlatform = isSocialPlatform(body.platform) ? body.platform : "facebook";
  const topic = String(body.topic ?? "").trim().slice(0, 600);
  const COUNT = Math.min(6, Math.max(3, Number(body.count) || 5));

  let image: string | null = null;
  let imageUrl: string | undefined;
  const imageSrc = String(body.imageSrc ?? "").trim();
  if (imageSrc) {
    try {
      const lib = await loadLibrary();
      const it = lib.items.find((i) => i.src === normalizeSrc(imageSrc));
      if (it) {
        image = [it.title ?? it.label, it.loc, it.blurb].filter(Boolean).join(" — ");
        imageUrl = absoluteImageUrl(it.src);
      } else if (/^https?:\/\//i.test(imageSrc)) imageUrl = imageSrc;
    } catch { /* no image context */ }
  }
  let musing: { title: string; excerpt: string; link: string } | null = null;
  const musingId = String(body.musingId ?? "").trim();
  if (musingId) {
    const m = await adapters.content.get(musingId).catch(() => null);
    if (m) musing = { title: m.title, excerpt: m.excerpt, link: adapters.content.url(m.id) };
  }

  try {
    const data = await generateJson<{ posts?: DesignedPost[] }>({
      system: brandSystemPrompt(ctx, {
        role: `You write ${studio.site.owner}'s social posts for ${PLATFORM_LABELS[platform]}.`,
        includePillars: true,
        extra: `${DIRECTOR}\n\nPLATFORM:\n${PLATFORM_BRIEF[platform]}`,
      }),
      user: `Create exactly ${COUNT} designed post concepts for the "${ctx.pillar.name}" pillar${ctx.message ? ` carrying the core message "${ctx.message.text}"` : ""}. Five different angles, five different archetypes where it makes sense, mixed tones.
${imageUrl ? `\nTHE PICTURE (attached) will be on the post${image ? `: ${image}` : ""}. Look at it. Make at least one concept "photo-hero" whose statement belongs to what is in the frame.` : "\nNo picture is chosen yet, so no photo-hero; the graphic carries the post."}${
        musing ? `\n\nPROMOTE THIS POST FROM THE ${studio.brand.blog.label.toUpperCase()}:\nTITLE: ${musing.title}\nEXCERPT: ${musing.excerpt}\nLINK: ${musing.link}` : ""
      }${topic ? `\n\nWHAT THIS POST IS ABOUT: ${topic}` : ""}

Return the posts array.`,
      schema: SCHEMA,
      imageUrl,
      maxTokens: 6000,
      effort: "medium",
    });
    const limit = CAPTION_LIMITS[platform];
    const posts = (Array.isArray(data.posts) ? data.posts : [])
      .filter((p) => p && typeof p.statement === "string")
      .slice(0, COUNT)
      .map((p) => ({
        angle: String(p.angle ?? "").trim().slice(0, 40) || "An angle",
        theme: (DESIGNED_THEMES as readonly string[]).includes(p.theme) ? p.theme : "statement",
        tone: p.tone === "paper" || p.tone === "ink" ? p.tone : "field",
        eyebrow: String(p.eyebrow ?? "").trim().slice(0, 60),
        statement: String(p.statement).trim().slice(0, 160),
        sub: String(p.sub ?? "").trim().slice(0, 220),
        statLabel: String(p.statLabel ?? "").trim().slice(0, 40),
        items: (Array.isArray(p.items) ? p.items : []).map((x) => String(x).trim().slice(0, 60)).filter(Boolean).slice(0, 5),
        caption: clamp(String(p.caption ?? ""), limit),
        hashtags: (Array.isArray(p.hashtags) ? p.hashtags : []).map((x) => String(x).replace(/^#/, "").trim()).filter(Boolean).slice(0, 3),
      }))
      // photo-hero without a picture falls back to a statement card
      .map((p) => (p.theme === "photo-hero" && !imageUrl ? { ...p, theme: "statement" as const } : p));
    if (!posts.length) return NextResponse.json({ error: "No concepts came back — try again." }, { status: 502 });
    return NextResponse.json({ posts, pillarId: ctx.pillar.id, platform });
  } catch (err) {
    console.error("[creator/social/concepts]", err);
    return NextResponse.json({ error: aiErrorMessage(err) }, { status: 502 });
  }
}
