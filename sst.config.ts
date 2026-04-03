/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
    app(input) {
        return {
            name: 'serverless-backend-starter',
            removal: input?.stage === 'production' ? 'retain' : 'remove',
            protect: ['production'].includes(input?.stage),
            home: 'aws',
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

        // ==========================================
        // Shared environment variables for all Lambda functions
        // ==========================================
        const sharedEnv = {
            DATABASE_URL: process.env.DATABASE_URL || '',
            NODE_ENV: $app.stage === 'production' ? 'production' : 'development',
            LOG_LEVEL: process.env.LOG_LEVEL || 'info',
            ALLOWED_ORIGINS:
                process.env.ALLOWED_ORIGINS || 'http://localhost:3000,http://localhost:5173',
            COGNITO_USER_POOL_ID: userPool.id,
            COGNITO_CLIENT_ID: userPoolClient.id,
            STRIPE_SECRET_KEY: process.env.STRIPE_SECRET_KEY || '',
            STRIPE_WEBHOOK_SECRET: process.env.STRIPE_WEBHOOK_SECRET || '',
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

        // Health check for auth service
        api.route('GET /auth/v1/health', {
            handler: 'services/auth-service/index.handler',
            environment: sharedEnv,
            timeout: '10 seconds',
            memory: '128 MB',
        });

        // ==========================================
        // Billing Service — handles /billing/v1/*
        // ==========================================
        const billingLambdaConfig = {
            handler: 'services/billing-service/index.handler',
            environment: sharedEnv,
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
            timeout: '10 seconds',
            memory: '128 MB',
        });

        // Test endpoint
        api.route('GET /test/v1/ping', {
            handler: 'services/test-service/index.handler',
            environment: sharedEnv,
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
