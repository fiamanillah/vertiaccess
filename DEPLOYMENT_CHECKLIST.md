# 🚀 Deployment Checklist & Setup Guide

## Before Deployment

### 1. AWS Account Setup ✅

- [ ] AWS account created and configured
- [ ] AWS credentials configured locally: `aws configure`
- [ ] AWS region set to `us-east-2` (or your desired region in `sst.config.ts`)
- [ ] IAM user has appropriate permissions (PowerUser or Administrator for SST)

### 2. Local Environment Setup ✅

```bash
# Install dependencies
bun install

# Create local environment file
cp .env.local.example .env.local

# Update .env.local with your local values (see notes below)
```

### 3. Database Setup ✅

**Option A: Local PostgreSQL (Recommended for Development)**

```bash
# Start local Postgres
docker-compose up -d

# Run migrations
cd packages/database
bun run db:migrate

# Generate Prisma client
bun run db:generate
```

**Option B: External RDS (optional override)**

- Database already exists at the URL in the .env
- Ensure security group allows Lambda VPC connections
- Password managed via SST secrets (see below)

### 4. SST Secrets Configuration ✅

Before deploying, set all sensitive values as SST secrets:

```bash
# Set database password (managed by SST)
sst secret set -s dev DatabasePassword "your_secure_password"

# Optional external DB override (if using Option B above)
# sst secret set -s dev DatabaseUrl "postgresql://postgres:password@host:5432/vertiaccess?sslmode=require"
# USE_EXTERNAL_DATABASE=true sst deploy -s dev

# Set Stripe keys (get from https://dashboard.stripe.com/apikeys)
sst secret set -s dev StripeSecretKey "sk_test_your_test_key"
sst secret set -s dev StripeWebhookSecret "whsec_your_webhook_secret"
sst secret set -s dev BookingChargeKey "your_booking_charge_key"

# View all secrets
sst secret list -s dev
```

### 5. Environment Variables Configuration ✅

Your `.env.local` file should have:

```env
# Local Development
NODE_ENV=development
LOG_LEVEL=debug

# Database (local or external)
DATABASE_URL="postgresql://postgres:password@localhost:5432/vertiaccess"

# Stripe (from dashboard)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
BOOKING_CHARGE_KEY="your_key"

# AWS
AWS_REGION="us-east-2"

# Cognito (will be created by SST)
COGNITO_USER_POOL_ID="us-east-2_xxx"
COGNITO_CLIENT_ID="xxx"

# Admin defaults (change for production!)
DEFAULT_ADMIN_EMAIL="admin@example.com"
DEFAULT_ADMIN_PASSWORD="SecurePassword123!"
```

## Deployment Steps

### Stage 1: Development Deployment

```bash
# Deploy to dev stage
sst deploy -s dev

# Outputs will show:
# - apiUrl: https://your-api-url.com
# - frontendUrl: https://your-frontend.cloudfront.net
# - userPoolId: us-east-2_xxx
# - userPoolClientId: xxx
```

### Stage 2: Staging Deployment

```bash
# Set production-grade secrets for staging
sst secret set -s staging StripeSecretKey "sk_live_your_staging_key"
# ... set other staging secrets ...

# Deploy to staging
sst deploy -s staging

# Test all functionality before production
```

### Stage 3: Production Deployment

```bash
# ⚠️ CRITICAL: Set production secrets
sst secret set -s production StripeSecretKey "sk_live_your_production_key"
sst secret set -s production StripeWebhookSecret "whsec_prod_webhook"
sst secret set -s production BookingChargeKey "production_key"
sst secret set -s production DatabasePassword "secure_production_password"

# Review production settings
sst secret list -s production

# Deploy to production (protected - requires confirmation)
sst deploy -s production

# Outputs will show production URLs
```

## Post-Deployment Configuration

### 1. Frontend Deployment ✅

The frontend is automatically deployed to CloudFront as part of `sst deploy`.

**Frontend URL CORS Configuration:**

- ✅ Automatically added to `ALLOWED_ORIGINS` in sst.config.ts
- ✅ CORS headers set in backend middleware (packages/core/src/middleware/cors.ts)
- ✅ All Lambda functions receive the updated `ALLOWED_ORIGINS` environment variable

### 2. Stripe Webhook Setup ✅

After deployment, configure Stripe webhooks:

```bash
# Get the deployed API URL from sst deploy output
API_URL="https://your-api-url.com"

# In Stripe Dashboard → Webhooks → Add Endpoint
# Endpoint URL: https://your-api-url.com/billing/v1/webhooks/stripe
# Events: payment_intent.succeeded, customer.subscription.updated
# API Version: Latest
```

### 3. Cognito Configuration ✅

The Cognito User Pool is created automatically by SST.

**Custom attributes (already configured in sst.config.ts):**

- `role` - User role (admin, operator, customer)
- `firstName` - First name
- `lastName` - Last name

**Email verification:**

- ✅ Auto-verified (configured in sst.config.ts)

### 4. S3 Configuration ✅

The S3 bucket is created with CORS enabled for the frontend.

**CORS is already configured:**

```bash
# Verify CORS configuration
aws s3api get-bucket-cors --bucket your-bucket-name

# If needed, update CORS manually (not required if using SST)
```

### 5. Update Frontend Environment Variables ✅

When deploying frontend, ensure these match your deployed infrastructure:

```env
# Frontend .env
VITE_API_URL=https://your-deployed-api-url.com
VITE_COGNITO_USER_POOL_ID=us-east-2_xxx
VITE_COGNITO_CLIENT_ID=xxx
VITE_AWS_REGION=us-east-2
```

**Note:** These are automatically set by SST during build (see `sst.config.ts` line ~256)

## Verification Checklist

### Before Going Live

- [ ] **Database**: Can connect and all migrations are applied

    ```bash
    psql $DATABASE_URL
    # Should connect successfully
    ```

- [ ] **API Health**: All services are healthy

    ```bash
    curl https://your-api-url.com/auth/v1/health
    # Should return 200
    ```

- [ ] **CORS**: Frontend can communicate with backend

    ```bash
    # Check from browser console
    fetch('https://your-api-url.com/auth/v1/health')
    # Should not have CORS errors
    ```

- [ ] **Authentication**: Can login and get tokens

    ```bash
    curl -X POST https://your-api-url.com/auth/v1/login \
      -H "Content-Type: application/json" \
      -d '{"email":"user@example.com","password":"password"}'
    ```

- [ ] **Stripe**: Webhooks are being received

    ```bash
    # In Stripe Dashboard: Webhooks → Recent attempts
    # Should see successful 200 responses
    ```

- [ ] **S3**: Can upload files
    ```bash
    # Test file upload through API
    ```

## RDS Configuration Details

### Database Setup (sst.config.ts)

**For Development (`dev` stage):**

- Uses SST-managed RDS + Proxy by default
- Optional override: `sst secret set -s dev DatabaseUrl "postgresql://..."`
- Enable override: `USE_EXTERNAL_DATABASE=true sst deploy -s dev`

**For Staging/Production:**

- SST creates managed RDS instance automatically
- Password managed via `DatabasePassword` secret
- RDS Proxy created automatically for connection pooling

### Connection String Format

```
postgresql://postgres:PASSWORD@HOST:5432/vertiaccess?sslmode=require
```

- **HOST**: RDS Proxy endpoint or RDS instance endpoint
- **PASSWORD**: Managed via SST secrets
- **sslmode=require**: Required for AWS RDS

### RDS Security

- ✅ Deployed in private VPC (no public access)
- ✅ Security group allows Lambda functions only
- ✅ Database password managed in AWS Secrets Manager
- ✅ RDS Proxy handles connection pooling
- ✅ SSL connections required

## Troubleshooting

### Connection Issues

```bash
# Test database connectivity
psql postgresql://postgres:password@host:5432/vertiaccess

# Check Lambda execution role
aws iam get-role-policy --role-name vertiaccess-dev-app-default-role --policy-name ...

# Check VPC security groups
aws ec2 describe-security-groups --group-ids sg-xxx
```

### Deployment Failures

```bash
# Check SST logs
sst logs -s dev

# Validate configuration
sst validate

# Clean up and retry
sst remove -s dev
sst deploy -s dev
```

### CORS Errors

```bash
# Check CORS configuration in Lambda
curl -v -X OPTIONS https://your-api-url.com/auth/v1/health \
  -H "Origin: https://your-frontend-url.com" \
  -H "Access-Control-Request-Method: GET"

# Should return: Access-Control-Allow-Origin: https://your-frontend-url.com
```

## Environment Variables Reference

| Variable                | Scope         | Managed By    | Notes                           |
| ----------------------- | ------------- | ------------- | ------------------------------- |
| `DATABASE_URL`          | All funcs     | SST secrets   | Connection string with password |
| `STRIPE_SECRET_KEY`     | Billing/Hooks | SST secrets   | Test key for dev, live for prod |
| `STRIPE_WEBHOOK_SECRET` | Billing       | SST secrets   | From Stripe webhook endpoint    |
| `ALLOWED_ORIGINS`       | All funcs     | sst.config.ts | Auto-includes frontend URL      |
| `COGNITO_USER_POOL_ID`  | Auth          | SST           | Created automatically           |
| `COGNITO_CLIENT_ID`     | Auth          | SST           | Created automatically           |
| `S3_BUCKET_NAME`        | Sites/Uploads | SST           | Created automatically           |
| `APP_AWS_REGION`        | All funcs     | hardcoded     | `us-east-2`                     |

## Going to Production - Final Checklist

### Week Before Launch

- [ ] Load test the API with production data volume
- [ ] Enable CloudWatch alarms for Lambda errors
- [ ] Configure SNS notifications for failures
- [ ] Document runbook for common issues
- [ ] Test disaster recovery procedures

### 24 Hours Before Launch

- [ ] Verify all production secrets are set correctly
- [ ] Final environment variable check
- [ ] Database backup verified
- [ ] Rollback plan documented
- [ ] Team trained on monitoring

### Launch Day

- [ ] Deploy to production
- [ ] Monitor CloudWatch logs for 1 hour
- [ ] Verify all endpoints respond
- [ ] Send smoke test transactions (Stripe)
- [ ] Monitor for errors
- [ ] Announce to users after 2 hours of success

## Support & Debugging

For issues:

```bash
# View logs
sst logs -s production --follow

# Inspect specific function
sst logs -s production --function AuthService

# Check deployed values
sst output -s production
```

---

**Last Updated:** 2026-04-25
**Framework:** SST v2 on AWS Lambda
**Database:** PostgreSQL with RDS Proxy
