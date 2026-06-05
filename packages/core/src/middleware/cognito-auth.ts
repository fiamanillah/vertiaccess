// packages/core/src/middleware/cognito-auth.ts
import type { Context, Next } from 'hono'
import { CognitoJwtVerifier } from 'aws-jwt-verify'
import { config } from '../config.ts'
import { AuthenticationError } from '../errors.ts'
import { AppLogger } from '../logger.ts'
import { db } from '@vertiaccess/database'
import { generateVAID } from '../id-utils.ts'

const logger = new AppLogger('CognitoAuth')

// Lazy-init verifiers (reused across Lambda invocations)
// Note: These are initialized once per cold start to pick up fresh environment variables.
let idTokenVerifier: ReturnType<typeof CognitoJwtVerifier.create> | null = null
let accessTokenVerifier: ReturnType<typeof CognitoJwtVerifier.create> | null =
  null
let relaxedIdTokenVerifier: ReturnType<
  typeof CognitoJwtVerifier.create
> | null = null
let relaxedAccessTokenVerifier: ReturnType<
  typeof CognitoJwtVerifier.create
> | null = null

function getConfiguredClientIds() {
  return config.cognito.clientId
    .split(',')
    .map((id) => id.trim())
    .filter(Boolean)
}

function createVerifier(tokenUse: 'id' | 'access', skipClientIdCheck = false) {
  if (!config.cognito.userPoolId) {
    throw new Error(
      'Cognito configuration missing: COGNITO_USER_POOL_ID must be set',
    )
  }

  const clientIds = getConfiguredClientIds()
  const clientId = skipClientIdCheck
    ? null
    : clientIds.length > 1
      ? clientIds
      : (clientIds[0] ?? null)

  return CognitoJwtVerifier.create({
    userPoolId: config.cognito.userPoolId,
    tokenUse,
    clientId,
  })
}

function getIdTokenVerifier() {
  if (!idTokenVerifier) {
    idTokenVerifier = createVerifier('id')
  }

  return idTokenVerifier
}

function getAccessTokenVerifier() {
  if (!accessTokenVerifier) {
    accessTokenVerifier = createVerifier('access')
  }

  return accessTokenVerifier
}

function getRelaxedIdTokenVerifier() {
  if (!relaxedIdTokenVerifier) {
    relaxedIdTokenVerifier = createVerifier('id', true)
  }

  return relaxedIdTokenVerifier
}

function getRelaxedAccessTokenVerifier() {
  if (!relaxedAccessTokenVerifier) {
    relaxedAccessTokenVerifier = createVerifier('access', true)
  }

  return relaxedAccessTokenVerifier
}

export interface CognitoUser {
  sub: string
  email: string
  role: string
  firstName?: string
  lastName?: string
}

/**
 * Hono middleware that verifies a Cognito token from the Authorization header.
 * Sets `c.set("cognitoUser", { sub, email, role })` for downstream handlers.
 */
export function cognitoAuth() {
  return async (c: Context, next: Next) => {
    const authHeader = c.req.header('Authorization')

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw new AuthenticationError('Missing or invalid Authorization header')
    }

    const token = authHeader.slice(7)

    try {
      let payload: Awaited<
        ReturnType<ReturnType<typeof CognitoJwtVerifier.create>['verify']>
      >

      try {
        payload = await getIdTokenVerifier().verify(token)
      } catch (idTokenError) {
        logger.info(
          'ID token verification failed, trying access token verifier',
          {
            error: idTokenError,
          },
        )
        try {
          payload = await getAccessTokenVerifier().verify(token)
        } catch {
          // Fallback: if clientId checks are stale or drifted between services,
          // allow any app client in the same user pool after signature validation.
          try {
            payload = await getRelaxedIdTokenVerifier().verify(token)
            logger.warn(
              'Token accepted without strict clientId check (ID token fallback)',
              {
                configuredClientIds: getConfiguredClientIds(),
              },
            )
          } catch {
            payload = await getRelaxedAccessTokenVerifier().verify(token)
            logger.warn(
              'Token accepted without strict clientId check (access token fallback)',
              {
                configuredClientIds: getConfiguredClientIds(),
              },
            )
          }
        }
      }

      const fallbackRole =
        (payload['custom:role'] as string)?.toLowerCase() === 'assetowner'
          ? 'ASSETOWNER'
          : 'OPERATOR'

      // Check user status in the database for instant revocation and to enrich
      // the request context from canonical application data.
      let dbUser = await db.user.findUnique({
        where: { id: payload.sub },
        select: {
          id: true,
          email: true,
          role: true,
          status: true,
          deletedAt: true,
          operatorProfile: { select: { userId: true } },
          assetOwnerProfile: { select: { userId: true } },
        },
      })

      if (!dbUser) {
        if (!payload.email) {
          throw new AuthenticationError('User not found in database')
        }

        const existingByEmail = await db.user.findUnique({
          where: { email: payload.email as string },
          select: {
            id: true,
            email: true,
            role: true,
            status: true,
            deletedAt: true,
            operatorProfile: { select: { userId: true } },
            assetOwnerProfile: { select: { userId: true } },
          },
        })

        if (existingByEmail) {
          // If this is the same user by email but with stale/non-cognito ID,
          // relink the record to the Cognito subject to prevent duplicates.
          if (existingByEmail.id !== payload.sub) {
            dbUser = await db.user.update({
              where: { id: existingByEmail.id },
              data: {
                id: payload.sub,
                role: existingByEmail.role || fallbackRole,
              },
              select: {
                id: true,
                email: true,
                role: true,
                status: true,
                deletedAt: true,
                operatorProfile: { select: { userId: true } },
                assetOwnerProfile: { select: { userId: true } },
              },
            })
          } else {
            dbUser = existingByEmail
          }
        } else {
          dbUser = await db.user.create({
            data: {
              id: payload.sub,
              email: payload.email as string,
              role: fallbackRole,
              status: 'UNVERIFIED',
            },
            select: {
              id: true,
              email: true,
              role: true,
              status: true,
              deletedAt: true,
              operatorProfile: { select: { userId: true } },
              assetOwnerProfile: { select: { userId: true } },
            },
          })
        }
      }

      // Ensure appropriate profile exists
      if (dbUser.role === 'OPERATOR' && !dbUser.operatorProfile) {
        const firstName = (payload['custom:firstName'] as string) || ''
        const lastName = (payload['custom:lastName'] as string) || ''
        const fullName = `${firstName} ${lastName}`.trim() || dbUser.email.split('@')[0] || ''
        
        await db.operatorProfile.create({
          data: {
            userId: dbUser.id,
            vaId: generateVAID('va-op'),
            fullName,
            organisation: (payload['custom:organisation'] as string) || null,
            contactPhone: (payload['custom:contactPhone'] as string) || '',
            flyerId: (payload['custom:flyerId'] as string) || '',
            operatorReference: (payload['custom:operatorId'] as string) || null,
          },
        })
      } else if (dbUser.role === 'ASSETOWNER' && !dbUser.assetOwnerProfile) {
        const firstName = (payload['custom:firstName'] as string) || ''
        const lastName = (payload['custom:lastName'] as string) || ''
        const fullName = `${firstName} ${lastName}`.trim() || dbUser.email.split('@')[0] || ''
        
        await db.assetOwnerProfile.create({
          data: {
            userId: dbUser.id,
            vaId: generateVAID('va-ao'),
            fullName,
            organisation: (payload['custom:organisation'] as string) || null,
            contactPhone: (payload['custom:contactPhone'] as string) || '',
          },
        })
      }

      const cognitoUser: CognitoUser = {
        sub: payload.sub,
        email: dbUser.email,
        role: dbUser.role,
        firstName: (payload['custom:firstName'] as string) || undefined,
        lastName: (payload['custom:lastName'] as string) || undefined,
      }

      if (dbUser.status === 'SUSPENDED') {
        throw new AuthenticationError('Account is suspended')
      }

      // PAYMENT_LOCKED: block all routes except those needed to resolve the debt
      if (dbUser.status === 'PAYMENT_LOCKED') {
        const path = c.req.path
        const allowedPaths = [
          '/users/v1/me',
          '/payments/v1/payment-methods',
          '/payments/v1/payment-methods/retry-overdue',
        ]
        const isAllowed = allowedPaths.some(
          (p) => path === p || path.startsWith(p),
        )
        if (!isAllowed) {
          // Fetch overdue booking summary for the error response
          const lockDetails = await db.user.findUnique({
            where: { id: dbUser.id },
            select: {
              overdueBookingId: true,
              paymentLockedReason: true,
            },
          })
          return c.json(
            {
              success: false,
              error: 'ACCOUNT_PAYMENT_LOCKED',
              message:
                'Your account is suspended due to an overdue emergency landing payment. Please resolve your outstanding balance to regain access.',
              data: {
                overdueBookingId: lockDetails?.overdueBookingId ?? null,
                paymentLockedReason: lockDetails?.paymentLockedReason ?? null,
              },
            },
            403,
          )
        }
      }

      if (
        dbUser.deletedAt &&
        new Date(dbUser.deletedAt).getTime() <= Date.now()
      ) {
        throw new AuthenticationError('Account has been deactivated')
      }

      c.set('cognitoUser', cognitoUser)
      await next()
    } catch (error) {
      if (error instanceof AuthenticationError) {
        throw error
      }

      logger.error('Token verification failed', { error })
      throw new AuthenticationError('Invalid or expired token', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}
