import { isDatabaseConfigured, prisma } from "@/lib/prisma";

export const runtime = "nodejs";

// Public image server — serves the bytea stored by the upload route.
// Immutable (content is keyed by id), so it caches hard on the CDN.
export async function GET(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  if (!isDatabaseConfigured()) {
    return new Response("Not found", { status: 404 });
  }
  try {
    const img = await prisma.image.findUnique({ where: { id } });
    if (!img) return new Response("Not found", { status: 404 });
    return new Response(new Uint8Array(img.data), {
      headers: {
        "Content-Type": img.contentType,
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch {
    return new Response("Not found", { status: 404 });
  }
}
