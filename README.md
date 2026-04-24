# vertiaccess

## Environment Isolation (Dev vs Production)

This project uses SST stages to keep development and deployed infrastructure separate.

- `dev` stage: used by local development
- `production` stage: used by real deployments

### Commands

```bash
# Local development against isolated dev infrastructure
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
# Set secret in dev
sst secret set DatabasePassword --stage dev

# Optional: use an external DB instead of SST-managed RDS
sst secret set DatabaseUrl --stage dev
USE_EXTERNAL_DATABASE=true bun run deploy:dev

# Set secret in production
sst secret set DatabasePassword --stage production

# Run production Prisma migrations through SST environment
bun run db:migrate:aws
```

By default, all stages (including `dev`) use SST-managed RDS + Proxy URL.
If you need an external DB, set `USE_EXTERNAL_DATABASE=true` and provide `DatabaseUrl`.

## Setup

```bash
bun install
bun run setup
```
