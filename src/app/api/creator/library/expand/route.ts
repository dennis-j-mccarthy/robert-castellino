import { NextResponse } from "next/server";
import { aiErrorMessage, generateJson, hasAnthropicKey, AI_NOT_CONFIGURED } from "@/lib/creator/ai";
import { brandSystemPrompt, loadBrandContext } from "@/lib/creator/brand-context";
import { creatorGuard, readJson } from "@/lib/creator/guard";
import { absoluteImageUrl } from "@/lib/creator/library";
import { studio } from "@/studio.config";

/*
  POST /api/creator/library/expand { src, title?, blurb?, hint? }
    → { title, excerpt, paragraphs }
  The long form behind one picture — a recipe, the story of a plate —
  as the site's `brand.blog.fromPicture` brief asks. Claude looks at the
  picture and writes it in the owner's voice. Paragraphs may start with
  "## " (a subheading) or "- " (a list item); the content adapter turns
  those into the site's own blocks. Nothing is saved here; the client
  edits, then saves through /api/creator/blog/save.
*/
export const runtime = "nodejs";

type Out = { title: string; excerpt: string; paragraphs: string[] };

export async function POST(req: Request) {
  const blocked = await creatorGuard();
  if (blocked) return blocked;
  const fp = studio.brand.blog.fromPicture;
  if (!fp) return NextResponse.json({ error: "This site has no long form for pictures." }, { status: 404 });
  if (!hasAnthropicKey()) return NextResponse.json({ error: AI_NOT_CONFIGURED }, { status: 503 });
  const body = await readJson<{ src?: string; title?: string; blurb?: string; hint?: string }>(req);
  if (!body?.src) return NextResponse.json({ error: "src is required" }, { status: 400 });
  try {
    const ctx = await loadBrandContext();
    const known = [body.title && `Its title in the library: "${body.title}".`, body.blurb && `The owner's blurb: "${body.blurb}".`, body.hint && `${studio.site.owner}'s note: "${body.hint}".`].filter(Boolean).join(" ");
    const out = await generateJson<Out>({
      system: brandSystemPrompt(ctx, {
        role: studio.brand.blog.writerRole,
        includePillars: true,
        extra: `Look at the photograph first; write only what it supports. Return paragraphs as an array of strings. A string that starts with "## " is a subheading. A string that starts with "- " is one list item (one item per string). Numbered steps are strings that start with "1. ", "2. " and so on. Everything else is a plain paragraph. No markdown other than that, no hashtags, no exclamation marks.`,
      }),
      user: `${fp.brief}${known ? `\n\n${known}` : ""}\n\nReturn JSON: title (the ${fp.noun}'s name, Title Case, under 70 characters), excerpt (one or two sentences for the ${studio.brand.blog.label} list, under 200 characters), paragraphs (the ${fp.noun} itself, as described).`,
      schema: {
        type: "object",
        additionalProperties: false,
        required: ["title", "excerpt", "paragraphs"],
        properties: { title: { type: "string" }, excerpt: { type: "string" }, paragraphs: { type: "array", items: { type: "string" } } },
      },
      imageUrl: absoluteImageUrl(body.src),
      maxTokens: 3000,
    });
    return NextResponse.json({ title: out.title.trim().slice(0, 120), excerpt: out.excerpt.trim().slice(0, 600), paragraphs: out.paragraphs.map((p) => String(p).trim()).filter(Boolean) });
  } catch (e) {
    return NextResponse.json({ error: aiErrorMessage(e) }, { status: 502 });
  }
}
