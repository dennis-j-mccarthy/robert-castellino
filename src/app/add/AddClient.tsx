"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

export type CollectionOption = { id: string; slug: string; label: string; nextOrder: number };

type State = "idle" | "uploading" | "saving" | "done" | "error";

export default function AddClient({ collections }: { collections: CollectionOption[] }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [preview, setPreview] = useState<string>("");
  const [imgUrl, setImgUrl] = useState<string>("");
  const [collectionId, setCollectionId] = useState(collections[0]?.id ?? "");
  const [title, setTitle] = useState("");
  const [loc, setLoc] = useState("");
  const [blurb, setBlurb] = useState("");
  const [order, setOrder] = useState<number>(() => collections[0]?.nextOrder ?? 0);
  const [state, setState] = useState<State>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  const busy = state === "uploading" || state === "saving";

  function handleCollectionChange(id: string) {
    setCollectionId(id);
    const coll = collections.find(c => c.id === id);
    setOrder(coll?.nextOrder ?? 0);
  }

  async function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setPreview(URL.createObjectURL(file));
    setImgUrl("");
    setState("uploading");
    setErrorMsg("");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const data = await res.json() as { url?: string; error?: string };
      if (!res.ok) { setErrorMsg(data.error ?? "Upload failed."); setState("error"); return; }
      setImgUrl(data.url ?? "");
      setState("idle");
    } catch {
      setErrorMsg("Network error during upload.");
      setState("error");
    }
  }

  async function handleSave() {
    if (!imgUrl) { setErrorMsg("Please choose a photo first."); return; }
    if (!title.trim()) { setErrorMsg("Title is required."); return; }
    if (!collectionId) { setErrorMsg("Choose a gallery."); return; }
    setState("saving");
    setErrorMsg("");
    try {
      const res = await fetch(`/api/admin/collections/${collectionId}/photos`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ img: imgUrl, title: title.trim(), loc: loc.trim() || "Unknown", blurb: blurb.trim() || title.trim(), order }),
      });
      const data = await res.json() as { error?: string };
      if (!res.ok) { setErrorMsg(data.error ?? "Save failed."); setState("error"); return; }
      const coll = collections.find(c => c.id === collectionId);
      setState("done");
      router.push(`/gallery?c=${coll?.slug ?? ""}`);
    } catch {
      setErrorMsg("Network error.");
      setState("error");
    }
  }

  const selectedColl = collections.find(c => c.id === collectionId);

  return (
    <div className="add-page">
      <h1 className="add-page__title">Add a photo</h1>

      {/* ── Upload area ── */}
      <button
        type="button"
        className={`add-upload ${preview ? "add-upload--has-preview" : ""}`}
        onClick={() => fileRef.current?.click()}
        disabled={busy}
        aria-label="Choose or take a photo"
      >
        {preview ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={preview} alt="preview" className="add-upload__preview" />
        ) : (
          <div className="add-upload__prompt">
            <svg viewBox="0 0 48 48" width="48" height="48" fill="none" aria-hidden="true">
              <circle cx="24" cy="24" r="23" stroke="currentColor" strokeWidth="1.5" opacity=".3" />
              <path d="M24 14v20M14 24h20" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
              <path d="M16 30l-2 4h20l-2-4" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round" opacity=".5" />
            </svg>
            <span>{state === "uploading" ? "Uploading…" : "Tap to choose or shoot"}</span>
          </div>
        )}
        {state === "uploading" && <div className="add-upload__spinner" />}
      </button>
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        style={{ display: "none" }}
        onChange={handleFile}
        disabled={busy}
      />

      {preview && state !== "uploading" && (
        <button type="button" className="add-retake" onClick={() => fileRef.current?.click()} disabled={busy}>
          Choose different photo
        </button>
      )}

      {/* ── Fields ── */}
      <div className="add-fields">
        <label className="add-field">
          <span className="add-label">Gallery</span>
          <select
            className="add-input"
            value={collectionId}
            onChange={e => handleCollectionChange(e.target.value)}
            disabled={busy}
          >
            {collections.map(c => (
              <option key={c.id} value={c.id}>{c.label}</option>
            ))}
          </select>
        </label>

        <label className="add-field">
          <span className="add-label">Title</span>
          <input
            type="text"
            className="add-input"
            placeholder="e.g. Cascade Creek at Dawn"
            value={title}
            onChange={e => setTitle(e.target.value)}
            disabled={busy}
          />
        </label>

        <label className="add-field">
          <span className="add-label">Location <span className="add-label__hint">optional</span></span>
          <input
            type="text"
            className="add-input"
            placeholder="e.g. Gore Range, CO"
            value={loc}
            onChange={e => setLoc(e.target.value)}
            disabled={busy}
          />
        </label>

        <label className="add-field">
          <span className="add-label">Caption <span className="add-label__hint">optional</span></span>
          <textarea
            className="add-input add-input--textarea"
            placeholder="A short note about this image…"
            value={blurb}
            onChange={e => setBlurb(e.target.value)}
            disabled={busy}
            rows={3}
          />
        </label>

        <label className="add-field add-field--short">
          <span className="add-label">Order <span className="add-label__hint">within {selectedColl?.label}</span></span>
          <input
            type="number"
            className="add-input"
            value={order}
            onChange={e => setOrder(parseInt(e.target.value, 10) || 0)}
            disabled={busy}
            min={0}
          />
        </label>
      </div>

      {errorMsg && <p className="add-error" role="alert">{errorMsg}</p>}

      <button
        type="button"
        className="add-save"
        onClick={handleSave}
        disabled={busy || !imgUrl}
        aria-busy={busy}
      >
        {state === "saving" ? "Saving…" : state === "done" ? "Saved ✓" : "Save to gallery"}
      </button>
    </div>
  );
}
