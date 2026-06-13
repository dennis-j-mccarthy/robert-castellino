import Link from "next/link";

export default function CheckoutCancel() {
  return (
    <section className="route checkout-page">
      <div className="checkout-card">
        <span className="checkout-card__eyebrow">— Checkout canceled</span>
        <h1 className="checkout-card__title">No charge was made.</h1>
        <p className="checkout-card__lead">
          Your checkout was canceled and nothing was charged. Your selection is
          still waiting whenever you’re ready.
        </p>
        <div className="checkout-card__cta">
          <Link className="btn btn--ghost" href="/gallery">Return to the gallery</Link>
          <Link className="btn btn--bare" href="/book">See the book</Link>
        </div>
      </div>
    </section>
  );
}
