import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import { studio } from "@/studio.config";
import { RSA_LIMITS, cleanPlan, emptyPlan, type AdGroup, type AdsPlan } from "./ads-plan-types";

/*
  Google Ads plan (Search → Google Ads). SERVER ONLY: storage in CreatorPlan
  id "google-ads", the Google Ads Editor sheet, and the pre-upload checks.
  Types and the cleaner are in ads-plan-types.ts so client code can import
  them without pulling the database driver into the browser bundle.
*/
export * from "./ads-plan-types";

const PLAN_ID = "google-ads";

export async function loadAdsPlan(): Promise<AdsPlan> {
  if (!isDatabaseConfigured()) return emptyPlan();
  const row = await prisma.creatorPlan.findUnique({ where: { id: PLAN_ID } }).catch(() => null);
  return row ? cleanPlan(row.settings) : emptyPlan();
}

export async function saveAdsPlan(plan: AdsPlan): Promise<AdsPlan> {
  const clean = { ...cleanPlan(plan), updatedAt: new Date().toISOString() };
  await prisma.creatorPlan.upsert({ where: { id: PLAN_ID }, create: { id: PLAN_ID, settings: clean as object }, update: { settings: clean as object } });
  return clean;
}

/** Final URL for an ad group: its landing page, else the offer page. */
export function finalUrl(g: AdGroup): string {
  return g.landingSlug ? `${studio.site.url}/for/${g.landingSlug}` : `${studio.site.url}${studio.offer.path}`;
}

/* ───────── Google Ads Editor sheet ───────── */

const csvCell = (v: string | number) => { const s = String(v ?? ""); return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s; };

/**
 * One CSV Google Ads Editor imports in a single pass (Account → Import →
 * Paste text / From file): campaign rows, ad group rows, keyword rows,
 * negative keyword rows and one responsive search ad per group.
 */
export function planToEditorCsv(plan: AdsPlan): string {
  const H = Array.from({ length: RSA_LIMITS.headlines }, (_, i) => `Headline ${i + 1}`);
  const D = Array.from({ length: RSA_LIMITS.descriptions }, (_, i) => `Description ${i + 1}`);
  const cols = ["Campaign", "Campaign Type", "Networks", "Budget", "Bid Strategy Type", "Campaign Status", "Ad Group", "Ad Group Status", "Keyword", "Criterion Type", "Final URL", "Path 1", "Path 2", ...H, ...D, "Ad type", "Status"];
  const rows: string[][] = [cols];
  const row = (o: Record<string, string | number>) => rows.push(cols.map((c) => csvCell(o[c] ?? "")));
  for (const c of plan.campaigns) {
    row({ Campaign: c.name, "Campaign Type": "Search", Networks: "Google search", Budget: c.dailyBudget.toFixed(2), "Bid Strategy Type": "Maximize conversions", "Campaign Status": "Paused" });
    for (const n of c.negatives) row({ Campaign: c.name, Keyword: n, "Criterion Type": "Negative Phrase" });
    for (const g of c.adGroups) {
      row({ Campaign: c.name, "Ad Group": g.name, "Ad Group Status": g.enabled ? "Enabled" : "Paused" });
      for (const k of g.keywords) row({ Campaign: c.name, "Ad Group": g.name, Keyword: k.text, "Criterion Type": k.match === "exact" ? "Exact" : k.match === "broad" ? "Broad" : "Phrase", "Final URL": finalUrl(g) });
      for (const n of g.negatives) row({ Campaign: c.name, "Ad Group": g.name, Keyword: n, "Criterion Type": "Negative Phrase" });
      const ad: Record<string, string | number> = { Campaign: c.name, "Ad Group": g.name, "Final URL": finalUrl(g), "Path 1": g.rsa.path1, "Path 2": g.rsa.path2, "Ad type": "Responsive search ad", Status: "Enabled" };
      g.rsa.headlines.forEach((h, i) => { ad[`Headline ${i + 1}`] = h; });
      g.rsa.descriptions.forEach((d, i) => { ad[`Description ${i + 1}`] = d; });
      row(ad);
    }
  }
  return rows.map((r) => r.join(",")).join("\r\n") + "\r\n";
}

