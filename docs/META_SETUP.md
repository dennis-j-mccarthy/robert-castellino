# Connecting the Social tool to Facebook (and Instagram)

This wires `/admin/social` to Bob's real Facebook Page so the app can
**publish and schedule posts itself** — no browser automation. It's Phase 1
(Facebook publishing); ads and Instagram build on the same connection.

## What you get after setup
- An admin page at **`/admin/social`** with a **Connect Facebook** button and a
  composer that publishes or schedules posts to Bob's Page via Meta's Graph API.

## The one-time setup (≈15 min)

### 1. Create a Meta app
1. Go to **developers.facebook.com → My Apps → Create App**.
2. Type: **Business**. Name it e.g. "Castellino Studio Tools".
3. Note the **App ID** and **App Secret** (Settings → Basic).

### 2. Add the Facebook Login product
1. In the app dashboard: **Add product → Facebook Login → Set up**.
2. Facebook Login → **Settings → Valid OAuth Redirect URIs**, add both:
   - `http://localhost:3000/api/admin/meta/callback` (local dev)
   - `https://robertcastellino.com/api/admin/meta/callback` (production)
3. Save.

### 3. Give the app its permissions (Development mode is enough for Bob)
While the app is in **Development mode**, people with a **role on the app**
(admin / developer / tester) can use the advanced permissions on their **own**
Pages **without full App Review**. So:
1. App dashboard → **App roles → Roles** → add **Bob's Facebook account** as an
   **Admin** or **Tester** (he accepts the invite from his account).
2. The scopes the app requests: `pages_show_list`, `pages_read_engagement`,
   `pages_manage_posts`, `pages_manage_engagement`, `business_management`,
   `read_insights`, `ads_management`, `instagram_basic`,
   `instagram_content_publish`.
   > Full **App Review** is only needed later, if people *other than* app-role
   > users will use the tool.

### 4. Set the environment variables
In `.env.local` (dev) and in Vercel (prod):
```
META_APP_ID=<your app id>
META_APP_SECRET=<your app secret>
# optional:
# META_GRAPH_VERSION=v21.0
# META_REDIRECT_BASE=https://robertcastellino.com
```

### 5. Run the migration
The `MetaConnection` table stores the tokens. It ships as migration
`0007_meta_connection` and applies automatically on deploy
(`prisma migrate deploy` runs in the build). Locally:
```
npm run db:migrate   # or: npx prisma migrate deploy
npm run db:generate
```

### 6. Connect
1. Sign in to `/admin`, open **Social**.
2. Click **Connect Facebook**, log in as Bob (or as a user with a role on the
   app), and approve the Castellino Page.
3. You'll land back on the Social page showing **Connected to Robert
   Castellino Photography**.

## Using it
- **Publish now**: writes the post to the Page immediately.
- **Schedule**: set a date/time ≥ ~15 min out (Meta's rule: 10 min–6 months).
- **Image**: paste a **public** image URL (e.g. one of Bob's
  `robertcastellino.com/assets/...` photos). Graph fetches it server-side.

## Tokens
- The Page access token is long-lived and doesn't normally expire.
- The user token is long-lived (~60 days); the Social page shows when to
  reconnect. Click **Reconnect** to refresh.

## Notes / limits
- **Instagram publishing** needs the Page's linked IG Business account (Phase 3).
  The connection already captures it when present (`igUsername`).
- A Page post with an image uses `/{page-id}/photos`; text-only uses
  `/{page-id}/feed`. Scheduling sets `published=false` + `scheduled_publish_time`.
- Disconnecting here forgets the stored token; Bob can also remove the app from
  **facebook.com → Settings → Business Integrations**.
