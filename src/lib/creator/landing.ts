import { generateJson } from "@/lib/creator/ai";
import { brandSystemPrompt, loadBrandContext } from "@/lib/creator/brand-context";
import type { LibraryItem } from "@/lib/creator/library";
import { studio } from "@/studio.config";

/*
  Landing pages (Search → Landing pages). SERVER ONLY.
  One page per search phrase, at /for/<slug>. Claude writes the draft from
  Essence and the pillars, in the owner's voice. The hero is one of the site's real
  pictures, chosen from the library by the model; nothing is generated. The
  offer on every page is the signed book, with prints as the quiet second.
  Drafts are unpublished and noindex until someone presses Publish.
*/

export interface LandingSections {
  /** Short line above the headline, e.g. "Colorado gift · signed, from the studio" */
  eyebrow: string;
  /** One or two sentences: why this offer, why this maker, why now */
  valueProp: string;
  /** Three things the reader gets (facts, never hype) */
  benefits: { title: string; text: string }[];
  /** Three steps from here to having it */
  steps: { title: string; text: string }[];
  ctaHeadline: string;
  ctaButton: string;
}

export interface LandingDraft {
  slug: string;
  title: string;
  metaDescription: string;
  h1: string;
  intro: string;
  body: string;
  faq: { q: string; a: string }[];
  heroSrc: string | null;
  heroAlt: string;
  sections: LandingSections;
}

export function landingSlug(keyword: string): string {
  return (
    keyword
      .toLowerCase()
      .replace(/\b(near me|online|buy|best)\b/g, " ")
      .normalize("NFKD")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 60) || "page"
  );
}

const STOP = new Set(["and", "the", "for", "a", "an", "of", "to", "in", "with", "co", "near", "me", "best", "buy"]);

/** True when the headline carries the searcher's own words. */
export function headlineMatches(h1: string, keyword: string): boolean {
  const words = keyword.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 2 && !STOP.has(w));
  const h = h1.toLowerCase();
  const hits = words.filter((w) => h.includes(w)).length;
  return words.length === 0 || hits / words.length >= 0.6;
}

function titleCase(s: string): string {
  return s.replace(/\b([a-z])([a-z]*)/g, (_, a: string, b: string) => (["and", "or", "for", "of", "the", "a"].includes(a + b) ? a + b : a.toUpperCase() + b));
}

const FACTS = `THE OFFER ON EVERY PAGE: "${studio.offer.title}" — ${studio.offer.facts}. ${studio.offer.description}${studio.offer.secondary ? ` ${studio.offer.secondary.note} It is the second thing, mentioned once, never the headline.` : ""} The button goes to ${studio.site.url}${studio.offer.path}.`;

export async function writeLanding(keyword: string, plates: LibraryItem[]): Promise<LandingDraft> {
  const ctx = await loadBrandContext();
  const list = plates
    .slice(0, 40)
    .map((p) => `${p.src} — ${p.title ?? p.label}${p.loc ? `, ${p.loc}` : ""}${p.bookPage ? ` (book p.${p.bookPage})` : ""}`)
    .join("\n");
  const out = await generateJson<Record<string, unknown>>({
    system: brandSystemPrompt(ctx, {
      role: `You write landing pages for ${studio.site.ownerFull}'s website, each for one phrase people search on Google.`,
      includePillars: true,
      extra: `${FACTS}\n\nRULES: The headline must use the searcher's own words so they know at a glance they are in the right place. Write in ${studio.site.owner}'s voice, first person where ${studio.site.pronouns[0]} speaks. Every claim about the offer must come from the facts above. Never invent reviews, press, awards or buyers. No exclamation marks. The hero must be one of the pictures listed; pick the one that fits the search best and return its exact src.`,
    }),
    user: `Write a complete landing page for people who search: "${keyword}".

PICTURES YOU MAY USE AS THE HERO (src — title, place):
${list}

Return JSON: title (page title under 60 characters, includes the phrase and the place), metaDescription (under 155 characters), eyebrow (3 to 6 words), h1 (headline using the searcher's words, under 70 characters), valueProp (1 to 2 sentences: what this offer is for this person and why it is different), intro (2 to 3 sentences that meet them where they are), benefits (exactly 3: {title 3–6 words, text 1–2 sentences, facts about the offer}), steps (exactly 3: how it goes from here to having it, {title, text}), body (markdown, 350 to 550 words, 2 or 3 ## subheads: what is inside or what happens, who it is for, what makes this one different), faq (4 to 6 {q, a} written so an AI search tool could quote the answer), ctaHeadline (under 60 characters), ctaButton (2 to 4 words), heroSrc (exact src from the list), heroAlt (one plain sentence describing that picture).`,
    schema: {
      type: "object",
      additionalProperties: false,
      required: ["title", "metaDescription", "eyebrow", "h1", "valueProp", "intro", "benefits", "steps", "body", "faq", "ctaHeadline", "ctaButton", "heroSrc", "heroAlt"],
      properties: {
        title: { type: "string" }, metaDescription: { type: "string" }, eyebrow: { type: "string" }, h1: { type: "string" }, valueProp: { type: "string" }, intro: { type: "string" },
        benefits: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "text"], properties: { title: { type: "string" }, text: { type: "string" } } } },
        steps: { type: "array", items: { type: "object", additionalProperties: false, required: ["title", "text"], properties: { title: { type: "string" }, text: { type: "string" } } } },
        body: { type: "string" },
        faq: { type: "array", items: { type: "object", additionalProperties: false, required: ["q", "a"], properties: { q: { type: "string" }, a: { type: "string" } } } },
        ctaHeadline: { type: "string" }, ctaButton: { type: "string" }, heroSrc: { type: "string" }, heroAlt: { type: "string" },
      },
    },
    maxTokens: 6000,
  });

  const str = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);
  const pairs = (v: unknown) =>
    (Array.isArray(v) ? v : [])
      .filter((x): x is { title: string; text: string } => !!x && typeof x === "object" && "title" in x && "text" in x)
      .slice(0, 3)
      .map((x) => ({ title: str(x.title, 80), text: str(x.text, 300) }));
  let h1 = str(out.h1, 140);
  if (!h1 || !headlineMatches(h1, keyword)) h1 = titleCase(keyword);
  const faq = (Array.isArray(out.faq) ? out.faq : []).filter((f): f is { q: string; a: string } => !!f && typeof f === "object" && "q" in f && "a" in f && !!f.q && !!f.a).slice(0, 8).map((f) => ({ q: str(f.q, 200), a: str(f.a, 900) }));
  const heroSrc = plates.find((p) => p.src === out.heroSrc)?.src ?? plates[0]?.src ?? null;
  if (!out.title || !out.body) throw new Error("The page came back incomplete. Try again.");
  return {
    slug: landingSlug(keyword),
    title: str(out.title, 90),
    metaDescription: str(out.metaDescription, 170),
    h1,
    intro: str(out.intro, 600),
    body: String(out.body),
    faq,
    heroSrc,
    heroAlt: str(out.heroAlt, 300) || (plates.find((p) => p.src === heroSrc)?.title ?? ""),
    sections: {
      eyebrow: str(out.eyebrow, 80) || studio.site.location,
      valueProp: str(out.valueProp, 400),
      benefits: pairs(out.benefits),
      steps: pairs(out.steps),
      ctaHeadline: str(out.ctaHeadline, 90) || studio.offer.ctaLabel,
      ctaButton: str(out.ctaButton, 40) || studio.offer.ctaLabel,
    },
  };
}

/* ───────── tiny markdown → HTML for the body (## , paragraphs, lists, bold/italic, links) ───────── */

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
function inline(s: string): string {
  return esc(s)
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/(^|[^*])\*(?!\s)(.+?)\*(?!\*)/g, "$1<em>$2</em>")
    .replace(/\[([^\]]+)\]\((https?:\/\/[^)\s]+|\/[^)\s]*)\)/g, '<a href="$2">$1</a>');
}
export function markdownToHtml(md: string): string {
  const out: string[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { out.push(`<ul>${list.map((l) => `<li>${inline(l)}</li>`).join("")}</ul>`); list = []; } };
  for (const raw of md.replace(/\r/g, "").split(/\n{2,}/)) {
    const block = raw.trim();
    if (!block) continue;
    const lines = block.split("\n").map((l) => l.trim()).filter(Boolean);
    if (lines.every((l) => /^[-*•]\s+/.test(l))) { list = lines.map((l) => l.replace(/^[-*•]\s+/, "")); flush(); continue; }
    flush();
    const h = /^(#{2,3})\s+(.*)$/.exec(block);
    if (h) { out.push(`<h${h[1].length}>${inline(h[2])}</h${h[1].length}>`); continue; }
    out.push(`<p>${lines.map(inline).join("<br>")}</p>`);
  }
  flush();
  return out.join("\n");
}
