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

      return user
    })
  }

  static async registerLandowner(body: CreateUserDTO, cognitoSub: string) {
    return db.$transaction(async (tx: any) => {
      const user = await tx.user.upsert({
        where: { id: cognitoSub },
        create: {
          id: cognitoSub,
          email: body.email,
          role: 'LANDOWNER',
          status: 'UNVERIFIED',
        },
        update: {},
      })

      const fullName = `${body.firstName} ${body.lastName}`.trim()

      await tx.landownerProfile.upsert({
        where: { userId: user.id },
        create: {
          userId: user.id,
          vaId: generateVAID('va-lo'),
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
