/**
 * Ads maker: shared server logic for the /api/admin/ads routes.
 *
 * Keeps the DB row (AdDraft) and the Meta objects (image → creative → ad)
 * in step. Routes stay thin; the submit/duplicate flows live here so they
 * can't drift apart.
 */

import { NextResponse } from "next/server";
import { z } from "zod";
import { getSession } from "@/lib/auth";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { SITE_URL } from "@/lib/publish-hooks";
import {
  CTA_TYPES,
  adsManagerUrl,
  createAd,
  createCreative,
  draftStatusFor,
  errorMessage,
  getPreview,
  listAds,
  uploadImageFromUrl,
} from "@/lib/meta/ads";
import type { AdDraft } from "@/generated/prisma/client";

export const PAGE_ID = () => process.env.META_PAGE_ID || "134235743309639";
export const DEFAULT_LINK = `${SITE_URL}/book`;

/** 401 / 503 guard shared by every ads route. */
export async function guard(): Promise<NextResponse | null> {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!isDatabaseConfigured())
    return NextResponse.json({ error: "Database not configured." }, { status: 503 });
  return null;
}

/** `/assets/…` → absolute site URL; absolute http(s) URLs pass through. */
export function absoluteImageUrl(u: string): string {
  const s = u.trim();
  if (/^https?:\/\//i.test(s)) return s;
  return `${SITE_URL}${s.startsWith("/") ? "" : "/"}${s}`;
}

export const DraftSchema = z.object({
  name: z.string().trim().min(1, "Give the ad a name.").max(200),
  imageUrl: z.string().trim().min(1, "Pick an image."),
  message: z.string().trim().min(1, "Write the primary text.").max(2000),
  headline: z.string().trim().min(1, "Write a headline.").max(255),
  description: z.string().trim().max(255).optional().or(z.literal("")),
  link: z.string().trim().url("Link must be a full URL.").default(DEFAULT_LINK),
  ctaType: z.enum(CTA_TYPES).default("SHOP_NOW"),
  campaignId: z.string().trim().optional().or(z.literal("")),
  adsetId: z.string().trim().optional().or(z.literal("")),
});
export type DraftInput = z.infer<typeof DraftSchema>;

export function toCreateData(d: DraftInput) {
  return {
    name: d.name,
    imageUrl: absoluteImageUrl(d.imageUrl),
    message: d.message,
    headline: d.headline,
    description: d.description || null,
    link: d.link || DEFAULT_LINK,
    ctaType: d.ctaType,
    campaignId: d.campaignId || null,
    adsetId: d.adsetId || null,
  };
}

/** API shape: the row plus derived links. Never includes tokens. */
export function serialize(d: AdDraft, extra?: Record<string, unknown>) {
  return {
    ...d,
    createdAt: d.createdAt.toISOString(),
    updatedAt: d.updatedAt.toISOString(),
    adsManagerUrl: d.metaAdId ? adsManagerUrl(d.metaAdId) : null,
    ...extra,
  };
}

export function parseError(e: unknown): string {
  if (e instanceof z.ZodError) return e.issues[0]?.message ?? "Invalid request.";
  return e instanceof Error ? e.message : "Invalid request.";
}

/**
 * Pull ads that exist in Meta but not here into AdDraft rows, so the table
 * is the account's truth (ads made in Ads Manager, by the API, or from
 * another device all show up with Preview / Activate / Pause). Best-effort:
 * callers swallow errors so a Meta hiccup never blanks the table.
 * Returns the number of rows created.
 */
export async function syncFromMeta(): Promise<number> {
  const live = await listAds(undefined, true);
  if (!live.length) return 0;
  const known = new Set(
    (await prisma.adDraft.findMany({ where: { metaAdId: { not: null } }, select: { metaAdId: true } }))
      .map((r) => r.metaAdId),
  );
  const missing = live.filter((a) => !known.has(a.id) && a.creativeId);
  for (const a of missing) {
    const c = a.creative;
    await prisma.adDraft.create({
      data: {
        name: a.name || `Ad ${a.id}`,
        imageUrl: c?.thumbnailUrl || "",
        imageHash: c?.imageHash ?? null,
        message: c?.message || "(creative text not available)",
        headline: c?.headline || a.name || "",
        description: c?.description ?? null,
        link: c?.link || DEFAULT_LINK,
        ctaType: c?.ctaType && (CTA_TYPES as readonly string[]).includes(c.ctaType) ? c.ctaType : "SHOP_NOW",
        campaignId: a.campaignId,
        adsetId: a.adsetId || null,
        creativeId: a.creativeId,
        metaAdId: a.id,
        status: draftStatusFor(a.effectiveStatus),
      },
    });
  }
  return missing.length;
}

/**
 * Push a draft to Meta: image (once per draft) → creative (once) → PAUSED
 * ad in `adsetId`. Idempotent per step: re-running after a failure resumes
 * where it stopped. Persists ids + preview, or status=failed + error.
 */
export async function submitDraft(id: string, adsetIdOverride?: string): Promise<AdDraft> {
  let draft = await prisma.adDraft.findUniqueOrThrow({ where: { id } });
  const adsetId = adsetIdOverride || draft.adsetId;
  if (!adsetId) throw new Error("Choose an ad set first.");

  try {
    if (!draft.imageHash) {
      const { hash } = await uploadImageFromUrl(draft.imageUrl);
      draft = await prisma.adDraft.update({ where: { id }, data: { imageHash: hash } });
    }
    if (!draft.creativeId) {
      const { id: creativeId } = await createCreative({
        pageId: PAGE_ID(),
        name: `${draft.name} · creative`,
        imageHash: draft.imageHash!,
        message: draft.message,
        headline: draft.headline,
        description: draft.description ?? undefined,
        link: draft.link,
        ctaType: draft.ctaType,
        displayLink: new URL(draft.link).hostname,
        instagramActorId: process.env.META_IG_USER_ID || undefined,
      });
      draft = await prisma.adDraft.update({ where: { id }, data: { creativeId } });
    }
    if (!draft.metaAdId) {
      const { id: adId } = await createAd({
        adsetId,
        name: draft.name,
        creativeId: draft.creativeId!,
        status: "PAUSED",
      });
      draft = await prisma.adDraft.update({
        where: { id },
        data: { metaAdId: adId, adsetId, status: "submitted", error: null },
      });
    }
    // Preview is best-effort; the ad already exists if this throws.
    let previewUrl = draft.previewUrl;
    try {
      previewUrl = (await getPreview(draft.creativeId!, "MOBILE_FEED_STANDARD")).src;
    } catch {
      /* keep whatever we had */
    }
    return await prisma.adDraft.update({
      where: { id },
      data: { previewUrl, status: "submitted", error: null },
    });
  } catch (e) {
    const msg = errorMessage(e);
    await prisma.adDraft.update({ where: { id }, data: { status: "failed", error: msg } });
    throw new Error(msg);
  }
}
