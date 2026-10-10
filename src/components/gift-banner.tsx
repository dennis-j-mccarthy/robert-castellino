import Link from "next/link";

// Site-wide holiday promotion. Campaign line and destination are from the
// project HANDOFF ("Give the gift of Colorado" → /book). No discount code is
// shown because the holiday code is still a placeholder. Static by design —
// there is no existing dismissible-banner pattern in the codebase.
export function GiftBanner() {
  return (
    <Link
      href="/book"
      className="promo"
      aria-label="Give the gift of Colorado — shop Robert Castellino's monograph"
    >
      <span className="promo__dot" aria-hidden="true" />
      <span className="promo__text">
        <strong>Give the gift of Colorado</strong>
        <span className="promo__sub">
          {" "}
          — Robert&apos;s monograph, signed &amp; shipped from Boulder
        </span>
      </span>
      <span className="promo__cta">
        Shop the book
        <svg viewBox="0 0 14 14" width="10" height="10" aria-hidden="true">
          <path d="M2 7h10M7 2l5 5-5 5" fill="none" stroke="currentColor" strokeWidth="1.5" />
        </svg>
      </span>
    </Link>
  );
}
