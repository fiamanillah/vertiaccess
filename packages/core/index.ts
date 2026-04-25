// packages/core/index.ts

// ==========================================
// Errors
// ==========================================
export {
  HTTPStatusCode,
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AuthorizationError,
  ConflictError,
  RateLimitError,
  PayloadTooLargeError,
  DatabaseError,
  ExternalServiceError,
  TimeoutError,
  BadRequestError,
} from "./src/errors.ts";
export type { AppErrorArgs } from "./src/errors.ts";

// ==========================================
// Error Handling
// ==========================================
export { errorMapperRegistry } from "./src/error-mapper.ts";
export type { ErrorMapper } from "./src/error-mapper.ts";
export { honoErrorHandler } from "./src/error-handler.ts";

// ==========================================
// Logger
// ==========================================
export { logger, AppLogger } from "./src/logger.ts";

// ==========================================
// Config
// ==========================================
export { config } from "./src/config.ts";

// ==========================================
// Types
// ==========================================
export type {
  ApiResponse,
  PaginatedResponse,
  PaginationOptions,
  PaginationResult,
  FilterHandler,
} from "./src/types.ts";

// ==========================================
// Middleware
// ==========================================
export { requestId } from "./src/middleware/request-id.ts";
export { requestLogger } from "./src/middleware/request-logger.ts";
export { corsMiddleware } from "./src/middleware/cors.ts";
export { securityHeaders } from "./src/middleware/security-headers.ts";
export { validateRequest, getValidatedData } from "./src/middleware/validation.ts";
export { cognitoAuth } from "./src/middleware/cognito-auth.ts";
export type { CognitoUser } from "./src/middleware/cognito-auth.ts";

// ==========================================
// Response Helpers
// ==========================================
export {
  sendResponse,
  sendCreatedResponse,
  sendNoContentResponse,
  sendPaginatedResponse,
} from "./src/response.ts";

// ==========================================
// Utilities
// ==========================================
export { extractPaginationParams, paginate } from "./src/utils/pagination.ts";
export { stringToBoolean, stringToNumber } from "./src/utils/string-helpers.ts";
export { generateVTID } from "./src/id-utils.ts";
export type { VTIDPrefix } from "./src/id-utils.ts";

// ==========================================
// Service App Factory
// ==========================================
export { createServiceApp } from "./src/create-service-app.ts";
export type { ServiceAppOptions } from "./src/create-service-app.ts";
