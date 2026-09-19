# PostgreSQL Migration and Recovery

The durable SQLite records were backed up, imported to Neon in one transaction, and verified field by field before cutover.

## Active Configuration

The application uses:

- `DATABASE_URL`: pooled Neon connection for application traffic.
- `DIRECT_URL`: direct Neon connection for migrations and administrative tools.
- `prisma/schema.prisma`: active PostgreSQL schema.
- `prisma/migrations`: versioned production migrations.

Never commit either connection string.

## Deployment Commands

Generate the client and apply committed migrations:

```bash
npm run db:generate
npm run db:migrate
```

After an import or configuration change, verify all preserved fields and the PostgreSQL write path without leaving a test record:

```bash
npm run db:verify-cutover
```

Use `prisma migrate deploy` in hosted environments. Do not use `migrate dev`, `db push`, reset, or truncate against production.

## Preserved History

The import preserved Application, PassedDiscoveredJob, and InvalidDiscoveredJob fields and timestamps. DiscoveryRun was intentionally regenerated because it is a daily cache.

The original `prisma/dev.db` and timestamped snapshots under `prisma/backups/` are ignored private recovery artifacts. The legacy model is retained at `prisma/legacy-sqlite/schema.prisma`.

## Recovery Boundary

Do not point the live application back to SQLite after PostgreSQL receives new writes; doing so would hide those newer records. A rollback after cutover requires stopping writes, exporting current PostgreSQL data, and reconciling changes with the backup.

Before any recovery action:

1. Stop the dashboard and scheduler.
2. Back up the current PostgreSQL database.
3. Compare record IDs and timestamps against the SQLite snapshot.
4. Restore only through a reviewed migration or import procedure.
