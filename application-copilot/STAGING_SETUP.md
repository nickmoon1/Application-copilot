# Application Copilot Staging Setup

Staging uses the same codebase as production but keeps authentication, database records, and generated pull requests isolated.

## Environment Map

| Concern | Production | Staging |
| --- | --- | --- |
| Git branch | `main` | `staging` |
| Vercel project | `application-copilot` | `application-copilot-staging` |
| Neon branch | Production branch | `staging` branch |
| GitHub OAuth App | Production OAuth App | Staging OAuth App |
| Application PR repo | `Applications` | `Applications-staging` |
| `APP_ENVIRONMENT` | `production` | `staging` |

## 1. Create The Staging PR Repository

Create a private GitHub repository named `Applications-staging`. Give the existing PR-writing GitHub App access to this repository, or create a separate staging GitHub App if stronger credential isolation is desired.

Staging refuses to write to the repository named by `GITHUB_PRODUCTION_REPO`. The default protected name is `Applications`.

## 2. Create The Neon Branch

Create a Neon database branch named `staging` from the production branch. Copy both connection strings:

- Pooled URL for `DATABASE_URL`
- Direct URL for `DIRECT_URL`

The branch begins with a snapshot of production data. Remove or anonymize application records in staging if real history is not needed for testing. Never run reset, truncate, `migrate dev`, or `db push` against production.

## 3. Create The Staging OAuth App

Create a separate GitHub OAuth App after the staging Vercel URL is known.

- Homepage URL: `https://<staging-domain>`
- Callback URL: `https://<staging-domain>/api/auth/callback/github`

Use its client ID and client secret only in the staging Vercel project.

## 4. Create The Vercel Project

Import the existing `nickmoon1/Application-copilot` repository as a second Vercel project.

- Project name: `application-copilot-staging`
- Production branch: `staging`
- Root directory: `application-copilot`
- Framework: Next.js

Configure these staging-only environment variables:

```text
APP_ENVIRONMENT=staging
GITHUB_APPLICATION_OWNER=nickmoon1
GITHUB_APPLICATION_REPO=Applications-staging
GITHUB_PRODUCTION_REPO=Applications
NEXTAUTH_URL=https://<staging-domain>
```

Also add the staging OAuth credentials, GitHub App credentials, allowed GitHub user ID, a separate `NEXTAUTH_SECRET`, the Neon staging URLs, connector credentials, and a separate discovery cron secret.

## 5. Apply And Verify Migrations

Run committed migrations against the Neon staging branch:

```bash
npm run db:migrate
npm run db:verify-cutover
```

Then verify:

1. The orange `STAGING ENVIRONMENT` banner is visible.
2. GitHub sign-in returns to the staging URL.
3. Existing records load from the Neon staging branch.
4. A test application creates a PR only in `Applications-staging`.
5. Production remains unchanged.

## Promotion Workflow

Develop and test changes on short-lived branches based on `staging`. Merge them into `staging`, validate the staging deployment, then merge the tested commits into `main`. Vercel continues deploying `main` to production and `staging` to the staging project.
