# vertiaccess

## Environment Isolation (Dev vs Production)

This project uses SST stages to keep development and deployed infrastructure separate.

- `dev` stage: shared cloud stage for client testing
- `fiamanillah` stage: personal local-development stage backed by Docker Postgres
- `production` stage: used by real deployments

### Commands

```bash
# Local development against Docker Postgres
bun run dev:fiamanillah

# Shared client-testing environment
bun run dev

# Deploy only production infrastructure
bun run deploy

# Optional: deploy the dev environment without running sst dev
bun run deploy:dev
```

### Why This Works

The SST config includes stage-aware naming and protections:

- Resource names include the stage prefix.
- `production` is protected from accidental removal.
- Non-production stages are removable by default.

So running `bun run dev` will not change production resources, and running `bun run deploy` will only update production.

## Stage-Specific Secrets and Database Tasks

Always run secrets and DB commands in the intended stage.

```bash
# Personal local stage uses the Docker Postgres URL from .env/.env.local
bun run dev:fiamanillah

# Shared dev stage can still use SST-managed RDS or an external DB
sst secret set DatabasePassword --stage dev
sst secret set DatabaseUrl --stage dev
USE_EXTERNAL_DATABASE=true bun run deploy:dev

# Set secret in production
sst secret set DatabasePassword --stage production

# Run production Prisma migrations through SST environment
bun run db:migrate:aws
```

By default, `dev` uses SST-managed RDS + Proxy URL.
The `fiamanillah` stage always uses the local Docker Postgres connection string from your environment and does not use RDS.
If you need an external DB for `dev`, set `USE_EXTERNAL_DATABASE=true` and provide `DatabaseUrl`.

## Setup

```bash
bun install
bun run setup
```
