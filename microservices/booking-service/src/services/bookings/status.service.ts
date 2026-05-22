import type { CognitoUser } from '@vertiaccess/core'
import { db } from '@vertiaccess/database'
import { AppError, HTTPStatusCode, generateVAID } from '@vertiaccess/core'
import { generateVerificationHash, bookingInclude } from './utils'

export async function updateBookingStatus(
  cognitoUser: CognitoUser,
  bookingId: string,
  body: any,
) {
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'

  const booking = await db.booking.findUnique({
    where: { id: bookingId },
    include: {
      site: {
        select: {
          id: true,
          name: true,
          landownerId: true,
          toalAccessFee: true,
          cancellationFeePercentage: true,
          status: true,
        },
      },
      operator: {
        select: {
          email: true,
          operatorProfile: {
            select: { fullName: true, organisation: true },
          },
        },
      },
    },
  })

  if (!booking) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Booking not found',
      code: 'NOT_FOUND',
    })
  }

  const isLandowner = booking.site?.landownerId === cognitoUser.sub
  const isOperator = booking.operatorId === cognitoUser.sub

  if (body.status === 'CANCELLED') {
    if (!isOperator && !isAdmin) {
      throw new AppError({
        statusCode: HTTPStatusCode.FORBIDDEN,
        message: 'Only the operator can cancel their own booking',
        code: 'FORBIDDEN',
      })
    }
  } else if (body.status === 'APPROVED' || body.status === 'REJECTED') {
    if (!isLandowner && !isAdmin) {
      throw new AppError({
        statusCode: HTTPStatusCode.FORBIDDEN,
        message:
          'Only the landowner or admin can approve or reject bookings',
        code: 'FORBIDDEN',
      })
    }
  }

  if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: `Cannot update a ${booking.status} booking`,
      code: 'BAD_REQUEST',
    })
  }

  let cancellationFee: number | null = null
  let paymentStatus: string | null = null

  if (body.status === 'CANCELLED') {
    const feePercentage = booking.site?.cancellationFeePercentage
      ? Number(booking.site.cancellationFeePercentage.toString())
      : 0
    const baseCost = booking.toalCost
      ? Number(booking.toalCost.toString())
      : 0
    const hoursUntilStart =
      (new Date(booking.startTime).getTime() - Date.now()) /
      (1000 * 60 * 60)

    if (
      booking.status === 'APPROVED' &&
      hoursUntilStart > 0 &&
      feePercentage > 0
    ) {
      cancellationFee = baseCost * (feePercentage / 100)
      paymentStatus = 'cancelled_partial'
    } else {
      paymentStatus = 'cancelled_no_charge'
    }
  }

  const updatedBooking = await db.$transaction(async (tx) => {
    const updated = await tx.booking.update({
      where: { id: bookingId },
      data: {
        status: body.status as any,
        respondedAt:
          body.status === 'APPROVED' || body.status === 'REJECTED'
            ? new Date()
            : undefined,
        cancelledAt:
          body.status === 'CANCELLED' ? new Date() : undefined,
        cancellationFee: cancellationFee ?? undefined,
        paymentStatus: (paymentStatus as any) ?? undefined,
      },
      include: {
        site: {
          select: {
            name: true,
            address: true,
            landownerId: true,
            status: true,
            id: true,
          },
        },
        operator: {
          select: {
            email: true,
            operatorProfile: {
              select: { fullName: true, organisation: true, flyerId: true },
            },
          },
        },
        certificates: { select: { id: true, vaId: true }, take: 1 },
      },
    })

    if (body.status === 'APPROVED') {
      const existingCert = await tx.consentCertificate.findFirst({
        where: { bookingId },
        select: { id: true },
      })

      if (!existingCert) {
        const hash = generateVerificationHash(
          bookingId,
          booking.siteId,
          booking.operatorId,
        )
        const certVaId = generateVAID('va-cert')
        await tx.consentCertificate.create({
          data: {
            bookingId,
            vaId: certVaId,
            issueDate: new Date(),
            verificationHash: hash,
            digitalSignature: `SIG_${hash.substring(0, 24)}`,
            verificationUrl: `https://vertiaccess.app/verify/${hash}`,
            siteStatusAtIssue: booking.site?.status || 'ACTIVE',
          },
        })
      }

      await tx.notification.create({
        data: {
          userId: booking.operatorId,
          type: 'success',
          title: 'Booking Approved',
          message: `Your booking (${booking.bookingReference}) for "${booking.site?.name}" has been approved. Your consent certificate is ready.`,
          actionUrl: '/dashboard/operator',
          relatedEntityId: bookingId,
        },
      })
    }

    if (body.status === 'REJECTED') {
      await tx.notification.create({
        data: {
          userId: booking.operatorId,
          type: 'error',
          title: 'Booking Rejected',
          message: `Your booking (${booking.bookingReference}) for "${booking.site?.name}" was rejected.${body.adminNote ? ` Reason: ${body.adminNote}` : ''}`,
          actionUrl: '/dashboard/operator',
          relatedEntityId: bookingId,
        },
      })
    }

    if (body.status === 'CANCELLED') {
      await tx.notification.create({
        data: {
          userId: booking.site!.landownerId,
          type: 'info',
          title: 'Booking Cancelled',
          message: `Booking (${booking.bookingReference}) for "${booking.site?.name}" has been cancelled by the operator.`,
          actionUrl: '/dashboard/landowner',
          relatedEntityId: bookingId,
        },
      })
    }

    return updated
  })

  const finalBooking = await db.booking.findUnique({
    where: { id: bookingId },
    include: bookingInclude,
  })

  if (!finalBooking) {
    throw new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Booking could not be loaded after status update',
      code: 'INTERNAL_ERROR',
    })
  }

  return finalBooking
}
