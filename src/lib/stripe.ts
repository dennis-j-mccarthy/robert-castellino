import Stripe from "stripe";

// Until STRIPE_SECRET_KEY is set (test key first, live key when ready), the
// checkout route returns a friendly "not configured" response instead of
// throwing — mirroring how the contact form degrades without Resend/DB.
export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

let client: Stripe | null = null;

/** Lazily construct a single Stripe client. Call only after isStripeConfigured(). */
export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not set");
  }
  if (!client) {
    client = new Stripe(key);
  }
  return client;
}
