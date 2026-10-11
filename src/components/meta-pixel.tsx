"use client";

import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

// Meta Pixel. Inert until NEXT_PUBLIC_META_PIXEL_ID is set in Vercel, so it can
// ship before the pixel exists in Events Manager.
const PIXEL_ID = process.env.NEXT_PUBLIC_META_PIXEL_ID;

type Fbq = (cmd: string, ...args: unknown[]) => void;

function fbq(): Fbq | null {
  if (typeof window === "undefined") return null;
  return ((window as unknown as { fbq?: Fbq }).fbq) ?? null;
}

/** Fire a standard Meta event. `eventId` dedupes against a future Conversions API send. */
export function trackPixel(event: string, params?: Record<string, unknown>, eventId?: string) {
  if (!PIXEL_ID) return;
  fbq()?.("track", event, params ?? {}, eventId ? { eventID: eventId } : undefined);
}

/** Base code + a PageView on every client-side route change. */
export function MetaPixel() {
  const pathname = usePathname();
  const first = useRef(true);

  useEffect(() => {
    if (!PIXEL_ID) return;
    // The base snippet sends the first PageView itself.
    if (first.current) {
      first.current = false;
      return;
    }
    fbq()?.("track", "PageView");
  }, [pathname]);

  if (!PIXEL_ID) return null;
  return (
    <Script id="meta-pixel" strategy="afterInteractive">
      {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?
n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;
n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;
t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,
document,'script','https://connect.facebook.net/en_US/fbevents.js');
fbq('init','${PIXEL_ID}');fbq('track','PageView');`}
    </Script>
  );
}

/** Fires one event when mounted (e.g. ViewContent on /book, Purchase on the receipt). */
export function PixelEvent({
  event,
  params,
  eventId,
}: {
  event: string;
  params?: Record<string, unknown>;
  eventId?: string;
}) {
  const sent = useRef(false);
  useEffect(() => {
    if (sent.current) return;
    sent.current = true;
    // A refreshed receipt page must not count the same order twice.
    const key = eventId ? `px:${event}:${eventId}` : null;
    try {
      if (key && window.localStorage.getItem(key)) return;
      if (key) window.localStorage.setItem(key, "1");
    } catch {
      // Storage blocked: fall back to Meta's own eventID dedupe.
    }
    // The base script loads afterInteractive; wait briefly for fbq to exist.
    let tries = 0;
    const id = window.setInterval(() => {
      if (fbq() || ++tries > 20) {
        window.clearInterval(id);
        trackPixel(event, params, eventId);
      }
    }, 150);
    return () => window.clearInterval(id);
  }, [event, params, eventId]);
  return null;
}
