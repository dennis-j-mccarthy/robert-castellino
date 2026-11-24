import { NextResponse } from "next/server";
import { aiErrorMessage, generateJson, hasAnthropicKey, AI_NOT_CONFIGURED } from "@/lib/creator/ai";
import { brandSystemPrompt, loadBrandContext } from "@/lib/creator/brand-context";
import { creatorGuard, readJson } from "@/lib/creator/guard";
import { absoluteImageUrl } from "@/lib/creator/library";

/*
  POST /api/creator/library/describe { src } → { title, loc, blurb, pillarId, caption }
  Claude looks at the picture and fills the library fields in Bob's voice:
  a short title, the place if it can tell (else ""), a one-line blurb, the
  best-fitting pillar, and one caption ready for a post. Nothing is saved
  here; the client applies what it likes via PATCH /api/creator/library.
*/
export const runtime = "nodejs";

type Out = { title: string; loc: string; blurb: string; pillarId: string; caption: string; confidence: "high" | "medium" | "low" };

export async function POST(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  if (!hasAnthropicKey()) return NextResponse.json({ error: AI_NOT_CONFIGURED }, { status: 503 });
  const body = await readJson<{ src?: string; hint?: string }>(req);
  if (!body?.src) return NextResponse.json({ error: "src is required" }, { status: 400 });
  try {
    const ctx = await loadBrandContext();
    const ids = ctx.pillars.map((p) => p.id);
    const out = await generateJson<Out>({
      system: brandSystemPrompt(ctx, {
        role: "You caption Robert Castellino's landscape photographs for his own library.",
        includePillars: true,
        extra: "Look at the photograph. Name only what you can see; if you are not sure of the exact place, give the region or leave loc empty rather than guess a landmark. No hype, no exclamation marks, no hashtags.",
      }),
      user: `Fill the library card for this picture.${body.hint ? ` Bob's note: "${body.hint}".` : ""}\n\nReturn JSON: title (3–6 words, the place or the light, Title Case), loc (place, state — or empty), blurb (one sentence, under 140 characters, first person as Bob), pillarId (one of: ${ids.join(", ")}), caption (a Facebook caption in his voice, 1–2 sentences, ends with the place), confidence (high|medium|low on the place).`,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["title", "loc", "blurb", "pillarId", "caption", "confidence"],
        properties: { title: { type: "string" }, loc: { type: "string" }, blurb: { type: "string" }, pillarId: { type: "string", enum: ids }, caption: { type: "string" }, confidence: { type: "string", enum: ["high", "medium", "low"] } },
      },
      imageUrl: absoluteImageUrl(body.src),
      maxTokens: 1200,
    });
    return NextResponse.json(out);
  } catch (e) {
    return NextResponse.json({ error: aiErrorMessage(e) }, { status: 502 });
  }
}
