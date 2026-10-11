// Canonical pricing for everything sellable on the site.
//
// This module is plain (no "use client") so it can be imported by BOTH the
// browser UI and the server checkout route. The server is the source of
// truth: it re-derives every amount from this table, so a tampered price
// posted from the browser can never change what a buyer is actually charged.

export type PrintSize = {
  label: string;
  /** Price per print, in USD. */
  price: number;
  /** Real-world print dimensions in inches — drives the to-scale wall preview. */
  wIn: number;
  hIn: number;
};

export const PRINT_SIZES: PrintSize[] = [
  { label: "10 × 8", price: 26.25, wIn: 10, hIn: 8 },
  { label: "12 × 10", price: 36.4, wIn: 12, hIn: 10 },
  { label: "24 × 20", price: 101.5, wIn: 24, hIn: 20 },
  { label: "36 × 30", price: 258.3, wIn: 36, hIn: 30 },
  { label: "48 × 40", price: 329.28, wIn: 48, hIn: 40 },
];

export const BOOK = {
  title: "Colorado: Life & Light on the Land",
  /** List price in USD. Signed or unsigned, same price. */
  listPrice: 60,
  /** Added to the price for a signed copy. */
  signedSurcharge: 0,
  /** Promo code that drops the book to `promo.price`. Matched case-insensitively. */
  promo: { code: "10OFF", price: 49.95 },
};

/** True when `code` is the book promo code. */
export function isBookPromo(code?: string | null): boolean {
  return !!code && code.trim().toUpperCase() === BOOK.promo.code;
}

/** Per-copy book price in USD for the given options. */
export function bookUnitPrice(signed: boolean, code?: string | null): number {
  const base = isBookPromo(code) ? BOOK.promo.price : BOOK.listPrice;
  return base + (signed ? BOOK.signedSurcharge : 0);
}

/** Flat shipping, in USD, applied at checkout per order kind. */
export const SHIPPING = {
  print: 12,
  book: 12,
};

/** Look up a print size by its label; returns undefined if not a real size. */
export function findPrintSize(label: string): PrintSize | undefined {
  return PRINT_SIZES.find((s) => s.label === label);
}

/** USD dollars → integer cents (Stripe charges in the smallest currency unit). */
export function toCents(usd: number): number {
  return Math.round(usd * 100);
}
