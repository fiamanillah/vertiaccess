// services/auth-service/src/controllers/me.ts
import type { Context } from 'hono';
import { sendResponse, type CognitoUser } from '@vertiaccess/core';
import { db } from '@vertiaccess/database';

/**
 * Handler: GET /auth/v1/me
 * Returns the current authenticated user's information.
 */
export async function meHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;

    // Fetch full user details including profile and subscription
    const userRecord = await db.user.findUnique({
        where: { id: cognitoUser.sub },
        include: {
            operatorProfile: true,
            assetOwnerProfile: true,
            subscription: {
                include: { plan: true },
            },
        },
    });

    // Fetch the latest verification package submitted by this user
    const latestVerification = await db.verification.findFirst({
        where: {
            userId: cognitoUser.sub,
            type: cognitoUser.role === 'OPERATOR' ? 'operator' : 'identity',
        },
        orderBy: {
            createdAt: 'desc',
        },
    });

    const passwordChangeNotice = await db.notification.findFirst({
        where: {
            userId: cognitoUser.sub,
            type: 'security',
            title: 'Password Changed',
        },
        orderBy: {
            createdAt: 'desc',
        },
        select: {
            createdAt: true,
        },
    });

    const dbStatus = userRecord?.status ?? 'UNVERIFIED';
    const isVerified = dbStatus === 'VERIFIED';

    // Compute detailed verification/account status
    let verificationStatus: string = dbStatus;
    if (dbStatus === 'UNVERIFIED') {
        if (latestVerification?.status === 'PENDING') {
            verificationStatus = 'PENDING';
        } else if (latestVerification?.status === 'REJECTED') {
            verificationStatus = 'REJECTED';
        } else {
            verificationStatus = 'NOT_SUBMITTED';
        }
    } else if (dbStatus === 'VERIFIED') {
        verificationStatus = 'APPROVED';
    }

    const rejectionReason = latestVerification?.status === 'REJECTED'
        ? latestVerification.rejectionReason
        : null;

    const suspendedReason = dbStatus === 'SUSPENDED'
        ? userRecord?.suspendedReason
        : null;

    // Fetch overdue booking details if account is PAYMENT_LOCKED
    let overdueBookingDetails = null;
    if (dbStatus === 'PAYMENT_LOCKED' && userRecord?.overdueBookingId) {
        const overdueBooking = await db.booking.findUnique({
            where: { id: userRecord.overdueBookingId },
            select: {
                bookingReference: true,
                emergencyAuthAmount: true,
                emergencyAuthCardLast4: true,
                site: { select: { name: true } },
            },
        });
        if (overdueBooking) {
            overdueBookingDetails = {
                bookingId: userRecord.overdueBookingId,
                bookingReference: overdueBooking.bookingReference,
                siteName: overdueBooking.site?.name ?? 'Unknown Site',
                amountDue: overdueBooking.emergencyAuthAmount
                    ? Number(overdueBooking.emergencyAuthAmount.toString())
                    : 150.0,
                cardLast4: overdueBooking.emergencyAuthCardLast4 ?? null,
            };
        }
    }

    return sendResponse(c, {
        data: {
            sub: cognitoUser.sub,
            email: cognitoUser.email,
            role: cognitoUser.role,
            firstName: cognitoUser.firstName,
            lastName: cognitoUser.lastName,
            fullName:
                userRecord?.operatorProfile?.fullName ?? userRecord?.assetOwnerProfile?.fullName,
            verified: isVerified,
            verificationStatus,
            hasPendingVerification: verificationStatus === 'PENDING',
            rejectionReason,
            suspendedReason,
            // Payment lockout state — used by frontend to show hard-stop UX
            paymentLocked: dbStatus === 'PAYMENT_LOCKED',
            paymentLockedReason: userRecord?.paymentLockedReason ?? null,
            paymentLockedAt: userRecord?.paymentLockedAt?.toISOString() ?? null,
            overdueBookingId: userRecord?.overdueBookingId ?? null,
            overdueBookingDetails,
            planTier: userRecord?.subscription?.plan?.name,
            subscriptionStatus: userRecord?.subscription?.status,
            organisation:
                userRecord?.operatorProfile?.organisation ??
                userRecord?.assetOwnerProfile?.organisation,
            flyerId: userRecord?.operatorProfile?.flyerId,
            operatorId: userRecord?.operatorProfile?.operatorReference,
            vaId: userRecord?.operatorProfile?.vaId ?? userRecord?.assetOwnerProfile?.vaId,
            contactPhone:
                userRecord?.operatorProfile?.contactPhone ??
                userRecord?.assetOwnerProfile?.contactPhone,
            passwordChangedAt: passwordChangeNotice?.createdAt?.toISOString(),
        },
        message: 'User info retrieved',
    });
}
