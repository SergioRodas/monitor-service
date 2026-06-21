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

| Method | Path            | Description      |
| ------ | --------------- | ---------------- |
| POST   | `/monitors`     | Create a monitor |
| GET    | `/monitors`     | List monitors    |
| GET    | `/monitors/:id` | Get one monitor  |
| PATCH  | `/monitors/:id` | Update a monitor |
| DELETE | `/monitors/:id` | Delete a monitor |

## Roadmap

- [x] Scaffold + data model + Monitors CRUD + Swagger
- [ ] Checker + scheduler (probe enabled monitors on their interval)
- [ ] Incidents (open/close on transitions) + uptime stats
- [ ] Telegram alerts on down/recovery
- [ ] `/status` aggregate endpoint for the portfolio board
- [ ] Tests
- [ ] Dockerfile + deploy (Fly.io) + React dashboard
