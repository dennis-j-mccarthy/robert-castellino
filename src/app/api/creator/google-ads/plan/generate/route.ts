import { NextResponse } from "next/server";
import { AI_NOT_CONFIGURED, aiErrorMessage, generateJson, hasAnthropicKey } from "@/lib/creator/ai";
import { RSA_LIMITS, cleanPlan, loadAdsPlan, saveAdsPlan, type AdsPlan } from "@/lib/creator/ads-plan";
import { brandSystemPrompt, loadBrandContext } from "@/lib/creator/brand-context";
import { creatorDbGuard, readJson } from "@/lib/creator/guard";
import { prisma } from "@/lib/prisma";
import { studio } from "@/studio.config";

/*
  POST /api/creator/google-ads/plan/generate { dailyBudget?, note? }
  Claude, briefed as a search-ads planner on top of Essence, turns the
  site's target keywords and existing landing pages into campaigns, ad
  groups, keywords with match types, negatives and one responsive search
  ad per group. Saved as the plan; the owner edits from there.
*/
export const runtime = "nodejs";
export const maxDuration = 120;

const SCHEMA = {
  type: "object", additionalProperties: false, required: ["campaigns", "notes"],
  properties: {
    notes: { type: "string" },
    campaigns: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "dailyBudget", "locations", "negatives", "adGroups"], properties: {
      name: { type: "string" }, dailyBudget: { type: "number" }, locations: { type: "string" }, negatives: { type: "array", items: { type: "string" } },
      adGroups: { type: "array", items: { type: "object", additionalProperties: false, required: ["name", "intent", "keywords", "negatives", "landingKeyword", "rsa"], properties: {
        name: { type: "string" }, intent: { type: "string" },
        keywords: { type: "array", items: { type: "object", additionalProperties: false, required: ["text", "match"], properties: { text: { type: "string" }, match: { type: "string", enum: ["exact", "phrase", "broad"] } } } },
        negatives: { type: "array", items: { type: "string" } },
        landingKeyword: { type: "string" },
        rsa: { type: "object", additionalProperties: false, required: ["headlines", "descriptions", "path1", "path2"], properties: { headlines: { type: "array", items: { type: "string" } }, descriptions: { type: "array", items: { type: "string" } }, path1: { type: "string" }, path2: { type: "string" } } },
      } } },
    } } },
  },
};

export async function POST(req: Request) {
  const blocked = await creatorDbGuard();
  if (blocked) return blocked;
  if (!hasAnthropicKey()) return NextResponse.json({ error: AI_NOT_CONFIGURED }, { status: 503 });
  const body = (await readJson<{ dailyBudget?: number; note?: string }>(req)) ?? {};
  const dailyBudget = Math.max(5, Math.min(1000, Number(body.dailyBudget) || 20));
  const note = String(body.note ?? "").trim().slice(0, 600);
  try {
    const [ctx, keywords, pages] = await Promise.all([
      loadBrandContext(),
      prisma.keyword.findMany({ where: { status: { not: "dropped" } }, orderBy: [{ status: "asc" }, { priority: "desc" }], take: 80 }),
      prisma.landingPage.findMany({ select: { slug: true, keyword: true, title: true, published: true } }),
    ]);
    const kw = keywords.map((k) => `- ${k.phrase} · ${k.kind} · priority ${k.priority}${k.status === "target" ? " · TARGET" : ""}`).join("\n");
    const lp = pages.map((p) => `- /for/${p.slug} — "${p.keyword}" — ${p.title}${p.published ? "" : " (draft)"}`).join("\n") || "(none yet)";
    const out = await generateJson<AdsPlan>({
      system: brandSystemPrompt(ctx, {
        role: `You plan Google Search campaigns for ${studio.site.name}.`,
        includePillars: true,
        extra: `OFFER: ${studio.offer.title}. ${studio.offer.facts} Button: "${studio.offer.ctaLabel}" → ${studio.offer.path}.
RULES: Tight ad groups (3–8 closely related keywords each, one intent per group). Prefer phrase and exact match; broad only for one discovery group at most. Put real negatives on (free, jobs, diy, wikipedia, and whatever the business does not sell). Every headline ≤ ${RSA_LIMITS.headline} characters, every description ≤ ${RSA_LIMITS.description}; ${RSA_LIMITS.headlines} headlines and ${RSA_LIMITS.descriptions} descriptions per ad, varied: some with the keyword, some with the proof, some with the offer, one or two with price or place when true. Never invent prices, numbers, awards or claims that are not in the brand facts. Plain words, no exclamation marks, no ALL CAPS, no "best" or "#1". Paths are two short lowercase words. landingKeyword is the search phrase the group's page should be written for; pick the closest existing landing page keyword when one fits. Budget: split the daily budget across campaigns in "dailyBudget".`,
      }),
      user: `Daily budget to plan for: $${dailyBudget}. ${note ? `Owner's note: ${note}\n` : ""}
KEYWORDS (the site's list; TARGET = already chosen):
${kw || "(none yet — propose from the offer)"}

EXISTING LANDING PAGES:
${lp}

Return one or two Search campaigns with ad groups as described, plus "notes": three or four sentences on how to run it for the first two weeks (what to watch, when to pause a group).`,
      schema: SCHEMA, maxTokens: 9000, effort: "medium",
    });
    // Attach landing pages by keyword match, then save.
    const bySlug = new Map(pages.map((p) => [p.slug, p]));
    const byKeyword = new Map(pages.map((p) => [p.keyword.toLowerCase(), p.slug]));
    const plan = cleanPlan({ ...out, generatedAt: new Date().toISOString() });
    for (const c of plan.campaigns) for (const g of c.adGroups) {
      const want = g.landingKeyword.toLowerCase();
      const slug = byKeyword.get(want) ?? [...byKeyword.entries()].find(([k]) => k.includes(want) || want.includes(k))?.[1] ?? null;
      g.landingSlug = slug && bySlug.has(slug) ? slug : null;
    }
    const prev = await loadAdsPlan();
    const saved = await saveAdsPlan({ ...plan, notes: plan.notes || prev.notes });
    return NextResponse.json({ plan: saved });
  } catch (e) {
    console.error("[google-ads/plan/generate]", e);
    return NextResponse.json({ error: aiErrorMessage(e) }, { status: 502 });
  }
}
