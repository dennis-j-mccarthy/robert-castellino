"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Notice, { type NoticeState } from "@/components/creator/Notice";
import { api, errText } from "@/lib/creator/client";
import type { BlogTone } from "@/lib/creator/blog-tone";
import { pillarTagCls, type BrandEssenceRecord, type Pillar } from "@/lib/creator/pillars";

interface Props {
  essence: BrandEssenceRecord;
  pillars: Pillar[];
  tone: BlogTone;
  db: boolean;
}

type Draft = Pick<BrandEssenceRecord, "line" | "purpose" | "promise" | "cta" | "doList" | "dontList" | "voice">;

function Chips({ items, onChange, disabled }: { items: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="cr-chips">
      {items.map((it, i) => (
        <span key={`${it}-${i}`} className="cr-chip">
          {it}
          {!disabled && (
            <button type="button" aria-label={`Remove ${it}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>
              ×
            </button>
          )}
        </span>
      ))}
      {!disabled && (
        <input
          className="cr-chip__input"
          placeholder="Add… ↵"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && draft.trim()) {
              e.preventDefault();
              onChange([...items, draft.trim()]);
              setDraft("");
            }
          }}
        />
      )}
    </div>
  );
}

function Slider({ label, low, high, value, onChange, disabled }: { label: string; low: string; high: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  return (
    <label className="cr-slider">
      <span className="ads-label" style={{ margin: 0 }}>{label}</span>
      <div className="cr-slider__row">
        <small>{low}</small>
        <input type="range" min={0} max={100} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} />
        <small>{high}</small>
        <b>{value}</b>
      </div>
    </label>
  );
}

export default function EssenceClient({ essence, pillars: initialPillars, tone, db }: Props) {
  const [d, setD] = useState<Draft>({
    line: essence.line, purpose: essence.purpose, promise: essence.promise, cta: essence.cta,
    doList: essence.doList, dontList: essence.dontList, voice: essence.voice,
  });
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [notice, setNotice] = useState<NoticeState>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced autosave — the PUT runs from a timer callback, never in the effect body.
  useEffect(() => {
    if (!dirty.current || !db) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSaved("saving");
      api("/api/creator/essence", { method: "PUT", json: d })
        .then(() => setSaved("saved"))
        .catch((e: unknown) => setNotice({ kind: "err", text: errText(e) }));
    }, 800);
    return () => {
      if (timer.current) clearTimeout(timer.current);
    };
  }, [d, db]);

  const patch = useCallback((p: Partial<Draft>) => {
    dirty.current = true;
    setD((prev) => ({ ...prev, ...p }));
  }, []);

  /* ── pillars ── */
  const [pillars, setPillars] = useState<Pillar[]>(initialPillars);
  const [editing, setEditing] = useState<Pillar | null>(null);
  const [busy, setBusy] = useState(false);

  async function savePillar(p: Pillar, isNew: boolean) {
    setBusy(true);
    try {
      if (isNew) {
        const r = await api<{ pillar: Pillar }>("/api/creator/pillars", { method: "POST", json: p });
        setPillars((l) => [...l, r.pillar]);
      } else {
        const r = await api<{ pillar: Pillar }>(`/api/creator/pillars/${p.id}`, { method: "PATCH", json: p });
        setPillars((l) => l.map((x) => (x.id === p.id ? r.pillar : x)));
      }
      setEditing(null);
      setNotice({ kind: "ok", text: `Pillar “${p.name}” saved.` });
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(false);
    }
  }
  async function deletePillar(p: Pillar) {
    if (!window.confirm(`Delete the pillar “${p.name}”? Posts and images tagged with it keep their rows; the tag is cleared.`)) return;
    setBusy(true);
    try {
      await api(`/api/creator/pillars/${p.id}`, { method: "DELETE" });
      setPillars((l) => l.filter((x) => x.id !== p.id));
      setEditing(null);
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setBusy(false);
    }
  }

  /* ── tone brief ── */
  const [t, setT] = useState<BlogTone>(tone);
  const [toneBusy, setToneBusy] = useState(false);
  async function saveTone() {
    setToneBusy(true);
    try {
      await api("/api/creator/blog/tone", { method: "PUT", json: { tone: t } });
      setNotice({ kind: "ok", text: "Tone brief saved." });
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setToneBusy(false);
    }
  }

  const ro = !db;
  const pillarIndex = (id: string) => pillars.findIndex((p) => p.id === id);

  return (
    <div className="cr-essence">
      {ro && <div className="ads-notice ads-notice--warn">No database connected — showing the seed defaults read-only.</div>}
      <Notice notice={notice} onClose={() => setNotice(null)} />

      <div className="cr-savestate">{saved === "saving" ? "Saving…" : saved === "saved" ? "Saved" : essence.fromDb ? "From the database" : "Seed defaults"}</div>

      {/* The line */}
      <section className="ads-step cr-block">
        <header className="ads-step__title"><span>①</span> The line</header>
        <input className="ads-input cr-line" value={d.line} disabled={ro} onChange={(e) => patch({ line: e.target.value })} />
        <div className="ads-row--2" style={{ marginTop: 12 }}>
          <div>
            <label className="ads-label">Purpose</label>
            <textarea className="ads-input" rows={4} value={d.purpose} disabled={ro} onChange={(e) => patch({ purpose: e.target.value })} />
          </div>
          <div>
            <label className="ads-label">Promise</label>
            <textarea className="ads-input" rows={4} value={d.promise} disabled={ro} onChange={(e) => patch({ promise: e.target.value })} />
          </div>
        </div>
        <label className="ads-label">Call to action (when one is wanted)</label>
        <input className="ads-input" value={d.cta} disabled={ro} onChange={(e) => patch({ cta: e.target.value })} />
      </section>

      <div className="ads-row--2 cr-gap">
        <section className="ads-step cr-block">
          <header className="ads-step__title"><span>②</span> Do</header>
          <Chips items={d.doList} disabled={ro} onChange={(v) => patch({ doList: v })} />
        </section>
        <section className="ads-step cr-block">
          <header className="ads-step__title"><span>③</span> Don&rsquo;t</header>
          <Chips items={d.dontList} disabled={ro} onChange={(v) => patch({ dontList: v })} />
        </section>
      </div>

      <section className="ads-step cr-block">
        <header className="ads-step__title"><span>④</span> Voice</header>
        <div className="cr-sliders">
          <Slider label="Playful ↔ Serious" low="Serious" high="Playful" value={d.voice.playful} disabled={ro} onChange={(v) => patch({ voice: { ...d.voice, playful: v } })} />
          <Slider label="Formal ↔ Casual" low="Casual" high="Formal" value={d.voice.formal} disabled={ro} onChange={(v) => patch({ voice: { ...d.voice, formal: v } })} />
          <Slider label="Bold ↔ Gentle" low="Gentle" high="Bold" value={d.voice.bold} disabled={ro} onChange={(v) => patch({ voice: { ...d.voice, bold: v } })} />
        </div>
      </section>

      {/* Tone brief */}
      <section className="ads-step cr-block">
        <header className="ads-step__title"><span>⑤</span> Tone brief (the Musings)</header>
        {(["voice", "audience", "style", "dos", "donts"] as const).map((k) => (
          <div key={k}>
            <label className="ads-label">{k === "dos" ? "Do" : k === "donts" ? "Don't" : k}</label>
            <textarea className="ads-input" rows={2} value={t[k]} disabled={ro} onChange={(e) => setT({ ...t, [k]: e.target.value })} />
          </div>
        ))}
        <div className="ads-row" style={{ marginTop: 12 }}>
          <button className="btn btn--gold ads-btn-sm" disabled={ro || toneBusy} onClick={() => void saveTone()}>{toneBusy ? "Saving…" : "Save tone"}</button>
        </div>
      </section>

      {/* Pillars */}
      <section className="ads-step cr-block">
        <header className="ads-step__title"><span>⑥</span> Pillars</header>
        <div className="cr-pillars">
          {pillars.map((p, i) => (
            <article key={p.id} className={`cr-pillar${p.active ? "" : " is-inactive"}`}>
              <div className="ads-row ads-row--between">
                <span className={pillarTagCls(i)}>{p.name}</span>
                <small className="cr-muted">{p.target != null ? `${p.target}% of the mix` : "no target"}{p.active ? "" : " · inactive"}</small>
              </div>
              <p className="cr-pillar__msg">{p.message}</p>
              {p.angles.length > 0 && (
                <ul className="cr-pillar__angles">
                  {p.angles.slice(0, 4).map((a) => <li key={a}>{a}</li>)}
                  {p.angles.length > 4 && <li className="cr-muted">+{p.angles.length - 4} more</li>}
                </ul>
              )}
              <div className="cr-muted cr-small">{p.hashtags.join(" ")}</div>
              {!ro && (
                <div className="ads-row" style={{ marginTop: 10 }}>
                  <button className="btn btn--ghost ads-btn-xs" onClick={() => setEditing({ ...p })}>Edit</button>
                </div>
              )}
            </article>
          ))}
        </div>
        {!ro && (
          <div className="ads-row" style={{ marginTop: 12 }}>
            <button className="btn btn--ghost ads-btn-sm" onClick={() => setEditing({ id: "", name: "", message: "", angles: [], hashtags: [], target: null, sortOrder: pillars.length, active: true })}>
              + Add a pillar
            </button>
          </div>
        )}
      </section>

      {/* Core messages */}
      <section className="ads-step cr-block">
        <header className="ads-step__title"><span>⑦</span> Core messages ({essence.messages.length})</header>
        <div className="cr-messages">
          {essence.messages.map((m) => (
            <details key={m.id} className="cr-message">
              <summary>
                <span className={pillarTagCls(pillarIndex(m.pillar))}>{pillars.find((p) => p.id === m.pillar)?.name ?? m.pillar}</span>
                <b>{m.text}</b>
                <small className="cr-muted">{m.id}</small>
              </summary>
              <div className="cr-message__body">
                <div className="ads-label">Headlines</div>
                <div className="cr-chips">{m.headlines.map((h) => <span key={h} className="cr-chip">{h}</span>)}</div>
                <div className="ads-label">Sample captions</div>
                <ul>{m.captions.map((c) => <li key={c}>{c}</li>)}</ul>
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Audiences */}
      <section className="ads-step cr-block">
        <header className="ads-step__title"><span>⑧</span> Audiences ({essence.audiences.length}) <small className="cr-muted">read-only · from Meta</small></header>
        <div className="cr-audiences">
          {essence.audiences.map((a) => (
            <details key={a.id} className="cr-audience">
              <summary>
                <b>{a.name}</b>
                <small className="cr-muted">{a.subtype} · {a.sizeNote} · {a.status}</small>
              </summary>
              <div className="cr-message__body">
                <div className="cr-kv"><span>Source</span><span>{a.source}</span></div>
                <div className="cr-kv"><span>Created</span><span>{a.created}</span></div>
                {a.metaDef && <div className="cr-kv"><span>Meta</span><span>{a.metaDef}</span></div>}
                {a.vb && Object.entries(a.vb).map(([k, v]) => <div key={k} className="cr-kv"><span>{k}</span><span>{v}</span></div>)}
              </div>
            </details>
          ))}
        </div>
      </section>

      {/* Pillar editor modal */}
      {editing && (
        <div className="ads-modal" role="dialog" aria-modal="true">
          <div className="ads-modal__card cr-modal">
            <h3>{editing.id ? `Edit “${editing.name}”` : "New pillar"}</h3>
            <label className="ads-label">Name</label>
            <input className="ads-input" value={editing.name} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
            <label className="ads-label">The message it carries</label>
            <textarea className="ads-input" rows={2} value={editing.message} onChange={(e) => setEditing({ ...editing, message: e.target.value })} />
            <label className="ads-label">Angles (one per line)</label>
            <textarea className="ads-input" rows={5} value={editing.angles.join("\n")} onChange={(e) => setEditing({ ...editing, angles: e.target.value.split("\n") })} />
            <label className="ads-label">Hashtags (space or line separated)</label>
            <input className="ads-input" value={editing.hashtags.join(" ")} onChange={(e) => setEditing({ ...editing, hashtags: e.target.value.split(/\s+/) })} />
            <div className="ads-row--2">
              <div>
                <label className="ads-label">Target % of the mix</label>
                <input className="ads-input" type="number" min={0} max={100} value={editing.target ?? ""} onChange={(e) => setEditing({ ...editing, target: e.target.value === "" ? null : Number(e.target.value) })} />
              </div>
              <div>
                <label className="ads-label">Active</label>
                <label className="ads-check"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /><span>Offer in pickers and prompts</span></label>
              </div>
            </div>
            <div className="ads-row" style={{ marginTop: 16 }}>
              <button className="btn btn--gold" disabled={busy || !editing.name.trim()} onClick={() => void savePillar({ ...editing, angles: editing.angles.map((a) => a.trim()).filter(Boolean), hashtags: editing.hashtags.filter(Boolean) }, !editing.id)}>
                {busy ? "Saving…" : "Save"}
              </button>
              <button className="btn btn--ghost" disabled={busy} onClick={() => setEditing(null)}>Cancel</button>
              {editing.id && <button className="btn btn--ghost ads-btn-sm" style={{ marginLeft: "auto", color: "#e07070" }} disabled={busy} onClick={() => void deletePillar(editing)}>Delete</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
