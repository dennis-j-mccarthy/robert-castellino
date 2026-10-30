"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ImageGrid from "@/components/creator/ImageGrid";
import Notice, { type NoticeState } from "@/components/creator/Notice";
import Thumb from "@/components/creator/Thumb";
import { api, errText } from "@/lib/creator/client";
import type { LibraryItem } from "@/lib/creator/library";
import { pillarTagClsFor, type Pillar } from "@/lib/creator/pillars";

interface Props {
  pillars: Pillar[];
  library: LibraryItem[];
  musingPillars: Record<string, string>;
}

export interface MusingRow {
  id: string;
  num: string;
  cat: string;
  title: string;
  date: string;
  loc: string | null;
  img: string | null;
  size: string | null;
  excerpt: string;
  body: string[];
  published: boolean;
  order: number;
}

const CATS = ["reflections", "light", "land", "locations", "wilderness"] as const;

export default function BlogPosts({ pillars, library, musingPillars }: Props) {
  const [items, setItems] = useState<MusingRow[]>([]);
  const [filter, setFilter] = useState<"all" | "draft" | "live">("all");
  const [notice, setNotice] = useState<NoticeState>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [edit, setEdit] = useState<(Omit<MusingRow, "body"> & { body: string }) | null>(null);
  const [picker, setPicker] = useState(false);

  const load = useCallback(
    () =>
      api<{ items: MusingRow[]; dbMissing?: boolean }>("/api/admin/musings")
        .then((d) => setItems(d.items))
        .catch((e: unknown) => setNotice({ kind: "err", text: errText(e) })),
    [],
  );
  useEffect(() => {
    void load();
  }, [load]);

  const shown = useMemo(
    () => items.filter((m) => (filter === "all" ? true : filter === "draft" ? !m.published : m.published)),
    [items, filter],
  );

  async function setPublished(m: MusingRow, published: boolean) {
    setBusy(m.id);
    try {
      await api(`/api/admin/musings/${m.id}`, { method: "PUT", json: { published } });
      setNotice({ kind: "ok", text: published ? `“${m.title}” is live.` : `“${m.title}” unpublished.` });
      await load();
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  async function remove(m: MusingRow) {
    if (!window.confirm(`Delete “${m.title}”? This can't be undone.`)) return;
    setBusy(m.id);
    try {
      await api(`/api/admin/musings/${m.id}`, { method: "DELETE" });
      if (edit?.id === m.id) setEdit(null);
      await load();
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  async function saveEdit() {
    if (!edit) return;
    const body = edit.body.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
    if (!edit.title.trim() || !edit.excerpt.trim() || !body.length) {
      setNotice({ kind: "err", text: "A title, an excerpt and at least one paragraph are needed." });
      return;
    }
    setBusy(edit.id);
    try {
      await api(`/api/admin/musings/${edit.id}`, {
        method: "PUT",
        json: {
          cat: edit.cat, title: edit.title.trim(), date: edit.date.trim(), loc: edit.loc?.trim() || null,
          img: edit.img?.trim() || null, size: edit.size || null, excerpt: edit.excerpt.trim(), body, published: edit.published,
        },
      });
      setNotice({ kind: "ok", text: "Saved." });
      setEdit(null);
      await load();
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="cr-posts">
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <div className="ads-row" style={{ marginBottom: 12 }}>
        {(["all", "draft", "live"] as const).map((f) => (
          <button key={f} type="button" className={`btn btn--ghost ads-btn-xs${filter === f ? " is-on" : ""}`} onClick={() => setFilter(f)}>
            {f === "all" ? `All (${items.length})` : f === "draft" ? `Drafts (${items.filter((m) => !m.published).length})` : `Live (${items.filter((m) => m.published).length})`}
          </button>
        ))}
      </div>

      <div className="ads-tablewrap">
        <table className="ads-table">
          <thead>
            <tr><th></th><th>Musing</th><th>Pillar</th><th>Category</th><th>Status</th><th></th></tr>
          </thead>
          <tbody>
            {shown.map((m) => {
              const pid = musingPillars[m.id];
              return (
                <tr key={m.id}>
                  <td><Thumb src={m.img} /></td>
                  <td>
                    <div className="ads-table__name">{m.title}</div>
                    <div className="ads-table__sub">{m.num} · {m.date}{m.loc ? ` · ${m.loc}` : ""}</div>
                  </td>
                  <td>{pid ? <span className={pillarTagClsFor(pillars, pid)}>{pillars.find((p) => p.id === pid)?.name ?? pid}</span> : <span className="cr-muted">—</span>}</td>
                  <td className="ads-table__sub">{m.cat}</td>
                  <td><span className={`ads-pill ${m.published ? "ads-pill--active" : "ads-pill--paused"}`}>{m.published ? "live" : "draft"}</span></td>
                  <td className="ads-table__actions">
                    <button type="button" className="btn btn--ghost ads-btn-xs" disabled={!!busy} onClick={() => { setEdit({ ...m, body: m.body.join("\n\n") }); setPicker(false); }}>Edit</button>
                    {m.published ? (
                      <button type="button" className="btn btn--ghost ads-btn-xs" disabled={!!busy} onClick={() => void setPublished(m, false)}>Unpublish</button>
                    ) : (
                      <button type="button" className="btn btn--gold ads-btn-xs" disabled={!!busy} onClick={() => void setPublished(m, true)}>Publish</button>
                    )}
                    <Link className="btn btn--ghost ads-btn-xs" href={`/creator/social?musingId=${m.id}${m.img ? `&imageId=${encodeURIComponent(m.img)}` : ""}${pid ? `&pillar=${pid}` : ""}`}>Post</Link>
                    <Link className="btn btn--ghost ads-btn-xs" href={`/creator/email?musingIds=${m.id}`}>Email</Link>
                    {m.published && <a className="btn btn--ghost ads-btn-xs" href={`/musings/${m.id}`} target="_blank" rel="noreferrer">View ↗</a>}
                    <button type="button" className="btn btn--ghost ads-btn-xs" disabled={!!busy} onClick={() => void remove(m)}>Delete</button>
                  </td>
                </tr>
              );
            })}
            {!shown.length && <tr><td colSpan={6} className="ads-hint">Nothing here yet.</td></tr>}
          </tbody>
        </table>
      </div>

      {edit && (
        <div className="ads-modal" role="dialog" aria-modal="true">
          <div className="ads-modal__card cr-modal cr-modal--wide">
            <h3>Edit {edit.num}</h3>
            <label className="ads-label">Title</label>
            <input className="ads-input" value={edit.title} onChange={(e) => setEdit({ ...edit, title: e.target.value })} />
            <div className="ads-row--2">
              <div>
                <label className="ads-label">Category</label>
                <select className="ads-input" value={edit.cat} onChange={(e) => setEdit({ ...edit, cat: e.target.value })}>{CATS.map((c) => <option key={c} value={c}>{c}</option>)}</select>
              </div>
              <div>
                <label className="ads-label">Date label</label>
                <input className="ads-input" value={edit.date} onChange={(e) => setEdit({ ...edit, date: e.target.value })} />
              </div>
            </div>
            <div className="ads-row--2">
              <div>
                <label className="ads-label">Place</label>
                <input className="ads-input" value={edit.loc ?? ""} onChange={(e) => setEdit({ ...edit, loc: e.target.value })} />
              </div>
              <div>
                <label className="ads-label">Image</label>
                <div className="ads-row">
                  <input className="ads-input" style={{ flex: 1 }} value={edit.img ?? ""} onChange={(e) => setEdit({ ...edit, img: e.target.value })} />
                  <button type="button" className="btn btn--ghost ads-btn-xs" onClick={() => setPicker((p) => !p)}>{picker ? "Close" : "Library"}</button>
                </div>
              </div>
            </div>
            {picker && <div style={{ marginTop: 8 }}><ImageGrid items={library} pillars={pillars} selected={edit.img} onSelect={(it) => { setEdit({ ...edit, img: it.src }); setPicker(false); }} maxHeight={240} compact /></div>}
            <label className="ads-label">Excerpt</label>
            <textarea className="ads-input" rows={2} value={edit.excerpt} onChange={(e) => setEdit({ ...edit, excerpt: e.target.value })} />
            <label className="ads-label">Body</label>
            <textarea className="ads-input" rows={12} value={edit.body} onChange={(e) => setEdit({ ...edit, body: e.target.value })} />
            <label className="ads-check" style={{ marginTop: 8 }}><input type="checkbox" checked={edit.published} onChange={(e) => setEdit({ ...edit, published: e.target.checked })} /><span>Published</span></label>
            <div className="ads-row" style={{ marginTop: 14 }}>
              <button className="btn btn--gold" disabled={!!busy} onClick={() => void saveEdit()}>{busy ? "Saving…" : "Save"}</button>
              <button className="btn btn--ghost" disabled={!!busy} onClick={() => setEdit(null)}>Cancel</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
