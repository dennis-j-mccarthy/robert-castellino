import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";

/**
 * Image storage on a personal AWS S3 bucket (replaces Vercel Blob).
 *
 * Env:
 *   AWS_REGION, S3_BUCKET, AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY
 *   S3_PUBLIC_BASE_URL  (optional — CloudFront/custom domain; defaults to the
 *                        bucket's S3 URL)
 *
 * The bucket (or the CloudFront distribution) must allow public read so the
 * gallery and musings can display the images.
 */

export function isS3Configured(): boolean {
  return !!(
    process.env.S3_BUCKET &&
    process.env.AWS_REGION &&
    process.env.AWS_ACCESS_KEY_ID &&
    process.env.AWS_SECRET_ACCESS_KEY
  );
}

let cached: S3Client | null = null;
function client(): S3Client {
  if (!cached) cached = new S3Client({ region: process.env.AWS_REGION });
  return cached;
}

export async function uploadImage(
  key: string,
  body: Buffer,
  contentType: string,
): Promise<string> {
  const bucket = process.env.S3_BUCKET!;
  await client().send(
    new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: body,
      ContentType: contentType,
      CacheControl: "public, max-age=31536000, immutable",
    }),
  );
  const base =
    process.env.S3_PUBLIC_BASE_URL?.replace(/\/$/, "") ||
    `https://${bucket}.s3.${process.env.AWS_REGION}.amazonaws.com`;
  return `${base}/${encodeURI(key)}`;
}
