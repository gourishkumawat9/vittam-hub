# Deploying the API on Render (free plan)

The API (`apps/api`) moved from Railway to Render's free plan in October 2026
after the Railway trial ended. The website stays on Vercel, the database on
Neon, Redis on Upstash. Only the API host changes, and `api.vittamhub.com`
keeps its name, so the website, cookies and Google sign-in need no changes.

## What the free plan means

| | |
|---|---|
| Cost | $0. 750 free instance hours per month per workspace, enough for one service running all month. |
| Sleep | Spins down after 15 minutes with no requests. The next request waits about one minute while it wakes. |
| Size | 512 MB RAM, 0.1 CPU, one instance. |
| Not available on free | Pre-deploy command, background workers, persistent disk, scaling past one instance. |
| Region | Singapore, next to the Neon database. Cannot be changed after creation. |

Consequences for this codebase:

- **Migrations run at container start** (`infra/docker/api-start.sh`) instead
  of as a pre-deploy step. A failed migration stops the new version from
  booting, so the deploy fails its health check and Render keeps serving the
  previous version.
- **BullMQ cron jobs only run while the service is awake.** The nightly trust
  recompute (03:00 UTC) and hourly watchlist check are skipped while it sleeps.
  Trust v2 runs in shadow mode, so nothing user-facing depends on them yet.
- **Queued emails** are processed by the in-process BullMQ worker once the
  service is awake; the request that queues them is what wakes it.
- `/health` fails only on Postgres, never on Redis (unchanged).

When real users arrive, upgrading the same service to a paid instance type
removes the sleep without any code change; at that point the migration can
move back to a pre-deploy command.

## One-time setup (click by click)

Use Chrome signed in as the project owner.

### 1. Create the Render account

1. Open https://dashboard.render.com/register
2. Click **GitHub** and approve. (GitHub sign-in is simplest because Render
   needs repo access anyway. Google sign-in also works; you then connect GitHub
   in step 2.)
3. Skip any "create a service" tour.

### 2. Create the service from the Blueprint

1. In Render, click **New +** (top right) → **Blueprint**.
2. Connect GitHub if asked, and give Render access to
   `gourishkumawat9/vittam-hub` (choosing "Only select repositories" is fine).
3. Pick the `vittam-hub` repo, branch `main`.
4. Render reads `render.yaml` and shows one service, **vittamhub-api**, plan
   **Free**. Click **Deploy Blueprint** (or **Apply**).
5. The first deploy will fail because the variables are not set yet. That is
   expected.

### 3. Copy the environment variables from Railway

Never paste these into a chat or a document. Copy them straight from one site
to the other.

1. Open https://railway.com/dashboard → the VittamHub project →
   **vittamhub-api** service → **Variables** tab.
2. Click **Raw Editor** (top right of the variables list). It shows every
   variable as `NAME=value` lines. Select all and copy.
3. In Render, open **vittamhub-api** → **Environment** (left menu).
4. Click **Add from .env**, paste, then click **Add variables**, then **Save,
   rebuild, and deploy**.
5. Check two values before saving:
   - `REDIS_URL` should contain `upstash.io`. If it contains `railway` or
     `rlwy.net`, that Redis lived on Railway and is gone; see "If Redis was on
     Railway" below.
   - `DATABASE_URL` and `SHADOW_DATABASE_URL` should both contain `neon.tech`.
   - `NODE_ENV` should be `production`. `PORT` can be copied or left out;
     Render supplies one either way.

If Railway no longer shows the variables, rebuild them from the source
dashboards instead: the Neon connection string (Neon → project → **Connect**)
for both `DATABASE_URL` and `SHADOW_DATABASE_URL` (Prisma refuses to start
without the second one),
the Upstash Redis URL (Upstash → database → **Connect**, the `rediss://` one),
`RESEND_API_KEY` from Resend, `GOOGLE_CLIENT_ID/SECRET` from Google Cloud
Console, `APP_URL=https://vittamhub.com`, `API_URL=https://api.vittamhub.com`,
`EMAIL_FROM` as before, and two **new, different** random 64-character strings
for `JWT_ACCESS_SECRET` and `JWT_REFRESH_SECRET` (new secrets only log everyone
out once).

### 4. Wait for the first green deploy

1. In Render, open **vittamhub-api** → **Events** / **Logs**.
2. Wait for "Your service is live". The logs should show the Prisma migration
   output and then `VittamHub API listening on :…`.
3. Open the `https://vittamhub-api.onrender.com/health` link shown at the top
   of the service page. It should return JSON with the database status `ok`.

### 5. Point `api.vittamhub.com` at Render

1. In Render, **vittamhub-api** → **Settings** → **Custom Domains** →
   **Add Custom Domain** → type `api.vittamhub.com` → **Save**. Render shows the
   target it wants, normally `vittamhub-api.onrender.com`.
2. Open the DNS provider for `vittamhub.com` (Cloudflare:
   https://dash.cloudflare.com → `vittamhub.com` → **DNS** → **Records**).
3. Find the record named `api` (it currently points at Railway). Click
   **Edit** and set:
   - Type: **CNAME**
   - Name: `api`
   - Target: `vittamhub-api.onrender.com`
   - Proxy status: **DNS only** (grey cloud) so Render can issue the
     certificate.
   Click **Save**. Delete any other `api` record (for example an `AAAA`).
4. Back in Render, click **Verify** next to the domain. The certificate can
   take a few minutes to an hour.
5. Open https://api.vittamhub.com/health. Then try logging in on
   https://vittamhub.com.

### 6. Turn off the Railway service

Once `api.vittamhub.com` works on Render, delete or leave the stopped Railway
service. `railway.json` can stay in the repo; Render ignores it.

## If Redis was on Railway

1. Open https://console.upstash.com and sign in with Google.
2. **Create Database** → name `vittamhub`, type **Regional**, region
   **ap-southeast-1 (Singapore)**, plan **Free** → **Create**.
3. On the database page, copy the `rediss://…` URL from **Connect** and set it
   as `REDIS_URL` in Render → **Environment** → **Save, rebuild, and deploy**.

Upstash free: 500K commands/month, 256 MB. BullMQ's idle workers use some
commands while the API is awake; because the free Render service sleeps most of
the day, this stays well inside the limit at current traffic. If it is ever
exceeded, Redis requests are throttled, queue features degrade, and `/health`
still passes.

## Deploying changes

`autoDeployTrigger: commit` deploys every push to `main`. To redeploy by hand:
Render → **vittamhub-api** → **Manual Deploy** → **Deploy latest commit**.
