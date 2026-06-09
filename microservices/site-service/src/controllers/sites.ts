// services/site-service/src/controllers/sites.ts
import type { Context } from 'hono'
import { z } from 'zod'
import { db } from '@vertiaccess/database'
import {
  AppError,
  HTTPStatusCode,
  sendResponse,
  sendPaginatedResponse,
  sendCreatedResponse,
  type CognitoUser,
  generateVAID,
  generatePresignedDownloadUrl,
} from '@vertiaccess/core'
import {
  createSiteSchema,
  updateSiteSchema,
  updateSiteStatusSchema,
} from '../schemas/site.schema.ts'

// ==========================================
// Helpers
// ==========================================

function getCognitoUser(c: Context): CognitoUser {
  return c.get('cognitoUser') as CognitoUser
}

function mapRoleToDbRole(role: string): 'ADMIN' | 'OPERATOR' | 'ASSETMANAGER' {
  const normalized = (role || '').toUpperCase()
  if (normalized === 'ADMIN') return 'ADMIN'
  if (normalized === 'ASSETMANAGER') return 'ASSETMANAGER'
  return 'OPERATOR'
}

/**
 * Verify that a Cognito user has a provisioned database record.
 * Throws 401 Unauthorized if user is not found (should have been created during sign-up).
 */
async function getAuthenticatedUserId(
  cognitoUser: CognitoUser,
): Promise<string> {
  const user = await db.user.findUnique({
    where: { id: cognitoUser.sub },
    select: { id: true },
  })

  if (!user) {
    throw new AppError({
      statusCode: HTTPStatusCode.UNAUTHORIZED,
      message:
        'User account not provisioned—please complete the sign-up process',
      code: 'USER_NOT_PROVISIONED',
    })
  }

  return user.id
}

function requireOwnerOrAdmin(
  cognitoUser: CognitoUser,
  assetManagerId: string,
  effectiveUserId: string,
): void {
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'
  if (
    !isAdmin &&
    cognitoUser.sub !== assetManagerId &&
    effectiveUserId !== assetManagerId
  ) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'You do not have permission to access this site',
      code: 'FORBIDDEN',
    })
  }
}

function toIsoOrNull(value: unknown): string | null {
  if (!value) return null
  const date = new Date(String(value))
  if (!Number.isFinite(date.getTime())) return null
  return date.toISOString()
}

function calculateUtilisationAndLastUsed(bookings: any[]) {
  const thirtyDaysAgo = new Date()
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)

  const bookingsInLast30Days = bookings.filter(
    (b) => new Date(b.startTime) >= thirtyDaysAgo,
  )

  let totalBookedMinutes = 0
  for (const booking of bookingsInLast30Days) {
    const start = new Date(booking.startTime)
    const end = new Date(booking.endTime)
    const durationMs = end.getTime() - start.getTime()
    if (durationMs > 0) {
      totalBookedMinutes += durationMs / (1000 * 60)
    }
  }

  const totalAvailableMinutes = 30 * 24 * 60
  let utilisation = Math.round(
    (totalBookedMinutes / totalAvailableMinutes) * 100,
  )
  if (utilisation > 100) utilisation = 100

  let lastUsed: number | null = null
  if (bookings.length > 0) {
    const mostRecent = new Date(bookings[0].startTime)
    const now = new Date()
    const diffMs = now.getTime() - mostRecent.getTime()
    lastUsed = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)))
  }

  return { utilisation, lastUsed }
}

/**
 * Serialize a Prisma Site record into a clean API response.
 * Converts Decimal fields to numbers and parses JSON geometry metadata.
 */
function serializeSite(site: any) {
  const geometryMeta = site.geometryMetadata || {}

  return {
    id: site.id,
    vaId: site.vaId || null,
    assetManagerId: site.assetManagerId,
    siteReference: site.siteReference,
    name: site.name,
    description: site.description,
    siteType: site.siteType,
    zoneType: site.zoneType || null,
    siteCategory: site.siteCategory,
    address: site.address,
    postcode: site.postcode,
    contactEmail: site.contactEmail,
    contactPhone: site.contactPhone,
    validityStart: site.validityStart?.toISOString?.() || site.validityStart,
    validityEnd: site.validityEnd?.toISOString?.() || site.validityEnd || null,
    autoApprove: site.autoApprove,
    exclusiveUse: site.exclusiveUse,
    emergencyRecoveryEnabled: site.emergencyRecoveryEnabled,
    clzEnabled: site.clzEnabled,
    geometry: geometryMeta.geometry || null,
    clzGeometry: geometryMeta.clzGeometry || null,
    toalAccessFee: site.toalAccessFee
      ? Number(site.toalAccessFee.toString())
      : null,
    clzAccessFee: site.clzAccessFee
      ? Number(site.clzAccessFee.toString())
      : null,
    hourlyRate: site.hourlyRate ? Number(site.hourlyRate.toString()) : null,
    cancellationFeePercentage: site.cancellationFeePercentage
      ? Number(site.cancellationFeePercentage.toString())
      : null,
    currency: site.currency,
    status: site.status,
    siteInformation: geometryMeta.siteInformation || null,
    adminInternalNote: geometryMeta.adminInternalNote || null,
    rejectionReasonNote: geometryMeta.rejectionReasonNote || null,
    adminNote: geometryMeta.rejectionReasonNote || null,
    authorizedToGrantAccess:
      geometryMeta.authorizedToGrantAccess === true
        ? true
        : geometryMeta.authorizedToGrantAccess === false
          ? false
          : null,
    acceptedAssetManagerDeclaration:
      geometryMeta.acceptedAssetManagerDeclaration === true
        ? true
        : geometryMeta.acceptedAssetManagerDeclaration === false
          ? false
          : null,
    photoUrl: geometryMeta.photoUrl || null,
    documents: (site.documents || []).map((doc: any) => ({
      id: doc.id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileKey: doc.fileKey,
      fileSize: doc.fileSize,
      uploadedAt: doc.uploadedAt?.toISOString?.() || doc.uploadedAt,
    })),
    createdAt: site.createdAt?.toISOString?.() || site.createdAt,
    utilisation: site.utilisation ?? null,
    lastUsed: site.lastUsed ?? null,
  }
}

// ==========================================
// Handlers
// ==========================================

/**
 * POST /sites/v1 — Create a new site
 */
export async function createSiteHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const body = (c.req as any).valid('json') as z.infer<typeof createSiteSchema>

  const effectiveUserId = await getAuthenticatedUserId(cognitoUser)

  const userRecord = await db.user.findUnique({
    where: { id: effectiveUserId },
    select: { role: true, status: true },
  })

  if (!userRecord) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'User not found',
      code: 'NOT_FOUND',
    })
  }

  if (userRecord.role === 'ASSETMANAGER' && userRecord.status !== 'VERIFIED') {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'AssetManager profile must be verified before creating a site',
      code: 'FORBIDDEN',
    })
  }

  // Defensive dedupe for rapid repeat submits/retries from the client.
  // If a matching site was created very recently, return it instead of creating another row.
  const duplicateWindowStart = new Date(Date.now() - 2 * 60 * 1000)
  const recentMatchingSites = await db.site.findMany({
    where: {
      assetManagerId: effectiveUserId,
      deletedAt: null,
      name: body.name,
      address: body.address,
      postcode: body.postcode,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      createdAt: { gte: duplicateWindowStart },
    },
    include: { documents: true },
    orderBy: { createdAt: 'desc' },
    take: 5,
  })

  const requestedValidityStartIso = toIsoOrNull(body.validityStart)
  const requestedValidityEndIso = toIsoOrNull(body.validityEnd)

  const duplicateSite = recentMatchingSites.find((site) => {
    const metadata = (site.geometryMetadata || {}) as Record<string, unknown>
    const existingGeometry = JSON.stringify(metadata.geometry ?? null)
    const existingClzGeometry = JSON.stringify(metadata.clzGeometry ?? null)
    const requestedGeometry = JSON.stringify(body.geometry ?? null)
    const requestedClzGeometry = JSON.stringify(body.clzGeometry ?? null)
    const existingValidityStartIso = toIsoOrNull(site.validityStart)
    const existingValidityEndIso = toIsoOrNull(site.validityEnd)

    return (
      existingGeometry === requestedGeometry &&
      existingClzGeometry === requestedClzGeometry &&
      existingValidityStartIso === requestedValidityStartIso &&
      existingValidityEndIso === requestedValidityEndIso
    )
  })

  if (duplicateSite) {
    return sendResponse(c, {
      message: 'Duplicate site submission detected; returning existing site',
      data: serializeSite(duplicateSite),
    })
  }

  // Build geometry metadata JSON (stores circle/polygon data without PostGIS)
  const geometryMetadata: Record<string, unknown> = {
    geometry: body.geometry,
    clzGeometry: body.clzGeometry || null,
    siteInformation: body.siteInformation || null,
    authorizedToGrantAccess: body.authorizedToGrantAccess ?? null,
    acceptedAssetManagerDeclaration:
      body.acceptedAssetManagerDeclaration ?? null,
    photoUrl: null,
    ...body.geometryMetadata,
  }

  const site: any = await db.site.create({
    data: {
      assetManagerId: effectiveUserId,
      vaId: generateVAID('va-site'),
      name: body.name,
      description: body.description || null,
      siteType: body.siteType || null,
      zoneType: body.zoneType || null,
      siteCategory: body.siteCategory || null,
      address: body.address,
      postcode: body.postcode,
      contactEmail: body.contactEmail,
      contactPhone: body.contactPhone,
      geometryType: body.geometry.type.toUpperCase() as any,
      validityStart: new Date(body.validityStart),
      validityEnd: body.validityEnd ? new Date(body.validityEnd) : null,
      autoApprove: body.autoApprove ?? false,
      exclusiveUse: body.exclusiveUse ?? false,
      emergencyRecoveryEnabled: body.emergencyRecoveryEnabled ?? false,
      clzEnabled: body.clzEnabled ?? false,
      toalAccessFee: body.toalAccessFee ?? null,
      clzAccessFee: body.clzAccessFee ?? null,
      hourlyRate: body.hourlyRate ?? null,
      cancellationFeePercentage: body.cancellationFeePercentage ?? null,
      geometryMetadata: geometryMetadata as any,
      status: 'UNDER_REVIEW',
      // Create document records inline
      documents:
        body.documents && body.documents.length > 0
          ? {
              create: body.documents.map((doc) => ({
                fileKey: doc.fileKey,
                fileName: doc.fileName || null,
                fileSize: doc.fileSize || null,
                documentType: doc.documentType || null,
              })),
            }
          : undefined,
    },
    include: { documents: true },
  })

  // If any photo document, use the first one as photoUrl
  const photoDoc = (site.documents || []).find(
    (d: any) => d.documentType === 'photo',
  )
  if (photoDoc) {
    const photoUrl = await generatePresignedDownloadUrl(photoDoc.fileKey)
    geometryMetadata.photoUrl = photoUrl
    await db.site.update({
      where: { id: site.id },
      data: { geometryMetadata: geometryMetadata as any },
    })
  }

  await db.notification.create({
    data: {
      userId: effectiveUserId,
      type: 'info',
      title: 'Site Submitted for Review',
      message: `Your site "${site.name}" has been submitted and is pending admin review.`,
      actionUrl: '/dashboard/assetmanager/infrastructure',
      relatedEntityId: site.id,
    },
  })

  return sendCreatedResponse(
    c,
    serializeSite(site),
    'Site created successfully',
  )
}

/**
 * GET /sites/v1 — List sites for the authenticated user
 */
export async function listSitesHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'
  const effectiveUserId = isAdmin
    ? cognitoUser.sub
    : await getAuthenticatedUserId(cognitoUser)

  const sites = await db.site.findMany({
    where: {
      ...(isAdmin ? {} : { assetManagerId: effectiveUserId }),
      deletedAt: null,
    },
    include: {
      documents: true,
      bookings: {
        where: { status: 'APPROVED' },
        orderBy: { startTime: 'desc' },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Generate signed URLs for photo documents
  const serialized = await Promise.all(
    sites.map(async (site: any) => {
      const { utilisation, lastUsed } = calculateUtilisationAndLastUsed(
        site.bookings || [],
      )
      site.utilisation = utilisation
      site.lastUsed = lastUsed

      const s = serializeSite(site)
      // Generate signed URLs for document download
      if (s.documents && s.documents.length > 0) {
        s.documents = await Promise.all(
          s.documents.map(async (doc: any) => ({
            ...doc,
            downloadUrl: await generatePresignedDownloadUrl(doc.fileKey),
          })),
        )
      }
      return s
    }),
  )

  return sendResponse(c, {
    message: 'Sites fetched',
    data: serialized,
  })
}

/**
 * GET /sites/v1/:siteId — Get a single site by ID
 */
export async function getSiteHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const effectiveUserId = await getAuthenticatedUserId(cognitoUser)
  const siteId = c.req.param('siteId')

  const site = await db.site.findUnique({
    where: { id: siteId },
    include: {
      documents: true,
      bookings: {
        where: { status: 'APPROVED' },
        orderBy: { startTime: 'desc' },
      },
    },
  })

  if (!site || site.deletedAt) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Site not found',
      code: 'NOT_FOUND',
    })
  }

  requireOwnerOrAdmin(cognitoUser, site.assetManagerId, effectiveUserId)

  const { utilisation, lastUsed } = calculateUtilisationAndLastUsed(
    site.bookings || [],
  )
  ;(site as any).utilisation = utilisation
  ;(site as any).lastUsed = lastUsed

  const serialized = serializeSite(site)
  // Generate signed download URLs for documents
  if (serialized.documents && serialized.documents.length > 0) {
    serialized.documents = await Promise.all(
      serialized.documents.map(async (doc: any) => ({
        ...doc,
        downloadUrl: await generatePresignedDownloadUrl(doc.fileKey),
      })),
    )
  }

  return sendResponse(c, {
    message: 'Site fetched',
    data: serialized,
  })
}

/**
 * PATCH /sites/v1/:siteId — Update site details
 */
export async function updateSiteHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const effectiveUserId = await getAuthenticatedUserId(cognitoUser)
  const siteId = c.req.param('siteId')
  const body = (c.req as any).valid('json') as z.infer<typeof updateSiteSchema>

  const existing = await db.site.findUnique({ where: { id: siteId } })
  if (!existing || existing.deletedAt) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Site not found',
      code: 'NOT_FOUND',
    })
  }

  requireOwnerOrAdmin(cognitoUser, existing.assetManagerId, effectiveUserId)

  // 1. Block edits on sites currently UNDER_REVIEW to prevent safety verification bypasses
  if (existing.status === 'UNDER_REVIEW') {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message:
        'This site is currently UNDER_REVIEW. Editing is disabled to ensure safety verification is not bypassed.',
      code: 'SITE_UNDER_REVIEW',
    })
  }

  // 2. Lock restricted fields on ACTIVE sites
  if (existing.status === 'ACTIVE') {
    const lockedFields: string[] = []

    if (body.name !== undefined && body.name !== existing.name) {
      lockedFields.push('name')
    }
    if (
      body.siteCategory !== undefined &&
      body.siteCategory !== existing.siteCategory
    ) {
      lockedFields.push('siteCategory')
    }
    if (body.siteType !== undefined && body.siteType !== existing.siteType) {
      lockedFields.push('siteType')
    }
    if (body.address !== undefined && body.address !== existing.address) {
      lockedFields.push('address')
    }
    if (body.postcode !== undefined && body.postcode !== existing.postcode) {
      lockedFields.push('postcode')
    }

    // Check geometry changes
    const existingMetaGeometry = (existing.geometryMetadata as any)?.geometry
    if (
      body.geometry !== undefined &&
      JSON.stringify(body.geometry) !== JSON.stringify(existingMetaGeometry)
    ) {
      lockedFields.push('geometry (location boundaries)')
    }

    // Check clzGeometry changes
    const existingMetaClzGeometry = (existing.geometryMetadata as any)
      ?.clzGeometry
    if (
      body.clzGeometry !== undefined &&
      JSON.stringify(body.clzGeometry) !==
        JSON.stringify(existingMetaClzGeometry)
    ) {
      lockedFields.push('clzGeometry (emergency boundaries)')
    }

    // Check policy/ownership document changes
    if (body.documents !== undefined) {
      const existingDocs = await db.siteDocument.findMany({ where: { siteId } })

      const existingKeySet = new Set(
        existingDocs
          .filter(
            (d: any) =>
              d.documentType === 'policy' || d.documentType === 'ownership',
          )
          .map((d: any) => d.fileKey),
      )

      const newKeySet = new Set(
        body.documents
          .filter(
            (d: any) =>
              d.documentType === 'policy' || d.documentType === 'ownership',
          )
          .map((d: any) => d.fileKey),
      )

      let docsChanged = existingKeySet.size !== newKeySet.size
      if (!docsChanged) {
        for (const k of newKeySet) {
          if (!existingKeySet.has(k)) {
            docsChanged = true
            break
          }
        }
      }

      if (docsChanged) {
        lockedFields.push('policy/ownership documents')
      }
    }

    if (lockedFields.length > 0) {
      throw new AppError({
        statusCode: HTTPStatusCode.BAD_REQUEST,
        message: `The following fields are locked for ACTIVE sites: ${lockedFields.join(', ')}`,
        code: 'LOCKED_FIELDS',
      })
    }
  }

  const resetToUnderReview = [
    'REJECTED',
    'WITHDRAWN',
    'DISABLE',
    'TEMPORARY_RESTRICTED',
  ].includes(existing.status)

  // Synchronize document updates in the database
  if (body.documents !== undefined) {
    // Delete existing documents
    await db.siteDocument.deleteMany({ where: { siteId } })

    // Create new ones
    if (body.documents.length > 0) {
      await db.siteDocument.createMany({
        data: body.documents.map((doc: any) => ({
          siteId,
          fileKey: doc.fileKey,
          fileName: doc.fileName || null,
          fileSize: doc.fileSize || null,
          documentType: doc.documentType || null,
        })),
      })
    }
  }

  // Merge geometry metadata
  const existingMeta =
    (existing.geometryMetadata as Record<string, unknown>) || {}
  const updatedMeta: Record<string, unknown> = { ...existingMeta }
  if (body.geometry) updatedMeta.geometry = body.geometry
  if (body.clzGeometry) updatedMeta.clzGeometry = body.clzGeometry
  if (body.geometryMetadata) Object.assign(updatedMeta, body.geometryMetadata)
  if (body.siteInformation !== undefined)
    updatedMeta.siteInformation = body.siteInformation

  // Regenerate photo URL inside geometry metadata if a photo document exists
  const updatedDocs = await db.siteDocument.findMany({ where: { siteId } })
  const photoDoc = updatedDocs.find((d: any) => d.documentType === 'photo')
  if (photoDoc) {
    const photoUrl = await generatePresignedDownloadUrl(photoDoc.fileKey)
    updatedMeta.photoUrl = photoUrl
  } else {
    updatedMeta.photoUrl = null
  }

  const site = await db.site.update({
    where: { id: siteId },
    data: {
      ...(resetToUnderReview && { status: 'UNDER_REVIEW' }),
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.address !== undefined && { address: body.address }),
      ...(body.postcode !== undefined && { postcode: body.postcode }),
      ...(body.contactEmail !== undefined && {
        contactEmail: body.contactEmail,
      }),
      ...(body.contactPhone !== undefined && {
        contactPhone: body.contactPhone,
      }),
      ...(body.siteCategory !== undefined && {
        siteCategory: body.siteCategory,
      }),
      ...(body.siteType !== undefined && {
        siteType: body.siteType,
      }),
      ...(body.zoneType !== undefined && {
        zoneType: body.zoneType,
      }),
      ...(body.validityStart !== undefined && {
        validityStart: new Date(body.validityStart),
      }),
      ...(body.validityEnd !== undefined && {
        validityEnd: body.validityEnd ? new Date(body.validityEnd) : null,
      }),
      ...(body.autoApprove !== undefined && { autoApprove: body.autoApprove }),
      ...(body.exclusiveUse !== undefined && {
        exclusiveUse: body.exclusiveUse,
      }),
      ...(body.emergencyRecoveryEnabled !== undefined && {
        emergencyRecoveryEnabled: body.emergencyRecoveryEnabled,
      }),
      ...(body.clzEnabled !== undefined && { clzEnabled: body.clzEnabled }),
      ...(body.toalAccessFee !== undefined && {
        toalAccessFee: body.toalAccessFee,
      }),
      ...(body.clzAccessFee !== undefined && {
        clzAccessFee: body.clzAccessFee,
      }),
      ...(body.hourlyRate !== undefined && { hourlyRate: body.hourlyRate }),
      ...(body.cancellationFeePercentage !== undefined && {
        cancellationFeePercentage: body.cancellationFeePercentage,
      }),
      geometryMetadata: updatedMeta as any,
    },
    include: { documents: true },
  })

  // Emit notification if site has been resubmitted
  if (resetToUnderReview) {
    await db.notification.create({
      data: {
        userId: existing.assetManagerId,
        title: 'Site Resubmitted',
        message: `Your site "${site.name}" has been resubmitted and is under review.`,
        type: 'site_update',
        actionUrl: '/dashboard/assetmanager/infrastructure',
        relatedEntityId: site.id,
        isRead: false,
      },
    })
  }

  return sendResponse(c, {
    message: 'Site updated',
    data: serializeSite(site),
  })
}

/**
 * PATCH /sites/v1/:siteId/status — Update site status
 */
export async function updateSiteStatusHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const effectiveUserId = await getAuthenticatedUserId(cognitoUser)
  const siteId = c.req.param('siteId')
  const body = (c.req as any).valid('json') as z.infer<
    typeof updateSiteStatusSchema
  >

  const existing = await db.site.findUnique({ where: { id: siteId } })
  if (!existing || existing.deletedAt) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Site not found',
      code: 'NOT_FOUND',
    })
  }

  requireOwnerOrAdmin(cognitoUser, existing.assetManagerId, effectiveUserId)

  // Admin can set any status; assetmanager can only disable/restrict/withdraw their own sites
  const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin'
  const allowedAssetManagerStatuses = [
    'DISABLE',
    'TEMPORARY_RESTRICTED',
    'ACTIVE',
  ]

  if (!isAdmin && !allowedAssetManagerStatuses.includes(body.status)) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: `AssetManagers cannot set status to ${body.status}`,
      code: 'FORBIDDEN',
    })
  }

  // AssetManager can only re-activate their own DISABLE/TEMPORARY_RESTRICTED sites
  if (
    !isAdmin &&
    body.status === 'ACTIVE' &&
    !['DISABLE', 'TEMPORARY_RESTRICTED'].includes(existing.status)
  ) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'Cannot re-activate a site from the current status',
      code: 'FORBIDDEN',
    })
  }

  if (!isAdmin && ['DISABLE', 'TEMPORARY_RESTRICTED'].includes(body.status)) {
    const blockingBooking = await db.booking.findFirst({
      where: {
        siteId,
        status: 'APPROVED',
        endTime: { gt: new Date() },
      },
      select: {
        id: true,
        bookingReference: true,
        startTime: true,
        endTime: true,
      },
    })

    if (blockingBooking) {
      throw new AppError({
        statusCode: HTTPStatusCode.CONFLICT,
        message:
          'This site has approved bookings that are still scheduled or in progress. Please cancel or reschedule them before changing the site status.',
        code: 'BOOKING_CONFLICT',
      })
    }
  }

  const existingMeta =
    (existing.geometryMetadata as Record<string, unknown>) || {}
  const updatedMeta: Record<string, unknown> = { ...existingMeta }

  if (body.adminInternalNote !== undefined) {
    updatedMeta.adminInternalNote = body.adminInternalNote
  }

  if (body.rejectionReasonNote !== undefined) {
    updatedMeta.rejectionReasonNote = body.rejectionReasonNote
  } else if (body.adminNote !== undefined) {
    // Backward-compat fallback for older clients that send adminNote only.
    updatedMeta.rejectionReasonNote = body.adminNote
  }

  const site = await db.site.update({
    where: { id: siteId },
    data: {
      status: body.status as any,
      geometryMetadata: updatedMeta as any,
    },
    include: { documents: true },
  })

  const statusNotificationMap: Record<
    string,
    {
      type: 'success' | 'warning' | 'info' | 'error'
      title: string
      message: string
    }
  > = {
    ACTIVE: {
      type: 'success',
      title: 'Site Activated',
      message: `Your site "${site.name}" is now active and visible to operators.`,
    },
    REJECTED: {
      type: 'error',
      title: 'Site Rejected',
      message: updatedMeta.rejectionReasonNote
        ? `Your site "${site.name}" was rejected. Reason: ${updatedMeta.rejectionReasonNote}`
        : `Your site "${site.name}" was rejected. Please review and update your submission.`,
    },
    DISABLE: {
      type: 'warning',
      title: 'Site Disabled',
      message: `Your site "${site.name}" has been disabled and is no longer bookable.`,
    },
    TEMPORARY_RESTRICTED: {
      type: 'warning',
      title: 'Site Temporarily Restricted',
      message: `Your site "${site.name}" is temporarily restricted.`,
    },
    WITHDRAWN: {
      type: 'info',
      title: 'Site Withdrawn',
      message: `Your site "${site.name}" has been withdrawn.`,
    },
    UNDER_REVIEW: {
      type: 'info',
      title: 'Site Under Review',
      message: `Your site "${site.name}" is currently under review.`,
    },
  }

  const notificationMeta = statusNotificationMap[body.status]
  if (notificationMeta) {
    await db.notification.create({
      data: {
        userId: site.assetManagerId,
        type: notificationMeta.type,
        title: notificationMeta.title,
        message: notificationMeta.message,
        actionUrl:
          body.status === 'REJECTED'
            ? `/dashboard/assetmanager/infrastructure/edit/${site.id}`
            : `/dashboard/assetmanager/infrastructure`,
        relatedEntityId: site.id,
      },
    })
  }

  return sendResponse(c, {
    message: `Site status updated to ${body.status}`,
    data: serializeSite(site),
  })
}

/**
 * DELETE /sites/v1/:siteId — Soft delete a site
 */
export async function deleteSiteHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const effectiveUserId = await getAuthenticatedUserId(cognitoUser)
  const siteId = c.req.param('siteId')

  const existing = await db.site.findUnique({ where: { id: siteId } })
  if (!existing || existing.deletedAt) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Site not found',
      code: 'NOT_FOUND',
    })
  }

  requireOwnerOrAdmin(cognitoUser, existing.assetManagerId, effectiveUserId)

  await db.site.update({
    where: { id: siteId },
    data: { deletedAt: new Date() },
  })

  return sendResponse(c, { message: 'Site deleted' })
}

/**
 * GET /sites/v1/public — Public listing of active sites (for discovery map)
 */
export async function listPublicSitesHandler(c: Context): Promise<Response> {
  const q = (c.req.query('q') || '').trim()
  const siteType = c.req.query('siteType')
  const autoApproveStr = c.req.query('autoApprove')
  const maxPriceStr = c.req.query('maxPrice')
  let latStr = c.req.query('lat')
  let lngStr = c.req.query('lng')
  const radiusStr = c.req.query('radius')
  const page = parseInt(c.req.query('page') || '1', 10)
  const limit = parseInt(c.req.query('limit') || '10', 10)
  const skip = (page - 1) * limit

  // Base Prisma Where Clause
  const where: any = {
    status: 'ACTIVE',
    deletedAt: null,
  }

  // Text Search
  if (q) {
    // Check if query is coordinates
    const coordMatch = q.match(
      /^([-+]?\d{1,2}(?:\.\d+)?)(?:,\s*|\s+)([-+]?\d{1,3}(?:\.\d+)?)$/,
    )
    if (coordMatch) {
      latStr = coordMatch[1]
      lngStr = coordMatch[2]
    } else {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { address: { contains: q, mode: 'insensitive' } },
        { postcode: { contains: q, mode: 'insensitive' } },
      ]
    }
  }

  // Exact match filters
  if (siteType && siteType !== 'all') {
    where.siteType = siteType
  }

  if (autoApproveStr && autoApproveStr !== 'all') {
    where.autoApprove = autoApproveStr === 'auto'
  }

  if (maxPriceStr) {
    const maxPrice = parseFloat(maxPriceStr)
    if (!isNaN(maxPrice) && maxPrice < 200) {
      where.AND = where.AND || []
      where.AND.push({
        OR: [{ toalAccessFee: { lte: maxPrice } }, { toalAccessFee: null }],
      })
    }
  }

  // Geospatial Filtering
  let geoFilteredIds: string[] | null = null
  if (latStr && lngStr && radiusStr) {
    const lat = parseFloat(latStr)
    const lng = parseFloat(lngStr)
    const radiusKm = parseFloat(radiusStr)

    if (!isNaN(lat) && !isNaN(lng) && !isNaN(radiusKm)) {
      const radiusMeters = radiusKm * 1000

      // Use raw SQL to find IDs within radius
      // We must cast centerPoint to geography for accurate meter-based ST_DWithin
      const result: { id: string }[] = await db.$queryRaw`
        SELECT id 
        FROM "Site"
        WHERE status = 'ACTIVE' 
        AND "deletedAt" IS NULL
        AND "centerPoint" IS NOT NULL
        AND ST_DWithin(
          "centerPoint"::geography, 
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography, 
          ${radiusMeters}
        )
      `

      geoFilteredIds = result.map((r) => r.id)
    }
  }

  // If geo filtering was applied, merge it into the where clause
  if (geoFilteredIds !== null) {
    // If geo filtering yielded no results, we can short-circuit or just force an empty IN clause
    if (geoFilteredIds.length === 0) {
      where.id = { in: [] } // Will yield 0 results
    } else {
      where.id = { in: geoFilteredIds }
    }
  }

  const [sites, total] = await Promise.all([
    db.site.findMany({
      where,
      include: { documents: true },
      orderBy: { createdAt: 'desc' },
      skip,
      take: limit,
    }),
    db.site.count({ where }),
  ])

  const serialized = sites.map((site: any) => serializeSite(site))
  const totalPages = Math.ceil(total / limit)

  return sendPaginatedResponse(c, {
    message: 'Public sites fetched',
    data: serialized,
    pagination: {
      page,
      limit,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrevious: page > 1,
    },
  })
}

/**
 * GET /sites/v1/public/:siteId — Public retrieval of a single active site
 */
export async function getPublicSiteHandler(c: Context): Promise<Response> {
  const siteId = c.req.param('siteId')

  const site = await db.site.findUnique({
    where: { id: siteId },
    include: { documents: true },
  })

  if (!site || site.deletedAt || site.status !== 'ACTIVE') {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Site not found or not active',
      code: 'NOT_FOUND',
    })
  }

  const serialized = serializeSite(site)

  if (serialized.documents && serialized.documents.length > 0) {
    serialized.documents = await Promise.all(
      serialized.documents.map(async (doc: any) => ({
        ...doc,
        downloadUrl: await generatePresignedDownloadUrl(doc.fileKey),
      })),
    )
  }

  return sendResponse(c, {
    message: 'Public site fetched',
    data: serialized,
  })
}

/**
 * GET /sites/v1/:siteId/stats — Get operational stats for a site
 */
export async function getSiteStatsHandler(c: Context): Promise<Response> {
  const cognitoUser = getCognitoUser(c)
  const effectiveUserId = await getAuthenticatedUserId(cognitoUser)
  const siteId = c.req.param('siteId')

  const site = await db.site.findUnique({ where: { id: siteId } })
  if (!site || site.deletedAt) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Site not found',
      code: 'NOT_FOUND',
    })
  }

  requireOwnerOrAdmin(cognitoUser, site.assetManagerId, effectiveUserId)

  // Current month boundaries
  const now = new Date()
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
  const endOfMonth = new Date(
    now.getFullYear(),
    now.getMonth() + 1,
    0,
    23,
    59,
    59,
    999,
  )

  // Bookings created this month for this site
  const monthlyBookings = await db.booking.findMany({
    where: {
      siteId,
      createdAt: { gte: startOfMonth, lte: endOfMonth },
    },
    select: {
      status: true,
      useCategory: true,
      toalCost: true,
      clzUsed: true,
    },
  })

  // Lifetime stats grouped by useCategory (only approved)
  const lifetimeStats = await db.booking.groupBy({
    by: ['useCategory'],
    where: {
      siteId,
      status: 'APPROVED',
    },
    _count: { id: true },
  })

  // Lifetime emergency recoveries (approved + actually used)
  const emergencyRecoveryCount = await db.booking.count({
    where: {
      siteId,
      status: 'APPROVED',
      useCategory: 'emergency_recovery',
      clzUsed: true,
    },
  })

  const approvedThisMonth = monthlyBookings.filter(
    (b) => b.status === 'APPROVED',
  )

  const stats = {
    operationsThisMonth: approvedThisMonth.length,
    approvedRequests: approvedThisMonth.length,
    pendingRequests: monthlyBookings.filter((b) => b.status === 'PENDING')
      .length,
    rejectedRequests: monthlyBookings.filter((b) => b.status === 'REJECTED')
      .length,
    totalToalOperations:
      lifetimeStats.find((s) => s.useCategory === 'planned_toal')?._count?.id ??
      0,
    emergencyRecoveries: emergencyRecoveryCount,
    revenueThisMonth: approvedThisMonth.reduce(
      (sum, b) => sum + (b.toalCost ? Number(b.toalCost.toString()) : 0),
      0,
    ),
  }

  return sendResponse(c, {
    message: 'Site stats fetched',
    data: stats,
  })
}
