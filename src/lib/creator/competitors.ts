import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

/*
  Strategy → Competitors: who Google shows for the gift, book and
  photography searches, and why. SERVER ONLY (reads the rank-check files).

  Rank checks live in src/data/rank-checks/<date>.json, run by hand in Dia
  (one search every 7 to 11 seconds, stop at any CAPTCHA). The "why" notes
  below come from what each result's page title and site show, checked on
  2026-11-09. Photography and the book only; Fluid Pathways has its own.
*/

export interface RankRow { position: number; domain: string; title: string }
export interface RankResult { query: string; organic: RankRow[]; robertCastellino: number | null }
export interface RankRun { date: string; note?: string; results: RankResult[] }

export async function latestRankRun(): Promise<RankRun | null> {
  const dir = join(process.cwd(), "src", "data", "rank-checks");
  try {
    const files = (await readdir(dir)).filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f)).sort();
    if (!files.length) return null;
    return JSON.parse(await readFile(join(dir, files[files.length - 1]), "utf8")) as RankRun;
  } catch {
    return null;
  }
}

export type WinnerType = "Marketplace" | "Book list" | "Photographer" | "Publisher" | "Gift shop" | "Gift guide" | "Park shop" | "Print shop" | "Directory";

export interface WinnerNote {
  name: string;
  type: WinnerType;
  /** Why Google places them, from what the result and site show */
  why: string[];
  /** What it means for Bob */
  lesson: string;
}

export const WHY: Record<string, WinnerNote> = {
  "amazon.com": {
    name: "Amazon",
    type: "Marketplace",
    why: [
      "The competing Colorado photo books are all listed there.",
      "Amazon builds pages titled with the exact search, like “Colorado Books Coffee Table” and “Mountain Lover Gifts”.",
    ],
    lesson: "Life & Light did not show up on Amazon in any of these searches. A listing puts the book where gift shoppers start.",
  },
  "mattpaynephotography.com": {
    name: "Matt Payne",
    type: "Photographer",
    why: [
      "The closest match to Bob: a Colorado landscape photographer with his own book, “The Colorado Way”, on its own page.",
      "Separate pages for the book, for prints (“Colorado Photography and Wall Art”) and for himself (“About Nature Photographer Matt Payne”), each titled with the words people search.",
      "Shows up in more of these searches than any other photographer.",
    ],
    lesson: "This is the model: one page per thing people search for, each with Colorado in the title.",
  },
  "etsy.com": {
    name: "Etsy",
    type: "Marketplace",
    why: ["Etsy makes a page for almost any phrase (“Coffee Table Books Colorado”, “Colorado Photo Book”) filled with small sellers’ listings."],
    lesson: "A signed-copy listing on Etsy would appear on pages Google already ranks.",
  },
  "goodreads.com": {
    name: "Goodreads",
    type: "Book list",
    why: ["Its list “Popular Colorado Photography Books” ranks for three of the book searches. Goodreads builds it from how readers shelve books."],
    lesson: "Add Life & Light to Goodreads, and ask readers to shelve it as Colorado photography.",
  },
  "collierpublishing.com": {
    name: "Grant Collier (Collier Publishing)",
    type: "Publisher",
    why: [
      "A Colorado photographer who publishes his own books, with one page per book.",
      "His page titles say the plain words: “coffee table book”, “photography book”.",
    ],
    lesson: "Name the book page the way people search: “Colorado coffee table book”, not only the title.",
  },
  "rockymountainnationalpark.com": {
    name: "Wild Light (park shop)",
    type: "Park shop",
    why: ["“Wild Light”, a Rocky Mountain National Park photo book, is sold by park-related sites, so they rank for the coffee table searches."],
    lesson: "Ask park, conservancy and visitor-center shops to stock the book.",
  },
  "rmconservancy.org": {
    name: "Rocky Mountain Conservancy",
    type: "Park shop",
    why: ["Sells “Wild Light 2nd Edition”, the book that holds the Rocky Mountains coffee table search."],
    lesson: "Ask park, conservancy and visitor-center shops to stock the book.",
  },
  "giftsfromcolorado.com": {
    name: "Gifts From Colorado",
    type: "Gift shop",
    why: ["The site name is the search itself. Every page says “Colorado gifts”."],
    lesson: "Gift shops like this are stockists to approach, not sites to outrank.",
  },
  "coloradocraftedbox.com": {
    name: "Colorado Crafted",
    type: "Gift shop",
    why: ["A gift-box company whose title is “Modern Colorado Gifts & Gift Baskets”. They curate Colorado-made products."],
    lesson: "Pitch the signed book for their holiday boxes.",
  },
  "everythingcoloradoco.com": {
    name: "Everything Colorado",
    type: "Gift shop",
    why: ["Souvenir shop whose home page title is “Colorado Souvenirs, Gifts & Clothing”."],
    lesson: "A possible stockist.",
  },
  "giftory.com": {
    name: "Giftory",
    type: "Gift shop",
    why: ["An experience-gift site with a seasonal page titled “Colorado Christmas Gifts: Rocky Mountain Joy”."],
    lesson: "A holiday page on robertcastellino.com titled for Christmas gifts would compete for the same search.",
  },
  "5280.com": {
    name: "5280 Magazine",
    type: "Gift guide",
    why: ["Denver’s magazine publishes yearly lists like “The 10 Best Colorado Gifts”. A big local site, so its lists rank."],
    lesson: "Send the book to 5280, Colorado Homes and the Denver Post for their holiday gift guides.",
  },
  "denverpost.com": {
    name: "Denver Post",
    type: "Gift guide",
    why: ["“The ultimate Colorado gift guide”: a news site’s list ranks on authority alone."],
    lesson: "Pitch the gift guide editors.",
  },
  "coloradohomesmag.com": {
    name: "Colorado Homes & Lifestyles",
    type: "Gift guide",
    why: ["“A Made in Colorado Gift Guide”. A coffee table book fits a home magazine exactly."],
    lesson: "Pitch the gift guide editors.",
  },
  "danielforsterphotography.com": {
    name: "Daniel Forster",
    type: "Print shop",
    why: ["A photographer whose page titles say “Fine Art Prints For Sale” and “Colorado Landscape Photography”."],
    lesson: "A prints page titled “Colorado landscape photography prints” would compete here.",
  },
  "tamarasusa.com": {
    name: "Tamara Šuša",
    type: "Print shop",
    why: ["Titles “Colorado Landscape Photographer” and “Colorado Fine Art Landscape Prints”: the exact searches."],
    lesson: "Same lesson: say “Colorado landscape photographer” in the page title.",
  },
  "100summits.com": {
    name: "100 Summits",
    type: "Directory",
    why: ["The #1 result for “Colorado landscape photographer” is a list: “Colorado’s 20 Best Landscape Photographers”."],
    lesson: "Ask to be added to that list. One link from it is worth more than a new page.",
  },
  "robertcastellino.artstorefronts.com": {
    name: "Bob’s own print store",
    type: "Print shop",
    why: ["Bob’s Art Storefronts site outranks robertcastellino.com for the book’s own title."],
    lesson: "Link the print store and robertcastellino.com/book to each other, so Google sees them as one.",
  },
};

export interface Winner {
  domain: string;
  count: number;
  best: number;
  hits: { query: string; position: number }[];
  note: WinnerNote | null;
}

/** Sites that show up on page one most often across the run, with their positions. */
export function winners(run: RankRun, skip: (d: string) => boolean, limit = 10): Winner[] {
  const map = new Map<string, Winner>();
  for (const r of run.results) {
    const seen = new Set<string>();
    for (const o of r.organic) {
      if (skip(o.domain) || seen.has(o.domain)) continue;
      seen.add(o.domain);
      const w = map.get(o.domain) ?? { domain: o.domain, count: 0, best: 99, hits: [], note: WHY[o.domain] ?? null };
      w.count += 1;
      w.best = Math.min(w.best, o.position);
      w.hits.push({ query: r.query, position: o.position });
      map.set(o.domain, w);
    }
  }
  return [...map.values()]
    .filter((w) => w.note || w.count > 1)
    .sort((a, b) => b.count - a.count || a.best - b.best)
    .slice(0, limit);
}

export const COMPETE_TODO: string[] = [
  "Done 11/09: robertcastellino.com/book has its own title (“Colorado: Life & Light on the Land — A Signed Colorado Coffee Table Book”), description and canonical. Next, once Search Console is set up for robertcastellino.com, ask Google to re-crawl /book.",
  "List the book on Amazon, Goodreads and Etsy (signed copies). These three hold most of the book searches.",
  "Once it is on Goodreads, ask early readers to shelve it as “Colorado” and “photography”, which is how the “Popular Colorado Photography Books” page is built.",
  "Send a copy to the holiday gift guides at 5280, the Denver Post and Colorado Homes & Lifestyles before December.",
  "Ask Colorado Crafted, Gifts From Colorado and park or conservancy shops to stock the book.",
  "Ask 100 Summits to add Bob to “Colorado’s 20 Best Landscape Photographers”.",
  "Make a prints page titled “Colorado landscape photography prints” that links to the Art Storefronts shop, and link the shop back to robertcastellino.com.",
];
