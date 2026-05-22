import type { Context } from 'hono'
import type { CognitoUser } from '@vertiaccess/core'

export function getCognitoUser(c: Context): CognitoUser {
  return c.get('cognitoUser') as CognitoUser
}
