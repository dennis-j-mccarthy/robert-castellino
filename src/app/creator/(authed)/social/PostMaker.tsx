"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import ImageGrid from "@/components/creator/ImageGrid";
import Notice, { type NoticeState } from "@/components/creator/Notice";
import Thumb from "@/components/creator/Thumb";
import { api, copyText, errText } from "@/lib/creator/client";
import { designedImagePath, type DesignedPost } from "@/lib/creator/designed";
import type { LibraryItem } from "@/lib/creator/library";
import { pillarTagClsFor, type CoreMessage, type Pillar } from "@/lib/creator/pillars";
import { CAPTION_LIMITS, PLATFORM_LABELS, PUBLISHES, SOCIAL_PLATFORMS, isSocialPlatform, type SocialPlatform } from "@/lib/creator/social";
import { studio } from "@/studio.config";

/*
  Post maker. Three steps down the left, the live post on the right.

    ① Platform   Facebook publishes; Instagram is copy-only (no IG linked)
    ② Picture    the real plates (mockups never offered); paste a URL too
    ③ Pillar     the moment a pillar is picked, five CONCEPTS write
                 themselves: an angle each, a designed graphic (a bold
                 statement in the brand's type and colours, or set over the
                 chosen picture) and the caption. Statement, sub and caption
                 are editable; the graphic re-renders as you type. "Use this"
                 puts the caption and the graphic on the post; "Plain photo"
                 puts the picture back.

  URL prefill (from the Library, the Musings list, the Posts board):
    /creator/social?imageId=/assets/…&caption=…&platform=facebook&pillar=light&at=2026-11-01T07:30&musingId=m07&draftId=…
*/

interface Props {
  library: LibraryItem[];
  pillars: Pillar[];
  messages: CoreMessage[];
  config: { connected: boolean; page: string | null; pageId: string | null; ai: boolean };
}

const TILES = 5;

const toLocalInput = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

export default function PostMaker({ library, pillars, messages, config }: Props) {
  const [notice, setNotice] = useState<NoticeState>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const [platform, setPlatform] = useState<SocialPlatform>("facebook");
  const [image, setImage] = useState<string>("");
  const [customUrl, setCustomUrl] = useState("");
  const [pillarId, setPillarId] = useState<string>("");
  const [messageId, setMessageId] = useState<string>("");
  const [topic, setTopic] = useState("");
  const [musingId, setMusingId] = useState("");
  const [tiles, setTiles] = useState<DesignedPost[]>([]);
  const [graphic, setGraphic] = useState<string>(""); // site-relative og path when a concept is on the post
  const [used, setUsed] = useState<number | null>(null);
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [draftId, setDraftId] = useState<string | null>(null);
  const [result, setResult] = useState<{ id: string; scheduled: boolean; scheduledAt: string | null; page: string } | null>(null);

  const selected = useMemo(() => library.find((i) => i.src === image) ?? null, [library, image]);
  const pictureUrl = selected ? selected.url : /^https:\/\//i.test(image) ? image : "";
  const origin = typeof window !== "undefined" ? window.location.origin : "";
  const imageUrl = graphic ? `${origin}${graphic}` : pictureUrl;
  const pillarMessages = messages.filter((m) => !pillarId || m.pillar === pillarId);
  const pillar = pillars.find((p) => p.id === pillarId) ?? null;

  // URL prefill — applied once after mount.
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

  // The tiles write themselves whenever the pillar (or platform under it) changes.
  const writeCaptions = useCallback(async (why: "auto" | "more") => {
    if (!pillarId || !config.ai) return;
    setBusy("captions");
    setNotice(null);
    try {
      const r = await api<{ posts: DesignedPost[] }>("/api/creator/social/concepts", {
        method: "POST",
        json: { pillarId, messageId: messageId || undefined, platform, imageSrc: selected?.src, musingId: musingId || undefined, topic, count: TILES },
      });
      setTiles(r.posts);
      setUsed(null);
      if (why === "auto" && !caption.trim() && r.posts[0]) { setCaption(r.posts[0].caption); setUsed(0); setGraphic(designedImagePath(r.posts[0], { img: r.posts[0].theme === "photo-hero" ? pictureUrl : null })); }
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
    // caption is read once at call time on purpose: an auto write must not re-run when the caption changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pillarId, messageId, platform, selected?.src, musingId, topic, config.ai]);

  const lastAuto = useRef("");
  useEffect(() => {
    if (!pillarId) return;
    const key = `${pillarId}|${platform}`;
    if (lastAuto.current === key) return;
    lastAuto.current = key;
    void writeCaptions("auto");
  }, [pillarId, platform, writeCaptions]);

  const tilePath = (t: DesignedPost) => designedImagePath(t, { img: t.theme === "photo-hero" ? pictureUrl : null });
  function editTile(i: number, patch: Partial<DesignedPost>) {
    setTiles((t) => t.map((x, j) => (j === i ? { ...x, ...patch } : x)));
    if (used === i) {
      const next = { ...tiles[i], ...patch };
      if (patch.caption !== undefined) setCaption(patch.caption);
      if (patch.caption === undefined) setGraphic(tilePath(next));
    }
  }
  function pickTile(i: number) { setUsed(i); setCaption(tiles[i].caption); setGraphic(tilePath(tiles[i])); }

  async function submit(schedule: boolean) {
    setBusy(schedule ? "schedule" : "publish");
    setNotice(null);
    setResult(null);
    try {
      const r = await api<{ ok: true; id: string; scheduled: boolean; scheduledAt: string | null; page: string }>("/api/creator/social/publish", {
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
      setNotice({ kind: "ok", text: r.scheduled ? `Scheduled on ${r.page}. It will show under Scheduled above after a refresh.` : `Published to ${r.page}.` });
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  const limit = CAPTION_LIMITS[platform];
  const publishes = PUBLISHES[platform];
  const canSend = config.connected && publishes && !!caption.trim() && caption.length <= limit && !busy;
  const done = { platform: true, image: !!image, pillar: !!pillarId };

  return (
    <div className="pm">
      {!config.connected && (
        <div className="ui-notice ui-notice--warn">
          <strong>Facebook isn&rsquo;t connected.</strong> Set <code>META_PAGE_ID</code> + <code>META_PAGE_TOKEN</code> (or connect on <Link href="/admin/social">/admin/social</Link>). Captions still work; publishing is disabled.
        </div>
      )}
      <Notice notice={notice} onClose={() => setNotice(null)} />

      <div className="pm__grid">
        <div className="pm__steps">
          {/* ① Platform */}
          <section className="ui-step is-done pm__step">
            <header className="ui-step__title"><span>①</span> Where <i className="cr-done">✓</i></header>
            <div className="pm__chips" role="radiogroup" aria-label="Platform">
              {SOCIAL_PLATFORMS.map((p) => (
                <button key={p} type="button" role="radio" aria-checked={platform === p} className={`pm__chip${platform === p ? " is-on" : ""}`} onClick={() => setPlatform(p)}>
                  <b>{PLATFORM_LABELS[p]}</b>
                  <small>{PUBLISHES[p] ? (config.connected ? `posts to ${config.page ?? "the Page"}` : "needs the Page token") : "copy the words out by hand"}</small>
                </button>
              ))}
            </div>
          </section>

          {/* ② Picture */}
          <section className={`ui-step pm__step${done.image ? " is-done" : ""}`}>
            <header className="ui-step__title"><span>②</span> Picture {done.image && <i className="cr-done">✓</i>}</header>
            <ImageGrid items={library} pillars={pillars} selected={image} initialPillar={pillarId} onSelect={(it) => { setImage(it.src); setCustomUrl(""); }} maxHeight={300} compact />
            {selected && (
              <div className="ui-hint">{selected.title ?? selected.label}{selected.loc ? ` · ${selected.loc}` : ""}{selected.bookPage ? ` · in the book, p.${selected.bookPage}` : ""}</div>
            )}
            <details className="pm__more">
              <summary>Or paste a picture link</summary>
              <input className="ui-input" placeholder="https://…/photo.jpg" value={customUrl} onChange={(e) => { setCustomUrl(e.target.value); if (e.target.value.trim()) setImage(e.target.value.trim()); }} />
            </details>
          </section>

          {/* ③ Pillar → tiles */}
          <section className={`ui-step pm__step${done.pillar ? " is-done" : ""}`}>
            <header className="ui-step__title"><span>③</span> What it&rsquo;s about {done.pillar && <i className="cr-done">✓</i>}</header>
            <div className="pm__pillars" role="radiogroup" aria-label="Pillar">
              {pillars.map((p) => (
                <button key={p.id} type="button" role="radio" aria-checked={pillarId === p.id} className={`pm__pillar${pillarId === p.id ? " is-on" : ""}`} onClick={() => { setPillarId(p.id); setMessageId(""); }}>
                  <span className={pillarTagClsFor(pillars, p.id)}>{p.name}</span>
                  <small>{p.message}</small>
                </button>
              ))}
            </div>
            <details className="pm__more">
              <summary>Steer the writing (optional)</summary>
              <label className="ui-label">Core message</label>
              <select className="ui-input" value={messageId} onChange={(e) => setMessageId(e.target.value)}>
                <option value="">— let the writer choose —</option>
                {pillarMessages.map((m) => <option key={m.id} value={m.id}>{m.text}</option>)}
              </select>
              <label className="ui-label">What this post is about</label>
              <input className="ui-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="first light on the Bells, late September" />
              <label className="ui-label">Promote a blog post (id)</label>
              <input className="ui-input" placeholder="m07" value={musingId} onChange={(e) => setMusingId(e.target.value.trim())} />
              <div className="ui-hint">Changes here apply the next time you press Write 5 more.</div>
            </details>

            {pillarId && (
              <div className="pm__tiles">
                <div className="pm__tiles-head">
                  <b>{busy === "captions" ? "Working five angles…" : tiles.length ? `Five angles · ${pillar?.name ?? ""}` : "Nothing written yet"}</b>
                  <button type="button" className="btn btn--ghost ui-btn-xs" disabled={!config.ai || !!busy} onClick={() => void writeCaptions("more")}>{busy === "captions" ? "…" : "Five more angles"}</button>
                </div>
                {!config.ai && <div className="ui-hint">AI is not configured, so write the words on the post itself, right.</div>}
                {busy === "captions" && !tiles.length && (
                  <div className="pm__tilegrid" aria-hidden>{Array.from({ length: TILES }).map((_, i) => <div key={i} className="pm__tile is-ghost" />)}</div>
                )}
                {tiles.length > 0 && (
                  <div className="pm__tilegrid pm__tilegrid--designed">
                    {tiles.map((t, i) => (
                      <div key={i} className={`pm__tile pm__tile--designed${used === i ? " is-used" : ""}`}>
                        <div className="pm__tile-angle"><b>{t.angle}</b><small>{t.theme === "photo-hero" ? "on your picture" : t.theme}</small></div>
                        <div className="pm__tile-img">
                          {/* eslint-disable-next-line @next/next/no-img-element -- rendered by our own og route */}
                          <img src={tilePath(t)} alt={t.statement} loading="lazy" />
                        </div>
                        <input className="pm__tile-line" value={t.statement} onChange={(e) => editTile(i, { statement: e.target.value })} aria-label="Statement on the graphic" />
                        {t.theme !== "checklist" && t.theme !== "steps" && (
                          <input className="pm__tile-line pm__tile-line--sub" value={t.sub} placeholder={t.theme === "quote" ? "attribution" : "supporting line"} onChange={(e) => editTile(i, { sub: e.target.value })} aria-label="Supporting line" />
                        )}
                        <textarea value={t.caption} onChange={(e) => editTile(i, { caption: e.target.value })} rows={4} aria-label={`Caption option ${i + 1}`} />
                        <div className="pm__tile-foot">
                          <span className={t.caption.length > limit ? "ui-hint--err" : ""}>{t.caption.length} / {limit}</span>
                          <span className="ui-row" style={{ gap: 6 }}>
                            <a className="btn btn--ghost ui-btn-xs" href={tilePath(t)} target="_blank" rel="noreferrer" title="Open the graphic full size">PNG ↗</a>
                            <button type="button" className={`btn ui-btn-xs${used === i ? " btn--gold" : ""}`} onClick={() => pickTile(i)}>{used === i ? "On the post" : "Use this"}</button>
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </section>
        </div>

        {/* Live post + send */}
        <aside className="pm__side">
          <div className="pm__side-h">The post, as it will look</div>
          <article className={`fbcard pm__card${platform === "instagram" ? " is-ig" : ""}`}>
            <header className="fbcard__head">
              <div className="fbcard__avatar">{studio.site.short.split(/\s+/).map((w) => w[0]).join("").slice(0, 2).toUpperCase()}</div>
              <div>
                <div className="fbcard__page">{config.page ?? studio.site.name}</div>
                <div className="fbcard__meta">{scheduledAt ? `Scheduled · ${new Date(scheduledAt).toLocaleString()}` : "Just now"} · {PLATFORM_LABELS[platform]}</div>
              </div>
            </header>
            {platform === "facebook" && (
              <textarea className="fbcard__msg pm__msg" value={caption} onChange={(e) => { setCaption(e.target.value); setUsed(null); }} placeholder="Pick a pillar and the words write themselves. Or type here." rows={4} aria-label="Caption" />
            )}
            <div className="fbcard__img">
              {graphic ? (
                // eslint-disable-next-line @next/next/no-img-element -- rendered by our own og route
                <img src={graphic} alt="" className="pm__graphic" />
              ) : (
                <Thumb src={image} className="" empty={<div className="fbcard__img-empty">Pick a picture (②)</div>} />
              )}
            </div>
            {platform === "instagram" && (
              <textarea className="fbcard__msg pm__msg" value={caption} onChange={(e) => { setCaption(e.target.value); setUsed(null); }} placeholder="Pick a pillar and the words write themselves. Or type here." rows={4} aria-label="Caption" />
            )}
          </article>
          <div className={`ui-hint pm__count${caption.length > limit ? " ui-hint--err" : ""}`}>
            {caption.length} / {limit}{used != null ? ` · ${tiles[used]?.angle ?? `tile ${used + 1}`}` : caption ? " · your own words" : ""}
            {graphic && <> · designed graphic <button type="button" className="ui-linkbtn" onClick={() => setGraphic("")}>Plain photo instead</button></>}
            {!graphic && used != null && tiles[used] && <> · <button type="button" className="ui-linkbtn" onClick={() => setGraphic(tilePath(tiles[used]))}>Put the graphic back</button></>}
          </div>

          <div className="pm__send">
            <label className="ui-label">When</label>
            <div className="pm__when">
              <button type="button" className={`pm__chip pm__chip--sm${!scheduledAt ? " is-on" : ""}`} onClick={() => setScheduledAt("")}>Now</button>
              <input className="ui-input" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} aria-label="Schedule for" />
            </div>
            <div className="ui-row" style={{ marginTop: 12 }}>
              {!scheduledAt ? (
                <button className="btn btn--gold" disabled={!canSend} onClick={() => void submit(false)}>{busy === "publish" ? "Publishing…" : `Publish to ${PLATFORM_LABELS[platform]}`}</button>
              ) : (
                <button className="btn btn--gold" disabled={!canSend} onClick={() => void submit(true)}>{busy === "schedule" ? "Scheduling…" : "Schedule it"}</button>
              )}
              <button type="button" className="btn btn--ghost ui-btn-sm" disabled={!caption.trim()} onClick={() => void copyText(caption).then((ok) => setNotice({ kind: ok ? "ok" : "err", text: ok ? "Words copied." : "Couldn't copy." }))}>Copy the words</button>
            </div>
            {!publishes && <div className="ui-hint">Instagram is not linked yet, so copy the words and post the picture from the app.</div>}
            {scheduledAt && <div className="ui-hint">Meta needs 15 minutes to 6 months of lead time.</div>}
            {draftId && <div className="ui-hint">Working from a saved draft. <button type="button" className="ui-linkbtn" onClick={() => setDraftId(null)}>Start fresh instead</button></div>}
            {result && (
              <div className="ui-notice ui-notice--ok" style={{ marginTop: 12 }}>
                {result.scheduled ? "Scheduled" : "Published"}{result.scheduledAt ? ` for ${new Date(result.scheduledAt).toLocaleString()}` : ""}.
                {!result.scheduled && <> <a href={`https://www.facebook.com/${result.id}`} target="_blank" rel="noreferrer">See it on Facebook ↗</a></>}
                {" "}<a href="/creator/social">Back to all posts</a>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
