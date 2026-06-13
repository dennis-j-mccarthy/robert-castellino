import { NextResponse } from "next/server";
import { z } from "zod";
import { getStripe, isStripeConfigured } from "@/lib/stripe";
import {
  BOOK,
  SHIPPING,
  findPrintSize,
  toCents,
} from "@/data/pricing";

export const runtime = "nodejs";

// The browser sends WHAT was selected, never the price. The server looks up
// the authoritative amount from src/data/pricing.ts below.
const Body = z.discriminatedUnion("kind", [
  z.object({
    kind: z.literal("print"),
    title: z.string().trim().min(1).max(160),
    sizeLabel: z.string().trim().min(1).max(40),
    qty: z.number().int().min(1).max(20),
    img: z.string().trim().max(400).optional(),
    no: z.string().trim().max(20).optional(),
  }),
  z.object({
    kind: z.literal("book"),
    signed: z.boolean(),
    qty: z.number().int().min(1).max(20),
  }),
]);

function originFrom(req: Request): string {
  const explicit = process.env.NEXT_PUBLIC_SITE_URL;
  if (explicit) return explicit.replace(/\/$/, "");
  const origin = req.headers.get("origin");
  if (origin) return origin;
  // Fall back to forwarded host (proxied prod) or the request URL's origin.
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  if (host) return `${proto}://${host}`;
  return new URL(req.url).origin;
}

function absUrl(origin: string, path?: string): string | undefined {
  if (!path) return undefined;
  return path.startsWith("http") ? path : `${origin}${path}`;
}

export async function POST(req: Request) {
  if (!isStripeConfigured()) {
    return NextResponse.json(
      { error: "Checkout is not set up yet. (STRIPE_SECRET_KEY is not configured.)" },
      { status: 503 },
    );
  }

  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const parsed = Body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid request", details: parsed.error.flatten() },
      { status: 400 },
    );
  }
  const data = parsed.data;
  const origin = originFrom(req);

  // Build the single authoritative line item.
  let lineItem: { name: string; description?: string; unitAmount: number; images?: string[] };
  let shippingUsd: number;

  if (data.kind === "print") {
    const size = findPrintSize(data.sizeLabel);
    if (!size) {
      return NextResponse.json({ error: "Unknown print size" }, { status: 400 });
    }
    lineItem = {
      name: data.no ? `${data.title} (N° ${data.no})` : data.title,
      description: `Fine art print · ${size.label}″ · signed & editioned · lustre photo paper`,
      unitAmount: toCents(size.price),
      images: absUrl(origin, data.img) ? [absUrl(origin, data.img) as string] : undefined,
    };
    shippingUsd = SHIPPING.print;
  } else {
    const unit = BOOK.basePrice + (data.signed ? BOOK.signedSurcharge : 0);
    lineItem = {
      name: data.signed ? `${BOOK.title} — signed copy` : BOOK.title,
      description: "168-page hardcover monograph · fifth printing",
      unitAmount: toCents(unit),
    };
    shippingUsd = SHIPPING.book;
  }

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: [
        {
          quantity: data.qty,
          price_data: {
            currency: "usd",
            unit_amount: lineItem.unitAmount,
            product_data: {
              name: lineItem.name,
              ...(lineItem.description ? { description: lineItem.description } : {}),
              ...(lineItem.images ? { images: lineItem.images } : {}),
            },
          },
        },
      ],
      shipping_address_collection: { allowed_countries: ["US", "CA"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: "Standard shipping",
            fixed_amount: { amount: toCents(shippingUsd), currency: "usd" },
          },
        },
      ],
      // Lets Stripe email a receipt and lets us match a session to its order.
      metadata: {
        kind: data.kind,
        ...(data.kind === "print"
          ? { sizeLabel: data.sizeLabel, title: data.title }
          : { signed: String(data.signed) }),
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/checkout/cancel`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("[checkout] Stripe session create failed:", err);
    return NextResponse.json(
      { error: "Unable to start checkout. Please try again." },
      { status: 502 },
    );
  }
}
