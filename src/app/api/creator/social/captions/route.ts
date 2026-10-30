import { NextResponse } from "next/server";
import { AI_NOT_CONFIGURED, aiErrorMessage, generateJson, hasAnthropicKey } from "@/lib/creator/ai";
import { brandSystemPrompt, loadBrandContext } from "@/lib/creator/brand-context";
import { creatorGuard, readJson } from "@/lib/creator/guard";
import { loadLibrary, normalizeSrc } from "@/lib/creator/library";
import { SITE } from "@/lib/creator/pillars";
import { CAPTION_LIMITS, PLATFORM_BRIEF, PLATFORM_LABELS, clamp, isSocialPlatform, type SocialPlatform } from "@/lib/creator/social";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

/*
  POST /api/creator/social/captions — step 4 of the Post maker.
  Body: { pillarId, platform, messageId?, imageSrc?, musingId?, topic? }
  Returns: { captions: string[3], pillarId, platform }

  Three options for ONE platform in Bob's voice. `imageSrc` pulls the
  library item's title / place / blurb so the copy can name what's in the
  frame; `musingId` promotes that Musing with its link; `topic` is a nudge.
*/

export const runtime = "nodejs";
export const maxDuration = 120;

const COUNT = 3;
const SCHEMA = {
  type: "object",
  additionalProperties: false,
  properties: {
    captions: { type: "array", items: { type: "string" }, description: "Exactly three distinct, ready-to-post captions for the named platform." },
  },
  required: ["captions"],
};

export async function POST(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  if (!hasAnthropicKey()) return NextResponse.json({ error: AI_NOT_CONFIGURED }, { status: 503 });
  const body = await readJson<{ pillarId?: string; platform?: string; messageId?: string; imageSrc?: string; musingId?: string; topic?: string }>(req);
  if (!body) return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });

  const ctx = await loadBrandContext({
    pillarId: typeof body.pillarId === "string" ? body.pillarId : null,
    messageId: typeof body.messageId === "string" ? body.messageId : null,
  });
  if (!ctx.pillar) return NextResponse.json({ error: "Choose a pillar first (step 3)." }, { status: 400 });
  const platform: SocialPlatform = isSocialPlatform(body.platform) ? body.platform : "facebook";
  const topic = String(body.topic ?? "").trim().slice(0, 600);

  // What's in the frame, from the library's enrichment.
  let image: string | null = null;
  const imageSrc = String(body.imageSrc ?? "").trim();
  if (imageSrc) {
    try {
      const lib = await loadLibrary();
      const it = lib.items.find((i) => i.src === normalizeSrc(imageSrc));
      if (it) {
        image = [it.title ?? it.label, it.loc, it.blurb, it.inBook ? `(this plate is in the book${it.bookPage ? `, page ${it.bookPage}` : ""})` : ""]
          .filter(Boolean)
          .join(" — ");
      }
    } catch {
      /* no image context */
    }
  }

  // Optional Musing to promote.
  let musing: { title: string; excerpt: string; link: string } | null = null;
  const musingId = String(body.musingId ?? "").trim();
  if (musingId && isDatabaseConfigured()) {
    try {
      const m = await prisma.musing.findUnique({ where: { id: musingId } });
      if (m) musing = { title: m.title, excerpt: m.excerpt.replace(/<[^>]+>/g, ""), link: `${SITE.url}${SITE.musingsPath}/${m.id}` };
    } catch {
      /* skip */
    }
  }

  try {
    const data = await generateJson<{ captions?: unknown }>({
      system: brandSystemPrompt(ctx, {
        role: "You write Bob's social posts. Write for ONE platform at a time, in its native shape. Each of the three options must take a different angle — not three rewordings of one idea. Describe only what the image notes say is in the frame; never invent a place or a time.",
        extra: `PLATFORM:\n${PLATFORM_BRIEF[platform]}`,
      }),
      user: `Write exactly ${COUNT} ${PLATFORM_LABELS[platform]} caption options for the "${ctx.pillar.name}" pillar.
${image ? `\nTHE IMAGE: ${image}` : "\nTHE IMAGE: not described — don't describe it; write around light, land and the hour in general terms."}${
        musing ? `\n\nPROMOTE THIS MUSING:\nTITLE: ${musing.title}\nEXCERPT: ${musing.excerpt}\nLINK: ${musing.link}` : ""
      }${topic ? `\n\nWHAT THIS POST IS ABOUT: ${topic}` : ""}

Return them in the captions array.`,
      schema: SCHEMA,
      maxTokens: 3000,
      effort: "low",
    });
    const limit = CAPTION_LIMITS[platform];
    const captions = (Array.isArray(data.captions) ? data.captions : [])
      .map((c) => String(c).trim())
      .filter(Boolean)
      .slice(0, COUNT)
      .map((c) => clamp(c, limit));
    if (!captions.length) return NextResponse.json({ error: "No captions came back — try again." }, { status: 502 });
    return NextResponse.json({ captions, pillarId: ctx.pillar.id, platform });
  } catch (err) {
    console.error("[creator/social/captions]", err);
    return NextResponse.json({ error: aiErrorMessage(err) }, { status: 502 });
  }
}
