import { SITE } from "@/lib/creator/pillars";

/*
  Technical SEO, checked live against the public site each time Search is
  opened: the things Google needs before any keyword work can pay off.
  Pure fetch + regex; no headless browser. Each check is pass / warn / fail
  with a one-line "what to do".
*/

export type Grade = "pass" | "warn" | "fail";
export interface SeoCheck { id: string; label: string; grade: Grade; detail: string; fix?: string }
export interface SeoPageReport { path: string; title: string | null; checks: SeoCheck[] }
export interface SeoAudit { checkedAt: string; site: SeoCheck[]; pages: SeoPageReport[]; score: { pass: number; warn: number; fail: number } }

const PAGES = ["/", "/book", "/musings", "/gallery"];

async function get(path: string): Promise<{ status: number; body: string; ms: number; type: string }> {
  const t0 = Date.now();
  try {
    const r = await fetch(`${SITE.url}${path}`, { cache: "no-store", headers: { "user-agent": "CreatorStudioSEO/1 (+robertcastellino.com)" }, redirect: "follow" });
    const body = await r.text();
    return { status: r.status, body, ms: Date.now() - t0, type: r.headers.get("content-type") ?? "" };
  } catch {
    return { status: 0, body: "", ms: Date.now() - t0, type: "" };
  }
}

const pick = (re: RegExp, s: string) => (s.match(re) ?? [])[1]?.trim() ?? null;
const decode = (s: string) => s.replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "’").replace(/&quot;/g, '"').replace(/&mdash;/g, "—");

function pageChecks(path: string, body: string, status: number, ms: number): SeoPageReport {
  const c: SeoCheck[] = [];
  const title = decode(pick(/<title[^>]*>([^<]*)<\/title>/i, body) ?? "");
  if (status !== 200) {
    c.push({ id: "status", label: "Page loads", grade: "fail", detail: `HTTP ${status || "no response"}`, fix: "The page must answer 200 for Google to index it." });
    return { path, title: title || null, checks: c };
  }
  c.push({ id: "speed", label: "Answers quickly", grade: ms < 800 ? "pass" : ms < 2000 ? "warn" : "fail", detail: `${ms} ms to first byte from here`, fix: ms >= 800 ? "Slow pages lose ranking and readers. Check image sizes and caching." : undefined });
  c.push({ id: "title", label: "Title tag", grade: !title ? "fail" : title.length > 60 ? "warn" : title.length < 20 ? "warn" : "pass", detail: title ? `"${title}" · ${title.length} characters` : "missing", fix: !title ? "Add a title." : title.length > 60 ? "Google cuts titles after about 60 characters; put the key phrase first." : undefined });
  const desc = decode(pick(/<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i, body) ?? pick(/<meta[^>]+content=["']([^"']*)["'][^>]+name=["']description["']/i, body) ?? "");
  c.push({ id: "desc", label: "Meta description", grade: !desc ? "fail" : desc.length > 160 || desc.length < 70 ? "warn" : "pass", detail: desc ? `${desc.length} characters` : "missing", fix: !desc ? "Add a one-sentence description with the key phrase; it is the grey text under the blue link." : desc.length > 160 ? "Over 160 characters gets cut off." : desc.length < 70 ? "Short descriptions waste the space under the link." : undefined });
  const canon = pick(/<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i, body);
  c.push({ id: "canon", label: "Canonical link", grade: canon ? (canon.startsWith(SITE.url) ? "pass" : "warn") : "warn", detail: canon ?? "missing", fix: !canon ? "Tell Google which address is the real one so www / non-www and tracking links do not split your ranking." : !canon.startsWith(SITE.url) ? "Canonical points off-site." : undefined });
  const h1s = (body.match(/<h1[\s>]/gi) ?? []).length;
  c.push({ id: "h1", label: "One H1 heading", grade: h1s === 1 ? "pass" : h1s === 0 ? "fail" : "warn", detail: `${h1s} found`, fix: h1s !== 1 ? "Exactly one H1 per page, carrying the key phrase." : undefined });
  const imgs = body.match(/<img\b[^>]*>/gi) ?? [];
  const noAlt = imgs.filter((t) => !/\balt=/.test(t)).length;
  const emptyAlt = imgs.filter((t) => /\balt=["']\s*["']/.test(t)).length;
  c.push({ id: "alt", label: "Pictures described (alt text)", grade: imgs.length === 0 ? "pass" : noAlt ? "fail" : emptyAlt > imgs.length / 2 ? "warn" : "pass", detail: `${imgs.length} pictures · ${noAlt} without alt · ${emptyAlt} empty alt`, fix: noAlt || emptyAlt > imgs.length / 2 ? "Every plate should say what it is and where: \"Maroon Bells at first light, autumn\". Google Images is a real doorway for a photographer." : undefined });
  const og = pick(/<meta[^>]+property=["']og:image["'][^>]+content=["']([^"']*)["']/i, body);
  c.push({ id: "og", label: "Share picture (Open Graph)", grade: og ? "pass" : "warn", detail: og ? "set" : "missing", fix: !og ? "Without it, Facebook and iMessage show a blank card when the link is shared." : undefined });
  const ld = (body.match(/application\/ld\+json/gi) ?? []).length;
  c.push({ id: "ld", label: "Structured data (JSON-LD)", grade: ld ? "pass" : "warn", detail: ld ? `${ld} block${ld === 1 ? "" : "s"}` : "none", fix: !ld ? "Tell Google this is a Person / Book / Product so it can show rich results." : undefined });
  const viewport = /<meta[^>]+name=["']viewport["']/i.test(body);
  c.push({ id: "viewport", label: "Mobile viewport", grade: viewport ? "pass" : "fail", detail: viewport ? "set" : "missing", fix: !viewport ? "Google indexes the phone version first." : undefined });
  const noindex = /<meta[^>]+name=["']robots["'][^>]+noindex/i.test(body);
  c.push({ id: "noindex", label: "Not hidden from Google", grade: noindex ? "fail" : "pass", detail: noindex ? "noindex is set" : "indexable", fix: noindex ? "Remove noindex or this page can never rank." : undefined });
  return { path, title: title || null, checks: c };
}

export async function runSeoAudit(): Promise<SeoAudit> {
  const [robots, sitemap, ...pages] = await Promise.all([get("/robots.txt"), get("/sitemap.xml"), ...PAGES.map((p) => get(p))]);
  const site: SeoCheck[] = [];
  site.push({ id: "https", label: "HTTPS", grade: SITE.url.startsWith("https://") ? "pass" : "fail", detail: SITE.url });
  const robotsOk = robots.status === 200 && /user-agent/i.test(robots.body);
  const robotsBlocks = /disallow:\s*\/\s*$/im.test(robots.body);
  site.push({ id: "robots", label: "robots.txt", grade: !robotsOk ? "warn" : robotsBlocks ? "fail" : "pass", detail: robots.status === 200 ? (robotsBlocks ? "blocks the whole site" : `${robots.body.split("\n").filter(Boolean).length} lines`) : `HTTP ${robots.status}`, fix: !robotsOk ? "Add a robots.txt that allows everything and names the sitemap." : robotsBlocks ? "Disallow: / tells Google to stay out." : undefined });
  const sitemapOk = sitemap.status === 200 && /<urlset|<sitemapindex/i.test(sitemap.body);
  const urls = (sitemap.body.match(/<loc>/g) ?? []).length;
  site.push({ id: "sitemap", label: "sitemap.xml", grade: sitemapOk ? (urls >= 5 ? "pass" : "warn") : "fail", detail: sitemapOk ? `${urls} addresses listed` : `HTTP ${sitemap.status}`, fix: !sitemapOk ? "Publish a sitemap and submit it in Google Search Console." : urls < 5 ? "Very few pages are listed; Musings and gallery pages should all be in it." : undefined });
  const robotsNamesSitemap = /sitemap:/i.test(robots.body);
  site.push({ id: "robots-sitemap", label: "robots.txt names the sitemap", grade: robotsNamesSitemap ? "pass" : "warn", detail: robotsNamesSitemap ? "yes" : "no", fix: !robotsNamesSitemap ? "Add `Sitemap: https://robertcastellino.com/sitemap.xml` to robots.txt." : undefined });
  const musingsInMap = (sitemap.body.match(/\/musings\//g) ?? []).length;
  site.push({ id: "musings-map", label: "Musings in the sitemap", grade: musingsInMap >= 5 ? "pass" : musingsInMap ? "warn" : "fail", detail: `${musingsInMap} Musing addresses`, fix: musingsInMap < 5 ? "Each Musing is a page Google can rank for its own phrase; they belong in the sitemap." : undefined });

  const reports = PAGES.map((p, i) => pageChecks(p, pages[i].body, pages[i].status, pages[i].ms));
  const all = [...site, ...reports.flatMap((r) => r.checks)];
  const score = { pass: all.filter((c) => c.grade === "pass").length, warn: all.filter((c) => c.grade === "warn").length, fail: all.filter((c) => c.grade === "fail").length };
  return { checkedAt: new Date().toISOString(), site, pages: reports, score };
}

/** The standing to-do list: things a fetch cannot see but every small site needs. */
export const SEO_STANDING: Array<{ title: string; why: string; how: string }> = [
  { title: "Google Search Console, verified", why: "It is the only place Google tells you which searches you appear in, which pages it cannot read, and whether the sitemap was accepted.", how: "search.google.com/search-console → Add property → robertcastellino.com → verify by DNS record at the registrar. Then Sitemaps → submit sitemap.xml." },
  { title: "Google Business Profile, complete", why: "The map card and the knowledge panel for \"Robert Castellino\" come from here, not from the website.", how: "business.google.com → photographer category, studio hours by appointment, the book as a product, ten plates as photos, the website link." },
  { title: "One phrase per page", why: "Google ranks pages, not sites. The book page should own \"Colorado coffee table book\"; each Musing should own its place and hour.", how: "Pick the phrase from Keywords, put it in the title, the H1, the first sentence and one picture's alt text. Nowhere else." },
  { title: "Alt text on every plate", why: "Google Images sends real traffic to photographers, and it can only read the alt text.", how: "Brand kit → Pictures: the caption field becomes the alt text. Use the AI caption button for the blanks." },
  { title: "Page speed on a phone", why: "Google measures Core Web Vitals on mobile; big plates are the usual cause.", how: "pagespeed.web.dev → robertcastellino.com. Anything red is a picture to resize or lazy-load." },
  { title: "Links in from elsewhere", why: "Other sites linking here is still the strongest signal. The book gives you a reason to ask.", how: "Colorado tourism sites, the printer, the galleries that hang the work, local press about the book. One email each, with the book page link." },
];
