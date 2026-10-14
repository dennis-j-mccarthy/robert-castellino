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
   group). For each Facebook ad I add a **creative + ad into the matching existing ad set** in
   Castellino Photo `1788471615529613`, **staged as a draft**, and report the ad IDs.
3. You paste each ad ID into its post's **Meta ad ID** box (the live "built ✓" status can't
   auto-write-back — the live DB only lives in Vercel and I can't sign in there from here).
4. **Bob** opens Ads Manager, reviews the draft ("Review and publish"), and publishes. The ads
   publish **paused**; Bob activates when ready. **Bob approves anything public and pays all spend.**

### Hard rule for the build session
The connector runs in **draft mode**: creates are staged as DRAFT, and `ads_activate_entity`
**publishes them LIVE/ACTIVE**. So the build session **stages the drafts and stops — it must
NOT call `ads_activate_entity`.** Publishing is Bob's step in Ads Manager, not the operator's.
"Build" here means *stage a draft*, never *go live*.

## What's already set up (checked tonight, read-only) — so a build is mechanical
The holiday structure already exists in Castellino Photo `1788471615529613`, all **PAUSED**:
- Campaign **"Book · Signed copy $49.95 · Holiday 2026"** `120251354161250171` — CBO
  **$30/day**, objective **OUTCOME_TRAFFIC**. (Budget & objective live here, not per item. If
  you want the holiday push bigger, raise this one number — optional, not a blocker.)
- Ad sets **1–6 already built** (audiences baked in). A Facebook-ad build = add a creative +
  ad into the right one:

  | Plan "ad set" | Meta ad set | ID |
  |---|---|---|
  | 1 | Warm · Page engagers + followers | `120251354238940171` |
  | 2 | Lookalike 1% · followers · 45+ | `120251354162580171` |
  | 3 | Colorado home · 45+ · interests | `120251354163940171` |
  | 4 | Homesick gift buyers · US 45+ · Nov 17–Dec 12 | `120251354164530171` |
  | 5 | Photo-book people · US 45+ · interests | `120251356932420171` |
  | 6 | Boulder, CO locals · 45+ | `120251356932940171` |

So the only per-item inputs are the ones the queue checks: **ad set chosen** and **date**. The
creative (image + copy) comes from the post's plate on the page.

## Connector state
- Working Meta connector **responds** — not blocked. (A separate `meta-ads` entry shows "needs
  auth"; that's a duplicate — the one I use is authorized.)

## One thing to confirm
Only **one** item is marked right now: post `01`, *Instagram feed*, flagged **Post** for
**Oct 14** — but that slot's own label is **Sat Nov 28 · the centerpiece**. Looks like a test
tap. It's IG, so it can't be built here regardless. Clear it or re-date it when you're back.

## Verified
- Build queue renders with no JS error; empty state correct (localhost).
- Routing / date-grouping / counters unit-tested, 12/12 pass
  (scratchpad `bq-test.mjs`).
