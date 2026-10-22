import { adAccountId, isAdsConfigured } from "@/lib/meta/ads";
import { DEFAULT_LINK, PAGE_ID } from "@/lib/ads-drafts";
import adImages from "@/data/ad-images.json";
import AdsClient, { type LibraryImage } from "./AdsClient";

export const dynamic = "force-dynamic";

// Image list is a committed manifest (src/data/ad-images.json) rather than a
// runtime scan of public/: scanning pulled every photo into the serverless
// bundle (325 MB) and public/ isn't on the function's filesystem anyway.
// Regenerate it when photos are added (see docs/ADS_SETUP.md).
function libraryImages(): LibraryImage[] {
  return adImages as LibraryImage[];
}

// The Ads maker: compose creative here, create it as a PAUSED ad in Bob's
// Meta ad account, review Meta's own preview, then activate when ready.
export default function AdminAdsPage() {
  return (
    <section className="admin-page">
      <h1>Ads</h1>
      <p>
        Build a Facebook / Instagram ad from Bob&rsquo;s photographs and send it
        to his ad account <em>paused</em>. Nothing spends until you press
        Activate.
      </p>
      <AdsClient
        configured={isAdsConfigured()}
        account={adAccountId()}
        pageId={PAGE_ID()}
        defaultLink={DEFAULT_LINK}
        library={libraryImages()}
      />
    </section>
  );
}
