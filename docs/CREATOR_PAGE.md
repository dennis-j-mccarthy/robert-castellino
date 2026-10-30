# Creator page (`/creator`)

Bob's content system, ported from the `built-with-ai` / `flowycash` creator
page and adapted to this site: brand essence and pillars, a Claude-powered
Musing writer, a library view over his real plates, a Facebook post maker,
a read-only view of the live book ads plus the 37 concepts, and a
newsletter maker. Live at **https://robertcastellino.com/creator**.

It is gated by the **existing admin session** (`castellino_admin` cookie,
`src/lib/auth.ts`) — not a passcode. `src/middleware.ts` matches
`/creator/:path*` and bounces logged-out visitors to
`/admin/login?next=/creator/…`; the route-group layout checks the session
again server-side. Every `/api/creator/*` route calls `getSession()`.

## Routes

| Page | What it does |
| --- | --- |
| `/creator` | Redirects to `/creator/essence`. |
| `/creator/essence` | The line, purpose, promise, do / don't chips, three voice dials, the CTA (autosaved), the tone brief, the five pillars (CRUD), the ten core messages and the six Meta audiences (read-only). |
| `/creator/blog` | Blog generator: tone → pillar + topic → 6 title ideas → write the Musing (optionally from Bob's rough notes) → edit (category, date label, place, excerpt, body, image from the library) → **Save as draft** or **Publish**. |
| `/creator/blog/posts` | Every Musing (draft and live): edit, publish / unpublish, delete, hand off to the Post maker (`Post`) or the newsletter (`Email`). |
| `/creator/library` | The library view: ad-image manifest ∪ gallery photos, enriched with pillar / core message / title / place / blurb. Badges: gold **p.N** = in the book; red **Mockup — never use in ads/posts**. Filters by collection, pillar, in-book, search. Tags are editable per image. |
| `/creator/social` | Post maker: ① image (real plates only — mockups are never offered) → ② platform (Facebook publishes; Instagram is copy-only) → ③ pillar + optional core message → ④ three caption options → preview → **Publish now** / **Schedule**. Below: the drafts picker (the per-platform drafts the publish hook writes) and the queue (scheduled / posted / failed, with **Cancel** for scheduled). |
| `/creator/ads` | Paid social. **In market**: the live ads in campaign `120251354161250171` (name, ad set, headline, status, Meta preview, Ads Manager link), read-only, cached 5 min. **Concepts**: the 37 book concepts in sets F / G / H, each with **Stage in Ads maker**. |
| `/creator/email` | Newsletter from 1–3 published Musings: three subject lines, preheader, intro, a blurb per Musing, outro; rendered to HTML + text with Bob's footer and the two CTAs. Copy / download; status by hand. No ESP. |

Skipped on purpose: Studio, the content calendar, stock-image providers
(Bob only uses his own photographs), uploads inside the creator (they stay
in `/admin/collections`).

### URL prefill

- `/creator/social?imageId=/assets/…&caption=…&platform=facebook&pillar=light&at=2026-11-01T07:30&musingId=m07&draftId=…`
- `/creator/email?musingIds=m01,m07`
- `/admin/ads?h=<headline>&m=<primary text>&d=<description>&name=<ad name>&img=/assets/…` — what **Stage in Ads maker** sends (the params `AdsClient.tsx` accepts).

## What was reused vs. new

Reused from the existing admin (no second write path):

- **Musings**: the blog publishes into the existing `Musing` model through
  `POST /api/admin/musings` and `PUT /api/admin/musings/[id]`, so the
  publish hooks (revalidate, IndexNow, per-platform `SocialDraft`s) fire
  exactly as they do from `/admin/musings`. `/api/creator/blog/write` only
  generates; it never saves.
- **Facebook publishing**: `POST /api/admin/facebook/post` and
  `src/lib/meta/graph.ts` (`publishPagePost`). The route gained two
  optional fields (`pillarId`, `draftId`) and now records the outcome on
  `SocialDraft` (best-effort) so the queue shows it. `/admin/social` is
  unchanged in behaviour.
- **Drafts**: `GET /api/admin/social-drafts` feeds the "From drafts" picker.
- **Meta Marketing reads**: `src/lib/meta/ads.ts` (`listAds`, `getPreview`,
  `adsManagerUrl`) with `META_ADS_TOKEN`. No new write path to Meta exists.
- **Ad creation**: only the existing `/admin/ads` Ads maker — paused
  creation, in-book plate rule.
- **Images**: `src/data/ad-images.json` (17 entries with `bookPage`) +
  `Photo` / `Collection` rows. Nothing is re-uploaded.
- Auth, the admin shell CSS (`.admin-shell`, `.ads-*`, `.fbcard`), `btn` styles.

New:

- `src/lib/creator/*` — `pillars.ts` (client-safe types/helpers, `SITE`,
  `BOOK` facts), `seed-data.ts` (defaults from `src/data/creator-seed.json`),
  `essence-store.ts`, `pillar-store.ts`, `tone-store.ts`, `brand-context.ts`
  (the one system prompt every generator uses), `ai.ts` (Claude helper:
  `claude-opus-5`, adaptive thinking, JSON-schema output), `library.ts`
  (the view + mockup rule), `social.ts`, `social-queue.ts`, `newsletter.ts`,
  `email-store.ts`, `in-market.ts`, `concepts.ts`, `seed.ts`, `guard.ts`,
  `client.ts`.
- `src/components/creator/*` — `ImageGrid` (shared picker with badges),
  `Thumb`, `Notice`, `usePillars`.
- `src/app/creator/(authed)/*` pages + clients; `src/app/api/creator/*`.
- `src/lib/meta/graph.ts` gained `deletePagePost` (cancelling a scheduled post).
- `scripts/seed-creator.ts`, `src/data/creator-seed.json`, `src/data/book-concepts.json`.

### API (`/api/creator/*`, admin session required)

- `GET|PUT essence` — the `BrandEssence` singleton (+ pillars + tone on GET).
- `GET|POST pillars`, `PATCH|DELETE pillars/[id]`.
- `GET|PUT blog/tone`; `POST blog/titles { topic?, pillarId?, count? }`;
  `POST blog/write { title, pillarId?, notes?, loc? }` → `{ draft }` (not saved).
- `GET library` → `{ items, collections, counts }`; `PATCH library { src, pillarId?, messageId?, title?, blurb?, loc? }`.
- `POST social/captions { pillarId, platform, messageId?, imageSrc?, musingId?, topic? }` → 3 captions.
- `GET social/config` → `{ connected, page, pageId, instagram, ai }` (never a token).
- `GET social/queue`; `POST social/queue { action: "cancel", id }`.
- `GET ads/in-market [?refresh=1]` (read-only, cached); `GET ads/preview?creativeId=&format=`.
- `GET email`; `POST email/generate { musingIds[1..3], pillarId?, topic? }`; `GET|PATCH|DELETE email/[id]`.
- `POST seed { force? }` — runs the idempotent seed against the live DB.

## Hard rules baked in

- **Mockups never ship.** `src/lib/creator/library.ts` flags any path matching
  `/book-cover|book-table|gift-series|mockup/i`; the Post maker is handed
  `adEligible` items only; the Library badges them red; the Ads maker keeps
  its own in-book rule.
- **Book facts are fixed** in `BOOK` (`src/lib/creator/pillars.ts`): 84
  plates · 116 pages · first printing · $49.95 signed. The brand paragraph in
  every system prompt repeats them and forbids inventing numbers.
- **No ad spend.** Nothing under `/creator` or `/api/creator` can create,
  activate or pause an ad, ad set or campaign. Meta is read-only here.

## Database

Migration `prisma/migrations/0009_creator_page` (additive):

- New models `BrandEssence` (singleton; messages and audiences as JSON),
  `Pillar`, `BlogSettings` (tone), `EmailDraft`, and the small `LibraryTag`
  (enrichment keyed by image path — no bytes).
- `SocialDraft` gained five nullable columns for the queue: `pillarId`,
  `metaPostId`, `scheduledAt`, `publishedAt`, `error`. Standalone Post-maker
  rows use `musingId = "post:<id>"`.
- No existing model was otherwise changed; no `BlogPost`, no `UploadedImage`.

`package.json`'s `build` script runs `prisma migrate deploy` first, so a
production deploy applies the migration before `next build`. Locally:

```
npx prisma migrate deploy && npx prisma generate
```

## Seeding

```
npx tsx scripts/seed-creator.ts            # idempotent
npx tsx scripts/seed-creator.ts --force    # overwrite with the seed values
```

Writes the essence (line, purpose, promise, do / don't, voice 14/58/42,
CTA, 10 core messages, 6 audiences), the five pillars (`light`, `state`,
`maker`, `book`, `wall`), the tone brief, and `LibraryTag` rows for the
master-page assets that exist on the site (85 of 93 — the 8 "studio"
shots like `book-cover-hi.jpg` were never uploaded here and are skipped).

Production's `DATABASE_URL` is a *sensitive* Vercel variable (not
pull-able), so the same seed also runs from `POST /api/creator/seed`
(admin session) and **automatically on the first visit to `/creator`** when
there is no `BrandEssence` row yet (`ensureCreatorSeeded()` in the layout).

## Environment

| Name | Where | Purpose |
| --- | --- | --- |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD_HASH`, `ADMIN_JWT_SECRET` | Vercel + `.env.local` | The admin session that gates `/creator`. |
| `DATABASE_URL` | Vercel (sensitive) + local | Postgres via `@prisma/adapter-pg`. |
| `ANTHROPIC_API_KEY` | Vercel (Production + Preview) + `.env.local` | Titles, Musings, captions, newsletter copy. Without it the pages degrade (manual writing; fallback newsletter copy). |
| `META_PAGE_ID`, `META_PAGE_TOKEN`, `META_PAGE_NAME` | Vercel + local | Publishing to the Page (same connection as `/admin/social`). |
| `META_ADS_TOKEN`, `META_AD_ACCOUNT_ID` | Vercel + local | Read-only "In market" table and Meta previews. |
| `META_BOOK_CAMPAIGN_ID` | optional | Overrides the campaign shown in "In market" (default `120251354161250171`). |

## Local development

```
npx prisma dev --name castellino --detach     # local Prisma Postgres; prints a postgres:// URL
DATABASE_URL=<that url> npx prisma migrate deploy && npx prisma generate
DATABASE_URL=<that url> npx tsx prisma/seed.ts             # musings + collections
DATABASE_URL=<that url> npx tsx scripts/seed-creator.ts    # creator page
DATABASE_URL=<that url> npx next dev -p 3457
```

Mint a session cookie for curl without the password (uses `ADMIN_JWT_SECRET`
from `.env.local`):

```
TOKEN=$(npx tsx -e 'import "dotenv/config"; import("./src/lib/auth").then(a=>a.mintToken("dev@local").then(t=>console.log(t)))' | tail -1)
curl -s -b "castellino_admin=$TOKEN" localhost:3457/api/creator/essence | head -c 300
curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" localhost:3457/creator      # 307 → /admin/login?next=/creator
```

## Handoff to the Ads maker

"Stage in Ads maker" on `/creator/ads` opens
`/admin/ads?h=…&m=…&d=…&name=Book · Concept F1 · …[&img=/assets/…]`.
`AdsClient.tsx` applies the prefill after mount and shows "Loaded from the
Creator page". Nothing is created until an ad set is picked there, and even
then the ad is created **paused**; book ads must use an in-book plate.
