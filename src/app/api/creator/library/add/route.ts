import { NextResponse } from "next/server";
import { creatorDbGuard, errorResponse, readJson } from "@/lib/creator/guard";
import { prisma } from "@/lib/prisma";

/*
  POST /api/creator/library/add { url, title?, generated? }
  Files are already stored by /api/admin/upload (→ /api/images/<id>). This
  registers the picture in the gallery so loadLibrary() sees it: a Photo row
  in the "Studio uploads" collection (created on first use, unpublished so it
  never shows on the public gallery by itself).
*/
export const runtime = "nodejs";
const SLUG = "studio-uploads";

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const body = await readJson<{ url?: string; title?: string; generated?: boolean }>(req);
  if (!body?.url || !/^(\/api\/images\/|\/assets\/|https:\/\/)/.test(body.url)) return NextResponse.json({ error: "url is required" }, { status: 400 });
  try {
    const collection = await prisma.collection.upsert({
      where: { slug: SLUG },
      create: { slug: SLUG, label: "Studio uploads", intro: "Pictures added from the creator studio.", published: false, order: 999 },
      update: {},
    });
    const count = await prisma.photo.count({ where: { collectionId: collection.id } });
    const title = (body.title || `Upload ${count + 1}`).slice(0, 120);
    const photo = await prisma.photo.create({ data: { collectionId: collection.id, img: body.url, title, loc: "", blurb: body.generated ? "Generated image — not a plate." : "", order: count } });
    return NextResponse.json({ ok: true, src: photo.img, title: photo.title }, { status: 201 });
  } catch (e) {
    return errorResponse(e, "Could not add the picture.");
  }
}
