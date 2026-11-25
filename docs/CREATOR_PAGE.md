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

## 2026-11-24 — The studio frame, This week, and Plan

The left rail is gone. `/creator` is now a **top sequence** of nine numbered
tools (`CreatorShell.tsx`): 1 Essence · 2 Library · 3 Blog · 4 Posts
(`/creator/social`) · 5 Email (placeholder) · 6 Newsletter (the old
`/creator/email` page, moved to `/creator/newsletter`; its API stays at
`/api/creator/email`) · 7 Ads · 8 Leads (placeholder) · 9 Plan. Keywords,
Competitors, Google Ads, the Meta links, Admin and Sign out live under
**More**. Mockups that led here: `~/Desktop/creator-tour/` (nav-concepts.html,
pages-c.html).

**Home `/creator` = This week.** Renders the `WeeklyPlan` row for the current
Mountain-time week: a 7-day strip, "Needs you" with Open & draft / Skip per
slot (`/api/creator/plan/item`), the ads at a glance (`getRunningNow`), and
the Plan dials in one line.

**Tool 9 · Plan `/creator/plan`.** `CreatorPlan` singleton (`settings` JSON,
`PlanSettings` in `src/lib/creator/plan-types.ts`): posts per week + days +
time, newsletter cadence/day/time, email mode, leads cadence, blog cadence,
autonomy ladder (only "draft" is wired), arrival day/time and the address the
plan is emailed to. Autosaves via `PUT /api/creator/plan`.

**The Monday run.** `runWeeklyPlan()` in `src/lib/creator/plan.ts` builds
`PlanItem`s for the week (post slots pick in-book plates spread across pillars,
rotated by ISO week; newsletter on its cadence; blog/email/leads when set),
saves them, and emails the summary through Resend **only to the address set in
Plan** (never the contact address). Vercel Cron: `vercel.json`
`0 19 * * 1` → `GET /api/creator/plan/run` with `Authorization: Bearer
$CRON_SECRET` (set in Vercel production 11/24). 19:00 UTC is noon MST, 1 pm
MDT. "Build this week now" on the Plan page calls the same thing with the
admin session (`POST`, `{force}` rebuilds from the dials).

Migration `0011_creator_plan` (CreatorPlan, WeeklyPlan). First plan built on
prod 11/24 for the week of Nov 23: 3 posts + newsletter, no email (no address
set).

### 2026-11-24, later — the eight tools, and what each page does now

Email + Newsletter folded into **5 · Email** (tabs: A note = placeholder,
Newsletter = the old EmailMaker at `/creator/newsletter`). Sequence is now
1 Essence · 2 Brand kit · 3 Blog · 4 Posts · 5 Email · 6 Ads · 7 Leads · 8 Plan.

- **1 Essence** (`EssenceClient.tsx`): hub (line / promise / purpose / CTA)
  + five accordion spokes (always/never, voice, who it's for, pillars with
  their core messages nested, tone brief). Every field has a hint and a
  ✦ Suggest button → `POST /api/creator/essence/suggest { kind }` (kinds:
  line|purpose|promise|cta|dos|donts|voice-sample|messages|tone). Suggestions
  are never saved until clicked; core messages are added to
  `BrandEssence.messages` via PUT essence; tone rewrite saves BlogSettings.
- **2 Brand kit**: tabs Pictures (`/creator/library`) and Brand kit
  (`/creator/brand`: logos, colours, type, the words, copy/download).
  Pictures = full-width captioned grid (blank caption flagged orange),
  details in a popup, Add pictures (choose / drop / paste → `/api/admin/upload`
  → `/api/creator/library/add` registers a Photo in the unpublished
  "Studio uploads" collection), ✦ Describe with AI per picture and
  "Caption the blank ones" in batches of 12 → `/api/creator/library/describe`
  (Claude vision; `generateJson` now takes `imageUrl`). "Create with AI" is a
  placeholder: needs an image-model key (OPENAI_API_KEY) which this project
  does not have.
- **3 Blog**: Musing cards 4-across first (`MusingCards.tsx`, live + draft),
  writer below at `#write`.
- **4 Posts**: `PostBoard.tsx` first — Published / Scheduled / Unpublished
  from SocialDraft — then the maker at `#make`.

Known data nit seen 11/24: a Photo row points at
`lep-19road-less-traveled-24x36.jpg` (404); the real file has no hyphen
before 24x36. Fix the row's `img` in /admin/collections.

### 2026-11-24, evening — nine tools, Audience, un-numbered nav, webpack build

- Sequence: Essence · Brand kit · **Audience** (new, `/creator/audience`) ·
  Blog · Posts · Email · Ads · Leads · Plan. Nav items carry no numbers
  (Dennis); "✓ set up" marks tools with real data. Page eyebrows are just
  the tool name.
- **Audience** (`src/lib/creator/audience.ts`): the reader
  (BlogSettings.tone.audience, Save/Discard, ✦ Suggest kind `reader`), the
  email list (Subscriber counts), and the segments: `BrandEssence.audiences`
  cards (the October plain-words write-ups: define/geo/age/best/caution)
  matched by name to Meta `act_/customaudiences` (size, delivery status)
  and to every ad set that targets them, with last-7-day spend/clicks/
  purchases per set. Read-only toward Meta; "Open in Meta" per card.
- Essence lost "Who it's for" (now the reader on Audience); five sections.
- Pictures popup saves explicitly (Save/Discard, unsaved guard).
- **Build runs `next build --webpack`.** Turbopack failed two Vercel builds
  in a row with "next/font/google queries have exactly one entry" (a Google
  Fonts fetch hiccup); webpack falls back to system fonts and warns.

### 2026-11-24, night — Blog stars → newsletter

- `Musing.starred` (migration 0012). On the Blog cards a ☆ marks a published
  Musing for the next issue; a Musing that is in a `ready`/`sent` EmailDraft
  shows "In issue" instead (`loadMusingCards` joins `EmailDraft.musingIds`).
  `POST /api/creator/blog/star { id, starred }`.
- **Make newsletter** (`MusingCardsClient.tsx`): popup with the starred
  pieces (HTML5 drag to reorder; first = hero), a preamble textarea with
  ✦ Suggest (`essence/suggest` kind `preamble`, given the titles) and
  **Save as HTML** → `POST /api/creator/email/generate` (now up to 6 musings
  and an `intro` override) → saves the EmailDraft (shows on Email →
  Newsletter) and downloads `newsletter-YYYY-MM-DD.html`.
- Verified on prod 11/24: starred two Musings, popup opened, Suggest returned
  three preambles in Bob's voice. Two Musings left starred ("The Wild Horse,
  Late Winter", "On Conservation, Briefly") — unstar or use them.
- Noticed: many Musings have no picture (`img` null), so cards and the
  newsletter hero are blank for those. Worth a pass in /admin/musings or the
  Blog editor.

### 2026-11-24, late — Posts as cards

- `social/PostBoard.tsx` now only loads and serialises `SocialDraft` rows
  (state = published | scheduled | draft | failed; `approved` is a flag on
  draft). `social/PostCards.tsx` (client) renders them 4 across like the
  Blog cards, with filter chips All · Published · Scheduled · Drafts, and
  Failed only when one exists. Scheduled sorts soonest-first, the rest
  newest-first. Buttons: Open / Change (prefill the maker via the existing
  query string, then `#make`), View on Facebook ↗ and Post again for
  published ones. CSS block `pc-*` replaces `pb-*`.
- Local dev has no `DATABASE_URL` (`.env.local` blanks it), so the grid is
  always empty locally; verify on production.
- Follow-up (8793207): Published and Scheduled now come from the Page via
  `listPublishedPosts` / `listScheduledPosts` in `src/lib/meta/graph.ts`
  (Page token; `published_posts` + `scheduled_posts`). SocialDraft rows
  with a matching `metaPostId` fold into the Page card; drafts and failures
  still come from the table. First 12 shown, "Show 12 more" after that.

### 2026-11-24, late — Post maker rebuilt

- `social/PostMaker.tsx`: steps ① Where (Facebook / Instagram chips) ②
  Picture ③ What it's about (pillar cards). Picking a pillar auto-calls
  `/api/creator/social/captions` with `count: 5` (new body field, max 6)
  and shows five editable tiles; "Use this" puts a tile on the post, and
  editing the used tile edits the post. The post itself (right, sticky) is
  the preview and its caption is a textarea, so typing there is the same
  as writing by hand. "Steer the writing" (core message, topic, Musing id)
  lives in a collapsed details. Drafts and Queue lists are gone from the
  maker: the card board above covers them. CSS `pm-*`.

### 2026-11-24, late — nav order, Posts accordions, newsletter preview

- Nav: Essence · Brand kit · Audience · Blog · **Email** · **Posts** · Ads ·
  Leads · Plan (Email moved to 5, Posts to 6; the queued chip follows Posts).
- Posts page = `social/PostsAccordion.tsx`: ① Make a post (open on
  arrival) ② My posts (the card board). One open at a time; opening one
  scrolls its header to the top. "+ New post" removed from the board.
- Blog → Make newsletter popup now has the issue on the right in an
  iframe (`srcDoc`, sandboxed), redrawn 350ms after any drag or keystroke
  via `POST /api/creator/email/preview` (deterministic copy, no model,
  masthead "Notes from the studio · Month Year"). Popup is 1240px wide.
- Email is one tool again: `EmailTabs.tsx` deleted, the Newsletter tab is
  gone from Email and from `/creator/newsletter` (that page still serves
  the saved copies and is linked from the popup's "Saved" state only).
- Blog page = same two-panel pattern via the shared
  `src/components/creator/TwoAccordion.tsx` (Posts uses it too): ① Write a
  Musing (open on arrival) ② My Musings. The "+ New Musing" card opens
  panel 1 through `openPanel("write")` (a window event).
- Newsletter template (`src/lib/creator/newsletter.ts`): logo + tagline
  masthead (Essence line, fallback in code), placeholder preamble in the
  preview when the intro is blank, optional `cta` per blurb and one for the
  whole issue (`newsletter-ctas.ts` parses them; both routes accept them).

### 2026-11-24, late — Search

- `/creator/search` is the 4th tool (after Audience): four one-at-a-time
  accordions via `Accordion` in `TwoAccordion.tsx` — Keywords, Technical
  SEO, Competitors, Google Ads. `?open=<id>` opens a panel; the old
  `/creator/keywords`, `/creator/competitors`, `/creator/google-ads` routes
  redirect there and their bodies now live in `*Section.tsx` next to them.
- Technical SEO = `src/lib/creator/seo-audit.ts`: live fetch of /, /book,
  /musings, /gallery + robots.txt + sitemap.xml; per-page title/description/
  canonical/H1/alt/OG/JSON-LD/viewport/noindex/speed; site-level HTTPS,
  robots, sitemap, Musings-in-sitemap. `SEO_STANDING` is the list a fetch
  cannot check (Search Console, GBP, one phrase per page, alt text, speed,
  links in). First run 11/24: 37 OK · 6 look · 2 fix (home and /book titles
  over 60 chars, /book description 202 chars, /book 1.1s TTFB).
- The More menu lost Keywords / Competitors / Google Ads; Ads no longer
  matches /creator/google-ads. Nav is ten items.

### 2026-11-24, evening — Instant post, phone-first Pictures, closed accordions

- Accordions (`Accordion` / `TwoAccordion`) arrive **closed** on Blog, Posts
  and Search; header carries an Open ⌄ / Close ⌃ pill; clicking the open
  header closes it. `?open=` still opens one (old Search routes).
- Posts = ① **Instant post** (`social/InstantPost.tsx` + `POST
  /api/creator/social/instant`: photo from device/camera roll via
  /api/admin/upload → library "studio-uploads", three bullets, Claude vision
  writes caption/pillar/alt/place; Publish / Schedule / Copy / Fine-tune in
  the maker) ② Make a post ③ My posts.
- Pictures: `AddPictures` is a big tap target ("Tap to add a photo") with
  Choose photos / Take a photo (`capture="environment"`) / Create with AI,
  full-width on phones (modelled on Beth's gallery Add a Photo). Blank
  cards get an orange border and a "✦ Make a caption with AI" button
  (`captionOne`); the popup shows a "No caption yet" block with the same
  button when the title is empty, otherwise "Describe again".
- Ads page update restated to Stripe's 5 sales (Meta claims 6).

### 2026-11-24, night — Landing pages (Search panel 2)

- Model `LandingPage` + `Keyword.landingSlug`, migration 0013. Generator
  `src/lib/creator/landing.ts` (`writeLanding`: Essence + pillars system
  prompt, searcher's words in the H1, hero = a real plate chosen from the
  library by src, never generated; `markdownToHtml` for the body).
- API `GET/POST /api/creator/landing`, `PATCH/DELETE /api/creator/landing/[slug]`
  (creatorDbGuard; PATCH revalidates `/for/<slug>` and the sitemap).
- Public `/for/[slug]`: drafts visible to signed-in admins only and
  noindex; published pages get WebPage + Book + FAQPage JSON-LD, a Meta
  ViewContent event, and the sitemap. Order button → `/book?code=10OFF&utm_source=landing&utm_campaign=<slug>`.
- Studio: `search/LandingSection.tsx` + `LandingClient.tsx` (pick a Keyword
  or type a phrase → Make the page; edit title/description/H1/opening/
  sections/body/FAQ/hero plate/alt; Preview, Publish/Unpublish, Delete).
  `?open=landing&keyword=…` preselects. Styles `ld-*` (studio) and `lp-*`
  (public, in globals.css).
- This is the model to port to the other studios: same panel, site-specific
  offer and plates come from config.

## 2026-11-24, late night — The studio is shared code now

The creator studio no longer knows it is Bob's. Everything under
`src/app/creator`, `src/app/api/creator`, `src/lib/creator`,
`src/lib/studio-meta` and `src/components/creator` is the **shared tree**,
vendored from the private repo `dennis-j-mccarthy/creator-studio` by its
`sync.sh`. It reads three site files:

- `src/studio.config.ts` — who Bob is, the offer (the book), brand
  paragraph/tagline/logo/accent, the blog's public name and path (Musings at
  /musings), Meta ids, SEO audit pages, keyword kinds and seeds, Essence /
  pillar / tone defaults, nav (hide/soon/more/login/logout paths), brand kit
  assets, the leads hint, the plan's email line. Typed by
  `src/lib/creator/studio-types.ts`. Client-safe: data only.
- `src/studio.panels.tsx` — server-rendered panels appended to a tool's
  accordions. Here: Competitors and Google Ads on Search.
- `src/studio.adapters.ts` — content (Musing rows; create/update go through
  `src/lib/musing-ids.ts` and the publish hooks), pictures (the ad-image
  manifest + Photo rows; uploads land in the "Studio uploads" collection),
  uploads (`src/lib/image-store.ts`, Postgres Image rows), subscribers,
  auth (the admin cookie), notify (Resend for the Monday plan), seed
  (`src/studio-site/seed.ts`). Site modules are imported lazily inside the
  functions: eager imports created an init-time cycle that only the
  production bundle tripped over ("Cannot access 'r' before initialization").

Site-only code (never synced; listed in the repo's `studio/.site-only`):
`competitors/`, `google-ads/`, `blog/posts/` (the Musings manager),
`ads/` write-ups and routes, `src/studio-site/*` (seed data, seed keywords),
`src/lib/creator/{competitors,googleAds,concepts,in-market,gift-plan}.ts`.

New shared routes replacing admin ones inside the studio:
`POST /api/creator/upload`, `POST /api/creator/social/publish`,
`POST /api/creator/blog/save`, `GET /api/creator/blog/list`;
`/api/creator/library/add` goes through `pictures.add`.
`src/lib/meta/*` are one-line shims so the site's own admin routes keep
their imports.

To change the studio everywhere: edit in creator-studio, then in each site
`bash ../creator-studio/sync.sh && npx tsc --noEmit`, commit, let Vercel
build. Castellino is the source of record while the shared repo settles:
edit here, then re-import (see the repo README).
