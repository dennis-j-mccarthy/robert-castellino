# Progress — Bob Castellino Meta ads (saved Oct 10, 2026)

Resume point for the Meta operator task. Pairs with `docs/HANDOFF-meta-ads.md`
(the authoritative asset list). Read that first in a new session.

## STATUS: blocked — Meta Ads connector not attached to this session
- The task needs the custom **Meta Ads MCP connector** `https://mcp.facebook.com/ads`.
- Checked this Claude Code session's live connectors twice and via `/mcp`:
  **no Meta connector is loaded here.** Present instead: Vercel, Prisma, Obsidian,
  Claude Docs, chrome-devtools, visualize, scheduled-tasks, plus unauthenticated
  plugins (Slack/Notion/Asana/Figma/etc.). Gmail + Calendar show "no URL configured."
- "Added to the project" ≠ "loaded into this session." I can only call what's loaded.

### To unblock (do one, then re-run the task)
1. **Open a new conversation** — sessions pick up connectors at startup; this one
   began before the Meta connector existed.
2. If a fresh session *still* shows no Meta, it was added on claude.ai web but not to
   the **Claude Code** connectors — add `https://mcp.facebook.com/ads` there.
3. Fallback with no connector: drive **Ads Manager in Chrome** (Dennis is logged into
   Meta) and read numbers off-screen — slower, less clean, and may still not show
   The Book Works until Bob accepts the invite.

## The task (once the connector is live)
Operator rules: **read-only** unless Dennis says otherwise; anything built stays
**PAUSED**; only touch Bob's assets; don't guess numbers.
1. Confirm the connector sees **Castellino Photo `1788471615529613`** and
   **The Book Works `420087773108960`**.
2. If The Book Works is visible → deep read-only review of Bob's existing book ad:
   every campaign/ad set/ad (goal, budget, schedule, audience, placements); lifetime
   + weekly spend, reach, frequency, clicks, CTR, CPC, results; trends/warning signs;
   benchmarks; best/worst creative; plain-English verdict; keep / pause / change so it
   doesn't compete with the new Castellino Photo campaigns.
3. If not visible → say what's blocking and stop.

### Expected state (from the handoff, verify don't trust)
- **Castellino Photo `1788471615529613`** — active, USD, Mountain Time, card on file,
  **no campaigns yet**; connector can see it; Dennis has full access.
- **The Book Works `420087773108960`** — Bob already runs a book ad; as of the handoff
  the connector **could not see it** (invite not accepted, or ad account not ticked).
  Earlier draft Bob made: **Leads goal, US 18+, $16/day, no end date** — check if live.
- Business portfolio **Robert Castellino `1063669928561272`**; Page **Robert Castellino
  Photography, LLC `134235743309639`**; Instagram **not linked** to the ad account.

## Open side threads (not Meta-connector)
- **Gmail draft to Bob — PAUSED on Dennis's decision.**
  - Bob's email (found in Gmail): **`rlcastellino@gmail.com`**.
  - An existing draft **"ads account - i'm blocked"** (11:30 AM Oct 10) already holds
    this same body. No subject was supplied with the pasted copy.
  - Decision needed: reuse the existing draft, or create a fresh one (and the subject).
  - The email asks Bob to create/assign an ad account and add partner business ID
    **`1067645226727466`** with full control. (Dennis's Gmail login is
    `dennisjmccarthy@gmail.com`, not the Ignatius address — that mismatch is why Bob's
    earlier invites weren't landing.)
- **Ad-account access saga.** Bob used "Invite people" (email invite) to his Robert
  Castellino portfolio, but Dennis's Partners + Requests were empty when logged in as
  the Gmail → invite likely went to the wrong email. Business IDs seen: Ignatius
  `773157614615211`, a personal "Dennis" portfolio, and `1067645226727466` (the one in
  the email).

## Already shipped this session (committed + pushed to main)
- Holiday banner, hi-res CO plates + ad crops, PageHero overflow fix, blog
  publish (sitemap/JSON-LD/IndexNow), list-capture popup + `Subscriber`, social-draft
  autogen + `SocialDraft`, and **Boulder: Yesterday & Today** library + content kit
  (`43c340a`). See `docs/PROJECT-STATUS.md`. Note: local checkout is a few commits
  behind `origin/main` (which has the handoff) — `git pull` before committing here.
