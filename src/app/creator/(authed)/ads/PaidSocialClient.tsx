"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Notice, { type NoticeState } from "@/components/creator/Notice";
import Thumb from "@/components/creator/Thumb";
import { api, errText } from "@/lib/creator/client";
import { conceptAdName, conceptNumberFromAdName, type Concept, type ConceptSet } from "@/lib/creator/concepts";
import type { AdState, InMarket, InMarketAd } from "@/lib/creator/in-market";
import type { PreviewFormat } from "@/lib/meta/ads";

/*
  Paid social — the control room for Bob's book campaign, Throughline edition.

  Same structure and same words as Meta Ads Manager (Campaign → Ad sets → Ads,
  Meta's status strings shown verbatim) so nothing is lost flipping between
  the two. Every level has a direct "View in Meta" link. Turning anything ON
  asks for one confirmation because it can start spending.

  Ads are shown as Meta-rendered preview cards: one card per creative
  (same headline + image), with a row per ad set underneath that keeps its
  own switch and Meta link. Previews load lazily (when a card scrolls into
  view or a placement chip is clicked) and are cached per creative+format.
*/

interface Props {
  sets: ConceptSet[];
  plates: { src: string; label: string; page: number | null }[];
  /** Meta ad id → page in the book, when the ad was built from an in-book plate. */
  bookPages: Record<string, number>;
}

type Confirm = {
  title: string;
  body: string;
  cta: string;
  run: () => Promise<void>;
};

const money = (n: number) => `$${n.toFixed(n >= 100 ? 0 : 2)}`;
const pct = (n: number) => `${n.toFixed(2)}%`;
const metaWord = (s: string) => s.replace(/_/g, " ").toLowerCase();

const STATE_LABEL: Record<AdState, string> = {
  running: "Running now",
  armed: "Switched on, waiting",
  off: "Switched off",
  review: "In review at Meta",
  problem: "Needs attention",
};
const STATE_ORDER: AdState[] = ["running", "armed", "off", "review", "problem"];
const STATE_PILL: Record<AdState, string> = { running: "active", armed: "submitted", off: "paused", review: "submitted", problem: "failed" };

// Placements → the preview formats /api/creator/ads/preview accepts (PREVIEW_FORMATS).
// width/height ≈ the size Meta renders each placement at (its iframes don't scale).
const PLACEMENTS: Array<{ format: PreviewFormat; label: string; width: number; height: number }> = [
  { format: "MOBILE_FEED_STANDARD", label: "Facebook feed", width: 320, height: 475 },
  { format: "INSTAGRAM_STANDARD", label: "Instagram feed", width: 320, height: 500 },
  { format: "INSTAGRAM_STORY", label: "IG Story", width: 320, height: 570 },
  { format: "FACEBOOK_STORY_MOBILE", label: "FB Story", width: 320, height: 570 },
  { format: "DESKTOP_FEED_STANDARD", label: "Desktop feed", width: 500, height: 470 },
  { format: "RIGHT_COLUMN_STANDARD", label: "Right column", width: 254, height: 150 },
];
const DEFAULT_FORMAT: PreviewFormat = "MOBILE_FEED_STANDARD";
type PreviewCache = Record<string, { src: string | null; state: "loading" | "ok" | "error" }>;
const cacheKey = (creativeId: string, format: string) => `${creativeId}:${format}`;

const amUrl = {
  campaign: (act: string, id: string) => `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${act}&selected_campaign_ids=${id}`,
  adset: (act: string, campaignId: string, id: string) => `https://adsmanager.facebook.com/adsmanager/manage/adsets?act=${act}&selected_campaign_ids=${campaignId}&selected_adset_ids=${id}`,
};

/** Ads that share a creative (same headline + image) collapse into one card. */
type CreativeGroup = { key: string; lead: InMarketAd; ads: InMarketAd[] };
function groupByCreative(ads: InMarketAd[]): CreativeGroup[] {
  const out: CreativeGroup[] = [];
  const idx = new Map<string, CreativeGroup>();
  for (const a of ads) {
    const key = `${a.headline}|${a.thumbnailUrl ?? a.creativeId ?? a.id}`;
    const g = idx.get(key);
    if (g) g.ads.push(a);
    else {
      const ng = { key, lead: a, ads: [a] };
      idx.set(key, ng);
      out.push(ng);
    }
  }
  return out;
}

export default function PaidSocialClient({ sets, plates, bookPages }: Props) {
  const [data, setData] = useState<InMarket | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [previews, setPreviews] = useState<PreviewCache>({});
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [open, setOpen] = useState<string>(sets[0]?.set ?? "");
  const [stage, setStage] = useState<{ c: Concept; set: ConceptSet } | null>(null);
  const inflight = useRef(new Set<string>());

  const load = useCallback((refresh = false) => {
    return api<InMarket>(`/api/creator/ads/in-market${refresh ? "?refresh=1" : ""}`)
      .then(setData)
      .catch((e: unknown) => setNotice({ kind: "err", text: errText(e) }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

  async function setStatus(kind: "ad" | "adset" | "campaign", id: string, status: "ACTIVE" | "PAUSED", label: string) {
    setBusy(id);
    try {
      const next = await api<InMarket>("/api/creator/ads/status", { method: "POST", json: { kind, id, status, confirm: status === "ACTIVE" } });
      setData(next);
      setNotice({ kind: "ok", text: `${label} is now ${status === "ACTIVE" ? "ON" : "OFF"} in Meta.` });
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  function askOn(kind: "ad" | "adset" | "campaign", id: string, label: string) {
    const budget = data?.campaign?.dailyBudget;
    const spend = budget ? `The campaign budget is ${money(budget)} per day, shared across every running ad.` : "This can start spending from the campaign budget.";
    const extra =
      kind === "ad" && data?.campaign?.status !== "ACTIVE"
        ? " The campaign itself is OFF, so this ad will wait until the campaign is turned on."
        : kind === "campaign"
          ? ` Only ads that are switched on will run: right now that is ${data?.counts.armed ?? 0}.`
          : "";
    setConfirm({
      title: `Turn on ${label}?`,
      body: `${spend}${extra} You can turn it off again here any time.`,
      cta: "Yes, turn it on",
      run: () => setStatus(kind, id, "ACTIVE", label),
    });
  }

  async function removeAd(a: InMarketAd) {
    setBusy(a.id);
    try {
      const next = await api<InMarket>("/api/creator/ads/remove", { method: "POST", json: { id: a.id } });
      setData(next);
      setNotice({ kind: "ok", text: `“${a.name}” was pulled out of Meta.` });
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  function askRemove(a: InMarketAd) {
    setConfirm({
      title: `Pull “${a.name}” out of Meta?`,
      body: "The ad is deleted in Meta and disappears from the campaign. The concept stays here and can be put back in any time, as a fresh paused ad.",
      cta: "Yes, pull it out",
      run: () => removeAd(a),
    });
  }

  /** Meta's own rendered preview for one creative + placement, fetched once and kept. */
  const loadPreview = useCallback((creativeId: string, format: PreviewFormat) => {
    const key = cacheKey(creativeId, format);
    if (inflight.current.has(key)) return;
    inflight.current.add(key);
    setPreviews((p) => (p[key] ? p : { ...p, [key]: { src: null, state: "loading" } }));
    api<{ src: string | null }>(`/api/creator/ads/preview?creativeId=${creativeId}&format=${format}`)
      .then((p) => setPreviews((prev) => ({ ...prev, [key]: { src: p.src, state: "ok" } })))
      .catch((e: unknown) => {
        setPreviews((prev) => ({ ...prev, [key]: { src: null, state: "error" } }));
        setNotice({ kind: "err", text: errText(e) });
      });
  }, []);

  const ads = useMemo(() => data?.ads ?? [], [data]);
  /** Concept number → the live Meta ads created from it (matched by the deterministic ad name). */
  const liveByConcept = useMemo(() => {
    const m = new Map<number, InMarketAd[]>();
    for (const a of ads) {
      const n = conceptNumberFromAdName(a.name);
      if (n == null) continue;
      const arr = m.get(n) ?? [];
      arr.push(a);
      m.set(n, arr);
    }
    return m;
  }, [ads]);
  const grouped = useMemo(() => {
    const g: Record<AdState, CreativeGroup[]> = { running: [], armed: [], off: [], review: [], problem: [] };
    const byState: Record<AdState, InMarketAd[]> = { running: [], armed: [], off: [], review: [], problem: [] };
    for (const a of ads) byState[a.state].push(a);
    for (const st of STATE_ORDER) g[st] = groupByCreative(byState[st]);
    return g;
  }, [ads]);
  const camp = data?.campaign ?? null;
  const campOn = camp?.status === "ACTIVE";
  const act = data?.account ?? "";
  const asOf = data?.fetchedAt ? new Date(data.fetchedAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" }) : null;

  return (
    <div className="cr-paid">
      <Notice notice={notice} onClose={() => setNotice(null)} />

      <div className="tl-toolbar">
        <span className={`tl-live${data?.error ? " is-stale" : ""}`}>
          <i aria-hidden="true" />
          {loading ? "Meta · loading…" : asOf ? `Meta · as of ${asOf}` : "Meta · not connected"}
        </span>
        <button type="button" className="btn ads-btn-sm" disabled={loading} onClick={() => { setLoading(true); void load(true); }}>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d="M21 12a9 9 0 1 1-2.6-6.4M21 3v6h-6" /></svg>
          {loading ? "Refreshing…" : "Refresh view"}
        </button>
      </div>

      {/* ───── Campaign ───── */}
      <section className="cr-camp">
        <div className="cr-camp__row">
          <div className="cr-camp__main">
            <div className="tl-eyebrow tl-eyebrow--muted">Campaign</div>
            <h2>{camp?.name ?? (loading ? "Loading…" : "—")}</h2>
            {camp && (
              <div className="cr-camp__meta">
                <span>Meta says <code>{camp.status}</code></span>
                <span>· objective <code>{metaWord(camp.objective)}</code></span>
                {camp.dailyBudget != null && <span>· <b>{money(camp.dailyBudget)}/day</b> shared across all ad sets</span>}
              </div>
            )}
          </div>
          {camp && (
            <div className="cr-camp__switch">
              <span className={`cr-big ${campOn ? "cr-big--on" : "cr-big--off"}`}>{campOn ? "ON" : "OFF"}</span>
              {campOn ? (
                <button type="button" className="btn btn--ghost" disabled={busy === camp.id} onClick={() => void setStatus("campaign", camp.id, "PAUSED", "the campaign")}>Turn campaign off</button>
              ) : (
                <button type="button" className="btn btn--gold" disabled={busy === camp.id} onClick={() => askOn("campaign", camp.id, "the campaign")}>Turn campaign on</button>
              )}
              <a className="btn btn--ghost ads-btn-sm" href={amUrl.campaign(act, camp.id)} target="_blank" rel="noreferrer">View campaign in Meta ↗</a>
            </div>
          )}
        </div>

        {data && (
          <div className="tl-subrule" style={{ margin: "16px 0 0" }}>
            <span>In market</span>
            <span>· <b className={data.counts.running ? "tl-subrule--good" : undefined}>{data.counts.running}</b> running</span>
            <span>· <b>{data.counts.armed}</b> switched on, waiting{!campOn && data.counts.armed ? " for the campaign" : ""}</span>
            <span>· <b>{data.counts.off}</b> switched off</span>
            {(data.counts.review > 0 || data.counts.problem > 0) && <span>· <b>{data.counts.review + data.counts.problem}</b> in review / needs attention</span>}
            <span>· <b>{data.counts.total}</b> ads in the campaign</span>
          </div>
        )}
        {!campOn && data && data.counts.running === 0 && (
          <div className="cr-plain">
            <b>Plain English:</b> nothing is running and nothing is spending. To start Phase 1, turn on the 8 chosen ads below, then turn the campaign on. Ads that stay &ldquo;switched off&rdquo; will not run even when the campaign is on.
          </div>
        )}
        {data?.error && <div className="ads-notice ads-notice--warn" style={{ marginTop: 14, marginBottom: 0 }}>{data.error}</div>}
      </section>

      {/* ───── Ad sets ───── */}
      {data && data.adsets.length > 0 && camp && (
        <section className="ads-list">
          <div className="tl-subrule">Ad sets · Meta&rsquo;s word for an audience · {data.adsets.length}</div>
          <div className="ads-tablewrap">
            <table className="ads-table cr-table">
              <thead><tr><th>Ad set (exact Meta name)</th><th>Meta status</th><th>Ads</th><th>Running</th><th></th></tr></thead>
              <tbody>
                {data.adsets.map((s) => {
                  const on = s.status === "ACTIVE";
                  return (
                    <tr key={s.id}>
                      <td><div className="ads-table__name">{s.name}</div><div className="ads-table__sub">{s.id}</div></td>
                      <td><span className={`ads-pill ads-pill--${on ? "active" : "paused"}`}>{s.status}</span></td>
                      <td>{s.adCount}</td>
                      <td>{s.runningCount}</td>
                      <td className="ads-table__actions">
                        {on
                          ? <button type="button" className="btn btn--ghost ads-btn-xs" disabled={busy === s.id} onClick={() => void setStatus("adset", s.id, "PAUSED", `ad set “${s.name}”`)}>Turn off</button>
                          : <button type="button" className="btn btn--gold ads-btn-xs" disabled={busy === s.id} onClick={() => askOn("adset", s.id, `ad set “${s.name}”`)}>Turn on</button>}
                        <a className="btn btn--ghost ads-btn-xs" href={amUrl.adset(act, camp.id, s.id)} target="_blank" rel="noreferrer">View in Meta ↗</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ───── Ads, grouped by what they are actually doing, as Meta preview cards ───── */}
      {STATE_ORDER.filter((st) => grouped[st].length > 0).map((st) => {
        const n = grouped[st].reduce((k, g) => k + g.ads.length, 0);
        return (
          <section key={st} className={`cr-group cr-group--${st}`}>
            <div className={`tl-subrule${st === "running" ? " tl-subrule--good" : ""}`}>
              <span>{STATE_LABEL[st]} · <b>{n}</b> {n === 1 ? "ad" : "ads"} · {grouped[st].length} {grouped[st].length === 1 ? "creative" : "creatives"}</span>
              {st === "off" && !campOn && <span style={{ textTransform: "none", letterSpacing: 0 }}>· turning these on arms them; they run once the campaign is on</span>}
            </div>
            <div className="tl-ads">
              {grouped[st].map((g, i) => (
                <AdCard
                  key={g.key}
                  n={i + 1}
                  group={g}
                  bookPage={g.ads.map((a) => bookPages[a.id]).find((p) => p != null) ?? null}
                  previews={previews}
                  busy={busy}
                  onNeedPreview={loadPreview}
                  onOn={(a) => askOn("ad", a.id, `“${a.name}”`)}
                  onOff={(a) => void setStatus("ad", a.id, "PAUSED", `“${a.name}”`)}
                />
              ))}
            </div>
          </section>
        );
      })}
      {!loading && data && ads.length === 0 && !data.error && <div className="ads-hint">No ads in this campaign yet.</div>}

      {/* ───── Concepts: the 37 book ads, mirrored from the review page; each can go into Meta (paused) or come back out ───── */}
      <section className="ads-list" id="concepts">
        <div className="tl-subrule">
          <span>Concepts · <b>{sets.reduce((k, x) => k + x.ads.length, 0)}</b> book ads</span>
          <span>· <b>{liveByConcept.size}</b> in Meta</span>
          <span>· <b>{sets.reduce((k, x) => k + x.ads.length, 0) - liveByConcept.size}</b> on the bench</span>
        </div>
        <div className="tl-seg">
          {sets.map((s) => {
            const inMeta = s.ads.filter((c) => liveByConcept.has(c.n)).length;
            return (
              <button key={s.set} type="button" className={`btn btn--ghost ads-btn-xs${open === s.set ? " is-on" : ""}`} onClick={() => setOpen(s.set)}>
                {s.title} · {s.ads.length}{inMeta ? ` · ${inMeta} in Meta` : ""}
              </button>
            );
          })}
        </div>
        {sets.filter((s) => s.set === open).map((s) => (
          <div key={s.set}>
            <p className="cr-muted" style={{ fontSize: 13.5, margin: "0 0 12px", maxWidth: "64ch" }}>{s.goal}</p>
            <div className="tl-concepts">
              {s.ads.map((c) => (
                <ConceptCard
                  key={c.n}
                  concept={c}
                  live={liveByConcept.get(c.n) ?? []}
                  busy={busy}
                  onPutIn={() => setStage({ c, set: s })}
                  onOn={(a) => askOn("ad", a.id, `“${a.name}”`)}
                  onOff={(a) => void setStatus("ad", a.id, "PAUSED", `“${a.name}”`)}
                  onPullOut={askRemove}
                />
              ))}
            </div>
          </div>
        ))}
        <div className="ads-hint" style={{ marginTop: 12 }}>
          <b>Put in Meta</b> creates the ad in the campaign, <b>switched off</b>, under the same name you see here. It then also appears in the campaign list above. <b>Pull out</b> deletes it in Meta; the concept stays on the bench.
        </div>
      </section>

      {/* ───── Modals ───── */}
      {confirm && (
        <div className="ads-modal" role="dialog" aria-modal="true" onClick={() => setConfirm(null)}>
          <div className="ads-modal__card" onClick={(e) => e.stopPropagation()}>
            <h3>{confirm.title}</h3>
            <p className="cr-modal__p">{confirm.body}</p>
            <div className="ads-row" style={{ marginTop: 14 }}>
              <button type="button" className="btn btn--gold" onClick={() => { const r = confirm.run; setConfirm(null); void r(); }}>{confirm.cta}</button>
              <button type="button" className="btn btn--ghost" onClick={() => setConfirm(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}

      {stage && data && (
        <StageModal
          concept={stage.c}
          set={stage.set}
          plates={plates}
          adsets={data.adsets}
          onClose={() => setStage(null)}
          onDone={(next, name) => { setData(next); setStage(null); setNotice({ kind: "ok", text: `“${name}” is in the campaign, switched off.` }); }}
          onError={(t) => setNotice({ kind: "err", text: t })}
        />
      )}
    </div>
  );
}

/* One creative, rendered the way Meta renders it, with a row per ad set. */
function AdCard({ n, group, bookPage, previews, busy, onNeedPreview, onOn, onOff }: {
  n: number;
  group: CreativeGroup;
  bookPage: number | null;
  previews: PreviewCache;
  busy: string | null;
  onNeedPreview: (creativeId: string, format: PreviewFormat) => void;
  onOn: (a: InMarketAd) => void;
  onOff: (a: InMarketAd) => void;
}) {
  const lead = group.lead;
  const creativeId = lead.creativeId;
  const [format, setFormat] = useState<PreviewFormat>(DEFAULT_FORMAT);
  const [seen, setSeen] = useState(false);
  const ref = useRef<HTMLElement>(null);

  // Lazy: fetch the default placement the first time the card scrolls into view.
  useEffect(() => {
    const el = ref.current;
    if (!el || seen || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver((entries) => {
      if (entries.some((e) => e.isIntersecting)) { setSeen(true); io.disconnect(); }
    }, { rootMargin: "200px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, [seen]);
  useEffect(() => {
    if (seen && creativeId) onNeedPreview(creativeId, format);
  }, [seen, creativeId, format, onNeedPreview]);

  const cached = creativeId ? previews[cacheKey(creativeId, format)] : undefined;
  const placement = PLACEMENTS.find((p) => p.format === format) ?? PLACEMENTS[0];
  const whys = Array.from(new Set(group.ads.map((a) => a.why)));

  return (
    <article ref={ref} className="tl-ad" id={`ad-${lead.id}`}>
      <div className="tl-ad__top">
        <span className="tl-ad__n" title={lead.name}>{String(n).padStart(2, "0")} · {lead.name}</span>
        {bookPage != null && <span className="tl-ad__pg">book p.{bookPage}</span>}
        <span className={`ads-pill ads-pill--${STATE_PILL[lead.state]}`}>{STATE_LABEL[lead.state]} · {lead.effectiveStatus}</span>
      </div>

      {creativeId && (
        <div className="tl-ad__seg" role="tablist" aria-label="Placement">
          {PLACEMENTS.map((p) => (
            <button key={p.format} type="button" role="tab" aria-selected={p.format === format} className={p.format === format ? "is-on" : undefined} onClick={() => { setSeen(true); setFormat(p.format); }}>
              {p.label}
            </button>
          ))}
        </div>
      )}

      <div className="tl-ad__stage" style={{ minHeight: Math.min(placement.height + 28, 420) }}>
        {!creativeId ? (
          <Thumb src={lead.thumbnailUrl} className="tl-ad__thumb" empty={<div className="tl-ad__loading">No creative on this ad</div>} />
        ) : cached?.state === "ok" && cached.src ? (
          <iframe src={cached.src} title={`Meta preview · ${lead.name} · ${placement.label}`} className="tl-ad__frame" style={{ width: placement.width, height: placement.height }} scrolling="no" />
        ) : cached?.state === "error" || (cached?.state === "ok" && !cached.src) ? (
          <div>
            <Thumb src={lead.thumbnailUrl} className="tl-ad__thumb" empty={<></>} />
            <div className="tl-ad__loading">Meta preview unavailable</div>
          </div>
        ) : (
          <div>
            <Thumb src={lead.thumbnailUrl} className="tl-ad__thumb" empty={<></>} />
            <div className="tl-ad__loading">{seen ? "Loading Meta preview…" : "Meta preview"}</div>
          </div>
        )}
      </div>

      <div className="tl-ad__b">
        <div className="tl-ad__hl">{lead.headline || "—"}</div>
        {lead.description && <div className="ads-table__sub">{lead.description}</div>}
        {whys.length === 1 && <div className="tl-ad__why">{whys[0]}</div>}
        <div className="tl-ad__rows">
          {group.ads.map((a) => {
            const on = a.status === "ACTIVE";
            return (
              <div key={a.id} className="tl-ad__row" title={a.name}>
                <span className={`ads-pill ads-pill--${on ? "active" : "paused"}`}>{a.status}</span>
                <span className="tl-ad__aud">{a.adsetName}</span>
                <span className="tl-ad__act">
                  {on
                    ? <button type="button" className="btn btn--ghost ads-btn-xs" disabled={busy === a.id} onClick={() => onOff(a)}>Turn off</button>
                    : <button type="button" className="btn btn--gold ads-btn-xs" disabled={busy === a.id} onClick={() => onOn(a)}>Turn on</button>}
                  <a className="tl-link" href={a.adsManagerUrl} target="_blank" rel="noreferrer">View ad in Meta ↗</a>
                </span>
                <span className="tl-ad__meta">
                  <span className="tl-ad__aid">{a.id}</span>
                  <span className="tl-ad__nums">
                    {a.insights
                      ? `${money(a.insights.spend)} spent · ${a.insights.clicks} clicks · ${pct(a.insights.ctr)} CTR${a.insights.cpc ? ` · ${money(a.insights.cpc)}/click` : ""}`
                      : "· no delivery yet"}
                  </span>
                </span>
                {whys.length > 1 && <span className="tl-ad__rowwhy">{a.why}</span>}
              </div>
            );
          })}
        </div>
      </div>
    </article>
  );
}

function StageModal({ concept, set, plates, adsets, onClose, onDone, onError }: {
  concept: Concept;
  set: ConceptSet;
  plates: Props["plates"];
  adsets: InMarket["adsets"];
  onClose: () => void;
  onDone: (next: InMarket, name: string) => void;
  onError: (text: string) => void;
}) {
  const [name, setName] = useState(conceptAdName(concept));
  const [headline, setHeadline] = useState(concept.t);
  const [message, setMessage] = useState(concept.pt);
  const [description, setDescription] = useState(concept.d);
  const [imageUrl, setImageUrl] = useState(plates.some((p) => p.src === concept.plate.src) ? concept.plate.src : (plates[0]?.src ?? ""));
  const [adsetId, setAdsetId] = useState(adsets[0]?.id ?? "");
  const [saving, setSaving] = useState(false);

  async function submit() {
    setSaving(true);
    try {
      const next = await api<InMarket>("/api/creator/ads/stage", { method: "POST", json: { name, headline, message, description, imageUrl, adsetId } });
      onDone(next, name);
    } catch (e) {
      onError(errText(e));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="ads-modal" role="dialog" aria-modal="true" onClick={onClose}>
      <div className="ads-modal__card cr-modal cr-modal--wide" onClick={(e) => e.stopPropagation()}>
        <div className="tl-eyebrow">Concept → Meta</div>
        <h3>Put in Meta, switched off</h3>
        <p className="cr-modal__p">Concept #{String(concept.n).padStart(2, "0")} · {set.title}. Goes into the book campaign <b>switched off</b>, with the plate the review used ({concept.plate.label} · p.{concept.plate.page}). Same name here and in Ads Manager.</p>
        <label className="ads-label">Ad name (what you will see in Meta)</label>
        <input className="ads-input" value={name} onChange={(e) => setName(e.target.value)} />
        <div className="cr-form2">
          <div>
            <label className="ads-label">Plate (in the book only)</label>
            <select className="ads-input" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}>
              {plates.map((p) => <option key={p.src} value={p.src}>{p.label}{p.page ? ` · p.${p.page}` : ""}</option>)}
            </select>
          </div>
          <div>
            <label className="ads-label">Ad set (audience)</label>
            <select className="ads-input" value={adsetId} onChange={(e) => setAdsetId(e.target.value)}>
              {adsets.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
        </div>
        <label className="ads-label">Headline</label>
        <input className="ads-input" value={headline} onChange={(e) => setHeadline(e.target.value)} />
        <label className="ads-label">Primary text</label>
        <textarea className="ads-input" rows={4} value={message} onChange={(e) => setMessage(e.target.value)} />
        <label className="ads-label">Description</label>
        <input className="ads-input" value={description} onChange={(e) => setDescription(e.target.value)} />
        <div className="ads-row" style={{ marginTop: 14 }}>
          <button type="button" className="btn btn--gold" disabled={saving || !imageUrl || !adsetId} onClick={() => void submit()}>{saving ? "Putting in Meta…" : "Put in Meta, switched off"}</button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}

/* One concept rendered as the ad it will be — mirror of the review page — with its Meta state. */
function ConceptCard({ concept: c, live, busy, onPutIn, onOn, onOff, onPullOut }: {
  concept: Concept;
  live: InMarketAd[];
  busy: string | null;
  onPutIn: () => void;
  onOn: (a: InMarketAd) => void;
  onOff: (a: InMarketAd) => void;
  onPullOut: (a: InMarketAd) => void;
}) {
  const inMeta = live.length > 0;
  const running = live.filter((a) => a.state === "running").length;
  return (
    <article className={`tl-concept${inMeta ? " is-live" : ""}`} id={`concept-${c.n}`}>
      <div className="tl-concept__bar">
        <span className="tl-concept__n">#{String(c.n).padStart(2, "0")}</span>
        {inMeta
          ? <span className={`ads-pill ads-pill--${running ? "active" : "paused"}`}>{running ? `In Meta · ${running} running` : `In Meta · ${live.length} switched off`}</span>
          : <span className="ads-pill ads-pill--bench">Not in Meta</span>}
        <span className="tl-concept__plate">{c.plate.label} · p.{c.plate.page}</span>
      </div>

      <div className="tl-fb">
        <div className="tl-fb__top">
          <div className="tl-fb__avatar">RC</div>
          <div><div className="tl-fb__page">Robert Castellino Photography, LLC</div><div className="tl-fb__sp">Sponsored · <span>{conceptAdName(c)}</span></div></div>
        </div>
        <div className="tl-fb__pt">{c.pt}</div>
        <div className="tl-fb__img">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={c.plate.src} alt={c.plate.label} loading="lazy" />
        </div>
        <div className="tl-fb__link">
          <div><div className="tl-fb__dom">ROBERTCASTELLINO.COM</div><div className="tl-fb__hl">{c.t}</div><div className="tl-fb__d">{c.d}</div></div>
          <span className="tl-fb__btn">Shop now</span>
        </div>
      </div>

      <div className="tl-concept__acts">
        {!inMeta && <button type="button" className="btn btn--gold ads-btn-xs" onClick={onPutIn}>Put in Meta (switched off)</button>}
        {live.map((a) => {
          const on = a.status === "ACTIVE";
          return (
            <div key={a.id} className="tl-ad__row" title={a.name}>
              <span className={`ads-pill ads-pill--${on ? "active" : "paused"}`}>{a.status}</span>
              <span className="tl-ad__aud">{a.adsetName}</span>
              <span className="tl-ad__act">
                {on
                  ? <button type="button" className="btn btn--ghost ads-btn-xs" disabled={busy === a.id} onClick={() => onOff(a)}>Turn off</button>
                  : <button type="button" className="btn btn--gold ads-btn-xs" disabled={busy === a.id} onClick={() => onOn(a)}>Turn on</button>}
                <button type="button" className="btn btn--ghost ads-btn-xs" disabled={busy === a.id} onClick={() => onPullOut(a)}>Pull out of Meta</button>
                <a className="tl-link" href={a.adsManagerUrl} target="_blank" rel="noreferrer">View in Meta ↗</a>
              </span>
              <span className="tl-ad__meta"><span className="tl-ad__aid">{a.id}</span><span className="tl-ad__nums">{a.why}</span></span>
            </div>
          );
        })}
        {inMeta && <button type="button" className="btn btn--ghost ads-btn-xs" onClick={onPutIn}>Put in another audience</button>}
      </div>
    </article>
  );
}
