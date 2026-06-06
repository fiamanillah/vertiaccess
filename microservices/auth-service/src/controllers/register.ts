// microservices/auth-service/src/controllers/register.ts
import type { Context } from 'hono'
import { sendCreatedResponse, AppError, HTTPStatusCode } from '@vertiaccess/core'
import { authService } from '../services/auth/auth.service.ts'
import { RegistrationService } from '../services/auth/registration.service.ts'
import type { CreateUserDTO } from '../schemas/auth.dto.ts'

/**
 * Handler: POST /auth/v1/register
 * Registers a new user in Cognito and creates a User row in the database.
 */
export async function registerHandler(c: Context): Promise<Response> {
  const body = c.get('validatedBody') as CreateUserDTO
  const {
    email,
    firstName,
    lastName,
    password,
    role,
    organisation,
    flyerId,
    operatorId,
    contactPhone,
  } = body

  // 1. Create user in Cognito
  const result = await authService.signUp(
    email,
    password,
    firstName,
    lastName,
    role,
    { organisation, flyerId, operatorId, contactPhone },
  )

  const cognitoSub = result.userSub

  try {
    // 2. Provision database records immediately (User, Profile, Welcome Notification)
    if (role.toLowerCase() === 'assetmanager') {
      await RegistrationService.registerAssetManager(body, cognitoSub)
    } else {
      await RegistrationService.registerOperator(body, cognitoSub)
    }
  } catch (error) {
    // Log error but don't fail the request—the user is already created in Cognito.
    // They can still verify their email, and the system can handle missing DB records later if needed.
    console.error('Database provisioning failed during registration:', error)
    
    // Optional: You could choose to throw an error here, but then you'd have an orphaned Cognito user.
    // Better to return success and let the system recover or log for manual fix.
  }

  return sendCreatedResponse(
    c,
    {
      userSub: result.userSub,
      userConfirmed: result.userConfirmed,
      message:
        'Registration successful. Please check your email for a verification code.',
    },
    'User registered successfully',
  )
}
