import { studio } from "@/studio.config";

/*
  Google Ads plan (Search → Google Ads) — the TYPES, limits and the cleaner.
  Client-safe (no database). The storage, export and checks live in
  ads-plan.ts, which imports from here.
  One document per site, stored in CreatorPlan id "google-ads": the
  campaigns, their ad groups (keywords, negatives, the responsive search
  ad, the landing page) and the budget. Claude drafts it from the target
  keywords, Essence and the landing pages; the owner edits; the export is
  a Google Ads Editor sheet, uploaded in Google Ads → Tools → Bulk actions.
*/

export type MatchType = "exact" | "phrase" | "broad";
export interface AdKeyword { text: string; match: MatchType }
export interface Rsa { headlines: string[]; descriptions: string[]; path1: string; path2: string }
export interface AdGroup {
  id: string;
  name: string;
  /** One line: who is searching and what they want */
  intent: string;
  keywords: AdKeyword[];
  negatives: string[];
  /** LandingPage.slug on this site, or null when the group still needs a page */
  landingSlug: string | null;
  /** The search phrase the landing page should be written for (when landingSlug is null) */
  landingKeyword: string;
  rsa: Rsa;
  enabled: boolean;
}
export interface AdCampaign {
  id: string;
  name: string;
  /** Daily budget, USD */
  dailyBudget: number;
  /** Country / region words for the UI; targeting is set in Google Ads */
  locations: string;
  negatives: string[];
  adGroups: AdGroup[];
}
export interface AdsPlan {
  campaigns: AdCampaign[];
  notes: string;
  generatedAt: string | null;
  updatedAt: string | null;
}

export const RSA_LIMITS = { headline: 30, description: 90, headlines: 15, descriptions: 4, path: 15 } as const;

export const emptyPlan = (): AdsPlan => ({ campaigns: [], notes: "", generatedAt: null, updatedAt: null });

const str = (v: unknown, max: number) => String(v ?? "").replace(/\s+/g, " ").trim().slice(0, max);
const slugish = (v: unknown) => str(v, 60).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

export function cleanPlan(input: unknown): AdsPlan {
  const p = (input ?? {}) as Partial<AdsPlan>;
  const campaigns = (Array.isArray(p.campaigns) ? p.campaigns : []).slice(0, 6).map((c, ci) => {
    const cc = (c ?? {}) as Partial<AdCampaign>;
    return {
      id: slugish(cc.id) || `campaign-${ci + 1}`,
      name: str(cc.name, 80) || `Campaign ${ci + 1}`,
      dailyBudget: Math.max(1, Math.min(10000, Math.round(Number(cc.dailyBudget) || 10))),
      locations: str(cc.locations, 160),
      negatives: (Array.isArray(cc.negatives) ? cc.negatives : []).map((n) => str(n, 60)).filter(Boolean).slice(0, 60),
      adGroups: (Array.isArray(cc.adGroups) ? cc.adGroups : []).slice(0, 20).map((g, gi) => {
        const gg = (g ?? {}) as Partial<AdGroup>;
        const rsa = (gg.rsa ?? {}) as Partial<Rsa>;
        return {
          id: slugish(gg.id) || `group-${ci + 1}-${gi + 1}`,
          name: str(gg.name, 80) || `Ad group ${gi + 1}`,
          intent: str(gg.intent, 200),
          keywords: (Array.isArray(gg.keywords) ? gg.keywords : []).map((k) => {
            const kk = (k ?? {}) as Partial<AdKeyword>;
            const match: MatchType = kk.match === "exact" || kk.match === "broad" ? kk.match : "phrase";
            return { text: str(kk.text, 80).toLowerCase(), match };
          }).filter((k) => k.text).slice(0, 30),
          negatives: (Array.isArray(gg.negatives) ? gg.negatives : []).map((n) => str(n, 60)).filter(Boolean).slice(0, 30),
          landingSlug: gg.landingSlug ? slugish(gg.landingSlug) : null,
          landingKeyword: str(gg.landingKeyword, 80),
          rsa: {
            headlines: (Array.isArray(rsa.headlines) ? rsa.headlines : []).map((h) => str(h, RSA_LIMITS.headline)).filter(Boolean).slice(0, RSA_LIMITS.headlines),
            descriptions: (Array.isArray(rsa.descriptions) ? rsa.descriptions : []).map((d) => str(d, RSA_LIMITS.description)).filter(Boolean).slice(0, RSA_LIMITS.descriptions),
            path1: slugish(rsa.path1).slice(0, RSA_LIMITS.path),
            path2: slugish(rsa.path2).slice(0, RSA_LIMITS.path),
          },
          enabled: gg.enabled !== false,
        };
      }),
    };
  });
  return { campaigns, notes: str(p.notes, 2000), generatedAt: p.generatedAt ? String(p.generatedAt) : null, updatedAt: p.updatedAt ? String(p.updatedAt) : null };
}

/** Problems that would make Google reject or quietly weaken the plan. */
export function planIssues(plan: AdsPlan, landingSlugs: Set<string>): string[] {
  const out: string[] = [];
  for (const c of plan.campaigns) {
    if (!c.adGroups.length) out.push(`${c.name}: no ad groups.`);
    for (const g of c.adGroups) {
      const where = `${c.name} › ${g.name}`;
      if (g.keywords.length < 3) out.push(`${where}: fewer than 3 keywords.`);
      if (g.rsa.headlines.length < 8) out.push(`${where}: ${g.rsa.headlines.length} headlines (Google wants at least 8, up to 15).`);
      if (g.rsa.descriptions.length < 2) out.push(`${where}: ${g.rsa.descriptions.length} descriptions (at least 2, up to 4).`);
      if (g.rsa.headlines.some((h) => h.length > RSA_LIMITS.headline)) out.push(`${where}: a headline is over 30 characters.`);
      if (g.rsa.descriptions.some((d) => d.length > RSA_LIMITS.description)) out.push(`${where}: a description is over 90 characters.`);
      if (!g.landingSlug) out.push(`${where}: no landing page yet (ads will send people to ${studio.offer.path}).`);
      else if (!landingSlugs.has(g.landingSlug)) out.push(`${where}: landing page "${g.landingSlug}" is not published.`);
    }
  }
  return out;
}
