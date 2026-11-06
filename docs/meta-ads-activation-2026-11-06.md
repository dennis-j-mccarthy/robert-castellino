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
