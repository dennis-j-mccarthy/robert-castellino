# Progress — Bob Castellino Meta ads (Oct 11, 2026)

Supersedes the Oct 10 note. Read `docs/HANDOFF-meta-ads.md` first for the asset list.

## Live on robertcastellino.com
- **Offer:** signed copy, list $60, **$49.95** (code `10OFF` applied by default on `/book`;
  ad links use `/book?code=10OFF`). Server re-checks the code; signed = no extra charge.
- **/book is the ad landing page:** no hero, no site banner, no prints. Offer card left,
  cover right (tilted), "Flip through the book" viewer with 15 real spreads
  (30 pages, `public/book-preview/`, rendered from the local print PDF; skips the nude on pp. 5–6).
- **Meta Pixel code is installed but inert** until `NEXT_PUBLIC_META_PIXEL_ID` is set in Vercel:
  PageView everywhere, ViewContent on /book, InitiateCheckout on Order, Purchase on
  `/checkout/success` only when Stripe says the session is paid (value = amount_total,
  eventID = session id, plus a localStorage guard).
- ⚠️ **Stripe is in sandbox on production** (`cs_test_` sessions). Real cards fail until Bob's
  live `STRIPE_SECRET_KEY` is in Vercel.

## Meta — Castellino Photo `1788471615529613` (nothing published, nothing spending)
| Object | ID | Notes |
|---|---|---|
| Audience Warm A · Page engagers 365d | 120251354066190171 | |
| Audience Warm B · Page followers | 120251354066350171 | |
| Lookalike 1% · from followers | 120251354067050171 | |
| Campaign "Book · Signed copy $49.95 · Holiday 2026" | 120251354161250171 | Traffic, CBO $30/day, starts Nov 3, Off |
| Ad set 1 · Warm | 120251354238940171 | Warm A+B, US, Facebook only |
| Ad set 2 · Lookalike | 120251354162580171 | 45–65 suggestion, excludes Warm |
| Ad set 3 · Colorado home | 120251354163940171 | Colorado residents, 45–65, 6 interests (unpublished edit in Ads Manager) |
| Ad set 4 · Homesick gift buyers | 120251354164530171 | US 45–65, Colorado/Aspen/Broncos/ski resort, Nov 17–Dec 12 (unpublished edit) |
| (archived) old ad set 1 | 120251354162120171 | goal mismatch, ignore |
| Creative B3 coffee table | 3457574887756474 | "Signed copy, $49.95" |
| Creative B1 fifty years | 1893219345177368 | |
| Creative D1 gift of Colorado | 4563542123889937 | |
| Ads (8, paused) | 120251354246610171, …246660171, …246730171, …247020171, …247340171, …247480171, …247630171, …247710171 | 2 per ad set |

## Gotchas learned
- API-created ad sets get the retired location type → publish blocked (#1870194). Set
  `geo_locations.location_types: ["home","recent"]`.
- Advantage+ audience: min age > 25 must be a suggestion: `targeting_automation.individual_setting.age=1` + `age_range:[45,65]`.
- CBO + lowest cost: every ad set must share one optimization goal (all LINK_CLICKS here).
- Interests/regions need Ads Manager UI (no targeting search in the connector). Pressing Escape
  in the ad set editor opens "Publish draft items?" — close it, never Publish.
- `ads_get_ad_entities object_state=draft` and `ads_creative_upload_media` are not rolled out to this
  account; pass `image_url` to `ads_create_creative` instead.
- Business Suite "Finish later" did not save a draft via automation; captions live in gift-series.
- Creating the pixel requires accepting Meta Business Tools Terms for Bob's business — Dennis/Bob does that.

## Left for Dennis / Bob
1. Bob's live Stripe key in Vercel (before Nov 3).
2. Create the pixel (Events Manager → Connect data → Web, accept terms) → put ID in Vercel as
   `NEXT_PUBLIC_META_PIXEL_ID` → redeploy.
3. Link Instagram (needs the IG login). Advertiser verification if Meta asks.
4. Review the 8 ads + targeting, then **Publish** in Ads Manager.
5. The Book Works ad account still not shared (needs Bob).
6. Organic posts: captions in `public/gift-series.html`; post or schedule from Business Suite.
