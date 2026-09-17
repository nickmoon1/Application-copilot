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

## Private Dashboard Authentication

Dashboard access uses a separate GitHub OAuth App and an immutable GitHub user ID allowlist. The GitHub App that creates application PRs remains independent.

1. Create a GitHub OAuth App with `http://localhost:3000` as its homepage URL and `http://localhost:3000/api/auth/callback/github` as its authorization callback URL.
2. Set `AUTH_GITHUB_CLIENT_ID` and `AUTH_GITHUB_CLIENT_SECRET` from that OAuth App.
3. Set `AUTH_ALLOWED_GITHUB_ID` to the numeric GitHub account ID permitted to use this dashboard.
4. Generate `NEXTAUTH_SECRET` with `openssl rand -base64 32` and set `NEXTAUTH_URL=http://localhost:3000` for local development.

Unauthenticated browser requests are redirected to `/sign-in`. Unauthenticated API requests receive `401 Unauthorized`. The scheduled discovery `POST` remains accessible only with its `DISCOVERY_CRON_SECRET` bearer token.

## Verification

PostgreSQL migration is staged separately from the active SQLite dashboard. See [the migration runbook](POSTGRESQL_MIGRATION.md) before changing database credentials.

```bash
npm run lint
npm run build
```
