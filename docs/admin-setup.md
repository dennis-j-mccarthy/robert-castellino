# Admin / DB / Contact — turning it on

Groundwork only. The public site works fine with none of this configured —
it falls back to the static data files in `src/data/`. To turn on the
admin, contact email, and DB-backed editing, do the following on the
deployment.

## 1. Provision Postgres (Vercel Postgres)

1. In the Vercel dashboard, pick this project → Storage → Create →
   **Postgres**. Region near the deployment.
2. Connect to the project. Vercel will set `DATABASE_URL`,
   `DATABASE_URL_UNPOOLED`, etc. on the project automatically.
3. **Pull the env to your laptop** so you can run migrations:
   ```bash
   vercel link        # if you have not already
   vercel env pull .env.local
   ```

## 2. Run the migration

From your laptop, with `DATABASE_URL` in `.env.local`:

```bash
npm run db:migrate:dev -- --name init
```

This creates the schema in the new database. (In CI / production after the
first time, use `npm run db:migrate` which only applies committed
migrations.)

## 3. Seed the static data into the DB

```bash
npm run db:seed
```

This mirrors the 30 musings and 5 gallery collections (85 photos total)
from the static files into Postgres. Run once. **Do not run again after
Bob starts editing** — it will clobber his changes.

## 4. Pick an admin password and set the auth env vars

Generate a bcrypt hash of the password you want Bob to use:

```bash
npm run admin:hash-password -- 'whatever-password-he-picks'
```

Generate a JWT signing secret:

```bash
openssl rand -base64 32
```

Set in the Vercel dashboard → Project → Settings → Environment Variables:

| Name                  | Value                                                            |
| --------------------- | ---------------------------------------------------------------- |
| `ADMIN_EMAIL`         | `rlcatellino@gmail.com` (or whichever address Bob will sign in with) |
| `ADMIN_PASSWORD_HASH` | The bcrypt hash from above                                       |
| `ADMIN_JWT_SECRET`    | The random secret from above                                     |

## 5. Wire contact email (Resend)

1. Create a Resend account: <https://resend.com>.
2. Verify the sending domain (or use Resend's sandbox sender for testing).
3. Generate an API key.
4. Set on Vercel:

| Name                 | Value                                                |
| -------------------- | ---------------------------------------------------- |
| `RESEND_API_KEY`     | The Resend API key                                   |
| `CONTACT_TO_EMAIL`   | `rlcatellino@gmail.com`                              |
| `CONTACT_FROM_EMAIL` | `studio@robertcastellino.com` (must be on a verified Resend domain) |

If you ever want to skip outbound email, leave `RESEND_API_KEY` unset —
submissions still write to Postgres and Bob can read them at
`/admin/contact`.

## 6. (Later) Enable photo uploads (Vercel Blob)

1. Vercel dashboard → Storage → Create → **Blob** → connect to the
   project.
2. `BLOB_READ_WRITE_TOKEN` will appear in your env vars automatically.
3. Photo upload UI in `/admin/collections/[slug]/photos` is wired against
   the `@vercel/blob` SDK — when the token is present, uploads land in
   the project's Blob store and the URL is saved on the `Photo` row.

## What is safe to deploy without flipping any of this on

Everything in this commit is additive:

- Public pages (`/`, `/about`, `/timeline`, `/gallery`, `/book`,
  `/musings`, `/musings/[id]`, `/contact`) render exactly as they did
  before. They use `src/lib/data-source.ts`, which short-circuits to the
  static files when `DATABASE_URL` is unset.
- The `/admin/*` routes are protected by middleware; with no
  `ADMIN_JWT_SECRET`, anyone landing there sees a "setup needed" page.
- The contact form posts to `/api/contact`. With nothing wired, the
  endpoint returns a 503 and the form surfaces the error to the user.
  As soon as either `DATABASE_URL` or `RESEND_API_KEY`+`CONTACT_*` are
  set, the form starts working.

## Local dev

```bash
cp .env.example .env.local
# fill in DATABASE_URL, ADMIN_*, RESEND_API_KEY, etc.
npm run db:migrate:dev -- --name init
npm run db:seed
npm run dev
```

Visit <http://localhost:3000/admin/login>.

## What still needs to be built (next iteration)

The admin pages currently *list* musings, collections, and submissions
but do not yet have create / edit / delete forms. The data layer and
auth are in place; adding CRUD is straightforward server actions against
the existing models. Telling Bob this is "groundwork, not finished
admin" is fair.
