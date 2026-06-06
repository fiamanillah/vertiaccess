import type { CognitoUser } from '@vertiaccess/core'
import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode } from '@vertiaccess/core'
import { bookingInclude } from './utils'

export async function getBooking(cognitoUser: CognitoUser, bookingId: string) {
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  })

  if (!booking) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Booking not found',
      code: 'NOT_FOUND',
    })
  }

  const isOperator = booking.operatorId === cognitoUser.sub
  const isAssetManager = booking.site?.assetManagerId === cognitoUser.sub

  if (!isAdmin && !isOperator && !isAssetManager) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Access denied',
      code: 'FORBIDDEN',
    })
  }

  return booking
}
