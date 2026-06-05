// microservices/auth-service/src/services/auth/registration.service.ts
import { db } from '@vertiaccess/database'
import { generateVAID } from '@vertiaccess/core'
import type { CreateUserDTO } from '../../schemas/auth.dto.ts'

export class RegistrationService {
  static async registerOperator(body: CreateUserDTO, cognitoSub: string) {
    return db.$transaction(async (tx: any) => {
      const user = await tx.user.upsert({
        where: { id: cognitoSub },
        create: {
          id: cognitoSub,
          email: body.email,
          role: 'OPERATOR',
          status: 'UNVERIFIED',
        },
        update: {},
      })

      const fullName = `${body.firstName} ${body.lastName}`.trim()

      await tx.operatorProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          vaId: generateVAID('va-op'),
          fullName: fullName,
          organisation: body.organisation,
          contactPhone: body.contactPhone || '',
          flyerId: body.flyerId || '',
          operatorReference: body.operatorId,
        },
        update: {},
      })

      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'success',
          title: 'Welcome to VertiAccess',
          message:
            'Your account was created successfully. Complete your profile and verification to unlock all features.',
          actionUrl: '/dashboard',
        },
      })

      // Subscribe operator to default PAYG plan if it exists
      const activePlans = await tx.subscriptionPlan.findMany({ where: { isActive: true } })
      const paygPlan = activePlans.find((p: any) => {
        try {
          const features = typeof p.features === 'string' ? JSON.parse(p.features) : p.features
          return features?.billingType === 'payg'
        } catch {
          return false
        }
      })
      if (paygPlan) {
        await tx.userSubscription.create({
          data: {
            userId: user.id,
            planId: paygPlan.id,
            status: 'ACTIVE',
          },
        })
      }

      return user
    })
  }

  static async registerAssetOwner(body: CreateUserDTO, cognitoSub: string) {
    return db.$transaction(async (tx: any) => {
      const user = await tx.user.upsert({
        where: { id: cognitoSub },
        create: {
          id: cognitoSub,
          email: body.email,
          role: 'ASSETOWNER',
          status: 'UNVERIFIED',
        },
        update: {},
      })

      const fullName = `${body.firstName} ${body.lastName}`.trim()

      await tx.assetOwnerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          vaId: generateVAID('va-ao'),
          fullName: fullName,
          organisation: body.organisation,
          contactPhone: body.contactPhone || '',
        },
        update: {},
      })

      await tx.notification.create({
        data: {
          userId: user.id,
          type: 'success',
          title: 'Welcome to VertiAccess',
          message:
            'Your account was created successfully. Complete your profile and verification to unlock all features.',
          actionUrl: '/dashboard',
        },
      })

      return user
    })
  }
}
