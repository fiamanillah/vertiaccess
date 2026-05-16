// packages/core/src/response.ts
import type { Context } from "hono";
import type { ContentfulStatusCode } from "hono/utils/http-status";
import type { ApiResponse, PaginatedResponse } from "./types.ts";
import { HTTPStatusCode } from "./errors.ts";

/**
 * Functional response helpers — replaces BaseController methods.
 * Takes Hono Context instead of Express req/res.
 */

export function sendResponse<T>(
  c: Context,
  opts: {
    message?: string;
    statusCode?: HTTPStatusCode;
    data?: T;
  } = {},
): Response {
  const { message, statusCode = HTTPStatusCode.OK, data } = opts;
  const requestId =
    (c.get("requestId") as string | undefined) || "unknown";

  const response: ApiResponse<T> = {
    success: true,
    message,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
    },
    data,
  };

  return c.json(response, statusCode as ContentfulStatusCode);
}

export function sendCreatedResponse<T>(
  c: Context,
  data: T,
  message: string = "Resource created successfully",
): Response {
  return sendResponse(c, {
    message,
    statusCode: HTTPStatusCode.CREATED,
    data,
  });
}

export function sendNoContentResponse(c: Context): Response {
  return c.body(null, HTTPStatusCode.NO_CONTENT as ContentfulStatusCode);
}

export function sendPaginatedResponse<T>(
  c: Context,
  opts: {
    data: T[];
    pagination: PaginatedResponse<T>["meta"]["pagination"];
    message?: string;
    extraMeta?: Record<string, unknown>;
  },
): Response {
  const requestId =
    (c.get("requestId") as string | undefined) || "unknown";

  const response: PaginatedResponse<T> = {
    success: true,
    message: opts.message,
    meta: {
      requestId,
      timestamp: new Date().toISOString(),
      pagination: opts.pagination,
      ...(opts.extraMeta || {}),
    },
    data: opts.data,
  };

  return c.json(response, HTTPStatusCode.OK as ContentfulStatusCode);
}
