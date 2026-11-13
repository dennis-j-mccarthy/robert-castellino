// "Phase 2 update" — the dated note at the top of Paid social: what Phase 1
// showed, what changed on Nov 12, and what we are watching. Static copy,
// edited by hand when the next decision lands. Plain language for Bob.

const UPDATED = "Thursday, November 12, 2026";

const WHAT_HAPPENED = [
  { k: "Spent", v: "$216.50 over six and a half days, about $33 a day." },
  { k: "Reached", v: "13,975 people. 2,910 clicked through to the book page at 7 cents each." },
  { k: "On the page", v: "2,347 visits to the book page. One person started checkout. One purchase." },
  { k: "What won", v: "Concept 24 (the red aspens, gift copy), then Concept 02 (Mesa Verde), 14 (Maroon Bells) and 18 (the same aspens, love-letter copy). Twenty of the 41 ads barely ran." },
  { k: "Where it went", v: "Three quarters Facebook feed, a quarter Instagram Reels. Sixty percent of the money reached people 65 and over." },
];

const WHAT_CHANGED = [
  "A new campaign, Book · Sales, at $25 a day. Meta is now asked to find people who buy, not people who click. Same three audiences: people who already follow Bob, Colorado homes 45 and over, and everyone who visited the book page in the last 14 days.",
  "The ads in it are the three winning plates with the real book cover set into the corner and the book facts beside it, so the picture reads as a book for sale, not just a photograph.",
  "The original campaign was cut from $30 to $10 a day and trimmed to the four winning concepts. It keeps the retargeting pool filled and nothing else.",
  "The book page and checkout were tested on an iPhone and an Android phone. Both go straight to Stripe. Nothing on the page was changed.",
];

const WATCH = [
  { k: "The number", v: "Purchases, in Meta's Events Manager and in Stripe. Clicks no longer matter." },
  { k: "First read", v: "After the sales campaign has spent about $100, around Sunday, November 15." },
  { k: "Expect", v: "Far fewer clicks and a much higher cost per click than last week. That is the point." },
  { k: "If no sales by then", v: "Traffic quality is ruled out too, and the conversation turns to the offer itself." },
];

export default function PhaseUpdate() {
  return (
    <section className="cr-next cr-upd" aria-labelledby="cr-upd-title">
      <header className="cr-next__head">
        <div>
          <div className="cr-next__kicker">Phase 2 update</div>
          <h2 id="cr-upd-title">Phase 1 results, and what changed for Phase 2</h2>
          <p className="cr-next__goal">Updated {UPDATED}.</p>
        </div>
      </header>

      <div className="cr-upd__cols">
        <div>
          <h3 className="cr-upd__h">What Phase 1 showed · Nov 6–12</h3>
          <dl className="cr-upd__dl">
            {WHAT_HAPPENED.map((r) => (
              <div key={r.k}><dt>{r.k}</dt><dd>{r.v}</dd></div>
            ))}
          </dl>
        </div>
        <div>
          <h3 className="cr-upd__h">What changed on Nov 12</h3>
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
