import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import { getSession } from "@/lib/auth";

export const runtime = "nodejs";

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"];
const MAX_BYTES = 20 * 1024 * 1024; // 20 MB

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob storage not configured. Add it in Vercel dashboard → Storage → Blob." },
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

  if (!ALLOWED_TYPES.includes(file.type) && !file.name.match(/\.(jpe?g|png|webp|heic|heif)$/i)) {
    return NextResponse.json({ error: "Only JPEG, PNG, WebP, and HEIC images are accepted." }, { status: 415 });
  }

  if (file.size > MAX_BYTES) {
    return NextResponse.json({ error: "File too large (max 20 MB)." }, { status: 413 });
  }

  // Sanitise filename and put it in a gallery subfolder
  const ext = file.name.split(".").pop()?.toLowerCase() ?? "jpg";
  const safe = file.name
    .replace(/\.[^.]+$/, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .slice(0, 60);
  const pathname = `gallery/${Date.now()}-${safe}.${ext}`;

  try {
    const blob = await put(pathname, file, {
      access: "public",
      contentType: file.type || "image/jpeg",
    });
    return NextResponse.json({ url: blob.url });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Upload failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
