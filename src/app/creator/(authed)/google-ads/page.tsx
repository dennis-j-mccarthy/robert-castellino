import { redirect } from "next/navigation";

// Google Ads now lives inside Search.
export default function GoogleAdsPage() {
  redirect("/creator/search?open=google-ads-credit");
}
