import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { creatorDbGuard, readJson } from "@/lib/creator/guard";
import { prisma } from "@/lib/prisma";
import type { Prisma } from "@/generated/prisma/client";

export const runtime = "nodejs";

type Patch = {
  title?: string; metaDescription?: string; h1?: string; intro?: string; body?: string;
  faq?: { q: string; a: string }[]; heroImage?: string | null; heroAlt?: string | null; published?: boolean;
  sections?: Prisma.InputJsonValue;
};

// PATCH any of the fields above (Publish = { published: true }); DELETE removes the page.
export async function PATCH(req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const { slug } = await ctx.params;
  const b = await readJson<Patch>(req);
  if (!b) return NextResponse.json({ error: "Invalid request." }, { status: 400 });
  const data: Patch = {};
  for (const k of ["title", "metaDescription", "h1", "intro", "body"] as const) if (typeof b[k] === "string") data[k] = b[k];
  if (Array.isArray(b.faq)) data.faq = b.faq.filter((f) => f && f.q && f.a).slice(0, 10).map((f) => ({ q: String(f.q), a: String(f.a) }));
  if (b.heroImage !== undefined) data.heroImage = b.heroImage ? String(b.heroImage).slice(0, 300) : null;
  if (b.heroAlt !== undefined) data.heroAlt = b.heroAlt ? String(b.heroAlt).slice(0, 400) : null;
  if (typeof b.published === "boolean") data.published = b.published;
  if (b.sections && typeof b.sections === "object" && JSON.stringify(b.sections).length < 20000) data.sections = b.sections;
  try {
    const page = await prisma.landingPage.update({ where: { slug }, data });
    revalidatePath(`/for/${slug}`);
    revalidatePath("/sitemap.xml");
    return NextResponse.json({ page });
  } catch {
    return NextResponse.json({ error: "Page not found." }, { status: 404 });
  }
}

export async function DELETE(_req: Request, ctx: { params: Promise<{ slug: string }> }) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  const { slug } = await ctx.params;
  await prisma.landingPage.delete({ where: { slug } }).catch(() => null);
  await prisma.keyword.updateMany({ where: { landingSlug: slug }, data: { landingSlug: null } }).catch(() => null);
  revalidatePath(`/for/${slug}`);
  revalidatePath("/sitemap.xml");
  return NextResponse.json({ ok: true });
}
