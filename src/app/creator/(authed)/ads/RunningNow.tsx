import { getRunningNow } from "@/lib/creator/running-now";

// "Running now" — the live ads, big, at the top of Paid social. Server
// component, read-only. One card per creative; the chips under each picture
// say which campaign and audiences it is running in.

const usd = (n: number) => `$${n.toFixed(n >= 100 ? 0 : 2)}`;

export default async function RunningNow() {
  const data = await getRunningNow();
  if (!data.configured) return null;

  return (
    <section className="cr-run" aria-labelledby="cr-run-title">
      <header className="cr-run__head">
        <div>
          <div className="cr-next__kicker">Running now</div>
          <h2 id="cr-run-title">
            {data.adCount} {data.adCount === 1 ? "ad" : "ads"} live in Meta
            {data.creatives.length ? <span className="cr-h2sub"> · {data.creatives.length} creative{data.creatives.length === 1 ? "" : "s"}</span> : null}
          </h2>
        </div>
        <div className="cr-run__camps">
          {data.campaigns.map((c) => (
            <div key={c.id} className={`cr-run__camp ${c.status === "ACTIVE" ? "is-on" : "is-off"}`}>
              <span className="cr-run__camp-label">{c.label}</span>
              <span className="cr-run__camp-name">{c.name}</span>
              <span className="cr-run__camp-nums">
                {c.dailyBudget != null ? `${usd(c.dailyBudget)}/day` : "no budget"} · {usd(c.spend7d)} last 7d · {c.linkClicks7d.toLocaleString()} clicks
                {c.purchases7d ? ` · ${c.purchases7d} purchase${c.purchases7d === 1 ? "" : "s"}` : ""}
                {c.status !== "ACTIVE" ? ` · ${c.status.toLowerCase().replace(/_/g, " ")}` : ""}
              </span>
            </div>
          ))}
        </div>
      </header>

      {data.error ? <p className="cr-run__err">Meta: {data.error}</p> : null}

      {data.creatives.length === 0 ? (
        <p className="cr-run__empty">Nothing is running. Switch an ad on below and it shows up here.</p>
      ) : (
        <div className="cr-run__grid">
          {data.creatives.map((g) => (
            <article key={g.key} className="cr-run__card">
              <div className="cr-run__img">
                {g.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={g.imageUrl} alt={g.headline} loading="lazy" />
                ) : (
                  <div className="cr-run__noimg">No image</div>
                )}
                <div className="cr-run__state">
                  {g.running ? <span className="cr-run__dot is-on" /> : <span className="cr-run__dot is-review" />}
                  {g.running ? `Live in ${g.running} ${g.running === 1 ? "audience" : "audiences"}` : "In review"}
                  {g.running && g.review ? ` · ${g.review} in review` : ""}
                </div>
              </div>
              <div className="cr-run__body">
                <h3>{g.headline}</h3>
                {g.message ? <p className="cr-run__msg">{g.message}</p> : null}
                <div className="cr-run__chips">
                  {g.placements.map((p) => (
                    <a key={p.adId} href={p.adsManagerUrl} target="_blank" rel="noopener noreferrer" className={`cr-run__chip ${p.effectiveStatus === "ACTIVE" ? "is-on" : "is-review"}`} title={`${p.campaignLabel} · ${p.adsetName} · ${p.effectiveStatus.toLowerCase().replace(/_/g, " ")} · open in Ads Manager`}>
                      <b>{p.campaignLabel}</b> {p.adsetName}
                    </a>
                  ))}
                </div>
                <dl className="cr-run__stats">
                  <div><dt>Spent 7d</dt><dd>{usd(g.spend)}</dd></div>
                  <div><dt>Shown</dt><dd>{g.impressions.toLocaleString()}</dd></div>
                  <div><dt>Link clicks</dt><dd>{g.linkClicks.toLocaleString()}</dd></div>
                  <div><dt>Per click</dt><dd>{g.linkClicks ? usd(g.spend / g.linkClicks) : "—"}</dd></div>
                  <div><dt>Purchases</dt><dd>{g.purchases || "0"}</dd></div>
                </dl>
              </div>
            </article>
          ))}
        </div>
      )}
      {data.fetchedAt ? <p className="cr-run__foot">From Meta at {new Date(data.fetchedAt).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "America/Denver" })} MT · refreshes every few minutes</p> : null}
    </section>
  );
}
