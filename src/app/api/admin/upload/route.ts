import { NextResponse } from "next/server";
import sharp from "sharp";
import { getSession } from "@/lib/auth";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";

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
    const input = Buffer.from(await file.arrayBuffer());
    // .rotate() bakes in EXIF orientation (phone photos); resize + compress
    // so the DB row stays small. 2600px long edge keeps prints crisp on screen.
    const { data, info } = await sharp(input)
      .rotate()
      .resize({ width: 2600, height: 2600, fit: "inside", withoutEnlargement: true })
      .jpeg({ quality: 84, mozjpeg: true })
      .toBuffer({ resolveWithObject: true });

    const rec = await prisma.image.create({
      data: { data, contentType: "image/jpeg", width: info.width, height: info.height },
    });
    return NextResponse.json({ url: `/api/images/${rec.id}` });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Could not process the image.";
    return NextResponse.json({ error: msg }, { status: 502 });
  }
}
