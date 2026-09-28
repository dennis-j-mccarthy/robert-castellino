# Handoff — Castellino gift-series ads

_Updated 2026-09-28 for a switch to Claude. Repo: `/Users/dennis.mccarthy/robert-castellino`. Branch `main`, pushed. Latest commit `2640a00`._

Dennis is doing the work. Bob (Robert Castellino) is the client. Do not treat Dennis as Bob.

## Live page

https://robertcastellino.com/gift-series.html

Unlisted (`noindex, nofollow`). Share by link. It is a draft deck, not the ad publisher and not the click destination. Ads should click through to https://robertcastellino.com/book.

50 posts. Channel crops: 1:1, 4:5, 9:16, 1.91:1, 2:3, 2:1. 9:16 cards are phone-width and centered. Sequence numbers are rewritten from DOM order.

Campaign line: **Give the gift of Colorado.** Every image has the lockup “50 years in the field · Book sale, 15% off.” Captions close with the sale and his fifty years.

`COLORADO15` is a **placeholder**. Do not tell Bob it is a real code. Global replace when the real code exists. Book price on the site is $75, signed $85, ships from Boulder in about three business days. The book is **11 × 11 inches, 168 pages** — a thin square hardcover, not a binder.

## What Bob can be told

OK to share the link as a draft. Plates and his real portraits are real. Hearts and like-counts are mock chrome. The coffee-table pictures are stand-ins, not a photo of his book.

## Editing, library, save

Page: `public/gift-series.html` (static file in `public/`, not a Next route).

- Click gold-outlined text to edit. **Copy** reads the current words. **Reset** restores that one ad.
- **Swap image** opens the library. Catalog: `public/gift-series/library.json` (every photo already used on the ads). Story row has Swap frame 1/2/3.
- Until Save, edits live only in `localStorage` in that browser (`rc-gift-edits-v1`, `rc-gift-img-…`). Bob does not see them.
- **Save** (top of the page) writes one JSON row to Postgres. Public `GET /api/gift-series` loads it for everyone. `PUT` requires the existing admin session. Unsigned visitors see the button **Sign in to save**, which goes to `/admin/login?next=/gift-series.html` and returns.
- Table `GiftDraft`, id `current`, fields `edits` and `images`. Migration `prisma/migrations/0003_gift_draft`. Route `src/app/api/gift-series/route.ts`.
- One admin login already exists and production uses it (`/admin` redirects to `/admin/login`). It is Bob’s single admin account. The password is in Vercel env (`ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_JWT_SECRET`), not in the repo. Setup notes: `docs/admin-setup.md`. Suggested email there is `rlcatellino@gmail.com`; confirm before assuming that is the live address.

## Book pictures — do not inset these

Dennis’s rule: do **not** put a generated book on the plate ads until a photo of the real book looks right. None of the generated ones cleared that bar (too thick, not square, pasted-on, or wrong type).

When a real photo exists, inset it small on a few plate ads with a caption beside it. The landscape stays the picture.

Ask Bob (or Dennis) for three phone frames:

1. Book flat on a coffee table, room visible.
2. Lower angle so the page edge is a thin strip.
3. Book square to the camera, filling the frame, for the inset.

Real cover file, for reference only: `public/gift-series/book-cover-hi.jpg` (694×700).

Current stand-in scenes, already on the page and not good enough to treat as finished: `scene-morning.jpg`, `scene-evening.jpg`, `scene-cabin.jpg`. Older composites (`coffee-table.jpg`, `coffee-table-grok.jpg`, `book-morning*.jpg`, `book-evening*.jpg`, `book-cabin*.jpg`) are leftovers. Do not wire those back in.

Bob photos that are actually him: `public/assets/portrait-hat.png`, `behind-3.png`, `home-teaser.jpg` (Jenny Lake), `about-hero.png`. Do **not** use `behind-1.png`, `behind-2.png`, `behind-4.png`, or `portrait-flatirons.png` as Bob. They are different people.

## Deploy

`git add/commit/push` to `main`. Vercel builds with `prisma migrate deploy && prisma generate && next build`. A deploy fails closed if Postgres is unreachable. Latest successful production deploy of this work is `2640a00`.

Uncommitted right now: local edits to `book-cabin.jpg`, `book-evening.jpg`, `book-morning.jpg` (not the live scene files). Untracked: `docs/creative-brief.md`.

## Strategy already written

`docs/creative-brief.md` (not committed). Paid social creates the want. Search catches people already looking. Three ad campaigns: the place, the photographer, the object. Only the object ads lead with price. Holiday burst is early November through December 19, after the real code exists. Always-on has no fake discount. Do not spend to rank “Rocky Mountain High”; that line is for ads only.

## Posting

The page does not publish. Copy the words, upload the same photo in Instagram, Facebook, Pinterest, or email. Paid ads go in Ads Manager, link to `/book`.
