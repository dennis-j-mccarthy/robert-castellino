import type { StudioPanels } from "@/lib/creator/studio-types";
import CompetitorsSection from "@/app/creator/(authed)/competitors/CompetitorsSection";
import GoogleAdsSection from "@/app/creator/(authed)/google-ads/GoogleAdsSection";

/*
  Robert Castellino — site-written panels the shared tools append to their
  accordions. SERVER ONLY (these are server components); the data config
  lives in studio.config.ts so client code can import it.
*/
export const panels: StudioPanels = {
  search: [
    { id: "competitors", title: "Competitors", sub: "who wins those searches today, and why", body: <CompetitorsSection /> },
    { id: "google-ads-credit", title: "Google Ads · the credit and access", sub: "the $500 offer · Bob's accounts · Dennis's manager", body: <GoogleAdsSection /> },
  ],
};
