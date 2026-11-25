"use client";

import Link from "next/link";
import { useState } from "react";
import { Badges } from "@/components/creator/ImageGrid";
import { api, errText } from "@/lib/creator/client";
import type { LibraryItem, PicturePost } from "@/lib/creator/library";
import { studio } from "@/studio.config";
import { pillarTagClsFor, type CoreMessage, type Pillar } from "@/lib/creator/pillars";

/*
  The picture popup. Fields are held locally; nothing is written until Save.
  Describe with AI fills the fields (and offers a caption) but does not save
  either — Bob reads, fixes, then saves. Discard puts the card back.
*/

type Fields = Pick<LibraryItem, "title" | "loc" | "blurb" | "pillarId" | "messageId">;
type Described = { title: string; loc: string; blurb: string; pillarId: string; caption: string; confidence: string };

const pick = (i: LibraryItem): Fields => ({ title: i.title, loc: i.loc, blurb: i.blurb, pillarId: i.pillarId, messageId: i.messageId });
const same = (a: Fields, b: Fields) => (["title", "loc", "blurb", "pillarId", "messageId"] as const).every((k) => (a[k] ?? "") === (b[k] ?? ""));

type Long = { title: string; excerpt: string; body: string };

export default function PictureCard({ item, pillars, messages, db, ai, post, onClose, onSaved, onLongSaved, onError }: {
  item: LibraryItem; pillars: Pillar[]; messages: CoreMessage[]; db: boolean; ai: boolean;
  /** The post already saved from this picture (its recipe, its story), if one */
  post?: PicturePost | null;
  onClose: () => void; onSaved: (patch: Fields) => void; onLongSaved?: (post: PicturePost) => void; onError: (text: string) => void;
}) {
  const fp = studio.brand.blog.fromPicture;
  const singular = studio.brand.blog.singular.toLowerCase();
  const [long, setLong] = useState<Long | null>(null);
  const [expanding, setExpanding] = useState(false);
  const [savingLong, setSavingLong] = useState(false);
  const [saved, setSaved] = useState<Fields>(pick(item));
  const [f, setF] = useState<Fields>(pick(item));
  const [busy, setBusy] = useState(false);
  const [describing, setDescribing] = useState(false);
  const [caption, setCaption] = useState<{ text: string; confidence: string } | null>(null);
  const dirty = !same(f, saved);
  const set = (p: Partial<Fields>) => setF((prev) => ({ ...prev, ...p }));
  const pillarMessages = messages.filter((m) => !f.pillarId || m.pillar === f.pillarId);

  async function save() {
    setBusy(true);
    try {
      await api("/api/creator/library", { method: "PATCH", json: { src: item.src, ...f } });
      setSaved(f);
      onSaved(f);
    } catch (e) {
      onError(errText(e));
    } finally {
      setBusy(false);
    }
  }

  async function describe() {
    setDescribing(true);
    setCaption(null);
    try {
      const out = await api<Described>("/api/creator/library/describe", { method: "POST", json: { src: item.src } });
      set({ title: out.title, loc: out.loc, blurb: out.blurb, pillarId: out.pillarId || null, messageId: null });
      setCaption({ text: out.caption, confidence: out.confidence });
    } catch (e) {
      onError(errText(e));
    } finally {
      setDescribing(false);
    }
  }

  async function expand() {
    setExpanding(true);
    try {
      const out = await api<{ title: string; excerpt: string; paragraphs: string[] }>("/api/creator/library/expand", { method: "POST", json: { src: item.src, title: f.title, blurb: f.blurb } });
      setLong({ title: out.title, excerpt: out.excerpt, body: out.paragraphs.join("\n\n") });
    } catch (e) {
      onError(errText(e));
    } finally {
      setExpanding(false);
    }
  }

  async function saveLong(publish: boolean) {
    if (!long || !fp) return;
    const paragraphs = long.body.split(/\n{2,}/).map((x) => x.trim()).filter(Boolean);
    if (!long.title.trim() || !paragraphs.length) { onError(`The ${fp.noun} needs a title and some text.`); return; }
    setSavingLong(true);
    try {
      const r = await api<{ id: string; published: boolean; url: string }>("/api/creator/blog/save", { method: "POST", json: { id: post?.id, title: long.title.trim(), excerpt: long.excerpt.trim(), paragraphs, img: item.src, loc: f.loc || null, category: fp.category ?? null, pillarId: f.pillarId ?? null, published: publish } });
      onLongSaved?.({ id: r.id, title: long.title.trim(), url: r.url, published: r.published });
      setLong(null);
    } catch (e) {
      onError(errText(e));
    } finally {
      setSavingLong(false);
    }
  }

  function close() {
    if ((dirty || long) && !window.confirm("You have unsaved changes on this picture. Close without saving?")) return;
    onClose();
  }

  return (
    <div className="ui-modal lb__modal" role="dialog" aria-modal="true" aria-label={item.title ?? item.label} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="ui-modal__card lb__card-modal">
        <button type="button" className="lb__close" aria-label="Close" onClick={close}>×</button>
        <div className="lb__mgrid">
          <div className="lb__mimg">
            {/* eslint-disable-next-line @next/next/no-img-element -- library preview */}
            <img src={item.src} alt={item.title ?? item.label} />
            <div className="ui-row" style={{ marginTop: 8 }}><Badges item={item} /></div>
            <div className="lb__path"><span>{item.collection.replace(/-/g, " ")}</span> · <span>{item.source === "both" ? "gallery + ad manifest" : item.source === "photo" ? "gallery" : "ad manifest"}</span></div>
            {item.mockup && <div className="ui-notice ui-notice--err" style={{ marginTop: 10 }}>This is an AI mockup of the book. It is never used in ads or posts — the real plates are.</div>}
          </div>
          <div className="lb__mform">
            {ai && !item.mockup && (!f.title ? (
              <div className="ap__blank">
                <b>No caption yet.</b>
                <span>Let the studio look at the picture and write the title, place and blurb. You read them, fix anything, then Save.</span>
                <button type="button" className="btn btn--gold ui-btn-sm" disabled={!db || busy || describing} onClick={() => void describe()}>{describing ? "Looking at the picture…" : "✦ Make a caption with AI"}</button>
              </div>
            ) : (
              <div className="ap__describe">
                <button type="button" className="btn btn--gold ui-btn-xs" disabled={!db || busy || describing} onClick={() => void describe()}>{describing ? "Looking…" : "✦ Describe again with AI"}</button>
                <span>Rewrites the fields from the picture. Read them, then Save.</span>
              </div>
            ))}
            {caption && (
              <div className="ap__caption">
                <b>A caption, ready for a post</b>{caption.confidence !== "high" && <small> · place is a {caption.confidence} guess, check it</small>}
                <p>{caption.text}</p>
                <Link className="btn ui-btn-xs" href={`/creator/social?imageId=${encodeURIComponent(item.src)}&caption=${encodeURIComponent(caption.text)}${f.pillarId ? `&pillar=${f.pillarId}` : ""}`}>Use it in a post</Link>
              </div>
            )}
            <label className="ui-label">Title</label>
            <input className="ui-input" value={f.title ?? ""} disabled={!db || busy} onChange={(e) => set({ title: e.target.value })} />
            <label className="ui-label">Place</label>
            <input className="ui-input" value={f.loc ?? ""} disabled={!db || busy} onChange={(e) => set({ loc: e.target.value })} />
            <label className="ui-label">Blurb</label>
            <textarea className="ui-input" rows={3} value={f.blurb ?? ""} disabled={!db || busy} onChange={(e) => set({ blurb: e.target.value })} />
            <div className="ui-row--2">
              <div>
                <label className="ui-label">Pillar</label>
                <select className="ui-input" value={f.pillarId ?? ""} disabled={!db || busy} onChange={(e) => set({ pillarId: e.target.value || null, messageId: null })}>
                  <option value="">— none —</option>
                  {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="ui-label">Core message</label>
                <select className="ui-input" value={f.messageId ?? ""} disabled={!db || busy} onChange={(e) => set({ messageId: e.target.value || null })}>
                  <option value="">— none —</option>
                  {pillarMessages.map((m) => <option key={m.id} value={m.id}>{m.text}</option>)}
                </select>
              </div>
            </div>
            {f.pillarId && <div style={{ marginTop: 8 }}><span className={pillarTagClsFor(pillars, f.pillarId)}>{pillars.find((p) => p.id === f.pillarId)?.name}</span></div>}

            <div className={`lb__savebar${dirty ? " is-dirty" : ""}`}>
              {dirty ? (
                <>
                  <span className="lb__savebar__msg">Unsaved changes</span>
                  <button type="button" className="btn btn--gold ui-btn-sm" disabled={busy || !db} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</button>
                  <button type="button" className="btn ui-btn-sm" disabled={busy} onClick={() => { setF(saved); setCaption(null); }}>Discard</button>
                </>
              ) : (
                <span className="lb__savebar__msg is-ok">Saved</span>
              )}
            </div>

            {fp && !item.mockup && (
              <div className="lb__long">
                <div className="lb__long__head"><b>{fp.title}</b>{post && !long && <span className={`seo-pill ${post.published ? "is-pass" : "is-warn"}`}>{post.published ? "LIVE" : "DRAFT"}</span>}</div>
                {long ? (
                  <>
                    <label className="ui-label">Title</label>
                    <input className="ui-input" value={long.title} disabled={savingLong} onChange={(e) => setLong({ ...long, title: e.target.value })} />
                    <label className="ui-label">Summary (shown in the {studio.brand.blog.label} list)</label>
                    <textarea className="ui-input" rows={2} value={long.excerpt} disabled={savingLong} onChange={(e) => setLong({ ...long, excerpt: e.target.value })} />
                    <label className="ui-label">The {fp.noun} (## starts a subheading, - starts a list item)</label>
                    <textarea className="ui-input ld-body" rows={18} value={long.body} disabled={savingLong} onChange={(e) => setLong({ ...long, body: e.target.value })} />
                    <div className="ui-row" style={{ marginTop: 10 }}>
                      <button type="button" className="btn btn--gold ui-btn-sm" disabled={savingLong || !db} onClick={() => void saveLong(false)}>{savingLong ? "Saving…" : post ? `Update the ${singular}` : `Save as a draft ${singular}`}</button>
                      <button type="button" className="btn ui-btn-sm" disabled={savingLong} onClick={() => void expand()}>{expanding ? "Writing…" : "✦ Write it again"}</button>
                      <button type="button" className="btn btn--ghost ui-btn-sm" disabled={savingLong} onClick={() => setLong(null)}>Discard</button>
                    </div>
                    <p className="ui-hint">Saved as a draft on {studio.brand.blog.path} with this picture on top. Publish it from {studio.brand.blog.label}.</p>
                  </>
                ) : post ? (
                  <div className="ui-row">
                    <span className="ui-hint" style={{ marginTop: 0 }}>Saved as the {singular} &ldquo;{post.title}&rdquo;.</span>
                    <Link className="btn ui-btn-xs" href={studio.brand.blog.managePath ?? "/creator/blog"}>Edit in {studio.brand.blog.label}</Link>
                    <a className="btn btn--ghost ui-btn-xs" href={post.url} target="_blank" rel="noreferrer">{post.published ? "View" : "Preview"} ↗</a>
                    {ai && <button type="button" className="ui-linkbtn" disabled={expanding || !db} onClick={() => void expand()}>{expanding ? "Writing…" : "Write it again"}</button>}
                  </div>
                ) : (
                  <div className="ap__blank">
                    <span>Let the studio look at the picture and write the full {fp.noun}. You read it, fix anything, then save it as a draft {singular} with this picture on top.</span>
                    <button type="button" className="btn btn--gold ui-btn-sm" disabled={!db || !ai || expanding || busy} onClick={() => void expand()}>{expanding ? `Writing the ${fp.noun}…` : `✦ Write the full ${fp.noun} with AI`}</button>
                  </div>
                )}
              </div>
            )}

            <div className="ui-row" style={{ marginTop: 14 }}>
              {!item.mockup && <Link className="btn btn--gold ui-btn-xs" href={`/creator/social?imageId=${encodeURIComponent(item.src)}${f.pillarId ? `&pillar=${f.pillarId}` : ""}`}>Use in a post</Link>}
              {item.inBook && <Link className="btn btn--ghost ui-btn-xs" href={`/admin/ads?img=${encodeURIComponent(item.src)}`}>Stage in Ads maker</Link>}
              <a className="btn btn--ghost ui-btn-xs" href={item.url} target="_blank" rel="noreferrer">Open ↗</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
