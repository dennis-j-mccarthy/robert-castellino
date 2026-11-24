// The dated note at the top of Ads: where things stand, what changed on the
// last decision day, and what we are watching. Static copy,
// edited by hand when the next decision lands. Plain language for Bob.

const UPDATED = "Tuesday, November 24, 2026";

const WHAT_HAPPENED = [
  { k: "Spent", v: "$649 since November 6, about $35 a day. Nothing before that date." },
  { k: "Sold", v: "5 signed books in Stripe since the ads began (checked November 24). Meta claims 6 for the sales campaign; Meta counts a sale if the buyer clicked an ad in the last 7 days or saw one in the last day, so it sometimes claims a sale that would have happened anyway. Stripe is the final word." },
  { k: "Cost per sale", v: "About $60 on the sales campaign alone ($298 for 5), or $130 counting everything spent since November 6. Against a $49.95 book the first order loses money. It pays if buyers come back for prints, or as Meta learns and the cost drops, which usually happens after the first ten or so sales." },
  { k: "What sold", v: "By Meta's attribution: the warm audience (people who already follow Bob) 4 sales on $220, Colorado homes 45 and over 2 on $47, the best ratio on the account. Retargeting book-page visitors 0 on $140 across both campaigns." },
  { k: "What did not", v: "The original traffic campaign: $351, 6,388 clicks, no purchase. It was buying photo taps, as we found on the 12th." },
];

const WHAT_CHANGED = [
  "The original traffic campaign is paused. Its $10 a day moves to the sales campaign.",
  "The retargeting set inside the sales campaign is paused. Book-page visitors have not bought in three weeks of trying.",
  "The sales campaign goes from $25 to $35 a day, with at least $10 a day guaranteed to the Colorado homes set. All of the money is now on the two audiences that have sold books.",
  "Nothing else changed: same three plates with the cover inset, same Pixel and Conversions API, Instagram still not linked.",
];

const WATCH = [
  { k: "The number", v: "Purchases and cost per purchase on the sales campaign, in Meta and in Stripe." },
  { k: "Expected spend", v: "About $245 for Nov 25 to Dec 1, the same $35 a day as before, now in one campaign." },
  { k: "Next read", v: "Tuesday, December 1. By then the Colorado set will have had a full week at a real budget." },
  { k: "If cost per sale falls under $40", v: "Raise the budget for the Christmas window; ordering deadlines start to bite around December 12." },
  { k: "If it stays near $60", v: "Keep spending only what the print follow-ons justify, and test a 2-for-1 or a print-plus-book offer." },
];

export default function PhaseUpdate() {
  return (
    <section className="cr-next cr-upd" aria-labelledby="cr-upd-title">
      <header className="cr-next__head">
        <div>
          <div className="cr-next__kicker">Update</div>
          <h2 id="cr-upd-title">Where the ads stand, and what changed today</h2>
          <p className="cr-next__goal">Updated {UPDATED}.</p>
        </div>
      </header>

      <div className="cr-upd__cols">
        <div>
          <h3 className="cr-upd__h">Nov 6 to Nov 24</h3>
          <dl className="cr-upd__dl">
            {WHAT_HAPPENED.map((r) => (
              <div key={r.k}><dt>{r.k}</dt><dd>{r.v}</dd></div>
            ))}
          </dl>
        </div>
        <div>
          <h3 className="cr-upd__h">What changed on Nov 24</h3>
          <ol className="cr-upd__ol">
            {WHAT_CHANGED.map((t) => <li key={t}>{t}</li>)}
          </ol>
        </div>
        <div>
          <h3 className="cr-upd__h">What we are watching</h3>
          <dl className="cr-upd__dl">
            {WATCH.map((r) => (
              <div key={r.k}><dt>{r.k}</dt><dd>{r.v}</dd></div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
