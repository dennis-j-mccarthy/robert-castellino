import { SEO_STANDING, runSeoAudit, type Grade } from "@/lib/creator/seo-audit";

const WORD: Record<Grade, string> = { pass: "OK", warn: "Look", fail: "Fix" };

export default async function TechnicalSeo() {
  const a = await runSeoAudit();
  const fixes = [...a.site.map((c) => ({ ...c, page: "" })), ...a.pages.flatMap((p) => p.checks.map((c) => ({ ...c, page: p.path })))].filter((c) => c.grade !== "pass");
  return (
    <div className="sr-sec">
      <div className="kw-explain">
        <div className="tl-eyebrow">What this does</div>
        <p>Checked just now against the live site: the plumbing Google needs before any keyword can work. Green is fine. Amber is worth a look. Red stops Google. Below the checks, the standing list of things a check from here cannot see.</p>
      </div>

      <div className="seo-score" aria-label="Score">
        <span className="is-pass"><b>{a.score.pass}</b> OK</span>
        <span className="is-warn"><b>{a.score.warn}</b> look</span>
        <span className="is-fail"><b>{a.score.fail}</b> fix</span>
        <small>{new Date(a.checkedAt).toLocaleString("en-US", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "America/Denver" })} · Mountain</small>
      </div>

      {fixes.length > 0 && (
        <div className="kw-card seo-fixes">
          <h2>What to fix first</h2>
          <ol>
            {fixes.map((f) => (
              <li key={`${f.page || "site"}-${f.id}`}>
                <span className={`seo-pill is-${f.grade}`}>{WORD[f.grade]}</span>
                <b>{f.label}</b>{f.page ? <span className="ui-hint"> · {f.page}</span> : null}
                <div className="ui-hint">{f.detail}</div>
                {f.fix && <p>{f.fix}</p>}
              </li>
            ))}
          </ol>
        </div>
      )}

      <h2 className="kw-h2">Whole site</h2>
      <ul className="seo-list">
        {a.site.map((c) => (
          <li key={c.id}><span className={`seo-pill is-${c.grade}`}>{WORD[c.grade]}</span><b>{c.label}</b><span>{c.detail}</span></li>
        ))}
      </ul>

      <h2 className="kw-h2">Page by page</h2>
      <div className="seo-pages">
        {a.pages.map((p) => (
          <div key={p.path} className="kw-card seo-page">
            <h3>{p.path === "/" ? "Home" : p.path}</h3>
            {p.title && <div className="ui-hint seo-title">{p.title}</div>}
            <ul className="seo-list">
              {p.checks.map((c) => (
                <li key={c.id}><span className={`seo-pill is-${c.grade}`}>{WORD[c.grade]}</span><b>{c.label}</b><span>{c.detail}</span></li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <h2 className="kw-h2">The standing list</h2>
      <ol className="seo-standing">
        {SEO_STANDING.map((s) => (
          <li key={s.title}>
            <b>{s.title}</b>
            <p><i>Why:</i> {s.why}</p>
            <p><i>How:</i> {s.how}</p>
          </li>
        ))}
      </ol>
    </div>
  );
}
