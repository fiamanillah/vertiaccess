// services/site-service/src/controllers/bookings.ts
import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '@serverless-backend-starter/database';
import {
    AppError,
    HTTPStatusCode,
    sendResponse,
    sendCreatedResponse,
    type CognitoUser,
    generateCertId,
    generateHumanId,
} from '@serverless-backend-starter/core';
import { createBookingSchema, updateBookingStatusSchema } from '../schemas/booking.schema.ts';
import { stripe } from '../services/stripe.service.ts';

// ==========================================
// Helpers
// ==========================================

function getCognitoUser(c: Context): CognitoUser {
    return c.get('cognitoUser') as CognitoUser;
}

/** Generate a VA booking reference: VA-BKG-XXXXXXXX */
function generateBookingReference(): string {
    const chars = Math.random().toString(36).substring(2, 10).toUpperCase();
    return `VA-BKG-${chars.padEnd(8, 'X').substring(0, 8)}`;
}

/** Generate a deterministic verification hash for a consent certificate */
function generateVerificationHash(bookingId: string, siteId: string, operatorId: string): string {
    const raw = `${bookingId}:${siteId}:${operatorId}:${Date.now()}`;
    return Buffer.from(raw).toString('base64url');
}

function serializeBooking(booking: any) {
    const cert = booking.certificates?.[0] ?? null;
    return {
        id: booking.id,
        humanId: booking.humanId || null,
        bookingReference: booking.bookingReference,
        operatorId: booking.operatorId,
        siteId: booking.siteId,
        siteName: booking.site?.name || null,
        siteAddress: booking.site?.address || null,
        landownerId: booking.site?.landownerId || null,
        startTime: booking.startTime?.toISOString?.() || booking.startTime,
        endTime: booking.endTime?.toISOString?.() || booking.endTime,
        operationReference: booking.operationReference || null,
        droneModel: booking.droneModel || null,
        missionIntent: booking.missionIntent || null,
        useCategory: booking.useCategory,
        flyerId: booking.flyerId || null,
        isPayg: booking.isPayg,
        platformFee: booking.platformFee ? Number(booking.platformFee.toString()) : null,
        toalCost: booking.toalCost ? Number(booking.toalCost.toString()) : null,
        cancellationFee: booking.cancellationFee
            ? Number(booking.cancellationFee.toString())
            : null,
        // Payment card snapshot for masked display
        paymentMethodLast4: booking.paymentMethodLast4 || null,
        paymentMethodBrand: booking.paymentMethodBrand || null,
        status: booking.status,
        paymentStatus: booking.paymentStatus || null,
        createdAt: booking.createdAt?.toISOString?.() || booking.createdAt,
        respondedAt: booking.respondedAt?.toISOString?.() || booking.respondedAt || null,
        cancelledAt: booking.cancelledAt?.toISOString?.() || booking.cancelledAt || null,
        // operator info joined
        operatorEmail: booking.operator?.email || null,
        operatorName: booking.operator?.operatorProfile?.fullName || null,
        operatorOrganisation: booking.operator?.operatorProfile?.organisation || null,
        operatorFlyerId: booking.operator?.operatorProfile?.flyerId || null,
        // Certificate info if available
        certId: cert?.certId || null,
        certificateId: cert?.id || null,
    };
}

// Standard booking include query (used across multiple handlers)
const bookingInclude = {
    site: { select: { name: true, address: true, landownerId: true } },
    operator: {
        select: {
            email: true,
            operatorProfile: {
                select: { fullName: true, organisation: true, flyerId: true },
            },
        },
    },
    certificates: {
        select: { id: true, certId: true },
        take: 1,
    },
} as const;

// ==========================================
// Handlers
// ==========================================

/**
 * POST /sites/v1/bookings
 * Operator creates a new booking request.
 * - Checks operator is VERIFIED
 * - Checks active subscription (skips payment) OR validates paymentIntentId
 * - Auto-approves if site.autoApprove = true
 */
export async function createBookingHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const body = (c.req as any).valid('json') as z.infer<typeof createBookingSchema>;

    // 1. Verify operator exists and is VERIFIED
    const operator = await db.user.findUnique({
        where: { id: cognitoUser.sub },
        include: {
            operatorProfile: true,
            subscription: { include: { plan: true } },
            paymentMethods: {
                where: { isDefault: true },
                take: 1,
            },
        },
    });

    if (!operator) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Operator account not found',
            code: 'NOT_FOUND',
        });
    }

    if (operator.status !== 'VERIFIED') {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Your account must be verified before booking a site',
            code: 'FORBIDDEN',
        });
    }

    // 2. Fetch the site
    const site = await db.site.findUnique({
        where: { id: body.siteId },
        include: { landowner: { select: { id: true, email: true } } },
    });

    if (!site || site.deletedAt || site.status !== 'ACTIVE') {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Site not found or is not currently active',
            code: 'NOT_FOUND',
        });
    }

    // 3. Subscription / payment gate
    const sub = operator.subscription;
    const hasActiveSubscription =
        sub?.status === 'ACTIVE' &&
        (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date());

    let isPayg = false;
    let platformFee = 0;
    let paymentMethodLast4: string | null = null;
    let paymentMethodBrand: string | null = null;

    if (hasActiveSubscription) {
        // Condition A: active subscription — bypass per-booking fee
        isPayg = false;
        platformFee = 0;
    } else {
        // Condition B: no subscription — require a successful Stripe PaymentIntent
        if (!body.paymentIntentId) {
            throw new AppError({
                statusCode: 402 as any,
                message:
                    'Payment required: you have no active subscription. Provide a confirmed paymentIntentId.',
                code: 'PAYMENT_REQUIRED',
            });
        }

        // Verify the PaymentIntent succeeded or attempt off-session confirmation
        let intent = await stripe.paymentIntents.retrieve(body.paymentIntentId);
        
        if (intent.status === 'requires_payment_method' || intent.status === 'requires_confirmation') {
            const defaultCard = operator.paymentMethods[0] ?? null;
            if (!defaultCard) {
                throw new AppError({
                    statusCode: 402 as any,
                    message: 'Payment required: No default payment method found to confirm the payment.',
                    code: 'PAYMENT_REQUIRED',
                });
            }
            try {
                intent = await stripe.paymentIntents.confirm(body.paymentIntentId, {
                    payment_method: defaultCard.stripePaymentMethodId,
                    off_session: true,
                });
            } catch (err: any) {
                throw new AppError({
                    statusCode: 402 as any,
                    message: `Payment confirmation failed: ${err.message}`,
                    code: 'PAYMENT_FAILED',
                });
            }
        }

        if (intent.status !== 'succeeded') {
            throw new AppError({
                statusCode: 402 as any,
                message: `Payment not confirmed. Stripe status: ${intent.status}`,
                code: 'PAYMENT_NOT_CONFIRMED',
            });
        }

        isPayg = true;
        platformFee = site.toalAccessFee ? Number(site.toalAccessFee.toString()) : 0;

        // Capture default payment card for masked display in UI
        const defaultCard = operator.paymentMethods[0] ?? null;
        if (defaultCard) {
            paymentMethodLast4 = defaultCard.last4;
            paymentMethodBrand = defaultCard.brand;
        }
    }

    // 4. Determine initial booking status
    const bookingStatus = site.autoApprove ? 'APPROVED' : 'PENDING';
    const bookingReference = generateBookingReference();
    const humanId = generateHumanId();

    // 5. Create the booking + notifications in a transaction
    const booking = await db.$transaction(async (tx) => {
        const newBooking = await tx.booking.create({
            data: {
                operatorId: cognitoUser.sub,
                siteId: body.siteId,
                bookingReference,
                humanId,
                startTime: new Date(body.startTime),
                endTime: new Date(body.endTime),
                operationReference: body.operationReference || null,
                droneModel: body.droneModel,
                missionIntent: body.missionIntent,
                useCategory: body.useCategory as any,
                isPayg,
                platformFee: platformFee > 0 ? platformFee : null,
                toalCost: site.toalAccessFee ? Number(site.toalAccessFee.toString()) : null,
                paymentMethodLast4,
                paymentMethodBrand,
                status: bookingStatus as any,
                paymentStatus: isPayg ? 'pending' : null,
                respondedAt: bookingStatus === 'APPROVED' ? new Date() : null,
            },
            include: {
                ...bookingInclude,
                site: { select: { name: true, address: true, landownerId: true } },
            },
        });

        // Notify operator
        await tx.notification.create({
            data: {
                userId: cognitoUser.sub,
                type: 'info',
                title: bookingStatus === 'APPROVED' ? 'Booking Approved' : 'Booking Submitted',
                message:
                    bookingStatus === 'APPROVED'
                        ? `Your booking for "${site.name}" (${bookingReference}) has been automatically approved.`
                        : `Your booking request for "${site.name}" (${bookingReference}) has been submitted and is pending landowner approval.`,
                actionUrl: '/dashboard/operator',
                relatedEntityId: newBooking.id,
            },
        });

        // Notify landowner (only when not auto-approved — they already consented)
        if (bookingStatus === 'PENDING') {
            await tx.notification.create({
                data: {
                    userId: site.landownerId,
                    type: 'info',
                    title: 'New Booking Request',
                    message: `A new booking request (${bookingReference}) for your site "${site.name}" is awaiting your approval.`,
                    actionUrl: '/dashboard/landowner',
                    relatedEntityId: newBooking.id,
                },
            });
        }

        // Auto-approve: create consent certificate immediately
        if (bookingStatus === 'APPROVED') {
            const hash = generateVerificationHash(newBooking.id, site.id, cognitoUser.sub);
            const certId = generateCertId();
            await tx.consentCertificate.create({
                data: {
                    bookingId: newBooking.id,
                    certId,
                    issueDate: new Date(),
                    verificationHash: hash,
                    digitalSignature: `SIG_${hash.substring(0, 24)}`,
                    verificationUrl: `https://vertiaccess.app/verify/${hash}`,
                    siteStatusAtIssue: site.status,
                },
            });
        }

        return newBooking;
    });

    // Re-fetch with certificates included for proper serialization
    const bookingWithCert = await db.booking.findUnique({
        where: { id: booking.id },
        include: bookingInclude,
    });

    return sendCreatedResponse(c, serializeBooking(bookingWithCert), 'Booking request submitted');
}

/**
 * GET /sites/v1/bookings/mine
 * Operator fetches their own bookings.
 */
export async function listMyBookingsHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);

    const bookings = await db.booking.findMany({
        where: { operatorId: cognitoUser.sub },
        include: bookingInclude,
        orderBy: { createdAt: 'desc' },
    });

    return sendResponse(c, {
        message: 'Bookings fetched',
        data: bookings.map(serializeBooking),
    });
}

/**
 * GET /sites/v1/bookings/site/:siteId
 * Landowner or Admin fetches all bookings for a specific site.
 */
export async function listSiteBookingsHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const siteId = c.req.param('siteId');
    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';

    // Verify ownership unless admin
    if (!isAdmin) {
        const site = await db.site.findUnique({ where: { id: siteId } });
        if (!site || site.deletedAt) {
            throw new AppError({
                statusCode: HTTPStatusCode.NOT_FOUND,
                message: 'Site not found',
                code: 'NOT_FOUND',
            });
        }
        if (site.landownerId !== cognitoUser.sub) {
            throw new AppError({
                statusCode: HTTPStatusCode.FORBIDDEN,
                message: 'Access denied',
                code: 'FORBIDDEN',
            });
        }
    }

    const bookings = await db.booking.findMany({
        where: { siteId },
        include: bookingInclude,
        orderBy: { createdAt: 'desc' },
    });

    return sendResponse(c, {
        message: 'Site bookings fetched',
        data: bookings.map(serializeBooking),
    });
}

/**
 * GET /sites/v1/bookings/landowner
 * Landowner fetches all bookings across all their sites.
 */
export async function listLandownerBookingsHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';

    // Find all siteIds owned by this landowner
    const ownedSites = await db.site.findMany({
        where: isAdmin
            ? { deletedAt: null }
            : { landownerId: cognitoUser.sub, deletedAt: null },
        select: { id: true },
    });

    const siteIds = ownedSites.map((s) => s.id);

    const bookings = await db.booking.findMany({
        where: { siteId: { in: siteIds } },
        include: bookingInclude,
        orderBy: { createdAt: 'desc' },
    });

    return sendResponse(c, {
        message: 'Landowner bookings fetched',
        data: bookings.map(serializeBooking),
    });
}

/**
 * GET /sites/v1/bookings/:bookingId
 * Fetch a single booking by ID. Accessible by operator, site landowner, or admin.
 */
export async function getBookingHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const bookingId = c.req.param('bookingId');
    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';

    const booking = await db.booking.findUnique({
        where: { id: bookingId },
        include: bookingInclude,
    });

    if (!booking) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Booking not found',
            code: 'NOT_FOUND',
        });
    }

    const isOperator = booking.operatorId === cognitoUser.sub;
    const isLandowner = booking.site?.landownerId === cognitoUser.sub;

    if (!isAdmin && !isOperator && !isLandowner) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Access denied',
            code: 'FORBIDDEN',
        });
    }

    return sendResponse(c, { message: 'Booking fetched', data: serializeBooking(booking) });
}

/**
 * GET /sites/v1/bookings/:bookingId/certificate
 * Fetch the consent certificate for an approved booking.
 * Returns enriched data including landowner + site details for frontend rendering.
 * Accessible by the booking operator, site landowner, or admin.
 */
export async function getBookingCertificateHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const bookingId = c.req.param('bookingId');
    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';

    const booking = await db.booking.findUnique({
        where: { id: bookingId },
        include: {
            site: {
                select: {
                    name: true,
                    address: true,
                    landownerId: true,
                    siteType: true,
                    geometryMetadata: true,
                    status: true,
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
            certificates: {
                take: 1,
                orderBy: { issueDate: 'desc' },
            },
        },
    });

    if (!booking) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Booking not found',
            code: 'NOT_FOUND',
        });
    }

    const isOperator = booking.operatorId === cognitoUser.sub;
    const isLandowner = booking.site?.landownerId === cognitoUser.sub;

    if (!isAdmin && !isOperator && !isLandowner) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Access denied',
            code: 'FORBIDDEN',
        });
    }

    const cert = booking.certificates[0];
    if (!cert) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'No consent certificate found for this booking. Booking may not be approved yet.',
            code: 'NOT_FOUND',
        });
    }

    // Fetch landowner profile for certificate display
    const landownerProfile = await db.landownerProfile.findUnique({
        where: { userId: booking.site?.landownerId ?? '' },
        select: { fullName: true, contactPhone: true },
    });

    const landownerUser = await db.user.findUnique({
        where: { id: booking.site?.landownerId ?? '' },
        select: { email: true },
    });

    const geometryMeta = (booking.site?.geometryMetadata as any) || {};

    const certificateData = {
        // Certificate identification
        id: cert.id,
        certId: cert.certId,
        certificateType: cert.certificateType,
        issueDate: cert.issueDate?.toISOString?.() || cert.issueDate,
        platformName: 'VertiAccess',
        verificationUrl: cert.verificationUrl,
        verificationHash: cert.verificationHash,
        digitalSignature: cert.digitalSignature,
        siteStatusAtIssue: cert.siteStatusAtIssue,

        // Landowner info
        landownerName: landownerProfile?.fullName || 'Landowner',
        landownerEmail: landownerUser?.email || '',
        landownerPhone: landownerProfile?.contactPhone || '',
        authorityDeclaration: true,

        // Site info
        siteId: booking.siteId,
        siteName: booking.site?.name || '',
        siteType: (booking.site?.siteType as any) || 'toal',
        siteAddress: booking.site?.address || '',
        siteGeometry: geometryMeta.geometry || null,
        clzGeometry: geometryMeta.clzGeometry || null,
        siteGeometrySize: geometryMeta.geometry?.radius
            ? `${geometryMeta.geometry.radius}m radius`
            : 'Polygon area',
        siteCoordinates: geometryMeta.geometry?.center
            ? `${geometryMeta.geometry.center.lat}°N, ${geometryMeta.geometry.center.lng}°W`
            : 'N/A',

        // Operator info
        operatorName: booking.operator?.operatorProfile?.fullName || '',
        operatorOrganisation: booking.operator?.operatorProfile?.organisation || null,
        operatorEmail: booking.operator?.email || '',
        operationReference: booking.bookingReference,
        flyerId: booking.operator?.operatorProfile?.flyerId || null,
        droneModel: booking.droneModel,
        missionIntent: booking.missionIntent,

        // Booking details
        startTime: booking.startTime?.toISOString?.() || booking.startTime,
        endTime: booking.endTime?.toISOString?.() || booking.endTime,
        permittedActivities: ['Take-off', 'Landing', 'Recovery'],
        useCategory: booking.useCategory,
        exclusiveUse: false,
        autoApprovalEnabled: false,
        consentStatus: booking.status,

        // Audit
        createdAt: cert.issueDate?.toISOString?.() || cert.issueDate,
        bookingId: booking.id,
        bookingHumanId: booking.humanId,
    };

    return sendResponse(c, {
        message: 'Certificate fetched',
        data: certificateData,
    });
}

/**
 * PATCH /sites/v1/bookings/:bookingId/status
 * Update booking status:
 * - Landowner / Admin: APPROVED, REJECTED
 * - Operator: CANCELLED (own bookings only)
 */
export async function updateBookingStatusHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const bookingId = c.req.param('bookingId');
    const body = (c.req as any).valid('json') as z.infer<typeof updateBookingStatusSchema>;
    const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';

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
                    operatorProfile: { select: { fullName: true, organisation: true } },
                },
            },
        },
    });

    if (!booking) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Booking not found',
            code: 'NOT_FOUND',
        });
    }

    const isLandowner = booking.site?.landownerId === cognitoUser.sub;
    const isOperator = booking.operatorId === cognitoUser.sub;

    // Access control
    if (body.status === 'CANCELLED') {
        if (!isOperator && !isAdmin) {
            throw new AppError({
                statusCode: HTTPStatusCode.FORBIDDEN,
                message: 'Only the operator can cancel their own booking',
                code: 'FORBIDDEN',
            });
        }
    } else if (body.status === 'APPROVED' || body.status === 'REJECTED') {
        if (!isLandowner && !isAdmin) {
            throw new AppError({
                statusCode: HTTPStatusCode.FORBIDDEN,
                message: 'Only the landowner or admin can approve or reject bookings',
                code: 'FORBIDDEN',
            });
        }
    }

    // State transition guards
    if (booking.status === 'CANCELLED' || booking.status === 'EXPIRED') {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: `Cannot update a ${booking.status} booking`,
            code: 'BAD_REQUEST',
        });
    }

    // Compute cancellation fee if applicable
    let cancellationFee: number | null = null;
    let paymentStatus: string | null = null;

    if (body.status === 'CANCELLED') {
        const feePercentage = booking.site?.cancellationFeePercentage
            ? Number(booking.site.cancellationFeePercentage.toString())
            : 0;
        const baseCost = booking.toalCost ? Number(booking.toalCost.toString()) : 0;
        const hoursUntilStart =
            (new Date(booking.startTime).getTime() - Date.now()) / (1000 * 60 * 60);

        if (booking.status === 'APPROVED' && hoursUntilStart > 0 && feePercentage > 0) {
            cancellationFee = baseCost * (feePercentage / 100);
            paymentStatus = 'cancelled_partial';
        } else {
            paymentStatus = 'cancelled_no_charge';
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
                cancelledAt: body.status === 'CANCELLED' ? new Date() : undefined,
                cancellationFee: cancellationFee ?? undefined,
                paymentStatus: paymentStatus as any ?? undefined,
            },
            include: {
                site: {
                    select: { name: true, address: true, landownerId: true, status: true, id: true },
                },
                operator: {
                    select: {
                        email: true,
                        operatorProfile: {
                            select: { fullName: true, organisation: true, flyerId: true },
                        },
                    },
                },
                certificates: { select: { id: true, certId: true }, take: 1 },
            },
        });

        // Create consent certificate on APPROVED
        if (body.status === 'APPROVED') {
            const hash = generateVerificationHash(bookingId, booking.siteId, booking.operatorId);
            const certId = generateCertId();
            await tx.consentCertificate.create({
                data: {
                    bookingId: bookingId,
                    certId,
                    issueDate: new Date(),
                    verificationHash: hash,
                    digitalSignature: `SIG_${hash.substring(0, 24)}`,
                    verificationUrl: `https://vertiaccess.app/verify/${hash}`,
                    siteStatusAtIssue: booking.site?.status || 'ACTIVE',
                },
            });

            // Notify operator — approved
            await tx.notification.create({
                data: {
                    userId: booking.operatorId,
                    type: 'success',
                    title: 'Booking Approved',
                    message: `Your booking (${booking.bookingReference}) for "${booking.site?.name}" has been approved. Your consent certificate is ready.`,
                    actionUrl: '/dashboard/operator',
                    relatedEntityId: bookingId,
                },
            });
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
            });
        }

        if (body.status === 'CANCELLED') {
            // Notify landowner
            await tx.notification.create({
                data: {
                    userId: booking.site!.landownerId,
                    type: 'info',
                    title: 'Booking Cancelled',
                    message: `Booking (${booking.bookingReference}) for "${booking.site?.name}" has been cancelled by the operator.`,
                    actionUrl: '/dashboard/landowner',
                    relatedEntityId: bookingId,
                },
            });
        }

        return updated;
    });

    // Re-fetch with fresh certificates to get the newly created certId
    const finalBooking = await db.booking.findUnique({
        where: { id: bookingId },
        include: bookingInclude,
    });

    return sendResponse(c, {
        message: `Booking ${body.status.toLowerCase()} successfully`,
        data: serializeBooking(finalBooking),
    });
}
