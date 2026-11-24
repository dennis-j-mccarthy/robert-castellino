import { graphGet } from "@/lib/meta/graph";
import { adAccountId, isAdsConfigured, listCampaigns } from "@/lib/meta/ads";
import { getBrandEssence } from "@/lib/creator/essence-store";
import { getTone } from "@/lib/creator/tone-store";
import { isDatabaseConfigured, prisma } from "@/lib/prisma";
import type { Audience } from "@/lib/creator/pillars";

/*
  Tool 3 · Audience. SERVER ONLY.

  Three things on one page: the reader (who every piece is written to),
  the email list, and the segments — the Meta audiences described in plain
  words (BrandEssence.audiences, written in October) joined to what Meta
  says about them today: size, delivery status, and which running ad sets
  use them with last-7-day spend and sales. Read-only; audiences are built
  and edited in Meta (link on each card).
*/

const TTL_MS = 5 * 60 * 1000;
type Json = Record<string, unknown>;

export interface LiveAudience {
  id: string;
  name: string;
  subtype: string;
  lower: number | null;
  upper: number | null;
  deliveryCode: number | null;
  deliveryText: string | null;
}

export interface AudienceUse {
  adsetId: string;
  adsetName: string;
  campaignLabel: string;
  status: string;
  spend7d: number;
  linkClicks7d: number;
  purchases7d: number;
}

export interface SegmentView {
  /** The plain-words card from Essence, when one matches. */
  card: Audience | null;
  live: LiveAudience | null;
  name: string;
  uses: AudienceUse[];
  metaUrl: string;
}

export interface AudienceView {
  reader: string;
  subscribers: { total: number; confirmed: number; last30: number } | null;
  segments: SegmentView[];
  configured: boolean;
  error: string | null;
  fetchedAt: string | null;
}

let cache: { at: number; data: AudienceView } | null = null;

function campaignLabel(name: string, objective: string) {
  return /sales/i.test(name) || objective === "OUTCOME_SALES" ? "Sales" : objective === "OUTCOME_TRAFFIC" ? "Traffic" : objective.replace(/^OUTCOME_/, "").toLowerCase();
}

/** Loose name match between the October cards and Meta's current names. */
function norm(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}
function matches(card: Audience, live: LiveAudience) {
  const a = norm(card.name), b = norm(live.name);
  if (a === b) return true;
  const head = (s: string) => s.split(" ").slice(0, 3).join(" ");
  return head(a) === head(b);
}

export async function getAudienceView(opts: { refresh?: boolean } = {}): Promise<AudienceView> {
  if (!opts.refresh && cache && Date.now() - cache.at < TTL_MS) return cache.data;
  const [essence, { tone }] = await Promise.all([getBrandEssence(), getTone()]);
  const cards = essence.audiences;
  const base: AudienceView = { reader: tone.audience, subscribers: null, segments: cards.map((c) => ({ card: c, live: null, name: c.name, uses: [], metaUrl: `https://adsmanager.facebook.com/adsmanager/audiences?act=${adAccountId()}` })), configured: isAdsConfigured(), error: null, fetchedAt: null };

  if (isDatabaseConfigured()) {
    try {
      const since = new Date(Date.now() - 30 * 86400000);
      const [total, confirmed, last30] = await Promise.all([
        prisma.subscriber.count({ where: { active: true } }),
        prisma.subscriber.count({ where: { active: true, confirmed: true } }),
        prisma.subscriber.count({ where: { active: true, createdAt: { gte: since } } }),
      ]);
      base.subscribers = { total, confirmed, last30 };
    } catch {}
  }
  if (!base.configured) return base;

  try {
    const token = process.env.META_ADS_TOKEN as string;
    const act = `act_${adAccountId()}`;
    const [aud, campaigns, ins] = await Promise.all([
      graphGet(`${act}/customaudiences`, { fields: "id,name,subtype,approximate_count_lower_bound,approximate_count_upper_bound,delivery_status", limit: "100", access_token: token }),
      listCampaigns(),
      graphGet(`${act}/insights`, { level: "adset", date_preset: "last_7d", fields: "adset_id,spend,inline_link_clicks,actions", limit: "100", access_token: token }).catch(() => ({ data: [] }) as Json),
    ]);
    const live: LiveAudience[] = ((aud.data as Json[]) || []).map((a) => {
      const ds = a.delivery_status as Json | undefined;
      return { id: String(a.id), name: String(a.name ?? ""), subtype: String(a.subtype ?? ""), lower: a.approximate_count_lower_bound != null ? Number(a.approximate_count_lower_bound) : null, upper: a.approximate_count_upper_bound != null ? Number(a.approximate_count_upper_bound) : null, deliveryCode: ds?.code != null ? Number(ds.code) : null, deliveryText: ds?.description ? String(ds.description) : null };
    });
    const insightsBySet = new Map<string, { spend: number; clicks: number; buys: number }>();
    for (const r of (ins.data as Json[]) || []) {
      const actions = (r.actions as Json[] | undefined) || [];
      const buy = actions.find((x) => x.action_type === "purchase");
      insightsBySet.set(String(r.adset_id), { spend: Number(r.spend || 0), clicks: Number(r.inline_link_clicks || 0), buys: Number(buy?.value || 0) });
    }
    const usesByAudience = new Map<string, AudienceUse[]>();
    for (const c of campaigns) {
      const sets = await graphGet(`${c.id}/adsets`, { fields: "id,name,effective_status,targeting{custom_audiences,excluded_custom_audiences}", limit: "50", access_token: token }).catch(() => ({ data: [] }) as Json);
      for (const s of (sets.data as Json[]) || []) {
        const t = (s.targeting as Json | undefined) || {};
        for (const a of ((t.custom_audiences as Json[]) || [])) {
          const id = String(a.id);
          const i = insightsBySet.get(String(s.id));
          const use: AudienceUse = { adsetId: String(s.id), adsetName: String(s.name ?? ""), campaignLabel: campaignLabel(c.name, c.objective), status: String(s.effective_status ?? ""), spend7d: i?.spend ?? 0, linkClicks7d: i?.clicks ?? 0, purchases7d: i?.buys ?? 0 };
          if (!usesByAudience.has(id)) usesByAudience.set(id, []);
          usesByAudience.get(id)!.push(use);
        }
      }
    }
    const used = new Set<string>();
    const segments: SegmentView[] = cards.map((c) => {
      const l = live.find((x) => !used.has(x.id) && matches(c, x)) ?? null;
      if (l) used.add(l.id);
      return { card: c, live: l, name: c.name, uses: l ? usesByAudience.get(l.id) ?? [] : [], metaUrl: l ? `https://adsmanager.facebook.com/adsmanager/audiences?act=${adAccountId()}&selected_audience_ids=${l.id}` : `https://adsmanager.facebook.com/adsmanager/audiences?act=${adAccountId()}` };
    });
    for (const l of live) {
      if (used.has(l.id)) continue;
      segments.push({ card: null, live: l, name: l.name, uses: usesByAudience.get(l.id) ?? [], metaUrl: `https://adsmanager.facebook.com/adsmanager/audiences?act=${adAccountId()}&selected_audience_ids=${l.id}` });
    }
    // Running ones first, then by size.
    segments.sort((a, b) => (b.uses.some((u) => u.status === "ACTIVE") ? 1 : 0) - (a.uses.some((u) => u.status === "ACTIVE") ? 1 : 0) || (b.live?.upper ?? 0) - (a.live?.upper ?? 0));
    const data: AudienceView = { ...base, segments, fetchedAt: new Date().toISOString() };
    cache = { at: Date.now(), data };
    return data;
  } catch (e) {
    return { ...base, error: e instanceof Error ? e.message : "Couldn't read audiences from Meta." };
  }
}
