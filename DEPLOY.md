# Deploy

Everything here runs on free tiers. Target setup:

- **API** → Fly.io (Dockerized NestJS, scales to zero when idle)
- **Database** → Neon Postgres (already provisioned)
- **Dashboard** → Vercel (static Vite build)
- **Cadence** → a GitHub Actions cron pings the API every 10 min (also wakes the
  scaled-to-zero machine)

## 1. API on Fly.io

Prerequisites: a [Fly.io](https://fly.io) account and the `flyctl` CLI.

```bash
# install flyctl (Windows PowerShell)
iwr https://fly.io/install.ps1 -useb | iex

# from monitor-service/
fly auth login
fly launch --no-deploy        # accept the existing fly.toml; pick a unique app name & region (gru)

# give it the database (same string as your local .env)
fly secrets set DATABASE_URL="postgresql://...neon.tech/...?sslmode=require"

fly deploy                     # builds the Docker image, runs `prisma migrate deploy`, goes live
```

Your API is then at `https://<app-name>.fly.dev` (Swagger at `/docs`).
Seed the monitors once against production:

```bash
# point Prisma at the prod DB just for this command
DATABASE_URL="<neon-url>" npx prisma db seed
```

## 2. Keep checks running (free) — GitHub Actions cron

The workflow at `.github/workflows/checks-cron.yml` pings `/checks/run` every
10 minutes. Tell it where the API lives:

- GitHub repo → **Settings → Secrets and variables → Actions → Variables → New**
- Name: `API_URL`  ·  Value: `https://<app-name>.fly.dev`

(You can also run it manually from the Actions tab via "Run workflow".)

## 3. Dashboard on Vercel

- Import the repo at [vercel.com/new](https://vercel.com/new).
- **Root Directory:** `dashboard`
- **Environment Variable:** `VITE_API_URL = https://<app-name>.fly.dev`
- Deploy. Vercel auto-detects Vite (build `npm run build`, output `dist`).

## Notes

- The Fly machine scales to zero when idle, so the first request after a quiet
  period takes a couple of seconds to wake. The cron + any open dashboard keep it
  warm enough for fresh data.
- `fly logs` to tail the API; `fly status` for machine state.
