import fs from 'fs';
import path from 'path';

const servicesDir = path.join(process.cwd(), 'services');

const depsMap: Record<string, string> = {
    'user-service': 'auth-service',
    'admin-service': 'auth-service',
    'document-service': 'site-service',
    'site-verification-service': 'site-service',
    'booking-query-service': 'booking-service',
    'incident-query-service': 'incident-service',
};

// I need to fetch the original package.jsons.
// billing-service is deleted, but I know it needed stripe. So I will manually define its dependencies.
const billingDeps = {
    "@hono/zod-validator": "*",
    "@vertiaccess/core": "workspace:*",
    "@vertiaccess/database": "workspace:*",
    "hono": "^4.7.10",
    "stripe": "^17.7.0",
    "zod": "^4.3.6"
};

const authDeps = {
    "@aws-sdk/client-cognito-identity-provider": "^3.750.0",
    "@aws-sdk/client-s3": "^3.1029.0",
    "@aws-sdk/s3-request-presigner": "^3.1029.0",
    "@vertiaccess/core": "workspace:*",
    "@vertiaccess/database": "workspace:*",
    "@hono/zod-validator": "*",
    "hono": "^4.7.10",
    "stripe": "^17.7.0",
    "zod": "^4.3.6"
};

const siteDeps = {
    "@aws-sdk/client-s3": "^3.1029.0",
    "@aws-sdk/s3-request-presigner": "^3.1029.0",
    "@vertiaccess/core": "workspace:*",
    "@vertiaccess/database": "workspace:*",
    "@hono/zod-validator": "*",
    "hono": "^4.7.10",
    "zod": "^4.3.6"
};

const bookingDeps = {
    "@vertiaccess/core": "workspace:*",
    "@vertiaccess/database": "workspace:*",
    "@hono/zod-validator": "*",
    "hono": "^4.7.10",
    "zod": "^4.3.6"
};

const incidentDeps = bookingDeps;

const mapToDeps: Record<string, any> = {
    'user-service': authDeps,
    'admin-service': authDeps,
    'document-service': siteDeps,
    'site-verification-service': siteDeps,
    'booking-query-service': bookingDeps,
    'incident-query-service': incidentDeps,
    'subscription-service': billingDeps,
    'payment-service': billingDeps,
};

for (const [svc, deps] of Object.entries(mapToDeps)) {
    const pkgPath = path.join(servicesDir, svc, 'package.json');
    if (fs.existsSync(pkgPath)) {
        const pkg = JSON.parse(fs.readFileSync(pkgPath, 'utf8'));
        pkg.dependencies = deps;
        fs.writeFileSync(pkgPath, JSON.stringify(pkg, null, 4));
        console.log(`Updated ${svc} dependencies.`);
    }
}
