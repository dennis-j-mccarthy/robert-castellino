"use client";

import { studio } from "@/studio.config";

import { useState } from "react";
import type { LandingSections } from "@/lib/creator/landing";
import { api, errText } from "@/lib/creator/client";

type Faq = { q: string; a: string };
type Page = {
  slug: string; keyword: string; title: string; metaDescription: string; h1: string; intro: string; body: string;
  faq: Faq[]; heroImage: string | null; heroAlt: string | null; published: boolean; createdAt: string; updatedAt: string;
  sections: LandingSections | null;
};
type Kw = { phrase: string; kind: string; priority: number; landingSlug: string | null };
type Plate = { src: string; title: string; loc: string | null };

export default function LandingClient({ initialPages, keywords, plates, preselect, ai, db }: { initialPages: Page[]; keywords: Kw[]; plates: Plate[]; preselect: string; ai: boolean; db: boolean }) {
  const [pages, setPages] = useState<Page[]>(initialPages);
  const [keyword, setKeyword] = useState(preselect || keywords.find((k) => !k.landingSlug)?.phrase || "");
  const [custom, setCustom] = useState("");
  const [open, setOpen] = useState<string | null>(null);
  const [busy, setBusy] = useState("");
  const [msg, setMsg] = useState("");

  const phrase = custom.trim() || keyword;

  async function generate() {
    if (!phrase) return;
    setBusy("make"); setMsg("Writing the page, about a minute…");
    try {
      const d = await api<{ page: Page }>("/api/creator/landing", { method: "POST", json: { keyword: phrase } });
      const page: Page = { ...d.page, faq: (d.page.faq ?? []) as Faq[], sections: (d.page.sections ?? null) as LandingSections | null, createdAt: String(d.page.createdAt), updatedAt: String(d.page.updatedAt) };
      setPages((ps) => [page, ...ps]);
      setOpen(page.slug);
      setCustom("");
      setMsg("Written. Preview it, change anything that does not sound like you, then Publish.");
    } catch (e) { setMsg(errText(e)); } finally { setBusy(""); }
  }
  function local(slug: string, p: Partial<Page>) { setPages((ps) => ps.map((x) => (x.slug === slug ? { ...x, ...p } : x))); }
  async function save(slug: string, p: Partial<Page>) {
    setBusy(`save:${slug}`); setMsg("");
    try { await api(`/api/creator/landing/${slug}`, { method: "PATCH", json: p }); local(slug, p); setMsg(p.published === true ? "Published. It is live and in the sitemap." : p.published === false ? "Unpublished. Only you can see it now." : "Saved."); }
    catch (e) { setMsg(errText(e)); } finally { setBusy(""); }
  }
  async function remove(slug: string) {
    if (!window.confirm("Delete this landing page? If it was published, the address stops working.")) return;
    setBusy(`del:${slug}`);
    try { await api(`/api/creator/landing/${slug}`, { method: "DELETE" }); setPages((ps) => ps.filter((p) => p.slug !== slug)); }
    catch (e) { setMsg(errText(e)); } finally { setBusy(""); }
  }

  const without = keywords.filter((k) => !pages.some((p) => p.keyword === k.phrase));

  return (
    <div className="ld">
      <section className="kw-card ld-new">
        <h2>Write a new landing page</h2>
        <p className="ui-hint">Pick a phrase from Keywords, or type one. Gift phrases first. About a minute.</p>
        <div className="ld-new__row">
          <select className="ui-input" value={keyword} onChange={(e) => { setKeyword(e.target.value); setCustom(""); }}>
            {keyword && !without.some((k) => k.phrase === keyword) && <option value={keyword}>{keyword}</option>}
            {without.map((k) => <option key={k.phrase} value={k.phrase}>{k.phrase} · {k.kind}</option>)}
          </select>
          <span className="ld-new__or">or</span>
          <input className="ui-input" placeholder="type a phrase people search" value={custom} onChange={(e) => setCustom(e.target.value)} />
          <button type="button" className="btn btn--gold" disabled={!phrase || !!busy || !ai || !db} onClick={() => void generate()}>{busy === "make" ? "Writing the page…" : "✦ Make the page"}</button>
        </div>
        <p className="ui-hint">The page gets a headline in the searcher&rsquo;s words, one of your pictures at the top, why this is for them, what they get, how it works, the story, questions and answers, and a button that leads to {studio.offer.path}.</p>
        {msg && <p className="ld-msg">{msg}</p>}
      </section>

      <ul className="ld-list">
        {pages.length === 0 && <li className="ui-hint">No landing pages yet.</li>}
        {pages.map((p) => (
          <li key={p.slug} className="kw-card ld-item">
            <button type="button" className="ld-item__head" onClick={() => setOpen(open === p.slug ? null : p.slug)} aria-expanded={open === p.slug}>
              <span className={`seo-pill ${p.published ? "is-pass" : "is-warn"}`}>{p.published ? "LIVE" : "DRAFT"}</span>
              <b>{p.h1}</b>
              <span className="ui-hint">/for/{p.slug} · for &ldquo;{p.keyword}&rdquo;</span>
            </button>
            {open === p.slug && (
              <div className="ld-edit">
                <div className="ld-edit__grid">
                  <div className="ld-fields">
                    <label className="ui-label">Page title (shown in Google)</label><input className="ui-input" value={p.title} onChange={(e) => local(p.slug, { title: e.target.value })} />
                    <label className="ui-label">Description (under the title in Google)</label><textarea className="ui-input" rows={2} value={p.metaDescription} onChange={(e) => local(p.slug, { metaDescription: e.target.value })} />
                    <label className="ui-label">Headline</label><input className="ui-input" value={p.h1} onChange={(e) => local(p.slug, { h1: e.target.value })} />
                    <label className="ui-label">Opening</label><textarea className="ui-input" rows={3} value={p.intro} onChange={(e) => local(p.slug, { intro: e.target.value })} />
                    {p.sections && <SectionsEditor s={p.sections} onChange={(sections) => local(p.slug, { sections })} />}
                    <label className="ui-label">Body (## makes a subheading)</label><textarea className="ui-input ld-body" rows={14} value={p.body} onChange={(e) => local(p.slug, { body: e.target.value })} />
                    <label className="ui-label">Questions and answers</label>
                    <div className="ld-faq">
                      {p.faq.map((f, i) => (
                        <div key={i} className="ld-faq__item">
                          <input className="ui-input" value={f.q} onChange={(e) => local(p.slug, { faq: p.faq.map((x, j) => (j === i ? { ...x, q: e.target.value } : x)) })} />
                          <textarea className="ui-input" rows={2} value={f.a} onChange={(e) => local(p.slug, { faq: p.faq.map((x, j) => (j === i ? { ...x, a: e.target.value } : x)) })} />
                        </div>
                      ))}
                    </div>
                  </div>
                  <div className="ld-side">
                    <div className="ld-hero">
                      {p.heroImage ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={p.heroImage} alt={p.heroAlt ?? ""} />
                      ) : <div className="ui-hint">No plate chosen</div>}
                    </div>
                    <label className="ui-label">Hero plate</label>
                    <select className="ui-input" value={p.heroImage ?? ""} onChange={(e) => { const pl = plates.find((x) => x.src === e.target.value); local(p.slug, { heroImage: e.target.value || null, heroAlt: pl ? `${pl.title}${pl.loc ? `, ${pl.loc}` : ""}` : p.heroAlt }); }}>
                      <option value="">— none —</option>
                      {plates.map((pl) => <option key={pl.src} value={pl.src}>{pl.title}{pl.loc ? ` · ${pl.loc}` : ""}</option>)}
                    </select>
                    <label className="ui-label">Picture description (alt text)</label>
                    <textarea className="ui-input" rows={2} value={p.heroAlt ?? ""} onChange={(e) => local(p.slug, { heroAlt: e.target.value })} />
                    <p className="ui-hint">Always one of your real plates. Nothing is generated.</p>
                  </div>
                </div>
                <div className="ui-row ld-actions">
                  <button type="button" className="btn btn--gold ui-btn-sm" disabled={!!busy} onClick={() => void save(p.slug, { title: p.title, metaDescription: p.metaDescription, h1: p.h1, intro: p.intro, body: p.body, faq: p.faq, heroImage: p.heroImage, heroAlt: p.heroAlt, ...(p.sections ? { sections: p.sections } : {}) })}>{busy === `save:${p.slug}` ? "Saving…" : "Save changes"}</button>
                  <a className="btn ui-btn-sm" href={`/for/${p.slug}`} target="_blank" rel="noreferrer">{p.published ? "View page ↗" : "Preview ↗"}</a>
                  <button type="button" className={`btn ui-btn-sm${p.published ? "" : " btn--gold"}`} disabled={!!busy} onClick={() => void save(p.slug, { published: !p.published })}>{p.published ? "Unpublish" : "Publish"}</button>
                  <button type="button" className="btn btn--ghost ui-btn-xs ld-del" disabled={!!busy} onClick={() => void remove(p.slug)}>Delete</button>
                </div>
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

function SectionsEditor({ s, onChange }: { s: LandingSections; onChange: (s: LandingSections) => void }) {
  const set = (p: Partial<LandingSections>) => onChange({ ...s, ...p });
  const pairs = (key: "benefits" | "steps", label: string) => (
    <div>
      <label className="ui-label">{label}</label>
      <div className="ld-pairs">
        {s[key].map((b, i) => (
          <div key={i} className="ld-pair">
            <input className="ui-input" value={b.title} onChange={(e) => set({ [key]: s[key].map((x, j) => (j === i ? { ...x, title: e.target.value } : x)) })} />
            <textarea className="ui-input" rows={3} value={b.text} onChange={(e) => set({ [key]: s[key].map((x, j) => (j === i ? { ...x, text: e.target.value } : x)) })} />
          </div>
        ))}
      </div>
    </div>
  );
  return (
    <div className="ld-sections">
      <label className="ui-label">Small line above the headline</label><input className="ui-input" value={s.eyebrow} onChange={(e) => set({ eyebrow: e.target.value })} />
      <label className="ui-label">Why this is for them (under the headline)</label><textarea className="ui-input" rows={2} value={s.valueProp} onChange={(e) => set({ valueProp: e.target.value })} />
      {pairs("benefits", "What you get")}
      {pairs("steps", "How it works")}
      <div className="ui-row--2">
        <div><label className="ui-label">Invitation</label><input className="ui-input" value={s.ctaHeadline} onChange={(e) => set({ ctaHeadline: e.target.value })} /></div>
        <div><label className="ui-label">Button text</label><input className="ui-input" value={s.ctaButton} onChange={(e) => set({ ctaButton: e.target.value })} /></div>
      </div>
    </div>
  );
}
