"use client";

import { useCallback, useEffect, useState } from "react";
import Notice, { type NoticeState } from "@/components/creator/Notice";
import { api, copyText, download, errText } from "@/lib/creator/client";
import type { EmailDraftRecord, EmailDraftSummary, EmailStatus } from "@/lib/creator/email-store";
import type { Pillar } from "@/lib/creator/pillars";

interface Props {
  pillars: Pillar[];
  ai: boolean;
  db: boolean;
}

interface MusingLite {
  id: string;
  num: string;
  title: string;
  date: string;
  img: string | null;
  published: boolean;
}

export default function EmailMaker({ pillars, ai, db }: Props) {
  const [notice, setNotice] = useState<NoticeState>(null);
  const [busy, setBusy] = useState<string | null>(null);
  const [musings, setMusings] = useState<MusingLite[]>([]);
  const [picked, setPicked] = useState<string[]>([]);
  const [pillarId, setPillarId] = useState("");
  const [topic, setTopic] = useState("");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [drafts, setDrafts] = useState<EmailDraftSummary[]>([]);
  const [current, setCurrent] = useState<EmailDraftRecord | null>(null);
  const [tab, setTab] = useState<"html" | "text">("html");

  const loadDrafts = useCallback(() => api<{ items: EmailDraftSummary[] }>("/api/creator/email").then((d) => setDrafts(d.items)).catch(() => undefined), []);

  useEffect(() => {
    api<{ items: MusingLite[] }>("/api/creator/blog/list")
      .then((d) => setMusings(d.items.filter((m) => m.published)))
      .catch((e: unknown) => setNotice({ kind: "err", text: errText(e) }));
    void loadDrafts();
    // URL prefill (?musingIds=m01,m07), applied once from a callback.
    const q = new URLSearchParams(window.location.search).get("musingIds");
    if (q) queueMicrotask(() => setPicked(q.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 3)));
  }, [loadDrafts]);

  function toggle(id: string) {
    setPicked((l) => (l.includes(id) ? l.filter((x) => x !== id) : l.length >= 3 ? l : [...l, id]));
  }

  async function generate() {
    if (!picked.length) return;
    setBusy("generate");
    setNotice(null);
    try {
      const r = await api<{ draft: EmailDraftRecord; subjects: string[]; generated: boolean }>("/api/creator/email/generate", {
        method: "POST",
        json: { musingIds: picked, pillarId: pillarId || undefined, topic },
      });
      setCurrent(r.draft);
      setSubjects(r.subjects);
      setNotice({ kind: r.generated ? "ok" : "warn", text: r.generated ? "Newsletter written and saved." : "Saved with fallback copy (AI unavailable)." });
      await loadDrafts();
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  async function openDraft(id: string) {
    setBusy(`open:${id}`);
    try {
      const r = await api<{ draft: EmailDraftRecord }>(`/api/creator/email/${id}`);
      setCurrent(r.draft);
      setSubjects([]);
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(null);
    }
  }

  async function patch(p: { subject?: string; status?: EmailStatus; name?: string }) {
    if (!current) return;
    try {
      const r = await api<{ draft: EmailDraftRecord }>(`/api/creator/email/${current.id}`, { method: "PATCH", json: p });
      setCurrent(r.draft);
      await loadDrafts();
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    }
  }

  async function remove(id: string) {
    if (!window.confirm("Delete this newsletter draft?")) return;
    try {
      await api(`/api/creator/email/${id}`, { method: "DELETE" });
      if (current?.id === id) setCurrent(null);
      await loadDrafts();
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    }
  }

  // Changing the subject re-titles the stored HTML too (the template echoes it in <title> and the H1).
  async function applySubject(s: string) {
    if (!current) return;
    const html = current.html.split(current.subject).join(s);
    const text = current.text.replace(current.subject, s);
    try {
      const r = await api<{ draft: EmailDraftRecord }>(`/api/creator/email/${current.id}`, { method: "PATCH", json: { subject: s, name: s, html, text } });
      setCurrent(r.draft);
      await loadDrafts();
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    }
  }

  return (
    <div className="cr-email">
      {!db && <div className="ui-notice ui-notice--warn">No database connected — drafts can&rsquo;t be saved.</div>}
      {!ai && <div className="ui-notice ui-notice--warn">AI isn&rsquo;t configured — the newsletter will use the posts&rsquo; own excerpts.</div>}
      <Notice notice={notice} onClose={() => setNotice(null)} />

      <div className="cr-two cr-gap">
        <section className="ui-step">
          <header className="ui-step__title"><span>①</span> Pick 1–3 published blog posts</header>
          <div className="ui-checklist" style={{ maxHeight: 360 }}>
            {musings.map((m) => (
              <label key={m.id} className="ui-check">
                <input type="checkbox" checked={picked.includes(m.id)} onChange={() => toggle(m.id)} disabled={!picked.includes(m.id) && picked.length >= 3} />
                <span>{m.title}</span>
                <small>{m.num} · {m.date}</small>
              </label>
            ))}
            {!musings.length && <div className="ui-hint">No published blog posts found.</div>}
          </div>
          <div className="ui-row--2" style={{ marginTop: 10 }}>
            <div>
              <label className="ui-label">Pillar (optional)</label>
              <select className="ui-input" value={pillarId} onChange={(e) => setPillarId(e.target.value)}>
                <option value="">— any —</option>
                {pillars.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </div>
            <div>
              <label className="ui-label">Theme for this issue (optional)</label>
              <input className="ui-input" value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="the first snow" />
            </div>
          </div>
          <div className="ui-row" style={{ marginTop: 12 }}>
            <button className="btn btn--gold" disabled={!db || !!busy || !picked.length} onClick={() => void generate()}>{busy === "generate" ? "Writing…" : "Write the newsletter"}</button>
          </div>
        </section>

        <section className="ui-step">
          <header className="ui-step__title"><span>②</span> Drafts</header>
          {!drafts.length ? (
            <div className="ui-hint">None yet.</div>
          ) : (
            <div className="ui-checklist" style={{ maxHeight: 460 }}>
              {drafts.map((d) => (
                <div key={d.id} className={`ui-check cr-draftrow${current?.id === d.id ? " is-on" : ""}`}>
                  <span className={`ui-pill ui-pill--${d.status === "sent" ? "active" : d.status === "ready" ? "submitted" : "paused"}`}>{d.status}</span>
                  <span>
                    <button type="button" className="ui-linkbtn" onClick={() => void openDraft(d.id)}>{d.subject}</button>
                    <small style={{ display: "block" }}>{new Date(d.createdAt).toLocaleDateString()} · {d.musingIds.join(", ")}</small>
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {current && (
        <section className="ui-list">
          <header className="ui-list__head">
            <h2>{current.subject}</h2>
            <div className="ui-row">
              <select className="ui-input ui-input--sm" value={current.status} onChange={(e) => void patch({ status: e.target.value as EmailStatus })}>
                <option value="proposed">proposed</option><option value="ready">ready</option><option value="sent">sent</option>
              </select>
              <button className="btn btn--ghost ui-btn-sm" onClick={() => void copyText(current.html).then((ok) => setNotice({ kind: ok ? "ok" : "err", text: ok ? "HTML copied." : "Couldn't copy." }))}>Copy HTML</button>
              <button className="btn btn--ghost ui-btn-sm" onClick={() => void copyText(current.text).then((ok) => setNotice({ kind: ok ? "ok" : "err", text: ok ? "Text copied." : "Couldn't copy." }))}>Copy text</button>
              <button className="btn btn--ghost ui-btn-sm" onClick={() => download(`${current.subject.replace(/[^a-z0-9]+/gi, "-").toLowerCase()}.html`, current.html, "text/html")}>Download .html</button>
              <button className="btn btn--ghost ui-btn-sm" style={{ color: "#e07070" }} onClick={() => void remove(current.id)}>Delete</button>
            </div>
          </header>
          {subjects.length > 1 && (
            <div className="ui-row" style={{ marginBottom: 10 }}>
              <span className="ui-label" style={{ margin: 0 }}>Subject options</span>
              {subjects.map((s) => (
                <button key={s} type="button" className={`cr-option cr-option--inline${current.subject === s ? " is-selected" : ""}`} onClick={() => void applySubject(s)}>{s}</button>
              ))}
            </div>
          )}
          <div className="ui-hint" style={{ marginBottom: 8 }}>Preheader: {current.preheader || "—"}</div>
          <div className="ui-row" style={{ marginBottom: 8 }}>
            <button type="button" className={`btn btn--ghost ui-btn-xs${tab === "html" ? " is-on" : ""}`} onClick={() => setTab("html")}>HTML preview</button>
            <button type="button" className={`btn btn--ghost ui-btn-xs${tab === "text" ? " is-on" : ""}`} onClick={() => setTab("text")}>Plain text</button>
          </div>
          {tab === "html" ? (
            <iframe title="Newsletter preview" className="cr-iframe" srcDoc={current.html} sandbox="" />
          ) : (
            <pre className="cr-pre">{current.text}</pre>
          )}
        </section>
      )}
    </div>
  );
}
