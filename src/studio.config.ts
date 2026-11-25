import type { StudioConfig } from "@/lib/creator/studio-types";
import { SEED_KEYWORDS } from "@/studio-site/seed-keywords";

/*
  Robert Castellino — the site's studio config. The one file that knows who
  Bob is, what he sells, and where things live on his site. The shared
  studio reads everything from here; change it here and every tool follows.
*/

const url = "https://robertcastellino.com";

export const studio: StudioConfig = {
  site: {
    name: "Robert Castellino Photography",
    short: "Robert Castellino",
    owner: "Bob",
    ownerFull: "Robert Castellino",
    pronouns: ["he", "his"],
    url,
    domain: "robertcastellino.com",
    location: "Lafayette, Colorado",
  },
  offer: {
    title: "Colorado: Life & Light on the Land",
    facts: "84 plates · 116 pages · first printing · $49.95 signed",
    description: `A signed, 116-page coffee table book of 84 large-format Colorado landscape photographs, $49.95, signed by Robert in the studio and shipped from Boulder. A gift for anyone who loves Colorado.`,
    path: "/book",
    ctaLabel: "Order the signed book",
    promoCode: "10OFF",
    secondary: { label: "Shop limited prints", path: "/gallery", note: "Limited, editioned prints of the same plates." },
    buyerNoun: "buyers",
  },
  brand: {
    paragraph:
      `The brand is "Robert Castellino Photography" (robertcastellino.com): Robert "Bob" Castellino, a large-format landscape photographer of fifty years — Colorado first (the Flatirons, the Maroon Bells, Red Mountain Pass, Rocky Mountain National Park), then the wider West. He works from his studio in Boulder County, Colorado, and signs every book and print himself. ` +
      `His book is "Colorado: Life & Light on the Land": 84 plates · 116 pages · first printing · $49.95 signed. Those facts are fixed — never change the plate count, page count, printing or price, and never invent other numbers, dates, awards, quotes or place names. ` +
      `Limited prints are at ${url}/gallery; the signed book is at ${url}/book; the writing lives at ${url}/musings. ` +
      `Speak as Bob, first person, unless told otherwise. No hype, no countdowns, no "sale", no emoji, no exclamation marks. Never call the work "content". Never mention AI, mockups or renderings.`,
    tagline: "Fifty years of Colorado light, one morning at a time",
    logo: "/assets/logo-script.png",
    accent: "#b9871f",
    blog: {
      label: "Musings",
      singular: "Musing",
      path: "/musings",
      writerRole: "You write Robert Castellino's Musings: short first-person essays for his site, in the register of 'Why I Rise Early' and 'The Fifty-Second Light'. Make ONE observation and land it. Plain prose, unhurried, specific to a real place and hour. Never pitch the book or prints inside a Musing; it ends on the observation.",
      categories: [
        { id: "reflections", label: "Reflections" }, { id: "light", label: "Light" }, { id: "land", label: "Land" }, { id: "locations", label: "Locations" }, { id: "wilderness", label: "Wilderness" },
      ],
    },
  },
  meta: {
    pageId: "134235743309639",
    adAccountId: "1788471615529613",
    campaignId: "120251354161250171",
    preferredPageHint: "castellino",
  },
  seo: { auditPages: ["/", "/book", "/musings", "/gallery"] },
  seedKeywords: SEED_KEYWORDS,
  nav: {
    soon: ["leads"],
    more: [
      { label: "Comments & DMs (Meta)", href: "https://business.facebook.com/latest/inbox/all?asset_id=134235743309639", ext: true },
      { label: "Budgets & bidding (Meta)", href: "https://adsmanager.facebook.com/adsmanager/manage/campaigns?act=1788471615529613&selected_campaign_ids=120251354161250171", ext: true },
      { label: "Build audiences (Meta)", href: "https://adsmanager.facebook.com/adsmanager/audiences?act=1788471615529613", ext: true },
      { label: "Admin", href: "/admin" },
    ],
  },
  brandKit: {
    logos: [
      { src: "/assets/logo-script.png", name: "Script logo", note: "The site's wordmark · 919 × 212 PNG, transparent. Use on dark.", dark: true },
      { src: "/gift-series/book-cover-hi.jpg", name: "Book cover", note: "The real cover · 694 × 700. Never a mockup.", dark: false },
      { src: "/assets/portrait-hat.png", name: "Bob, portrait", note: "Approved portrait. The only other Bob photos are behind-3, home-teaser and about-hero.", dark: false },
    ],
    colours: [
      { name: "Ink", hex: "#050608", note: "Site background, the darkest" },
      { name: "Ink 15", hex: "#15161c", note: "Text on paper · newsletter ink" },
      { name: "Gold", hex: "#c8a96a", note: "Site accent · buttons, rules" },
      { name: "Gold, deep", hex: "#b9871f", note: "Newsletter and print accent" },
      { name: "Gold, dim", hex: "#8b774a", note: "Quiet gold on dark" },
      { name: "Paper", hex: "#f4f0e6", note: "Newsletter and print background" },
      { name: "Rule", hex: "#e3dccb", note: "Hairlines on paper" },
      { name: "Muted", hex: "#6b665a", note: "Secondary text on paper" },
    ],
    type: [
      { name: "Cormorant Garamond", role: "Headlines and the long reads. Light weights, italic for emphasis.", css: "var(--font-cormorant), 'EB Garamond', Georgia, serif", sample: "Fifty years of waiting for the light.", size: 34, weight: 400 },
      { name: "Manrope", role: "Everything else on the site: body, labels, buttons.", css: "var(--font-manrope), system-ui, sans-serif", sample: "Every plate is a real place, made by one man who stood there at dawn.", size: 17, weight: 400 },
      { name: "Mr De Haviland", role: "The signature only. Never for words.", css: "var(--font-sig), cursive", sample: "Robert Castellino", size: 40, weight: 400 },
    ],
    words: [
      { k: "Book facts", v: "84 plates · 116 pages · first printing · $49.95 signed" },
      { k: "Book title", v: "Colorado: Life & Light on the Land" },
    ],
  },
  leadsHint: "For Bob this means galleries, interior designers, gift shops and Colorado media along the Front Range.",
  planEmailSuggestion: { title: "A note to recent buyers", note: "A short thank-you from Bob to anyone who bought this week." },
};
