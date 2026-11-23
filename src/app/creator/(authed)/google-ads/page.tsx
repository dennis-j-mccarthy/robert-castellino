import {
  AD_GROUPS,
  DESCRIPTION_MAX,
  DESCRIPTIONS,
  HEADLINE_MAX,
  HEADLINES,
  LEFT_OUT,
  NAME_GROUP_HEADLINE,
  NEGATIVES,
  OLD_ACCOUNT,
  SETTINGS,
  STEPS,
} from "@/lib/creator/googleAds";

// Channels → Google Ads: the Search campaign for the book, ready to build,
// and the $500 new-advertiser credit with its risk. Read-only plan; nothing
// here connects to Google yet.
export default function GoogleAdsPage() {
  const keywordCount = AD_GROUPS.reduce((n, g) => n + g.keywords.length, 0);
  return (
    <section className="admin-page cr-page gads">
      <div className="tl-eyebrow">Channels</div>
      <h1>Google Ads</h1>
      <div className="kw-explain">
        <div className="tl-eyebrow">What this does</div>
        <p>
          The plan for Google Search ads on the book: when someone types a Colorado gift or coffee table book search,
          Bob&rsquo;s book shows at the top. {keywordCount} phrases from Keywords, in {AD_GROUPS.length} groups, with the
          ad text written and checked against Google&rsquo;s length limits. The campaign is not built yet; the steps at the
          bottom are what has to happen first.
        </p>
      </div>

      <div className="gads-sec">
        <h2 className="kw-h2">The $500 credit</h2>
        <div className="gads-box gads-box--ok">
          Google already offered it to Bob. His Google Business Profile email of October 9, 2026 says: get $500 in ad
          credit when you spend $500, offer for new advertisers only, with a &ldquo;Claim your credit&rdquo; button.
        </div>
        <div className="gads-box gads-box--warn">
          <p>
            <b>The risk:</b> Bob is probably not a new advertiser. On December 22, 2021 he linked a Google Ads account,{" "}
            <b>{OLD_ACCOUNT}</b>, to his website&rsquo;s Google Analytics, using rlcastellino@gmail.com. Google checks
            whether you are new <i>after</i> you spend the $500, not before. If that 2021 account ever ran ads, he most
            likely spends $500 and gets no credit.
          </p>
          <p>
            <b>How to find out before spending anything:</b> sign in at{" "}
            <a href="https://ads.google.com" target="_blank" rel="noreferrer">ads.google.com</a> as rlcastellino@gmail.com
            and open Billing → Transactions on account {OLD_ACCOUNT}. If it shows $0 ever spent, there is a fair chance.
            If it shows charges, assume no credit.
          </p>
          <p>
            <b>Either way:</b> start from the &ldquo;Claim your credit&rdquo; button in that October 9 email, so the
            offer is attached to the account. Only spend money Bob is happy to spend even if the credit never comes.
          </p>
        </div>
        <p className="ads-hint">
          Google&rsquo;s terms: only spend after the offer is applied counts, it has to be spent within the offer window
          (usually 60 days), and the credit can take up to 35 days to show up.
        </p>
      </div>

      <div className="gads-sec">
        <h2 className="kw-h2">Campaign settings</h2>
        <dl className="gads-settings">
          {SETTINGS.map(([k, v]) => (
            <div key={k}>
              <dt>{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="gads-sec">
        <h2 className="kw-h2">Ad groups and keywords</h2>
        <div className="gads-groups">
          {AD_GROUPS.map((g) => (
            <div key={g.name} className="gads-card">
              <h3>{g.name}</h3>
              <div className="ads-hint">Lands on {g.landsOn}</div>
              <p className="gads-why">{g.why}</p>
              <ul className="gads-kw">
                {g.keywords.map((k) => (
                  <li key={k}>{k}</li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <h3 className="gads-h3">Left out on purpose</h3>
        <ul className="gads-list">
          {LEFT_OUT.map(([k, why]) => (
            <li key={k}>
              {k} <span className="ads-hint">({why})</span>
            </li>
          ))}
        </ul>
        <h3 className="gads-h3">Negative keywords (whole campaign)</h3>
        <p className="ads-hint">{NEGATIVES.join(", ")}</p>
      </div>

      <div className="gads-sec">
        <h2 className="kw-h2">The ad</h2>
        <p className="ads-hint">
          One responsive search ad per group. Every line is a fact from the book page. The numbers show length against
          Google&rsquo;s limit. For the His name group, change headline 1 to &ldquo;{NAME_GROUP_HEADLINE}&rdquo;.
        </p>
        <div className="gads-two">
          <div>
            <h3 className="gads-h3">Headlines</h3>
            <ol className="gads-list">
              {HEADLINES.map((h) => (
                <li key={h}>
                  {h} <span className={h.length > HEADLINE_MAX ? "gads-over" : "ads-hint"}>{h.length}/{HEADLINE_MAX}</span>
                </li>
              ))}
            </ol>
          </div>
          <div>
            <h3 className="gads-h3">Descriptions</h3>
            <ol className="gads-list">
              {DESCRIPTIONS.map((d) => (
                <li key={d}>
                  {d} <span className={d.length > DESCRIPTION_MAX ? "gads-over" : "ads-hint"}>{d.length}/{DESCRIPTION_MAX}</span>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>

      <div className="gads-sec">
        <h2 className="kw-h2">Before the first dollar: tracking</h2>
        <div className="gads-box">
          The site has no Google tag today, so Google cannot see a book sale. Once the account exists, Google&rsquo;s
          purchase tag goes on the order-confirmation page (robertcastellino.com/checkout/success) and a test order goes
          through. That needs the account&rsquo;s conversion ID (it starts with AW-), which appears when you create a
          &ldquo;Purchase&rdquo; conversion in Google Ads.
        </div>
      </div>

      <div className="gads-sec">
        <h2 className="kw-h2">What has to happen next</h2>
        <ol className="gads-list gads-steps">
          {STEPS.map((s) => (
            <li key={s}>{s}</li>
          ))}
        </ol>
      </div>
    </section>
  );
}
