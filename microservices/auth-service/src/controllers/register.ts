// microservices/auth-service/src/controllers/register.ts
import type { Context } from 'hono'
import { sendCreatedResponse } from '@vertiaccess/core'
import { authService } from '../services/auth/auth.service.ts'
import type { CreateUserDTO } from '../schemas/auth.dto.ts'

/**
 * Handler: POST /auth/v1/register
 * Registers a new user in Cognito and creates a User row in the database.
 */
export async function registerHandler(c: Context): Promise<Response> {
  const body = c.get('validatedBody') as CreateUserDTO
  const { email, firstName, lastName, password, role } = body

  // 1. Create user in Cognito
  const result = await authService.signUp(
    email,
    password,
    firstName,
    lastName,
    role,
  )

  // Database provisioning is now handled by the Cognito Post-Confirmation trigger.
  // The register endpoint must only create the user in Cognito.

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
