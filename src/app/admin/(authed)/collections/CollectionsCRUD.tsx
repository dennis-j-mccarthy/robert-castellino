"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

type PhotoRow = {
  id: string;
  collectionId: string;
  img: string;
  title: string;
  loc: string;
  blurb: string;
  order: number;
};

type CollectionRow = {
  id: string;
  slug: string;
  label: string;
  intro: string;
  order: number;
  published: boolean;
  photos: PhotoRow[];
};

// ─── Collection form ────────────────────────────────────────────────────────

type CollForm = {
  slug: string;
  label: string;
  intro: string;
  order: number;
  published: boolean;
};

function emptyCollForm(): CollForm {
  return { slug: "", label: "", intro: "", order: 0, published: true };
}

function collToForm(c: CollectionRow): CollForm {
  return { slug: c.slug, label: c.label, intro: c.intro, order: c.order, published: c.published };
}

// ─── Photo form ─────────────────────────────────────────────────────────────

type PhotoForm = {
  img: string;
  title: string;
  loc: string;
  blurb: string;
  order: number;
};

function emptyPhotoForm(photos: PhotoRow[]): PhotoForm {
  const maxOrder = photos.length ? Math.max(...photos.map(p => p.order)) + 1 : 0;
  return { img: "", title: "", loc: "", blurb: "", order: maxOrder };
}

function photoToForm(p: PhotoRow): PhotoForm {
  return { img: p.img, title: p.title, loc: p.loc, blurb: p.blurb, order: p.order };
}

// ─── Main component ──────────────────────────────────────────────────────────

type Props = { initial: CollectionRow[]; dbMissing: boolean };

export default function CollectionsCRUD({ initial, dbMissing }: Props) {
  const router = useRouter();
  const [collections, setCollections] = useState<CollectionRow[]>(initial);

  // Collection CRUD state
  const [collMode, setCollMode] = useState<null | "create" | string>(null);
  const [collForm, setCollForm] = useState<CollForm>(emptyCollForm());
  const [collBusy, setCollBusy] = useState(false);
  const [collError, setCollError] = useState<string | null>(null);
  const [collDeleteConfirm, setCollDeleteConfirm] = useState<string | null>(null);

  // Photo management state (which collection is open)
  const [openCollection, setOpenCollection] = useState<string | null>(null);
  const [photoMode, setPhotoMode] = useState<null | "create" | string>(null);
  const [photoForm, setPhotoForm] = useState<PhotoForm>(emptyPhotoForm([]));
  const [photoBusy, setPhotoBusy] = useState(false);
  const [photoError, setPhotoError] = useState<string | null>(null);
  const [photoDeleteConfirm, setPhotoDeleteConfirm] = useState<string | null>(null);

  // ─── Collection actions ──────────────────────────────────────────────────

  function openCreateColl() {
    setCollForm(emptyCollForm());
    setCollMode("create");
    setCollError(null);
  }

  function openEditColl(c: CollectionRow) {
    setCollForm(collToForm(c));
    setCollMode(c.id);
    setCollError(null);
  }

  function cancelColl() {
    setCollMode(null);
    setCollError(null);
    setCollDeleteConfirm(null);
  }

  async function handleCreateColl() {
    setCollBusy(true);
    setCollError(null);
    if (!collForm.slug.trim() || !collForm.label.trim() || !collForm.intro.trim()) {
      setCollError("Slug, label, and intro are required.");
      setCollBusy(false);
      return;
    }
    try {
      const res = await fetch("/api/admin/collections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(collForm),
      });
      const data = await res.json();
      if (!res.ok) { setCollError(data.error ?? "Failed to create."); return; }
      setCollections(prev => [...prev, data as CollectionRow]);
      setCollMode(null);
      router.refresh();
    } catch {
      setCollError("Network error.");
    } finally {
      setCollBusy(false);
    }
  }

  async function handleUpdateColl(id: string) {
    setCollBusy(true);
    setCollError(null);
    const { slug: _slug, ...payload } = collForm;
    void _slug;
    try {
      const res = await fetch(`/api/admin/collections/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) { setCollError(data.error ?? "Failed to save."); return; }
      setCollections(prev => prev.map(c => c.id === id ? { ...data, photos: c.photos } : c));
      setCollMode(null);
      router.refresh();
    } catch {
      setCollError("Network error.");
    } finally {
      setCollBusy(false);
    }
  }

  async function handleDeleteColl(id: string) {
    setCollBusy(true);
    setCollError(null);
    try {
      const res = await fetch(`/api/admin/collections/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setCollError(data.error ?? "Failed to delete.");
        return;
      }
      setCollections(prev => prev.filter(c => c.id !== id));
      setCollDeleteConfirm(null);
      if (openCollection === id) setOpenCollection(null);
      router.refresh();
    } catch {
      setCollError("Network error.");
    } finally {
      setCollBusy(false);
    }
  }

  // ─── Photo actions ───────────────────────────────────────────────────────

  function togglePhotos(collId: string) {
    if (openCollection === collId) {
      setOpenCollection(null);
      setPhotoMode(null);
      setPhotoError(null);
    } else {
      setOpenCollection(collId);
      setPhotoMode(null);
      setPhotoError(null);
      const coll = collections.find(c => c.id === collId);
      setPhotoForm(emptyPhotoForm(coll?.photos ?? []));
    }
  }

  function openCreatePhoto(collId: string) {
    const coll = collections.find(c => c.id === collId);
    setPhotoForm(emptyPhotoForm(coll?.photos ?? []));
    setPhotoMode("create");
    setPhotoError(null);
  }

  function openEditPhoto(p: PhotoRow) {
    setPhotoForm(photoToForm(p));
    setPhotoMode(p.id);
    setPhotoError(null);
  }

  function cancelPhoto() {
    setPhotoMode(null);
    setPhotoError(null);
    setPhotoDeleteConfirm(null);
  }

  async function handleCreatePhoto(collId: string) {
    setPhotoBusy(true);
    setPhotoError(null);
    if (!photoForm.img.trim() || !photoForm.title.trim() || !photoForm.loc.trim() || !photoForm.blurb.trim()) {
      setPhotoError("Image path, title, location, and description are required.");
      setPhotoBusy(false);
      return;
    }
    try {
      const res = await fetch(`/api/admin/collections/${collId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photoForm),
      });
      const data = await res.json();
      if (!res.ok) { setPhotoError(data.error ?? "Failed to add photo."); return; }
      setCollections(prev => prev.map(c =>
        c.id === collId ? { ...c, photos: [...c.photos, data as PhotoRow] } : c
      ));
      setPhotoMode(null);
      router.refresh();
    } catch {
      setPhotoError("Network error.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleUpdatePhoto(photoId: string) {
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const res = await fetch(`/api/admin/photos/${photoId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(photoForm),
      });
      const data = await res.json();
      if (!res.ok) { setPhotoError(data.error ?? "Failed to save."); return; }
      setCollections(prev => prev.map(c => ({
        ...c,
        photos: c.photos.map(p => p.id === photoId ? data as PhotoRow : p),
      })));
      setPhotoMode(null);
      router.refresh();
    } catch {
      setPhotoError("Network error.");
    } finally {
      setPhotoBusy(false);
    }
  }

  async function handleDeletePhoto(photoId: string) {
    setPhotoBusy(true);
    setPhotoError(null);
    try {
      const res = await fetch(`/api/admin/photos/${photoId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        setPhotoError(data.error ?? "Failed to delete.");
        return;
      }
      setCollections(prev => prev.map(c => ({
        ...c,
        photos: c.photos.filter(p => p.id !== photoId),
      })));
      setPhotoDeleteConfirm(null);
      router.refresh();
    } catch {
      setPhotoError("Network error.");
    } finally {
      setPhotoBusy(false);
    }
  }

  // ─── Render ──────────────────────────────────────────────────────────────

  return (
    <section className="admin-page">
      <div className="admin-page__header">
        <h1>Gallery collections</h1>
        <button className="btn btn--gold" onClick={openCreateColl} disabled={collBusy}>
          + New Collection
        </button>
      </div>

      {dbMissing && (
        <p className="admin-page__notice">
          Database not connected — showing static placeholders. Mutations require Postgres (see docs/admin-setup.md).
        </p>
      )}

      {collError && <p className="admin-form__error" role="alert">{collError}</p>}

      {collMode === "create" && (
        <div className="admin-form">
          <h2 className="admin-form__title">New collection</h2>
          <CollectionForm
            form={collForm}
            setForm={setCollForm}
            isCreate
            busy={collBusy}
            onSubmit={handleCreateColl}
            onCancel={cancelColl}
          />
        </div>
      )}

      <table className="admin-table">
        <thead>
          <tr>
            <th>Slug</th>
            <th>Label</th>
            <th>Photos</th>
            <th>Pub</th>
            <th />
          </tr>
        </thead>
        <tbody>
          {collections.map(c => (
            <>
              <tr key={c.id}>
                <td><code>{c.slug}</code></td>
                <td>{c.label}</td>
                <td>{c.photos.length}</td>
                <td>{c.published ? "✓" : "–"}</td>
                <td>
                  <div className="admin-row-actions">
                    <button
                      className="admin-btn admin-btn--subtle"
                      onClick={() => togglePhotos(c.id)}
                    >
                      {openCollection === c.id ? "Close photos" : `Photos (${c.photos.length})`}
                    </button>
                    {collDeleteConfirm === c.id ? (
                      <>
                        <button className="admin-btn admin-btn--danger" onClick={() => handleDeleteColl(c.id)} disabled={collBusy}>
                          Confirm delete
                        </button>
                        <button className="admin-btn" onClick={() => setCollDeleteConfirm(null)} disabled={collBusy}>
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          className="admin-btn"
                          onClick={() => { collMode === c.id ? cancelColl() : openEditColl(c); }}
                          disabled={collBusy}
                        >
                          {collMode === c.id ? "Cancel" : "Edit"}
                        </button>
                        <button className="admin-btn admin-btn--danger" onClick={() => setCollDeleteConfirm(c.id)} disabled={collBusy}>
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </td>
              </tr>

              {/* Inline edit form for collection */}
              {collMode === c.id && (
                <tr key={`${c.id}-edit`}>
                  <td colSpan={5}>
                    <div className="admin-form admin-form--inline">
                      <CollectionForm
                        form={collForm}
                        setForm={setCollForm}
                        busy={collBusy}
                        onSubmit={() => handleUpdateColl(c.id)}
                        onCancel={cancelColl}
                      />
                    </div>
                  </td>
                </tr>
              )}

              {/* Photo management panel */}
              {openCollection === c.id && (
                <tr key={`${c.id}-photos`}>
                  <td colSpan={5}>
                    <div className="admin-photos-panel">
                      <div className="admin-photos-panel__header">
                        <span className="admin-photos-panel__title">
                          Photos in <em>{c.label}</em>
                        </span>
                        <button
                          className="btn btn--gold"
                          style={{ padding: "8px 16px", fontSize: "11px" }}
                          onClick={() => openCreatePhoto(c.id)}
                          disabled={photoBusy}
                        >
                          + Add photo
                        </button>
                      </div>

                      {photoError && <p className="admin-form__error" role="alert">{photoError}</p>}

                      {photoMode === "create" && (
                        <div className="admin-form admin-form--inline">
                          <h3 className="admin-form__title">Add photo</h3>
                          <PhotoForm
                            form={photoForm}
                            setForm={setPhotoForm}
                            busy={photoBusy}
                            onSubmit={() => handleCreatePhoto(c.id)}
                            onCancel={cancelPhoto}
                          />
                        </div>
                      )}

                      {c.photos.length === 0 ? (
                        <p style={{ color: "var(--bone-70)", fontStyle: "italic", padding: "12px 0" }}>
                          No photos yet. Add one above.
                        </p>
                      ) : (
                        <table className="admin-table admin-table--nested">
                          <thead>
                            <tr>
                              <th>Image path</th>
                              <th>Title</th>
                              <th>Location</th>
                              <th>Order</th>
                              <th />
                            </tr>
                          </thead>
                          <tbody>
                            {c.photos.map(p => (
                              <>
                                <tr key={p.id}>
                                  <td>
                                    {p.img ? (
                                      // eslint-disable-next-line @next/next/no-img-element
                                      <img src={p.img} alt={p.title} className="admin-photo-thumb" />
                                    ) : (
                                      <span style={{ color: "var(--bone-70)", fontSize: "12px" }}>—</span>
                                    )}
                                  </td>
                                  <td>{p.title}</td>
                                  <td>{p.loc}</td>
                                  <td>{p.order}</td>
                                  <td>
                                    <div className="admin-row-actions">
                                      {photoDeleteConfirm === p.id ? (
                                        <>
                                          <button className="admin-btn admin-btn--danger" onClick={() => handleDeletePhoto(p.id)} disabled={photoBusy}>
                                            Confirm
                                          </button>
                                          <button className="admin-btn" onClick={() => setPhotoDeleteConfirm(null)} disabled={photoBusy}>
                                            Cancel
                                          </button>
                                        </>
                                      ) : (
                                        <>
                                          <button
                                            className="admin-btn"
                                            onClick={() => { photoMode === p.id ? cancelPhoto() : openEditPhoto(p); }}
                                            disabled={photoBusy}
                                          >
                                            {photoMode === p.id ? "Cancel" : "Edit"}
                                          </button>
                                          <button className="admin-btn admin-btn--danger" onClick={() => setPhotoDeleteConfirm(p.id)} disabled={photoBusy}>
                                            Delete
                                          </button>
                                        </>
                                      )}
                                    </div>
                                  </td>
                                </tr>
                                {photoMode === p.id && (
                                  <tr key={`${p.id}-edit`}>
                                    <td colSpan={5}>
                                      <div className="admin-form admin-form--inline">
                                        <PhotoForm
                                          form={photoForm}
                                          setForm={setPhotoForm}
                                          busy={photoBusy}
                                          onSubmit={() => handleUpdatePhoto(p.id)}
                                          onCancel={cancelPhoto}
                                        />
                                      </div>
                                    </td>
                                  </tr>
                                )}
                              </>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </td>
                </tr>
              )}
            </>
          ))}
          {collections.length === 0 && (
            <tr>
              <td colSpan={5} style={{ textAlign: "center", color: "var(--bone-70)" }}>
                No collections yet.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}

// ─── Collection form component ────────────────────────────────────────────────

type CollFormProps = {
  form: CollForm;
  setForm: React.Dispatch<React.SetStateAction<CollForm>>;
  isCreate?: boolean;
  busy: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

function CollectionForm({ form, setForm, isCreate, busy, onSubmit, onCancel }: CollFormProps) {
  function set<K extends keyof CollForm>(k: K, v: CollForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }
  return (
    <div>
      <div className="admin-form__grid">
        {isCreate && (
          <label className="admin-form__field">
            <span className="admin-form__label">Slug <span className="admin-form__hint">(e.g. waterfalls)</span></span>
            <input
              className="admin-form__input"
              value={form.slug}
              onChange={e => set("slug", e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
              required
            />
          </label>
        )}
        <label className="admin-form__field">
          <span className="admin-form__label">Label</span>
          <input
            className="admin-form__input"
            value={form.label}
            onChange={e => set("label", e.target.value)}
            required
          />
        </label>
        <label className="admin-form__field">
          <span className="admin-form__label">Order</span>
          <input
            type="number"
            className="admin-form__input"
            value={form.order}
            onChange={e => set("order", parseInt(e.target.value, 10) || 0)}
          />
        </label>
        <label className="admin-form__field admin-form__field--checkbox">
          <input
            type="checkbox"
            checked={form.published}
            onChange={e => set("published", e.target.checked)}
          />
          <span className="admin-form__label">Published</span>
        </label>
      </div>
      <label className="admin-form__field admin-form__field--full">
        <span className="admin-form__label">Intro</span>
        <textarea
          className="admin-form__textarea admin-form__textarea--sm"
          value={form.intro}
          onChange={e => set("intro", e.target.value)}
          required
        />
      </label>
      <div className="admin-form__actions">
        <button className="btn btn--gold" onClick={onSubmit} disabled={busy} aria-busy={busy}>
          {busy ? "Saving…" : "Save collection"}
        </button>
        <button className="btn btn--ghost" onClick={onCancel} disabled={busy}>
          Cancel
        </button>
      </div>
    </div>
  );
}

// ─── Photo form component ─────────────────────────────────────────────────────

type PhotoFormProps = {
  form: PhotoForm;
  setForm: React.Dispatch<React.SetStateAction<PhotoForm>>;
  busy: boolean;
  onSubmit: () => void;
  onCancel: () => void;
};

function PhotoForm({ form, setForm, busy, onSubmit, onCancel }: PhotoFormProps) {
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  function set<K extends keyof PhotoForm>(k: K, v: PhotoForm[K]) {
    setForm(f => ({ ...f, [k]: v }));
  }

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
      set("img", data.url ?? "");
    } catch {
      setUploadError("Network error during upload.");
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="admin-form__grid">
        <div className="admin-form__field admin-form__field--wide">
          <span className="admin-form__label">Photo</span>
          <label className="admin-upload">
            <input
              type="file"
              accept="image/*"
              className="admin-upload__input"
              onChange={handleFile}
              disabled={busy || uploading}
            />
            <span className="admin-upload__btn">
              {uploading ? "Uploading…" : "📷 Choose photo or take picture"}
            </span>
          </label>
          {uploadError && <p className="admin-form__error" style={{ marginTop: "4px" }}>{uploadError}</p>}
          {form.img && (
            <div className="admin-upload__preview">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={form.img} alt="preview" />
            </div>
          )}
          <input
            className="admin-form__input"
            style={{ marginTop: "6px", fontSize: "11px" }}
            value={form.img}
            onChange={e => set("img", e.target.value)}
            placeholder="or paste a URL / path"
          />
        </div>
        <label className="admin-form__field">
          <span className="admin-form__label">Title</span>
          <input
            className="admin-form__input"
            value={form.title}
            onChange={e => set("title", e.target.value)}
            required
          />
        </label>
        <label className="admin-form__field">
          <span className="admin-form__label">Location</span>
          <input
            className="admin-form__input"
            value={form.loc}
            onChange={e => set("loc", e.target.value)}
            required
          />
        </label>
        <label className="admin-form__field">
          <span className="admin-form__label">Order</span>
          <input
            type="number"
            className="admin-form__input"
            value={form.order}
            onChange={e => set("order", parseInt(e.target.value, 10) || 0)}
          />
        </label>
      </div>
      <label className="admin-form__field admin-form__field--full">
        <span className="admin-form__label">Description</span>
        <textarea
          className="admin-form__textarea admin-form__textarea--sm"
          value={form.blurb}
          onChange={e => set("blurb", e.target.value)}
          required
        />
      </label>
      <div className="admin-form__actions">
        <button className="btn btn--gold" onClick={onSubmit} disabled={busy || uploading} aria-busy={busy}>
          {busy ? "Saving…" : "Save photo"}
        </button>
        <button className="btn btn--ghost" onClick={onCancel} disabled={busy || uploading}>
          Cancel
        </button>
      </div>
    </div>
  );
}
