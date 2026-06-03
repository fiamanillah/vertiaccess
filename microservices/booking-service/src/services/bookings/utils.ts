import { generateVAID } from '@vertiaccess/core'

export function generateBookingReference(): string {
  const chars = Math.random().toString(36).substring(2, 10).toUpperCase()
  return `VA-BKG-${chars.padEnd(8, 'X').substring(0, 8)}`
}

export function generateVerificationHash(
  bookingId: string,
  siteId: string,
  operatorId: string,
): string {
  const raw = `${bookingId}:${siteId}:${operatorId}:${Date.now()}`
  return Buffer.from(raw).toString('base64url')
}

export const bookingInclude = {
  site: {
    select: {
      name: true,
      address: true,
      landownerId: true,
      siteType: true,
      siteCategory: true,
      status: true,
      vaId: true,
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
} as const
