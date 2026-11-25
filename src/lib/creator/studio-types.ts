import type { ReactNode } from "react";
import type { SocialPlatform } from "@/lib/creator/social";
import type { BrandEssenceRecord, Pillar, VoiceSliders } from "@/lib/creator/pillars";
import type { BlogTone } from "@/lib/creator/blog-tone";

/*
  The studio's one seam between shared code and a site. Everything the
  shared creator studio needs to know about the business it is running for
  lives in the site's `src/studio.config.ts`, typed by this file. Shared code
  never names a person, a product, a domain or an id directly; it reads
  them from here. Server-only adapters (content, pictures, uploads,
  subscribers, auth) live in `src/studio.adapters.ts`, typed by
  `studio-adapters.ts`.
*/

export interface SiteFacts {
  /** "Robert Castellino Photography" */
  name: string;
  /** "Robert Castellino" — the person or the short brand */
  short: string;
  /** First name the studio speaks as: "Bob", "Beth" */
  owner: string;
  /** "Robert Castellino" — for roles like "You write <ownerFull>'s posts" */
  ownerFull: string;
  /** Third-person pronouns for the owner, e.g. ["he", "his"] or ["she", "her"] */
  pronouns: [string, string];
  url: string;
  domain: string;
  /** "Lafayette, Colorado" */
  location: string;
}

export interface OfferFacts {
  /** "Colorado: Life & Light on the Land" or "A 6-week healthy cooking course" */
  title: string;
  /** Short fixed facts the model may state and never change */
  facts: string;
  /** A paragraph the model may draw from; who it is for, what it costs, how it arrives */
  description: string;
  /** Where the primary button goes, site-relative */
  path: string;
  /** Button label: "Order the signed book", "Book a class" */
  ctaLabel: string;
  /** Promo code appended to the path from landing pages, if any */
  promoCode?: string | null;
  /** A quieter second offer, mentioned once: prints, a consult */
  secondary?: { label: string; path: string; note: string } | null;
  /** Noun for the people who buy: "buyers", "clients", "students" */
  buyerNoun: string;
}

export interface BrandFacts {
  /** The paragraph that never changes: who the owner is, what the work is, the rules of voice. Written by the site. */
  paragraph: string;
  /** Tagline fallback when Essence has no one-line */
  tagline: string;
  /** Site-relative or absolute logo for emails and the masthead; null = wordmark text */
  logo: string | null;
  /** Primary accent for emails */
  accent: string;
  /** The blog's public name and path: Musings at /musings, Blog at /blog, Journal at /journal */
  blog: { label: string; singular: string; path: string; writerRole: string; categories?: Array<{ id: string; label: string }>; /** Studio page that manages every post (site-specific) */ managePath?: string;
    /**
     * Pictures → the long form behind one picture: a recipe for a chef, the
     * story of a plate for a photographer. Claude writes it from the picture
     * and Essence; the owner edits and saves it as a draft post with the
     * picture on top. Leave out to hide the step.
     */
    fromPicture?: {
      /** "recipe", "story" — used in buttons and notices */
      noun: string;
      /** Section title in the picture popup, e.g. "The full recipe" */
      title: string;
      /** What Claude is asked for; shared code adds the picture, the voice and the JSON shape */
      brief: string;
      /** Blog category id for the saved post, if the site has categories */
      category?: string;
    };
  };
}

export interface MetaFacts {
  pageId?: string | null;
  adAccountId?: string | null;
  /** The campaign the Ads page centres on, if one */
  campaignId?: string | null;
  /** Substring that picks the right Page when the token sees several */
  preferredPageHint?: string | null;
}

export interface SeoFacts {
  /** Public paths the Technical SEO panel checks */
  auditPages: string[];
}

export type ToolId = "essence" | "library" | "audience" | "search" | "blog" | "email" | "social" | "ads" | "leads" | "plan";

export interface ExtraPanel {
  id: string;
  title: string;
  sub: string;
  /** Rendered inside the accordion; a server component is fine */
  body: ReactNode;
}

/** Site-written panels appended to a tool's accordions. Lives in `src/studio.panels.tsx` (server only). */
export type StudioPanels = Partial<Record<"search" | "ads", ExtraPanel[]>>;

export interface StudioConfig {
  site: SiteFacts;
  offer: OfferFacts;
  brand: BrandFacts;
  meta: MetaFacts;
  seo: SeoFacts;
  /** Platform briefs override; owner name is substituted by the shared code */
  platformBrief?: Partial<Record<SocialPlatform, string>>;
  /** Kinds a search phrase can be, first = default (gift / book / photography / question; problem / service / question…) */
  keywordKinds: Array<{ id: string; label: string }>;
  /** Seed search phrases offered on first run */
  seedKeywords: Array<{ phrase: string; kind: string; priority: number; note?: string }>;
  /** What Essence, pillars and tone start as before anyone edits them (and the no-database fallback) */
  defaults: { voice: VoiceSliders; essence: BrandEssenceRecord; pillars: Pillar[]; tone: BlogTone };
  nav: {
    /** Where an unauthenticated visit is sent (default /admin/login) */
    loginPath?: string;
    /** Tools this site does not show */
    hide?: ToolId[];
    /** Tools labelled "soon" */
    soon?: ToolId[];
    /** Form action that signs out (default /api/admin/logout) */
    logoutPath?: string;
    /** Extra items in the More menu */
    more?: Array<{ label: string; href: string; ext?: boolean }>;
  };
  /** Brand kit page: logos, colours, type (site assets) */
  brandKit?: {
    logos: Array<{ src: string; name: string; note: string; dark?: boolean }>;
    colours: Array<{ name: string; hex: string; note: string }>;
    type: Array<{ name: string; role: string; css: string; sample: string; size: number; weight: number }>;
    /** Extra "words" rows under Essence's line/promise/cta */
    words?: Array<{ k: string; v: string }>;
  };
  /** Text shown on the Leads placeholder: who the leads are for this business */
  leadsHint: string;
  /** The weekly plan's suggested email line */
  planEmailSuggestion: { title: string; note: string };
}
