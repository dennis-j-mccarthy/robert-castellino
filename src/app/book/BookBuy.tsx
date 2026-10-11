"use client";

import { useState } from "react";
import { BOOK, bookUnitPrice, isBookPromo } from "@/data/pricing";

const usd = (n: number) => `$${n.toFixed(2).replace(/\.00$/, "")}`;

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
    <div className="offer-card">
      <span className="offer-card__tag">Signed copy offer</span>

      <div className="offer-card__price">
        {promoOn ? (
          <>
            <s>{usd(BOOK.listPrice)}</s>
            <strong>{usd(price)}</strong>
          </>
        ) : (
          <strong>{usd(price)}</strong>
        )}
      </div>

      {promoOn ? (
        <p className="offer-card__code offer-card__code--on">
          ✓ Code <b>{BOOK.promo.code}</b> applied. You save {usd(BOOK.listPrice - BOOK.promo.price)}.
        </p>
      ) : (
        <p className="offer-card__code">
          Use code <b>{BOOK.promo.code}</b> for {usd(BOOK.promo.price)}.{" "}
          <button type="button" className="offer-card__apply" onClick={() => setCode(BOOK.promo.code)}>
            Apply
          </button>
        </p>
      )}

      <button
        type="button"
        className="btn btn--gold btn--lg offer-card__cta"
        onClick={buy}
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? "Redirecting…" : `${signed ? "Order a signed copy" : "Order the book"} — ${usd(price)}`}
      </button>

      <label className="book__signed">
        <input
          type="checkbox"
          checked={signed}
          onChange={(e) => setSigned(e.target.checked)}
        />
        <span>Signed by Robert (no extra charge)</span>
      </label>

      <p className="offer-card__note">Ships from the Boulder studio, usually within 3 business days.</p>

      {err && (
        <p className="modal__error" role="alert">
          {err}
        </p>
      )}
    </div>
  );
}
