# Spec — gift-series "plan bar" upgrade

_Oct 13, 2026. Turns `public/gift-series.html` from a creative deck + ad-earmark
into a planning surface: earmark each item as a **post** and/or an **ad**, give it
a **date**, flag a **cross-post reminder** for Bob's personal FB/IG, and see it all
in a **schedule** and a **Bob checklist**. Shared, saved to the DB._

## The reality that shapes the whole design
There are two tracks, and only one can ever be automated:

- **Automatable (by API / the Meta connector):** Facebook **Page** posts, **paid
  ads**, and IG **Business** posts — but only once Bob's IG is linked (the page
  still shows **INSTAGRAM: NOT LINKED**, so IG is blocked for now).
- **Reminder-only (never automatable):** Bob's **personal** Facebook profile and
  **personal** Instagram. Meta has no API for personal timelines — so these must be
  a **checklist Bob ticks off**, forever.

So v1 is a **plan + queue + checklist**, not an auto-poster. The page records
intent; execution is: ads → Claude builds via the connector; Page/IG posts →
scheduled later via API/Business Suite; personal → Bob does them from his checklist.

## Current state (what we extend)
- Store: `GiftDraft` row `id="ads"`, `edits["NN"]` = JSON of `AdState`
  `{adSet,status,adId,note,by,at}`. Keys are 2-digit post numbers.
- API: `GET/PUT /api/gift-series/ads` (PUT is admin-only, upserts one post).
- UI: per-post `.adbar` (Run as ad · ad set · status · Meta ad ID) + an Ads tracker
  grouping marked posts by the 6 ad sets.
- Ad sets: 1 Warm, 2 Lookalike, 3 Colorado home, 4 Homesick gift buyers, 5 Photo-book
  people, 6 Boulder County. Statuses: marked / built / running / stopped.

## Data model — `PlanState` (supersedes `AdState`, same row/keys)
```jsonc
{
  "post":      { "on": true, "channels": ["fb","ig"], "scheduledAt": "2026-11-28T09:00:00Z", "posted": false },
  "ad":        { "on": false, "adSet": "4", "status": "marked", "adId": "", "scheduledAt": null },
  "crosspost": { "fb": true, "ig": true, "done": false },
  "note": "", "by": "dennis", "at": "2026-10-13T..."
}
```
- **Backward compatible:** on read, migrate an old `AdState` → `PlanState.ad`
  (on = any adSet/status set). Keep the same `GiftDraft id="ads"` row and `"NN"` keys.
- At least one of `post.on` / `ad.on` / a `crosspost` flag must be true, else the
  item is unplanned (same as deleting its row today).
- An item may be **both** a post and an ad (an organic post we also boost) — not
  mutually exclusive. (Confirm — see open decisions.)

## UI — the plan bar (replaces `.adbar` on each item)
Two compact rows under each post card, admin-gated like today (save-on-change):

- **Earmark:** `☐ Post   ☐ Ad`
  - If **Post**: `channels ☐ FB ☐ IG` · `date/time` · `☐ posted`
  - If **Ad**: `ad set ▾` · `status ▾` · `Meta ad ID` · `date/time`
- **Cross-post reminder:** `Remind Bob to share on his own: ☐ Facebook ☐ Instagram` · `☐ Bob did it`

Each card shows a small tag strip reflecting its plan: `Post · FB · Nov 28` / `Ad · set 4 · Running` / `↗ Bob FB+IG`.

## New views (additive sections)
1. **Schedule** — every earmarked item sorted by date: `date · item# · Post/Ad ·
   channel · status`. Simple list/calendar; the backbone for real scheduling later.
2. **Bob's cross-post checklist** — filtered to items with `crosspost.fb/ig` not
   done, grouped by platform, each showing the caption + image + a **mark-done**
   control. A link we can send Bob (see access decision).
3. **Ads tracker** — keep as-is, but **sync status live from Meta** (below).

## Live Meta status sync (now unblocked)
The Meta connector can read ad delivery status. Add a small sync (a button, later
periodic) that updates each `ad.status`/`adId` from Meta so the tracker shows
reality instead of hand-set values. (Same connector path we used to pause the book
ad.)

## API changes
- Extend `clean()`/validation to `PlanState`: ISO dates, `channels` ⊆ {fb,ig},
  bools, existing ad bounds. Reject malformed; keep size caps.
- `GET /api/gift-series/ads` returns the plan map; `PUT {post, state|null}` keeps
  its contract with the richer state.
- **Bob's checklist access:** either (a) Bob signs in (simplest, he has admin), or
  (b) a tokened read-only link + a narrow `POST` that only flips `crosspost.done`.
  Recommend (a) unless we want to keep Bob out of admin.

## Phasing
- **P1 (this build):** plan bar (post/ad · channels · date · cross-post), schedule
  view, Bob checklist, DB + validation. All intent/queue — **no auto-posting yet.**
- **P2:** live ad-status sync from Meta.
- **P3:** actually schedule FB **Page** posts (API/Business Suite) and IG **once
  linked**. Personal FB/IG stay manual (checklist) permanently.

## Decisions (locked Oct 13, 2026)
1. **Yes** — one item can be both a post and an ad (post flags + ad flags coexist).
2. **Deferred.** P1: Bob's checklist is a **filtered read view** (uses the existing
   unlisted page; the "Bob did it" checkbox saves only when an admin is signed in).
   A tokened link that lets Bob tick items himself is a P2 add once we decide.
3. **Separate** — the 5 emails are NOT folded into the schedule; they stay their own
   section.
4. **No IG linking** — Meta's UX makes it not worth it right now. Consequence: **all
   Instagram (personal and business) is reminder-only** for now — an IG post/cross-post
   is a checklist item for Bob, never auto-scheduled. Only FB **Page** posts and ads
   are on the automatable track.
5. **Scheduling engine is later (P3).** P1 records dates as intent only; nothing
   auto-posts yet. Revisit Business Suite Planner vs API scheduling then.
