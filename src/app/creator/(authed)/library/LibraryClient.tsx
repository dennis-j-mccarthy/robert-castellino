"use client";

import Link from "next/link";
import { useState } from "react";
import ImageGrid, { Badges } from "@/components/creator/ImageGrid";
import AddPictures from "./AddPictures";
import Notice, { type NoticeState } from "@/components/creator/Notice";
import { api, errText } from "@/lib/creator/client";
import type { LibraryItem, LibraryView } from "@/lib/creator/library";
import { pillarTagClsFor, type CoreMessage, type Pillar } from "@/lib/creator/pillars";

interface Props {
  initial: LibraryView;
  pillars: Pillar[];
  messages: CoreMessage[];
  db: boolean;
  ai: boolean;
  imageAi: boolean;
}

export default function LibraryClient({ initial, pillars, messages, db, ai, imageAi }: Props) {
  const [items, setItems] = useState<LibraryItem[]>(initial.items);
  const [sel, setSel] = useState<LibraryItem | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [busy, setBusy] = useState(false);
  const [showMockups, setShowMockups] = useState(true);
  const [describing, setDescribing] = useState(false);
  const [suggested, setSuggested] = useState<{ caption: string; confidence: string } | null>(null);
  const [formKey, setFormKey] = useState(0);

  // Ask Claude to look at the picture and fill the card; the fields are
  // saved straight away so the grid and the pickers see them.
  async function describe() {
    if (!sel) return;
    setDescribing(true);
    setSuggested(null);
    try {
      const out = await api<{ title: string; loc: string; blurb: string; pillarId: string; caption: string; confidence: string }>("/api/creator/library/describe", { method: "POST", json: { src: sel.src } });
      await save({ title: out.title, loc: out.loc, blurb: out.blurb, pillarId: out.pillarId || null, messageId: null });
      setSuggested({ caption: out.caption, confidence: out.confidence });
      setFormKey((k) => k + 1);
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setDescribing(false);
    }
  }

  async function save(patch: Partial<Pick<LibraryItem, "pillarId" | "messageId" | "title" | "blurb" | "loc">>) {
    if (!sel) return;
    setBusy(true);
    try {
      await api("/api/creator/library", { method: "PATCH", json: { src: sel.src, ...patch } });
      const next = { ...sel, ...patch };
      setSel(next);
      setItems((l) => l.map((i) => (i.src === sel.src ? next : i)));
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(false);
    }
  }

  const pillarMessages = messages.filter((m) => !sel?.pillarId || m.pillar === sel.pillarId);

  return (
    <div className="cr-library">
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <AddPictures imageAi={imageAi} />
      <div className="cr-two">
        <div>
          <label className="ads-check" style={{ display: "inline-grid", marginBottom: 8 }}>
            <input type="checkbox" checked={showMockups} onChange={(e) => setShowMockups(e.target.checked)} />
            <span>Show mockups (badged — never used in ads or posts)</span>
          </label>
          <ImageGrid items={items} pillars={pillars} selected={sel?.src} onSelect={(i) => { setSel(i); setSuggested(null); }} allowMockups={showMockups} scroll={false} />
        </div>
        <aside className="cr-detail">
          {!sel ? (
            <div className="ads-hint">Pick an image to see and edit its tags.</div>
          ) : (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element -- library preview */}
              <img className="cr-detail__img" src={sel.src} alt={sel.title ?? sel.label} />
              <div className="ads-row" style={{ marginTop: 8 }}><Badges item={sel} /></div>
              {sel.mockup && (
                <div className="ads-notice ads-notice--err" style={{ marginTop: 10 }}>
                  This is an AI mockup of the book. It is never used in ads or posts — the real plates are.
                </div>
              )}
              <div className="cr-kv"><span>Path</span><code>{sel.src}</code></div>
              <div className="cr-kv"><span>Collection</span><span>{sel.collection}</span></div>
              <div className="cr-kv"><span>Source</span><span>{sel.source === "both" ? "gallery + ad manifest" : sel.source === "photo" ? "gallery" : "ad manifest"}</span></div>

              {ai && !sel.mockup && (
                <div className="ap__describe">
                  <button type="button" className="btn btn--gold ads-btn-xs" disabled={!db || busy || describing} onClick={() => void describe()}>{describing ? "Looking…" : "Describe with AI"}</button>
                  <span>Fills title, place, blurb and pillar from the picture. You can change any of it.</span>
                </div>
              )}
              {suggested && (
                <div className="ap__caption">
                  <b>A caption, ready for a post</b>{suggested.confidence !== "high" && <small> · place is a {suggested.confidence} guess, check it</small>}
                  <p>{suggested.caption}</p>
                  <Link className="btn ads-btn-xs" href={`/creator/social?imageId=${encodeURIComponent(sel.src)}&caption=${encodeURIComponent(suggested.caption)}${sel.pillarId ? `&pillar=${sel.pillarId}` : ""}`}>Use it in a post</Link>
                </div>
              )}
              <label className="ads-label">Title</label>
              <input className="ads-input" defaultValue={sel.title ?? ""} key={`t-${sel.src}-${formKey}`} disabled={!db || busy} onBlur={(e) => e.target.value !== (sel.title ?? "") && void save({ title: e.target.value })} />
              <label className="ads-label">Place</label>
              <input className="ads-input" defaultValue={sel.loc ?? ""} key={`l-${sel.src}-${formKey}`} disabled={!db || busy} onBlur={(e) => e.target.value !== (sel.loc ?? "") && void save({ loc: e.target.value })} />
              <label className="ads-label">Blurb</label>
              <textarea className="ads-input" rows={3} defaultValue={sel.blurb ?? ""} key={`b-${sel.src}-${formKey}`} disabled={!db || busy} onBlur={(e) => e.target.value !== (sel.blurb ?? "") && void save({ blurb: e.target.value })} />
              <label className="ads-label">Pillar</label>
              <select className="ads-input" value={sel.pillarId ?? ""} disabled={!db || busy} onChange={(e) => void save({ pillarId: e.target.value || null, messageId: null })}>
                <option value="">— none —</option>
                {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <label className="ads-label">Core message</label>
              <select className="ads-input" value={sel.messageId ?? ""} disabled={!db || busy} onChange={(e) => void save({ messageId: e.target.value || null })}>
                <option value="">— none —</option>
                {pillarMessages.map((m) => <option key={m.id} value={m.id}>{m.id} · {m.text}</option>)}
              </select>
              {sel.pillarId && <div style={{ marginTop: 8 }}><span className={pillarTagClsFor(pillars, sel.pillarId)}>{pillars.find((p) => p.id === sel.pillarId)?.name}</span></div>}

              <div className="ads-row" style={{ marginTop: 16 }}>
                {!sel.mockup && (
                  <Link className="btn btn--gold ads-btn-xs" href={`/creator/social?imageId=${encodeURIComponent(sel.src)}${sel.pillarId ? `&pillar=${sel.pillarId}` : ""}`}>Use in a post</Link>
                )}
                {sel.inBook && (
                  <Link className="btn btn--ghost ads-btn-xs" href={`/admin/ads?img=${encodeURIComponent(sel.src)}`}>Stage in Ads maker</Link>
                )}
                <a className="btn btn--ghost ads-btn-xs" href={sel.url} target="_blank" rel="noreferrer">Open ↗</a>
              </div>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
