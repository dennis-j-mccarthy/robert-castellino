import { NextResponse } from "next/server";
import { creatorDbGuard, errorResponse, readJson } from "@/lib/creator/guard";
import type { ContentInput } from "@/lib/creator/studio-adapters";
import { adapters } from "@/studio.adapters";

/*
  POST /api/creator/blog/save — the Blog writer's Save / Publish.
  Body: ContentInput & { id?: string }. With an id the post is updated,
  otherwise created. Goes through the site's content adapter, so the same
  button works on a site whose posts are Musings, BlogPosts or anything else.
*/
export const runtime = "nodejs";

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const b = await readJson<Partial<ContentInput> & { id?: string }>(req);
  if (!b || !b.title?.trim() || !Array.isArray(b.paragraphs) || !b.paragraphs.length) return NextResponse.json({ error: "A title and at least one paragraph are needed." }, { status: 400 });
  const input: ContentInput = {
    title: b.title.trim().slice(0, 200),
    excerpt: String(b.excerpt ?? "").trim().slice(0, 600),
    paragraphs: b.paragraphs.map((p) => String(p)).filter((p) => p.trim()),
    img: b.img ? String(b.img) : null,
    loc: b.loc ? String(b.loc).slice(0, 120) : null,
    category: b.category ?? null,
    pillarId: b.pillarId ?? null,
    published: !!b.published,
    date: b.date ?? null,
  };
  try {
    if (b.id) { await adapters.content.update(String(b.id), input); return NextResponse.json({ id: String(b.id), published: input.published, url: adapters.content.url(String(b.id)) }); }
    const r = await adapters.content.create(input);
    return NextResponse.json({ id: r.id, published: input.published, url: adapters.content.url(r.id) }, { status: 201 });
  } catch (e) {
    return errorResponse(e, "Could not save the post.");
  }
}
