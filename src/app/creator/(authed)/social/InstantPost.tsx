"use client";

import { useRef, useState } from "react";
import Notice, { type NoticeState } from "@/components/creator/Notice";
import { api, copyText, errText } from "@/lib/creator/client";
import { CAPTION_LIMITS, PLATFORM_LABELS, PUBLISHES, SOCIAL_PLATFORMS, type SocialPlatform } from "@/lib/creator/social";
import { studio } from "@/studio.config";

/*
  Instant post. A photo from the desktop or the camera roll, up to three
  bullet points, and the studio builds the post: looks at the picture,
  writes the caption in Bob's voice, picks the pillar, shows the post.
  Publish now, schedule, copy the words, or hand it to the full maker.
  The photo also lands in Brand kit → Pictures (the uploads collection) so
  it can be used again.
*/

type Built = { caption: string; pillarId: string; alt: string; place: string };

export default function InstantPost({ config }: { config: { connected: boolean; page: string | null; ai: boolean } }) {
  const fileRef = useRef<HTMLInputElement>(null);
  const camRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null); // local object URL while uploading
  const [image, setImage] = useState<{ url: string; src: string } | null>(null); // uploaded
  const [bullets, setBullets] = useState(["", "", ""]);
  const [platform, setPlatform] = useState<SocialPlatform>("facebook");
  const [built, setBuilt] = useState<Built | null>(null);
  const [caption, setCaption] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [busy, setBusy] = useState<"upload" | "build" | "publish" | "schedule" | null>(null);
  const [notice, setNotice] = useState<NoticeState>(null);
  const [done, setDone] = useState<{ id: string; scheduled: boolean } | null>(null);

  async function takeFile(f: File | undefined) {
    if (!f) return;
    setNotice(null); setBuilt(null); setCaption(""); setDone(null);
    setPreview(URL.createObjectURL(f));
    setBusy("upload");
    try {
      const fd = new FormData();
      fd.append("file", f);
      const up = await fetch("/api/creator/upload", { method: "POST", body: fd });
      const uj = (await up.json()) as { url?: string; error?: string };
      if (!up.ok || !uj.url) throw new Error(uj.error ?? "Upload failed");
      const added = await api<{ src: string }>("/api/creator/library/add", { method: "POST", json: { url: uj.url, title: f.name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ") } }).catch(() => ({ src: uj.url! }));
      setImage({ url: uj.url, src: added.src });
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
      setPreview(null);
    } finally {
      setBusy(null);
    }
  }

  async function build() {
    if (!image) { setNotice({ kind: "err", text: "Add a photo first." }); return; }
    const notes = bullets.map((b) => b.trim()).filter(Boolean);
    if (!notes.length) { setNotice({ kind: "err", text: "Give me at least one bullet point." }); return; }
    setBusy("build"); setNotice(null); setDone(null);
    try {
      const r = await api<Built>("/api/creator/social/instant", { method: "POST", json: { imageUrl: image.url, bullets: notes, platform } });
      setBuilt(r);
      setCaption(r.caption);
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  async function send(schedule: boolean) {
    if (!image || !caption.trim()) return;
    setBusy(schedule ? "schedule" : "publish"); setNotice(null);
    try {
      const r = await api<{ id: string; scheduled: boolean; page: string }>("/api/creator/social/publish", {
        method: "POST",
        json: { caption, imageUrl: new URL(image.url, window.location.origin).toString(), scheduledAt: schedule && scheduledAt ? new Date(scheduledAt).toISOString() : undefined, pillarId: built?.pillarId || undefined },
      });
      setDone({ id: r.id, scheduled: r.scheduled });
      setNotice({ kind: "ok", text: r.scheduled ? `Scheduled on ${r.page}.` : `Published to ${r.page}.` });
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  function reset() {
    setPreview(null); setImage(null); setBullets(["", "", ""]); setBuilt(null); setCaption(""); setScheduledAt(""); setDone(null); setNotice(null);
  }

  const limit = CAPTION_LIMITS[platform];
  const canSend = config.connected && PUBLISHES[platform] && !!image && !!caption.trim() && caption.length <= limit && !busy;
  const makerHref = image ? `/creator/social?imageId=${encodeURIComponent(image.src)}&caption=${encodeURIComponent(caption.slice(0, 500))}&platform=${platform}${built?.pillarId ? `&pillar=${built.pillarId}` : ""}#make` : "#make";

  return (
    <div className="ip">
      <Notice notice={notice} onClose={() => setNotice(null)} />
      <div className="ip__grid">
        <div className="ip__left">
          {/* 1 · Photo */}
          <section className="ads-step pm__step">
            <header className="ads-step__title"><span>①</span> Photo {image && <i className="cr-done">✓</i>}</header>
            <div className={`ip__drop${preview ? " has-img" : ""}`} onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); void takeFile(e.dataTransfer.files?.[0]); }}>
              {preview ? <img src={preview} alt="" /> : <p>Drop a photo here, or</p>}
              <div className="ip__drop-btns">
                <button type="button" className="btn ads-btn-sm" disabled={busy === "upload"} onClick={() => fileRef.current?.click()}>{busy === "upload" ? "Uploading…" : preview ? "Different photo" : "Choose from this device"}</button>
                <button type="button" className="btn btn--ghost ads-btn-sm" disabled={busy === "upload"} onClick={() => camRef.current?.click()}>Take a photo</button>
              </div>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => { void takeFile(e.target.files?.[0]); e.target.value = ""; }} />
              <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { void takeFile(e.target.files?.[0]); e.target.value = ""; }} />
            </div>
            <div className="ads-hint">On a phone, &ldquo;Choose from this device&rdquo; opens the camera roll. The photo is also saved to Brand kit → Pictures.</div>
          </section>

          {/* 2 · Three bullets */}
          <section className="ads-step pm__step">
            <header className="ads-step__title"><span>②</span> Three things about it {bullets.some((b) => b.trim()) && <i className="cr-done">✓</i>}</header>
            <div className="ip__bullets">
              {bullets.map((b, i) => (
                <label key={i} className="ip__bullet">
                  <span>•</span>
                  <input className="ads-input" value={b} placeholder={["Where and when (Maroon Bells, last Tuesday, before sunrise)", "What happened or what you noticed", "Why it matters, or what you want people to do"][i]} onChange={(e) => setBullets((l) => l.map((x, j) => (j === i ? e.target.value : x)))} />
                </label>
              ))}
            </div>
            <div className="pm__chips" role="radiogroup" aria-label="Platform" style={{ marginTop: 12 }}>
              {SOCIAL_PLATFORMS.map((p) => (
                <button key={p} type="button" role="radio" aria-checked={platform === p} className={`pm__chip pm__chip--sm${platform === p ? " is-on" : ""}`} onClick={() => setPlatform(p)}><b>{PLATFORM_LABELS[p]}</b></button>
              ))}
            </div>
            <div className="ads-row" style={{ marginTop: 14 }}>
              <button type="button" className="btn btn--gold" disabled={!config.ai || !image || !!busy} onClick={() => void build()}>{busy === "build" ? "Building the post…" : built ? "Build it again" : "Build the post"}</button>
              {!config.ai && <span className="ads-hint" style={{ margin: 0 }}>AI is not configured.</span>}
            </div>
          </section>
        </div>

        {/* The post */}
        <aside className="pm__side">
          <div className="pm__side-h">The post</div>
          <article className="fbcard pm__card">
            <header className="fbcard__head">
              <div className="fbcard__avatar">RC</div>
              <div>
                <div className="fbcard__page">{config.page ?? studio.site.name}</div>
                <div className="fbcard__meta">{scheduledAt ? `Scheduled · ${new Date(scheduledAt).toLocaleString()}` : "Just now"} · {PLATFORM_LABELS[platform]}</div>
              </div>
            </header>
            <textarea className="fbcard__msg pm__msg" value={caption} onChange={(e) => setCaption(e.target.value)} placeholder={built ? "" : "Add a photo and three bullets, press Build the post, and the words appear here. You can edit them."} rows={4} aria-label="Caption" />
            <div className="fbcard__img">
              {preview ? <img src={preview} alt={built?.alt ?? ""} /> : <div className="fbcard__img-empty">Your photo</div>}
            </div>
          </article>
          <div className={`ads-hint pm__count${caption.length > limit ? " ads-hint--err" : ""}`}>{caption.length} / {limit}{built?.place ? ` · ${built.place}` : ""}</div>

          <div className="pm__send">
            <label className="ads-label">When</label>
            <div className="pm__when">
              <button type="button" className={`pm__chip pm__chip--sm${!scheduledAt ? " is-on" : ""}`} onClick={() => setScheduledAt("")}>Now</button>
              <input className="ads-input" type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)} aria-label="Schedule for" />
            </div>
            <div className="ads-row" style={{ marginTop: 12 }}>
              {!scheduledAt ? (
                <button className="btn btn--gold" disabled={!canSend} onClick={() => void send(false)}>{busy === "publish" ? "Publishing…" : `Publish to ${PLATFORM_LABELS[platform]}`}</button>
              ) : (
                <button className="btn btn--gold" disabled={!canSend} onClick={() => void send(true)}>{busy === "schedule" ? "Scheduling…" : "Schedule it"}</button>
              )}
              <button type="button" className="btn btn--ghost ads-btn-sm" disabled={!caption.trim()} onClick={() => void copyText(caption).then((ok) => setNotice({ kind: ok ? "ok" : "err", text: ok ? "Words copied." : "Couldn't copy." }))}>Copy the words</button>
              {built && <a className="btn btn--ghost ads-btn-sm" href={makerHref}>Fine-tune in the maker</a>}
            </div>
            {!PUBLISHES[platform] && <div className="ads-hint">Instagram is not linked yet, so copy the words and post the picture from the app.</div>}
            {done && (
              <div className="ads-notice ads-notice--ok" style={{ marginTop: 12 }}>
                {done.scheduled ? "Scheduled." : "Published."} {!done.scheduled && <a href={`https://www.facebook.com/${done.id}`} target="_blank" rel="noreferrer">See it on Facebook ↗</a>}{" "}
                <button type="button" className="ads-linkbtn" onClick={reset}>Start another</button>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
