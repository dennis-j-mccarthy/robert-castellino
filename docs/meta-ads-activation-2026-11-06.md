# Meta ads switched on — 2026-11-06

Dennis's go: "ok turn on the ads" (2026-11-06, early morning). Done through the
Marketing API with `META_ADS_TOKEN` from `.env.local`, via the repo's
`src/lib/meta/ads.ts`. Bob's approval of the $180 asked for in
`docs/bob-note-2026-11-05.md` (Gmail draft, not yet sent at the time).

Ad account **Castellino Photo** `act_1788471615529613`.

## What changed

| Object | ID | Before | After |
|---|---|---|---|
| Campaign "Book · Signed copy $49.95 · Holiday 2026" | `120251354161250171` | PAUSED, $30/day CBO | **ACTIVE**, $30/day CBO (unchanged budget) |
| Ad set 1 · Warm · Page engagers + followers | `120251354238940171` | PAUSED | **ACTIVE** |
| Ad set 3 · Colorado home · 45+ · interests | `120251354163940171` | PAUSED, 0 ads | **ACTIVE**, 37 ads (copies of set 1's, named "… - Copy") |
| 37 concept ads in ad set 1 | `1202516928…` series | PAUSED | **ACTIVE** |
| 37 copied ads in ad set 3 | `1202518347…`/`1202518348…` series | did not exist | **ACTIVE** (23 delivering, 14 still in Meta review at 07:xx MT; they start on their own when approved) |

Untouched: ad sets 2 (Lookalike), 4 (Homesick gift buyers, dated Nov 17–Dec 12),
5 (Photo-book people), 6 (Boulder locals) all stay PAUSED. The 7 unpublished
Ads Manager draft changes and the hand-made draft "New Traffic Ad" were left
alone; they do nothing unless someone presses **Review and publish**.

One accidental duplicate copy of Concept 37 in ad set 3 (`120251834794460171`)
was deleted before activation. Ad set 3 holds exactly 37.

## Plan

$30/day through early next week (~$180), then evaluate: CTR and CPC per ad,
by audience. Keep the winners, move to Phase 2 (add Lookalike + Photo-book
sets, stage new concepts). Bars from `/creator/ads` Next steps: CTR ≥ 1.5%,
CPC ≤ $1.25.

## To undo

```
# pause everything (reverse order of activation)
setStatus("120251354161250171", "PAUSED")   # campaign — stops all spend at once
setStatus("120251354238940171", "PAUSED")   # ad set 1
setStatus("120251354163940171", "PAUSED")   # ad set 3
```

The ad-set-3 copies can be deleted with `deleteEntity(id)` per ad if the set
should go back to empty. Scripts used are in the session scratchpad
(`activate.ts`, `dedupe.ts`); the same calls exist in `src/lib/meta/ads.ts`.

## 2026-11-07 — Conversions API added

Correction to the 10/10 handoff: the Meta Pixel has been live on the site
since 10/13 (dataset `1160986453259804`): PageView, ViewContent on /book,
InitiateCheckout on the buy click, Purchase on /checkout/success.

Added `src/lib/meta/capi.ts` + a server-side Purchase send from
`src/app/checkout/success/page.tsx` (commit b46a893, deploy Ready). Same
`event_id` (Stripe session id) as the browser event, so Meta dedupes. Uses
`META_CAPI_TOKEN` else `META_ADS_TOKEN` (already in Vercel production).
Live-site only; set `META_CAPI_TEST_CODE` to send to Events Manager → Test
events from elsewhere. Test event accepted (events_received 1).

Pixel, first 7 days of ads: PageView 674 · ViewContent 638 ·
InitiateCheckout 1 · Purchase 0 (through 11/06).

## 2026-11-07 — Retargeting ad set added (Dennis: "ok add the retargeting ad set")

| Object | ID | Notes |
|---|---|---|
| Custom audience "Site · /book visitors 14d" | `120251853347230171` | Pixel 1160986453259804, url contains `/book`, 14 days, prefill on. Still populating at creation (Meta: "too small" / "finding people"). |
| Custom audience "Site · Purchasers 180d" | `120251853347530171` | Pixel Purchase event, 180 days. Used as the exclusion. |
| Ad set 7 "Retargeting · /book visitors 14d" | `120251853348670171` | ACTIVE in the CBO campaign (no own budget). US 18–65, visitors minus purchasers, FB feed/marketplace/story + IG feed/story/reels (`video_feeds` is deprecated in v21 and was dropped). LINK_CLICKS / IMPRESSIONS like the other sets. |
| Ads (ACTIVE, in review) | 02 `120251853358830171` · 14 `120251853349090171` · 18 `120251853349240171` · 37 `120251853350540171` | Top-clicked plates from the first 48h. Copy: "You had a look at Colorado: Life & Light on the Land. Every copy is signed … $49.95. Order now to have it in time for Christmas." Headline "Signed. Ships from Boulder in 3 days." No hard order-by date (Bob hasn't confirmed one). |

Deleted during the build: Retarget Concept 24 `120251853349870171` (same plate as 18; Meta
returned the same creative id). Four distinct plates remain.

**Flow audit, same day:** campaign ACTIVE $30/day CBO, sets 1/3/7 active, 2/4/5/6 paused.
Every live ad links to https://robertcastellino.com/book (200). /book shows $60 struck →
$49.95 with code 10OFF pre-applied for everyone, so the ad price matches the page. Shipping
is a flat $12 at checkout (not in the ads). POST /api/checkout with the book returned a real
Stripe Checkout URL. Success page fires Pixel Purchase + CAPI Purchase (same event id).
**Watch:** audience 7 needs to populate before it delivers; check Monday.
