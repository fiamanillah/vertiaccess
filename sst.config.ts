/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
    app(input) {
        return {
            name: 'serverless-backend-starter',
            removal: input?.stage === 'production' ? 'retain' : 'remove',
            protect: ['production'].includes(input?.stage),
            home: 'aws',
            providers: {
                aws: {
                    region: 'us-east-2',
                    version: '7.20.0',
                },
            },
        };
    },
    async run() {
        // ==========================================
        // Cognito User Pool
        // ==========================================
        const userPool = new sst.aws.CognitoUserPool('AuthUserPool', {
            usernames: ['email'],
            transform: {
                userPool: {
                    schemas: [
                        {
                            name: 'role',
                            attributeDataType: 'String',
                            mutable: true,
                            required: false,
                            stringAttributeConstraints: {
                                minLength: '1',
                                maxLength: '50',
                            },
                        },
                        {
                            name: 'firstName',
                            attributeDataType: 'String',
                            mutable: true,
                            required: false,
                            stringAttributeConstraints: {
                                minLength: '1',
                                maxLength: '100',
                            },
                        },
                        {
                            name: 'lastName',
                            attributeDataType: 'String',
                            mutable: true,
                            required: false,
                            stringAttributeConstraints: {
                                minLength: '1',
                                maxLength: '100',
                            },
                        },
                    ],
                    passwordPolicy: {
                        minimumLength: 8,
                        requireLowercase: true,
                        requireNumbers: true,
                        requireSymbols: false,
                        requireUppercase: true,
                    },
                    autoVerifiedAttributes: ['email'],
                },
            },
        });

        const userPoolClient = userPool.addClient('WebClient', {
            transform: {
                client: {
                    explicitAuthFlows: [
                        'ALLOW_USER_PASSWORD_AUTH',
                        'ALLOW_REFRESH_TOKEN_AUTH',
                        'ALLOW_USER_SRP_AUTH',
                    ],
                    accessTokenValidity: 1, // 1 hour
                    idTokenValidity: 1, // 1 hour
                    refreshTokenValidity: 30, // 30 days
                    tokenValidityUnits: {
                        accessToken: 'hours',
                        idToken: 'hours',
                        refreshToken: 'days',
                    },
                },
            },
        });

        const databaseUrl = new sst.Secret('DatabaseUrl');

        const siteDocumentsBucket = new sst.aws.Bucket('SiteDocuments', {
            cors: {
                allowMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
                allowOrigins: ['*'],
                allowHeaders: ['*'],
                maxAge: '1 day',
            },
        });

        // ==========================================
        // Shared environment variables for all Lambda functions
        // ==========================================
        const sharedEnv = {
            NODE_ENV: $app.stage === 'production' ? 'production' : 'development',
            LOG_LEVEL: process.env.LOG_LEVEL || 'info',
            ALLOWED_ORIGINS:
                process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173',
            COGNITO_USER_POOL_ID: userPool.id,
            COGNITO_CLIENT_ID: userPoolClient.id,
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
            STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
            S3_BUCKET_NAME: siteDocumentsBucket.name,
            APP_AWS_REGION: process.env.AWS_REGION || 'us-east-2',
        };

        // ==========================================
        // API Gateway
        // ==========================================
        const api = new sst.aws.ApiGatewayV2('MyApi');

        // ==========================================
        // Auth Service — handles /auth/v1/*
        // ==========================================
        const authLambdaConfig = {
            handler: 'services/auth-service/index.handler',
            environment: sharedEnv,
            link: [databaseUrl, siteDocumentsBucket],
            timeout: '30 seconds' as const,
            memory: '256 MB' as const,
        };

        api.route('POST /auth/v1/register', authLambdaConfig);
        api.route('POST /auth/v1/login', authLambdaConfig);
        api.route('POST /auth/v1/confirm', authLambdaConfig);
        api.route('POST /auth/v1/refresh', authLambdaConfig);
        api.route('POST /auth/v1/forgot-password', authLambdaConfig);
        api.route('POST /auth/v1/reset-password', authLambdaConfig);
        api.route('GET /auth/v1/me', authLambdaConfig);
        api.route('POST /auth/v1/resend-code', authLambdaConfig);

        // Identity verification — landowner uploads their ID document
        api.route('POST /auth/v1/users/me/identity', authLambdaConfig);

        // Admin routes — user & verification management
        api.route('POST /auth/v1/admin/register', authLambdaConfig);
        api.route('GET /auth/v1/admin/users', authLambdaConfig);
        api.route('GET /auth/v1/admin/verifications', authLambdaConfig);
        api.route('PUT /auth/v1/admin/verifications/{id}', authLambdaConfig);

        // Health check for auth service
        api.route('GET /auth/v1/health', {
            handler: 'services/auth-service/index.handler',
            environment: sharedEnv,
            link: [databaseUrl],
            timeout: '10 seconds',
            memory: '128 MB',
        });

        // ==========================================
        // Billing Service — handles /billing/v1/*
        // ==========================================
        const billingLambdaConfig = {
            handler: 'services/billing-service/index.handler',
            environment: sharedEnv,
            link: [databaseUrl],
            timeout: '30 seconds' as const,
            memory: '256 MB' as const,
        };

        api.route('POST /billing/v1/checkout', billingLambdaConfig);
        api.route('POST /billing/v1/webhook', billingLambdaConfig);
        api.route('GET /billing/v1/plans', billingLambdaConfig);
        api.route('POST /billing/v1/plans', billingLambdaConfig);
        api.route('PATCH /billing/v1/plans/{planId}', billingLambdaConfig);
        api.route('DELETE /billing/v1/plans/{planId}', billingLambdaConfig);
        api.route('POST /billing/v1/subscriptions/activate', billingLambdaConfig);

        api.route('GET /billing/v1/health', {
            handler: 'services/billing-service/index.handler',
            environment: sharedEnv,
            link: [databaseUrl],
            timeout: '10 seconds',
            memory: '128 MB',
        });

        // ==========================================
        // Site Service — handles /sites/v1/*
        // ==========================================
        const siteLambdaConfig = {
            handler: 'services/site-service/index.handler',
            environment: sharedEnv,
            timeout: '30 seconds' as const,
            memory: '256 MB' as const,
            link: [siteDocumentsBucket, databaseUrl],
        };

        // Site CRUD
        api.route('POST /sites/v1', siteLambdaConfig);
        api.route('GET /sites/v1', siteLambdaConfig);
        api.route('GET /sites/v1/{siteId}', siteLambdaConfig);
        api.route('PATCH /sites/v1/{siteId}', siteLambdaConfig);
        api.route('DELETE /sites/v1/{siteId}', siteLambdaConfig);

        // Site status
        api.route('PATCH /sites/v1/{siteId}/status', siteLambdaConfig);

        // File uploads
        api.route('POST /sites/v1/upload-url', siteLambdaConfig);
        api.route('PUT /sites/v1/upload-file', siteLambdaConfig);

        // Document management
        api.route('POST /sites/v1/{siteId}/documents', siteLambdaConfig);
        api.route('GET /sites/v1/{siteId}/documents', siteLambdaConfig);
        api.route('DELETE /sites/v1/{siteId}/documents/{docId}', siteLambdaConfig);

        // Public site listing (for discovery map)
        api.route('GET /sites/v1/public', siteLambdaConfig);

        // Health check for site service
        api.route('GET /sites/v1/health', {
            handler: 'services/site-service/index.handler',
            environment: sharedEnv,
            link: [databaseUrl],
            timeout: '10 seconds',
            memory: '128 MB',
        });

        // Test endpoint
        api.route('GET /test/v1/ping', {
            handler: 'services/test-service/index.handler',
            environment: sharedEnv,
            link: [databaseUrl],
            timeout: '10 seconds',
            memory: '128 MB',
        });

        // ==========================================
        // Outputs
        // ==========================================
        return {
            apiUrl: api.url,
            userPoolId: userPool.id,
            userPoolClientId: userPoolClient.id,
        };
    },
});
