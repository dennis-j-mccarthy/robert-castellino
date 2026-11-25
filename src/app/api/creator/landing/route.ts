import { NextResponse } from "next/server";
import { AI_NOT_CONFIGURED, aiErrorMessage, hasAnthropicKey } from "@/lib/creator/ai";
import { creatorDbGuard, readJson } from "@/lib/creator/guard";
import { KEYWORD_KINDS, keywordId } from "@/lib/creator/keywords";
import { writeLanding } from "@/lib/creator/landing";
import { loadLibrary } from "@/lib/creator/library";
import { prisma } from "@/lib/prisma";

/*
  GET  /api/creator/landing            → { pages }
  POST /api/creator/landing {keyword}  → writes a draft (unpublished) from
       Essence + pillars with a real plate as hero, links it to the Keyword
       row (status → target), returns { page }.
*/

export const runtime = "nodejs";
export const maxDuration = 120;

export async function GET() {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const pages = await prisma.landingPage.findMany({ orderBy: { updatedAt: "desc" } });
  return NextResponse.json({ pages });
}

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  if (!hasAnthropicKey()) return NextResponse.json({ error: AI_NOT_CONFIGURED }, { status: 503 });
  const b = await readJson<{ keyword?: string }>(req);
  const keyword = String(b?.keyword ?? "").trim().slice(0, 120);
  if (!keyword) return NextResponse.json({ error: "Pick a phrase first." }, { status: 400 });
  try {
    const lib = await loadLibrary();
    const plates = lib.items.filter((i) => i.adEligible && !i.mockup).sort((a, b) => Number(b.inBook) - Number(a.inBook));
    const draft = await writeLanding(keyword, plates);
    let slug = draft.slug;
    for (let n = 2; await prisma.landingPage.findUnique({ where: { slug } }); n++) slug = `${draft.slug}-${n}`;
    const page = await prisma.landingPage.create({
      data: {
        slug, keyword, title: draft.title, metaDescription: draft.metaDescription, h1: draft.h1, intro: draft.intro, body: draft.body,
        faq: draft.faq, heroImage: draft.heroSrc, heroAlt: draft.heroAlt, sections: JSON.parse(JSON.stringify(draft.sections)), published: false,
      },
    });
    await prisma.keyword.upsert({
      where: { id: keywordId(keyword) },
      update: { landingSlug: slug, status: "target" },
      create: { id: keywordId(keyword), phrase: keyword, kind: KEYWORD_KINDS[0], priority: 60, status: "target", source: "manual", landingSlug: slug },
    }).catch(() => null);
    return NextResponse.json({ page });
  } catch (e) {
    return NextResponse.json({ error: aiErrorMessage(e) }, { status: 502 });
  }
}
