// packages/database/src/prisma-error-mapper.ts
import {
  errorMapperRegistry,
  AppError,
  ConflictError,
  NotFoundError,
  HTTPStatusCode,
} from "@vertiaccess/core";
import {
  PrismaClientInitializationError,
  PrismaClientKnownRequestError,
  PrismaClientUnknownRequestError,
} from "@prisma/client/runtime/client";

/**
 * Translates Prisma ORM errors into standard domain AppErrors.
 * Extracted from the Express template's PrismaProvider.
 */
function mapPrismaError(err: unknown): AppError | null {
  // 1. Handle Known Errors (these have .code and .meta)
  if (err instanceof PrismaClientKnownRequestError) {
    switch (err.code) {
      case "P2002":
        return new ConflictError("A record with this data already exists", {
          fields: err.meta?.target,
          constraint: "unique_constraint",
        });
      case "P2025":
        return new NotFoundError("Record to update not found", {
          operation: err.meta,
        });
      case "P2003":
        return new AppError({
          statusCode: HTTPStatusCode.BAD_REQUEST,
          message: "Foreign key constraint failed",
          code: "FOREIGN_KEY_ERROR",
          details: { constraint: err.meta },
        });
      case "P2014":
        return new AppError({
          statusCode: HTTPStatusCode.BAD_REQUEST,
          message: "Invalid data provided",
          code: "INVALID_DATA",
          details: { relation: err.meta },
        });
      default:
        return new AppError({
          statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
          message: "Database operation failed",
          code: "DATABASE_ERROR",
          details: { prismaCode: err.code, meta: err.meta },
        });
    }
  }

  // 2. Handle Unknown or Initialization Errors
  if (
    err instanceof PrismaClientUnknownRequestError ||
    err instanceof PrismaClientInitializationError
  ) {
    return new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: "Database connection or execution failed",
      code: "DATABASE_RUNTIME_ERROR",
      details: { originalError: (err as Error).message },
    });
  }

  // Return null if it's not a Prisma error
  return null;
}

// Auto-register the Prisma error mapper on import
errorMapperRegistry.register(mapPrismaError);
