"use client";

import { useCallback, useEffect, useState } from "react";
import Notice, { type NoticeState } from "@/components/creator/Notice";
import Thumb from "@/components/creator/Thumb";
import { api, errText } from "@/lib/creator/client";
import { adsMakerPrefillUrl, type ConceptSet } from "@/lib/creator/concepts";
import type { InMarket, InMarketAd } from "@/lib/creator/in-market";

interface Props {
  sets: ConceptSet[];
  plates: { src: string; label: string; page: number | null }[];
}

const pillFor = (s: string) =>
  s === "ACTIVE" ? "active" : s === "PAUSED" || s === "ADSET_PAUSED" || s === "CAMPAIGN_PAUSED" ? "paused" : s === "DISAPPROVED" ? "failed" : "submitted";

export default function PaidSocialClient({ sets, plates }: Props) {
  const [data, setData] = useState<InMarket | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [preview, setPreview] = useState<{ ad: InMarketAd; src: string | null } | null>(null);
  const [plate, setPlate] = useState<string>("");
  const [open, setOpen] = useState<string>(sets[0]?.set ?? "");

  // State changes only inside promise callbacks (external-system sync).
  const load = useCallback((refresh = false) => {
    return api<InMarket>(`/api/creator/ads/in-market${refresh ? "?refresh=1" : ""}`)
      .then(setData)
      .catch((e: unknown) => setNotice({ kind: "err", text: errText(e) }))
      .finally(() => setLoading(false));
  }, []);
  useEffect(() => {
    void load();
  }, [load]);

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

  const ads = data?.ads ?? [];
  const paused = ads.filter((a) => a.effectiveStatus !== "ACTIVE").length;

  return (
    <div className="cr-paid">
      <Notice notice={notice} onClose={() => setNotice(null)} />

      {/* In market */}
      <section className="ads-list" style={{ marginTop: 0 }}>
        <header className="ads-list__head">
          <h2>In market</h2>
          <div className="ads-row">
            {data?.fetchedAt && <span className="ads-hint" style={{ margin: 0 }}>as of {new Date(data.fetchedAt).toLocaleTimeString()}</span>}
            <button type="button" className="btn btn--ghost ads-btn-sm" disabled={loading} onClick={() => { setLoading(true); void load(true); }}>{loading ? "Loading…" : "Refresh"}</button>
          </div>
        </header>
        {data?.campaign && (
          <div className="ads-hint" style={{ marginBottom: 10 }}>
            <b>{data.campaign.name}</b> · <span className={`ads-pill ads-pill--${pillFor(data.campaign.status)}`}>{data.campaign.status.toLowerCase()}</span> · {data.campaign.objective.replace(/_/g, " ").toLowerCase()} · {ads.length} ads ({paused} paused) · account <code>act_{data.account}</code>
          </div>
        )}
        {data?.error && <div className="ads-notice ads-notice--warn">{data.error}</div>}
        {!loading && !ads.length && !data?.error && <div className="ads-hint">No ads in this campaign.</div>}
        {ads.length > 0 && (
          <div className="ads-tablewrap">
            <table className="ads-table">
              <thead><tr><th></th><th>Ad</th><th>Ad set</th><th>Headline</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {ads.map((a) => (
                  <tr key={a.id}>
                    <td><Thumb src={a.thumbnailUrl} /></td>
                    <td><div className="ads-table__name">{a.name}</div><div className="ads-table__sub">{a.id}</div></td>
                    <td className="ads-table__sub">{a.adsetName || a.adsetId}</td>
                    <td><div>{a.headline}</div>{a.description && <div className="ads-table__sub">{a.description}</div>}</td>
                    <td><span className={`ads-pill ads-pill--${pillFor(a.effectiveStatus)}`}>{a.effectiveStatus.replace(/_/g, " ").toLowerCase()}</span></td>
                    <td className="ads-table__actions">
                      {a.creativeId && <button type="button" className="btn btn--ghost ads-btn-xs" onClick={() => void showPreview(a)}>Preview</button>}
                      <a className="btn btn--ghost ads-btn-xs" href={a.adsManagerUrl} target="_blank" rel="noreferrer">Ads Manager ↗</a>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        <div className="ads-hint">Read-only. Pausing, activating and duplicating happen in the <a href="/admin/ads">Ads maker</a> or Ads Manager.</div>
      </section>

      {/* Concepts */}
      <section className="ads-list">
        <header className="ads-list__head">
          <h2>Concepts</h2>
          <div className="ads-row">
            <label className="ads-label" style={{ margin: 0 }}>Stage with plate</label>
            <select className="ads-input ads-input--sm" value={plate} onChange={(e) => setPlate(e.target.value)}>
              <option value="">— let the Ads maker pick (in-book) —</option>
              {plates.map((p) => <option key={p.src} value={p.src}>{p.label}{p.page ? ` · p.${p.page}` : ""}</option>)}
            </select>
          </div>
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
                  <a className="btn btn--gold ads-btn-xs" href={adsMakerPrefillUrl(c, s.set, plate || undefined)}>Stage in Ads maker</a>
                </article>
              ))}
            </div>
          </div>
        ))}
        <div className="ads-hint">Staging opens the Ads maker with the copy filled in. Nothing is created until you pick an ad set there, and even then it is created <em>paused</em>.</div>
      </section>

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
