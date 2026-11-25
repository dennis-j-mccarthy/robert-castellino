import { NextResponse } from "next/server";
import { AI_NOT_CONFIGURED, aiErrorMessage, generateJson, hasAnthropicKey } from "@/lib/creator/ai";
import { brandSystemPrompt, loadBrandContext } from "@/lib/creator/brand-context";
import { creatorGuard, readJson } from "@/lib/creator/guard";
import { absoluteImageUrl } from "@/lib/creator/library";
import { CAPTION_LIMITS, PLATFORM_BRIEF, PLATFORM_LABELS, clamp, isSocialPlatform, type SocialPlatform } from "@/lib/creator/social";
import { studio } from "@/studio.config";

/*
  POST /api/creator/social/instant — the Instant post.
  Body: { imageUrl (site-relative or https), bullets: string[1..3], platform? }
  Returns: { caption, pillarId, alt, place }

  Looks at the photo, reads the owner's three bullets, and writes the whole post
  in his voice: one caption for the chosen platform, the pillar it lands,
  an alt text, and the place if it can tell. One model call.
*/

export const runtime = "nodejs";
export const maxDuration = 90;

export async function POST(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  if (!hasAnthropicKey()) return NextResponse.json({ error: AI_NOT_CONFIGURED }, { status: 503 });
  const body = await readJson<{ imageUrl?: string; bullets?: unknown; platform?: string }>(req);
  if (!body?.imageUrl) return NextResponse.json({ error: "Add a photo first." }, { status: 400 });
  const bullets = (Array.isArray(body.bullets) ? body.bullets : []).map((b) => String(b).trim()).filter(Boolean).slice(0, 3);
  if (!bullets.length) return NextResponse.json({ error: "Give me at least one bullet point." }, { status: 400 });
  const platform: SocialPlatform = isSocialPlatform(body.platform) ? body.platform : "facebook";
  const limit = CAPTION_LIMITS[platform];

  try {
    const ctx = await loadBrandContext();
    const ids = ctx.pillars.map((p) => p.id);
    const out = await generateJson<{ caption: string; pillarId: string; alt: string; place: string }>({
      system: brandSystemPrompt(ctx, {
        role: `You write ${studio.site.owner}'s social posts from a photo and a few of ${studio.site.pronouns[1]} notes.`,
        includePillars: true,
        extra: `Look at the photograph, then read ${studio.site.owner}'s notes. The notes are the facts and the feeling; the post must carry every one of them, in his order of importance, without quoting them as a list. Describe only what is in the frame or in the notes; never invent a place or a time. No hype, no exclamation marks. Hashtags only if the platform brief asks for them.\n\nPLATFORM:\n${PLATFORM_BRIEF[platform]}`,
      }),
      user: `Write the ${PLATFORM_LABELS[platform]} post for this photo.\n\n${studio.site.owner.toUpperCase()}'S NOTES:\n${bullets.map((b) => `- ${b}`).join("\n")}\n\nReturn JSON: caption (ready to post, under ${limit} characters), pillarId (one of: ${ids.join(", ")}), alt (one plain sentence describing the picture for someone who cannot see it), place (place, state — or empty if not sure).`,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["caption", "pillarId", "alt", "place"],
        properties: { caption: { type: "string" }, pillarId: { type: "string", enum: ids.length ? ids : ["none"] }, alt: { type: "string" }, place: { type: "string" } },
      },
      imageUrl: /^https?:\/\//i.test(body.imageUrl) ? body.imageUrl : absoluteImageUrl(body.imageUrl),
      maxTokens: 1500,
    });
    return NextResponse.json({ ...out, caption: clamp(String(out.caption ?? "").trim(), limit), platform });
  } catch (e) {
    return NextResponse.json({ error: aiErrorMessage(e) }, { status: 502 });
  }
}
