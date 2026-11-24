import { Accordion } from "@/components/creator/TwoAccordion";
import CompetitorsSection from "../competitors/CompetitorsSection";
import GoogleAdsSection from "../google-ads/GoogleAdsSection";
import KeywordsSection from "../keywords/KeywordsSection";
import TechnicalSeo from "./TechnicalSeo";

export const dynamic = "force-dynamic";

/*
  Search: everything about being found on Google, as four accordions that
  open one at a time.
    1 Keywords        the phrases to own
    2 Technical SEO   live checks against the site + the standing list
    3 Competitors     who wins those searches today, and why
    4 Google Ads      the paid side: the plan, the credit, what to do next
  ?open=<id> opens a panel directly (the old /creator/keywords etc. redirect here).
*/

const IDS = ["keywords", "technical-seo", "competitors", "google-ads"] as const;

export default async function SearchPage({ searchParams }: { searchParams: Promise<{ open?: string }> }) {
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
          <span className="sr-head__q">colorado coffee table book<span className="sr-head__caret" /></span>
          <span className="sr-head__btn">Search</span>
        </div>
      </div>
      <Accordion
        initial={initial}
        panels={[
          { id: "keywords", n: 1, title: "Keywords", sub: "the phrases to own · gifts first", body: <KeywordsSection /> },
          { id: "technical-seo", n: 2, title: "Technical SEO", sub: "live checks against the site · what to fix first", body: <TechnicalSeo /> },
          { id: "competitors", n: 3, title: "Competitors", sub: "who wins those searches today, and why", body: <CompetitorsSection /> },
          { id: "google-ads", n: 4, title: "Google Ads", sub: "the paid lane · the $500 credit · the plan", body: <GoogleAdsSection /> },
        ]}
      />
    </section>
  );
}
