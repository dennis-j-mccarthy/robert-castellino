# Project status — Castellino / Fluid Pathways

_Updated 2026-10-05. Repo: `/Users/dennis.mccarthy/robert-castellino`, branch `main`, pushed to origin. Latest: `5968b9c` (hi-res plates + ad crops). Prior: `bb3bea7` (SEO + ad exports)._

### Done 2026-10-05 (Streams run rmuvlokp4)
- **Holiday gift banner** — site-wide `.promo` bar → `/book` ("Give the gift of Colorado"), live and verified (desktop/mobile/inner page); hidden on `/admin`. No discount code shown (still a placeholder — see decision #2). `src/components/gift-banner.tsx`.
- **Hi-res scans into the pipeline** — 18 photographic plates from the 1651px `CO Life & Light` page scans brought into `gift-series/` (15 new + aspen-durango/sievers-snowmass/lake-isabelle upgraded), captions trimmed, square ~1400px, added to `library.json`; regenerated the 5-size ad crops (now native/downscaled, not upscaled). The "26 scans" = 22 jpgs + 4 PDFs; of the 22, 4 are text pages (excluded). Full-res originals stay in `~/Downloads` (not git).


Two workstreams right now: the **gift-series ads** and the **punch list**. Separate from this repo there's also the **Fluid Pathways** site, which has the content/post engine.

## Status & priority (2026-10-02)

### Done this session
- **SEO** — metadata + OpenGraph/Twitter, `src/app/robots.ts`, `src/app/sitemap.ts`, Person JSON-LD (Bob) sitewide, Book JSON-LD on `/book`. Verified live (`/robots.txt`, `/sitemap.xml`, schema on home + book). Marked done on the punch list.
- **Multi-format ad exports** — 30 files (6 hero plates × 5 sizes) in `public/gift-series/ads/` + README. Clean crops; 9:16/2:3 are upscaled from ~1100px source (reshoot for final paid). Marked done.

### Two decisions to make first (priority)
1. **Which punch-list copy is canonical** — claude.ai (complete, where I've been marking things done) vs website (`robertcastellino.com/punch-list.html`, seeded once). They're separate databases and drift. Pick one; I'll keep everything there and re-sync the other.
2. **Real discount code** — replace the `COLORADO15` placeholder across the gift-series page.

### Ready to peel solo next (no Bob, no outside account)
Clean: draft the first few mailings; set the mailing cadence; mine the book PDF into a content-source file; a homepage "latest work" section; verify + mark the editable/saveable posts tool (the gift-series already edits + saves to Postgres). _(Done 2026-10-05: holiday banner; hi-res scans → gift-series.)_
Bigger builds: admin CRUD for musings/collections; a post-library page.
Write-ups only: print-on-demand options; paid-campaign scope.

### Blocked (need Dennis/Bob or an account)
Real code, Stripe discount, the book photo (shoot), list-quality audit, Ads Manager, scheduler/auto-post, any ESP-dependent capture/welcome/newsletter, GA4 + Search Console (need IDs/verification), and actually launching/posting.

## Remote / how to sync on the satellite device

```
git clone https://github.com/dennis-j-mccarthy/robert-castellino.git
# or, if already cloned:
git pull origin main
```

- Secrets are not in git (correct). To run locally: `vercel env pull`. To edit the static pages and push, you don't need them.
- The book PDF is git-ignored and stays local (`resources/*.pdf`) — it won't come down with a clone.
- Deploy is automatic: push to `main` → Vercel builds `prisma migrate deploy && prisma generate && next build`. Build fails closed if Postgres is unreachable.

---

## 1. Gift-series ads

Full detail is in `HANDOFF-gift-series.md`. Short version:

- Live, unlisted: https://robertcastellino.com/gift-series.html
- Page: `public/gift-series.html` (static file, not a Next route). Images in `public/gift-series/`.
- Ads click through to https://robertcastellino.com/book.
- Edits save to Postgres (`GiftDraft`, route `src/app/api/gift-series/route.ts`, migration `0003`). PUT needs the admin session; GET is public.
- `COLORADO15` is a placeholder code — global-replace when the real one exists.
- Book facts: $75, signed $85, ships from Boulder ~3 business days, 11×11 in, 168 pages.
- Open item: still need a real photo of the book on a table; generated stand-ins aren't good enough to treat as final (see HANDOFF for the three frames to shoot).

---

## 2. Punch list (the main work this session)

A shared tracker for both brands (Robert Castellino + Fluid Pathways). Two states per item, a per-item note thread between Dennis and Bob, review links, categories, add/edit/delete.

### Two copies — pick one as canonical

This is the one decision still open.

1. **claude.ai version** — the working copy. URL: https://claude.ai/artifact/EtVyWPN3Jsxjwqi6xSNE1o . Backed by the artifact's own database. All the item content I added this session lives here (it's the most complete).
2. **Website version** — https://robertcastellino.com/punch-list.html . Backed by this repo's Postgres. Seeded once from the claude.ai copy (51 items at seed time).

They are **separate databases and will drift** as each is used. Decide which is the real one; I'll keep everything on that and stop dual-maintaining.

### Website version — files

- Page: `public/punch-list.html` (static file, not a Next route). Unlisted (`noindex`).
- API: `src/app/api/punch-list/route.ts`. `GET` public, `PUT` open (no login) so both people can edit — size/shape bounded. Whole-state model: one row, id `current`, in table `PunchList` (migration `prisma/migrations/0004_punch_list`).
- The page loads from the API, saves on a debounce, and polls every 8s for the other person's changes. Falls back to `localStorage` if the API is unreachable.
- Identity by URL: Dennis `?me=dennis`, Bob `?me=bob` (remembered after first visit).
- Security note: PUT is open. Fine for an unlisted internal tool. If we want writes behind the admin login later, that's a small change.

### How it works (for using it, not just reading it)

- Hierarchy: brand accordion (closed by default, one open at a time) → category (collapsed by default, one open at a time) → items.
- Each item: **In progress** checkbox (green), **Done** checkbox (blue), **Next up** pill (red, a priority flag — not a status), a comment thread (💬), and a link control.
- Links: the ✎ icon adds/edits a review URL; once set, a ↗ icon opens it and a gold ★ marks the item.
- Stars: a gold ★ means the item has a review link. Star counts show on category and brand headers so you can see where the review-ready work is without opening sections.
- Notes: per-item thread, Dennis blue / Bob green, editable and deletable. A filled teal badge + count shows when an item has notes.
- Counts (done/total) roll up three places: top progress bar, brand header, category header.
- Add item (＋), rename (pencil), delete (red trash, two-step).

### What's on the list now

- Robert Castellino and Fluid Pathways each have their original build items plus items added this session: launch/holiday campaign, real discount code, Stripe discount, homepage banner, book photo, hi-res scans, multi-format ad exports, Ads Manager campaigns, print-on-demand, email basics (list quality → first mailings → cadence), per-book social suites, Bob's post library, the editable/saveable posts tool, Local/Maps (GBP verification → Maps, map embed, NAP, citations, Apple/Bing, map-pack page), competitive evaluation, paid-ad investigation (both sites), auto-posting (both sites).
- Items already done and linked: the gift-series suite (links to gift-series.html) and the creative library (links to /gallery).

### Sharing with Bob

- claude.ai version: Share → invite Bob by email as Editor, keep it invite-only (a public link drops outside editors to view-only).
- website version: just send the `?me=bob` link; the open PUT lets him edit.

---

## Related: Fluid Pathways site (separate repo)

`/Users/dennis.mccarthy/fluid-pathways`, live at fluidpathways.com. Has the content/post engine (article → IG/FB/Pinterest/email), image library, admin. Login `bob` / `fp_2026`. The OpenAI image endpoint used to generate imagery lives there (`/api/admin/generate-image`); this photo-site repo has no OpenAI key of its own.
