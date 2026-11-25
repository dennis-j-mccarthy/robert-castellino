import { studio } from "@/studio.config";
import { Accordion } from "@/components/creator/TwoAccordion";
import KeywordsSection from "../keywords/KeywordsSection";
import LandingSection from "./LandingSection";
import TechnicalSeo from "./TechnicalSeo";
import GoogleAdsPlanSection from "./GoogleAdsPlanSection";
import { panels } from "@/studio.panels";

export const dynamic = "force-dynamic";

/*
  Search: everything about being found on Google, as four accordions that
  open one at a time.
    1 Keywords        the phrases to own
    2 Landing pages   one page per phrase, a plate on top, the book to order
    3 Technical SEO   live checks against the site + the standing list
    3 Competitors     who wins those searches today, and why
    4 Google Ads      the plan (id paid-search: an id of "google-ads" is hidden by content blockers)
    5+ site panels    (Castellino: Competitors, the credit and access)
  ?open=<id> opens a panel directly (the old /creator/keywords etc. redirect here).
*/

const EXTRA = panels.search ?? [];
const IDS = ["keywords", "landing", "technical-seo", "paid-search", ...EXTRA.map((p) => p.id)];

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ open?: string; keyword?: string }> }) {
  const sp = await searchParams;
  const initial = IDS.find((i) => i === sp.open) ?? null; // all closed on arrival; ?open= (from the old routes) opens one
  return (
    <section className="admin-page cr-page">
      <div className="sr-head">
        <div className="sr-head__text">
          <div className="tl-eyebrow">Search</div>
          <h1>Being found on Google</h1>
          <p>The words people type, the plumbing Google needs, who wins today, and the paid lane. Open one at a time, top to bottom.</p>
        </div>
        <div className="sr-head__bar" aria-hidden="true">
          <span className="sr-head__g">G</span>
          <span className="sr-head__q">{(studio.seedKeywords[0]?.phrase ?? studio.offer.title).toLowerCase()}<span className="sr-head__caret" /></span>
          <span className="sr-head__btn">Search</span>
        </div>
      </div>
      <Accordion
        initial={initial}
        panels={[
          { id: "keywords", n: 1, title: "Keywords", sub: "the phrases to own · gifts first", body: <KeywordsSection /> },
          { id: "landing", n: 2, title: "Landing pages", sub: `one page per phrase · your picture on top · ${studio.offer.ctaLabel.toLowerCase()}`, body: <LandingSection preselect={sp.keyword} /> },
          { id: "technical-seo", n: 3, title: "Technical SEO", sub: "live checks against the site · what to fix first", body: <TechnicalSeo /> },
          { id: "paid-search", n: 4, title: "Google Ads", sub: "ad groups · the ads · landing pages · the upload sheet", body: <GoogleAdsPlanSection /> },
          ...EXTRA.map((p, i) => ({ id: p.id, n: 5 + i, title: p.title, sub: p.sub, body: p.body })),
        ]}
      />
    </section>
  );
}
