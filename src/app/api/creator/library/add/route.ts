import { NextResponse } from "next/server";
import { creatorDbGuard, errorResponse, readJson } from "@/lib/creator/guard";
import { adapters } from "@/studio.adapters";

/*
  POST /api/creator/library/add { url, title?, generated? }
  The file is already stored (POST /api/creator/upload). This registers the
  picture with the site through its pictures adapter so loadLibrary() sees it.
*/
export const runtime = "nodejs";

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const body = await readJson<{ url?: string; title?: string; generated?: boolean }>(req);
  if (!body?.url || !/^(\/|https:\/\/)/.test(body.url)) return NextResponse.json({ error: "url is required" }, { status: 400 });
  try {
    const r = await adapters.pictures.add({ url: body.url, title: body.title, generated: body.generated });
    return NextResponse.json({ ok: true, src: r.src, title: r.title }, { status: 201 });
  } catch (e) {
    return errorResponse(e, "Could not add the picture.");
  }
}
