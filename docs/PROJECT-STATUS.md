# Project status — Castellino / Fluid Pathways

_Updated 2026-10-01. Repo: `/Users/dennis.mccarthy/robert-castellino`, branch `main`, pushed to origin. Latest commit at writing: `d2e6509`._

Two workstreams right now: the **gift-series ads** and the **punch list**. Separate from this repo there's also the **Fluid Pathways** site, which has the content/post engine.

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
