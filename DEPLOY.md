# Deploy

Everything here runs on **free tiers, no credit card, no expiry**:

- **API** → Render (free web service, Docker; sleeps when idle, woken by the cron)
- **Database** → Neon Postgres (already provisioned)
- **Dashboard** → Vercel (static Vite build)
- **Cadence** → a GitHub Actions cron pings the API every 10 min (also wakes the
  sleeping Render instance)

## 1. API on Render

[render.com](https://render.com) → sign up (GitHub login works, no card needed).

**Option A — Blueprint (uses `render.yaml`):**
- New → **Blueprint** → pick this repo → Apply.
- Add the env var when prompted: `DATABASE_URL` = your Neon connection string.

**Option B — manual:**
- New → **Web Service** → connect this repo.
- Runtime **Docker**, Instance type **Free**, Health check path `/`.
- Environment → add `DATABASE_URL` = your Neon string.
- Create.

Render builds the Docker image, runs `prisma migrate deploy` on boot, and serves
at `https://<service>.onrender.com` (Swagger at `/docs`). The app honors Render's
injected `PORT` automatically.

Seed the monitors once against production (from your machine):

```bash
DATABASE_URL="<neon-url>" npx prisma db seed
```

> Free instances sleep after ~15 min idle; the first request then takes ~30–50s
> to wake. The cron below keeps it warm.

## 2. Keep checks running (free) — GitHub Actions cron

`.github/workflows/checks-cron.yml` pings `/checks/run` every 10 minutes. Point it
at the API:

- GitHub repo → **Settings → Secrets and variables → Actions → Variables → New**
- Name `API_URL` · Value `https://<service>.onrender.com`

(Also runnable manually from the Actions tab → Run workflow.)

## 3. Dashboard on Vercel

- Import the repo at [vercel.com/new](https://vercel.com/new).
- **Root Directory:** `dashboard`
- **Environment Variable:** `VITE_API_URL = https://<service>.onrender.com`
- Deploy (Vercel auto-detects Vite: build `npm run build`, output `dist`).

## Notes

- Cold start after idle: the very first cron ping or dashboard load may take a
  few seconds; subsequent ones are instant.
- Render free gives ~750 instance-hours/month — enough for one service.
