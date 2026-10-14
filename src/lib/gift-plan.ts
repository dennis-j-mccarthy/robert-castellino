// Plan state for the gift-series posts, shared by the API route and its test.
// Each post can be an organic post and/or a paid ad, carry a schedule date, and
// flag a reminder for Bob to cross-post to his personal Facebook / Instagram.

export const AD_SETS = ["", "1", "2", "3", "4", "5", "6"] as const;
export const STATUSES = ["marked", "built", "running", "stopped"] as const;
// datetime-local as the browser emits it; stored verbatim (local/Mountain time),
// never ISO round-tripped (that would shift the hour on every save).
export const DATE_RE = /^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2})?$/;

export type Post = { on: boolean; at: string; posted: boolean };
export type Ad = { on: boolean; adSet: string; status: string; adId: string; at: string };
export type Cross = { fb: boolean; ig: boolean; done: boolean };
export type PlanState = { post: Post; ad: Ad; cross: Cross; note: string; by: string; at: string };

function bool(v: unknown): boolean { return v === true; }
function str(v: unknown, max: number): string { return typeof v === "string" ? v.slice(0, max) : ""; }
function date(v: unknown): string { return typeof v === "string" && (v === "" || DATE_RE.test(v)) ? v : ""; }

/**
 * Normalize any stored/received value into a PlanState, migrating the legacy
 * flat AdState ({adSet,status,adId,...}) into the `ad` sub-object. Returns null
 * when nothing is earmarked (post off, ad off, no cross-post) so callers clear
 * the row instead of storing an empty plan. Pure — used on read and write so
 * old and new shapes both work.
 */
export function toPlan(raw: unknown): PlanState | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const legacy = !("ad" in r) && !("post" in r) && ("adSet" in r || "status" in r);
  const adSrc = ((legacy ? r : r.ad) as Record<string, unknown> | undefined) ?? {};
  const postSrc = (r.post as Record<string, unknown> | undefined) ?? {};
  const crossSrc = (r.cross as Record<string, unknown> | undefined) ?? {};

  const adSetRaw = str(adSrc.adSet, 2);
  const adSet = (AD_SETS as readonly string[]).includes(adSetRaw) ? adSetRaw : "";
  const statusRaw = str(adSrc.status, 16);
  const status = (STATUSES as readonly string[]).includes(statusRaw) ? statusRaw : "marked";
  const adId = str(adSrc.adId, 24).replace(/\D/g, "");

  const ad: Ad = { on: legacy ? true : bool(adSrc.on), adSet, status, adId, at: date(adSrc.at) };
  const post: Post = { on: bool(postSrc.on), at: date(postSrc.at), posted: bool(postSrc.posted) };
  const cross: Cross = { fb: bool(crossSrc.fb), ig: bool(crossSrc.ig), done: bool(crossSrc.done) };

  if (!(post.on || ad.on || cross.fb || cross.ig)) return null;

  return { post, ad, cross, note: str(r.note, 300).trim(), by: str(r.by, 80), at: new Date().toISOString() };
}

export function parseRow(edits: unknown): Record<string, PlanState> {
  const out: Record<string, PlanState> = {};
  if (!edits || typeof edits !== "object") return out;
  for (const [k, v] of Object.entries(edits as Record<string, unknown>)) {
    if (!/^\d{2}$/.test(k) || typeof v !== "string") continue;
    try {
      const plan = toPlan(JSON.parse(v));
      if (plan) out[k] = plan;
    } catch {
      // skip a corrupt entry rather than failing the whole list
    }
  }
  return out;
}
