"use client";

import { useState } from "react";

// A small "copy" button for hex codes, font names and lines of text.
export default function CopyChip({ text, label }: { text: string; label?: string }) {
  const [done, setDone] = useState(false);
  return (
    <button
      type="button"
      className={`bk-copy${done ? " is-done" : ""}`}
      onClick={async () => {
        try { await navigator.clipboard.writeText(text); setDone(true); setTimeout(() => setDone(false), 1400); } catch {}
      }}
      title={`Copy ${text}`}
    >
      {done ? "Copied" : label ?? "Copy"}
    </button>
  );
}
