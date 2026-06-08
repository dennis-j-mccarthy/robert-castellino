"use client";

import { useRouter } from "next/navigation";
import { useState, useRef } from "react";

type MusingRow = {
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
};

const CATS = ["reflections", "light", "land", "locations", "wilderness"] as const;
const SIZES = ["sm", "md", "lg"] as const;

type FormState = {
  cat: string;
  title: string;
  date: string;
  loc: string;
  img: string;
  size: string;
  excerpt: string;
  body: string;
  published: boolean;
  order: number;
};

function emptyForm(_items: MusingRow[]): FormState {
  return {
    cat: "reflections",
    title: "",
    date: "",
    loc: "",
    img: "",
    size: "",
    excerpt: "",
    body: "",
    published: true,
    order: 0,
  };
}

function musingToForm(m: MusingRow): FormState {
  return {
    cat: m.cat,
    title: m.title,
    date: m.date,
    loc: m.loc ?? "",
    img: m.img ?? "",
    size: m.size ?? "",
    excerpt: m.excerpt,
    body: m.body.join("\n\n"),
    published: m.published,
    order: m.order,
  };
}

function formToPayload(f: FormState) {
  return {
    cat: f.cat,
    title: f.title.trim(),
    date: f.date.trim(),
    loc: f.loc.trim() || null,
    img: f.img.trim() || null,
    size: (f.size || null) as "sm" | "md" | "lg" | null,
    excerpt: f.excerpt.trim(),
    body: f.body.split(/\n\n+/).map(s => s.trim()).filter(Boolean),
    published: f.published,
    order: f.order,
  };
}

type Props = { initial: MusingRow[]; dbMissing: boolean };

export default function MusingsCRUD({ initial, dbMissing }: Props) {
  const router = useRouter();
  const [items, setItems] = useState<MusingRow[]>(initial);
  const [mode, setMode] = useState<null | "create" | string>(null);
  const [form, setForm] = useState<FormState>(emptyForm(initial));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const formRef = useRef<HTMLDivElement>(null);

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

  function openCreate() {
    setForm(emptyForm(items));
    setMode("create");
    setError(null);
    setTimeout(() => formRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }), 50);
  }

  function openEdit(m: MusingRow) {
    setForm(musingToForm(m));
    setMode(m.id);
    setError(null);
  }

  function cancel() {
    setMode(null);
    setError(null);
    setDeleteConfirm(null);
  }

  async function handleCreate() {
    setBusy(true);
    setError(null);
    const payload = formToPayload(form);
    if (!payload.title || !payload.date || !payload.excerpt || !payload.body.length) {
      setError("Title, date, excerpt, and body are required.");
      setBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/musings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to create."); return; }
      setItems(prev => [...prev, data as MusingRow]);
      setMode(null);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function handleUpdate(id: string) {
    setBusy(true);
    setError(null);
    const payload = formToPayload(form);
    try {
      const res = await fetch(`/api/admin/musings/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error ?? "Failed to save."); return; }
      setItems(prev => prev.map(m => m.id === id ? data as MusingRow : m));
      setMode(null);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(id: string) {
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/admin/musings/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setError(data.error ?? "Failed to delete.");
        return;
      }
      setItems(prev => prev.filter(m => m.id !== id));
      setDeleteConfirm(null);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <h1>Musings</h1>
        <button className="btn btn--gold" onClick={openCreate} disabled={busy}>
          + New Musing
        </button>
      </div>

      {dbMissing && (
        <p className="admin-page__notice">
          Database not connected — showing static placeholders. Mutations require Postgres (see docs/admin-setup.md).
        </p>
      )}

      {error && <p className="admin-form__error" role="alert">{error}</p>}

      {mode === "create" && (
        <div className="admin-form" ref={formRef}>
          <h2 className="admin-form__title">New musing</h2>
          <MusingForm
            form={form}
            setField={setField}
            isCreate
            busy={busy}
            onSubmit={handleCreate}
            onCancel={cancel}
          />
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Category</th>
            <th>Title</th>
            <th>Date</th>
            <th>Pub</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {items.map(m => (
            <>
              <tr key={m.id}>
                <td><code>{m.id}</code></td>
                <td>{m.cat}</td>
                <td>{m.title}</td>
                <td>{m.date}</td>
                <td>{m.published ? "✓" : "–"}</td>
                <td>
                  <div className="admin-row-actions">
                    {deleteConfirm === m.id ? (
                      <>
                        <button className="admin-btn admin-btn--danger" onClick={() => handleDelete(m.id)} disabled={busy}>
                          Confirm delete
                        </button>
                        <button className="admin-btn" onClick={() => setDeleteConfirm(null)} disabled={busy}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="admin-btn"
                          onClick={() => { mode === m.id ? cancel() : openEdit(m); }}
                          disabled={busy}
                        >
                          {mode === m.id ? "Cancel" : "Edit"}
                        </button>
                        <button className="admin-btn admin-btn--danger" onClick={() => setDeleteConfirm(m.id)} disabled={busy}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>
              {mode === m.id && (
                <tr key={`${m.id}-form`}>
                  <td colSpan={6}>
                    <div className="admin-form admin-form--inline">
                      <MusingForm
                        form={form}
                        setField={setField}
                        busy={busy}
                        onSubmit={() => handleUpdate(m.id)}
                        onCancel={cancel}
                      />
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
          {items.length === 0 && (
            <tr>
              <td colSpan={6} style={{ textAlign: "center", color: "var(--bone-70)" }}>
                No musings yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

type MusingFormProps = {
  form: FormState;
  setField: <K extends keyof FormState>(k: K, v: FormState[K]) => void;
  isCreate?: boolean;
  busy: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

function MusingForm({ form, setField, isCreate: _isCreate, busy, onSubmit, onCancel }: MusingFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setUploadError(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) { setUploadError(data.error ?? "Upload failed."); return; }
      setField("img", data.url ?? "");
    } catch {
      setUploadError("Network error.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="admin-form__grid">
        <label className="admin-form__field">
          <span className="admin-form__label">Category</span>
          <select
            className="admin-form__select"
            value={form.cat}
            onChange={e => setField("cat", e.target.value)}
          >
            {CATS.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </label>
        <label className="admin-form__field admin-form__field--wide">
          <span className="admin-form__label">Title</span>
          <input
            className="admin-form__input"
            value={form.title}
            onChange={e => setField("title", e.target.value)}
            required
          />
        </label>
        <label className="admin-form__field">
          <span className="admin-form__label">Date <span className="admin-form__hint">(e.g. Spring 2024)</span></span>
          <input
            className="admin-form__input"
            value={form.date}
            onChange={e => setField("date", e.target.value)}
            required
          />
        </label>
        <label className="admin-form__field">
          <span className="admin-form__label">Location <span className="admin-form__hint">(optional)</span></span>
          <input
            className="admin-form__input"
            value={form.loc}
            onChange={e => setField("loc", e.target.value)}
          />
        </label>
        <div className="admin-form__field admin-form__field--wide">
          <span className="admin-form__label">Image <span className="admin-form__hint">(optional)</span></span>
          <label className="admin-upload">
            <input type="file" accept="image/*" className="admin-upload__input" onChange={handleFile} disabled={busy || uploading} />
            <span className="admin-upload__btn">{uploading ? "Uploading…" : "📷 Upload image"}</span>
          </label>
          {uploadError && <p className="admin-form__error" style={{ marginTop: "4px" }}>{uploadError}</p>}
          {form.img && (
            <div className="admin-upload__preview" style={{ marginTop: "8px" }}>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.img} alt="preview" />
            </div>
          )}
          <input
            className="admin-form__input"
            style={{ marginTop: "6px", fontSize: "11px" }}
            value={form.img}
            onChange={e => setField("img", e.target.value)}
            placeholder="or paste a URL / path"
          />
        </div>
        <label className="admin-form__field">
          <span className="admin-form__label">Size <span className="admin-form__hint">(optional)</span></span>
          <select
            className="admin-form__select"
            value={form.size}
            onChange={e => setField("size", e.target.value)}
          >
            <option value="">— none —</option>
            {SIZES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </label>
        <label className="admin-form__field">
          <span className="admin-form__label">Order</span>
          <input
            type="number"
            className="admin-form__input"
            value={form.order}
            onChange={e => setField("order", parseInt(e.target.value, 10) || 0)}
          />
        </label>
        <label className="admin-form__field admin-form__field--checkbox">
          <input
            type="checkbox"
            checked={form.published}
            onChange={e => setField("published", e.target.checked)}
          />
          <span className="admin-form__label">Published</span>
        </label>
      </div>

      <label className="admin-form__field admin-form__field--full">
        <span className="admin-form__label">Excerpt</span>
        <textarea
          className="admin-form__textarea admin-form__textarea--sm"
          value={form.excerpt}
          onChange={e => setField("excerpt", e.target.value)}
          required
        />
      </label>

      <label className="admin-form__field admin-form__field--full">
        <span className="admin-form__label">
          Body <span className="admin-form__hint">(separate paragraphs with a blank line)</span>
        </span>
        <textarea
          className="admin-form__textarea"
          value={form.body}
          onChange={e => setField("body", e.target.value)}
          required
        />
      </label>

      <div className="admin-form__actions">
        <button className="btn btn--gold" onClick={onSubmit} disabled={busy} aria-busy={busy}>
          {busy ? "Saving…" : "Save musing"}
        </button>
        <button className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}
