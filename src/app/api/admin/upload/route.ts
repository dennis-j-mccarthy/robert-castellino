import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth";
import { isDatabaseConfigured } from "@/lib/prisma";
import { storeImage } from "@/lib/image-store";

export const runtime = "nodejs";

const ALLOWED = /\.(jpe?g|png|webp|heic|heif|gif|tiff?)$/i;
const MAX_BYTES = 25 * 1024 * 1024; // 25 MB in; resized down before storage

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (!isDatabaseConfigured()) {
    return NextResponse.json(
      { error: "Database not configured. Add DATABASE_URL to store images." },
      { status: 503 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json({ error: "Invalid form data" }, { status: 400 });
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file provided" }, { status: 400 });
  }
  if (!file.type.startsWith("image/") && !ALLOWED.test(file.name)) {
    return NextResponse.json({ error: "That doesn't look like an image." }, { status: 415 });
  }
  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "Image too large (max 25 MB)." }, { status: 413 });
  }

  try {
    const rec = await storeImage(file);
    return NextResponse.json({ url: rec.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Could not process the image.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
