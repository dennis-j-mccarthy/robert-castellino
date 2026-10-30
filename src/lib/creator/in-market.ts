import { graphGet } from "@/lib/meta/graph";
import {
  accountAdInsights,
  adAccountId,
  adsManagerUrl,
  isAdsConfigured,
  listAdSets,
  listAds,
  type AdInsights,
  type LiveAd,
} from "@/lib/meta/ads";

/*
  "In market" — the live ads in Bob's book campaign. SERVER ONLY.

  Pulled through the Marketing API with META_ADS_TOKEN and cached in memory
  for a few minutes so the page doesn't hammer Meta. Status changes go through
  /api/creator/ads/status, which calls invalidateInMarket() so the next read
  is fresh.
*/

export const BOOK_CAMPAIGN_ID = process.env.META_BOOK_CAMPAIGN_ID || "120251354161250171";
const TTL_MS = 5 * 60 * 1000;

/** Plain-language state of one ad, derived from Meta's effective_status + its own switch. */
export type AdState = "running" | "armed" | "off" | "review" | "problem";

export interface InMarketAd {
  id: string;
  name: string;
  adsetId: string;
  adsetName: string;
  /** The ad's own switch: ACTIVE or PAUSED. */
  status: string;
  /** What Meta is actually doing with it. */
  effectiveStatus: string;
  state: AdState;
  /** One short sentence a non-marketer understands. */
  why: string;
  headline: string;
  message: string;
  description: string | null;
  link: string | null;
  thumbnailUrl: string | null;
  creativeId: string | null;
  adsManagerUrl: string;
  /** Last 7 days. Null when Meta returned nothing (no delivery yet). */
  insights: AdInsights | null;
}

export interface InMarketAdSet {
  id: string;
  name: string;
  status: string; // effective_status
  adCount: number;
  runningCount: number;
}

export interface InMarket {
  configured: boolean;
  campaign: {
    id: string;
    name: string;
    status: string;
    objective: string;
    dailyBudget: number | null; // dollars, campaign-level (shared across ad sets)
  } | null;
  adsets: InMarketAdSet[];
  ads: InMarketAd[];
  counts: { running: number; armed: number; off: number; review: number; problem: number; total: number };
  account: string;
  fetchedAt: string | null;
  error: string | null;
}

let cache: { at: number; data: InMarket } | null = null;

export function invalidateInMarket() {
  cache = null;
}

export function classify(a: Pick<LiveAd, "status" | "effectiveStatus">): { state: AdState; why: string } {
  const e = a.effectiveStatus;
  if (e === "ACTIVE") return { state: "running", why: "Live. Meta is showing it and it is spending." };
  if (a.status === "PAUSED" || e === "PAUSED") return { state: "off", why: "Switched off. It will not run until you turn it on." };
  if (e === "CAMPAIGN_PAUSED") return { state: "armed", why: "Switched on, but the campaign is off. It starts the moment the campaign is turned on." };
  if (e === "ADSET_PAUSED") return { state: "armed", why: "Switched on, but its audience is off. It starts when that audience is turned on." };
  if (e === "PENDING_REVIEW" || e === "IN_PROCESS" || e === "PREAPPROVED") return { state: "review", why: "Meta is reviewing it. Usually under 24 hours." };
  if (e === "DISAPPROVED") return { state: "problem", why: "Meta rejected it. Open it in Meta to see why." };
  if (e === "PENDING_BILLING_INFO") return { state: "problem", why: "Meta needs billing details on the ad account." };
  if (e === "WITH_ISSUES") return { state: "problem", why: "Meta flagged an issue. Open it in Meta to see what." };
  return { state: "problem", why: `Meta reports “${e.replace(/_/g, " ").toLowerCase()}”.` };
}

function mapAd(a: LiveAd, insights: Record<string, AdInsights>): InMarketAd {
  const { state, why } = classify(a);
  const i = insights[a.id];
  return {
    id: a.id,
    name: a.name,
    adsetId: a.adsetId,
    adsetName: a.adsetName,
    status: a.status,
    effectiveStatus: a.effectiveStatus,
    state,
    why,
    headline: a.creative?.headline ?? "",
    message: a.creative?.message ?? "",
    description: a.creative?.description ?? null,
    link: a.creative?.link ?? null,
    thumbnailUrl: a.creative?.thumbnailUrl ?? null,
    creativeId: a.creativeId,
    adsManagerUrl: adsManagerUrl(a.id),
    insights: i && (i.impressions > 0 || i.spend > 0) ? i : null,
  };
}

export async function getInMarket(opts: { refresh?: boolean } = {}): Promise<InMarket> {
  if (!opts.refresh && cache && Date.now() - cache.at < TTL_MS) return cache.data;
  const base: InMarket = {
    configured: isAdsConfigured(),
    campaign: null,
    adsets: [],
    ads: [],
    counts: { running: 0, armed: 0, off: 0, review: 0, problem: 0, total: 0 },
    account: adAccountId(),
    fetchedAt: null,
    error: null,
  };
  if (!base.configured) return { ...base, error: "META_ADS_TOKEN is not set — the live table needs it." };
  try {
    const token = process.env.META_ADS_TOKEN as string;
    const [camp, ads, adsets, insights] = await Promise.all([
      graphGet(BOOK_CAMPAIGN_ID, { fields: "id,name,effective_status,objective,daily_budget", access_token: token }),
      listAds(BOOK_CAMPAIGN_ID, true),
      listAdSets(BOOK_CAMPAIGN_ID),
      accountAdInsights().catch(() => ({}) as Record<string, AdInsights>),
    ]);
    const mapped = ads
      .map((a) => mapAd(a, insights))
      .sort((a, b) => a.adsetName.localeCompare(b.adsetName) || a.name.localeCompare(b.name));
    const counts = { running: 0, armed: 0, off: 0, review: 0, problem: 0, total: mapped.length };
    for (const a of mapped) counts[a.state] += 1;
    const data: InMarket = {
      ...base,
      campaign: {
        id: String(camp.id),
        name: String(camp.name ?? ""),
        status: String(camp.effective_status ?? ""),
        objective: String(camp.objective ?? ""),
        dailyBudget: camp.daily_budget ? Number(camp.daily_budget) / 100 : null,
      },
      adsets: adsets
        .map((s) => ({
          id: s.id,
          name: s.name,
          status: s.effectiveStatus,
          adCount: mapped.filter((a) => a.adsetId === s.id).length,
          runningCount: mapped.filter((a) => a.adsetId === s.id && a.state === "running").length,
        }))
        .sort((a, b) => a.name.localeCompare(b.name)),
      ads: mapped,
      counts,
      fetchedAt: new Date().toISOString(),
    };
    cache = { at: Date.now(), data };
    return data;
  } catch (e) {
    const error = e instanceof Error ? e.message : "Couldn't read the campaign from Meta.";
    if (cache) return { ...cache.data, error };
    return { ...base, error };
  }
}
