/**
 * Meta Marketing API client for Bob's ad account.
 *
 * Creates paused Facebook/Instagram ADS (not Page posts) from creative
 * composed in the admin Ads maker. Everything goes through `act_{id}`:
 *
 *   image → POST /adimages (hash)
 *   creative → POST /adcreatives (object_story_spec.link_data)
 *   ad → POST /ads (status PAUSED)
 *
 * Token: META_ADS_TOKEN — a user/system-user token with ads_management +
 * ads_read. It is separate from the Page token (which can't manage ads).
 * Read-only calls fall back to META_PAGE_TOKEN only when it happens to
 * serve them; writes never do. Tokens are never logged.
 */

import { GRAPH } from "./config";
import { MetaError, graphGet, graphPost, handleGraphResponse } from "./graph";

type Json = Record<string, unknown>;

export const DEFAULT_AD_ACCOUNT_ID = "1788471615529613";
export const ADS_NOT_CONFIGURED =
  "Ads token not configured. Set META_ADS_TOKEN (ads_management) — see docs/ADS_SETUP.md.";

/** Numeric ad account id (no `act_` prefix). */
export function adAccountId(): string {
  const raw = process.env.META_AD_ACCOUNT_ID || DEFAULT_AD_ACCOUNT_ID;
  return raw.replace(/^act_/, "");
}

export function adsToken(): string | undefined {
  return process.env.META_ADS_TOKEN || undefined;
}

export function isAdsConfigured(): boolean {
  return !!adsToken();
}

/** Token for reads: the ads token, else the Page token (may be refused). */
function readToken(): string {
  const t = adsToken() || process.env.META_PAGE_TOKEN;
  if (!t) throw new MetaError(ADS_NOT_CONFIGURED, { code: -1 });
  return t;
}

/** Token for writes: the ads token only. */
function writeToken(): string {
  const t = adsToken();
  if (!t) throw new MetaError(ADS_NOT_CONFIGURED, { code: -1 });
  return t;
}

const act = () => `act_${adAccountId()}`;

/** Ads Manager deep link for an ad id. */
export function adsManagerUrl(adId: string): string {
  return `https://www.facebook.com/adsmanager/manage/ads?act=${adAccountId()}&selected_ad_ids=${adId}`;
}

// ───────── Campaign / ad set reads ─────────

export interface Campaign {
  id: string;
  name: string;
  objective: string;
  effectiveStatus: string;
  dailyBudget: number | null; // dollars
}

export async function listCampaigns(): Promise<Campaign[]> {
  const data = await graphGet(`${act()}/campaigns`, {
    fields: "id,name,objective,effective_status,daily_budget",
    limit: "100",
    access_token: readToken(),
  });
  return ((data.data as Json[]) || []).map((c) => ({
    id: String(c.id),
    name: String(c.name),
    objective: String(c.objective ?? ""),
    effectiveStatus: String(c.effective_status ?? ""),
    dailyBudget: c.daily_budget ? Number(c.daily_budget) / 100 : null,
  }));
}

export interface AdSet {
  id: string;
  name: string;
  optimizationGoal: string;
  effectiveStatus: string;
  campaignId: string;
}

export async function listAdSets(campaignId: string): Promise<AdSet[]> {
  const data = await graphGet(`${campaignId}/adsets`, {
    fields: "id,name,optimization_goal,effective_status,campaign_id",
    limit: "100",
    access_token: readToken(),
  });
  return ((data.data as Json[]) || []).map((s) => ({
    id: String(s.id),
    name: String(s.name),
    optimizationGoal: String(s.optimization_goal ?? ""),
    effectiveStatus: String(s.effective_status ?? ""),
    campaignId: String(s.campaign_id ?? campaignId),
  }));
}

// ───────── Images ─────────

export type UploadImageInput =
  | { url: string }
  | { bytes: Uint8Array | ArrayBuffer; filename: string };

function firstImage(res: Json): { hash: string; url?: string } {
  const images = (res.images as Record<string, Json> | undefined) || {};
  const first = Object.values(images)[0];
  if (!first?.hash) throw new MetaError("Meta returned no image hash.");
  return { hash: String(first.hash), url: first.url as string | undefined };
}

/** Upload an image to the ad account's library; returns its hash. */
export async function uploadImage(
  input: UploadImageInput,
): Promise<{ hash: string; url?: string }> {
  if ("url" in input) {
    const res = await graphPost(`${act()}/adimages`, {
      url: input.url,
      access_token: writeToken(),
    });
    return firstImage(res);
  }
  const form = new FormData();
  const bytes =
    input.bytes instanceof ArrayBuffer ? new Uint8Array(input.bytes) : input.bytes;
  form.append("filename", new Blob([bytes as BlobPart]), input.filename);
  form.append("access_token", writeToken());
  const res = await fetch(`${GRAPH}/${act()}/adimages`, {
    method: "POST",
    body: form,
    cache: "no-store",
  });
  return firstImage(await handleGraphResponse(res));
}

// ───────── Creatives ─────────

export const CTA_TYPES = ["SHOP_NOW", "LEARN_MORE", "BUY_NOW", "ORDER_NOW", "GET_OFFER"] as const;
export type CtaType = (typeof CTA_TYPES)[number];

export interface CreateCreativeInput {
  pageId: string;
  name: string;
  imageHash: string;
  /** Primary text. */
  message: string;
  /** Headline (link_data.name). */
  headline: string;
  description?: string;
  link: string;
  ctaType: CtaType | string;
  /** Shown under the headline, e.g. "robertcastellino.com". */
  displayLink?: string;
  /** Instagram actor id, when the account is linked. */
  instagramActorId?: string;
}

export async function createCreative(input: CreateCreativeInput): Promise<{ id: string }> {
  const linkData: Json = {
    image_hash: input.imageHash,
    link: input.link,
    message: input.message,
    name: input.headline,
    call_to_action: { type: input.ctaType, value: { link: input.link } },
  };
  if (input.description) linkData.description = input.description;
  if (input.displayLink) linkData.caption = input.displayLink;

  const spec: Json = { page_id: input.pageId, link_data: linkData };
  if (input.instagramActorId) spec.instagram_actor_id = input.instagramActorId;

  const res = await graphPost(`${act()}/adcreatives`, {
    name: input.name,
    object_story_spec: JSON.stringify(spec),
    access_token: writeToken(),
  });
  return { id: String(res.id) };
}

// ───────── Ads ─────────

export type EntityStatus = "ACTIVE" | "PAUSED";

export interface CreateAdInput {
  adsetId: string;
  name: string;
  creativeId: string;
  status?: EntityStatus;
}

export async function createAd(input: CreateAdInput): Promise<{ id: string }> {
  const res = await graphPost(`${act()}/ads`, {
    name: input.name,
    adset_id: input.adsetId,
    creative: JSON.stringify({ creative_id: input.creativeId }),
    status: input.status ?? "PAUSED",
    access_token: writeToken(),
  });
  return { id: String(res.id) };
}

export interface LiveAd {
  id: string;
  name: string;
  effectiveStatus: string;
  status: string;
  adsetId: string;
  adsetName: string;
  campaignId: string | null;
  creativeId: string | null;
  /** Creative details, present when fetched with `withCreative`. */
  creative?: {
    thumbnailUrl: string | null;
    imageHash: string | null;
    message: string;
    headline: string;
    description: string | null;
    link: string | null;
    ctaType: string | null;
  };
}

function mapAd(a: Json): LiveAd {
  const adset = a.adset as Json | undefined;
  const creative = a.creative as Json | undefined;
  const out: LiveAd = {
    id: String(a.id),
    name: String(a.name ?? ""),
    effectiveStatus: String(a.effective_status ?? ""),
    status: String(a.status ?? ""),
    adsetId: String(a.adset_id ?? adset?.id ?? ""),
    adsetName: String(adset?.name ?? ""),
    campaignId: a.campaign_id ? String(a.campaign_id) : null,
    creativeId: creative?.id ? String(creative.id) : null,
  };
  if (creative && "object_story_spec" in creative) {
    const spec = creative.object_story_spec as Json | undefined;
    const link = (spec?.link_data as Json | undefined) ?? {};
    const cta = link.call_to_action as Json | undefined;
    out.creative = {
      thumbnailUrl: creative.thumbnail_url ? String(creative.thumbnail_url) : null,
      imageHash: link.image_hash ? String(link.image_hash) : null,
      message: String(link.message ?? ""),
      headline: String(link.name ?? ""),
      description: link.description ? String(link.description) : null,
      link: link.link ? String(link.link) : null,
      ctaType: cta?.type ? String(cta.type) : null,
    };
  }
  return out;
}

const AD_FIELDS = "id,name,status,effective_status,adset_id,campaign_id,adset{name},creative{id}";
const AD_FIELDS_FULL =
  "id,name,status,effective_status,adset_id,campaign_id,adset{name},creative{id,thumbnail_url,object_story_spec}";

export async function listAds(adsetId?: string, withCreative = false): Promise<LiveAd[]> {
  const data = await graphGet(`${adsetId || act()}/ads`, {
    fields: withCreative ? AD_FIELDS_FULL : AD_FIELDS,
    // Archived/deleted ads are history, not something to manage here.
    effective_status: JSON.stringify([
      "ACTIVE", "PAUSED", "ADSET_PAUSED", "CAMPAIGN_PAUSED", "PENDING_REVIEW",
      "DISAPPROVED", "PREAPPROVED", "PENDING_BILLING_INFO", "IN_PROCESS", "WITH_ISSUES",
    ]),
    limit: "200",
    access_token: readToken(),
  });
  return ((data.data as Json[]) || []).map(mapAd);
}

/** Fetch several ads by id in one call (max ~50 ids per request). */
export async function getAds(ids: string[]): Promise<Record<string, LiveAd>> {
  const out: Record<string, LiveAd> = {};
  for (let i = 0; i < ids.length; i += 50) {
    const chunk = ids.slice(i, i + 50);
    const data = await graphGet("", {
      ids: chunk.join(","),
      fields: AD_FIELDS,
      access_token: readToken(),
    });
    for (const [id, row] of Object.entries(data)) {
      if (row && typeof row === "object") out[id] = mapAd(row as Json);
    }
  }
  return out;
}

/** Pause/activate an ad, ad set, or campaign. */
export async function setStatus(id: string, status: EntityStatus): Promise<void> {
  await graphPost(id, { status, access_token: writeToken() });
}

// ───────── Previews ─────────

export const PREVIEW_FORMATS = [
  "MOBILE_FEED_STANDARD",
  "DESKTOP_FEED_STANDARD",
  "INSTAGRAM_STANDARD",
  "INSTAGRAM_STORY",
  "FACEBOOK_STORY_MOBILE",
  "RIGHT_COLUMN_STANDARD",
] as const;
export type PreviewFormat = (typeof PREVIEW_FORMATS)[number];

export interface Preview {
  format: string;
  /** Raw `<iframe …>` markup from Meta. */
  html: string;
  /** The iframe src, extracted for direct embedding. */
  src: string | null;
}

export async function getPreview(
  creativeId: string,
  format: PreviewFormat | string = "MOBILE_FEED_STANDARD",
): Promise<Preview> {
  const data = await graphGet(`${creativeId}/previews`, {
    ad_format: format,
    access_token: readToken(),
  });
  const body = String(((data.data as Json[]) || [])[0]?.body ?? "");
  const m = body.match(/src="([^"]+)"/);
  const src = m ? m[1].replace(/&amp;/g, "&") : null;
  return { format, html: body, src };
}

// ───────── Insights ─────────

export interface AdInsights {
  impressions: number;
  clicks: number;
  spend: number; // dollars
  ctr: number; // percent
  cpc: number; // dollars
}

function mapInsights(r: Json | undefined): AdInsights {
  return {
    impressions: Number(r?.impressions ?? 0),
    clicks: Number(r?.clicks ?? 0),
    spend: Number(r?.spend ?? 0),
    ctr: Number(r?.ctr ?? 0),
    cpc: Number(r?.cpc ?? 0),
  };
}

const INSIGHT_FIELDS = "ad_id,impressions,clicks,spend,ctr,cpc";

/** Last 7 days for one ad. */
export async function insights(adId: string): Promise<AdInsights> {
  const data = await graphGet(`${adId}/insights`, {
    date_preset: "last_7d",
    fields: INSIGHT_FIELDS,
    access_token: readToken(),
  });
  return mapInsights(((data.data as Json[]) || [])[0]);
}

/** Last 7 days for every ad in the account, keyed by ad id (one call). */
export async function accountAdInsights(): Promise<Record<string, AdInsights>> {
  const data = await graphGet(`${act()}/insights`, {
    level: "ad",
    date_preset: "last_7d",
    fields: INSIGHT_FIELDS,
    limit: "500",
    access_token: readToken(),
  });
  const out: Record<string, AdInsights> = {};
  for (const r of (data.data as Json[]) || []) out[String(r.ad_id)] = mapInsights(r);
  return out;
}

/** Collapse Meta's effective_status into the draft's status vocabulary. */
export function draftStatusFor(effective: string): "active" | "paused" | "submitted" | "failed" {
  switch (effective) {
    case "ACTIVE":
      return "active";
    case "PAUSED":
    case "ADSET_PAUSED":
    case "CAMPAIGN_PAUSED":
      return "paused";
    case "DISAPPROVED":
    case "DELETED":
    case "ARCHIVED":
      return "failed";
    default:
      return "submitted"; // PENDING_REVIEW, IN_PROCESS, WITH_ISSUES, PREAPPROVED…
  }
}

export function errorMessage(e: unknown, fallback = "Meta request failed."): string {
  if (e instanceof MetaError || e instanceof Error) return e.message || fallback;
  return fallback;
}
