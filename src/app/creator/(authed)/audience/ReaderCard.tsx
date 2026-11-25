"use client";

import { useState } from "react";
import { api, errText } from "@/lib/creator/client";

// "The reader": the one or two sentences every piece is written to. Saved
// to the tone brief (BlogSettings.tone.audience) so every generator reads it.
export default function ReaderCard({ initial, db, ai }: { initial: string; db: boolean; ai: boolean }) {
  const [v, setV] = useState(initial);
  const [saved, setSaved] = useState(initial);
  const [busy, setBusy] = useState(false);
  const [opts, setOpts] = useState<string[]>([]);
  const [err, setErr] = useState<string | null>(null);
  const dirty = v !== saved;

  async function save() {
    setBusy(true); setErr(null);
    try {
      const cur = await api<{ tone: Record<string, string> }>("/api/creator/blog/tone");
      await api("/api/creator/blog/tone", { method: "PUT", json: { tone: { ...cur.tone, audience: v } } });
      setSaved(v);
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  }
  async function suggest() {
    setBusy(true); setErr(null);
    try {
      const r = await api<{ options: string[] }>("/api/creator/essence/suggest", { method: "POST", json: { kind: "reader", current: v } });
      setOpts(r.options);
    } catch (e) { setErr(errText(e)); } finally { setBusy(false); }
  }

  return (
    <section className="tl-card au-card">
      <div className="es-field__head"><h4>The reader</h4>{ai && db && <button type="button" className="es-suggest" disabled={busy} onClick={() => void suggest()}><span aria-hidden="true">✦</span> {busy ? "Thinking…" : "Suggest"}</button>}</div>
      <p className="au-exp">One or two sentences. Every blog post, caption and newsletter is written to this person.</p>
      <textarea className="ui-input" rows={3} value={v} disabled={!db || busy} onChange={(e) => setV(e.target.value)} />
      {opts.length > 0 && (
        <div className="es-options">
          {opts.map((o) => <button key={o} type="button" className="es-option" onClick={() => { setV(o); setOpts([]); }}>{o}</button>)}
          <button type="button" className="es-option es-option--quiet" onClick={() => setOpts([])}>Keep mine</button>
        </div>
      )}
      <div className={`lb__savebar${dirty ? " is-dirty" : ""}`}>
        {dirty ? (<><span className="lb__savebar__msg">Unsaved changes</span><button type="button" className="btn btn--gold ui-btn-sm" disabled={busy} onClick={() => void save()}>{busy ? "Saving…" : "Save"}</button><button type="button" className="btn ui-btn-sm" onClick={() => setV(saved)}>Discard</button></>) : <span className="lb__savebar__msg is-ok">Saved</span>}
      </div>
      {err && <p className="au-err">{err}</p>}
    </section>
  );
}
