import sharp from "sharp";
import { prisma } from "@/lib/prisma";

/*
  Store an uploaded picture in Postgres (Image rows, served by /api/images/<id>).
  .rotate() bakes in EXIF orientation (phone photos); resize + compress so the
  row stays small. 2600px long edge keeps prints crisp on screen.
*/
export const IMAGE_MAX_BYTES = 25 * 1024 * 1024;
const ALLOWED = /\.(jpe?g|png|webp|heic|heif|gif|tiff?)$/i;

export async function storeImage(file: File): Promise<{ url: string; width: number; height: number }> {
  if (!file.type.startsWith("image/") && !ALLOWED.test(file.name)) throw new Error("That doesn't look like an image.");
  if (file.size > IMAGE_MAX_BYTES) throw new Error("Image too large (max 25 MB).");
  const input = Buffer.from(await file.arrayBuffer());
  const { data, info } = await sharp(input).rotate().resize({ width: 2600, height: 2600, fit: "inside", withoutEnlargement: true }).jpeg({ quality: 84, mozjpeg: true }).toBuffer({ resolveWithObject: true });
  const rec = await prisma.image.create({ data: { data, contentType: "image/jpeg", width: info.width, height: info.height } });
  return { url: `/api/images/${rec.id}`, width: info.width, height: info.height };
}
