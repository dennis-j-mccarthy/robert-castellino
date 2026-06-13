"use client";

import { useCallback, useEffect, useState } from "react";
import { PRINT_SIZES, type PrintSize } from "@/data/pricing";
import { RoomPreview } from "@/components/room-preview";

// Re-exported so existing imports of these from this module keep working.
export { PRINT_SIZES };
export type { PrintSize };

type Props = {
  open: boolean;
  onClose: () => void;
  image: {
    no: string;
    title: string;
    loc: string;
    img: string;
    blurb?: string;
  } | null;
};

export function PrintModal({ open, onClose, image }: Props) {
  const [sizeIdx, setSizeIdx] = useState(2);
  const [qty, setQty] = useState(1);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [view, setView] = useState<"detail" | "wall">("detail");

  // Reset transient checkout state on close, so the next open starts clean.
  const close = useCallback(() => {
    setBusy(false);
    setErr(null);
    setView("detail");
    onClose();
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  if (!open || !image) return null;

  const size = PRINT_SIZES[sizeIdx];
  const total = (size.price * qty).toFixed(2);

  async function buy() {
    if (!image) return;
    setBusy(true);
    setErr(null);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          kind: "print",
          title: image.title,
          no: image.no,
          img: image.img,
          sizeLabel: size.label,
          qty,
        }),
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
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={close}
    >
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal__close"
          onClick={close}
          aria-label="Close"
        >
          <svg viewBox="0 0 14 14" width="14" height="14" aria-hidden="true">
            <path
              d="M3 3l8 8M11 3l-8 8"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.4"
            />
          </svg>
        </button>

        <div className="modal__media">
          <div className="modal__view" role="group" aria-label="View">
            <button
              type="button"
              className={view === "detail" ? "is-active" : ""}
              onClick={() => setView("detail")}
              aria-pressed={view === "detail"}
            >
              Detail
            </button>
            <button
              type="button"
              className={view === "wall" ? "is-active" : ""}
              onClick={() => setView("wall")}
              aria-pressed={view === "wall"}
            >
              On the wall
            </button>
          </div>

          {view === "detail" ? (
            <>
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={image.img} alt={image.title} />
            </>
          ) : (
            <RoomPreview
              img={image.img}
              alt={image.title}
              wIn={size.wIn}
              hIn={size.hIn}
            />
          )}
        </div>

        <div className="modal__body">
          <span className="modal__no">N° {image.no}</span>
          <h2 id="modal-title" className="modal__title">
            {image.title}
          </h2>
          <span className="modal__loc">{image.loc}</span>

          {image.blurb && (
            <p className="modal__blurb">{image.blurb}</p>
          )}

          <div className="modal__price">
            <span className="modal__price-amt">${total}</span>
            <span className="modal__price-note">USD · signed &amp; editioned</span>
          </div>

          <div className="modal__row">
            <div className="modal__qty">
              <button
                type="button"
                onClick={() => setQty((q) => Math.max(1, q - 1))}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span aria-live="polite">{qty}</span>
              <button
                type="button"
                onClick={() => setQty((q) => q + 1)}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
            <button
              type="button"
              className="btn btn--gold btn--lg modal__cart"
              onClick={buy}
              disabled={busy}
              aria-busy={busy}
            >
              {busy ? "Redirecting…" : "Purchase with Stripe"}
            </button>
          </div>

          {err && (
            <p className="modal__error" role="alert">
              {err}
            </p>
          )}

          <fieldset className="modal__field">
            <legend>
              <span className="modal__field-i">1</span> Medium
            </legend>
            <div className="modal__medium">Lustre Photo Paper</div>
          </fieldset>

          <fieldset className="modal__field">
            <legend>
              <span className="modal__field-i">2</span> Size
              <span className="modal__field-v">{size.label}</span>
            </legend>
            <div className="modal__sizes">
              {PRINT_SIZES.map((s, i) => (
                <button
                  key={s.label}
                  type="button"
                  className={`modal__size ${i === sizeIdx ? "is-active" : ""}`}
                  onClick={() => setSizeIdx(i)}
                  aria-pressed={i === sizeIdx}
                >
                  <span className="modal__size-l">{s.label}</span>
                  <span className="modal__size-p">${s.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          </fieldset>

        </div>
      </div>
    </div>
  );
}
