import { SITE } from "@/lib/creator/pillars";
import { studio } from "@/studio.config";
import { absoluteImageUrl } from "@/lib/creator/library";

/*
  Newsletter rendering — deterministic, no network. The model writes the
  COPY (subjects, preheader, intro, a blurb per Musing, outro); this file
  turns it into a simple single-column email (inline styles, one hero image
  from the first Musing, a section per Musing with "Read the musing →",
  the two CTAs, the owner's footer) and its plain-text twin.
*/

export interface NewsletterMusing {
  id: string;
  title: string;
  excerpt: string;
  img: string | null;
  loc: string | null;
  /** Public URL of the post (from the content adapter) */
  url?: string;
}

export interface NewsletterCta {
  label: string;
  url: string;
}

export interface NewsletterCopy {
  intro: string;
  blurbs: { musingId: string; heading: string; blurb: string; cta?: NewsletterCta | null }[];
  outro: string;
  /** One call to action for the whole issue, shown as a featured block before the sign-off. */
  cta?: NewsletterCta | null;
}

export interface NewsletterRenderOptions {
  subject: string;
  preheader: string;
  /** Under the logo in the masthead. Falls back to the studio line. */
  tagline?: string | null;
  /** Preview only: when the intro is blank, show a placeholder where the owner's preamble will go. */
  introPlaceholder?: string | null;
}

export const LOGO_URL = studio.brand.logo ? (studio.brand.logo.startsWith("http") ? studio.brand.logo : `${SITE.url}${studio.brand.logo}`) : null;
export const DEFAULT_TAGLINE = studio.brand.tagline;

export interface RenderedNewsletter {
  html: string;
  text: string;
}

const GOLD = studio.brand.accent;
const INK = "#15161c";
const MUTED = "#6b665a";
const PAPER = "#f4f0e6";
const RULE = "#e3dccb";

export const FOOTER_LINE = `${SITE.name} · ${SITE.location} · ${SITE.domain}`;
export const CTA_BOOK = { label: studio.offer.ctaLabel, url: `${SITE.url}${studio.offer.path}` };
export const CTA_PRINTS = studio.offer.secondary ? { label: studio.offer.secondary.label, url: `${SITE.url}${studio.offer.secondary.path}` } : null;

export function musingUrl(id: string): string {
  return `${SITE.url}${SITE.blogPath}/${id}`;
}

export function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export const stripTags = (s: string) => s.replace(/<[^>]+>/g, "").replace(/&mdash;/g, "—").replace(/&nbsp;/g, " ");

const P = `margin:0 0 14px;font-size:17px;line-height:1.65;color:${INK};font-family:Georgia,'Times New Roman',serif;`;

function paras(s: string, style: string): string {
  return s
    .split(/\n\s*\n/)
    .map((p) => p.trim())
    .filter(Boolean)
    .map((p) => `<p style="${style}">${escapeHtml(p).replace(/\n/g, "<br>")}</p>`)
    .join("\n");
}

function button(label: string, url: string, filled: boolean): string {
  const base = `display:inline-block;padding:11px 20px;border-radius:999px;font-size:13px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;`;
  return filled
    ? `<a href="${url}" style="${base}background:${GOLD};color:#111;">${escapeHtml(label)}</a>`
    : `<a href="${url}" style="${base}border:1px solid ${GOLD};color:${GOLD};">${escapeHtml(label)}</a>`;
}

const SANS = `-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif`;

function ctaBlock(cta: NewsletterCta, featured: boolean): string {
  if (!cta.label.trim() || !cta.url.trim()) return "";
  if (!featured) return `<p style="margin:14px 0 0;">${button(cta.label, cta.url, true)}</p>`;
  return `
  <tr><td style="padding:30px 32px 0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${PAPER};border-radius:14px;">
      <tr><td align="center" style="padding:26px 24px;">
        <p style="margin:0 0 14px;font-size:11px;letter-spacing:.2em;text-transform:uppercase;color:${MUTED};font-family:${SANS};">This issue</p>
        ${button(cta.label, cta.url, true)}
      </td></tr>
    </table>
  </td></tr>`;
}

export function renderNewsletter(
  musings: NewsletterMusing[],
  copy: NewsletterCopy,
  opts: NewsletterRenderOptions,
): RenderedNewsletter {
  const tagline = (opts.tagline ?? "").trim() || DEFAULT_TAGLINE;
  const introHtml = copy.intro.trim()
    ? paras(copy.intro, P)
    : opts.introPlaceholder
      ? `<p style="${P}color:${MUTED};font-style:italic;border-left:3px solid ${RULE};padding-left:14px;">${escapeHtml(opts.introPlaceholder)}</p>`
      : "";
  const hero = musings[0]?.img ? absoluteImageUrl(musings[0].img) : null;
  const blurbFor = (m: NewsletterMusing) =>
    copy.blurbs.find((b) => b.musingId === m.id) ?? { musingId: m.id, heading: m.title, blurb: stripTags(m.excerpt) };

  const sections = musings
    .map((m, i) => {
      const b = blurbFor(m);
      const url = m.url ?? musingUrl(m.id);
      const img = i > 0 && m.img ? absoluteImageUrl(m.img) : null;
      return `
        <tr><td style="padding:${i === 0 ? 0 : 30}px 0 0;">
          ${img ? `<a href="${url}" style="display:block;margin:0 0 14px;"><img src="${escapeHtml(img)}" alt="" width="600" style="display:block;width:100%;height:auto;border:0;"></a>` : ""}
          <h2 style="margin:0 0 8px;font-size:24px;line-height:1.2;color:${INK};font-weight:400;font-family:Georgia,'Times New Roman',serif;"><a href="${url}" style="color:${INK};text-decoration:none;">${escapeHtml(b.heading || m.title)}</a></h2>
          ${m.loc ? `<p style="margin:0 0 10px;font-size:11px;letter-spacing:.14em;text-transform:uppercase;color:${MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${escapeHtml(m.loc)}</p>` : ""}
          ${paras(b.blurb || stripTags(m.excerpt), P)}
          <p style="margin:0;"><a href="${url}" style="color:${GOLD};font-size:15px;text-decoration:none;font-family:Georgia,'Times New Roman',serif;">Read the post &rarr;</a></p>
          ${b.cta ? ctaBlock(b.cta, false) : ""}
        </td></tr>`;
    })
    .join("\n");

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="x-apple-disable-message-reformatting">
<title>${escapeHtml(opts.subject)}</title>
</head>
<body style="margin:0;padding:0;background:${PAPER};">
<div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${escapeHtml(opts.preheader)}&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;&nbsp;&zwnj;</div>
<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${PAPER};">
<tr><td align="center" style="padding:28px 12px;">
<table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="width:100%;max-width:600px;background:#ffffff;">
  <tr><td align="center" style="padding:34px 32px 0;">
    <a href="${SITE.url}" style="display:inline-block;text-decoration:none;">${LOGO_URL ? `<img src="${LOGO_URL}" alt="${escapeHtml(SITE.name)}" width="300" style="display:block;width:300px;max-width:100%;height:auto;border:0;">` : `<span style="font-size:22px;letter-spacing:.06em;color:${INK};font-family:Georgia,'Times New Roman',serif;">${escapeHtml(SITE.name)}</span>`}</a>
    <table role="presentation" cellspacing="0" cellpadding="0" border="0" align="center" style="margin:16px auto 0;"><tr>
      <td style="width:36px;border-top:1px solid ${GOLD};font-size:0;line-height:0;">&nbsp;</td>
      <td style="padding:0 12px;font-size:11px;letter-spacing:.22em;text-transform:uppercase;color:${GOLD};font-family:${SANS};white-space:nowrap;">${escapeHtml(tagline)}</td>
      <td style="width:36px;border-top:1px solid ${GOLD};font-size:0;line-height:0;">&nbsp;</td>
    </tr></table>
  </td></tr>
  ${hero ? `<tr><td style="padding:18px 32px 0;"><a href="${musings[0].url ?? musingUrl(musings[0].id)}" style="display:block;"><img src="${escapeHtml(hero)}" alt="" width="536" style="display:block;width:100%;height:auto;border:0;"></a></td></tr>` : ""}
  <tr><td style="padding:24px 32px 0;">
    <h1 style="margin:0 0 16px;font-size:30px;line-height:1.15;color:${INK};font-weight:300;font-family:Georgia,'Times New Roman',serif;">${escapeHtml(opts.subject)}</h1>
    ${introHtml}
  </td></tr>
  <tr><td style="padding:6px 32px 0;">
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
      ${sections}
    </table>
  </td></tr>
  ${copy.cta ? ctaBlock(copy.cta, true) : ""}
  <tr><td style="padding:30px 32px 0;">
    ${paras(copy.outro, P)}
    <p style="margin:0 0 6px;font-size:15px;line-height:1.6;color:${MUTED};font-family:Georgia,'Times New Roman',serif;">&mdash; ${escapeHtml(studio.site.owner)}</p>
  </td></tr>
  <tr><td style="padding:22px 32px 30px;">
    <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr>
      <td style="padding:0 10px 10px 0;">${button(CTA_BOOK.label, CTA_BOOK.url, true)}</td>
      ${CTA_PRINTS ? `<td style="padding:0 0 10px;">${button(CTA_PRINTS.label, CTA_PRINTS.url, false)}</td>` : ""}
    </tr></table>
    <p style="margin:6px 0 0;font-size:12px;line-height:1.6;color:${MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${escapeHtml(studio.offer.title)} &middot; ${escapeHtml(studio.offer.facts)}</p>
  </td></tr>
  <tr><td style="padding:18px 32px 26px;border-top:1px solid ${RULE};">
    <p style="margin:0;font-size:12px;line-height:1.7;color:${MUTED};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">${escapeHtml(FOOTER_LINE)}<br>
    You're receiving this because you asked to hear from the studio. <a href="{{unsubscribe_url}}" style="color:${MUTED};">Unsubscribe</a></p>
  </td></tr>
</table>
</td></tr>
</table>
</body>
</html>`;

  const textSections = musings
    .map((m) => {
      const b = blurbFor(m);
      return `${(b.heading || m.title).toUpperCase()}${m.loc ? `\n${m.loc}` : ""}\n\n${b.blurb || stripTags(m.excerpt)}\n\nRead it: ${m.url ?? musingUrl(m.id)}${b.cta?.label && b.cta.url ? `\n${b.cta.label}: ${b.cta.url}` : ""}`;
    })
    .join("\n\n— — —\n\n");

  const text = [
    SITE.name,
    tagline,
    "",
    opts.subject,
    opts.preheader || null,
    "",
    copy.intro,
    "",
    textSections,
    "",
    copy.cta?.label && copy.cta.url ? `${copy.cta.label}: ${copy.cta.url}` : null,
    copy.outro,
    `— ${studio.site.owner}`,
    "",
    `${CTA_BOOK.label}: ${CTA_BOOK.url}`,
    CTA_PRINTS ? `${CTA_PRINTS.label}: ${CTA_PRINTS.url}` : null,
    `${studio.offer.title} · ${studio.offer.facts}`,
    "",
    FOOTER_LINE,
    "Unsubscribe: {{unsubscribe_url}}",
  ]
    .filter((l) => l !== null)
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  return { html, text };
}

/** Deterministic copy when the model isn't available. */
export function fallbackNewsletterCopy(musings: NewsletterMusing[], topic?: string): NewsletterCopy {
  return {
    intro: topic
      ? `A note from the studio, on ${topic}.`
      : musings.length > 1
        ? "A few notes from the studio this month."
        : "One note from the studio this month.",
    blurbs: musings.map((m) => ({ musingId: m.id, heading: m.title, blurb: stripTags(m.excerpt) })),
    outro: "If one of these mornings stays with you, the book and the prints are on the site. Thank you for reading.",
  };
}
