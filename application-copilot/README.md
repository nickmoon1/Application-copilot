# Application Copilot

A private, human-in-the-loop workflow for discovering jobs, tailoring truthful application materials, reviewing them through GitHub pull requests, and tracking submissions.

## Getting started

Install dependencies and prepare the local database:

```bash
npm install
npm run db:setup
```

Copy `.env.example` to `.env` and add the GitHub App credentials, then run:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Daily discovery

The first dashboard load each Dallas calendar day runs discovery and stores that result in SQLite. Later page loads reuse the daily result. **Refresh Jobs** forces a new run.

The daily queue ranks by portfolio fit, location, validation, and freshness. It caps a single company at two of the first five jobs when other qualified companies are available. Additional matching roles remain in the backlog.

Configured sources include company connectors, Remotive U.S.-remote roles, and optional Adzuna Dallas-area aggregation. To enable Adzuna, register for credentials and add these values to `.env`:

```bash
ADZUNA_APP_ID=
ADZUNA_APP_KEY=
```

The source-health section on the dashboard reports whether each connector is live, unavailable, seeded, or not configured.

For hosted scheduling, set `DISCOVERY_CRON_SECRET` and configure the scheduler to send a daily `POST` request to `/api/jobs/discover` with `Authorization: Bearer <secret>`. Local dashboard use does not require this value.

## Verification

```bash
npm run lint
npm run build
```
