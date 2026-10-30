"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Notice, { type NoticeState } from "@/components/creator/Notice";
import Thumb from "@/components/creator/Thumb";
import { api, errText } from "@/lib/creator/client";
import type { Concept, ConceptSet } from "@/lib/creator/concepts";
import type { AdState, InMarket, InMarketAd } from "@/lib/creator/in-market";

/*
  Paid social — the control room for Bob's book campaign.

  Same structure and same words as Meta Ads Manager (Campaign → Ad sets → Ads,
  Meta's status strings shown verbatim) so nothing is lost flipping between
  the two. Every level has a direct "Open in Ads Manager" link. Turning
  anything ON asks for one confirmation because it can start spending.
*/

interface Props {
  sets: ConceptSet[];
  plates: { src: string; label: string; page: number | null }[];
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

const amUrl = {
  campaign: (act: string, id: string) => `https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=${act}&selected_campaign_ids=${id}`,
  adset: (act: string, campaignId: string, id: string) => `https://adsmanager.facebook.com/adsmanager/manage/adsets?act=${act}&selected_campaign_ids=${campaignId}&selected_adset_ids=${id}`,
};

export default function PaidSocialClient({ sets, plates }: Props) {
  const [data, setData] = useState<InMarket | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [preview, setPreview] = useState<{ ad: InMarketAd; src: string | null } | null>(null);
  const [confirm, setConfirm] = useState<Confirm | null>(null);
  const [open, setOpen] = useState<string>(sets[0]?.set ?? "");
  const [stage, setStage] = useState<{ c: Concept; set: ConceptSet } | null>(null);

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

  async function showPreview(ad: InMarketAd) {
    if (!ad.creativeId) return;
    setPreview({ ad, src: null });
    try {
      const p = await api<{ src: string | null }>(`/api/creator/ads/preview?creativeId=${ad.creativeId}`);
      setPreview({ ad, src: p.src });
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
      setPreview(null);
    }
  }

  const ads = useMemo(() => data?.ads ?? [], [data]);
  const grouped = useMemo(() => {
    const g: Record<AdState, InMarketAd[]> = { running: [], armed: [], off: [], review: [], problem: [] };
    for (const a of ads) g[a.state].push(a);
    return g;
  }, [ads]);
  const camp = data?.campaign ?? null;
  const campOn = camp?.status === "ACTIVE";
  const act = data?.account ?? "";

  return (
    <div className="cr-paid">
      <Notice notice={notice} onClose={() => setNotice(null)} />

      {/* ───── Campaign ───── */}
      <section className="cr-camp">
        <div className="cr-camp__row">
          <div className="cr-camp__label">Campaign</div>
          <div className="cr-camp__main">
            <h2>{camp?.name ?? (loading ? "Loading…" : "—")}</h2>
            {camp && (
              <div className="cr-camp__meta">
                Meta says <code>{camp.status}</code> · objective <code>{metaWord(camp.objective)}</code>
                {camp.dailyBudget != null && <> · budget <b>{money(camp.dailyBudget)}/day</b> shared across all ad sets</>}
                {" · "}
                <a href={amUrl.campaign(act, camp.id)} target="_blank" rel="noreferrer">Open in Ads Manager ↗</a>
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
            </div>
          )}
        </div>

        {data && (
          <div className="cr-tally">
            <div className={`cr-tally__cell${data.counts.running ? " is-on" : ""}`}><b>{data.counts.running}</b><span>running now</span></div>
            <div className="cr-tally__cell"><b>{data.counts.armed}</b><span>switched on, waiting{!campOn && data.counts.armed ? " for the campaign" : ""}</span></div>
            <div className="cr-tally__cell"><b>{data.counts.off}</b><span>switched off</span></div>
            {(data.counts.review > 0 || data.counts.problem > 0) && (
              <div className="cr-tally__cell cr-tally__cell--warn"><b>{data.counts.review + data.counts.problem}</b><span>in review / needs attention</span></div>
            )}
            <div className="cr-tally__cell cr-tally__cell--muted"><b>{data.counts.total}</b><span>ads in the campaign</span></div>
            <div className="cr-tally__refresh">
              {data.fetchedAt && <span className="ads-hint" style={{ margin: 0 }}>as of {new Date(data.fetchedAt).toLocaleTimeString()}</span>}
              <button type="button" className="btn btn--ghost ads-btn-sm" disabled={loading} onClick={() => { setLoading(true); void load(true); }}>{loading ? "Loading…" : "Refresh from Meta"}</button>
            </div>
          </div>
        )}
        {!campOn && data && data.counts.running === 0 && (
          <div className="cr-plain">
            <b>Plain English:</b> nothing is running and nothing is spending. To start Phase 1, turn on the 8 chosen ads below, then turn the campaign on. Ads that stay &ldquo;switched off&rdquo; will not run even when the campaign is on.
          </div>
        )}
        {data?.error && <div className="ads-notice ads-notice--warn">{data.error}</div>}
      </section>

      {/* ───── Ad sets ───── */}
      {data && data.adsets.length > 0 && camp && (
        <section className="ads-list">
          <header className="ads-list__head"><h2>Ad sets <span className="cr-muted cr-h2sub">· Meta&rsquo;s word for an audience</span></h2></header>
          <div className="ads-tablewrap">
            <table className="ads-table cr-table">
              <thead><tr><th>Ad set (exact Meta name)</th><th>Meta status</th><th>Ads</th><th>Running</th><th></th></tr></thead>
              <tbody>
                {data.adsets.map((s) => {
                  const on = s.status === "ACTIVE";
                  return (
                    <tr key={s.id}>
                      <td><div className="ads-table__name">{s.name}</div><div className="ads-table__sub">{s.id}</div></td>
                      <td><span className={`ads-pill ads-pill--${on ? "active" : "paused"}`}>{metaWord(s.status)}</span></td>
                      <td>{s.adCount}</td>
                      <td>{s.runningCount}</td>
                      <td className="ads-table__actions">
                        {on
                          ? <button type="button" className="btn btn--ghost ads-btn-xs" disabled={busy === s.id} onClick={() => void setStatus("adset", s.id, "PAUSED", `ad set “${s.name}”`)}>Turn off</button>
                          : <button type="button" className="btn btn--gold ads-btn-xs" disabled={busy === s.id} onClick={() => askOn("adset", s.id, `ad set “${s.name}”`)}>Turn on</button>}
                        <a className="btn btn--ghost ads-btn-xs" href={amUrl.adset(act, camp.id, s.id)} target="_blank" rel="noreferrer">Ads Manager ↗</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {/* ───── Ads, grouped by what they are actually doing ───── */}
      {STATE_ORDER.filter((st) => grouped[st].length > 0).map((st) => (
        <section key={st} className={`ads-list cr-group cr-group--${st}`}>
          <header className="ads-list__head">
            <h2><span className={`ads-pill ads-pill--${STATE_PILL[st]} cr-pill-lg`}>{STATE_LABEL[st]}</span> <span className="cr-muted cr-h2sub">{grouped[st].length} {grouped[st].length === 1 ? "ad" : "ads"}</span></h2>
            {st === "off" && !campOn && <span className="ads-hint" style={{ margin: 0 }}>Turning these on arms them; they run once the campaign is on.</span>}
          </header>
          <div className="ads-tablewrap">
            <table className="ads-table cr-table">
              <thead><tr><th></th><th>Ad (exact Meta name)</th><th>Ad set</th><th>Headline</th><th>Meta status</th><th>Last 7 days</th><th></th></tr></thead>
              <tbody>
                {grouped[st].map((a) => {
                  const on = a.status === "ACTIVE";
                  return (
                    <tr key={a.id}>
                      <td><Thumb src={a.thumbnailUrl} /></td>
                      <td><div className="ads-table__name">{a.name}</div><div className="ads-table__sub">{a.id}</div></td>
                      <td className="ads-table__sub">{a.adsetName}</td>
                      <td><div>{a.headline}</div>{a.description && <div className="ads-table__sub">{a.description}</div>}</td>
                      <td>
                        <span className={`ads-pill ads-pill--${STATE_PILL[a.state]}`}>{metaWord(a.effectiveStatus)}</span>
                        <div className="ads-table__sub cr-why">{a.why}</div>
                      </td>
                      <td className="cr-nums">
                        {a.insights
                          ? <>{money(a.insights.spend)} spent<br />{a.insights.clicks} clicks · {pct(a.insights.ctr)} CTR<br />{a.insights.cpc ? `${money(a.insights.cpc)} per click` : ""}</>
                          : <span className="ads-table__sub">no delivery yet</span>}
                      </td>
                      <td className="ads-table__actions">
                        {on
                          ? <button type="button" className="btn btn--ghost ads-btn-xs" disabled={busy === a.id} onClick={() => void setStatus("ad", a.id, "PAUSED", `“${a.name}”`)}>Turn off</button>
                          : <button type="button" className="btn btn--gold ads-btn-xs" disabled={busy === a.id} onClick={() => askOn("ad", a.id, `“${a.name}”`)}>Turn on</button>}
                        {a.creativeId && <button type="button" className="btn btn--ghost ads-btn-xs" onClick={() => void showPreview(a)}>Preview</button>}
                        <a className="btn btn--ghost ads-btn-xs" href={a.adsManagerUrl} target="_blank" rel="noreferrer">Ads Manager ↗</a>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      ))}
      {!loading && data && ads.length === 0 && !data.error && <div className="ads-hint">No ads in this campaign yet.</div>}

      {/* ───── Concepts → paused ads ───── */}
      <section className="ads-list">
        <header className="ads-list__head">
          <h2>Concepts <span className="cr-muted cr-h2sub">· on the bench, not in Meta yet</span></h2>
        </header>
        <div className="ads-row" style={{ marginBottom: 12 }}>
          {sets.map((s) => (
            <button key={s.set} type="button" className={`btn btn--ghost ads-btn-xs${open === s.set ? " is-on" : ""}`} onClick={() => setOpen(s.set)}>
              {s.set} · {s.ads.length}
            </button>
          ))}
        </div>
        {sets.filter((s) => s.set === open).map((s) => (
          <div key={s.set}>
            <p className="cr-muted" style={{ fontFamily: "var(--sans)", fontSize: 14 }}>{s.goal}</p>
            <div className="cr-concepts">
              {s.ads.map((c) => (
                <article key={c.n} className="cr-concept">
                  <div className="ads-table__sub">#{c.n}</div>
                  <h3>{c.t}</h3>
                  <p>{c.pt}</p>
                  <div className="ads-table__sub">{c.d}</div>
                  <button type="button" className="btn btn--gold ads-btn-xs" onClick={() => setStage({ c, set: s })}>Create as paused ad</button>
                </article>
              ))}
            </div>
          </div>
        ))}
        <div className="ads-hint">Creating puts a real ad into the campaign, <b>switched off</b>. It shows up in &ldquo;Switched off&rdquo; above with its Meta id, and nothing spends until you turn it on.</div>
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

      {preview && (
        <div className="ads-modal" role="dialog" aria-modal="true" onClick={() => setPreview(null)}>
          <div className="ads-modal__card cr-modal--wide" onClick={(e) => e.stopPropagation()}>
            <h3>{preview.ad.name}</h3>
            {preview.src ? <iframe src={preview.src} title="Meta ad preview" className="ads-metapreview__frame" /> : <div className="ads-hint">Loading Meta preview…</div>}
            <div className="ads-row" style={{ marginTop: 12 }}><button className="btn btn--ghost" onClick={() => setPreview(null)}>Close</button></div>
          </div>
        </div>
      )}
    </div>
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
  const [name, setName] = useState(`Book · ${set.set}${String(concept.n).padStart(2, "0")} · ${concept.t}`);
  const [headline, setHeadline] = useState(concept.t);
  const [message, setMessage] = useState(concept.pt);
  const [description, setDescription] = useState(concept.d);
  const [imageUrl, setImageUrl] = useState(plates[0]?.src ?? "");
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
        <h3>Create as paused ad</h3>
        <p className="cr-modal__p">Goes into the book campaign <b>switched off</b>. Same name here and in Ads Manager.</p>
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
          <button type="button" className="btn btn--gold" disabled={saving || !imageUrl || !adsetId} onClick={() => void submit()}>{saving ? "Creating in Meta…" : "Create, switched off"}</button>
          <button type="button" className="btn btn--ghost" onClick={onClose}>Cancel</button>
        </div>
      </div>
    </div>
  );
}
