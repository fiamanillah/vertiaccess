// packages/core/src/error-mappers/cognito-error-mapper.ts
import type { ErrorMapper } from '../error-mapper.ts'
import { AppError, HTTPStatusCode } from '../errors.ts'

/**
 * Maps AWS Cognito SDK exceptions to AppError instances.
 * Provides frontend-friendly HTTP status codes and messages.
 */
export const cognitoErrorMapper: ErrorMapper = (
  err: unknown,
): AppError | null => {
  if (!(err instanceof Error)) {
    return null
  }

  const errorName = err.name
  const errorMessage = err.message

  // Map Cognito-specific error codes
  // Reference: https://docs.aws.amazon.com/cognito-user-identity-pools/latest/APIReference/API_InitiateAuth.html
  if (errorName === 'NotAuthorizedException') {
    return new AppError({
      statusCode: HTTPStatusCode.UNAUTHORIZED,
      message: 'Invalid credentials—email or password is incorrect',
      code: 'INVALID_CREDENTIALS',
      isOperational: true,
    })
  }

  if (errorName === 'UsernameExistsException') {
    return new AppError({
      statusCode: HTTPStatusCode.CONFLICT,
      message:
        'Email already registered—please log in or use a different email',
      code: 'USER_ALREADY_EXISTS',
      isOperational: true,
    })
  }

  if (errorName === 'CodeMismatchException') {
    return new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'Invalid or expired verification code',
      code: 'INVALID_CODE',
      isOperational: true,
    })
  }

  if (errorName === 'UserNotFoundException') {
    return new AppError({
      statusCode: HTTPStatusCode.UNAUTHORIZED,
      message: 'User not found—please sign up first',
      code: 'USER_NOT_FOUND',
      isOperational: true,
    })
  }

  if (errorName === 'InvalidParameterException') {
    return new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'Invalid input provided—please check your request',
      code: 'INVALID_PARAMETER',
      isOperational: true,
      details: { originalMessage: errorMessage },
    })
  }

  if (errorName === 'InvalidPasswordException') {
    return new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message:
        'Password does not meet requirements (minimum 8 characters, at least one uppercase, lowercase, and number)',
      code: 'INVALID_PASSWORD',
      isOperational: true,
    })
  }

  if (errorName === 'TooManyRequestsException') {
    return new AppError({
      statusCode: HTTPStatusCode.TOO_MANY_REQUESTS,
      message: 'Too many attempts—please try again in a few minutes',
      code: 'RATE_LIMIT_EXCEEDED',
      isOperational: true,
    })
  }

  if (errorName === 'LimitExceededException') {
    return new AppError({
      statusCode: HTTPStatusCode.TOO_MANY_REQUESTS,
      message: 'Too many failed attempts—please try again later',
      code: 'LIMIT_EXCEEDED',
      isOperational: true,
    })
  }

  if (errorName === 'UserNotConfirmedException') {
    return new AppError({
      statusCode: HTTPStatusCode.UNAUTHORIZED,
      message: 'Please confirm your email before logging in',
      code: 'USER_NOT_CONFIRMED',
      isOperational: true,
    })
  }

  if (errorName === 'PasswordResetRequiredException') {
    return new AppError({
      statusCode: HTTPStatusCode.UNAUTHORIZED,
      message: 'Password reset required—please check your email',
      code: 'PASSWORD_RESET_REQUIRED',
      isOperational: true,
    })
  }

  if (errorName === 'ResourceNotFoundException') {
    return new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Resource not found',
      code: 'RESOURCE_NOT_FOUND',
      isOperational: true,
    })
  }

  if (errorName === 'InvalidIdentityPoolConfigurationException') {
    return new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Service configuration error',
      code: 'CONFIG_ERROR',
      isOperational: false,
      details: { originalMessage: errorMessage },
    })
  }

  // Generic AWS error handling
  if (
    errorMessage.includes('AccessDenied') ||
    errorMessage.includes('Forbidden')
  ) {
    return new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Access denied',
      code: 'ACCESS_DENIED',
      isOperational: true,
    })
  }

  if (
    errorMessage.includes('ServiceUnavailable') ||
    errorMessage.includes('temporarily')
  ) {
    return new AppError({
      statusCode: HTTPStatusCode.SERVICE_UNAVAILABLE,
      message: 'Service temporarily unavailable—please try again later',
      code: 'SERVICE_UNAVAILABLE',
      isOperational: true,
    })
  }

  // Not a recognized Cognito error
  return null
}
