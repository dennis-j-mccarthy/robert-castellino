"use client";

import { useMemo, useState } from "react";
import { api, errText } from "@/lib/creator/client";
import { KEYWORD_KINDS, KIND_LABEL, type KeywordKind, type KeywordRow } from "@/lib/creator/keywords";

type Suggestion = { phrase: string; kind: KeywordKind; priority: number; why: string };

// Stable scatter (hash of the phrase) so the cloud reads as a cloud, not a list.
const hash = (t: string) => [...t].reduce((h, c) => (h * 31 + c.charCodeAt(0)) >>> 0, 7);

export default function KeywordsClient({ initial }: { initial: KeywordRow[] }) {
  const [rows, setRows] = useState<KeywordRow[]>(initial);
  const [filter, setFilter] = useState<KeywordKind | "all">("all");
  const [showDropped, setShowDropped] = useState(false);
  const [phrase, setPhrase] = useState("");
  const [kind, setKind] = useState<KeywordKind>("gift");
  const [focus, setFocus] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const visible = rows.filter((r) => (filter === "all" || r.kind === filter) && (showDropped || r.status !== "dropped"));

  const cloud = useMemo(() => {
    const live = visible.filter((r) => r.status !== "dropped");
    const ws = live.map((r) => r.priority);
    const max = Math.max(1, ...ws);
    const min = ws.length ? Math.min(...ws) : 0;
    return [...live]
      .sort((a, b) => hash(a.phrase) - hash(b.phrase))
      .map((r) => ({ r, size: 12 + Math.round(Math.pow((r.priority - min) / Math.max(1, max - min), 1.8) * 26) }));
  }, [visible]);

  async function add(p: string, k: KeywordKind, priority = 50, source = "manual") {
    setMsg("");
    try {
      const d = await api<{ keyword: KeywordRow }>("/api/creator/keywords", { method: "POST", json: { phrase: p, kind: k, priority, source } });
      setRows((rs) => [d.keyword, ...rs]);
      setSuggestions((ss) => ss.filter((s) => s.phrase !== p));
      return true;
    } catch (e) {
      setMsg(errText(e));
      return false;
    }
  }

  async function patch(id: string, p: Partial<KeywordRow>) {
    setRows((rs) => rs.map((r) => (r.id === id ? { ...r, ...p } : r)));
    try {
      await api(`/api/creator/keywords/${encodeURIComponent(id)}`, { method: "PATCH", json: p });
    } catch (e) {
      setMsg(errText(e));
    }
  }

  async function suggest() {
    setBusy(true);
    setMsg("");
    try {
      const d = await api<{ suggestions: Suggestion[] }>("/api/creator/keywords/suggest", { method: "POST", json: { focus } });
      setSuggestions(d.suggestions);
      if (!d.suggestions.length) setMsg("No new suggestions this time. Try a different focus.");
    } catch (e) {
      setMsg(errText(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="kw">
      <div className="kw-filters">
        {(["all", ...KEYWORD_KINDS] as const).map((f) => (
          <button key={f} type="button" className={`btn btn--ghost ads-btn-sm${filter === f ? " is-on" : ""}`} aria-pressed={filter === f} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : KIND_LABEL[f]}
          </button>
        ))}
        <label className="kw-dropped ads-hint">
          <input type="checkbox" checked={showDropped} onChange={(e) => setShowDropped(e.target.checked)} /> Show dropped
        </label>
      </div>

      <div className="kw-card">
        <h2>Word cloud</h2>
        <p className="ads-hint">Bigger words matter more. Sized by our priority score (0 to 100), not search volume.</p>
        <div className="kw-cloud">
          {cloud.map(({ r, size }) => (
            <span key={r.id} className={`kw-word kw-word--${r.kind}`} style={{ fontSize: size }} title={`${KIND_LABEL[r.kind]} · priority ${r.priority}`}>
              {r.phrase}
            </span>
          ))}
          {!cloud.length && <span className="ads-hint">No keywords yet.</span>}
        </div>
      </div>

      <div className="kw-card">
        <h2>Find new keywords and phrases</h2>
        <p className="ads-hint">Claude suggests phrases people type, weighted toward gift searches. Nothing is saved until you click Add.</p>
        <div className="kw-row">
          <input className="ads-input" value={focus} onChange={(e) => setFocus(e.target.value)} placeholder="Optional focus, e.g. Christmas, aspens, Rocky Mountain National Park" />
          <button type="button" className="btn btn--gold" disabled={busy} onClick={() => void suggest()}>
            {busy ? "Thinking…" : "Suggest phrases"}
          </button>
        </div>
        {suggestions.length > 0 && (
          <ul className="kw-suggest">
            {suggestions.map((s) => (
              <li key={s.phrase}>
                <div>
                  <b>{s.phrase}</b>
                  <p className="ads-hint">
                    {KIND_LABEL[s.kind]} · priority {s.priority}
                    {s.why ? ` · ${s.why}` : ""}
                  </p>
                </div>
                <button type="button" className="btn btn--ghost ads-btn-xs" onClick={() => void add(s.phrase, s.kind, s.priority, "claude")}>
                  Add
                </button>
              </li>
            ))}
          </ul>
        )}
        <form
          className="kw-row kw-addform"
          onSubmit={(e) => {
            e.preventDefault();
            if (phrase.trim()) void add(phrase.trim(), kind).then((ok) => ok && setPhrase(""));
          }}
        >
          <input className="ads-input" value={phrase} onChange={(e) => setPhrase(e.target.value)} placeholder="Add your own keyword or phrase" />
          <select className="ads-input kw-select" value={kind} onChange={(e) => setKind(e.target.value as KeywordKind)} aria-label="Kind">
            {KEYWORD_KINDS.map((k) => (
              <option key={k} value={k}>{KIND_LABEL[k]}</option>
            ))}
          </select>
          <button type="submit" className="btn btn--ghost">Add keyword</button>
        </form>
        {msg && <p className="ads-hint ads-hint--err">{msg}</p>}
      </div>

      <h2 className="kw-h2">
        Keywords <span className="ads-hint">({visible.length})</span>
      </h2>
      <ul className="kw-tiles">
        {visible.map((r) => (
          <li key={r.id} className={`kw-tile kw-tile--${r.kind}${r.status === "dropped" ? " is-dropped" : ""}`}>
            <div>
              <b>{r.phrase}</b>
              <p className="ads-hint">
                {KIND_LABEL[r.kind]} · priority {r.priority}
              </p>
              {r.note && <p className="ads-hint">{r.note}</p>}
            </div>
            <div className="kw-actions">
              <button type="button" className={`btn btn--ghost ads-btn-xs${r.status === "target" ? " is-on" : ""}`} onClick={() => void patch(r.id, { status: r.status === "target" ? "idea" : "target" })}>
                {r.status === "target" ? "Targeting" : "Target this"}
              </button>
              <a className="btn btn--ghost ads-btn-xs" href={`https://www.google.com/search?q=${encodeURIComponent(r.phrase)}`} target="_blank" rel="noreferrer">
                See who ranks ↗
              </a>
              <button type="button" className="btn btn--bare ads-btn-xs" onClick={() => void patch(r.id, { status: r.status === "dropped" ? "idea" : "dropped" })}>
                {r.status === "dropped" ? "Restore" : "Drop"}
              </button>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
