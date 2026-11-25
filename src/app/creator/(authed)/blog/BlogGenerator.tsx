"use client";

import Link from "next/link";
import { useState } from "react";
import ImageGrid from "@/components/creator/ImageGrid";
import Notice, { type NoticeState } from "@/components/creator/Notice";
import type { BlogTone } from "@/lib/creator/blog-tone";
import { api, errText, seasonLabel } from "@/lib/creator/client";
import type { LibraryItem } from "@/lib/creator/library";
import type { Pillar } from "@/lib/creator/pillars";
import { studio } from "@/studio.config";

interface Props {
  pillars: Pillar[];
  tone: BlogTone;
  ai: boolean;
  library: LibraryItem[];
}

const CATS = ["reflections", "light", "land", "locations", "wilderness"] as const;

interface Draft {
  title: string;
  excerpt: string;
  body: string;
  loc: string;
  cat: string;
  date: string;
  img: string;
  size: string;
}

export default function BlogGenerator({ pillars, tone, ai, library }: Props) {
  const [notice, setNotice] = useState<NoticeState>(null);
  const [busy, setBusy] = useState<string | null>(null);

  // ① tone
  const [t, setT] = useState<BlogTone>(tone);
  const [toneOpen, setToneOpen] = useState(false);

  // ② titles
  const [pillarId, setPillarId] = useState<string>(pillars[0]?.id ?? "");
  const [topic, setTopic] = useState("");
  const [titles, setTitles] = useState<string[]>([]);
  const [title, setTitle] = useState("");

  // ③ write
  const [notes, setNotes] = useState("");
  const [loc, setLoc] = useState("");
  const [draft, setDraft] = useState<Draft | null>(null);
  const [picker, setPicker] = useState(false);
  const [saved, setSaved] = useState<{ id: string; published: boolean } | null>(null);

  async function saveTone() {
    setBusy("tone");
    try {
      await api("/api/creator/blog/tone", { method: "PUT", json: { tone: t } });
      setNotice({ kind: "ok", text: "Tone brief saved." });
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  async function suggestTitles() {
    setBusy("titles");
    setNotice(null);
    try {
      const r = await api<{ titles: string[] }>("/api/creator/blog/titles", { method: "POST", json: { topic, pillarId, count: 6 } });
      setTitles(r.titles);
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  async function write() {
    if (!title.trim()) return;
    setBusy("write");
    setNotice(null);
    setSaved(null);
    try {
      const r = await api<{ draft: { title: string; excerpt: string; body: string[]; loc: string; cat: string } }>("/api/creator/blog/write", {
        method: "POST",
        json: { title: title.trim(), pillarId, notes, loc },
      });
      setDraft({
        title: r.draft.title,
        excerpt: r.draft.excerpt,
        body: r.draft.body.join("\n\n"),
        loc: r.draft.loc,
        cat: r.draft.cat,
        date: seasonLabel(),
        img: "",
        size: "",
      });
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  function startBlank() {
    setDraft({ title: title.trim(), excerpt: "", body: "", loc, cat: "reflections", date: seasonLabel(), img: "", size: "" });
    setSaved(null);
  }

  async function save(publish: boolean) {
    if (!draft) return;
    const body = draft.body.split(/\n\n+/).map((s) => s.trim()).filter(Boolean);
    if (!draft.title.trim() || !draft.excerpt.trim() || !body.length) {
      setNotice({ kind: "err", text: "A title, an excerpt and at least one paragraph are needed." });
      return;
    }
    setBusy(publish ? "publish" : "save");
    setNotice(null);
    try {
      const payload = {
        id: saved?.id,
        category: draft.cat,
        title: draft.title.trim(),
        date: draft.date.trim() || seasonLabel(),
        loc: draft.loc.trim() || null,
        img: draft.img.trim() || null,
        excerpt: draft.excerpt.trim(),
        paragraphs: body,
        published: publish,
      };
      const m = await api<{ id: string; published: boolean }>("/api/creator/blog/save", { method: "POST", json: payload });
      setSaved({ id: m.id, published: m.published });
      setNotice({ kind: "ok", text: publish ? `Published — it's live on ${studio.brand.blog.path}.` : "Saved as a draft (unpublished)." });
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  const selectedImg = library.find((i) => i.src === draft?.img);

  return (
    <div className="cr-blog">
      {!ai && <div className="ui-notice ui-notice--warn">AI isn&rsquo;t configured (no <code>ANTHROPIC_API_KEY</code>). You can still write a post by hand below.</div>}
      <Notice notice={notice} onClose={() => setNotice(null)} />

      {/* ① tone */}
      <section className="ui-step cr-block">
        <header className="ui-step__title ui-row--between">
          <span><span>①</span> Tone brief</span>
          <button type="button" className="ui-linkbtn" onClick={() => setToneOpen((o) => !o)}>{toneOpen ? "Hide" : "Edit"}</button>
        </header>
        {!toneOpen ? (
          <p className="cr-muted cr-small" style={{ margin: 0 }}>{t.voice || "No voice note."} {t.style ? ` · ${t.style}` : ""}</p>
        ) : (
          <>
            {(["voice", "audience", "style", "dos", "donts"] as const).map((k) => (
              <div key={k}>
                <label className="ui-label">{k === "dos" ? "Do" : k === "donts" ? "Don't" : k}</label>
                <textarea className="ui-input" rows={2} value={t[k]} onChange={(e) => setT({ ...t, [k]: e.target.value })} />
              </div>
            ))}
            <div className="ui-row" style={{ marginTop: 10 }}>
              <button className="btn btn--gold ui-btn-sm" disabled={!!busy} onClick={() => void saveTone()}>{busy === "tone" ? "Saving…" : "Save tone"}</button>
            </div>
          </>
        )}
      </section>

      {/* ② titles */}
      <section className="ui-step cr-block">
        <header className="ui-step__title"><span>②</span> Pillar &amp; title</header>
        <div className="ui-row--2">
          <div>
            <label className="ui-label">Pillar</label>
            <select className="ui-input" value={pillarId} onChange={(e) => setPillarId(e.target.value)}>
              {pillars.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.message}</option>)}
            </select>
          </div>
          <div>
            <label className="ui-label">Topic (optional)</label>
            <input className="ui-input" placeholder="e.g. the first snow on the Flatirons" value={topic} onChange={(e) => setTopic(e.target.value)} />
          </div>
        </div>
        <div className="ui-row" style={{ marginTop: 12 }}>
          <button className="btn btn--gold ui-btn-sm" disabled={!ai || !!busy} onClick={() => void suggestTitles()}>{busy === "titles" ? "Thinking…" : "Suggest 6 titles"}</button>
        </div>
        {titles.length > 0 && (
          <div className="cr-options">
            {titles.map((x) => (
              <button key={x} type="button" className={`cr-option${title === x ? " is-selected" : ""}`} onClick={() => setTitle(x)}>{x}</button>
            ))}
          </div>
        )}
        <label className="ui-label">Title (pick one above or type your own)</label>
        <input className="ui-input" value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Red Mountain Pass, in February" />
      </section>

      {/* ③ write */}
      <section className="ui-step cr-block">
        <header className="ui-step__title"><span>③</span> Write</header>
        <div className="ui-row--2">
          <div>
            <label className="ui-label">Place (optional)</label>
            <input className="ui-input" value={loc} onChange={(e) => setLoc(e.target.value)} placeholder="Maroon Lake" />
          </div>
          <div />
        </div>
        <label className="ui-label">{studio.site.owner}&rsquo;s rough notes (optional — the piece stays inside them)</label>
        <textarea className="ui-input" rows={4} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="what happened, what the light did, what he noticed…" />
        <div className="ui-row" style={{ marginTop: 12 }}>
          <button className="btn btn--gold ui-btn-sm" disabled={!ai || !!busy || !title.trim()} onClick={() => void write()}>{busy === "write" ? "Writing…" : "Write the post"}</button>
          <button className="btn btn--ghost ui-btn-sm" disabled={!!busy || !title.trim()} onClick={startBlank}>Start blank</button>
        </div>
      </section>

      {/* ④ edit & publish */}
      {draft && (
        <section className="ui-step cr-block">
          <header className="ui-step__title"><span>④</span> Edit &amp; publish</header>
          <label className="ui-label">Title</label>
          <input className="ui-input" value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
          <div className="ui-row--2">
            <div>
              <label className="ui-label">Category</label>
              <select className="ui-input" value={draft.cat} onChange={(e) => setDraft({ ...draft, cat: e.target.value })}>
                {CATS.map((c) => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="ui-label">Date label</label>
              <input className="ui-input" value={draft.date} onChange={(e) => setDraft({ ...draft, date: e.target.value })} />
            </div>
          </div>
          <div className="ui-row--2">
            <div>
              <label className="ui-label">Place</label>
              <input className="ui-input" value={draft.loc} onChange={(e) => setDraft({ ...draft, loc: e.target.value })} />
            </div>
            <div>
              <label className="ui-label">Card size</label>
              <select className="ui-input" value={draft.size} onChange={(e) => setDraft({ ...draft, size: e.target.value })}>
                <option value="">auto</option><option value="sm">sm</option><option value="md">md</option><option value="lg">lg</option>
              </select>
            </div>
          </div>
          <label className="ui-label">Excerpt</label>
          <textarea className="ui-input" rows={2} value={draft.excerpt} onChange={(e) => setDraft({ ...draft, excerpt: e.target.value })} />
          <label className="ui-label">Body (blank line between paragraphs)</label>
          <textarea className="ui-input" rows={14} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />

          <label className="ui-label">Image</label>
          <div className="ui-row">
            {selectedImg ? (
              /* eslint-disable-next-line @next/next/no-img-element -- library thumb */
              <img className="ui-table__thumb" src={selectedImg.src} alt="" />
            ) : null}
            <input className="ui-input" style={{ flex: 1 }} value={draft.img} onChange={(e) => setDraft({ ...draft, img: e.target.value })} placeholder="/assets/collections/…jpg" />
            <button type="button" className="btn btn--ghost ui-btn-xs" onClick={() => setPicker((p) => !p)}>{picker ? "Close library" : "Pick from library"}</button>
          </div>
          {picker && (
            <div style={{ marginTop: 10 }}>
              <ImageGrid items={library} pillars={pillars} selected={draft.img} initialPillar={pillarId} onSelect={(it) => { setDraft({ ...draft, img: it.src }); setPicker(false); }} maxHeight={300} compact />
            </div>
          )}

          <div className="ui-row" style={{ marginTop: 16 }}>
            <button className="btn btn--gold" disabled={!!busy} onClick={() => void save(true)}>{busy === "publish" ? "Publishing…" : saved?.published ? "Update (live)" : "Publish"}</button>
            <button className="btn btn--ghost" disabled={!!busy} onClick={() => void save(false)}>{busy === "save" ? "Saving…" : saved && !saved.published ? "Update draft" : "Save as draft"}</button>
            {saved && (
              <span className="ui-hint" style={{ margin: 0 }}>
                Saved as <code>{saved.id}</code> ·{" "}
                {saved.published && <a href={`/musings/${saved.id}`} target="_blank" rel="noreferrer">view ↗</a>}{" "}
                · <Link href={`/creator/social?musingId=${saved.id}${draft.img ? `&imageId=${encodeURIComponent(draft.img)}` : ""}&pillar=${pillarId}`}>make a post</Link>
                {" "}· <Link href="/creator/blog/posts">all blog posts</Link>
              </span>
            )}
          </div>
        </section>
      )}
    </div>
  );
}
