// packages/core/src/utils/user-provisioning.ts
import { db } from '@vertiaccess/database'
import { generateVAID } from '../id-utils.ts'
import { AppError, HTTPStatusCode } from '../errors.ts'
import { AppLogger } from '../logger.ts'

const logger = new AppLogger('UserProvisioning')

export interface CognitoUser {
  sub: string
  email: string
  role: 'operator' | 'landowner'
  firstName?: string
  lastName?: string
}

/**
 * Fallback: Ensure a user exists in the database.
 * Called after Cognito confirmation if the post-confirmation trigger didn't complete.
 * Uses a simplified flow—assume user attributes are minimal since this is recovery.
 */
export async function ensureUserProvisioned(
  cognitoUser: CognitoUser,
): Promise<string> {
  logger.info('Ensuring user is provisioned', {
    email: cognitoUser.email,
    role: cognitoUser.role,
  })

  try {
    // Check if user already exists by Cognito sub
    let user = await db.user.findUnique({
      where: { id: cognitoUser.sub },
      select: { id: true, role: true },
    })

    if (user) {
      logger.info('User already exists', { userId: user.id })
      return user.id
    }

    // Fallback: try lookup by email
    user = await db.user.findUnique({
      where: { email: cognitoUser.email },
      select: { id: true, role: true },
    })

    if (user) {
      logger.info('User found by email, using existing record', {
        userId: user.id,
      })
      return user.id
    }

    // User doesn't exist—create minimal record (should rarely happen if post-confirmation worked)
    logger.warn('User not found, creating fallback record', {
      sub: cognitoUser.sub,
      email: cognitoUser.email,
    })

    const newUser = await db.user.create({
      data: {
        id: cognitoUser.sub,
        email: cognitoUser.email,
        role: cognitoUser.role === 'landowner' ? 'LANDOWNER' : 'OPERATOR',
        status: 'VERIFIED', // Email is already confirmed by Cognito at this point
      },
    })

    // Try to create a minimal profile (non-transactional; best effort)
    try {
      const fullName =
        [cognitoUser.firstName, cognitoUser.lastName]
          .filter(Boolean)
          .join(' ') || 'User'

      if (cognitoUser.role === 'landowner') {
        await db.landownerProfile.upsert({
          where: { userId: newUser.id },
          create: {
            userId: newUser.id,
            vaId: generateVAID('va-lo'),
            fullName,
            contactPhone: '',
          },
          update: {},
        })
      } else {
        await db.operatorProfile.upsert({
          where: { userId: newUser.id },
          create: {
            userId: newUser.id,
            vaId: generateVAID('va-op'),
            fullName,
            contactPhone: '',
            flyerId: '',
          },
          update: {},
        })
      }
    } catch (profileError) {
      logger.warn('Failed to create role profile in fallback provisioning', {
        userId: newUser.id,
        error:
          profileError instanceof Error
            ? profileError.message
            : String(profileError),
      })
      // Don't throw—user exists, profile can be created during onboarding
    }

    logger.info('Fallback user created successfully', {
      userId: newUser.id,
      email: cognitoUser.email,
    })
    return newUser.id
  } catch (error) {
    logger.error('Failed to ensure user provisioning', {
      error: error instanceof Error ? error.message : String(error),
    })

    throw new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Could not provision user account—please try again',
      code: 'PROVISIONING_FAILED',
      isOperational: true,
      details: {
        email: cognitoUser.email,
        originalError: error instanceof Error ? error.message : String(error),
      },
    })
  }
}
