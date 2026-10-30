"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import ImageGrid from "@/components/creator/ImageGrid";
import Notice, { type NoticeState } from "@/components/creator/Notice";
import Thumb from "@/components/creator/Thumb";
import { api, copyText, errText } from "@/lib/creator/client";
import type { LibraryItem } from "@/lib/creator/library";
import { pillarTagClsFor, type CoreMessage, type Pillar } from "@/lib/creator/pillars";
import { CAPTION_LIMITS, PLATFORM_LABELS, PUBLISHES, SOCIAL_PLATFORMS, isSocialPlatform, type SocialPlatform } from "@/lib/creator/social";
import type { QueueItem } from "@/lib/creator/social-queue";

/*
  Post maker. Four numbered steps, then preview + publish.

    ① Image      the real plates (mockups are never offered); paste a URL too
    ② Platform   Facebook publishes; Instagram is copy-only (no IG linked)
    ③ Pillar     + an optional core message under it
    ④ Caption    "Write 3 options" → /api/creator/social/captions, pick, edit

  URL prefill (from the Library, the Musings list, or anywhere):
    /creator/social?imageId=/assets/…&caption=…&platform=facebook&pillar=light&at=2026-11-01T07:30&musingId=m07
*/

interface Props {
  library: LibraryItem[];
  pillars: Pillar[];
  messages: CoreMessage[];
  config: { connected: boolean; page: string | null; pageId: string | null; ai: boolean };
}

interface AdminDraft {
  id: string;
  musingId: string;
  platform: string;
  caption: string;
  hashtags: string | null;
  link: string;
  image: string | null;
  status: string;
  pillarId?: string | null;
}

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function PostMaker({ library, pillars, messages, config }: Props) {
  const [notice, setNotice] = useState<NoticeState>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [image, setImage] = useState<string>("");
  const [customUrl, setCustomUrl] = useState("");
  const [platform, setPlatform] = useState<SocialPlatform>("facebook");
  const [pillarId, setPillarId] = useState<string>("");
  const [messageId, setMessageId] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [musingId, setMusingId] = useState("");
  const [options, setOptions] = useState<string[]>([]);
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; scheduled: boolean; scheduledAt: string | null; page: string } | null>(null);

  const [drafts, setDrafts] = useState<AdminDraft[]>([]);
  const [queue, setQueue] = useState<QueueItem[]>([]);

  const selected = useMemo(() => library.find((i) => i.src === image) ?? null, [library, image]);
  const imageUrl = selected ? selected.url : /^https:\/\//i.test(image) ? image : "";
  const pillarMessages = messages.filter((m) => !pillarId || m.pillar === pillarId);

  const loadDrafts = useCallback(
    () => api<{ items: AdminDraft[] }>("/api/admin/social-drafts").then((d) => setDrafts(d.items.filter((x) => isSocialPlatform(x.platform) && x.status === "draft"))).catch(() => undefined),
    [],
  );
  const loadQueue = useCallback(() => api<{ items: QueueItem[] }>("/api/creator/social/queue").then((d) => setQueue(d.items)).catch(() => undefined), []);

  useEffect(() => {
    void loadDrafts();
    void loadQueue();
  }, [loadDrafts, loadQueue]);

  // URL prefill — an external input applied once, from a callback, after mount.
  useEffect(() => {
    const q = new URLSearchParams(window.location.search);
    if (![...q.keys()].length) return;
    queueMicrotask(() => {
      const img = q.get("imageId");
      if (img) {
        const hit = library.find((i) => i.src === img || i.src === `/${img}` || i.url === img);
        if (hit) setImage(hit.src);
        else if (/^https:\/\//i.test(img)) { setImage(img); setCustomUrl(img); }
      }
      const cap = q.get("caption");
      if (cap) setCaption(cap);
      const pl = q.get("platform");
      if (isSocialPlatform(pl)) setPlatform(pl);
      const pi = q.get("pillar");
      if (pi && pillars.some((p) => p.id === pi)) setPillarId(pi);
      const at = q.get("at");
      if (at) setScheduledAt(toLocalInput(at) || at);
      const mu = q.get("musingId");
      if (mu) setMusingId(mu);
      const d = q.get("draftId");
      if (d) setDraftId(d);
    });
  }, [library, pillars]);

  async function writeCaptions() {
    if (!pillarId) { setNotice({ kind: "err", text: "Choose a pillar first (③)." }); return; }
    setBusy("captions");
    setNotice(null);
    try {
      const r = await api<{ captions: string[] }>("/api/creator/social/captions", {
        method: "POST",
        json: { pillarId, messageId: messageId || undefined, platform, imageSrc: selected?.src, musingId: musingId || undefined, topic },
      });
      setOptions(r.captions);
      if (!caption.trim() && r.captions[0]) setCaption(r.captions[0]);
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  async function submit(schedule: boolean) {
    setBusy(schedule ? "schedule" : "publish");
    setNotice(null);
    setResult(null);
    try {
      const r = await api<{ ok: true; id: string; scheduled: boolean; scheduledAt: string | null; page: string }>("/api/admin/facebook/post", {
        method: "POST",
        json: {
          caption,
          imageUrl: imageUrl || undefined,
          scheduledAt: schedule && scheduledAt ? new Date(scheduledAt).toISOString() : undefined,
          pillarId: pillarId || undefined,
          draftId: draftId || undefined,
        },
      });
      setResult(r);
      setNotice({ kind: "ok", text: r.scheduled ? `Scheduled on ${r.page}.` : `Published to ${r.page}.` });
      await Promise.all([loadQueue(), loadDrafts()]);
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
      await loadQueue();
    } finally {
      setBusy(null);
    }
  }

  async function cancel(item: QueueItem) {
    if (!window.confirm("Cancel this scheduled post on Facebook?")) return;
    setBusy(`cancel:${item.id}`);
    try {
      await api("/api/creator/social/queue", { method: "POST", json: { action: "cancel", id: item.id } });
      setNotice({ kind: "ok", text: "Cancelled — the row is back to draft." });
      await loadQueue();
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  function applyDraft(d: AdminDraft) {
    setCaption(d.hashtags ? `${d.caption}\n\n${d.hashtags}` : d.caption);
    if (d.image) {
      const hit = library.find((i) => i.src === d.image || i.url === d.image);
      if (hit) setImage(hit.src);
      else if (/^https:\/\//i.test(d.image)) { setImage(d.image); setCustomUrl(d.image); }
    }
    if (isSocialPlatform(d.platform)) setPlatform(d.platform);
    if (d.pillarId && pillars.some((p) => p.id === d.pillarId)) setPillarId(d.pillarId);
    if (!d.musingId.startsWith("post:")) setMusingId(d.musingId);
    setDraftId(d.id);
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  const limit = CAPTION_LIMITS[platform];
  const publishes = PUBLISHES[platform];
  const canSend = config.connected && publishes && !!caption.trim() && caption.length <= limit && !busy;
  const done = { image: !!image, platform: true, pillar: !!pillarId, caption: !!caption.trim() };

  return (
    <div className="cr-postmaker">
      {!config.connected && (
        <div className="ads-notice ads-notice--warn">
          <strong>Facebook isn&rsquo;t connected.</strong> Set <code>META_PAGE_ID</code> + <code>META_PAGE_TOKEN</code> (or connect on <Link href="/admin/social">/admin/social</Link>). Captions and drafts still work; publishing is disabled.
        </div>
      )}
      {config.connected && <div className="cr-savestate">Connected · {config.page ?? "Facebook Page"} · {config.pageId}</div>}
      <Notice notice={notice} onClose={() => setNotice(null)} />

      <div className="ads-maker">
        {/* ① Image */}
        <section className={`ads-step${done.image ? " is-done" : ""}`}>
          <header className="ads-step__title"><span>①</span> Image {done.image && <i className="cr-done">✓</i>}</header>
          <ImageGrid items={library} pillars={pillars} selected={image} initialPillar={pillarId} onSelect={(it) => { setImage(it.src); setCustomUrl(""); }} maxHeight={360} compact />
          {selected && (
            <div className="ads-hint">
              {selected.title ?? selected.label}{selected.loc ? ` · ${selected.loc}` : ""}{selected.bookPage ? ` · in the book, p.${selected.bookPage}` : ""}
            </div>
          )}
          <label className="ads-label">or paste a public image URL</label>
          <input className="ads-input" placeholder="https://…/photo.jpg" value={customUrl} onChange={(e) => { setCustomUrl(e.target.value); if (e.target.value.trim()) setImage(e.target.value.trim()); }} />
          <div className="ads-hint"><Link href="/creator/library">Open the Library</Link> to tag plates with a pillar.</div>
        </section>

        {/* ② Platform */}
        <section className="ads-step is-done">
          <header className="ads-step__title"><span>②</span> Platform <i className="cr-done">✓</i></header>
          <div className="ads-checklist">
            {SOCIAL_PLATFORMS.map((p) => (
              <label key={p} className="ads-check">
                <input type="radio" name="platform" checked={platform === p} onChange={() => setPlatform(p)} />
                <span>{PLATFORM_LABELS[p]}</span>
                <small>{PUBLISHES[p] ? (config.connected ? `publishes to ${config.page ?? "the Page"}` : "needs the Page token") : "no Business account linked — copy the caption out"}</small>
              </label>
            ))}
          </div>
          <label className="ads-label">Promote a Musing (optional id)</label>
          <input className="ads-input" placeholder="m07" value={musingId} onChange={(e) => setMusingId(e.target.value.trim())} />
          <div className="ads-hint">Pick from <Link href="/creator/blog/posts">the Musings list</Link> to fill this in.</div>
        </section>

        {/* ③ Pillar */}
        <section className={`ads-step${done.pillar ? " is-done" : ""}`}>
          <header className="ads-step__title"><span>③</span> Pillar {done.pillar && <i className="cr-done">✓</i>}</header>
          <div className="ads-checklist">
            {pillars.map((p) => (
              <label key={p.id} className="ads-check">
                <input type="radio" name="pillar" checked={pillarId === p.id} onChange={() => { setPillarId(p.id); setMessageId(""); }} />
                <span className={pillarTagClsFor(pillars, p.id)}>{p.name}</span>
                <small>{p.message}</small>
              </label>
            ))}
          </div>
          <label className="ads-label">Core message (optional)</label>
          <select className="ads-input" value={messageId} onChange={(e) => setMessageId(e.target.value)}>
            <option value="">— let the writer choose —</option>
            {pillarMessages.map((m) => <option key={m.id} value={m.id}>{m.text}</option>)}
          </select>
          <label className="ads-label">What this post is about (optional)</label>
          <input className="ads-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="first light on the Bells, late September" />
        </section>

        {/* ④ Caption */}
        <section className={`ads-step${done.caption ? " is-done" : ""}`}>
          <header className="ads-step__title"><span>④</span> Caption {done.caption && <i className="cr-done">✓</i>}</header>
          <div className="ads-row">
            <button className="btn btn--gold ads-btn-sm" disabled={!config.ai || !!busy || !pillarId} onClick={() => void writeCaptions()}>{busy === "captions" ? "Writing…" : "Write 3 options"}</button>
            {!config.ai && <span className="ads-hint" style={{ margin: 0 }}>AI not configured.</span>}
          </div>
          {options.length > 0 && (
            <div className="cr-options">
              {options.map((o, i) => (
                <button key={i} type="button" className={`cr-option${caption === o ? " is-selected" : ""}`} onClick={() => setCaption(o)}>{o}</button>
              ))}
            </div>
          )}
          <textarea className="ads-input ads-textarea" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder="Write or pick a caption…" />
          <div className={`ads-hint${caption.length > limit ? " ads-hint--err" : ""}`}>{caption.length} / {limit}</div>
        </section>
      </div>

      {/* Preview + send */}
      <div className="cr-two cr-gap">
        <article className="fbcard">
          <header className="fbcard__head">
            <div className="fbcard__avatar">RC</div>
            <div>
              <div className="fbcard__page">{config.page ?? "Robert Castellino Photography"}</div>
              <div className="fbcard__meta">{scheduledAt ? `Scheduled · ${new Date(scheduledAt).toLocaleString()}` : "Just now"} · <span aria-hidden>🌐</span></div>
            </div>
          </header>
          <p className="fbcard__msg">{caption || "Caption…"}</p>
          <div className="fbcard__img">
            <Thumb src={image} className="" empty={<div className="fbcard__img-empty">Pick an image</div>} />
          </div>
        </article>
        <div className="ads-step">
          <header className="ads-step__title"><span>→</span> Send</header>
          <label className="ads-label">Schedule (optional — leave blank to post now)</label>
          <input className="ads-input" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} />
          <div className="ads-hint">Meta needs 15 minutes to 6 months of lead time.</div>
          <div className="ads-row" style={{ marginTop: 14 }}>
            <button className="btn btn--gold" disabled={!canSend || !!scheduledAt} onClick={() => void submit(false)}>{busy === "publish" ? "Publishing…" : "Publish now"}</button>
            <button className="btn btn--ghost" disabled={!canSend || !scheduledAt} onClick={() => void submit(true)}>{busy === "schedule" ? "Scheduling…" : "Schedule"}</button>
            <button className="btn btn--ghost ads-btn-sm" disabled={!caption.trim()} onClick={() => void copyText(caption).then((ok) => setNotice({ kind: ok ? "ok" : "err", text: ok ? "Caption copied." : "Couldn't copy." }))}>Copy caption</button>
          </div>
          {!publishes && <div className="ads-hint">Instagram: copy the caption and the image into the app by hand.</div>}
          {draftId && <div className="ads-hint">Working from draft <code>{draftId}</code>. <button type="button" className="ads-linkbtn" onClick={() => setDraftId(null)}>detach</button></div>}
          {result && (
            <div className="ads-notice ads-notice--ok" style={{ marginTop: 12 }}>
              {result.scheduled ? "Scheduled" : "Published"} · post <code>{result.id}</code>
              {result.scheduledAt ? ` · ${new Date(result.scheduledAt).toLocaleString()}` : ""}
              {!result.scheduled && <> · <a href={`https://www.facebook.com/${result.id}`} target="_blank" rel="noreferrer">open ↗</a></>}
            </div>
          )}
        </div>
      </div>

      {/* Drafts */}
      <section className="ads-list">
        <header className="ads-list__head">
          <h2>From drafts</h2>
          <button type="button" className="btn btn--ghost ads-btn-sm" onClick={() => void loadDrafts()}>Refresh</button>
        </header>
        {!drafts.length ? (
          <div className="ads-hint">No open drafts. Publishing a Musing writes one per platform.</div>
        ) : (
          <div className="cr-drafts">
            {drafts.slice(0, 24).map((d) => (
              <article key={d.id} className="cr-draft">
                <Thumb src={d.image} className="" empty={<span />} />
                <div>
                  <div className="ads-table__sub">{PLATFORM_LABELS[d.platform as SocialPlatform] ?? d.platform} · {d.musingId.startsWith("post:") ? "standalone" : d.musingId}</div>
                  <p>{d.caption.length > 160 ? `${d.caption.slice(0, 159)}…` : d.caption}</p>
                  <button type="button" className="btn btn--ghost ads-btn-xs" onClick={() => applyDraft(d)}>Use</button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {/* Queue */}
      <section className="ads-list">
        <header className="ads-list__head">
          <h2>Queue</h2>
          <button type="button" className="btn btn--ghost ads-btn-sm" onClick={() => void loadQueue()}>Refresh</button>
        </header>
        {!queue.length ? (
          <div className="ads-hint">Nothing scheduled or published from here yet.</div>
        ) : (
          <div className="ads-tablewrap">
            <table className="ads-table">
              <thead><tr><th></th><th>Caption</th><th>Status</th><th>When</th><th></th></tr></thead>
              <tbody>
                {queue.map((q) => (
                  <tr key={q.id}>
                    <td><Thumb src={q.image} /></td>
                    <td>
                      <div className="ads-table__sub">{q.platform}{q.pillarId ? ` · ${pillars.find((p) => p.id === q.pillarId)?.name ?? q.pillarId}` : ""}</div>
                      <div>{q.caption.length > 120 ? `${q.caption.slice(0, 119)}…` : q.caption}</div>
                      {q.error && <div className="ads-table__err">{q.error}</div>}
                    </td>
                    <td><span className={`ads-pill ads-pill--${q.status === "posted" ? "active" : q.status === "scheduled" ? "submitted" : q.status === "failed" ? "failed" : "paused"}`}>{q.status}</span></td>
                    <td className="ads-table__sub">{q.scheduledAt ? new Date(q.scheduledAt).toLocaleString() : q.publishedAt ? new Date(q.publishedAt).toLocaleString() : "—"}</td>
                    <td className="ads-table__actions">
                      {q.status === "scheduled" && <button type="button" className="btn btn--ghost ads-btn-xs" disabled={!!busy} onClick={() => void cancel(q)}>{busy === `cancel:${q.id}` ? "…" : "Cancel"}</button>}
                      {q.permalink && <a className="btn btn--ghost ads-btn-xs" href={q.permalink} target="_blank" rel="noreferrer">Open ↗</a>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
