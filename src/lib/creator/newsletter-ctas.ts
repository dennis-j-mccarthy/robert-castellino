import type { NewsletterCta } from "@/lib/creator/newsletter";

/** Reads the optional calls to action sent by the Make-newsletter popup. */
export function readCtas(ctas: unknown, cta: unknown): { perMusing: Record<string, NewsletterCta>; whole: NewsletterCta | null } {
  const clean = (v: unknown): NewsletterCta | null => {
    if (!v || typeof v !== "object") return null;
    const o = v as Record<string, unknown>;
    const label = String(o.label ?? "").trim().slice(0, 60);
    const url = String(o.url ?? "").trim().slice(0, 500);
    if (!label || !url) return null;
    return { label, url: /^https?:\/\//i.test(url) ? url : `https://${url}` };
  };
  const perMusing: Record<string, NewsletterCta> = {};
  if (Array.isArray(ctas)) {
    for (const row of ctas) {
      if (!row || typeof row !== "object") continue;
      const id = String((row as Record<string, unknown>).musingId ?? "").trim();
      const c = clean(row);
      if (id && c) perMusing[id] = c;
    }
  }
  return { perMusing, whole: clean(cta) };
}
