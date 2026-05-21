// services/site-service/src/controllers/bookings.ts
import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '@vertiaccess/database';
import {
    AppError,
    HTTPStatusCode,
    sendResponse,
    sendCreatedResponse,
    sendPaginatedResponse,
    type CognitoUser,
    generateVAID,
} from '@vertiaccess/core';
import {
    createBookingSchema,
    updateBookingStatusSchema,
    confirmEmergencyUsageSchema,
} from '../schemas/booking.schema.ts';

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
    const geometryMeta = (booking.site?.geometryMetadata as any) || {};
    return {
        id: booking.id,
        vaId: booking.vaId || null,
        bookingReference: booking.bookingReference,
        operatorId: booking.operatorId,
        siteId: booking.siteId,
        siteName: booking.site?.name || null,
        siteAddress: booking.site?.address || null,
        landownerId: booking.site?.landownerId || null,
        siteType: booking.site?.siteType || null,
        siteCategory: booking.site?.siteCategory || null,
        sitePhotoUrl: geometryMeta.photoUrl || null,
        siteGeometry: geometryMeta.geometry || null,
        siteClzGeometry: geometryMeta.clzGeometry || null,
        startTime: booking.startTime?.toISOString?.() || booking.startTime,
        endTime: booking.endTime?.toISOString?.() || booking.endTime,
        operationReference: booking.operationReference || null,
        droneModel: booking.droneModel || null,
        missionIntent: booking.missionIntent || null,
        useCategory: booking.useCategory,
        clzUsed: booking.clzUsed ?? null,
        clzConfirmedAt: booking.clzConfirmedAt?.toISOString?.() || booking.clzConfirmedAt || null,
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
        certificateVaId: cert?.vaId || null,
        certificateId: cert?.id || null,
    };
}

// Standard booking include query (used across multiple handlers)
const bookingInclude = {
    site: {
        select: {
            name: true,
            address: true,
            landownerId: true,
            siteType: true,
            siteCategory: true,
            geometryMetadata: true,
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
        select: { id: true, vaId: true },
        take: 1,
    },
} as const;

// ==========================================
// Handlers
// ==========================================

/**
 * GET /bookings/v1/availability/:siteId?date=YYYY-MM-DD
 * Public (no auth) — returns activation hours and booked slots for a specific date.
 * Optional fallback: ?from=YYYY-MM-DD&to=YYYY-MM-DD for a multi-day range.
 */
export async function getPublicSiteAvailabilityHandler(c: Context): Promise<Response> {
    const siteId = c.req.param('siteId');
    const dateParam = c.req.query('date');     // single-day mode (used by calendar)
    const fromParam = c.req.query('from');
    const toParam = c.req.query('to');

    // Validate site exists
    const site = await db.site.findUnique({
        where: { id: siteId },
        select: {
            id: true,
            name: true,
            deletedAt: true,
            status: true,
            exclusiveUse: true,
            geometryMetadata: true,
        },
    });

    if (!site || site.deletedAt) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Site not found',
            code: 'NOT_FOUND',
        });
    }

    // Parse activation hours from site geometry metadata
    // Landowners set these when registering a site (e.g. "08:00" → "20:00")
    const geoMeta = (site.geometryMetadata as any) || {};
    const activationStartTime: string = geoMeta.activationStartTime ?? '08:00';
    const activationEndTime: string = geoMeta.activationEndTime ?? '20:00';

    // Build date filter — single day takes priority over range
    const now = new Date();
    let from: Date;
    let to: Date;

    if (dateParam) {
        // Single day: from 00:00 to 23:59:59 on that date
        from = new Date(`${dateParam}T00:00:00.000Z`);
        to = new Date(`${dateParam}T23:59:59.999Z`);
    } else {
        from = fromParam
            ? new Date(fromParam)
            : new Date(now.getFullYear(), now.getMonth(), now.getDate());
        to = toParam
            ? new Date(toParam)
            : new Date(from.getTime() + 90 * 24 * 60 * 60 * 1000);
    }

    const bookings = await db.booking.findMany({
        where: {
            siteId,
            status: { in: ['PENDING', 'APPROVED'] as any },
            startTime: { lt: to },
            endTime: { gt: from },
        },
        select: {
            startTime: true,
            endTime: true,
            status: true,
            useCategory: true,
        },
        orderBy: { startTime: 'asc' },
    });

    const existingBookings = bookings.map(b => ({
        startTime: b.startTime.toISOString(),
        endTime: b.endTime.toISOString(),
        status: b.status,
        useCategory: b.useCategory,
    }));

    return sendResponse(c, {
        message: 'Site availability fetched',
        data: {
            siteId,
            siteName: site.name,
            exclusiveUse: site.exclusiveUse,
            // Activation window — tells the frontend which time range to render
            activationStartTime,
            activationEndTime,
            // All non-cancelled bookings that overlap the requested date/range
            existingBookings,
            // Legacy slots shape kept for backwards compat
            slots: existingBookings,
        },
    });
}


/**
 * POST /sites/v1/bookings
 * Operator creates a new booking request.
 * - Checks operator is VERIFIED
 * - Checks active subscription (skips PAYG) OR schedules PAYG charging for booking date
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
        sub?.status === 'ACTIVE' && (!sub.currentPeriodEnd || sub.currentPeriodEnd > new Date());

    const bookingStart = new Date(body.startTime);
    const bookingEnd = new Date(body.endTime);
    const bookingStartDate = body.startTime.slice(0, 10);
    const bookingEndDate = body.endTime.slice(0, 10);
    if (
        Number.isNaN(bookingStart.getTime()) ||
        Number.isNaN(bookingEnd.getTime()) ||
        bookingEnd <= bookingStart ||
        bookingStartDate !== bookingEndDate
    ) {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'Invalid booking time range. Bookings must stay within a single date.',
            code: 'BAD_REQUEST',
        });
    }

    const accessFeePerSlot = site.toalAccessFee ? Number(site.toalAccessFee.toString()) : 0;
    const accessFeeTotal = accessFeePerSlot;

    let isPayg = false;
    let platformFee = 0;
    let paymentMethodLast4: string | null = null;
    let paymentMethodBrand: string | null = null;
    const defaultCard = operator.paymentMethods[0] ?? null;

    if (!defaultCard) {
        throw new AppError({
            statusCode: 402 as any,
            message: 'Payment method required: add a default card before creating bookings.',
            code: 'PAYMENT_REQUIRED',
        });
    }

    paymentMethodLast4 = defaultCard.last4;
    paymentMethodBrand = defaultCard.brand;

    if (hasActiveSubscription) {
        // Condition A: active subscription — bypass per-booking fee
        isPayg = false;
        platformFee = 0;
    } else {
        // Condition B: no subscription — mark as PAYG and charge on booking date.
        isPayg = true;
        platformFee = 5.0;
    }

    // 4. Determine initial booking status
    const bookingStatus = site.autoApprove ? 'APPROVED' : 'PENDING';
    const bookingReference = generateBookingReference();
    const vaId = generateVAID('va-bkg');

    // 5. Create the booking + notifications in a transaction
    const booking = await db.$transaction(async tx => {
        const newBooking = await tx.booking.create({
            data: {
                operatorId: cognitoUser.sub,
                siteId: body.siteId,
                bookingReference,
                vaId,
                startTime: new Date(body.startTime),
                endTime: new Date(body.endTime),
                operationReference: body.operationReference || null,
                droneModel: body.droneModel,
                missionIntent: body.missionIntent,
                useCategory: body.useCategory as any,
                isPayg,
                platformFee: platformFee > 0 ? platformFee : null,
                toalCost: accessFeeTotal > 0 ? accessFeeTotal : null,
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
                    bookingStatus === 'APPROVED' && isPayg
                        ? body.useCategory === 'emergency_recovery'
                            ? `Your Emergency & Recovery booking for "${site.name}" (${bookingReference}) is approved. You will only be charged if you confirm the site was used.`
                            : `Your booking for "${site.name}" (${bookingReference}) has been automatically approved. Your card will be charged on the booking start date.`
                        : bookingStatus === 'APPROVED'
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

        // Auto-approve: always create a certificate immediately when booking is approved.
        if (bookingStatus === 'APPROVED') {
            const existingCert = await tx.consentCertificate.findFirst({
                where: { bookingId: newBooking.id },
                select: { id: true },
            });

            if (!existingCert) {
                const hash = generateVerificationHash(newBooking.id, site.id, cognitoUser.sub);
                const vaId = generateVAID('va-cert');
                await tx.consentCertificate.create({
                    data: {
                        bookingId: newBooking.id,
                        vaId,
                        issueDate: new Date(),
                        verificationHash: hash,
                        digitalSignature: `SIG_${hash.substring(0, 24)}`,
                        verificationUrl: `https://vertiaccess.app/verify/${hash}`,
                        siteStatusAtIssue: site.status,
                    },
                });
            }
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

    const query = (c.req.query('query') || c.req.query('search') || '').trim();
    const statusParam = c.req.query('status');
    const useCategoryParam = c.req.query('useCategory');
    const bucket = (c.req.query('bucket') || '').toLowerCase();
    const fromParam = c.req.query('from');
    const toParam = c.req.query('to');
    const pageRaw = parseInt(c.req.query('page') || '1', 10);
    const page = Number.isFinite(pageRaw) && pageRaw > 0 ? pageRaw : 1;
    const limitRaw = parseInt(c.req.query('limit') || '10', 10);
    const limit = Number.isFinite(limitRaw) && limitRaw > 0
        ? Math.min(limitRaw, 100)
        : 10;
    const skip = (page - 1) * limit;
    const sortBy = c.req.query('sort') || 'createdAt';
    const sortOrderParam = (c.req.query('sortOrder') || 'desc').toLowerCase();
    const sortOrder = sortOrderParam === 'asc' ? 'asc' : 'desc';

    const baseFilters: any[] = [];
    if (query) {
        baseFilters.push({
            OR: [
                { bookingReference: { contains: query, mode: 'insensitive' } },
                { operationReference: { contains: query, mode: 'insensitive' } },
                { site: { name: { contains: query, mode: 'insensitive' } } },
                { site: { address: { contains: query, mode: 'insensitive' } } },
            ],
        });
    }

    if (useCategoryParam) {
        const useCategories = useCategoryParam
            .split(',')
            .map(item => item.trim().toLowerCase())
            .filter(Boolean);
        if (useCategories.length) {
            baseFilters.push({ useCategory: { in: useCategories } });
        }
    }

    const statusList = statusParam
        ? statusParam
            .split(',')
            .map(item => item.trim().toUpperCase())
            .filter(Boolean)
        : [];
    const hasStatusFilter = statusList.length > 0;

    const fromDate = fromParam ? new Date(fromParam) : null;
    const toDate = toParam ? new Date(toParam) : null;
    const range: { gte?: Date; lte?: Date } = {};
    if (fromDate && Number.isFinite(fromDate.getTime())) {
        range.gte = fromDate;
    }
    if (toDate && Number.isFinite(toDate.getTime())) {
        range.lte = toDate;
    }
    if (Object.keys(range).length > 0) {
        baseFilters.push({ startTime: range });
    }

    const now = new Date();
    let bucketFilter: any | null = null;
    if (bucket === 'pending') {
        bucketFilter = { status: 'PENDING' };
    } else if (bucket === 'upcoming') {
        bucketFilter = { status: 'APPROVED', endTime: { gt: now } };
    } else if (bucket === 'past') {
        bucketFilter = {
            OR: [
                { status: { in: ['REJECTED', 'CANCELLED', 'EXPIRED'] as any } },
                { status: 'APPROVED', endTime: { lte: now } },
            ],
        };
    }

    const dataFilters = [...baseFilters];
    if (bucketFilter) {
        dataFilters.push(bucketFilter);
    } else if (hasStatusFilter) {
        dataFilters.push({ status: { in: statusList as any } });
    }

    const where: any = { operatorId: cognitoUser.sub };
    if (dataFilters.length) {
        where.AND = dataFilters;
    }

    const orderBy: any = {};
    if (sortBy === 'startTime') {
        orderBy.startTime = sortOrder;
    } else if (sortBy === 'endTime') {
        orderBy.endTime = sortOrder;
    } else if (sortBy === 'status') {
        orderBy.status = sortOrder;
    } else if (sortBy === 'siteName') {
        orderBy.site = { name: sortOrder };
    } else {
        orderBy.createdAt = sortOrder;
    }

    const baseCountFilters = [...baseFilters];
    if (!bucketFilter && hasStatusFilter) {
        baseCountFilters.push({ status: { in: statusList as any } });
    }

    const buildCountWhere = (extraFilter?: any) => {
        const filters = extraFilter
            ? [...baseCountFilters, extraFilter]
            : [...baseCountFilters];
        const countWhere: any = { operatorId: cognitoUser.sub };
        if (filters.length) {
            countWhere.AND = filters;
        }
        return countWhere;
    };

    const [bookings, total, pendingCount, upcomingCount, pastCount, unresolvedEmergency] =
        await Promise.all([
            db.booking.findMany({
                where,
                include: bookingInclude,
                orderBy,
                skip,
                take: limit,
            }),
            db.booking.count({ where }),
            db.booking.count({ where: buildCountWhere({ status: 'PENDING' }) }),
            db.booking.count({
                where: buildCountWhere({
                    status: 'APPROVED',
                    endTime: { gt: now },
                }),
            }),
            db.booking.count({
                where: buildCountWhere({
                    OR: [
                        { status: { in: ['REJECTED', 'CANCELLED', 'EXPIRED'] as any } },
                        { status: 'APPROVED', endTime: { lte: now } },
                    ],
                }),
            }),
            db.booking.findFirst({
                where: {
                    operatorId: cognitoUser.sub,
                    useCategory: 'emergency_recovery',
                    status: 'APPROVED',
                    endTime: { lt: now },
                    paymentStatus: 'pending',
                    clzConfirmedAt: null,
                },
                include: bookingInclude,
                orderBy: { endTime: 'desc' },
            }),
        ]);

    const totalPages = Math.max(Math.ceil(total / limit), 1);

    return sendPaginatedResponse(c, {
        message: 'Bookings fetched',
        data: bookings.map(serializeBooking),
        pagination: {
            page,
            limit,
            total,
            totalPages,
            hasNext: page < totalPages,
            hasPrevious: page > 1,
        },
        extraMeta: {
            counts: {
                pending: pendingCount,
                upcoming: upcomingCount,
                past: pastCount,
            },
            unresolvedEmergency: unresolvedEmergency
                ? serializeBooking(unresolvedEmergency)
                : null,
        },
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
        where: isAdmin ? { deletedAt: null } : { landownerId: cognitoUser.sub, deletedAt: null },
        select: { id: true },
    });

    const siteIds = ownedSites.map(s => s.id);

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
            message:
                'No consent certificate found for this booking. Booking may not be approved yet.',
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
        vaId: cert.vaId,
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
        bookingVaId: booking.vaId,
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

    const updatedBooking = await db.$transaction(async tx => {
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
        });

        // Create consent certificate whenever a booking is approved.
        if (body.status === 'APPROVED') {
            const existingCert = await tx.consentCertificate.findFirst({
                where: { bookingId },
                select: { id: true },
            });

            if (!existingCert) {
                const hash = generateVerificationHash(
                    bookingId,
                    booking.siteId,
                    booking.operatorId
                );
                const vaId = generateVAID('va-cert');
                await tx.consentCertificate.create({
                    data: {
                        bookingId: bookingId,
                        vaId,
                        issueDate: new Date(),
                        verificationHash: hash,
                        digitalSignature: `SIG_${hash.substring(0, 24)}`,
                        verificationUrl: `https://vertiaccess.app/verify/${hash}`,
                        siteStatusAtIssue: booking.site?.status || 'ACTIVE',
                    },
                });
            }

            // Notify operator — approved & certificate ready
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

    // Re-fetch with fresh certificates to get the newly created vaId
    const finalBooking = await db.booking.findUnique({
        where: { id: bookingId },
        include: bookingInclude,
    });

    return sendResponse(c, {
        message: `Booking ${body.status.toLowerCase()} successfully`,
        data: serializeBooking(finalBooking),
    });
}

/**
 * PATCH /bookings/v1/:bookingId/emergency-usage
 * Operator confirms whether an approved Emergency & Recovery booking was actually used.
 */
export async function confirmEmergencyUsageHandler(c: Context): Promise<Response> {
    const cognitoUser = getCognitoUser(c);
    const bookingId = c.req.param('bookingId');
    const body = (c.req as any).valid('json') as z.infer<typeof confirmEmergencyUsageSchema>;

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

    if (booking.operatorId !== cognitoUser.sub) {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'You can only confirm usage for your own booking',
            code: 'FORBIDDEN',
        });
    }

    if (booking.useCategory !== 'emergency_recovery') {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'Usage confirmation is only available for Emergency & Recovery bookings',
            code: 'BAD_REQUEST',
        });
    }

    if (booking.status !== 'APPROVED') {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'Only approved bookings can be usage-confirmed',
            code: 'BAD_REQUEST',
        });
    }

    if (new Date(booking.endTime) > new Date()) {
        throw new AppError({
            statusCode: HTTPStatusCode.BAD_REQUEST,
            message: 'Usage can only be confirmed after the operation window ends',
            code: 'BAD_REQUEST',
        });
    }

    const updated = await db.$transaction(async tx => {
        const updatedBooking = await tx.booking.update({
            where: { id: bookingId },
            data: {
                clzUsed: body.used,
                clzConfirmedAt: new Date(),
            },
            include: bookingInclude,
        });

        await tx.notification.create({
            data: {
                userId: booking.site?.landownerId,
                type: 'info',
                title: 'Emergency Usage Confirmed',
                message: body.used
                    ? `Operator confirmed Emergency & Recovery usage for booking ${booking.bookingReference}.`
                    : `Operator confirmed Emergency & Recovery booking ${booking.bookingReference} was not used.`,
                actionUrl: '/dashboard/landowner',
                relatedEntityId: bookingId,
            },
        });

        return updatedBooking;
    });

    return sendResponse(c, {
        message: body.used
            ? 'Emergency usage confirmed. Payment can now be processed.'
            : 'Emergency usage marked as not used. No charge should be applied.',
        data: serializeBooking(updated),
    });
}
