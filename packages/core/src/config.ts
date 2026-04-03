// packages/core/src/config.ts
// Lambda-friendly config — reads from process.env directly (SST handles env injection)

export const config = {
    server: {
        env: process.env.NODE_ENV || 'development',
        isProduction: process.env.NODE_ENV === 'production',
        isDevelopment: process.env.NODE_ENV === 'development',
        isTest: process.env.NODE_ENV === 'test',
    },
    database: {
        url: process.env.DATABASE_URL,
        logging: process.env.DB_LOGGING === 'true',
    },
    security: {
        cors: {
            allowedOrigins: process.env.ALLOWED_ORIGINS || 'http://localhost:3000',
        },
    },
    cognito: {
        userPoolId: process.env.COGNITO_USER_POOL_ID || '',
        clientId: process.env.COGNITO_CLIENT_ID || '',
        region:
            process.env.APP_AWS_REGION ||
            process.env.AWS_REGION ||
            (process.env.COGNITO_USER_POOL_ID
                ? process.env.COGNITO_USER_POOL_ID.split('_')[0]
                : 'us-east-1'),
    },
    stripe: {
        secretKey: process.env.STRIPE_SECRET_KEY || '',
        webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || '',
    },
    defaultAdmin: {
        email: process.env.DEFAULT_ADMIN_EMAIL,
    },
    logging: {
        level: process.env.LOG_LEVEL || 'info',
    },
};

export default config;
