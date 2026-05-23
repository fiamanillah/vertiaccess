/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: 'vertiaccess',
      removal: input?.stage === 'production' ? 'retain' : 'remove',
      protect: ['production'].includes(input?.stage),
      home: 'aws',
      providers: {
        aws: {
          region: 'us-east-2',
          version: '7.20.0',
        },
      },
    }
  },
  async run() {
    const aws = await import('@pulumi/aws')
    const slugify = (value: string) =>
      value
        .toLowerCase()
        .replace(/[^a-z0-9-]/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
    const stageSlug = slugify($app.stage).slice(0, 12) || 'stage'
    const appSlug = slugify($app.name).slice(0, 18) || 'app'
    const resourceRevision = 'v2'
    const resourcePrefix = `vertiaccess-${stageSlug}-${appSlug}-${resourceRevision}`
    const isLocalDevelopmentStage = $app.stage === 'fiamanillah'
    const vpc = isLocalDevelopmentStage
      ? undefined
      : new sst.aws.Vpc('VertiaccessVpcV2', { nat: 'managed' })
    // fiamanillah is a local-only stage that must use the Docker Postgres URL.
    // Other non-production stages keep the SST-managed RDS default unless overridden.
    const useExternalDatabase = process.env.USE_EXTERNAL_DATABASE === 'true'
    let appSecretsArn: any

    const DATABASE_URL = (() => {
      if (isLocalDevelopmentStage) {
        return (
          process.env.DATABASE_URL ||
          'postgresql://postgres:postgres@localhost:5432/vertiaccess'
        )
      }

      if (useExternalDatabase) {
        const dbUrl = new sst.Secret('DatabaseUrl')
        return dbUrl.value
      }

      if (!vpc) {
        throw new Error(
          'VPC is required for the shared dev and production stages',
        )
      }

      const dbPassword = new sst.Secret('DatabasePassword')

      const dbIdentifier = `${resourcePrefix}-db`
      const dbSubnetGroup = new aws.rds.SubnetGroup('MySubnetGroup', {
        name: `${resourcePrefix}-subnet-group`,
        subnetIds: vpc.privateSubnets,
      })

      // Mirror SST-managed password into AWS Secrets Manager for console visibility.
      const appSecrets = new aws.secretsmanager.Secret('AppSecrets', {
        name: `${resourcePrefix}-app-secrets`,
        description: `Application secrets for stage ${$app.stage}`,
      })

      new aws.secretsmanager.SecretVersion('AppSecretsVersion', {
        secretId: appSecrets.id,
        secretString: $interpolate`{"databasePassword":"${dbPassword.value}"}`,
      })

      appSecretsArn = appSecrets.arn

      new aws.rds.Instance('MyDatabase', {
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
      })

      const dbCredentials = new aws.secretsmanager.Secret(
        'DatabaseCredentials',
        {
          name: `${resourcePrefix}-db-credentials`,
          description: `RDS credentials for stage ${$app.stage}`,
        },
      )

      new aws.secretsmanager.SecretVersion('DatabaseCredentialsVersion', {
        secretId: dbCredentials.id,
        secretString: $interpolate`{"username":"postgres","password":"${dbPassword.value}"}`,
      })

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
      })

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
      })

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
      })

      const proxyDefaultTargetGroup = new aws.rds.ProxyDefaultTargetGroup(
        'MyProxyTargetGroup',
        {
          dbProxyName: proxy.name,
          connectionPoolConfig: {
            maxConnectionsPercent: 100,
          },
        },
      )

      new aws.rds.ProxyTarget('MyProxyTarget', {
        dbProxyName: proxy.name,
        targetGroupName: proxyDefaultTargetGroup.name,
        dbInstanceIdentifier: dbIdentifier,
      })

      return $interpolate`postgresql://postgres:${dbPassword.value}@${proxy.endpoint}:5432/vertiaccess?sslmode=require`
    })()

    // ==========================================
    // Cognito User Pool
    // ==========================================
    const userPool = new sst.aws.CognitoUserPool('AuthUserPoolV2', {
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
            {
              name: 'organisation',
              attributeDataType: 'String',
              mutable: true,
              required: false,
              stringAttributeConstraints: {
                minLength: '1',
                maxLength: '200',
              },
            },
            {
              name: 'flyerId',
              attributeDataType: 'String',
              mutable: true,
              required: false,
              stringAttributeConstraints: {
                minLength: '1',
                maxLength: '50',
              },
            },
            {
              name: 'operatorId',
              attributeDataType: 'String',
              mutable: true,
              required: false,
              stringAttributeConstraints: {
                minLength: '1',
                maxLength: '50',
              },
            },
            {
              name: 'contactPhone',
              attributeDataType: 'String',
              mutable: true,
              required: false,
              stringAttributeConstraints: {
                minLength: '1',
                maxLength: '50',
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
    })

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
    })

    const siteDocumentsBucket = new sst.aws.Bucket('SiteDocuments', {
      cors: {
        allowMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        allowOrigins: ['*'],
        allowHeaders: ['*'],
        maxAge: '1 day',
      },
    })

    const privateDocumentsBucket = new sst.aws.Bucket('PrivateDocuments', {
      cors: {
        allowMethods: ['GET', 'PUT', 'POST', 'DELETE', 'HEAD'],
        allowOrigins: ['*'],
        allowHeaders: ['*'],
        maxAge: '1 day',
      },
    })

    // ==========================================
    // API Gateway
    // ==========================================
    const api = new sst.aws.ApiGatewayV2('MyApi', {
      cors: {
        allowOrigins: ['*'],
        allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
        allowHeaders: [
          'Authorization',
          'Content-Type',
          'Accept',
          'Origin',
          'X-Requested-With',
        ],
      },
    })

    // ==========================================
    // Frontend Application
    // ==========================================
    // NOTE: legacy frontend `packages/frontend` StaticSite removed —
    // if you need to re-enable building a static frontend, recreate
    // a `new sst.aws.StaticSite(...)` entry here.

    // ==========================================
    // Secret Management (pulled from SST secrets or env)
    // ==========================================
    const stripeSecretKey = new sst.Secret('StripeSecretKey')
    const stripePublishableKey = new sst.Secret('StripePublishableKey')
    const stripeWebhookSecret = new sst.Secret('StripeWebhookSecret')
    const bookingChargeKey = new sst.Secret('BookingChargeKey')

    // ==========================================
    // Shared environment variables for all Lambda functions
    // ==========================================
    // CORS Origins: Always include localhost for dev. Production frontend
    // URL previously came from the removed `frontend` StaticSite.
    const corsOrigins = (() => {
      const origins = ['http://localhost:3000', 'http://localhost:5173']
      const envOrigins =
        process.env.ALLOWED_ORIGINS?.split(',').map((o) => o.trim()) || []
      return [...new Set([...origins, ...envOrigins])].join(',')
    })()

    const sharedEnv = {
      NODE_ENV: $app.stage === 'production' ? 'production' : 'development',
      LOG_LEVEL: process.env.LOG_LEVEL || 'info',
      ALLOWED_ORIGINS: corsOrigins,
      COGNITO_USER_POOL_ID: userPool.id,
      COGNITO_CLIENT_ID: userPoolClient.id,
      PUBLIC_S3_BUCKET: siteDocumentsBucket.name,
      PRIVATE_S3_BUCKET: privateDocumentsBucket.name,
      APP_AWS_REGION: $app.providers?.aws?.region || 'us-east-2',
      DATABASE_URL: DATABASE_URL,
    }

    const createServiceFunction = (
      name: string,
      handler: string,
      link: any[],
      memory: `${number} MB` | `${number} GB` = '256 MB',
      timeout:
        | `${number} second`
        | `${number} seconds`
        | `${number} minute`
        | `${number} minutes` = '30 seconds',
    ) => {
      return new sst.aws.Function(name, {
        handler,
        environment: {
          ...sharedEnv,
          STRIPE_SECRET_KEY: stripeSecretKey.value,
          STRIPE_PUBLISHABLE_KEY: stripePublishableKey.value,
          STRIPE_WEBHOOK_SECRET: stripeWebhookSecret.value,
          BOOKING_CHARGE_KEY: bookingChargeKey.value,
        },
        link,
        ...(vpc ? { vpc } : {}),
        architecture: 'arm64',
        memory,
        timeout,
      })
    }

    const routeService = (basePath: string, functionArn: any) => {
      api.route(`ANY ${basePath}`, functionArn)
      api.route(`ANY ${basePath}/{proxy+}`, functionArn)
    }

    // ==========================================
    // Auth Services
    // ==========================================
    const authServiceFunction = createServiceFunction(
      'AuthService',
      'microservices/auth-service/index.handler',
      [siteDocumentsBucket, userPool],
    )
    routeService('/auth/v1', authServiceFunction.arn)

    const userServiceFunction = createServiceFunction(
      'UserService',
      'microservices/user-service/index.handler',
      [siteDocumentsBucket, userPool],
    )
    routeService('/users/v1', userServiceFunction.arn)

    const adminServiceFunction = createServiceFunction(
      'AdminService',
      'microservices/admin-service/index.handler',
      [siteDocumentsBucket, privateDocumentsBucket, userPool],
    )
    routeService('/admin/v1', adminServiceFunction.arn)

    // ==========================================
    // Billing / Payment Services
    // ==========================================
    const subscriptionServiceFunction = createServiceFunction(
      'SubscriptionService',
      'microservices/subscription-service/index.handler',
      [],
    )
    routeService('/subscriptions/v1', subscriptionServiceFunction.arn)

    const paymentServiceFunction = createServiceFunction(
      'PaymentService',
      'microservices/payment-service/index.handler',
      [],
    )
    routeService('/payments/v1', paymentServiceFunction.arn)

    // ==========================================
    // Site Services
    // ==========================================
    const siteServiceFunction = createServiceFunction(
      'SiteService',
      'microservices/site-service/index.handler',
      [siteDocumentsBucket, privateDocumentsBucket],
    )
    routeService('/sites/v1', siteServiceFunction.arn)

    const mediaServiceFunction = createServiceFunction(
      'MediaService',
      'microservices/media-service/index.handler',
      [siteDocumentsBucket, privateDocumentsBucket],
    )
    routeService('/media/v1', mediaServiceFunction.arn)
    routeService('/documents/v1', mediaServiceFunction.arn) // Alias for backward compatibility

    const siteVerificationServiceFunction = createServiceFunction(
      'SiteVerificationService',
      'microservices/site-verification-service/index.handler',
      [siteDocumentsBucket, privateDocumentsBucket],
    )
    routeService('/site-verifications/v1', siteVerificationServiceFunction.arn)

    // ==========================================
    // Booking Services
    // ==========================================
    const bookingServiceFunction = createServiceFunction(
      'BookingService',
      'microservices/booking-service/index.handler',
      [],
    )
    routeService('/bookings/v1', bookingServiceFunction.arn)

    const bookingQueryServiceFunction = createServiceFunction(
      'BookingQueryService',
      'microservices/booking-query-service/index.handler',
      [],
    )
    routeService('/booking-queries/v1', bookingQueryServiceFunction.arn)

    // ==========================================
    // Incident Services
    // ==========================================
    const incidentServiceFunction = createServiceFunction(
      'IncidentService',
      'microservices/incident-service/index.handler',
      [],
    )
    routeService('/incidents/v1', incidentServiceFunction.arn)

    const incidentQueryServiceFunction = createServiceFunction(
      'IncidentQueryService',
      'microservices/incident-query-service/index.handler',
      [],
    )
    routeService('/incident-queries/v1', incidentQueryServiceFunction.arn)

    // ==========================================
    // Booking payment cron (charge approved PAYG bookings on start date)
    // ==========================================
    new sst.aws.CronV2('BookingDuePaymentsCron', {
      schedule: 'rate(5 minutes)',
      job: {
        handler: 'scripts/process-due-booking-payments.handler',
        timeout: '30 seconds',
        ...(vpc ? { vpc } : {}),
        architecture: 'arm64',
        environment: {
          API_BASE_URL: api.url,
          DATABASE_URL: DATABASE_URL,
          BOOKING_CHARGE_KEY: bookingChargeKey.value,
        },
      },
    })

    // ==========================================
    // Notification Service
    // ==========================================
    const notificationServiceFunction = createServiceFunction(
      'NotificationService',
      'microservices/notification-service/index.handler',
      [],
    )
    routeService('/notifications/v1', notificationServiceFunction.arn)

    // ==========================================
    // Test Service
    // ==========================================
    const testServiceFunction = createServiceFunction(
      'TestService',
      'microservices/test-service/index.handler',
      [],
      '128 MB',
      '10 seconds',
    )
    routeService('/test/v1', testServiceFunction.arn)

    // ==========================================
    // Outputs
    // ==========================================
    return {
      apiUrl: api.url,
      userPoolId: userPool.id,
      userPoolClientId: userPoolClient.id,
      appSecretsArn: appSecretsArn ?? '',
    }
  },
})
