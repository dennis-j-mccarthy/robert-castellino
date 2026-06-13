import Link from "next/link";
import type Stripe from "stripe";
import { getStripe, isStripeConfigured } from "@/lib/stripe";

export const dynamic = "force-dynamic";

function usd(cents: number | null | undefined): string {
  if (cents == null) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "usd",
  }).format(cents / 100);
}

type OrderLine = { name: string; qty: number; amount: number; image?: string };

export default async function CheckoutSuccess({
  searchParams,
}: {
  searchParams: Promise<{ session_id?: string }>;
}) {
  const { session_id } = await searchParams;

  let session: Stripe.Checkout.Session | null = null;
  if (session_id && isStripeConfigured()) {
    try {
      session = await getStripe().checkout.sessions.retrieve(session_id, {
        expand: ["line_items.data.price.product"],
      });
    } catch {
      // Bad/expired id — fall through to a generic thank-you.
    }
  }

  const email = session?.customer_details?.email ?? null;
  const fullName = session?.customer_details?.name ?? null;
  const firstName = fullName?.trim().split(/\s+/)[0] ?? null;

  const line: OrderLine | null = (() => {
    const li = session?.line_items?.data?.[0];
    if (!li) return null;
    const product = li.price?.product;
    const image =
      product && typeof product === "object" && "images" in product
        ? product.images?.[0]
        : undefined;
    return {
      name: li.description ?? "Your order",
      qty: li.quantity ?? 1,
      amount: li.amount_total ?? 0,
      image,
    };
  })();

  const subtotal = session?.amount_subtotal ?? null;
  const shipping = session?.total_details?.amount_shipping ?? null;
  const total = session?.amount_total ?? null;

  // Short, human order reference derived from the session id.
  const ref = session?.id
    ? `RC-${session.id.replace(/^cs_(test|live)_/, "").slice(0, 8).toUpperCase()}`
    : null;

  // Shipping address (current API nests it under collected_information).
  const ship = session?.collected_information?.shipping_details ?? null;
  const shipCity = ship?.address?.city;
  const shipState = ship?.address?.state;
  const shipWhere = [shipCity, shipState].filter(Boolean).join(", ");

  return (
    <section className="route confirm-page">
      <div className="confirm">
        <span className="confirm__seal" aria-hidden="true">
          <svg viewBox="0 0 24 24" width="26" height="26">
            <path
              d="M4 12.5l5 5L20 6.5"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>

        <span className="confirm__eyebrow">— Order confirmed</span>
        <h1 className="confirm__title">
          Thank you{firstName ? <>, {firstName}</> : null}.
        </h1>
        <p className="confirm__lead">
          Your order is in, and a receipt is on its way
          {email ? <> to <strong>{email}</strong></> : null}.
        </p>

        {(line || total != null) && (
          <div className="confirm__receipt">
            {line && (
              <div className="confirm__item">
                {line.image && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img className="confirm__item-img" src={line.image} alt={line.name} />
                )}
                <div className="confirm__item-text">
                  <span className="confirm__item-name">{line.name}</span>
                  <span className="confirm__item-meta">Quantity {line.qty}</span>
                </div>
                <span className="confirm__item-amt">{usd(line.amount)}</span>
              </div>
            )}

            <dl className="confirm__totals">
              <div>
                <dt>Subtotal</dt>
                <dd>{usd(subtotal)}</dd>
              </div>
              <div>
                <dt>Shipping</dt>
                <dd>{usd(shipping)}</dd>
              </div>
              <div className="confirm__grand">
                <dt>Total</dt>
                <dd>{usd(total)}</dd>
              </div>
            </dl>

            {(ref || shipWhere) && (
              <div className="confirm__refrow">
                {ref && <span className="confirm__ref">Order {ref}</span>}
                {shipWhere && (
                  <span className="confirm__shipto">Shipping to {shipWhere}</span>
                )}
              </div>
            )}
          </div>
        )}

        <ol className="confirm__steps">
          <li>
            <span className="confirm__step-no">01</span>
            <span>Printed &amp; inspected by hand in the Boulder studio.</span>
          </li>
          <li>
            <span className="confirm__step-no">02</span>
            <span>Signed, editioned, and carefully packed — usually within 3 business days.</span>
          </li>
          <li>
            <span className="confirm__step-no">03</span>
            <span>Tracking is emailed to you the moment it ships.</span>
          </li>
        </ol>

        <p className="confirm__note">
          Questions about your order? Just reply to your receipt email, or{" "}
          <Link href="/contact">reach the studio</Link>.
        </p>

        <div className="confirm__cta">
          <Link className="btn btn--ghost" href="/gallery">Continue browsing</Link>
          <Link className="btn btn--bare" href="/">Back home</Link>
        </div>
      </div>
    </section>
  );
}
