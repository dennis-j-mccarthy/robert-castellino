# Handoff — Bob Castellino Meta ads (Oct 10, 2026)

Dennis runs the marketing. Bob (Robert Castellino) is the client: he approves anything public and pays all ad spend.

## Rules
- Only touch Bob's assets listed below. Never read or act on any other account the login can see (Ave Maria, SGA, Ignatius, Augustine Institute, Empowering Education, J4C, Dennis's own).
- Read-only unless Dennis says otherwise. Anything built stays **PAUSED** until Dennis and Bob approve.
- Don't guess numbers.

## Meta assets
| What | Name | ID | Status |
|---|---|---|---|
| Business portfolio | Robert Castellino | `1063669928561272` | Holds the Page and the new ad account |
| Ad account | Castellino Photo | `1788471615529613` | Active, USD, Mountain Time, **card on file**, no campaigns yet. Dennis has full access. Meta connector can see it. |
| Facebook Page | Robert Castellino Photography, LLC | `134235743309639` | Dennis has full access. Not yet linked to any ad (normal; links on first ad). |
| Instagram | — | — | **Not linked** to the ad account. Bob: Business settings → Instagram profiles → Add, then assign to Castellino Photo. |
| Other portfolio | The Book Works | ad account `420087773108960` | Bob already runs a book ad here. Dennis invited with View performance + Page Insights, but the connector still can't see the account (invite not accepted yet, or the ad account wasn't ticked). Earlier Bob drafted an ad here: Leads goal, US 18+, $16/day, no end date — check whether it's live. |
| Other portfolio | Robert Castellino (purple) | Page `231931297151326` "Colorado: Life and Light on the Land" | Book's own Page. Only Bob. Not used yet. |

## Meta connector
Custom connector URL `https://mcp.facebook.com/ads` (official Meta Ads MCP, beta). It covers ads, audiences, creative, pixel and ad insights. It does **not** return Page followers, demographics or organic post reach — those come from Business Suite → Insights.

## Website (repo dennis-j-mccarthy/robert-castellino, Vercel → robertcastellino.com)
- `public/gift-series.html` (live, unlisted) now has four sections: 1 Audience (specs A–E), 2 What we have now (the 50-post deck), 3 What's running (schedule, budget, ad copy, organic calendar, tracking checklist, day-one steps), 4 Performance (empty).
- **No Meta Pixel** on the site. Checkout is Stripe hosted; buyers return to `/checkout/success`. Pixel + Conversions API checklist is in section 3 of the page.
- Checkout can't take discount codes (`allow_promotion_codes` not set).

## Price change — decided, not done yet
Book: **$49.95, signed at no extra charge, list price $60, ongoing** (not a Dec 19 sale).
Change in: `src/data/pricing.ts` (basePrice 49.95, signedSurcharge 0, add list price 60), `src/app/book/BookBuy.tsx` (signed note), `src/app/book/page.tsx` (price display + JSON-LD price), `public/gift-series.html` (≈50 captions say "15% off signed copies, code COLORADO15, through Dec 19"; offer box says "$75 · signed $85"; lockups say "15% off"; budget note uses $85/$97), `docs/creative-brief.md`, `docs/PROJECT-STATUS.md`.
Watch out: the page's **Save** button stores edited captions in Postgres (`GiftDraft`), and saved edits override the HTML for everyone. Check `GET /api/gift-series` before assuming the HTML wording is what visitors see.

## Audiences planned (none created)
- A Warm: Page + IG engagers, 365 days (custom)
- B 1% US lookalike of A
- C Colorado, 30–65+, landscape photography / fine art / RMNP / hiking / coffee-table books / interior design (saved)
- D US 35–65+, Colorado interests + gifts/holiday shopping, Nov 3 – Dec 17 (saved)
- E Visited /book or a print in 14 days, no purchase (needs pixel)

## Plan
Ads start ~Nov 3 at $30–50/day (A, B, C), holiday push Nov 17 – Dec 12 at $50–90/day adding D and E. Sales objective; optimize for purchases once the pixel fires, landing-page views until then. Budget reasoning needs updating for $49.95 + $12 shipping ≈ $62 per order.

## Open items, in order
1. Get the connector to see The Book Works `420087773108960`, then do a deep performance review of Bob's existing book ad (campaigns, spend, results, trend, creative, overlap with new campaigns).
2. Apply the $49.95 price change on site + copy.
3. Bob connects Instagram to Castellino Photo.
4. Install Meta Pixel + CAPI on the site.
5. Build audiences A–E and the campaign in Castellino Photo, PAUSED; report IDs.
6. From Bob: book margin (sets stop-loss cost per sale), Christmas order-by date, Page follower numbers from Business Suite → Insights.
7. Fluid Pathways (repo dennis-j-mccarthy/fluid-pathways): ads + research still to do.
