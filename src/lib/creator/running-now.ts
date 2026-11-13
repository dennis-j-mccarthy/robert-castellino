import { graphGet } from "@/lib/meta/graph";
import { adAccountId, adsManagerUrl, isAdsConfigured, listAds, listCampaigns, type LiveAd } from "@/lib/meta/ads";

/*
  "Running now" — every ad in the account that is live or in review, across
  ALL campaigns, grouped by creative so each picture appears once, big, with
  the audiences it runs in and its last-7-day numbers. SERVER ONLY. Read-only.
  Cached for a few minutes like the in-market table.
*/

const TTL_MS = 5 * 60 * 1000;
const LIVE = new Set(["ACTIVE", "PENDING_REVIEW", "IN_PROCESS", "PREAPPROVED"]);

export interface RunningCreative {
  key: string;
  headline: string;
  message: string;
  description: string | null;
  link: string | null;
  /** Full-size ad image (Meta CDN), falls back to the creative thumbnail. */
  imageUrl: string | null;
  /** One entry per ad using this creative. */
  placements: { adId: string; campaignId: string; campaignLabel: string; adsetName: string; effectiveStatus: string; adsManagerUrl: string }[];
  running: number;
  review: number;
  /** Last 7 days, summed across the ads using this creative. */
  spend: number;
  impressions: number;
  linkClicks: number;
  purchases: number;
}

export interface RunningCampaign {
  id: string;
  name: string;
  label: string;
  status: string;
  objective: string;
  dailyBudget: number | null;
  spend7d: number;
  linkClicks7d: number;
  purchases7d: number;
}

export interface RunningNow {
  configured: boolean;
  campaigns: RunningCampaign[];
  creatives: RunningCreative[];
  adCount: number;
  fetchedAt: string | null;
  error: string | null;
}

let cache: { at: number; data: RunningNow } | null = null;
export function invalidateRunningNow() {
  cache = null;
}

type Json = Record<string, unknown>;
type Row = { spend: number; impressions: number; linkClicks: number; purchases: number };

function campaignLabel(name: string, objective: string): string {
  if (/sales/i.test(name) || objective === "OUTCOME_SALES") return "Sales";
  if (objective === "OUTCOME_TRAFFIC") return "Traffic";
  return objective.replace(/^OUTCOME_/, "").toLowerCase();
}

async function adInsights7d(token: string): Promise<Record<string, Row>> {
  const out: Record<string, Row> = {};
  const data = await graphGet(`act_${adAccountId()}/insights`, {
    level: "ad",
    date_preset: "last_7d",
    fields: "ad_id,spend,impressions,inline_link_clicks,actions",
    limit: "500",
    access_token: token,
  });
  for (const r of (data.data as Json[]) || []) {
    const actions = (r.actions as Json[] | undefined) || [];
    const purchase = actions.find((a) => a.action_type === "purchase" || a.action_type === "offsite_conversion.fb_pixel_purchase");
    out[String(r.ad_id)] = {
      spend: Number(r.spend || 0),
      impressions: Number(r.impressions || 0),
      linkClicks: Number(r.inline_link_clicks || 0),
      purchases: Number(purchase?.value || 0),
    };
  }
  return out;
}

async function imageUrls(hashes: string[], token: string): Promise<Record<string, string>> {
  const out: Record<string, string> = {};
  for (let i = 0; i < hashes.length; i += 50) {
    const chunk = hashes.slice(i, i + 50);
    try {
      const data = await graphGet(`act_${adAccountId()}/adimages`, { hashes: JSON.stringify(chunk), fields: "hash,url", access_token: token });
      for (const img of (data.data as Json[]) || []) if (img.hash && img.url) out[String(img.hash)] = String(img.url);
    } catch {
      // thumbnails will do
    }
  }
  return out;
}

export async function getRunningNow(opts: { refresh?: boolean } = {}): Promise<RunningNow> {
  if (!opts.refresh && cache && Date.now() - cache.at < TTL_MS) return cache.data;
  const base: RunningNow = { configured: isAdsConfigured(), campaigns: [], creatives: [], adCount: 0, fetchedAt: null, error: null };
  if (!base.configured) return { ...base, error: "META_ADS_TOKEN is not set." };
  try {
    const token = process.env.META_ADS_TOKEN as string;
    const [ads, campaigns, insights] = await Promise.all([
      listAds(undefined, true),
      listCampaigns(),
      adInsights7d(token).catch(() => ({}) as Record<string, Row>),
    ]);
    const live = ads.filter((a) => LIVE.has(a.effectiveStatus));
    const campById = new Map(campaigns.map((c) => [c.id, c]));
    const hashes = Array.from(new Set(live.map((a) => a.creative?.imageHash).filter((h): h is string => !!h)));
    const urls = await imageUrls(hashes, token);

    const groups = new Map<string, RunningCreative>();
    const touched = new Map<string, Set<string>>(); // campaign id → ad ids (for campaign totals)
    for (const a of live as LiveAd[]) {
      const c = a.creative;
      const key = `${c?.imageHash ?? a.creativeId ?? a.id}|${c?.headline ?? ""}`;
      const camp = a.campaignId ? campById.get(a.campaignId) : undefined;
      const label = camp ? campaignLabel(camp.name, camp.objective) : "—";
      const g =
        groups.get(key) ??
        {
          key,
          headline: c?.headline ?? a.name,
          message: c?.message ?? "",
          description: c?.description ?? null,
          link: c?.link ?? null,
          imageUrl: (c?.imageHash && urls[c.imageHash]) || c?.thumbnailUrl || null,
          placements: [],
          running: 0,
          review: 0,
          spend: 0,
          impressions: 0,
          linkClicks: 0,
          purchases: 0,
        };
      g.placements.push({ adId: a.id, campaignId: a.campaignId ?? "", campaignLabel: label, adsetName: a.adsetName.replace(/^S?\d+\s*·\s*/, ""), effectiveStatus: a.effectiveStatus, adsManagerUrl: adsManagerUrl(a.id) });
      if (a.effectiveStatus === "ACTIVE") g.running += 1;
      else g.review += 1;
      const i = insights[a.id];
      if (i) {
        g.spend += i.spend;
        g.impressions += i.impressions;
        g.linkClicks += i.linkClicks;
        g.purchases += i.purchases;
      }
      groups.set(key, g);
      if (a.campaignId) {
        if (!touched.has(a.campaignId)) touched.set(a.campaignId, new Set());
        touched.get(a.campaignId)!.add(a.id);
      }
    }

    // Campaign totals use every ad with insights in that campaign (paused ones still spent this week).
    const perCampaign = new Map<string, Row>();
    for (const a of ads) {
      const i = insights[a.id];
      if (!a.campaignId || !i) continue;
      const r = perCampaign.get(a.campaignId) ?? { spend: 0, impressions: 0, linkClicks: 0, purchases: 0 };
      r.spend += i.spend;
      r.impressions += i.impressions;
      r.linkClicks += i.linkClicks;
      r.purchases += i.purchases;
      perCampaign.set(a.campaignId, r);
    }
    const camps: RunningCampaign[] = campaigns
      .filter((c) => c.effectiveStatus === "ACTIVE" || touched.has(c.id))
      .map((c) => {
        const r = perCampaign.get(c.id);
        return {
          id: c.id,
          name: c.name,
          label: campaignLabel(c.name, c.objective),
          status: c.effectiveStatus,
          objective: c.objective,
          dailyBudget: c.dailyBudget,
          spend7d: r?.spend ?? 0,
          linkClicks7d: r?.linkClicks ?? 0,
          purchases7d: r?.purchases ?? 0,
        };
      })
      .sort((a, b) => (a.label === "Sales" ? -1 : 1) - (b.label === "Sales" ? -1 : 1) || a.name.localeCompare(b.name));

    const creatives = Array.from(groups.values()).sort((a, b) => b.spend - a.spend || b.running - a.running || a.headline.localeCompare(b.headline));
    const data: RunningNow = { ...base, campaigns: camps, creatives, adCount: live.length, fetchedAt: new Date().toISOString() };
    cache = { at: Date.now(), data };
    return data;
  } catch (e) {
    const error = e instanceof Error ? e.message : "Couldn't read the live ads from Meta.";
    if (cache) return { ...cache.data, error };
    return { ...base, error };
  }
}
