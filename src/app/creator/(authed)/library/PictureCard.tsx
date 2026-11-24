"use client";

import Link from "next/link";
import { useState } from "react";
import { Badges } from "@/components/creator/ImageGrid";
import { api, errText } from "@/lib/creator/client";
import type { LibraryItem } from "@/lib/creator/library";
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

export default function PictureCard({ item, pillars, messages, db, ai, onClose, onSaved, onError }: {
  item: LibraryItem; pillars: Pillar[]; messages: CoreMessage[]; db: boolean; ai: boolean;
  onClose: () => void; onSaved: (patch: Fields) => void; onError: (text: string) => void;
}) {
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

  function close() {
    if (dirty && !window.confirm("You have unsaved changes on this picture. Close without saving?")) return;
    onClose();
  }

  return (
    <div className="ads-modal lb__modal" role="dialog" aria-modal="true" aria-label={item.title ?? item.label} onClick={(e) => { if (e.target === e.currentTarget) close(); }}>
      <div className="ads-modal__card lb__card-modal">
        <button type="button" className="lb__close" aria-label="Close" onClick={close}>×</button>
        <div className="lb__mgrid">
          <div className="lb__mimg">
            {/* eslint-disable-next-line @next/next/no-img-element -- library preview */}
            <img src={item.src} alt={item.title ?? item.label} />
            <div className="ads-row" style={{ marginTop: 8 }}><Badges item={item} /></div>
            <div className="lb__path"><span>{item.collection.replace(/-/g, " ")}</span> · <span>{item.source === "both" ? "gallery + ad manifest" : item.source === "photo" ? "gallery" : "ad manifest"}</span></div>
            {item.mockup && <div className="ads-notice ads-notice--err" style={{ marginTop: 10 }}>This is an AI mockup of the book. It is never used in ads or posts — the real plates are.</div>}
          </div>
          <div className="lb__mform">
            {ai && !item.mockup && (
              <div className="ap__describe">
                <button type="button" className="btn btn--gold ads-btn-xs" disabled={!db || busy || describing} onClick={() => void describe()}>{describing ? "Looking…" : "✦ Describe with AI"}</button>
                <span>Fills the fields from the picture. Read them, then Save.</span>
              </div>
            )}
            {caption && (
              <div className="ap__caption">
                <b>A caption, ready for a post</b>{caption.confidence !== "high" && <small> · place is a {caption.confidence} guess, check it</small>}
                <p>{caption.text}</p>
                <Link className="btn ads-btn-xs" href={`/creator/social?imageId=${encodeURIComponent(item.src)}&caption=${encodeURIComponent(caption.text)}${f.pillarId ? `&pillar=${f.pillarId}` : ""}`}>Use it in a post</Link>
              </div>
            )}
            <label className="ads-label">Title</label>
            <input className="ads-input" value={f.title ?? ""} disabled={!db || busy} onChange={(e) => set({ title: e.target.value })} />
            <label className="ads-label">Place</label>
            <input className="ads-input" value={f.loc ?? ""} disabled={!db || busy} onChange={(e) => set({ loc: e.target.value })} />
            <label className="ads-label">Blurb</label>
            <textarea className="ads-input" rows={3} value={f.blurb ?? ""} disabled={!db || busy} onChange={(e) => set({ blurb: e.target.value })} />
            <div className="ads-row--2">
              <div>
                <label className="ads-label">Pillar</label>
                <select className="ads-input" value={f.pillarId ?? ""} disabled={!db || busy} onChange={(e) => set({ pillarId: e.target.value || null, messageId: null })}>
                  <option value="">— none —</option>
                  {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
                </select>
              </div>
              <div>
                <label className="ads-label">Core message</label>
                <select className="ads-input" value={f.messageId ?? ""} disabled={!db || busy} onChange={(e) => set({ messageId: e.target.value || null })}>
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
                  <button type="button" className="btn btn--gold ads-btn-sm" disabled={busy || !db} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</button>
                  <button type="button" className="btn ads-btn-sm" disabled={busy} onClick={() => { setF(saved); setCaption(null); }}>Discard</button>
                </>
              ) : (
                <span className="lb__savebar__msg is-ok">Saved</span>
              )}
            </div>

            <div className="ads-row" style={{ marginTop: 14 }}>
              {!item.mockup && <Link className="btn btn--gold ads-btn-xs" href={`/creator/social?imageId=${encodeURIComponent(item.src)}${f.pillarId ? `&pillar=${f.pillarId}` : ""}`}>Use in a post</Link>}
              {item.inBook && <Link className="btn btn--ghost ads-btn-xs" href={`/admin/ads?img=${encodeURIComponent(item.src)}`}>Stage in Ads maker</Link>}
              <a className="btn btn--ghost ads-btn-xs" href={item.url} target="_blank" rel="noreferrer">Open ↗</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
