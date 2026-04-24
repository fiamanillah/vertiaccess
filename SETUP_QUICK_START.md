# Quick Setup Guide

## 🚀 For Local Development (Right Now)

### 1. Create local environment file

```bash
# Copy example to .env.local
cp .env.local.example .env.local

# Edit .env.local and fill in these values:
# - DATABASE_URL: your local or external database
# - STRIPE_SECRET_KEY: your Stripe test key
# - Cognito IDs: if you have them
```

### 2. Start local database

```bash
# If using Docker Postgres
docker-compose up -d

# Setup database
cd packages/database
bun run db:migrate
bun run db:generate
```

### 3. Install & run

```bash
# Root directory
bun install

# Start services
bun run dev
```

---

## 🌐 For Deployment

### Before First Deployment

```bash
# 1. Configure AWS
aws configure  # Enter your AWS credentials

# 2. Set SST secrets (CRITICAL - do this first!)
sst secret set -s dev StripeSecretKey "sk_test_your_key"
sst secret set -s dev StripeWebhookSecret "whsec_your_secret"
sst secret set -s dev BookingChargeKey "your_key"
sst secret set -s dev DatabasePassword "strong_password"

# 3. Deploy!
sst deploy -s dev

# 4. Copy outputs and save them (you'll need them for frontend)
# apiUrl: https://xxx.com
# frontendUrl: https://xxx.cloudfront.net
# userPoolId: us-east-2_xxx
```

### After Deployment

```bash
# 1. Test backend health
curl https://your-api-url/auth/v1/health

# 2. Setup Stripe webhooks
#    In Stripe Dashboard:
#    https://your-api-url/billing/v1/webhooks/stripe

# 3. Deploy frontend (automatically done by SST)
# The frontend will automatically be on https://your-cloudfront-url
```

---

## ✅ What's Already Fixed

| Issue                          | Solution                                        |
| ------------------------------ | ----------------------------------------------- |
| 🔐 Exposed secrets in .env     | Moved to .env.local (git-ignored) + SST secrets |
| 🔗 Hardcoded database URL      | Now managed via `DatabaseUrl` secret            |
| 🔒 Database password exposed   | Managed via `DatabasePassword` secret           |
| 🌍 CORS not including frontend | Auto-added by sst.config.ts                     |
| ❌ No production setup         | Added deployment checklist                      |
| 📝 No documentation            | Added DEPLOYMENT_CHECKLIST.md                   |

---

## 🛠️ Environment Variable Summary

### Development (.env.local)

```env
NODE_ENV=development
DATABASE_URL=postgresql://...
STRIPE_SECRET_KEY=sk_test_...
COGNITO_USER_POOL_ID=us-east-2_...
```

### Deployment (Managed by SST)

- ✅ Frontend URL → Added to CORS automatically
- ✅ Database URL → Pulled from secrets
- ✅ All credentials → From SST secrets manager

### No Need to Manually Set

- ALLOWED_ORIGINS - auto-calculated
- COGNITO_USER_POOL_ID - auto-created
- DATABASE_URL - auto-created RDS or from secret
- S3_BUCKET_NAME - auto-created

---

## 📋 RDS Configuration Details

### What's Happening

1. **Local Dev**: You can use local Postgres or external RDS
2. **Deployed Dev**: Uses external RDS (specified via secret)
3. **Production**: SST creates managed RDS automatically

### Security

- ✅ Private VPC only (no public access)
- ✅ RDS Proxy for connection pooling
- ✅ SSL required (sslmode=require)
- ✅ Password & URL in AWS Secrets Manager

---

## 🎯 Next Steps

1. **Create .env.local** - copy from .env.local.example
2. **Setup local database** - via docker-compose
3. **Test locally** - bun run dev
4. **When ready to deploy**:
    - Set SST secrets
    - Run: `sst deploy -s dev`
    - Copy output URLs
    - Setup Stripe webhooks

**See DEPLOYMENT_CHECKLIST.md for complete deployment guide!**
