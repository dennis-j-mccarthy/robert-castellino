import { getBrandEssence } from "@/lib/creator/essence-store";
import { SITE } from "@/lib/creator/pillars";
import { studio } from "@/studio.config";
import KitTabs from "@/components/creator/KitTabs";
import CopyChip from "@/components/creator/CopyChip";

export const dynamic = "force-dynamic";

/*
  Tool 2 · Brand kit → Brand kit tab. The marks, the colours, the type and
  the words, each with a copy or download so anything made outside the
  studio (a flyer, a gallery card, an email signature) matches the site.
  Read-only; the words come from Essence and the colours from the site's CSS.
*/

const LOGOS = studio.brandKit?.logos ?? [];
const COLOURS = studio.brandKit?.colours ?? [];
const TYPE = studio.brandKit?.type ?? [];

export default async function BrandKitPage() {
  const essence = await getBrandEssence();
  const words = [
    { k: "The line", v: essence.line },
    { k: "Promise", v: essence.promise },
    { k: "Call to action", v: essence.cta },
    ...(studio.brandKit?.words ?? []),
    { k: "Studio", v: `${SITE.name} · ${SITE.location} · ${SITE.domain}` },
  ].filter((w) => w.v);

  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">Brand kit</div>
      <h1>Brand kit</h1>
      <p>The marks, the colours, the type and the words. Copy or download from here so anything made outside the studio matches the site. The words come from Essence; change them there.</p>
      <KitTabs />

      <h2 className="bk-h">Logos and marks</h2>
      <div className="bk-logos">
        {LOGOS.map((l) => (
          <figure key={l.src} className={`tl-card bk-logo${l.dark ? " is-dark" : ""}`}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={l.src} alt={l.name} />
            <figcaption><b>{l.name}</b><span>{l.note}</span><a className="btn ui-btn-xs" href={l.src} download>Download</a></figcaption>
          </figure>
        ))}
      </div>
      <p className="bk-note">Missing: a square mark for avatars and the Meta ad identity. The site references <code>/brand/logo-square.png</code> but no file exists. A cropped &ldquo;RC&rdquo; from the script logo would do.</p>

      <h2 className="bk-h">Colours</h2>
      <div className="bk-colours">
        {COLOURS.map((c) => (
          <div key={c.hex} className="tl-card bk-colour">
            <span className="bk-swatch" style={{ background: c.hex }} />
            <b>{c.name}</b>
            <code>{c.hex}</code>
            <span>{c.note}</span>
            <CopyChip text={c.hex} />
          </div>
        ))}
      </div>

      <h2 className="bk-h">Type</h2>
      <div className="bk-type">
        {TYPE.map((t) => (
          <div key={t.name} className="tl-card bk-face">
            <div className="bk-sample" style={{ fontFamily: t.css, fontSize: t.size, fontWeight: t.weight }}>{t.sample}</div>
            <div className="bk-face__meta"><b>{t.name}</b><span>{t.role}</span><CopyChip text={t.name} label="Copy name" /></div>
          </div>
        ))}
      </div>

      <h2 className="bk-h">The words</h2>
      <div className="tl-card bk-words">
        {words.map((w) => (
          <div key={w.k} className="bk-word"><dt>{w.k}</dt><dd>{w.v}</dd><CopyChip text={w.v} /></div>
        ))}
      </div>
    </section>
  );
}
