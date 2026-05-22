"use client";

import { useEffect, useState } from "react";

export type PrintSize = {
  label: string;
  price: number;
};

export const PRINT_SIZES: PrintSize[] = [
  { label: "10 × 8",   price: 26.25 },
  { label: "12 × 10",  price: 36.40 },
  { label: "24 × 20",  price: 101.50 },
  { label: "36 × 30",  price: 258.30 },
  { label: "48 × 40",  price: 329.28 },
];

type Props = {
  open: boolean;
  onClose: () => void;
  image: {
    no: string;
    title: string;
    loc: string;
    img: string;
  } | null;
};

export function PrintModal({ open, onClose, image }: Props) {
  const [sizeIdx, setSizeIdx] = useState(2);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open || !image) return null;

  const size = PRINT_SIZES[sizeIdx];
  const total = (size.price * qty).toFixed(2);

  return (
    <div
      className="modal"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={onClose}
    >
      <div className="modal__panel" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          className="modal__close"
          onClick={onClose}
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
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={image.img} alt={image.title} />
        </div>

        <div className="modal__body">
          <span className="modal__no">N° {image.no}</span>
          <h2 id="modal-title" className="modal__title">
            {image.title}
          </h2>
          <span className="modal__loc">{image.loc}</span>

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
            <button type="button" className="btn btn--gold btn--lg modal__cart">
              Add to Cart
            </button>
          </div>

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

          <p className="modal__ship">
            Shipped from the Boulder studio · usually within 5 business days.
          </p>
        </div>
      </div>
    </div>
  );
}
