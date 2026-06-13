"use client";

import { useState } from "react";
import { BOOK } from "@/data/pricing";

export function BookBuy() {
  const [signed, setSigned] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const price = BOOK.basePrice + (signed ? BOOK.signedSurcharge : 0);

  async function buy() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "book", signed, qty: 1 }),
      });
      const data = (await res.json()) as { url?: string; error?: string };
      if (!res.ok || !data.url) {
        setErr(data.error ?? "Unable to start checkout.");
        setBusy(false);
        return;
      }
      window.location.href = data.url; // hand off to Stripe's hosted page
    } catch {
      setErr("Network error. Please try again.");
      setBusy(false);
    }
  }

  return (
    <div className="book__cta">
      <label className="book__signed">
        <input
          type="checkbox"
          checked={signed}
          onChange={(e) => setSigned(e.target.checked)}
        />
        <span>
          Signed copy <span className="book__signed-note">(+${BOOK.signedSurcharge})</span>
        </span>
      </label>

      <button
        type="button"
        className="btn btn--gold btn--lg"
        onClick={buy}
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? "Redirecting…" : `Order — $${price} + shipping`}
      </button>

      {err && (
        <p className="modal__error" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
