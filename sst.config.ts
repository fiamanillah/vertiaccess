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
        const aws = await import('@pulumi/aws');
        const vpc = new sst.aws.Vpc('VertiaccessVpcV2', { nat: 'managed' });
        const dbPassword = new sst.Secret('DatabasePassword');
        const slugify = (value: string) =>
            value
                .toLowerCase()
                .replace(/[^a-z0-9-]/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        const stageSlug = slugify($app.stage).slice(0, 12) || 'stage';
        const appSlug = slugify($app.name).slice(0, 18) || 'app';
        const resourceRevision = 'v2';
        const resourcePrefix = `vertiaccess-${stageSlug}-${appSlug}-${resourceRevision}`;
        const dbIdentifier = `${resourcePrefix}-db`;

        const dbSubnetGroup = new aws.rds.SubnetGroup('MySubnetGroup', {
            name: `${resourcePrefix}-subnet-group`,
            subnetIds: vpc.privateSubnets,
        });

        const db = new aws.rds.Instance('MyDatabase', {
            identifier: dbIdentifier,
            engine: 'postgres',
            instanceClass: 'db.t4g.micro',
            allocatedStorage: 20,
            dbName: 'vertiaccess',
            username: 'postgres',
            password: dbPassword.value,
            vpcSecurityGroupIds: vpc.securityGroups,
            dbSubnetGroupName: dbSubnetGroup.name,
            skipFinalSnapshot: true,
            publiclyAccessible: false,
        });

        const dbCredentials = new aws.secretsmanager.Secret('DatabaseCredentials', {
            name: `${resourcePrefix}-db-credentials`,
        });

        new aws.secretsmanager.SecretVersion('DatabaseCredentialsVersion', {
            secretId: dbCredentials.id,
            secretString: $interpolate`{"username":"postgres","password":"${dbPassword.value}"}`,
        });

        const proxyRole = new aws.iam.Role('ProxyRole', {
            name: `${resourcePrefix}-rds-proxy-role`,
            assumeRolePolicy: aws.iam.getPolicyDocumentOutput({
                statements: [
                    {
                        actions: ['sts:AssumeRole'],
                        principals: [
                            {
                                type: 'Service',
                                identifiers: ['rds.amazonaws.com'],
                            },
                        ],
                    },
                ],
            }).json,
        });

        new aws.iam.RolePolicy('ProxyPolicy', {
            name: `${resourcePrefix}-rds-proxy-policy`,
            role: proxyRole.id,
            policy: $interpolate`{
                "Version": "2012-10-17",
                "Statement": [
                    {
                        "Effect": "Allow",
                        "Action": [
                            "secretsmanager:GetSecretValue",
                            "secretsmanager:DescribeSecret"
                        ],
                        "Resource": "${dbCredentials.arn}"
                    }
                ]
            }`,
        });

        const proxy = new aws.rds.Proxy('MyProxy', {
            name: `${resourcePrefix}-proxy`,
            engineFamily: 'POSTGRESQL',
            vpcSecurityGroupIds: vpc.securityGroups,
            vpcSubnetIds: vpc.privateSubnets,
            roleArn: proxyRole.arn,
            auths: [
                {
                    authScheme: 'SECRETS',
                    iamAuth: 'DISABLED',
                    secretArn: dbCredentials.arn,
                },
            ],
            debugLogging: false,
        });

        const proxyDefaultTargetGroup = new aws.rds.ProxyDefaultTargetGroup('MyProxyTargetGroup', {
            dbProxyName: proxy.name,
            connectionPoolConfig: {
                maxConnectionsPercent: 100,
            },
        });

        new aws.rds.ProxyTarget('MyProxyTarget', {
            dbProxyName: proxy.name,
            targetGroupName: proxyDefaultTargetGroup.name,
            dbInstanceIdentifier: dbIdentifier,
        });
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

        const DATABASE_URL = $interpolate`postgresql://postgres:${dbPassword.value}@${proxy.endpoint}:5432/vertiaccess?sslmode=require`;

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
            BOOKING_CHARGE_KEY: process.env.BOOKING_CHARGE_KEY || '',
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
                environment: {
                    ...sharedEnv,
                    DATABASE_URL: DATABASE_URL,
                },
                link,
                vpc,
                architecture: 'arm64',
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
            [siteDocumentsBucket]
        );
        routeService('/auth/v1', authServiceFunction.arn);

        // ==========================================
        // Billing Service
        // ==========================================
        const billingServiceFunction = createServiceFunction(
            'BillingService',
            'services/billing-service/index.handler',
            []
        );
        routeService('/billing/v1', billingServiceFunction.arn);

        // ==========================================
        // Site Service
        // ==========================================
        const siteServiceFunction = createServiceFunction(
            'SiteService',
            'services/site-service/index.handler',
            [siteDocumentsBucket]
        );
        routeService('/sites/v1', siteServiceFunction.arn);

        // ==========================================
        // Booking Service
        // ==========================================
        const bookingServiceFunction = createServiceFunction(
            'BookingService',
            'services/booking-service/index.handler',
            []
        );
        routeService('/bookings/v1', bookingServiceFunction.arn);

        // ==========================================
        // Incident Service
        // ==========================================
        const incidentServiceFunction = createServiceFunction(
            'IncidentService',
            'services/incident-service/index.handler',
            []
        );
        routeService('/incidents/v1', incidentServiceFunction.arn);

        // ==========================================
        // Booking payment cron (charge approved PAYG bookings on start date)
        // ==========================================
        new sst.aws.CronV2('BookingDuePaymentsCron', {
            schedule: 'rate(5 minutes)',
            job: {
                handler: 'scripts/process-due-booking-payments.handler',
                timeout: '30 seconds',
                vpc,
                architecture: 'arm64',
                environment: {
                    API_BASE_URL: api.url,
                    DATABASE_URL: DATABASE_URL,
                    BOOKING_CHARGE_KEY: process.env.BOOKING_CHARGE_KEY || '',
                },
            },
        });

        // ==========================================
        // Notification Service
        // ==========================================
        const notificationServiceFunction = createServiceFunction(
            'NotificationService',
            'services/notification-service/index.handler',
            []
        );
        routeService('/notifications/v1', notificationServiceFunction.arn);

        // ==========================================
        // Frontend Application
        // ==========================================
        const frontend = new sst.aws.StaticSite('Frontend', {
            path: 'packages/frontend',
            build: {
                command: 'bun run build',
                output: 'build',
            },
            environment: {
                VITE_API_URL: api.url,
                VITE_COGNITO_USER_POOL_ID: userPool.id,
                VITE_COGNITO_CLIENT_ID: userPoolClient.id,
                VITE_AWS_REGION: $app.providers?.aws?.region || 'us-east-2',
            },
        });

        // ==========================================
        // Test Service
        // ==========================================
        const testServiceFunction = createServiceFunction(
            'TestService',
            'services/test-service/index.handler',
            [],
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
            frontendUrl: frontend.url,
        };
    },
});
