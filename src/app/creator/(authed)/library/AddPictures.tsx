"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { api, errText } from "@/lib/creator/client";

/*
  Add pictures to the library: choose files, drop them, or paste one from
  the clipboard anywhere on the page. Each goes through the existing
  /api/admin/upload (resized, stored in the DB) and is then registered in the
  "Studio uploads" collection so it shows up in the grid. "Create with AI"
  is shown always; it needs an image-generation key that this site does not
  have yet, so it explains itself instead of failing.
*/

type Job = { name: string; state: "uploading" | "done" | "error"; msg?: string };

export default function AddPictures({ imageAi, onAdded }: { imageAi: boolean; onAdded?: (src: string) => void }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [over, setOver] = useState(false);
  const [showAi, setShowAi] = useState(false);
  const camRef = useRef<HTMLInputElement>(null);
  const [lastPreview, setLastPreview] = useState<string | null>(null);

  async function uploadFiles(files: File[]) {
    if (files[0]) setLastPreview(URL.createObjectURL(files[0]));
    const imgs = files.filter((f) => f.type.startsWith("image/"));
    if (!imgs.length) return;
    for (const f of imgs) {
      const name = f.name || "pasted image";
      setJobs((j) => [...j, { name, state: "uploading" }]);
      try {
        const fd = new FormData();
        fd.append("file", f, name);
        const up = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const uj = (await up.json()) as { url?: string; error?: string };
        if (!up.ok || !uj.url) throw new Error(uj.error || "Upload failed");
        const added = await api<{ src: string }>("/api/creator/library/add", { method: "POST", json: { url: uj.url, title: name.replace(/\.[a-z0-9]+$/i, "").replace(/[-_]+/g, " ") } });
        setJobs((j) => j.map((x) => (x.name === name && x.state === "uploading" ? { ...x, state: "done" } : x)));
        onAdded?.(added.src);
      } catch (e) {
        setJobs((j) => j.map((x) => (x.name === name && x.state === "uploading" ? { ...x, state: "error", msg: errText(e) } : x)));
      }
    }
    router.refresh();
  }

  // Paste anywhere on the page (not while typing in a field).
  useEffect(() => {
    const onPaste = (e: ClipboardEvent) => {
      const t = e.target as HTMLElement | null;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.isContentEditable)) return;
      const files = Array.from(e.clipboardData?.files ?? []);
      if (files.length) { e.preventDefault(); void uploadFiles(files); }
    };
    document.addEventListener("paste", onPaste);
    return () => document.removeEventListener("paste", onPaste);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className={`ap${over ? " is-over" : ""}`}
      onDragOver={(e) => { e.preventDefault(); setOver(true); }}
      onDragLeave={() => setOver(false)}
      onDrop={(e) => { e.preventDefault(); setOver(false); void uploadFiles(Array.from(e.dataTransfer.files)); }}
    >
      <div className="ap__row">
        <label className="ap__tap">
          <input ref={inputRef} type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { void uploadFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
          {lastPreview ? (
            // eslint-disable-next-line @next/next/no-img-element -- just-added preview
            <img src={lastPreview} alt="" />
          ) : (
            <span className="ap__plus" aria-hidden="true">+</span>
          )}
          <b>{lastPreview ? "Tap to add another" : "Tap to add a photo"}</b>
          <span>From your camera roll or computer. Drop files here or paste one. They land in &ldquo;Studio uploads&rdquo;, ready for posts.</span>
        </label>
        <div className="ap__actions">
          <button type="button" className="btn btn--gold ads-btn-sm ap__big" onClick={() => inputRef.current?.click()}>Choose photos</button>
          <button type="button" className="btn ads-btn-sm ap__big" onClick={() => camRef.current?.click()}>Take a photo</button>
          <button type="button" className="btn btn--ghost ads-btn-sm ap__big" onClick={() => setShowAi((v) => !v)}>Create with AI</button>
          <input ref={camRef} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { void uploadFiles(Array.from(e.target.files ?? [])); e.target.value = ""; }} />
        </div>
      </div>
      {showAi && (
        <div className="ap__ai">
          {imageAi ? (
            <p>Describe the picture you want and the studio will make it. Generated pictures are tagged as such and never used as a plate in ads.</p>
          ) : (
            <p><b>Not switched on for this site.</b> Making a picture needs an image model key (for example OpenAI) in the Vercel project; this site only has the writing model. Bob&rsquo;s brand is his own photographs, so when it is switched on, generated pictures will be tagged &ldquo;generated&rdquo; and kept out of ads and the book posts.</p>
          )}
        </div>
      )}
      {jobs.length > 0 && (
        <ul className="ap__jobs">
          {jobs.slice(-6).map((j, i) => (
            <li key={`${j.name}-${i}`} className={`is-${j.state}`}>{j.name} · {j.state === "uploading" ? "uploading…" : j.state === "done" ? "added" : j.msg}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
