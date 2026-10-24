# Ads maker setup (`/admin/ads`)

The Ads maker composes a Facebook / Instagram ad from Bob's photographs and
creates it **paused** in his Meta ad account through the Marketing API:
image → creative → ad. Nothing spends until you press **Activate** (which
asks you to confirm). Live status and 7-day spend/clicks/CTR show in the
table under the maker, with an Ads Manager link per ad.

## Env vars

| Var | Required | Notes |
|---|---|---|
| `META_ADS_TOKEN` | yes | User or system-user token with `ads_management` + `ads_read`. The Page token (`META_PAGE_TOKEN`) **cannot** create ads; it is only used as a fallback for reads it happens to serve. |
| `META_AD_ACCOUNT_ID` | no | Defaults to `1788471615529613` (Castellino Photo). With or without the `act_` prefix. |
| `META_PAGE_ID` | no | Defaults to `134235743309639` (Robert Castellino Photography). The Page the ads are "from". |
| `META_IG_USER_ID` | no | If set, the creative is also attributed to that Instagram account (`instagram_actor_id`). |

Tokens are never logged or returned by any route.

## Getting `META_ADS_TOKEN`

1. **App use case.** In the Meta app (developers.facebook.com → your app, the
   same one used for the Social tool): **Use cases → Add use case → "Create and
   manage ads with Marketing API"** (older dashboards: add the **Marketing API**
   product). This exposes `ads_management` / `ads_read` to the app.
2. **Permissions.** While the app is in Development mode, people with a role on
   the app (admin/developer/tester) can use `ads_management` on ad accounts
   they already have access to, without App Review. Dennis and Bob both have
   full access to Castellino Photo.
3. **Get a user token** the same way as the Page token
   (see `docs/META_SETUP.md`): Graph API Explorer → select the app → **Get User
   Access Token** → tick `ads_management`, `ads_read`, `business_management`,
   `pages_show_list`, `pages_read_engagement` → Generate → approve as the
   ad-account admin.
   - The OAuth dialog route works too: `/api/admin/meta/connect` already
     requests `ads_management` in `SCOPES`; the long-lived *user* token it
     stores (`MetaConnection.fbUserToken`) can be copied into `META_ADS_TOKEN`.
4. **Make it long-lived.** Access Token Debugger
   (developers.facebook.com/tools/debug/accesstoken) → paste → **Extend Access
   Token** (≈60 days). For a token that doesn't expire, create a **System User**
   in Business Settings (portfolio *Robert Castellino*, `1063669928561272`),
   assign it the ad account + Page, and generate a token with the same scopes.
5. Set `META_ADS_TOKEN` in `.env.local` and in Vercel (Production + Preview),
   then redeploy.

Check it works: `GET /api/admin/ads/campaigns` (signed in) should list
"Book · Signed copy $49.95 · Holiday 2026".

## Finding the ad account id

Ads Manager → the account dropdown (top-left) shows the name and id, or the
URL has `act=1788471615529613`. Business Settings → Accounts → Ad accounts
lists them too.

## What a submit does (and how to recover)

`POST /api/admin/ads/[id]/submit`:

1. `POST /act_{id}/adimages` with the public image URL → stores `imageHash`.
2. `POST /act_{id}/adcreatives` with `object_story_spec.link_data` (image,
   primary text, headline, description, link, CTA) → stores `creativeId`.
3. `POST /act_{id}/ads` with `status=PAUSED` → stores `metaAdId`.
4. `GET /{creativeId}/previews?ad_format=MOBILE_FEED_STANDARD` → `previewUrl`.

Each step is skipped if its id is already stored, so a failed submit (status
`failed`, error shown in the table) can be resent and resumes where it
stopped. Meta creatives are immutable: editing copy on a draft that already
has a creative but no ad clears `creativeId` so a fresh one is made; once an
ad exists only name/destination can change (make a new ad instead).

**Duplicate** reuses the stored creative to create one more paused ad per
selected ad set (e.g. the six "Book" audiences).

## Migration

`prisma/migrations/0008_ad_draft` adds the `AdDraft` table. `npm run build`
runs `prisma migrate deploy`, so it applies on deploy; locally run
`npm run db:migrate && npm run db:generate`.

## Gotchas

- Image URLs must be public; `/assets/...` paths are resolved against
  `https://robertcastellino.com`, so a brand-new image must be deployed before
  it can be used in an ad.
- Preview iframe URLs from Meta expire after a day or so; the **Preview**
  button re-fetches one.
- Ad effective status also depends on the ad set and campaign being active;
  the pill shows `paused` for `ADSET_PAUSED` / `CAMPAIGN_PAUSED` too, with the
  raw Meta status in the tooltip.
- The table is the account's truth: on every load, ads that exist in Meta but
  not here (made in Ads Manager, by the API, from another device) are pulled
  in as rows (`syncFromMeta`), so Preview / Activate / Pause / View in Meta
  work on all of them. Archived ads are skipped.
- **The Meta app must be Live (published).** In Development mode Meta rejects
  new creatives with subcode 1885183 ("created by an app that is in
  development mode"). Publishing needs a privacy-policy URL — the site's
  `/privacy` page is set in the app's Basic settings.
- **Book ads use book plates only.** Entries in `src/data/ad-images.json`
  with a `bookPage` (page in `resources/colorado-life-and-light-book.pdf`)
  are the plates verified to be in the book; the maker defaults to the
  "In the book" filter and blocks Send when a book campaign is paired with a
  non-book image. When adding a photo that is in the book, set its
  `bookPage`.

## Image manifest
`src/data/ad-images.json` lists the photos the Ads maker offers. Regenerate after adding photos:

```
python3 - <<'PY'
import os,re,json
root="public/assets/collections"; out=[]
for dp,_,fs in os.walk(root):
    for f in fs:
        if re.search(r"\.(jpe?g|png|webp)$",f,re.I):
            rel=os.path.relpath(os.path.join(dp,f),root).replace(os.sep,"/")
            out.append({"src":f"/assets/collections/{rel}","collection":rel.split("/")[0] if "/" in rel else "","label":re.sub(r"[-_]+"," ",re.sub(r"\.(jpe?g|png|webp)$","",f,flags=re.I))})
out.sort(key=lambda x:(x["collection"],x["label"])); json.dump(out,open("src/data/ad-images.json","w"),indent=0)
PY
```
