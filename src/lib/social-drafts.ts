// Turn a published musing into platform-appropriate social post drafts.
//
// Pure + deterministic: no I/O, no Date.now(), no randomness — so each
// platform formatter is independently unit-testable and the output for a given
// post never changes. Persistence + the publish hook live elsewhere
// (publish-hooks.ts). Platforms mirror the channels the gift-series already
// targets: Instagram, Facebook, Pinterest, Stories/Reels, and email.

import type { Musing } from "@/data/musings";

export type Platform = "instagram" | "facebook" | "pinterest" | "reel" | "email";

export const PLATFORMS: Platform[] = ["instagram", "facebook", "pinterest", "reel", "email"];

// Caption character budgets per platform (used to clamp + asserted in tests).
export const LIMITS: Record<Platform, number> = {
  instagram: 2200,
  facebook: 2000,
  pinterest: 500,
  reel: 150,
  email: 300,
};

export interface SocialDraftContent {
  platform: Platform;
  caption: string;
  hashtags: string;
  link: string;
  image?: string;
}

const BRAND_TAGS = ["Colorado", "ColoradoPhotography", "LandscapePhotography", "RobertCastellino"];
const CAT_TAGS: Record<string, string[]> = {
  reflections: ["Reflections", "NatureWriting"],
  light: ["GoldenHour", "NaturePhotography"],
  land: ["PublicLands", "TheWest"],
  locations: ["RockyMountains", "VisitColorado"],
  wilderness: ["Wilderness", "RockyMountains"],
};

export function stripHtml(s: string): string {
  return s.replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim();
}

export function clamp(s: string, max: number): string {
  if (s.length <= max) return s;
  return s.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

/** Space-joined #hashtags: category tags first, then brand tags, deduped. */
export function hashtagsFor(m: Pick<Musing, "cat">, count: number): string {
  const seen = new Set<string>();
  const tags: string[] = [];
  for (const t of [...(CAT_TAGS[m.cat] ?? []), ...BRAND_TAGS]) {
    const key = t.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    tags.push("#" + t);
    if (tags.length >= count) break;
  }
  return tags.join(" ");
}

type In = Pick<Musing, "title" | "excerpt" | "cat" | "img">;

export function forInstagram(m: In, link: string): SocialDraftContent {
  const body = stripHtml(m.excerpt);
  const caption = clamp(`${m.title}\n\n${body}\n\nRead the full note — link in bio.`, LIMITS.instagram);
  return { platform: "instagram", caption, hashtags: hashtagsFor(m, 8), link, image: m.img };
}

export function forFacebook(m: In, link: string): SocialDraftContent {
  const body = stripHtml(m.excerpt);
  const caption = clamp(`${m.title}\n\n${body}\n\nRead more: ${link}`, LIMITS.facebook);
  return { platform: "facebook", caption, hashtags: hashtagsFor(m, 3), link, image: m.img };
}

export function forPinterest(m: In, link: string): SocialDraftContent {
  const body = stripHtml(m.excerpt);
  const caption = clamp(`${m.title} — ${body}`, LIMITS.pinterest);
  return { platform: "pinterest", caption, hashtags: hashtagsFor(m, 5), link, image: m.img };
}

export function forReel(m: In, link: string): SocialDraftContent {
  // Short on-screen hook; keep it a single punchy line.
  const caption = clamp(`${m.title} — a note from the Boulder studio.`, LIMITS.reel);
  return { platform: "reel", caption, hashtags: hashtagsFor(m, 5), link, image: m.img };
}

export function forEmail(m: In, link: string): SocialDraftContent {
  const body = stripHtml(m.excerpt);
  // "Subject — preview" teaser line; the newsletter builder can expand it.
  const caption = clamp(`New from the studio: ${m.title} — ${body}`, LIMITS.email);
  return { platform: "email", caption, hashtags: "", link, image: m.img };
}

const BUILDERS: Record<Platform, (m: In, link: string) => SocialDraftContent> = {
  instagram: forInstagram,
  facebook: forFacebook,
  pinterest: forPinterest,
  reel: forReel,
  email: forEmail,
};

/** Build one draft per platform for a published musing. */
export function buildSocialDrafts(m: In & { id: string }, baseUrl: string): SocialDraftContent[] {
  const link = `${baseUrl}/musings/${m.id}`;
  return PLATFORMS.map((p) => BUILDERS[p](m, link));
}
