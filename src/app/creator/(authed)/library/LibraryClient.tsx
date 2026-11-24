"use client";

import { useMemo, useState } from "react";
import { Badges } from "@/components/creator/ImageGrid";
import Notice, { type NoticeState } from "@/components/creator/Notice";
import { api, errText } from "@/lib/creator/client";
import type { LibraryItem, LibraryView } from "@/lib/creator/library";
import { pillarTagClsFor, type CoreMessage, type Pillar } from "@/lib/creator/pillars";
import PictureCard from "./PictureCard";
import AddPictures from "./AddPictures";

/*
  Tool 2 · Pictures. One full-width grid with the caption under every
  picture (a blank one says so, in orange). Click a picture for its card in
  a popup: title, place, blurb, pillar, core message, Describe with AI, and
  the hand-offs to Posts and Ads. "Caption the blank ones" at the top runs
  Describe with AI over every picture with no title, a dozen at a time.
*/

interface Props {
  initial: LibraryView;
  pillars: Pillar[];
  messages: CoreMessage[];
  db: boolean;
  ai: boolean;
  imageAi: boolean;
}

type Described = { title: string; loc: string; blurb: string; pillarId: string; caption: string; confidence: string };
const IN_BOOK = "__book__";
const BATCH = 12;

export default function LibraryClient({ initial, pillars, messages, db, ai, imageAi }: Props) {
  const [items, setItems] = useState<LibraryItem[]>(initial.items);
  const [sel, setSel] = useState<LibraryItem | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [showMockups, setShowMockups] = useState(false);
  const [blankOnly, setBlankOnly] = useState(false);
  const [collection, setCollection] = useState("");
  const [pillar, setPillar] = useState("");
  const [query, setQuery] = useState("");
  const [formKey, setFormKey] = useState(0);
  const [batch, setBatch] = useState<{ done: number; total: number; running: boolean } | null>(null);

  const collections = useMemo(() => Array.from(new Set(items.map((i) => i.collection))).sort(), [items]);
  const bookCount = items.filter((i) => i.inBook).length;
  const blank = items.filter((i) => !i.mockup && !i.title);
  const shown = useMemo(() => {
    const q = query.trim().toLowerCase();
    return items.filter((i) => {
      if (i.mockup && !showMockups) return false;
      if (blankOnly && i.title) return false;
      if (collection === IN_BOOK && !i.inBook) return false;
      if (collection && collection !== IN_BOOK && i.collection !== collection) return false;
      if (pillar && i.pillarId !== pillar) return false;
      if (q && !`${i.label} ${i.title ?? ""} ${i.loc ?? ""} ${i.collection}`.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [items, showMockups, blankOnly, collection, pillar, query]);

  function applyLocal(src: string, patch: Partial<LibraryItem>) {
    setItems((l) => l.map((i) => (i.src === src ? { ...i, ...patch } : i)));
    setSel((s) => (s && s.src === src ? { ...s, ...patch } : s));
  }

  async function describeOne(target: LibraryItem): Promise<Described> {
    const out = await api<Described>("/api/creator/library/describe", { method: "POST", json: { src: target.src } });
    await api("/api/creator/library", { method: "PATCH", json: { src: target.src, title: out.title, loc: out.loc, blurb: out.blurb, pillarId: out.pillarId || null, messageId: null } });
    applyLocal(target.src, { title: out.title, loc: out.loc, blurb: out.blurb, pillarId: out.pillarId || null, messageId: null });
    return out;
  }

  async function captionBlanks() {
    const todo = blank.slice(0, BATCH);
    if (!todo.length) return;
    setBatch({ done: 0, total: todo.length, running: true });
    let done = 0;
    for (const it of todo) {
      try { await describeOne(it); } catch (e) { setNotice({ kind: "err", text: `${it.label}: ${errText(e)}` }); }
      done += 1;
      setBatch({ done, total: todo.length, running: true });
    }
    setBatch({ done, total: todo.length, running: false });
  }

  return (
    <div className="cr-library lb">
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <AddPictures imageAi={imageAi} />

      <div className="lb__bar">
        <select className="ads-input ads-input--sm" value={collection} onChange={(e) => setCollection(e.target.value)}>
          {bookCount > 0 && <option value={IN_BOOK}>In the book ({bookCount})</option>}
          <option value="">All collections ({items.length})</option>
          {collections.map((c) => <option key={c} value={c}>{c.replace(/-/g, " ")}</option>)}
        </select>
        <select className="ads-input ads-input--sm" value={pillar} onChange={(e) => setPillar(e.target.value)}>
          <option value="">Any pillar</option>
          {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
        </select>
        <input className="ads-input ads-input--sm cr-search" placeholder="Search…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <label className="lb__check"><input type="checkbox" checked={blankOnly} onChange={(e) => setBlankOnly(e.target.checked)} /> Blank captions only <span className="lb__count">{blank.length}</span></label>
        <label className="lb__check"><input type="checkbox" checked={showMockups} onChange={(e) => setShowMockups(e.target.checked)} /> Show mockups</label>
        <span className="lb__sp" />
        {ai && db && (
          <button type="button" className="btn btn--gold ads-btn-sm" disabled={!blank.length || batch?.running} onClick={() => void captionBlanks()}>
            {batch?.running ? `Captioning ${batch.done} of ${batch.total}…` : blank.length ? `✦ Caption the blank ones (${Math.min(BATCH, blank.length)})` : "✦ All captioned"}
          </button>
        )}
      </div>
      {batch && !batch.running && <p className="lb__note">Captioned {batch.done}. {blank.length ? `${blank.length} still blank — press again for the next ${Math.min(BATCH, blank.length)}.` : "Every picture has a caption now."} Open any picture to check the place; the model says when it is guessing.</p>}

      <div className="lb__grid">
        {shown.map((img) => (
          <button key={img.src} type="button" className={`lb__card${img.mockup ? " is-mockup" : ""}`} onClick={() => { setSel(img); setFormKey((k) => k + 1); }}>
            <span className="lb__img">
              {/* eslint-disable-next-line @next/next/no-img-element -- library thumbs */}
              <img src={img.src} alt={img.title ?? img.label} loading="lazy" />
              <span className="cr-thumb__badges"><Badges item={img} compact /></span>
            </span>
            <span className="lb__cap">
              {img.title ? <b>{img.title}</b> : <b className="is-blank">No caption yet</b>}
              <small>{img.loc || (img.pillarId ? pillars.find((p) => p.id === img.pillarId)?.name : img.collection.replace(/-/g, " "))}</small>
            </span>
          </button>
        ))}
        {!shown.length && <div className="ads-hint">Nothing matches.</div>}
      </div>

      {sel && (
        <PictureCard
          key={`${sel.src}-${formKey}`}
          item={sel}
          pillars={pillars}
          messages={messages}
          db={db}
          ai={ai}
          onClose={() => setSel(null)}
          onSaved={(patch) => applyLocal(sel.src, patch)}
          onError={(text) => setNotice({ kind: "err", text })}
        />
      )}
    </div>
  );
}
