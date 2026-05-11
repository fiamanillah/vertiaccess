// packages/core/src/create-service-app.ts
import { Hono } from 'hono'
import { requestId } from './middleware/request-id.ts'
import { requestLogger } from './middleware/request-logger.ts'
import { corsMiddleware } from './middleware/cors.ts'
import { securityHeaders } from './middleware/security-headers.ts'
import { honoErrorHandler } from './error-handler.ts'
import { errorMapperRegistry } from './error-mapper.ts'
import { cognitoErrorMapper } from './error-mappers/cognito-error-mapper.ts'
import { NotFoundError } from './errors.ts'

export interface ServiceAppOptions {
  /** Service name — used for logging context */
  serviceName?: string
  /** Base path prefix for all routes (e.g., "/auth/v1") */
  basePath?: string
}

/**
 * Factory that creates a Hono app pre-configured with all global middleware.
 * This is the serverless equivalent of IgnitorApp + setupGlobalMiddlewares.
 *
 * Each Lambda service calls this once:
 * ```ts
 * const app = createServiceApp({ serviceName: "auth-service" });
 * app.post("/register", validateRequest(schema), handler);
 * export const handler = handle(app);
 * ```
 */
export function createServiceApp(options: ServiceAppOptions = {}): Hono {
  const { basePath } = options

  const app = new Hono({ strict: false })

  // Register error mappers (before any middleware)
  errorMapperRegistry.register(cognitoErrorMapper)

  // 1. Request ID (must be first — other middleware depends on it)
  app.use('*', requestId())

  // 2. Security headers
  app.use('*', securityHeaders())

  // 3. CORS
  app.use('*', corsMiddleware())

  // 4. Request logger
  app.use('*', requestLogger())

  // 5. Health check
  const healthPath = basePath ? `${basePath}/health` : '/health'
  app.get(healthPath, (c) => {
    return c.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      service: options.serviceName || 'unknown',
    })
  })

  // 6. Global error handler
  app.onError(honoErrorHandler)

  // 7. 404 Not Found handler (must be registered last by the service)
  app.notFound((c) => {
    throw new NotFoundError(`Route ${c.req.method} ${c.req.path}`)
  })

  return app
}
