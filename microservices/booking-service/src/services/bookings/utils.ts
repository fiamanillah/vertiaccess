import { generateVAID } from '@vertiaccess/core'

export function generateBookingReference(): string {
  const chars = Math.random().toString(36).substring(2, 10).toUpperCase()
  return `VA-BKG-${chars.padEnd(8, 'X').substring(0, 8)}`
}

export const bookingInclude = {
  site: {
    select: {
      name: true,
      address: true,
      assetOwnerId: true,
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
        select: { fullName: true, organisation: true, flyerId: true, operatorReference: true, contactPhone: true },
      },
    },
  },
} as const
