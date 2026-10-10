// Side effects that fire when a musing is *newly* published.
//
// Split in two on purpose:
//   - revalidateMusings(): cheap cache invalidation, called synchronously in
//     the route so the new post + sitemap are live on the next request.
//   - onMusingPublished(): slow, best-effort network/DB work, run via `after()`
//     so it never blocks the publish response and never throws into the caller.
//
// Search-engine notification uses IndexNow (Bing, Yandex, Seznam, …). Google
// retired its sitemap ping endpoint (it now 404s); the Google path is a sitemap
// submitted once in Search Console, which then re-crawls on its own.

import { revalidatePath } from "next/cache";
import type { Musing } from "@/data/musings";
import { prisma, isDatabaseConfigured } from "@/lib/prisma";
import { buildSocialDrafts } from "@/lib/social-drafts";

export const SITE_URL = "https://robertcastellino.com";
const INDEXNOW_KEY = "83d98fc0654d32394b9abbd4ac8f900c";

export function musingUrl(id: string): string {
  return `${SITE_URL}/musings/${id}`;
}

/** Mark the musings list, the post, and the sitemap stale. Safe to call inline. */
export function revalidateMusings(id: string): void {
  try {
    revalidatePath("/musings");
    revalidatePath(`/musings/${id}`);
    revalidatePath("/sitemap.xml");
  } catch (err) {
    console.error("[publish] revalidate failed:", err);
  }
}

async function submitToIndexNow(urls: string[]): Promise<void> {
  try {
    const res = await fetch("https://api.indexnow.org/indexnow", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        host: "robertcastellino.com",
        key: INDEXNOW_KEY,
        keyLocation: `${SITE_URL}/${INDEXNOW_KEY}.txt`,
        urlList: urls,
      }),
    });
    console.log(`[publish] IndexNow responded ${res.status} for ${urls.length} url(s)`);
  } catch (err) {
    console.error("[publish] IndexNow submit failed:", err);
  }
}

// Generate one social post draft per platform and store them for review.
// Drafts, not live posts — no platform API credentials are configured.
// Upsert on (musingId, platform) so re-publishing refreshes rather than dupes.
async function generateSocialDrafts(m: Musing): Promise<void> {
  if (!isDatabaseConfigured()) return;
  try {
    const drafts = buildSocialDrafts(m, SITE_URL);
    for (const d of drafts) {
      await prisma.socialDraft.upsert({
        where: { musingId_platform: { musingId: m.id, platform: d.platform } },
        create: {
          musingId: m.id,
          platform: d.platform,
          caption: d.caption,
          hashtags: d.hashtags || null,
          link: d.link,
          image: d.image ?? null,
        },
        update: {
          caption: d.caption,
          hashtags: d.hashtags || null,
          link: d.link,
          image: d.image ?? null,
        },
      });
    }
    console.log(`[publish] generated ${drafts.length} social drafts for ${m.id}`);
  } catch (err) {
    console.error("[publish] social draft generation failed:", err);
  }
}

/**
 * Fire-and-forget work for a newly published musing. Wrap the call in `after()`
 * so it runs after the response. Each side effect is independently guarded, so
 * one failing never blocks the other and nothing throws into the caller.
 */
export async function onMusingPublished(musing: Musing): Promise<void> {
  await Promise.allSettled([
    submitToIndexNow([musingUrl(musing.id), `${SITE_URL}/sitemap.xml`]),
    generateSocialDrafts(musing),
  ]);
}
