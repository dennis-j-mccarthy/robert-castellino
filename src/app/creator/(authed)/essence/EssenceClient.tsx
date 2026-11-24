"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import Notice, { type NoticeState } from "@/components/creator/Notice";
import { api, errText } from "@/lib/creator/client";
import type { BlogTone } from "@/lib/creator/blog-tone";
import { pillarTagCls, type BrandEssenceRecord, type CoreMessage, type Pillar } from "@/lib/creator/pillars";

/*
  Tool 1 · Essence. Hub and spokes, with guidance and AI assist.

  The hub (the line, promise, purpose, call to action) sits on top. Five
  spokes open one at a time as accordions: Always / Never, Voice, Who it's
  for, Pillars & messages (each pillar an accordion with its core messages
  nested inside), and the Tone brief, which is written from everything
  above. Every field has a one-line hint and a "Suggest" button; nothing the
  model suggests is saved until Bob clicks it.
*/

interface Props {
  essence: BrandEssenceRecord;
  pillars: Pillar[];
  tone: BlogTone;
  db: boolean;
  ai: boolean;
}

type Draft = Pick<BrandEssenceRecord, "line" | "purpose" | "promise" | "cta" | "doList" | "dontList" | "voice">;
type SpokeId = "lists" | "voice" | "who" | "pillars" | "tone";

const SPOKES: Array<{ id: SpokeId; n: string; title: string; hint: string }> = [
  { id: "lists", n: "a", title: "Always say · Never say", hint: "Short phrases that keep every caption on the rails." },
  { id: "voice", n: "b", title: "Voice", hint: "Three dials. Move one and hear a sentence change." },
  { id: "who", n: "c", title: "Who it's for", hint: "The reader every piece is written to." },
  { id: "pillars", n: "d", title: "Pillars and their messages", hint: "The five themes, and the sentences that live under each." },
  { id: "tone", n: "e", title: "Tone brief", hint: "Written from the cards above. Regenerate it when they change." },
];

/* ───────── small pieces ───────── */

function Hint({ children }: { children: ReactNode }) {
  return <p className="es-hint">{children}</p>;
}

function Suggest({ label = "Suggest", busy, disabled, onClick }: { label?: string; busy?: boolean; disabled?: boolean; onClick: () => void }) {
  return (
    <button type="button" className="es-suggest" disabled={disabled || busy} onClick={onClick}>
      <span aria-hidden="true">✦</span> {busy ? "Thinking…" : label}
    </button>
  );
}

function Options({ options, onPick, onClose }: { options: string[]; onPick: (s: string) => void; onClose: () => void }) {
  if (!options.length) return null;
  return (
    <div className="es-options" role="group" aria-label="Suggestions">
      {options.map((o) => (
        <button key={o} type="button" className="es-option" onClick={() => onPick(o)}>{o}</button>
      ))}
      <button type="button" className="es-option es-option--quiet" onClick={onClose}>Keep mine</button>
    </div>
  );
}

function Chips({ items, onChange, disabled }: { items: string[]; onChange: (v: string[]) => void; disabled?: boolean }) {
  const [draft, setDraft] = useState("");
  return (
    <div className="cr-chips">
      {items.map((it, i) => (
        <span key={`${it}-${i}`} className="cr-chip">
          {it}
          {!disabled && <button type="button" aria-label={`Remove ${it}`} onClick={() => onChange(items.filter((_, j) => j !== i))}>×</button>}
        </span>
      ))}
      {!disabled && (
        <input className="cr-chip__input" placeholder="Add… ↵" value={draft} onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => { if (e.key === "Enter" && draft.trim()) { e.preventDefault(); onChange([...items, draft.trim()]); setDraft(""); } }} />
      )}
    </div>
  );
}

function Dial({ label, low, high, value, onChange, disabled }: { label: string; low: string; high: string; value: number; onChange: (v: number) => void; disabled?: boolean }) {
  const lean = Math.abs(value - 50) < 8 ? `balanced` : `${Math.abs(value - 50) >= 35 ? "strongly" : Math.abs(value - 50) >= 18 ? "clearly" : "slightly"} ${value > 50 ? high.toLowerCase() : low.toLowerCase()}`;
  return (
    <label className="es-dial">
      <span className="es-dial__l"><b>{label}</b><small>{lean}</small></span>
      <span className="es-dial__r"><small>{low}</small><input type="range" min={0} max={100} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} /><small>{high}</small></span>
    </label>
  );
}

/* ───────── the page ───────── */

export default function EssenceClient({ essence, pillars: initialPillars, tone, db, ai }: Props) {
  const [d, setD] = useState<Draft>({ line: essence.line, purpose: essence.purpose, promise: essence.promise, cta: essence.cta, doList: essence.doList, dontList: essence.dontList, voice: essence.voice });
  const [messages, setMessages] = useState<CoreMessage[]>(essence.messages);
  const [saved, setSaved] = useState<"idle" | "saving" | "saved">("idle");
  const [notice, setNotice] = useState<NoticeState>(null);
  const dirty = useRef(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ro = !db;

  // Debounced autosave of the hub + lists + dials.
  useEffect(() => {
    if (!dirty.current || !db) return;
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      setSaved("saving");
      api("/api/creator/essence", { method: "PUT", json: d }).then(() => setSaved("saved")).catch((e: unknown) => setNotice({ kind: "err", text: errText(e) }));
    }, 800);
    return () => { if (timer.current) clearTimeout(timer.current); };
  }, [d, db]);
  const patch = useCallback((p: Partial<Draft>) => { dirty.current = true; setD((prev) => ({ ...prev, ...p })); }, []);

  /* AI assist: one in flight at a time, options keyed by field */
  const [thinking, setThinking] = useState<string | null>(null);
  const [opts, setOpts] = useState<Record<string, string[]>>({});
  async function suggest(kind: string, extra: Record<string, unknown> = {}, key = kind) {
    setThinking(key);
    try {
      const r = await api<{ options: string[] }>("/api/creator/essence/suggest", { method: "POST", json: { kind, ...extra } });
      setOpts((o) => ({ ...o, [key]: r.options }));
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setThinking(null);
    }
  }
  const clear = (key: string) => setOpts((o) => ({ ...o, [key]: [] }));

  /* spokes: one open at a time */
  const [open, setOpen] = useState<SpokeId | null>("pillars");

  /* pillars */
  const [pillars, setPillars] = useState<Pillar[]>(initialPillars);
  const [openPillar, setOpenPillar] = useState<string | null>(initialPillars[0]?.id ?? null);
  const [editing, setEditing] = useState<Pillar | null>(null);
  const [busy, setBusy] = useState(false);
  const pillarIndex = (id: string) => pillars.findIndex((p) => p.id === id);

  async function savePillar(p: Pillar, isNew: boolean) {
    setBusy(true);
    try {
      if (isNew) {
        const r = await api<{ pillar: Pillar }>("/api/creator/pillars", { method: "POST", json: p });
        setPillars((l) => [...l, r.pillar]);
        setOpenPillar(r.pillar.id);
      } else {
        const r = await api<{ pillar: Pillar }>(`/api/creator/pillars/${p.id}`, { method: "PATCH", json: p });
        setPillars((l) => l.map((x) => (x.id === p.id ? r.pillar : x)));
      }
      setEditing(null);
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

  /* core messages: suggested per pillar, added on click */
  const [msgOpts, setMsgOpts] = useState<Record<string, Array<{ text: string; headlines: string[]; captions: string[] }>>>({});
  async function suggestMessages(pillarId: string) {
    setThinking(`msg-${pillarId}`);
    try {
      const r = await api<{ messages: Array<{ text: string; headlines: string[]; captions: string[] }> }>("/api/creator/essence/suggest", { method: "POST", json: { kind: "messages", pillarId } });
      setMsgOpts((o) => ({ ...o, [pillarId]: r.messages }));
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setThinking(null);
    }
  }
  async function addMessage(pillarId: string, m: { text: string; headlines: string[]; captions: string[] }) {
    const n = messages.length + 1;
    const slug = m.text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 24);
    const id = `${pillarId}-${String(n).padStart(2, "0")}-${slug}`;
    const next = [...messages, { id, pillar: pillarId, text: m.text, headlines: m.headlines, captions: m.captions }];
    setMessages(next);
    setMsgOpts((o) => ({ ...o, [pillarId]: (o[pillarId] ?? []).filter((x) => x.text !== m.text) }));
    try {
      await api("/api/creator/essence", { method: "PUT", json: { messages: next } });
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    }
  }
  async function removeMessage(id: string) {
    const next = messages.filter((m) => m.id !== id);
    setMessages(next);
    try { await api("/api/creator/essence", { method: "PUT", json: { messages: next } }); } catch (e) { setNotice({ kind: "err", text: errText(e) }); }
  }

  /* tone brief */
  const [t, setT] = useState<BlogTone>(tone);
  const [toneBusy, setToneBusy] = useState(false);
  const [toneEdit, setToneEdit] = useState(false);
  async function saveTone(next: BlogTone) {
    setToneBusy(true);
    try {
      await api("/api/creator/blog/tone", { method: "PUT", json: { tone: next } });
      setT(next);
      setNotice({ kind: "ok", text: "Tone brief saved." });
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setToneBusy(false);
    }
  }
  async function rewriteTone() {
    setThinking("tone");
    try {
      const r = await api<{ tone: BlogTone }>("/api/creator/essence/suggest", { method: "POST", json: { kind: "tone" } });
      await saveTone({ ...t, ...r.tone });
    } catch (e) {
      setNotice({ kind: "err", text: errText(e) });
    } finally {
      setThinking(null);
    }
  }

  const field = (key: keyof Pick<Draft, "line" | "purpose" | "promise" | "cta">, label: string, hint: string, rows?: number) => (
    <div className={`es-field${key === "line" ? " es-field--line" : ""}`}>
      <div className={`es-field__head${key === "line" ? " es-field__head--bare" : ""}`}>{key !== "line" && <label className="es-label">{label}</label>}{ai && <Suggest busy={thinking === key} disabled={ro} onClick={() => void suggest(key, { current: d[key] })} />}</div>
      {rows ? (
        <textarea className="ads-input" rows={rows} value={d[key]} disabled={ro} onChange={(e) => patch({ [key]: e.target.value } as Partial<Draft>)} />
      ) : (
        <input className={`ads-input${key === "line" ? " cr-line" : ""}`} value={d[key]} disabled={ro} onChange={(e) => patch({ [key]: e.target.value } as Partial<Draft>)} />
      )}
      <Hint>{hint}</Hint>
      <Options options={opts[key] ?? []} onPick={(s) => { patch({ [key]: s } as Partial<Draft>); clear(key); }} onClose={() => clear(key)} />
    </div>
  );

  return (
    <div className="cr-essence es">
      {ro && <div className="ads-notice ads-notice--warn">No database connected — showing the seed defaults read-only.</div>}
      <Notice notice={notice} onClose={() => setNotice(null)} />

      <div className="es-guide">
        <div><b>1</b><span>Fill the hub. The line is the sentence a stranger could repeat; the promise is what every buyer can count on.</span></div>
        <div><b>2</b><span>Open each spoke, fix what&rsquo;s wrong, press <i>✦ Suggest</i> when you want options. Nothing is saved until you click one.</span></div>
        <div><b>3</b><span>Read the tone brief at the end. It is written from everything above; regenerate it when the cards change.</span></div>
        <div className="es-guide__state">{saved === "saving" ? "Saving…" : saved === "saved" ? "Saved" : essence.fromDb ? "Saved" : "Seed defaults"}</div>
      </div>

      {/* ── the hub ── */}
      <section className="tl-card es-hub">
        <div className="es-hub__kick">The hub</div>
        {field("line", "The line", "Under ten words. True, specific, no adjectives doing the work.")}
        <div className="es-hub__grid">
          {field("promise", "Promise", "What every buyer can count on. Concrete: a real place, signed by hand.", 3)}
          {field("purpose", "Purpose", "Why the work exists, in his voice. Not a mission statement.", 3)}
        </div>
        {field("cta", "Call to action, when one is wanted", "One quiet sentence. No urgency words.")}
      </section>

      {/* ── the spokes ── */}
      <div className="es-spokes">
        {SPOKES.map((s) => {
          const isOpen = open === s.id;
          return (
            <section key={s.id} className={`tl-card es-spoke${isOpen ? " is-open" : ""}`}>
              <button type="button" className="es-spoke__head" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : s.id)}>
                <span className="es-spoke__n">{s.n}</span>
                <span className="es-spoke__t"><b>{s.title}</b><small>{s.hint}</small></span>
                <span className="es-spoke__chev" aria-hidden="true">{isOpen ? "–" : "+"}</span>
              </button>
              {isOpen && (
                <div className="es-spoke__body">
                  {s.id === "lists" && (
                    <div className="es-two">
                      <div>
                        <div className="es-field__head"><label className="es-label">Always say</label>{ai && <Suggest label="Suggest more" busy={thinking === "dos"} disabled={ro} onClick={() => void suggest("dos", { have: d.doList })} />}</div>
                        <Chips items={d.doList} disabled={ro} onChange={(v) => patch({ doList: v })} />
                        <Hint>Things he does in every piece. Short. These go into every prompt.</Hint>
                        <Options options={(opts.dos ?? []).filter((o) => !d.doList.includes(o))} onPick={(s2) => patch({ doList: [...d.doList, s2] })} onClose={() => clear("dos")} />
                      </div>
                      <div>
                        <div className="es-field__head"><label className="es-label">Never say</label>{ai && <Suggest label="Suggest more" busy={thinking === "donts"} disabled={ro} onClick={() => void suggest("donts", { have: d.dontList })} />}</div>
                        <Chips items={d.dontList} disabled={ro} onChange={(v) => patch({ dontList: v })} />
                        <Hint>Words and moves that are not him. The model is told to avoid these.</Hint>
                        <Options options={(opts.donts ?? []).filter((o) => !d.dontList.includes(o))} onPick={(s2) => patch({ dontList: [...d.dontList, s2] })} onClose={() => clear("donts")} />
                      </div>
                    </div>
                  )}

                  {s.id === "voice" && (
                    <div className="es-voice">
                      <div className="es-dials">
                        <Dial label="Serious ⟷ Playful" low="Serious" high="Playful" value={d.voice.playful} disabled={ro} onChange={(v) => patch({ voice: { ...d.voice, playful: v } })} />
                        <Dial label="Casual ⟷ Formal" low="Casual" high="Formal" value={d.voice.formal} disabled={ro} onChange={(v) => patch({ voice: { ...d.voice, formal: v } })} />
                        <Dial label="Gentle ⟷ Bold" low="Gentle" high="Bold" value={d.voice.bold} disabled={ro} onChange={(v) => patch({ voice: { ...d.voice, bold: v } })} />
                      </div>
                      <div className="es-sample">
                        <div className="es-field__head"><label className="es-label">Sounds like</label>{ai && <Suggest label="Hear it" busy={thinking === "voice-sample"} onClick={() => void suggest("voice-sample", { voice: d.voice })} />}</div>
                        <p className="es-sample__p">{opts["voice-sample"]?.[0] ?? "Press Hear it and a sentence at these settings appears here. Move a dial, press again."}</p>
                        <Hint>The dials nudge every generator. They don&rsquo;t need to be exact; they need to be him.</Hint>
                      </div>
                    </div>
                  )}

                  {s.id === "who" && (
                    <div>
                      <label className="es-label">The reader</label>
                      <textarea className="ads-input" rows={3} value={t.audience} disabled={ro} onChange={(e) => setT({ ...t, audience: e.target.value })} onBlur={() => t.audience !== tone.audience && void saveTone(t)} />
                      <Hint>Who every Musing, caption and newsletter is written to. One or two sentences.</Hint>
                      {essence.audiences.length > 0 && (
                        <details className="es-audiences">
                          <summary>The {essence.audiences.length} Meta ad audiences <small>· read-only, from Ads</small></summary>
                          <ul>{essence.audiences.map((a) => <li key={a.id}><b>{a.name}</b> <small>{a.subtype} · {a.sizeNote} · {a.status}</small></li>)}</ul>
                        </details>
                      )}
                    </div>
                  )}

                  {s.id === "pillars" && (
                    <div className="es-pillars">
                      <Hint>Each pillar is a theme the studio keeps returning to. Under it live its core messages: the sentences a post or a newsletter can land. Open one.</Hint>
                      {pillars.map((p, i) => {
                        const mine = messages.filter((m) => m.pillar === p.id);
                        const pOpen = openPillar === p.id;
                        return (
                          <div key={p.id} className={`es-pillar${pOpen ? " is-open" : ""}${p.active ? "" : " is-inactive"}`}>
                            <button type="button" className="es-pillar__head" aria-expanded={pOpen} onClick={() => setOpenPillar(pOpen ? null : p.id)}>
                              <span className={pillarTagCls(i)}>{p.name}</span>
                              <span className="es-pillar__msg">{p.message}</span>
                              <span className="es-pillar__meta">{p.target != null ? `${p.target}%` : ""} · {mine.length} message{mine.length === 1 ? "" : "s"}</span>
                              <span className="es-spoke__chev" aria-hidden="true">{pOpen ? "–" : "+"}</span>
                            </button>
                            {pOpen && (
                              <div className="es-pillar__body">
                                <div className="es-pillar__cols">
                                  <div>
                                    <label className="es-label">Angles</label>
                                    <div className="cr-chips">{p.angles.map((a) => <span key={a} className="cr-chip">{a}</span>)}{!p.angles.length && <span className="es-muted">none yet</span>}</div>
                                    <Hint>Starting points for a title or a caption.</Hint>
                                  </div>
                                  <div>
                                    <label className="es-label">Hashtags</label>
                                    <div className="es-muted">{p.hashtags.join(" ") || "none"}</div>
                                    {!ro && <div style={{ marginTop: 10 }}><button type="button" className="btn ads-btn-xs" onClick={() => setEditing({ ...p })}>Edit pillar</button></div>}
                                  </div>
                                </div>
                                <div className="es-field__head" style={{ marginTop: 14 }}>
                                  <label className="es-label">Core messages under {p.name}</label>
                                  {ai && !ro && <Suggest label="Suggest 3" busy={thinking === `msg-${p.id}`} onClick={() => void suggestMessages(p.id)} />}
                                </div>
                                {mine.length === 0 && <p className="es-muted">None yet. Suggest three, or add one by hand in Edit pillar.</p>}
                                <div className="es-msgs">
                                  {mine.map((m) => (
                                    <details key={m.id} className="es-msg">
                                      <summary><b>{m.text}</b>{!ro && <button type="button" className="es-msg__x" aria-label="Remove" onClick={(e) => { e.preventDefault(); void removeMessage(m.id); }}>×</button>}</summary>
                                      <div className="es-msg__body">
                                        <small>Headlines</small><div className="cr-chips">{m.headlines.map((h) => <span key={h} className="cr-chip">{h}</span>)}</div>
                                        <small>Sample captions</small><ul>{m.captions.map((c) => <li key={c}>{c}</li>)}</ul>
                                      </div>
                                    </details>
                                  ))}
                                  {(msgOpts[p.id] ?? []).map((m) => (
                                    <div key={m.text} className="es-msg es-msg--new">
                                      <b>{m.text}</b>
                                      <small>{m.headlines.join(" · ")}</small>
                                      <div className="ads-row" style={{ marginTop: 6 }}><button type="button" className="btn btn--gold ads-btn-xs" onClick={() => void addMessage(p.id, m)}>Add it</button></div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                      {!ro && <div style={{ marginTop: 10 }}><button type="button" className="btn btn--ghost ads-btn-sm" onClick={() => setEditing({ id: "", name: "", message: "", angles: [], hashtags: [], target: null, sortOrder: pillars.length, active: true })}>+ Add a pillar</button></div>}
                    </div>
                  )}

                  {s.id === "tone" && (
                    <div className="es-tone">
                      <div className="es-field__head">
                        <label className="es-label">What the writers are told</label>
                        <div className="ads-row">
                          {ai && !ro && <Suggest label="Rewrite from the cards above" busy={thinking === "tone"} onClick={() => void rewriteTone()} />}
                          {!ro && <button type="button" className="btn ads-btn-xs" onClick={() => setToneEdit((v) => !v)}>{toneEdit ? "Done" : "Edit by hand"}</button>}
                        </div>
                      </div>
                      {toneEdit ? (
                        <>
                          {(["voice", "audience", "style", "dos", "donts"] as const).map((k) => (
                            <div key={k}><label className="ads-label">{k === "dos" ? "Do" : k === "donts" ? "Don't" : k}</label><textarea className="ads-input" rows={2} value={t[k]} onChange={(e) => setT({ ...t, [k]: e.target.value })} /></div>
                          ))}
                          <div className="ads-row" style={{ marginTop: 10 }}><button type="button" className="btn btn--gold ads-btn-sm" disabled={toneBusy} onClick={() => void saveTone(t)}>{toneBusy ? "Saving…" : "Save tone"}</button></div>
                        </>
                      ) : (
                        <dl className="es-tone__dl">
                          <div><dt>Voice</dt><dd>{t.voice}</dd></div>
                          <div><dt>Audience</dt><dd>{t.audience}</dd></div>
                          <div><dt>Style</dt><dd>{t.style}</dd></div>
                          <div><dt>Do</dt><dd>{t.dos}</dd></div>
                          <div><dt>Don&rsquo;t</dt><dd>{t.donts}</dd></div>
                        </dl>
                      )}
                      <Hint>This is the brief every generator reads. It should say nothing the hub and spokes don&rsquo;t.</Hint>
                    </div>
                  )}
                </div>
              )}
            </section>
          );
        })}
      </div>

      <div className="es-readby"><span className="es-label">Read by</span><span className="cr-chip">3 Blog</span><span className="cr-chip">4 Posts</span><span className="cr-chip">5 Email</span><span className="cr-chip">6 Ads</span></div>

      {/* Pillar editor */}
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
              <div><label className="ads-label">Target % of the mix</label><input className="ads-input" type="number" min={0} max={100} value={editing.target ?? ""} onChange={(e) => setEditing({ ...editing, target: e.target.value === "" ? null : Number(e.target.value) })} /></div>
              <div><label className="ads-label">Active</label><label className="ads-check"><input type="checkbox" checked={editing.active} onChange={(e) => setEditing({ ...editing, active: e.target.checked })} /><span>Offer in pickers and prompts</span></label></div>
            </div>
            <div className="ads-row" style={{ marginTop: 16 }}>
              <button className="btn btn--gold" disabled={busy || !editing.name.trim()} onClick={() => void savePillar({ ...editing, angles: editing.angles.map((a) => a.trim()).filter(Boolean), hashtags: editing.hashtags.filter(Boolean) }, !editing.id)}>{busy ? "Saving…" : "Save"}</button>
              <button className="btn btn--ghost" disabled={busy} onClick={() => setEditing(null)}>Cancel</button>
              {editing.id && <button className="btn btn--ghost ads-btn-sm" style={{ marginLeft: "auto", color: "#e07070" }} disabled={busy} onClick={() => void deletePillar(editing)}>Delete</button>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
