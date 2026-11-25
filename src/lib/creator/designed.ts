import { studio } from "@/studio.config";

/*
  Designed posts — the Post maker's concept tiles. Pure data, safe on the
  client. Each concept is an ANGLE on the pillar rendered into one of a few
  layout archetypes by /api/creator/og/post, plus the platform caption.
*/

export const DESIGNED_THEMES = ["statement", "stat", "checklist", "steps", "quote", "photo-hero"] as const;
export type DesignedTheme = (typeof DESIGNED_THEMES)[number];

export interface DesignedPost {
  /** The angle, named: "The contrarian", "By the numbers", "The ritual" */
  angle: string;
  theme: DesignedTheme;
  /** Small caps line above the statement */
  eyebrow: string;
  /** The bold statement on the graphic (a number for "stat") */
  statement: string;
  /** Supporting line; attribution for "quote" */
  sub: string;
  /** ALL-CAPS label under a stat */
  statLabel: string;
  /** Checklist / steps lines */
  items: string[];
  /** The platform caption */
  caption: string;
  hashtags: string[];
  /** "field" = accent background, "paper" = light background, "ink" = dark background */
  tone: "field" | "paper" | "ink";
}

export type DesignedSize = "square" | "portrait" | "story";
export const SIZES: Record<DesignedSize, [number, number]> = { square: [1080, 1080], portrait: [1080, 1350], story: [1080, 1920] };

/** Brand colours for the renderer, from studio.config with sensible fallbacks. */
export function designedPalette() {
  const og = studio.brand.og ?? {};
  return {
    accent: og.accent ?? studio.brand.accent,
    accent2: og.accent2 ?? og.accent ?? studio.brand.accent,
    ink: og.ink ?? "#15161c",
    paper: og.paper ?? "#f4efe6",
    font: og.font ?? "Bricolage Grotesque",
    domain: og.domain ?? studio.site.domain,
  };
}

/** The renderer URL for a concept (site-relative; prefix the origin for Facebook). */
export function designedImagePath(p: DesignedPost, opts: { size?: DesignedSize; img?: string | null } = {}): string {
  const q = new URLSearchParams({
    theme: p.theme,
    tone: p.tone,
    size: opts.size ?? "square",
    eyebrow: p.eyebrow || "",
    statement: p.statement || "",
    sub: p.sub || "",
    statLabel: p.statLabel || "",
    items: (p.items || []).join("|"),
  });
  if (opts.img) q.set("img", opts.img);
  return `/api/creator/og/post?${q.toString()}`;
}
