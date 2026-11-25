"use client";

import { useMemo, useState } from "react";
import { openPanel } from "@/components/creator/TwoAccordion";
import { RSA_LIMITS, planIssues, type AdCampaign, type AdGroup, type AdsPlan } from "@/lib/creator/ads-plan-types";
import { api, errText } from "@/lib/creator/client";
import { studio } from "@/studio.config";

/*
  The Google Ads plan, editable. Generate writes the whole thing from the
  keywords and Essence; every field is yours after that. Save keeps it;
  Download gives the Google Ads Editor sheet. Nothing here touches the
  Google Ads account itself — that is the upload step, done by hand.
*/

type Page = { slug: string; keyword: string; title: string; published: boolean };
type Props = { initial: AdsPlan; pages: Page[]; targets: number; issues?: string[]; db: boolean; ai: boolean };

const uid = () => Math.random().toString(36).slice(2, 8);
const linesOf = (s: string) => s.split(/\n|,/).map((x) => x.trim()).filter(Boolean);

export default function GoogleAdsPlan({ initial, pages, targets, db, ai }: Props) {
  const [plan, setPlan] = useState<AdsPlan>(initial);
  const [budget, setBudget] = useState(20);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<string | null>(null);
  const [open, setOpen] = useState<string | null>(null);
  const [dirty, setDirty] = useState(false);
  const issues = useMemo(() => planIssues(plan, new Set(pages.filter((p) => p.published).map((p) => p.slug))), [plan, pages]); // live, not the page-load snapshot
  const pageBySlug = useMemo(() => new Map(pages.map((p) => [p.slug, p])), [pages]);

  const update = (fn: (p: AdsPlan) => AdsPlan) => { setPlan((p) => fn(structuredClone(p))); setDirty(true); };
  const setCampaign = (ci: number, patch: Partial<AdCampaign>) => update((p) => { Object.assign(p.campaigns[ci], patch); return p; });
  const setGroup = (ci: number, gi: number, patch: Partial<AdGroup>) => update((p) => { Object.assign(p.campaigns[ci].adGroups[gi], patch); return p; });
  const setRsa = (ci: number, gi: number, patch: Partial<AdGroup["rsa"]>) => update((p) => { Object.assign(p.campaigns[ci].adGroups[gi].rsa, patch); return p; });

  async function generate() {
    setBusy("generate"); setMsg(null);
    try {
      const r = await api<{ plan: AdsPlan }>("/api/creator/google-ads/plan/generate", { method: "POST", json: { dailyBudget: budget, note } });
      setPlan(r.plan); setDirty(false); setOpen(r.plan.campaigns[0]?.adGroups[0]?.id ?? null);
      setMsg(`Planned ${r.plan.campaigns.reduce((n, c) => n + c.adGroups.length, 0)} ad groups. Read every line, then Save.`);
    } catch (e) { setMsg(errText(e)); } finally { setBusy(null); }
  }
  async function save() {
    setBusy("save"); setMsg(null);
    try { const r = await api<{ plan: AdsPlan }>("/api/creator/google-ads/plan", { method: "PUT", json: { plan } }); setPlan(r.plan); setDirty(false); setMsg("Saved."); }
    catch (e) { setMsg(errText(e)); } finally { setBusy(null); }
  }
  function addGroup(ci: number) {
    update((p) => { p.campaigns[ci].adGroups.push({ id: `group-${uid()}`, name: "New ad group", intent: "", keywords: [], negatives: [], landingSlug: null, landingKeyword: "", rsa: { headlines: [], descriptions: [], path1: "", path2: "" }, enabled: true }); return p; });
  }
  function addCampaign() {
    update((p) => { p.campaigns.push({ id: `campaign-${uid()}`, name: "Search campaign", dailyBudget: budget, locations: "", negatives: [], adGroups: [] }); return p; });
  }

  const total = plan.campaigns.reduce((n, c) => n + c.dailyBudget, 0);
  const groups = plan.campaigns.reduce((n, c) => n + c.adGroups.length, 0);

  return (
    <div className="gp">
      <section className="kw-card gp__make">
        <h2>Plan the campaign</h2>
        <p className="ui-hint">{targets ? `${targets} target keyword${targets === 1 ? "" : "s"} from Keywords` : "No target keywords yet — mark some in Keywords first, or let the plan propose them"} · {pages.length} landing page{pages.length === 1 ? "" : "s"}. The plan groups the keywords, writes one responsive search ad per group in your voice, and pairs each group with a landing page.</p>
        <div className="gp__make-row">
          <label className="ui-label">Daily budget, all campaigns</label>
          <div className="ui-row">
            <span className="gp__usd">$</span>
            <input className="ui-input ui-input--sm" type="number" min={5} max={1000} value={budget} onChange={(e) => setBudget(Number(e.target.value) || 20)} />
            <input className="ui-input" placeholder="steer it (optional): a season, a product, a place to lean on" value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="button" className="btn btn--gold" disabled={!ai || !db || !!busy} onClick={() => void generate()}>{busy === "generate" ? "Planning…" : plan.campaigns.length ? "✦ Plan it again" : "✦ Plan the campaign"}</button>
          </div>
        </div>
        {msg && <p className="ld-msg">{msg}</p>}
      </section>

      {plan.campaigns.length > 0 && (
        <>
          <div className="gp__bar">
            <b>{plan.campaigns.length} campaign{plan.campaigns.length === 1 ? "" : "s"} · {groups} ad groups · ${total.toFixed(0)}/day</b>
            <span className="ui-row">
              <a className="btn btn--ghost ui-btn-sm" href="/api/creator/google-ads/plan/export">Download the upload sheet</a>
              <button type="button" className={`btn ui-btn-sm${dirty ? " btn--gold" : ""}`} disabled={!dirty || !!busy} onClick={() => void save()}>{busy === "save" ? "Saving…" : dirty ? "Save changes" : "Saved"}</button>
            </span>
          </div>
          {issues.length > 0 && (
            <div className="ui-notice ui-notice--warn gp__issues">
              <b>Before this goes up</b>
              <ul>{issues.slice(0, 8).map((x, i) => <li key={i}>{x}</li>)}</ul>
              {issues.length > 8 && <small>and {issues.length - 8} more</small>}
            </div>
          )}

          {plan.campaigns.map((c, ci) => (
            <section key={c.id} className="kw-card gp__campaign">
              <div className="gp__chead">
                <input className="gp__cname" value={c.name} onChange={(e) => setCampaign(ci, { name: e.target.value })} aria-label="Campaign name" />
                <label className="gp__budget">$<input type="number" min={1} value={c.dailyBudget} onChange={(e) => setCampaign(ci, { dailyBudget: Number(e.target.value) || 1 })} aria-label="Daily budget" />/day</label>
              </div>
              <div className="ui-row--2">
                <div><label className="ui-label">Where the ads show</label><input className="ui-input" value={c.locations} placeholder="Colorado · Denver · Boulder" onChange={(e) => setCampaign(ci, { locations: e.target.value })} /></div>
                <div><label className="ui-label">Campaign negatives (one per line or comma)</label><textarea className="ui-input" rows={2} value={c.negatives.join(", ")} onChange={(e) => setCampaign(ci, { negatives: linesOf(e.target.value) })} /></div>
              </div>

              <ul className="gp__groups">
                {c.adGroups.map((g, gi) => {
                  const page = g.landingSlug ? pageBySlug.get(g.landingSlug) : null;
                  const on = open === g.id;
                  return (
                    <li key={g.id} className={`gp__group${g.enabled ? "" : " is-off"}`}>
                      <button type="button" className="gp__ghead" onClick={() => setOpen(on ? null : g.id)} aria-expanded={on}>
                        <b>{g.name}</b>
                        <small>{g.keywords.length} keywords · {g.rsa.headlines.length}/{RSA_LIMITS.headlines} headlines · {page ? (page.published ? "page live" : "page draft") : "no page"}</small>
                        <span className="pa__ctl">{on ? "Close" : "Open"}</span>
                      </button>
                      {on && (
                        <div className="gp__gbody">
                          <div className="ui-row--2">
                            <div><label className="ui-label">Ad group name</label><input className="ui-input" value={g.name} onChange={(e) => setGroup(ci, gi, { name: e.target.value })} /></div>
                            <div><label className="ui-label">Who is searching, and for what</label><input className="ui-input" value={g.intent} onChange={(e) => setGroup(ci, gi, { intent: e.target.value })} /></div>
                          </div>
                          <div className="ui-row--2">
                            <div>
                              <label className="ui-label">Keywords (one per line · add | exact, | phrase or | broad)</label>
                              <textarea className="ui-input ld-body" rows={8} value={g.keywords.map((k) => `${k.text} | ${k.match}`).join("\n")} onChange={(e) => setGroup(ci, gi, { keywords: e.target.value.split("\n").map((l) => l.trim()).filter(Boolean).map((l) => { const [t, m] = l.split("|").map((x) => x.trim().toLowerCase()); return { text: t, match: (m === "exact" || m === "broad" ? m : "phrase") as AdGroup["keywords"][number]["match"] }; }) })} />
                            </div>
                            <div>
                              <label className="ui-label">Group negatives</label>
                              <textarea className="ui-input" rows={3} value={g.negatives.join(", ")} onChange={(e) => setGroup(ci, gi, { negatives: linesOf(e.target.value) })} />
                              <label className="ui-label">Landing page</label>
                              <select className="ui-input" value={g.landingSlug ?? ""} onChange={(e) => setGroup(ci, gi, { landingSlug: e.target.value || null })}>
                                <option value="">— none yet (ads go to {studio.offer.path}) —</option>
                                {pages.map((p) => <option key={p.slug} value={p.slug}>/for/{p.slug} · {p.keyword}{p.published ? "" : " · draft"}</option>)}
                              </select>
                              {!g.landingSlug && (
                                <p className="ui-hint">Write one for &ldquo;{g.landingKeyword || g.keywords[0]?.text || g.name}&rdquo;: <button type="button" className="ui-linkbtn" onClick={() => { const kw = g.landingKeyword || g.keywords[0]?.text || ""; window.history.replaceState(null, "", `/creator/search?open=landing&keyword=${encodeURIComponent(kw)}`); openPanel("landing"); }}>open Landing pages</button>, then come back and pick it here.</p>
                              )}
                              <label className="ui-label">Display path</label>
                              <div className="ui-row"><span className="ui-hint" style={{ marginTop: 0 }}>{studio.site.domain}/</span><input className="ui-input ui-input--sm" maxLength={RSA_LIMITS.path} value={g.rsa.path1} onChange={(e) => setRsa(ci, gi, { path1: e.target.value })} /><span>/</span><input className="ui-input ui-input--sm" maxLength={RSA_LIMITS.path} value={g.rsa.path2} onChange={(e) => setRsa(ci, gi, { path2: e.target.value })} /></div>
                            </div>
                          </div>

                          <label className="ui-label">Headlines ({g.rsa.headlines.length} of {RSA_LIMITS.headlines} · 30 characters each)</label>
                          <div className="gp__lines">
                            {Array.from({ length: RSA_LIMITS.headlines }).map((_, i) => {
                              const v = g.rsa.headlines[i] ?? "";
                              return <div key={i} className={`gp__line${v.length > RSA_LIMITS.headline ? " is-over" : ""}`}><input value={v} placeholder={i < 8 ? "needed" : "optional"} onChange={(e) => { const h = [...g.rsa.headlines]; h[i] = e.target.value; setRsa(ci, gi, { headlines: h.filter((x, j) => x || j < h.length - 1) }); }} /><small>{v.length}</small></div>;
                            })}
                          </div>
                          <label className="ui-label">Descriptions ({g.rsa.descriptions.length} of {RSA_LIMITS.descriptions} · 90 characters each)</label>
                          <div className="gp__lines gp__lines--wide">
                            {Array.from({ length: RSA_LIMITS.descriptions }).map((_, i) => {
                              const v = g.rsa.descriptions[i] ?? "";
                              return <div key={i} className={`gp__line${v.length > RSA_LIMITS.description ? " is-over" : ""}`}><textarea rows={2} value={v} placeholder={i < 2 ? "needed" : "optional"} onChange={(e) => { const d = [...g.rsa.descriptions]; d[i] = e.target.value; setRsa(ci, gi, { descriptions: d }); }} /><small>{v.length}</small></div>;
                            })}
                          </div>
                          <div className="ui-row gp__gfoot">
                            <label className="lb__check"><input type="checkbox" checked={g.enabled} onChange={(e) => setGroup(ci, gi, { enabled: e.target.checked })} /> Enabled in the upload</label>
                            <button type="button" className="ui-linkbtn" onClick={() => update((p) => { p.campaigns[ci].adGroups.splice(gi, 1); return p; })}>Remove this group</button>
                          </div>
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
              <div className="ui-row"><button type="button" className="btn btn--ghost ui-btn-xs" onClick={() => addGroup(ci)}>+ Ad group</button></div>
            </section>
          ))}
          <div className="ui-row"><button type="button" className="btn btn--ghost ui-btn-xs" onClick={addCampaign}>+ Campaign</button></div>

          <section className="kw-card">
            <h2>How to run it</h2>
            <textarea className="ui-input" rows={4} value={plan.notes} onChange={(e) => update((p) => { p.notes = e.target.value; return p; })} />
            <h3 className="gp__h3">Getting it into Google Ads</h3>
            <ol className="gp__steps">
              <li>Save, then <b>Download the upload sheet</b>.</li>
              <li>In Google Ads Editor: Account → Import → From file, pick the sheet, review, Post. Or in Google Ads on the web: Tools → Bulk actions → Uploads → upload the file → Preview → Apply.</li>
              <li>Everything arrives <b>paused</b>. Set location targeting and the conversion action, then enable one campaign.</li>
              <li>Only turn it on after the new-advertiser credit shows as redeemed under Billing → Promotions; spend before that does not count.</li>
            </ol>
          </section>
        </>
      )}
    </div>
  );
}
