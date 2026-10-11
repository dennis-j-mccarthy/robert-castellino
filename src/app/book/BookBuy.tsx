"use client";

import { useState } from "react";
import { BOOK, bookUnitPrice, isBookPromo } from "@/data/pricing";

/** `initialCode` comes from /book?code=…, so ad links arrive with the discount applied. */
export function BookBuy({ initialCode = "" }: { initialCode?: string }) {
  const [signed, setSigned] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [code, setCode] = useState(initialCode);

  const promoOn = isBookPromo(code);
  const price = bookUnitPrice(signed, code);

  async function buy() {
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kind: "book", signed, qty: 1, code: promoOn ? code : undefined }),
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
          Signed copy <span className="book__signed-note">(no extra charge)</span>
        </span>
      </label>

      <label className="book__signed">
        <span>Promo code</span>
        <input
          type="text"
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={BOOK.promo.code}
          autoCapitalize="characters"
          spellCheck={false}
          style={{ width: "8em", marginLeft: "0.5em", textTransform: "uppercase" }}
        />
        {promoOn && <span className="book__signed-note"> ${BOOK.listPrice} → ${BOOK.promo.price}</span>}
      </label>

      <button
        type="button"
        className="btn btn--gold btn--lg"
        onClick={buy}
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? "Redirecting…" : `Order — $${price.toFixed(2).replace(/\.00$/, "")} + shipping`}
      </button>

      {err && (
        <p className="modal__error" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
