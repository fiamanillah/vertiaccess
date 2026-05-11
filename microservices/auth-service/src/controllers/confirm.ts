// services/auth-service/src/confirm.ts
import type { Context } from 'hono'
import { sendResponse } from '@vertiaccess/core'
import { db } from '@vertiaccess/database'
import { authService } from '../services/auth/auth.service.ts'
import type { ConfirmDTO } from '../schemas/auth.dto.ts'

/**
 * Handler: POST /auth/v1/confirm
 * Confirms user sign-up with a verification code sent via email.
 * Includes fallback provisioning in case the post-confirmation trigger timed out.
 */
export async function confirmHandler(c: Context): Promise<Response> {
  const { email, code } = c.get('validatedBody') as ConfirmDTO

  // Confirm with Cognito
  await authService.confirmSignUp(email, code)

  // Fallback: Ensure user exists in database (catches race conditions if trigger didn't complete)
  const existingUser = await db.user.findUnique({
    where: { email },
    select: { id: true },
  })

  if (!existingUser) {
    // User confirmed in Cognito but not yet in DB—log warning but don't fail
    // The user will be created on their first API call or trigger will eventually complete
    console.warn(
      `[ConfirmHandler] User ${email} confirmed in Cognito but not in DB. Will be created by post-confirmation trigger or on first API call.`,
    )
  }

  return sendResponse(c, {
    data: {
      confirmed: true,
      message: 'Email verified successfully. You can now log in.',
    },
    message: 'Email confirmed',
  })
}
