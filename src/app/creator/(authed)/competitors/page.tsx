import { COMPETE_TODO, WHY, latestRankRun, winners, type RankResult } from "@/lib/creator/competitors";

export const dynamic = "force-dynamic";

// Searches for Bob's own name or the book's title tell us where he already
// shows up; they are not competition, so the leaderboard leaves them out.
const isOwnSearch = (r: RankResult) => /castellino|life & light/i.test(r.query);
const isBobsSite = (d: string) => d.includes("robertcastellino");

const posClass = (p: number) => (p <= 3 ? "is-top" : p <= 6 ? "is-mid" : "is-low");

// Strategy → Competitors: who wins the gift, book and photography searches
// on Google, and why. Built from the rank checks in src/data/rank-checks.
export default async function CompetitorsPage() {
  const run = await latestRankRun();
  const competitive = run ? { ...run, results: run.results.filter((r) => !isOwnSearch(r)) } : null;
  const top = competitive ? winners(competitive, isBobsSite, 10) : [];
  const total = competitive?.results.length ?? 0;
  const yours = run ? run.results.filter((r) => r.robertCastellino) : [];

  return (
    <section className="admin-page cr-page">
      <div className="tl-eyebrow">Strategy</div>
      <h1>Competitors</h1>
      <div className="kw-explain">
        <div className="tl-eyebrow">What this does</div>
        <p>
          When someone searches Google for a Colorado gift, a coffee table book or a landscape photographer, these are the
          sites they find. Each card shows how many of those searches the site wins, where it places, and why Google puts it
          there. The last line on each card is what it means for you. The list at the bottom is what to do about it.
        </p>
      </div>

      {!run ? (
        <p className="ads-notice ads-notice--warn">No search check has been run yet.</p>
      ) : (
        <>
          <p className="ads-hint cm-meta">
            Checked {run.date}: {total} gift, book and photography searches. {run.note}
          </p>

          <h2 className="kw-h2">Who is winning</h2>
          <ol className="cm-board">
            {top.map((w, i) => {
              const note = w.note ?? WHY[w.domain];
              return (
                <li key={w.domain} className="cm-card">
                  <div className="cm-head">
                    <span className="cm-rank">{i + 1}</span>
                    <div className="cm-id">
                      <b>{note?.name ?? w.domain}</b>
                      <a href={`https://${w.domain}`} target="_blank" rel="noreferrer" className="ads-hint">
                        {w.domain} ↗
                      </a>
                    </div>
                    {note && <span className={`cm-type cm-type--${note.type.replace(/\s+/g, "-").toLowerCase()}`}>{note.type}</span>}
                  </div>
                  <div className="cm-score">
                    <span className="cm-count">
                      {w.count} <small>of {total} searches</small>
                    </span>
                    <span className="cm-bar" aria-hidden="true">
                      <span style={{ width: `${Math.round((w.count / Math.max(1, total)) * 100)}%` }} />
                    </span>
                  </div>
                  <ul className="cm-hits">
                    {w.hits.map((h) => (
                      <li key={h.query} className={posClass(h.position)} title={`Position ${h.position}`}>
                        <b>#{h.position}</b> {h.query}
                      </li>
                    ))}
                  </ul>
                  {note && (
                    <>
                      <div className="cm-why">
                        <div className="tl-eyebrow tl-eyebrow--muted">Why they place</div>
                        <ul>
                          {note.why.map((x) => (
                            <li key={x}>{x}</li>
                          ))}
                        </ul>
                      </div>
                      <p className="cm-lesson">
                        <b>For you:</b> {note.lesson}
                      </p>
                    </>
                  )}
                </li>
              );
            })}
          </ol>

          {yours.length > 0 && (
            <div className="kw-card cm-yours">
              <h2>Where you show up</h2>
              <ul>
                {yours.map((r) => (
                  <li key={r.query}>
                    <span className="cm-pill is-top">#{r.robertCastellino}</span> {r.query}
                    {r.organic[0] && !isBobsSite(r.organic[0].domain) && (
                      <span className="ads-hint"> · #1 is {r.organic[0].domain}</span>
                    )}
                    {r.organic[0] && r.organic[0].domain !== "robertcastellino.com" && isBobsSite(r.organic[0].domain) && (
                      <span className="ads-hint"> · #1 is your print store ({r.organic[0].domain}), not robertcastellino.com</span>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="kw-card">
            <h2>What to do</h2>
            <ol className="cm-todo">
              {COMPETE_TODO.map((t) => (
                <li key={t}>{t}</li>
              ))}
            </ol>
          </div>

          <details className="kw-card cm-detail">
            <summary>
              <h2>Search by search</h2>
              <span className="ads-hint">The top results Google showed for each search</span>
            </summary>
            <div className="cm-searches">
              {run.results.map((r) => (
                <div key={r.query} className="cm-search">
                  <b>“{r.query}”</b>
                  <ol>
                    {r.organic.slice(0, 8).map((o) => (
                      <li key={`${o.position}-${o.domain}`} className={isBobsSite(o.domain) ? "is-you" : undefined}>
                        <span className={`cm-pill ${posClass(o.position)}`}>{o.position}</span> <b>{o.domain}</b>{" "}
                        <span className="ads-hint">{o.title}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              ))}
            </div>
          </details>
        </>
      )}
    </section>
  );
}
