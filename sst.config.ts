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

        const createServiceFunction = (
            name: string,
            handler: string,
            link: any[],
            memory: `${number} MB` | `${number} GB` = '256 MB',
            timeout:
                | `${number} second`
                | `${number} seconds`
                | `${number} minute`
                | `${number} minutes` = '30 seconds'
        ) => {
            return new sst.aws.Function(name, {
                handler,
                environment: sharedEnv,
                link,
                memory,
                timeout,
            });
        };

        const routeService = (basePath: string, functionArn: any) => {
            api.route(`ANY ${basePath}`, functionArn);
            api.route(`ANY ${basePath}/{proxy+}`, functionArn);
        };

        // ==========================================
        // Auth Service
        // ==========================================
        const authServiceFunction = createServiceFunction(
            'AuthService',
            'services/auth-service/index.handler',
            [databaseUrl, siteDocumentsBucket]
        );
        routeService('/auth/v1', authServiceFunction.arn);

        // ==========================================
        // Billing Service
        // ==========================================
        const billingServiceFunction = createServiceFunction(
            'BillingService',
            'services/billing-service/index.handler',
            [databaseUrl]
        );
        routeService('/billing/v1', billingServiceFunction.arn);

        // ==========================================
        // Site Service
        // ==========================================
        const siteServiceFunction = createServiceFunction(
            'SiteService',
            'services/site-service/index.handler',
            [siteDocumentsBucket, databaseUrl]
        );
        routeService('/sites/v1', siteServiceFunction.arn);

        // ==========================================
        // Notification Service
        // ==========================================
        const notificationServiceFunction = createServiceFunction(
            'NotificationService',
            'services/notification-service/index.handler',
            [databaseUrl]
        );
        routeService('/notifications/v1', notificationServiceFunction.arn);

        // ==========================================
        // Test Service
        // ==========================================
        const testServiceFunction = createServiceFunction(
            'TestService',
            'services/test-service/index.handler',
            [databaseUrl],
            '128 MB',
            '10 seconds'
        );
        routeService('/test/v1', testServiceFunction.arn);

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
