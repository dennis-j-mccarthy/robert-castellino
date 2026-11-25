"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { api, download, errText } from "@/lib/creator/client";
import { openPanel } from "@/components/creator/TwoAccordion";
import { studio } from "@/studio.config";

export type Card = { id: string; title: string; date: string; img: string | null; excerpt: string; published: boolean; starred: boolean; usedIn: string | null };

/*
  The card grid + the newsletter popup.
  Star = include in the next issue (only for published pieces not already
  sent in one). Make newsletter → popup: the starred pieces in a list you
  drag into order, a preamble with ✦ Suggest, and Save as HTML, which builds
  the issue through the newsletter generator, saves it as a draft (it then
  shows on Email → Newsletter) and downloads the HTML file.
*/

export default function MusingCardsClient({ cards: initial, db, ai }: { cards: Card[]; db: boolean; ai: boolean }) {
  const [cards, setCards] = useState(initial);
  const [open, setOpen] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const live = cards.filter((c) => c.published).length;
  const starred = cards.filter((c) => c.starred);

  async function toggleStar(c: Card) {
    const next = !c.starred;
    setCards((l) => l.map((x) => (x.id === c.id ? { ...x, starred: next } : x)));
    try { await api("/api/creator/blog/star", { method: "POST", json: { id: c.id, starred: next } }); }
    catch (e) { setErr(errText(e)); setCards((l) => l.map((x) => (x.id === c.id ? { ...x, starred: !next } : x))); }
  }

  return (
    <section className="mc" aria-labelledby="mc-title">
      <div className="mc__head">
        <h2 id="mc-title">Your blog posts <span className="cr-h2sub">· {live} live{cards.length - live ? ` · ${cards.length - live} draft${cards.length - live === 1 ? "" : "s"}` : ""}{starred.length ? ` · ${starred.length} starred for the newsletter` : ""}</span></h2>
        <div className="ads-row">
          <button type="button" className="btn btn--gold ads-btn-xs" disabled={!db || !starred.length} onClick={() => setOpen(true)} title={starred.length ? "" : "Star a post first"}>Make newsletter{starred.length ? ` (${starred.length})` : ""}</button>
          <Link className="btn btn--ghost ads-btn-xs" href="/creator/blog/posts">Manage all →</Link>
        </div>
      </div>
      {err && <p className="au-err">{err}</p>}
      <div className="mc__grid">
        <button type="button" className="mc__card mc__card--new" onClick={() => openPanel("write")}><span className="mc__plus">+</span><b>New blog post</b><span>Open the writer, from a note or from nothing.</span></button>
        {cards.map((c) => (
          <article key={c.id} className={`mc__card${c.starred ? " is-starred" : ""}`}>
            <div className="mc__img">
              {c.img ? <img src={c.img} alt="" loading="lazy" /> : <span className="mc__noimg">No picture yet</span>}
              <span className={`mc__state${c.published ? " is-live" : ""}`}>{c.published ? "Live" : "Draft"}</span>
              {c.published && db && (c.usedIn ? (
                <span className="mc__star is-used" title={c.usedIn}>In issue</span>
              ) : (
                <button type="button" className={`mc__star${c.starred ? " is-on" : ""}`} aria-pressed={c.starred} title={c.starred ? "Starred for the next newsletter" : "Star for the next newsletter"} onClick={() => void toggleStar(c)}>{c.starred ? "★" : "☆"}</button>
              ))}
            </div>
            <div className="mc__body">
              <b>{c.title}</b>
              <span className="mc__date">{c.date}</span>
              <p>{c.excerpt}</p>
              <div className="mc__actions">
                <Link className="btn ads-btn-xs" href={`${studio.brand.blog.managePath ?? "/creator/blog/posts"}#${c.id}`}>Edit</Link>
                <Link className="btn ads-btn-xs" href={`/creator/social?musingId=${c.id}${c.img ? `&imageId=${encodeURIComponent(c.img)}` : ""}`}>Posts</Link>
                {c.published && <a className="btn btn--ghost ads-btn-xs" href={`${studio.brand.blog.path}/${c.id}`} target="_blank" rel="noreferrer">View ↗</a>}
              </div>
            </div>
          </article>
        ))}
      </div>
      {open && <NewsletterModal items={starred} ai={ai} onClose={() => setOpen(false)} />}
    </section>
  );
}

/* ───────── the popup ───────── */

function NewsletterModal({ items: initial, ai, onClose }: { items: Card[]; ai: boolean; onClose: () => void }) {
  const [items, setItems] = useState(initial);
  const [preamble, setPreamble] = useState("");
  const [opts, setOpts] = useState<string[]>([]);
  const [busy, setBusy] = useState<"suggest" | "save" | null>(null);
  const [drag, setDrag] = useState<string | null>(null);
  const [done, setDone] = useState<{ subject: string; id: string } | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [html, setHtml] = useState<string>("");
  const [ctas, setCtas] = useState<Record<string, { label: string; url: string }>>({});
  const [ctaOpen, setCtaOpen] = useState<Record<string, boolean>>({});
  const [cta, setCta] = useState<{ label: string; url: string }>({ label: "", url: "" });
  const ctaPayload = () => ({ ctas: items.map((i) => ({ musingId: i.id, ...(ctas[i.id] ?? { label: "", url: "" }) })), cta });
  const [previewing, setPreviewing] = useState(false);
  const previewSeq = useRef(0);

  // The picture on the right: re-rendered (deterministic copy, no model) 350ms after any drag or keystroke.
  useEffect(() => {
    const seq = ++previewSeq.current;
    const t = setTimeout(() => {
      if (!items.length) { setHtml(""); setPreviewing(false); return; }
      setPreviewing(true);
      api<{ html: string }>("/api/creator/email/preview", { method: "POST", json: { musingIds: items.map((i) => i.id), intro: preamble, ...ctaPayload() } })
        .then((r) => { if (seq === previewSeq.current) setHtml(r.html); })
        .catch(() => undefined)
        .finally(() => { if (seq === previewSeq.current) setPreviewing(false); });
    }, 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, preamble, ctas, cta]);

  function move(fromId: string, toId: string) {
    if (fromId === toId) return;
    setItems((l) => { const a = [...l]; const i = a.findIndex((x) => x.id === fromId); const j = a.findIndex((x) => x.id === toId); const [it] = a.splice(i, 1); a.splice(j, 0, it); return a; });
  }
  async function suggest() {
    setBusy("suggest"); setErr(null);
    try { const r = await api<{ options: string[] }>("/api/creator/essence/suggest", { method: "POST", json: { kind: "preamble", titles: items.map((i) => i.title), current: preamble } }); setOpts(r.options); }
    catch (e) { setErr(errText(e)); } finally { setBusy(null); }
  }
  async function save() {
    setBusy("save"); setErr(null);
    try {
      const r = await api<{ draft: { id: string; subject: string; html: string } }>("/api/creator/email/generate", { method: "POST", json: { musingIds: items.map((i) => i.id), intro: preamble, ...ctaPayload() } });
      const file = `newsletter-${new Date().toISOString().slice(0, 10)}.html`;
      download(file, r.draft.html, "text/html");
      setDone({ subject: r.draft.subject, id: r.draft.id });
    } catch (e) { setErr(errText(e)); } finally { setBusy(null); }
  }

  return (
    <div className="ads-modal lb__modal" role="dialog" aria-modal="true" aria-label="Make newsletter" onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="ads-modal__card lb__card-modal nl">
        <button type="button" className="lb__close" aria-label="Close" onClick={onClose}>×</button>
        <h3 className="nl__h">Make newsletter</h3>
        <p className="au-exp">Drag the pieces into the order you want and open the issue in a few lines. The issue on the right redraws as you go. Save as HTML writes the subject lines and blurbs, keeps a copy, and downloads the file.</p>
        <div className="nl__grid nl__grid--3">
          <div className="nl__left">
          <div>
            <label className="es-label">Pieces · {items.length} · drag to reorder</label>
            <ul className="nl__list">
              {items.map((it, i) => (
                <li key={it.id} draggable={!ctaOpen[it.id]} className={`nl__item${drag === it.id ? " is-drag" : ""}`}
                  onDragStart={() => setDrag(it.id)} onDragEnd={() => setDrag(null)}
                  onDragOver={(e) => { e.preventDefault(); if (drag) move(drag, it.id); }}>
                  <span className="nl__grip" aria-hidden="true">⋮⋮</span>
                  <span className="nl__n">{i + 1}</span>
                  {it.img ? <img src={it.img} alt="" /> : <span className="nl__noimg" />}
                  <span className="nl__t"><b>{it.title}</b><small>{it.date}{i === 0 ? " · lead piece, its picture is the hero" : ""}</small></span>
                  <span className="nl__item-actions">
                    <button type="button" className={`nl__ctabtn${ctas[it.id]?.label && ctas[it.id]?.url ? " is-on" : ""}`} onClick={() => setCtaOpen((o) => ({ ...o, [it.id]: !o[it.id] }))} title="Add a button under this piece">{ctas[it.id]?.label && ctas[it.id]?.url ? "Button ✓" : "+ Button"}</button>
                    <button type="button" className="es-msg__x" aria-label="Remove from this issue" onClick={() => setItems((l) => l.filter((x) => x.id !== it.id))}>×</button>
                  </span>
                  {ctaOpen[it.id] && (
                    <span className="nl__cta" onPointerDown={(e) => e.stopPropagation()}>
                      <input className="ads-input" placeholder="Button says… (e.g. See the print)" value={ctas[it.id]?.label ?? ""} onChange={(e) => setCtas((c) => ({ ...c, [it.id]: { label: e.target.value, url: c[it.id]?.url ?? "" } }))} />
                      <input className="ads-input" placeholder="and goes to… (link)" value={ctas[it.id]?.url ?? ""} onChange={(e) => setCtas((c) => ({ ...c, [it.id]: { label: c[it.id]?.label ?? "", url: e.target.value } }))} />
                    </span>
                  )}
                </li>
              ))}
              {!items.length && <li className="au-muted">Nothing left in this issue. Close and star a post.</li>}
            </ul>
          </div>
          <div>
            <div className="es-field__head"><label className="es-label">Preamble · {studio.site.owner} opens the issue</label>{ai && <button type="button" className="es-suggest" disabled={busy !== null || !items.length} onClick={() => void suggest()}><span aria-hidden="true">✦</span> {busy === "suggest" ? "Thinking…" : "Suggest"}</button>}</div>
            <textarea className="ads-input" rows={7} value={preamble} placeholder="Where you've been, what the light did, why these pieces sit together…" onChange={(e) => setPreamble(e.target.value)} />
            {opts.length > 0 && (
              <div className="es-options">
                {opts.map((o) => <button key={o} type="button" className="es-option" onClick={() => { setPreamble(o); setOpts([]); }}>{o}</button>)}
                <button type="button" className="es-option es-option--quiet" onClick={() => setOpts([])}>Keep mine</button>
              </div>
            )}
            <div className="es-field__head" style={{ marginTop: 14 }}><label className="es-label">One button for the whole issue · optional</label></div>
            <div className="nl__cta nl__cta--whole">
              <input className="ads-input" placeholder="Button says… (e.g. Order the signed book)" value={cta.label} onChange={(e) => setCta((c) => ({ ...c, label: e.target.value }))} />
              <input className="ads-input" placeholder="and goes to… (link)" value={cta.url} onChange={(e) => setCta((c) => ({ ...c, url: e.target.value }))} />
            </div>
            <p className="es-hint">Leave the preamble blank and the studio writes the opening. Subject lines, blurbs and the sign-off are written when you save; the preview shows each piece&rsquo;s own excerpt until then.</p>
          </div>
          </div>
          <div className="nl__preview">
            <div className="nl__preview-h"><span>The issue</span>{previewing && <small>redrawing…</small>}</div>
            <div className="nl__frame">
              {html ? <iframe title="Newsletter preview" srcDoc={html} sandbox="" /> : <div className="nl__frame-empty">Add a piece to see the issue.</div>}
            </div>
          </div>
        </div>
        {err && <p className="au-err">{err}</p>}
        {done ? (
          <div className="ap__caption"><b>Saved and downloaded.</b><p>&ldquo;{done.subject}&rdquo; is now a draft. <Link href="/creator/newsletter">Open the saved copy →</Link></p></div>
        ) : (
          <div className="ads-row" style={{ marginTop: 14 }}>
            <button type="button" className="btn btn--gold ads-btn-sm" disabled={busy !== null || !items.length} onClick={() => void save()}>{busy === "save" ? "Building…" : "Save as HTML"}</button>
            <button type="button" className="btn ads-btn-sm" onClick={onClose}>Cancel</button>
          </div>
        )}
      </div>
    </div>
  );
}
