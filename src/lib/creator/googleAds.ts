/*
  The Google Search campaign plan for the book, shown at /creator/google-ads.
  Built 2026-11-23 from the phrases on /creator/keywords. Plain data: nothing
  here talks to Google. Ad text is held to Google's limits (headline 30,
  description 90) by the checks at the bottom of the page.
*/

export const HEADLINE_MAX = 30;
export const DESCRIPTION_MAX = 90;

/** Google Ads account Bob linked to his site's Analytics on 2021-12-22. */
export const OLD_ACCOUNT = "637-583-2817";

export type AdGroup = { name: string; landsOn: string; why: string; keywords: string[] };

export const AD_GROUPS: AdGroup[] = [
  {
    name: "1. Colorado gifts",
    landsOn: "robertcastellino.com/book",
    why: "The gift searches. These people are ready to buy and have not picked anything yet.",
    keywords: [
      "Colorado gifts",
      "Colorado Christmas gifts",
      "gifts for someone who loves Colorado",
      "housewarming gift Colorado",
      "gift for someone moving away from Colorado",
      "what to give someone who loves the mountains",
    ],
  },
  {
    name: "2. Coffee table book",
    landsOn: "robertcastellino.com/book",
    why: "People looking for exactly what the book is.",
    keywords: [
      "Colorado coffee table book",
      "Rocky Mountains coffee table book",
      "best Colorado coffee table books",
      "Colorado landscape photography book",
      "Colorado photo book",
      "Rocky Mountain photography book",
      "best photography books of Colorado",
      "mountain coffee table book",
      "signed photography book gift",
    ],
  },
  {
    name: "3. His name",
    landsOn: "robertcastellino.com",
    why: "Cheap clicks. Makes sure someone who heard of him finds him first.",
    keywords: ["Robert Castellino photography", "Robert Castellino"],
  },
];

export const LEFT_OUT: Array<[string, string]> = [
  ["mountain gifts", "too broad: mugs, t-shirts, ski gear"],
  ["gifts for hikers", "too broad: boots, packs, gadgets"],
  ["Colorado landscape photographer", "no prints for sale on the site yet, so nothing to buy"],
  ["Boulder landscape photographer", "same: no prints for sale yet"],
  ["Colorado landscape photography prints", "same: no prints for sale yet"],
];

export const NEGATIVES = [
  "free", "jobs", "job", "hiring", "course", "class", "classes", "workshop", "tutorial", "how to",
  "wallpaper", "stock", "pdf", "used", "wedding", "portrait", "family photos", "senior pictures",
  "headshots", "amazon", "ebay", "etsy",
];

export const HEADLINES = [
  "Signed Colorado Photo Book",
  "A Gift for Colorado Lovers",
  "Colorado Coffee Table Book",
  "Signed & Numbered, $49.95",
  "84 Plates of Colorado Light",
  "Ships From the Boulder Studio",
  "11x11 Cloth-Bound Hardcover",
  "By Robert Castellino",
  "Give the Gift of Colorado",
  "Colorado: Life & Light",
  "Fifty Years of Colorado",
  "Rocky Mountain Photo Book",
];

export const DESCRIPTIONS = [
  "Fifty years of Colorado in one 116-page volume. Signed and numbered by the photographer.",
  "84 plates, 11x11 cloth-bound hardcover on archival paper. Ships from his Boulder studio.",
  "The gift for anyone who loves the Colorado mountains. Signed copy now $49.95.",
  "Every photograph is a real place in this state. Signed by Robert Castellino himself.",
];

export const NAME_GROUP_HEADLINE = "Robert Castellino Photography";

export const SETTINGS: Array<[string, string]> = [
  ["Type", "Search only. Turn off Display Network and Search Partners."],
  ["Where", "United States, people in or regularly in these places (not \"interested in\"). Colorado bid +30%."],
  ["Budget", "$15 a day, November 25 to December 15 (about $315, the gift window), then $8 a day. That reaches $500 around mid-January, inside the 60 days."],
  ["Bidding", "Maximize clicks with a $1.50 top bid to start. Switch to Maximize conversions after about 15 book sales."],
  ["Keywords", "Phrase match and exact match only. No broad match."],
  ["Ad schedule", "All day."],
];

export const STEPS = [
  `Bob (or you, signed in as him) opens ads.google.com as rlcastellino@gmail.com and checks Billing → Transactions on account ${OLD_ACCOUNT} for past spending.`,
  "Bob says yes to the budget: up to $500 over about 7 weeks, credit not guaranteed.",
  "Bob clicks \"Claim your credit\" in the October 9 Google Business Profile email and adds his card.",
  "Build the campaign from this page, and add Google's purchase tag to robertcastellino.com/checkout/success.",
];
