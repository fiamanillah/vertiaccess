// services/auth-service/src/auth.service.ts
import {
  CognitoIdentityProviderClient,
  SignUpCommand,
  ConfirmSignUpCommand,
  InitiateAuthCommand,
  ForgotPasswordCommand,
  ConfirmForgotPasswordCommand,
  ResendConfirmationCodeCommand,
  ChangePasswordCommand,
  AdminDisableUserCommand,
  AdminEnableUserCommand,
  AdminUserGlobalSignOutCommand,
} from '@aws-sdk/client-cognito-identity-provider'
import { NodeHttpHandler } from '@smithy/node-http-handler'
import { Agent } from 'https'
import { AppLogger, AppError, HTTPStatusCode, config } from '@vertiaccess/core'

const logger = new AppLogger('AuthService')

function getErrorMeta(error: unknown) {
  if (error instanceof Error) {
    const errorWithCode = error as Error & { code?: string; cause?: unknown }
    return {
      errorName: error.name,
      errorCode: errorWithCode.code,
      errorMessage: error.message || String(error),
      errorCause: errorWithCode.cause,
      errorStack: error.stack,
    }
  }

  return {
    errorMessage: String(error),
  }
}

// Reuse client across Lambda invocations
const cognitoClient = new CognitoIdentityProviderClient({
  region: config.cognito.region || 'us-east-2',
  requestHandler: new NodeHttpHandler({
    httpsAgent: new Agent({
      keepAlive: true,
      family: 4,
    }),
  }),
})

export class AuthService {
  /**
   * Register a new user in Cognito
   */
  async signUp(
    email: string,
    password: string,
    firstName: string,
    lastName: string,
    role: string = 'operator',
    additionalAttrs: {
      organisation?: string
      flyerId?: string
      operatorId?: string
      contactPhone?: string
    } = {},
  ) {
    logger.info('Registering user in Cognito', { email, role })

    try {
      const attributes = [
        { Name: 'email', Value: email },
        { Name: 'custom:role', Value: role },
        { Name: 'custom:firstName', Value: firstName },
        { Name: 'custom:lastName', Value: lastName },
      ]

      if (additionalAttrs.organisation) {
        attributes.push({
          Name: 'custom:organisation',
          Value: additionalAttrs.organisation,
        })
      }
      if (additionalAttrs.flyerId) {
        attributes.push({
          Name: 'custom:flyerId',
          Value: additionalAttrs.flyerId,
        })
      }
      if (additionalAttrs.operatorId) {
        attributes.push({
          Name: 'custom:operatorId',
          Value: additionalAttrs.operatorId,
        })
      }
      if (additionalAttrs.contactPhone) {
        attributes.push({
          Name: 'custom:contactPhone',
          Value: additionalAttrs.contactPhone,
        })
      }

      const command = new SignUpCommand({
        ClientId: config.cognito.clientId,
        Username: email,
        Password: password,
        UserAttributes: attributes,
      })

      const result = await cognitoClient.send(command)

      logger.info('User registered in Cognito', {
        userSub: result.UserSub,
        confirmed: result.UserConfirmed,
      })

      return {
        userSub: result.UserSub!,
        userConfirmed: result.UserConfirmed || false,
      }
    } catch (error) {
      if (error instanceof AppError) throw error

      const errName = (error as any)?.name
      const errCode = (error as any)?.code
      const errMessage = error instanceof Error ? error.message : String(error)

      if (errName === 'UsernameExistsException') {
        throw new AppError({
          statusCode: HTTPStatusCode.CONFLICT,
          message: 'An account with this email already exists',
          code: 'USER_EXISTS',
          isOperational: true,
        })
      }

      if (errName === 'InvalidPasswordException') {
        throw new AppError({
          statusCode: HTTPStatusCode.BAD_REQUEST,
          message: 'Password does not meet complexity requirements',
          code: 'INVALID_PASSWORD',
          isOperational: true,
        })
      }

      if (
        errCode === 'ETIMEDOUT' ||
        errName === 'TimeoutError' ||
        errMessage.includes('ETIMEDOUT')
      ) {
        throw new AppError({
          statusCode: HTTPStatusCode.SERVICE_UNAVAILABLE,
          message:
            'Unable to reach Cognito service (network timeout). Please verify AWS connectivity and try again.',
          code: 'COGNITO_NETWORK_TIMEOUT',
          isOperational: true,
          details: {
            ...getErrorMeta(error),
            region: config.cognito.region,
          },
        })
      }

      logger.error('Sign-up failed', {
        email,
        ...getErrorMeta(error),
        region: config.cognito.region,
        hasClientId: Boolean(config.cognito.clientId),
      })
      throw error
    }
  }

  /**
   * Confirm user sign-up with verification code
   */
  async confirmSignUp(email: string, code: string) {
    logger.info('Confirming sign-up', { email })

    try {
      const command = new ConfirmSignUpCommand({
        ClientId: config.cognito.clientId,
        Username: email,
        ConfirmationCode: code,
      })

      await cognitoClient.send(command)
      logger.info('User confirmed successfully', { email })
    } catch (error) {
      logger.error('Confirmation failed', {
        email,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Sign in a user and return tokens
   */
  async signIn(email: string, password: string) {
    logger.info('Signing in user', { email })

    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'USER_PASSWORD_AUTH',
        ClientId: config.cognito.clientId,
        AuthParameters: {
          USERNAME: email,
          PASSWORD: password,
        },
      })

      const result = await cognitoClient.send(command)

      if (!result.AuthenticationResult) {
        throw new AppError({
          statusCode: HTTPStatusCode.UNAUTHORIZED,
          message: 'Authentication failed—no tokens returned',
          code: 'AUTH_NO_TOKENS',
          isOperational: true,
        })
      }

      logger.info('User signed in successfully', { email })

      return {
        idToken: result.AuthenticationResult.IdToken!,
        accessToken: result.AuthenticationResult.AccessToken!,
        refreshToken: result.AuthenticationResult.RefreshToken!,
        expiresIn: result.AuthenticationResult.ExpiresIn!,
      }
    } catch (error) {
      if (error instanceof AppError) throw error

      const errName = (error as any)?.name

      if (
        errName === 'NotAuthorizedException' ||
        errName === 'UserNotFoundException'
      ) {
        throw new AppError({
          statusCode: HTTPStatusCode.UNAUTHORIZED,
          message: 'Incorrect email or password',
          code: 'INVALID_CREDENTIALS',
          isOperational: true,
        })
      }

      if (errName === 'UserNotConfirmedException') {
        throw new AppError({
          statusCode: HTTPStatusCode.FORBIDDEN,
          message: 'Please verify your email address before logging in',
          code: 'USER_NOT_CONFIRMED',
          isOperational: true,
        })
      }

      logger.error('Sign-in failed', {
        email,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Refresh tokens using a refresh token
   */
  async refreshToken(refreshToken: string) {
    logger.info('Refreshing tokens')

    try {
      const command = new InitiateAuthCommand({
        AuthFlow: 'REFRESH_TOKEN_AUTH',
        ClientId: config.cognito.clientId,
        AuthParameters: {
          REFRESH_TOKEN: refreshToken,
        },
      })

      const result = await cognitoClient.send(command)

      if (!result.AuthenticationResult) {
        throw new AppError({
          statusCode: HTTPStatusCode.UNAUTHORIZED,
          message: 'Token refresh failed—no tokens returned',
          code: 'REFRESH_NO_TOKENS',
          isOperational: true,
        })
      }

      return {
        idToken: result.AuthenticationResult.IdToken!,
        accessToken: result.AuthenticationResult.AccessToken!,
        expiresIn: result.AuthenticationResult.ExpiresIn!,
      }
    } catch (error) {
      if (error instanceof AppError) throw error
      logger.error('Token refresh failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Initiate forgot password flow
   */
  async forgotPassword(email: string) {
    logger.info('Initiating forgot password', { email })

    try {
      const command = new ForgotPasswordCommand({
        ClientId: config.cognito.clientId,
        Username: email,
      })

      await cognitoClient.send(command)
      logger.info('Forgot password code sent', { email })
    } catch (error) {
      logger.error('Forgot password failed', {
        email,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Reset password with confirmation code
   */
  async resetPassword(email: string, code: string, newPassword: string) {
    logger.info('Resetting password', { email })

    try {
      const command = new ConfirmForgotPasswordCommand({
        ClientId: config.cognito.clientId,
        Username: email,
        ConfirmationCode: code,
        Password: newPassword,
      })

      await cognitoClient.send(command)
      logger.info('Password reset successfully', { email })
    } catch (error) {
      logger.error('Password reset failed', {
        email,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Resend confirmation code
   */
  async resendConfirmationCode(email: string) {
    logger.info('Resending confirmation code', { email })

    try {
      const command = new ResendConfirmationCodeCommand({
        ClientId: config.cognito.clientId,
        Username: email,
      })

      await cognitoClient.send(command)
      logger.info('Confirmation code resent', { email })
    } catch (error) {
      logger.error('Resend confirmation code failed', {
        email,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Change a user's password after verifying current credentials.
   */
  async changePassword(
    email: string,
    currentPassword: string,
    newPassword: string,
  ) {
    logger.info('Changing password', { email })

    try {
      // Authenticate with current password to obtain a valid access token for this user.
      const tokens = await this.signIn(email, currentPassword)

      const command = new ChangePasswordCommand({
        AccessToken: tokens.accessToken,
        PreviousPassword: currentPassword,
        ProposedPassword: newPassword,
      })

      await cognitoClient.send(command)
      logger.info('Password changed successfully', { email })
    } catch (error) {
      logger.error('Change password failed', {
        email,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }
  /**
   * Disable a user (prevent login)
   */
  async adminDisableUser(email: string) {
    logger.info('Disabling user in Cognito', { email })

    try {
      const command = new AdminDisableUserCommand({
        UserPoolId: config.cognito.userPoolId,
        Username: email,
      })
      await cognitoClient.send(command)
      logger.info('User disabled successfully', { email })
    } catch (error) {
      logger.error('Disable user failed', {
        email,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Enable a user (allow login)
   */
  async adminEnableUser(email: string) {
    logger.info('Enabling user in Cognito', { email })

    try {
      const command = new AdminEnableUserCommand({
        UserPoolId: config.cognito.userPoolId,
        Username: email,
      })
      await cognitoClient.send(command)
      logger.info('User enabled successfully', { email })
    } catch (error) {
      logger.error('Enable user failed', {
        email,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }

  /**
   * Globally sign out a user (invalidate tokens immediately)
   */
  async adminUserGlobalSignOut(email: string) {
    logger.info('Globally signing out user', { email })

    try {
      const command = new AdminUserGlobalSignOutCommand({
        UserPoolId: config.cognito.userPoolId,
        Username: email,
      })
      await cognitoClient.send(command)
      logger.info('User globally signed out successfully', { email })
    } catch (error) {
      logger.error('Global sign-out failed', {
        email,
        error: error instanceof Error ? error.message : String(error),
      })
      throw error
    }
  }
}

// Singleton instance for Lambda cold-start reuse
export const authService = new AuthService()
