import Link from "next/link";
import { getAudienceView } from "@/lib/creator/audience";
import { hasAnthropicKey } from "@/lib/creator/ai";
import { isDatabaseConfigured } from "@/lib/prisma";
import ReaderCard from "./ReaderCard";

export const dynamic = "force-dynamic";

/*
  Tool 3 · Audience. The reader, the email list, and the segments: Meta
  audiences in plain words, joined to what Meta says about them today and
  where they are running. Read-only toward Meta.
*/

const fmt = (n: number | null) => (n == null ? "—" : n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n));

export default async function AudiencePage() {
  const v = await getAudienceView();
  const running = v.segments.filter((s) => s.uses.some((u) => u.status === "ACTIVE"));
  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">Audience</div>
      <h1>Who this is for</h1>
      <p>The reader every piece is written to, the people on the email list, and the audiences the ads reach. Audiences are built in Meta; this page says what each one is in plain words and what it is doing right now.</p>

      <div className="au-top">
        <ReaderCard initial={v.reader} db={isDatabaseConfigured()} ai={hasAnthropicKey()} />
        <section className="tl-card au-card">
          <h4>The email list</h4>
          <p className="au-exp">People who gave their address on the site. The newsletter goes to them.</p>
          {v.subscribers ? (
            <div className="au-stats">
              <div><b>{v.subscribers.total}</b><span>on the list</span></div>
              <div><b>{v.subscribers.confirmed}</b><span>confirmed</span></div>
              <div><b>{v.subscribers.last30}</b><span>joined, 30 days</span></div>
            </div>
          ) : <p className="au-muted">No database connected.</p>}
          <Link href="/creator/newsletter" className="wk-link">Write the newsletter →</Link>
        </section>
      </div>

      <div className="au-head">
        <h2>Ad audiences <span className="cr-h2sub">· {v.segments.length} in Meta · {running.length} running now</span></h2>
        {v.fetchedAt && <span className="au-muted">From Meta at {new Date(v.fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Denver" })} MT</span>}
      </div>
      {v.error && <p className="au-err">Meta: {v.error}</p>}
      {!v.configured && <p className="au-muted">The ads token is not set, so sizes and spend can&rsquo;t be read. The cards still describe each audience.</p>}

      <div className="au-grid">
        {v.segments.map((s) => {
          const c = s.card;
          const vb = c?.vb ?? {};
          const active = s.uses.filter((u) => u.status === "ACTIVE");
          const spend = s.uses.reduce((n, u) => n + u.spend7d, 0);
          const buys = s.uses.reduce((n, u) => n + u.purchases7d, 0);
          const clicks = s.uses.reduce((n, u) => n + u.linkClicks7d, 0);
          const tooSmall = s.live?.deliveryCode === 300 || /too small/i.test(s.live?.deliveryText ?? c?.sizeNote ?? "");
          return (
            <article key={s.live?.id ?? s.card?.id ?? s.name} className={`tl-card au-seg${active.length ? " is-running" : ""}`}>
              <header className="au-seg__head">
                <div>
                  <b>{s.name}</b>
                  <span className="au-seg__sub">{c?.subtype ?? s.live?.subtype ?? ""}{c?.created ? ` · since ${c.created}` : ""}</span>
                </div>
                <span className={`au-pill${active.length ? " is-on" : tooSmall ? " is-warn" : ""}`}>{active.length ? "Running" : tooSmall ? "Too small" : s.live ? "Ready" : "Not in Meta"}</span>
              </header>
              {vb.define && <p className="au-seg__define">{vb.define}</p>}
              {!vb.define && c?.metaDef && <p className="au-seg__define">{c.metaDef}</p>}
              <div className="au-seg__facts">
                <div><dt>Size, per Meta</dt><dd>{s.live ? (s.live.lower === s.live.upper ? fmt(s.live.lower) : `${fmt(s.live.lower)}–${fmt(s.live.upper)}`) : vb.est ?? c?.sizeNote ?? "—"}</dd></div>
                {vb.geo && <div><dt>Where</dt><dd>{vb.geo}</dd></div>}
                {vb.age && <div><dt>Age</dt><dd>{vb.age}</dd></div>}
                {vb.best && <div><dt>Best for</dt><dd>{vb.best}</dd></div>}
              </div>
              {s.uses.length > 0 && (
                <div className="au-seg__uses">
                  <dt>Running in</dt>
                  {s.uses.map((u) => (
                    <div key={u.adsetId} className={`au-use${u.status === "ACTIVE" ? " is-on" : ""}`}>
                      <span><b>{u.campaignLabel}</b> · {u.adsetName.replace(/^S?\d+\s*·\s*/, "")}</span>
                      <span className="au-use__n">{u.status === "ACTIVE" ? `$${u.spend7d.toFixed(0)} · ${u.linkClicks7d} clicks · ${u.purchases7d} sold` : u.status.toLowerCase().replace(/_/g, " ")}</span>
                    </div>
                  ))}
                  {active.length > 1 && <div className="au-use au-use--total"><span>Together, last 7 days</span><span className="au-use__n">${spend.toFixed(0)} · {clicks} clicks · {buys} sold</span></div>}
                </div>
              )}
              {vb.caution && <p className="au-seg__caution">{vb.caution}</p>}
              <div className="au-seg__foot">
                <a className="btn btn--ghost ads-btn-xs" href={s.metaUrl} target="_blank" rel="noreferrer">Open in Meta ↗</a>
                {active.length > 0 && <Link className="btn ads-btn-xs" href="/creator/ads">See the ads →</Link>}
              </div>
            </article>
          );
        })}
      </div>
      <p className="au-muted" style={{ marginTop: 14 }}>New audiences are made in Meta (Ads Manager → Audiences). Once one exists it shows here; to give it a plain-words card, tell Dennis what it is for and it gets added to Essence.</p>
    </section>
  );
}
