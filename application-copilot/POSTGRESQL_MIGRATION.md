# Staged PostgreSQL Migration

The dashboard still uses SQLite. This preparation does not switch its database.

## Backup and Preflight

Stop the dashboard before taking the final snapshot. Do not make new applications or status changes between that snapshot and cutover.

Run from the inner application directory:

```bash
npm run db:backup
npm run test:db-import
npm run db:pg:import -- --dry-run "prisma/backups/<backup-filename>.db"
```

Backups contain private application data. They have restricted permissions and are excluded from Git. Retain a secure copy outside the project for recovery.

## Stage Neon Credentials

Append these to the ignored `.env.local`, leaving the existing `DATABASE_URL` unchanged:

```dotenv
POSTGRES_DATABASE_URL="pooled Neon connection string"
POSTGRES_DIRECT_URL="direct Neon connection string"
```

Use the same Neon branch and database for both URLs. Never put them in a commit, message, or shell command. The scripts load `.env.local` automatically.

## Prepare and Import

These commands modify the staged Neon database, not SQLite:

```bash
npm run db:pg:validate
npm run db:pg:generate
npm run db:pg:migrate
npm run db:pg:import -- --apply "prisma/backups/<backup-filename>.db"
```

The migration creates four tables through versioned Prisma migrations. The import requires an empty target and uses one transaction to preserve every Application, PassedDiscoveredJob, and InvalidDiscoveredJob field. It verifies full record equality before committing. A failure rolls back imported records; the migration-created empty tables remain.

The DiscoveryRun cache is deliberately not imported; discovery can regenerate it.

Do not retry a successful import against the same database: the nonempty-target guard will reject it. No reset or truncate commands are part of this workflow.

## Cutover Is A Separate Step

Only after the import succeeds should the application's active Prisma schema and invalid-job archive helper be converted to PostgreSQL, the application client regenerated, and `DATABASE_URL`/`DIRECT_URL` updated. Verify authenticated reads and mutations before resuming applications.

Until then, the current dashboard remains on SQLite. Keep the original database and snapshot untouched. After production writes begin, reverting to the old SQLite file would lose those newer changes; rollback then requires reconciling the production data.
