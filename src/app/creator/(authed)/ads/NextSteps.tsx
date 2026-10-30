// "Next steps" — the plain-language plan that sits at the top of Paid social.
// Goal: a lot of visibility for the signed book, fast, through the holidays.
// Written for Dennis and Bob to read in a minute. Dates, budgets and the
// decision rules are deliberately simple; numbers are ranges, not promises.
// Nothing here spends money — it is the plan the Ads maker executes.

type Phase = {
  n: number;
  dates: string;
  name: string;
  oneLine: string;
  ads: string;
  posts: string;
  budget: string;
  watch: string;
  decide: string;
};

const PHASES: Phase[] = [
  {
    n: 1,
    dates: "Sun Nov 1 – Sat Nov 7",
    name: "Switch on",
    oneLine: "Turn on a small set of the finished ads and let the numbers start talking.",
    ads: "Activate 8 of the 20 paused ads: 4 plates × 2 audiences (Warm · people who already know Bob, and Colorado home · 45+). Everything else stays paused.",
    posts: "3 organic posts on the Page + Instagram: one plate with its real place and hour, one “the maker” story, one of the book itself (real plates only, no mockups).",
    budget: "$25/day · about $175 for the week",
    watch: "Click-through rate and cost per click, per ad.",
    decide: "Sunday Nov 8: keep every ad at or above the bar, pause the rest.",
  },
  {
    n: 2,
    dates: "Sun Nov 8 – Sat Nov 21",
    name: "Find the winners",
    oneLine: "Widen the audience, bring in the new concepts, and let the best ads prove it.",
    ads: "Add the Lookalike and Photo-book audiences. Stage 6 new ads from the concepts below (2 from each set: Core 25, The Photographer, Coffee Table). Keep the Phase 1 winners running.",
    posts: "4 posts a week. Same mix, plus one “why this plate is in the book” post. Posts and ads should use different plates in the same week so the feed never repeats the ad.",
    budget: "$40/day · about $560 over two weeks",
    watch: "Cost per click, and cost per site visit by audience.",
    decide: "Sunday Nov 22: pick the top 4 ads overall. Those carry the holiday push.",
  },
  {
    n: 3,
    dates: "Sun Nov 22 – Tue Dec 15",
    name: "Holiday push",
    oneLine: "Spend where it works, add the gift message, and give people a reason to order now.",
    ads: "Top 4 ads on all four audiences, plus a retargeting set for recent site visitors. Add “Order by Dec 15 for Christmas delivery · signed” to copy once Bob confirms the date.",
    posts: "5 posts a week through Thanksgiving, Black Friday and Cyber Monday. Gift angle twice a week; the rest stays about the light.",
    budget: "$60/day · about $1,400 over 24 days",
    watch: "Orders in Stripe against ad spend, weekly. Cost per order is the only number that matters here.",
    decide: "Every Sunday: move budget to the best ad set. Pause anything that has not produced a sale in 7 days.",
  },
  {
    n: 4,
    dates: "Wed Dec 16 – Thu Dec 24",
    name: "Last call",
    oneLine: "Taper, switch to a gift-note message, and stop before Christmas.",
    ads: "Only the retargeting set and the single best cold ad. Copy becomes “Arrives after Christmas, with a signed gift note today.”",
    posts: "3 posts: thank-you, the year in light, one last plate.",
    budget: "$30/day · about $270",
    watch: "Orders only.",
    decide: "Dec 25: pause everything. Review the whole run the week after.",
  },
];

const BARS = [
  { k: "Click-through rate", v: "1.5% or better", why: "People stop for the plate." },
  { k: "Cost per click", v: "$1.25 or less", why: "The audience is right." },
  { k: "Cost per order", v: "$25 or less", why: "At $49.95 a book, the ad pays for itself." },
];

export default function NextSteps() {
  return (
    <section className="cr-next" aria-labelledby="cr-next-title">
      <header className="cr-next__head">
        <div>
          <div className="cr-next__kicker">Next steps</div>
          <h2 id="cr-next-title">Book visibility · Nov 1 – Dec 24, 2026</h2>
          <p className="cr-next__goal">
            One goal: put <em>Life &amp; Light on the Land</em> in front of as many of the right people as possible before
            Christmas, and sell signed copies while we do it. Four phases, one decision each Sunday, budget that only grows
            when the numbers earn it.
          </p>
        </div>
        <div className="cr-next__total">
          <div className="cr-next__total-n">$2,400</div>
          <div className="cr-next__total-l">total over 8 weeks<br />range $2,000 – $2,800</div>
        </div>
      </header>

      <ol className="cr-phases">
        {PHASES.map((p) => (
          <li key={p.n} className="cr-phase">
            <div className="cr-phase__top">
              <span className="cr-phase__n">{p.n}</span>
              <div>
                <div className="cr-phase__dates">{p.dates}</div>
                <h3>{p.name}</h3>
              </div>
              <div className="cr-phase__budget">{p.budget}</div>
            </div>
            <p className="cr-phase__line">{p.oneLine}</p>
            <dl className="cr-phase__grid">
              <div><dt>Ads</dt><dd>{p.ads}</dd></div>
              <div><dt>Posts</dt><dd>{p.posts}</dd></div>
              <div><dt>We watch</dt><dd>{p.watch}</dd></div>
              <div><dt>Then we decide</dt><dd>{p.decide}</dd></div>
            </dl>
          </li>
        ))}
      </ol>

      <div className="cr-next__cols">
        <div className="cr-next__box">
          <h3>The bar an ad has to clear</h3>
          <table className="cr-bars">
            <tbody>
              {BARS.map((b) => (
                <tr key={b.k}><th>{b.k}</th><td>{b.v}</td><td className="cr-muted">{b.why}</td></tr>
              ))}
            </tbody>
          </table>
          <p className="cr-muted">Below the bar for a full week means paused, not tweaked. New plates and new words beat fiddling with old ones.</p>
        </div>

        <div className="cr-next__box">
          <h3>What to expect</h3>
          <ul className="cr-next__list">
            <li><b>Reach:</b> roughly 40,000 – 80,000 people in Colorado and photo-book audiences, 150,000+ impressions.</li>
            <li><b>Site visits:</b> about 2,000 – 4,000 to the book page.</li>
            <li><b>Orders:</b> 60 – 150 signed copies if the ads land. Below 40 by Nov 22 and we rethink the offer, not the budget.</li>
            <li><b>Not expected:</b> a profit in week one. Weeks one and two buy information; weeks three and four spend it.</li>
          </ul>
        </div>

        <div className="cr-next__box">
          <h3>Weekly rhythm</h3>
          <ul className="cr-next__list">
            <li><b>Sunday · Bob:</b> picks next week&rsquo;s plates and reads the one-paragraph report.</li>
            <li><b>Monday · Dennis:</b> checks the three numbers, pauses what is under the bar, moves budget, schedules the week&rsquo;s posts in the Post maker.</li>
            <li><b>Wed &amp; Fri:</b> posts go out on their own.</li>
            <li><b>Bob, every day:</b> sign and ship. That is the whole job.</li>
          </ul>
        </div>
      </div>

      <div className="cr-next__start">
        <h3>To start, this week</h3>
        <ol>
          <li><b>Bob says yes</b> to the budget ($25/day to begin, $2,400 over the run) and confirms the Christmas order-by date.</li>
          <li><b>Dennis switches on Phase 1</b>: 8 ads, 2 audiences, $25/day. Nothing goes live before step 1.</li>
          <li><b>Three posts get scheduled</b> for Nov 2, 4 and 6 from the Post maker, using plates the ads are not using.</li>
        </ol>
      </div>
    </section>
  );
}
