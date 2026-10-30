import { graphGet } from "@/lib/meta/graph";
import { adAccountId, adsManagerUrl, isAdsConfigured, listAds, type LiveAd } from "@/lib/meta/ads";

/*
  "In market" — the live ads in Bob's book campaign, READ-ONLY. SERVER ONLY.

  Pulled through the Marketing API with META_ADS_TOKEN (never written to)
  and cached in memory for a few minutes so the page doesn't hammer Meta.
  Nothing here can change an ad's status: there is no write path.
*/

export const BOOK_CAMPAIGN_ID = process.env.META_BOOK_CAMPAIGN_ID || "120251354161250171";
const TTL_MS = 5 * 60 * 1000;

export interface InMarketAd {
  id: string;
  name: string;
  adsetId: string;
  adsetName: string;
  status: string;
  effectiveStatus: string;
  headline: string;
  message: string;
  description: string | null;
  link: string | null;
  thumbnailUrl: string | null;
  creativeId: string | null;
  adsManagerUrl: string;
}

export interface InMarket {
  configured: boolean;
  campaign: { id: string; name: string; status: string; objective: string } | null;
  ads: InMarketAd[];
  account: string;
  fetchedAt: string | null;
  error: string | null;
}

let cache: { at: number; data: InMarket } | null = null;

function mapAd(a: LiveAd): InMarketAd {
  return {
    id: a.id,
    name: a.name,
    adsetId: a.adsetId,
    adsetName: a.adsetName,
    status: a.status,
    effectiveStatus: a.effectiveStatus,
    headline: a.creative?.headline ?? "",
    message: a.creative?.message ?? "",
    description: a.creative?.description ?? null,
    link: a.creative?.link ?? null,
    thumbnailUrl: a.creative?.thumbnailUrl ?? null,
    creativeId: a.creativeId,
    adsManagerUrl: adsManagerUrl(a.id),
  };
}

export async function getInMarket(opts: { refresh?: boolean } = {}): Promise<InMarket> {
  if (!opts.refresh && cache && Date.now() - cache.at < TTL_MS) return cache.data;
  const base: InMarket = {
    configured: isAdsConfigured(),
    campaign: null,
    ads: [],
    account: adAccountId(),
    fetchedAt: null,
    error: null,
  };
  if (!base.configured) return { ...base, error: "META_ADS_TOKEN is not set — the live table needs it (read-only)." };
  try {
    const token = process.env.META_ADS_TOKEN as string;
    const [camp, ads] = await Promise.all([
      graphGet(BOOK_CAMPAIGN_ID, { fields: "id,name,effective_status,objective", access_token: token }),
      // `${campaignId}/ads` is a valid edge; listAds() takes any parent id.
      listAds(BOOK_CAMPAIGN_ID, true),
    ]);
    const data: InMarket = {
      ...base,
      campaign: {
        id: String(camp.id),
        name: String(camp.name ?? ""),
        status: String(camp.effective_status ?? ""),
        objective: String(camp.objective ?? ""),
      },
      ads: ads.map(mapAd).sort((a, b) => a.adsetName.localeCompare(b.adsetName) || a.name.localeCompare(b.name)),
      fetchedAt: new Date().toISOString(),
    };
    cache = { at: Date.now(), data };
    return data;
  } catch (e) {
    const error = e instanceof Error ? e.message : "Couldn't read the campaign from Meta.";
    // Serve the stale copy when we have one; it's still read-only truth from minutes ago.
    if (cache) return { ...cache.data, error };
    return { ...base, error };
  }
}
