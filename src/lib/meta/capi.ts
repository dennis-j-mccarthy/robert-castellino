/**
 * Meta Conversions API — server-side twin of the browser Pixel.
 *
 * The browser Pixel (src/components/meta-pixel.tsx) fires Purchase on the
 * Stripe success page. Ad blockers drop that. This sends the same event from
 * the server with the same event_id, so Meta counts it once whichever path
 * arrives. Dataset: the live pixel 1160986453259804.
 *
 * Token: META_CAPI_TOKEN if set, else META_ADS_TOKEN (a user/system-user
 * token on the business that owns the pixel is accepted by /events).
 * Sends only from the live site; preview and localhost are silently skipped
 * unless META_CAPI_TEST_CODE is set (then Events Manager → Test events).
 */

import { createHash } from "node:crypto";
import { GRAPH } from "./config";

const FALLBACK_PIXEL_ID = "1160986453259804";

export function capiPixelId(): string {
  return process.env.NEXT_PUBLIC_META_PIXEL_ID || FALLBACK_PIXEL_ID;
}

function capiToken(): string | undefined {
  return process.env.META_CAPI_TOKEN || process.env.META_ADS_TOKEN || undefined;
}

function sha256(v: string): string {
  return createHash("sha256").update(v).digest("hex");
}

/** Meta wants lower-cased, trimmed, SHA-256 hashed PII. */
function hashed(v: string | null | undefined): string[] | undefined {
  const s = v?.trim().toLowerCase();
  return s ? [sha256(s)] : undefined;
}

function hashedPhone(v: string | null | undefined): string[] | undefined {
  const digits = v?.replace(/\D/g, "");
  return digits ? [sha256(digits)] : undefined;
}

export interface PurchaseInput {
  /** Stripe Checkout Session id — same value the browser Pixel uses as eventID. */
  eventId: string;
  value: number; // dollars
  currency: string; // "USD"
  contentName?: string;
  numItems?: number;
  /** From the request. */
  sourceUrl: string;
  clientIp?: string | null;
  userAgent?: string | null;
  fbp?: string | null; // _fbp cookie
  fbc?: string | null; // _fbc cookie
  /** From Stripe customer_details. Hashed before sending. */
  email?: string | null;
  phone?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  city?: string | null;
  state?: string | null;
  zip?: string | null;
  country?: string | null;
}

export interface CapiResult {
  sent: boolean;
  reason?: string;
  eventsReceived?: number;
  fbtraceId?: string;
}

/**
 * Send a Purchase to the Conversions API. Never throws; the receipt page must
 * render whether or not Meta is reachable.
 */
export async function sendPurchase(input: PurchaseInput): Promise<CapiResult> {
  const token = capiToken();
  if (!token) return { sent: false, reason: "no token" };

  const testCode = process.env.META_CAPI_TEST_CODE;
  const host = (() => {
    try {
      return new URL(input.sourceUrl).hostname;
    } catch {
      return "";
    }
  })();
  const live = host === "robertcastellino.com" || host === "www.robertcastellino.com";
  if (!live && !testCode) return { sent: false, reason: `not live site (${host || "no host"})` };

  const [first, ...rest] = (input.firstName ?? "").trim().split(/\s+/).filter(Boolean);
  const last = input.lastName ?? rest.join(" ");

  const userData: Record<string, unknown> = {
    em: hashed(input.email),
    ph: hashedPhone(input.phone),
    fn: hashed(first),
    ln: hashed(last),
    ct: hashed(input.city?.replace(/\s+/g, "")),
    st: hashed(input.state),
    zp: hashed(input.zip),
    country: hashed(input.country),
    client_ip_address: input.clientIp || undefined,
    client_user_agent: input.userAgent || undefined,
    fbp: input.fbp || undefined,
    fbc: input.fbc || undefined,
  };
  for (const k of Object.keys(userData)) if (userData[k] === undefined) delete userData[k];

  const event = {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: input.eventId,
    event_source_url: input.sourceUrl,
    action_source: "website",
    user_data: userData,
    custom_data: {
      value: Number(input.value.toFixed(2)),
      currency: input.currency.toUpperCase(),
      content_name: input.contentName,
      content_type: "product",
      num_items: input.numItems ?? 1,
    },
  };

  const body = new URLSearchParams({
    data: JSON.stringify([event]),
    access_token: token,
  });
  if (testCode) body.set("test_event_code", testCode);

  try {
    const res = await fetch(`${GRAPH}/${capiPixelId()}/events`, {
      method: "POST",
      body,
      cache: "no-store",
    });
    const json = (await res.json().catch(() => ({}))) as {
      events_received?: number;
      fbtrace_id?: string;
      error?: { message?: string };
    };
    if (!res.ok) return { sent: false, reason: json.error?.message || `HTTP ${res.status}` };
    return { sent: true, eventsReceived: json.events_received, fbtraceId: json.fbtrace_id };
  } catch (e) {
    return { sent: false, reason: e instanceof Error ? e.message : String(e) };
  }
}
