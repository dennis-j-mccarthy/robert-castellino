# Build queue — morning handoff (built 2026-10-13, for 10-14 AM)

Dennis asked for "a watchable page that will populate both Meta posts and ads tomorrow
morning." Here is exactly what got built, what it does, and what it honestly can't do.

## What's on the page now
A **Build queue** section at the top of the gift-series plan page (`public/gift-series.html`),
above the Schedule and Bob's cross-post list. It reads whatever you've marked (shared DB,
`GiftDraft` row `id="ads"`) and shows, grouped by date:

- each marked **Post** / **Ad**, its channel, and **where it can actually be built**;
- a readiness line per item (what's missing before it can go);
- three counters: *ads ready to build · ads need info · posts by hand*.

Routing (off each slot's channel label):
- **Facebook ad** → *Operator builds · PAUSED* (the only thing buildable from here).
- **Instagram ad** → *Needs IG account linked* (blocked).
- **Pinterest / TikTok / other ad** → *not Meta ads*.
- **Any organic post** (FB, IG, Pinterest, Email) → *by hand / Business Suite*.

## The one hard limit — read this
**The page does not publish to Meta, and nothing published overnight.** It can't:
- there's no Meta Graph API token in this app, I can't set Vercel env vars (your team 403s
  my access), and untested publish code touching Bob's public page + ad spend is the one
  thing I won't leave running unattended;
- the Meta **Ads connector lives inside a Claude session**, not in the website. A web page
  can't call it.

So "populate Meta" = **I do it, as operator, in a session** — and **ads only, PAUSED**.
Organic posts are manual/Business Suite; **Instagram can't go through the connector at all**
(your page already says IG isn't linked); Pinterest/TikTok/Email aren't Meta.

## The morning flow
1. Mark a batch on the plan page — tick **Ad**, pick the **ad set**, set a **date**. (Posts:
   tick **Post** + date; those you or Bob publish by hand.)
2. Open a Claude session with the Meta connector and say: **"build Nov 28"** (or whatever date
   group). I create the Facebook ads **PAUSED** in Castellino Photo `1788471615529613` and
   report the ad IDs.
3. You paste each ad ID into its post's **Meta ad ID** box (the live "built ✓" status can't
   auto-write-back — the live DB only lives in Vercel and I can't sign in there from here).
4. Bob reviews in Ads Manager and activates. **Bob approves anything public and pays all spend.**

## Before an ad batch can be built — don't-guess items
- **Budget**: the plan has **no budget field yet**. Every ad needs a **daily number per ad set**
  from you or Bob (ad set 4 currently says "$50–90/day" — that's a range, not a number). Have
  the numbers ready; I set them when building.
- **Objective**: not stored either — tell me the goal per batch (sales/traffic/etc.).
- **Audiences A–E**: still **don't exist** in Meta. If a batch uses them, they get created first.

## Connector + account state (checked tonight, read-only)
- Working Meta connector **responds** on Castellino Photo `1788471615529613` — **not** blocked.
  (A separate `meta-ads` entry shows "needs auth"; that's a duplicate, ignore it — the one I use
  is authorized.)
- Account already holds **one PAUSED campaign**: "Book · Signed copy $49.95 · Holiday 2026".

## One thing to confirm
Only **one** item is marked right now: post `01`, *Instagram feed*, flagged **Post** for
**Oct 14** — but that slot's own label is **Sat Nov 28 · the centerpiece**. Looks like a test
tap. It's IG, so it can't be built here regardless. Clear it or re-date it when you're back.

## Verified
- Build queue renders with no JS error; empty state correct (localhost).
- Routing / date-grouping / counters unit-tested, 12/12 pass
  (scratchpad `bq-test.mjs`).
