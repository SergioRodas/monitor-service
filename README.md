# monitor-service

Uptime & latency monitoring service. It periodically probes a configurable set
of HTTP endpoints, records their status and response time, opens/closes
incidents on up↔down transitions, exposes the data through a documented REST API,
and (later) sends **Telegram** alerts. A React dashboard visualizes it and feeds
the live status board on [sergiorodas.vercel.app](https://sergiorodas.vercel.app).

## Stack

- **NestJS 11** (TypeScript, strict) — modular API
- **Prisma 6** + **PostgreSQL** (Neon free tier)
- **@nestjs/schedule** — cron-based probing
- **Swagger / OpenAPI** — interactive docs at `/docs`
- **Jest** — tests

## Data model

- **Monitor** — a target to watch (url, method, expected status, interval).
- **Check** — a single probe result (UP/DOWN, status code, latency, error).
- **Incident** — a down period (opened on failure, resolved on recovery).

## Getting started

```bash
npm install

# 1. Configure the database
cp .env.example .env
#   then edit .env and set DATABASE_URL (e.g. a free Neon Postgres string)

# 2. Create the schema
npx prisma migrate dev --name init

# 3. Run the API
npm run start:dev
```

- API: `http://localhost:3000`
- Swagger docs: `http://localhost:3000/docs`

## API (so far)

| Method | Path                  | Description                                  |
| ------ | --------------------- | -------------------------------------------- |
| GET    | `/status`             | Aggregated live status (feeds the dashboard) |
| POST   | `/monitors`           | Create a monitor                             |
| GET    | `/monitors`           | List monitors                                |
| GET    | `/monitors/:id`       | Get one monitor                              |
| PATCH  | `/monitors/:id`       | Update a monitor                             |
| DELETE | `/monitors/:id`       | Delete a monitor                             |
| POST   | `/monitors/:id/check` | Probe one monitor now                        |
| GET    | `/monitors/:id/checks`| Recent check history                         |
| POST   | `/checks/run`         | Probe all enabled monitors now               |

## Dashboard

A React (Vite + Recharts) status page lives in [`dashboard/`](./dashboard). It
consumes `GET /status` and shows each monitor's status, a latency sparkline, 24h
uptime % and last-checked time, auto-refreshing every 15s.

```bash
cd dashboard
npm install
npm run dev   # http://localhost:5173 (expects the API at http://localhost:3000)
```

## Roadmap

- [x] Scaffold + data model + Monitors CRUD + Swagger
- [x] Checker + scheduler (probe enabled monitors on their interval)
- [x] Incidents (open/close on transitions) + 24h uptime stats
- [x] `/status` aggregate endpoint
- [x] React dashboard (live status board)
- [ ] Telegram alerts on down/recovery
- [ ] Tests
- [ ] Dockerfile + deploy (API on Fly.io, dashboard on Vercel)
- [ ] Wire the portfolio's status board to real `/status` data
