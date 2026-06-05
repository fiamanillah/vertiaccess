import type { Context } from 'hono'
import { z } from 'zod'
import { db } from '@vertiaccess/database'
import {
  AppError,
  HTTPStatusCode,
  sendResponse,
  type CognitoUser,
  config,
} from '@vertiaccess/core'
import { stripe } from '../services/billing.service.ts'
import type {
  savePaymentMethodSchema,
  updatePaymentMethodSchema,
} from '../schemas/payment-methods.schema.ts'
import { toStripeAppError } from '../utils/stripe-error.ts'

function normalizePublishableKey(rawKey?: string | null): string | null {
  const trimmed = rawKey?.trim()
  if (!trimmed) return null

  const match = trimmed.match(/pk_(?:test|live)_[A-Za-z0-9]+/)
  return match ? match[0] : null
}

/**
 * Handler: POST /billing/v1/payment-methods/setup-intent
 * Creates a Stripe SetupIntent for collecting a new card.
 */
export async function createPaymentMethodSetupIntentHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = c.get('cognitoUser') as CognitoUser

  const user = await db.user.findUnique({
    where: { id: cognitoUser.sub },
    select: { id: true },
  })

  if (!user) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'User not found',
      code: 'NOT_FOUND',
    })
  }

  try {
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
      metadata: {
        userId: user.id,
      },
    })

    return sendResponse(c, {
      data: {
        clientSecret: setupIntent.client_secret,
        setupIntentId: setupIntent.id,
        publishableKey: normalizePublishableKey(config.stripe.publishableKey),
      },
      message: 'Payment setup initialized successfully',
    })
  } catch (error) {
    throw toStripeAppError(error)
  }
}

/**
 * Handler: POST /billing/v1/payment-methods
 * Save a payment method for the authenticated user
 */
export async function savePaymentMethodHandler(c: Context): Promise<Response> {
  const cognitoUser = c.get('cognitoUser') as CognitoUser
  const body = (c.req as any).valid('json') as z.infer<
    typeof savePaymentMethodSchema
  >

  const user = await db.user.findUnique({
    where: { id: cognitoUser.sub },
    include: { operatorProfile: true, assetOwnerProfile: true },
  })

  if (!user) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'User not found',
      code: 'NOT_FOUND',
    })
  }

  const stripeCustomerId =
    user.operatorProfile?.stripeCustomerId ||
    (await stripe.customers.create({
      email: cognitoUser.email,
      name: user.operatorProfile?.fullName || user.assetOwnerProfile?.fullName || cognitoUser.email,
      metadata: { userId: user.id },
    })).id

  if (user.role === 'OPERATOR' && user.operatorProfile && !user.operatorProfile.stripeCustomerId) {
    await db.operatorProfile.update({ where: { userId: user.id }, data: { stripeCustomerId } })
  }

  let stripePaymentMethod
  try {
    await stripe.paymentMethods.attach(body.paymentMethodId, { customer: stripeCustomerId })
    stripePaymentMethod = await stripe.paymentMethods.retrieve(body.paymentMethodId)
  } catch (error) {
    throw toStripeAppError(error)
  }

  if (stripePaymentMethod.type !== 'card' || !stripePaymentMethod.card) {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'Invalid payment method type. Only card payments are supported.',
      code: 'INVALID_PAYMENT_METHOD',
    })
  }

  const existingCount = await db.paymentMethod.count({ where: { userId: user.id } })
  const shouldSetDefault = body.setAsDefault || existingCount === 0

  let savedPaymentMethod: Awaited<ReturnType<typeof db.paymentMethod.create>>

  await db.$transaction(async (tx) => {
    if (shouldSetDefault) {
      await tx.paymentMethod.updateMany({ where: { userId: user.id }, data: { isDefault: false } })
    }
    savedPaymentMethod = await tx.paymentMethod.create({
      data: {
        userId: user.id,
        stripePaymentMethodId: stripePaymentMethod.id,
        last4: stripePaymentMethod.card!.last4,
        brand: stripePaymentMethod.card!.brand,
        expiryMonth: String(stripePaymentMethod.card!.exp_month).padStart(2, '0'),
        expiryYear: String(stripePaymentMethod.card!.exp_year),
        isDefault: shouldSetDefault,
      },
    })
  })

  if (shouldSetDefault) {
    await stripe.customers.update(stripeCustomerId, {
      invoice_settings: { default_payment_method: stripePaymentMethod.id },
    })
  }

  return sendResponse(c, {
    data: {
      id: savedPaymentMethod!.id,
      stripePaymentMethodId: savedPaymentMethod!.stripePaymentMethodId,
      last4: savedPaymentMethod!.last4,
      brand: savedPaymentMethod!.brand,
      expiryMonth: savedPaymentMethod!.expiryMonth,
      expiryYear: savedPaymentMethod!.expiryYear,
      isDefault: savedPaymentMethod!.isDefault,
      addedAt: savedPaymentMethod!.addedAt,
    },
    message: 'Payment method saved successfully',
  })
}

/**
 * Handler: GET /billing/v1/payment-methods
 * Retrieve all payment methods for the authenticated user
 */
export async function listPaymentMethodsHandler(c: Context): Promise<Response> {
  const cognitoUser = c.get('cognitoUser') as CognitoUser

  const paymentMethods = await db.paymentMethod.findMany({
    where: { userId: cognitoUser.sub },
    orderBy: [{ isDefault: 'desc' }, { addedAt: 'desc' }],
  })

  return sendResponse(c, {
    data: paymentMethods.map((pm) => ({
      id: pm.id,
      stripePaymentMethodId: pm.stripePaymentMethodId,
      last4: pm.last4,
      brand: pm.brand,
      expiryMonth: pm.expiryMonth,
      expiryYear: pm.expiryYear,
      isDefault: pm.isDefault,
      addedAt: pm.addedAt,
    })),
    message: 'Payment methods retrieved successfully',
  })
}

/**
 * Handler: DELETE /billing/v1/payment-methods/:paymentMethodId
 * Delete a payment method
 */
export async function deletePaymentMethodHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = c.get('cognitoUser') as CognitoUser
  const paymentMethodId = c.req.param('paymentMethodId')

  const paymentMethod = await db.paymentMethod.findUnique({
    where: { id: paymentMethodId },
  })

  if (!paymentMethod || paymentMethod.userId !== cognitoUser.sub) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Payment method not found',
      code: 'NOT_FOUND',
    })
  }

  await stripe.paymentMethods.detach(paymentMethod.stripePaymentMethodId)
  await db.paymentMethod.delete({ where: { id: paymentMethodId } })

  if (paymentMethod.isDefault) {
    const nextDefault = await db.paymentMethod.findFirst({
      where: { userId: cognitoUser.sub },
      orderBy: { addedAt: 'desc' },
    })
    if (nextDefault) {
      await db.paymentMethod.update({ where: { id: nextDefault.id }, data: { isDefault: true } })
      const user = await db.user.findUnique({ where: { id: cognitoUser.sub }, include: { operatorProfile: true } })
      if (user?.operatorProfile?.stripeCustomerId) {
        await stripe.customers.update(user.operatorProfile.stripeCustomerId, {
          invoice_settings: { default_payment_method: nextDefault.stripePaymentMethodId },
        })
      }
    }
  }

  return sendResponse(c, { data: null, message: 'Payment method deleted successfully' })
}

/**
 * Handler: PATCH /billing/v1/payment-methods/:paymentMethodId/set-default
 * Set a payment method as default
 */
export async function setDefaultPaymentMethodHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = c.get('cognitoUser') as CognitoUser
  const paymentMethodId = c.req.param('paymentMethodId')

  const paymentMethod = await db.paymentMethod.findUnique({
    where: { id: paymentMethodId },
  })

  if (!paymentMethod) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Payment method not found',
      code: 'NOT_FOUND',
    })
  }

  if (paymentMethod.userId !== cognitoUser.sub) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'You cannot modify this payment method',
      code: 'FORBIDDEN',
    })
  }

  // Update all to non-default, then set this one as default
  await db.$transaction(async (tx) => {
    await tx.paymentMethod.updateMany({
      where: { userId: cognitoUser.sub },
      data: { isDefault: false },
    })

    await tx.paymentMethod.update({
      where: { id: paymentMethodId },
      data: { isDefault: true },
    })
  })

  // Get Stripe customer and update default payment method
  const user = await db.user.findUnique({
    where: { id: cognitoUser.sub },
    include: { operatorProfile: true },
  })

  if (user?.operatorProfile?.stripeCustomerId) {
    await stripe.customers.update(user.operatorProfile.stripeCustomerId, {
      invoice_settings: {
        default_payment_method: paymentMethod.stripePaymentMethodId,
      },
    })
  }

  return sendResponse(c, {
    data: {
      id: paymentMethod.id,
      isDefault: true,
    },
    message: 'Default payment method updated successfully',
  })
}

/**
 * Handler: PATCH /billing/v1/payment-methods/:paymentMethodId
 * Update details of a payment method (cardholder name and expiry date)
 */
export async function updatePaymentMethodHandler(
  c: Context,
): Promise<Response> {
  const cognitoUser = c.get('cognitoUser') as CognitoUser
  const paymentMethodId = c.req.param('paymentMethodId')
  const body = (c.req as any).valid('json') as z.infer<
    typeof updatePaymentMethodSchema
  >

  const paymentMethod = await db.paymentMethod.findUnique({
    where: { id: paymentMethodId },
  })

  if (!paymentMethod) {
    throw new AppError({
      statusCode: HTTPStatusCode.NOT_FOUND,
      message: 'Payment method not found',
      code: 'NOT_FOUND',
    })
  }

  if (paymentMethod.userId !== cognitoUser.sub) {
    throw new AppError({
      statusCode: HTTPStatusCode.FORBIDDEN,
      message: 'You cannot update this payment method',
      code: 'FORBIDDEN',
    })
  }

  const updateParams: any = {}
  if (body.name) {
    updateParams.billing_details = { name: body.name }
  }

  let expiryMonth = paymentMethod.expiryMonth
  let expiryYear = paymentMethod.expiryYear

  if (body.expiry) {
    const [month, year] = body.expiry.split('/')
    if (month && year) {
      expiryMonth = month.padStart(2, '0')
      expiryYear = year.length === 2 ? `20${year}` : year
      updateParams.card = {
        exp_month: parseInt(expiryMonth, 10),
        exp_year: parseInt(expiryYear, 10),
      }
    }
  }

  try {
    // Update on Stripe
    await stripe.paymentMethods.update(
      paymentMethod.stripePaymentMethodId,
      updateParams,
    )
  } catch (error) {
    throw toStripeAppError(error)
  }

  // Update in database
  const updated = await db.paymentMethod.update({
    where: { id: paymentMethodId },
    data: {
      expiryMonth,
      expiryYear,
    },
  })

  return sendResponse(c, {
    data: {
      id: updated.id,
      brand: updated.brand,
      last4: updated.last4,
      expiryMonth: updated.expiryMonth,
      expiryYear: updated.expiryYear,
      isDefault: updated.isDefault,
    },
    message: 'Payment method updated successfully',
  })
}
