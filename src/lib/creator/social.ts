/*
  Post maker constants — pure data, safe to import from client components.

  Facebook is the only network that publishes (Bob's Page, via the existing
  /api/admin/facebook/post route). Instagram has no linked Business account
  on this Page yet, so it is copy-only: the caption is written in Instagram's
  shape and copied out by hand.
*/

export type SocialPlatform = "facebook" | "instagram";

export const SOCIAL_PLATFORMS: SocialPlatform[] = ["facebook", "instagram"];

export const CAPTION_LIMITS: Record<SocialPlatform, number> = {
  facebook: 2000,
  instagram: 2200,
};

export const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  facebook: "Facebook",
  instagram: "Instagram (copy only)",
};

export const PUBLISHES: Record<SocialPlatform, boolean> = {
  facebook: true,
  instagram: false,
};

export function isSocialPlatform(v: unknown): v is SocialPlatform {
  return typeof v === "string" && (SOCIAL_PLATFORMS as string[]).includes(v);
}

export function clamp(s: string, max: number): string {
  const t = s.trim();
  if (t.length <= max) return t;
  return t.slice(0, Math.max(0, max - 1)).trimEnd() + "…";
}

/** What the caption writer is told about each platform. */
export const PLATFORM_BRIEF: Record<SocialPlatform, string> = {
  facebook:
    "Facebook Page post: 2–4 short paragraphs in Bob's first-person voice, one real place and one real hour, no hashtag walls (at most 2, on the last line, or none). A link only when a Musing or the book is the point, on its own last line. Under 900 characters.",
  instagram:
    "Instagram caption: a strong first line (it shows before 'more'), then 2–3 short paragraphs, then 5–8 relevant hashtags on the last line. Never include a URL — say 'link in bio' if there is somewhere to go. Under 1200 characters.",
};
