import { NextResponse } from "next/server";
import { creatorDbGuard } from "@/lib/creator/guard";
import { adapters } from "@/studio.adapters";

/* POST multipart { file } → { url }. Stores through the site's uploads adapter. */
export const runtime = "nodejs";

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  let form: FormData;
  try { form = await req.formData(); } catch { return NextResponse.json({ error: "Invalid form data" }, { status: 400 }); }
  const file = form.get("file");
  if (!(file instanceof File)) return NextResponse.json({ error: "No file provided" }, { status: 400 });
  try {
    const r = await adapters.uploads.upload(file);
    return NextResponse.json({ url: r.url });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : "Could not store the image." }, { status: 502 });
  }
}
