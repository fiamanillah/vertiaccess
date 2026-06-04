// services/billing-service/src/webhook.ts
import type { Context } from 'hono'
import { stripe, logger } from '../services/billing.service.ts'
import {
  config,
  sendResponse,
  AppError,
  HTTPStatusCode,
  recordBookingLifecycleEvent,
  generateVAID,
} from '@vertiaccess/core'
import { db } from '@vertiaccess/database'

export async function webhookHandler(c: Context): Promise<Response> {
  const sig = c.req.header('stripe-signature')
  if (!sig) {
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: 'Missing stripe-signature',
      code: 'BAD_REQUEST',
    })
  }

  const rawBody = await c.req.text()

  let event
  try {
    event = stripe.webhooks.constructEvent(
      rawBody,
      sig,
      config.stripe.webhookSecret,
    )
  } catch (err: any) {
    logger.error('Webhook signature verification failed', {
      error: err.message,
    })
    throw new AppError({
      statusCode: HTTPStatusCode.BAD_REQUEST,
      message: `Webhook Error: ${err.message}`,
      code: 'BAD_REQUEST',
    })
  }

  // Handle the event
  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as any
        const userId = session.client_reference_id
        const customerId = session.customer
        const subscriptionId = session.subscription

        if (userId && customerId && subscriptionId) {
          // Retrieve subscription to get dates and plan
          const subscription = (await stripe.subscriptions.retrieve(
            subscriptionId,
          )) as any

          await db.$transaction(async (tx: any) => {
            const planTier = session.metadata?.planTier || 'Standard'

            // Ensure SubscriptionPlan exists to satisfy foreign key
            let plan = await tx.subscriptionPlan.findFirst({
              where: { name: planTier },
            })
            if (!plan) {
              plan = await tx.subscriptionPlan.create({
                data: {
                  name: planTier,
                  monthlyPrice: 0,
                  annualPrice: 0,
                  currency: 'GBP',
                },
              })
            }

            // Upsert UserSubscription
            await tx.userSubscription.upsert({
              where: { userId },
              create: {
                userId,
                planId: plan.id,
                stripeSubscriptionId: subscriptionId,
                status: 'ACTIVE',
                currentPeriodEnd: new Date(
                  subscription.current_period_end * 1000,
                ),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
              },
              update: {
                planId: plan.id,
                stripeSubscriptionId: subscriptionId,
                status: 'ACTIVE',
                currentPeriodEnd: new Date(
                  subscription.current_period_end * 1000,
                ),
                cancelAtPeriodEnd: subscription.cancel_at_period_end,
              },
            })

            // Update operator profile with customer ID if applicable
            const operator = await tx.operatorProfile.findUnique({
              where: { userId },
            })
            if (operator) {
              await tx.operatorProfile.update({
                where: { userId },
                data: { stripeCustomerId: customerId },
              })
            }
          })
          logger.info(`Subscription created for user ${userId}`)
        }
        break
      }

      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as any

        await db.userSubscription.updateMany({
          where: { stripeSubscriptionId: subscription.id },
          data: {
            status:
              subscription.status.toUpperCase() === 'ACTIVE'
                ? 'ACTIVE'
                : 'EXPIRED',
            currentPeriodEnd: new Date(subscription.current_period_end * 1000),
            cancelAtPeriodEnd: subscription.cancel_at_period_end,
          },
        })
        logger.info(`Subscription ${subscription.id} updated/deleted`)
        break
      }

      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as any
        const meta = paymentIntent.metadata || {}
        if (meta.bookingId && meta.userId) {
          const booking = await db.booking.findUnique({
            where: { id: meta.bookingId },
            include: { site: true }
          })
          
          if (booking && booking.paymentStatus !== 'charged') {
            await db.$transaction(async (tx: any) => {
              const amountCharged = paymentIntent.amount_received ? paymentIntent.amount_received / 100 : 0
              
              await tx.booking.update({
                where: { id: booking.id },
                data: {
                  paymentStatus: 'charged',
                  status: booking.status === 'PENDING' ? 'APPROVED' : booking.status,
                  respondedAt: booking.respondedAt || new Date()
                }
              })
              
              await recordBookingLifecycleEvent(tx as any, {
                bookingId: booking.id,
                eventType: 'PAYMENT_CHARGED',
                actorType: 'system',
                actorId: 'stripe',
                previousState: { paymentStatus: booking.paymentStatus },
                newState: { paymentStatus: 'charged' },
                metadata: {
                  bookingReference: booking.bookingReference,
                  amount: amountCharged,
                  trigger: 'webhook_payment_succeeded'
                }
              })
              
              const isEmergency = booking.useCategory === 'emergency_recovery'
              const transactionType = isEmergency ? 'EMERGENCY_CHARGE' : 'PAYG_BOOKING'
              
              let toalCost = 0
              let platformFee = 0
              if (isEmergency) {
                toalCost = amountCharged
              } else {
                toalCost = booking.toalCost ? Number(booking.toalCost.toString()) : 0
                platformFee = booking.platformFee ? Number(booking.platformFee.toString()) : 0
              }
              
              await tx.transaction.create({
                data: {
                  userId: booking.operatorId,
                  bookingId: booking.id,
                  amount: amountCharged,
                  currency: 'GBP',
                  transactionType,
                  status: 'charged',
                  stripeChargeId: paymentIntent.latest_charge as string | undefined,
                  pricingBreakdown: { toalCost, platformFee, trigger: 'webhook' }
                }
              })
              
              if (booking.site?.landownerId && toalCost > 0) {
                await tx.landownerBalance.upsert({
                  where: { landownerId: booking.site.landownerId },
                  update: { pendingBalance: { increment: toalCost } },
                  create: { landownerId: booking.site.landownerId, pendingBalance: toalCost, availableBalance: 0 }
                })
              }
              

            })
            logger.info(`Payment succeeded via webhook for booking ${meta.bookingId}`)
          }
        }
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as any
        const meta = paymentIntent.metadata || {}
        // Only handle emergency charges — prevent double-lockout from other flows
        if (meta.type === 'emergency_charge' && meta.bookingId && meta.userId) {
          const booking = await db.booking.findUnique({
            where: { id: meta.bookingId },
            select: {
              id: true,
              paymentStatus: true,
              bookingReference: true,
              site: { select: { name: true } },
            },
          })
          // Only act if still in pending_charge (not already failed/charged via direct call)
          if (booking && booking.paymentStatus === 'pending_charge') {
            const siteName = booking.site?.name ?? 'Unknown Site'
            const amountDue = paymentIntent.amount
              ? paymentIntent.amount / 100
              : 150

            await db.$transaction(async (tx: any) => {
              await tx.booking.update({
                where: { id: meta.bookingId },
                data: { paymentStatus: 'failed' },
              })

              await recordBookingLifecycleEvent(tx as any, {
                bookingId: meta.bookingId,
                eventType: 'PAYMENT_FAILED',
                actorType: 'system',
                actorId: 'stripe',
                previousState: {
                  paymentStatus: booking.paymentStatus,
                },
                newState: {
                  paymentStatus: 'failed',
                },
                metadata: {
                  bookingReference: booking.bookingReference,
                  amountDue,
                  trigger: 'webhook_payment_failed',
                },
              })

              await tx.user.update({
                where: { id: meta.userId },
                data: {
                  status: 'PAYMENT_LOCKED',
                  paymentLockedAt: new Date(),
                  paymentLockedReason: `Emergency charge of £${amountDue.toFixed(2)} for "${siteName}" declined via webhook.`,
                  overdueBookingId: meta.bookingId,
                },
              })
              await tx.notification.create({
                data: {
                  userId: meta.userId,
                  type: 'error',
                  title: '🚨 Payment Overdue — Account Suspended',
                  message: `Your emergency landing charge of £${amountDue.toFixed(2)} for "${siteName}" could not be processed. Your account has been suspended until the balance is paid.`,
                  actionUrl: '/dashboard/operator/billing',
                  relatedEntityId: meta.bookingId,
                },
              })
            })
            logger.info(
              `Emergency charge failed via webhook — operator ${meta.userId} locked`,
            )
          }
        }
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as any
        const bookingId = charge.metadata?.bookingId

        if (bookingId) {
          const booking = await db.booking.findUnique({
            where: { id: bookingId },
            select: {
              id: true,
              operatorId: true,
              paymentStatus: true,
              bookingReference: true,
            },
          })

          if (booking) {
            await db.$transaction(async (tx: any) => {
              await tx.booking.update({
                where: { id: bookingId },
                data: { paymentStatus: 'refunded' },
              })

              await tx.transaction.create({
                data: {
                  userId: charge.metadata?.userId || booking.operatorId,
                  bookingId,
                  amount: charge.amount_refunded
                    ? charge.amount_refunded / 100
                    : 0,
                  currency: (charge.currency || 'gbp').toUpperCase(),
                  transactionType: 'REFUND',
                  status: 'refunded',
                  stripeChargeId: charge.id,
                  pricingBreakdown: {
                    refundReason: charge.refunds?.data?.[0]?.reason || null,
                  },
                },
              })

              await recordBookingLifecycleEvent(tx as any, {
                bookingId,
                eventType: 'REFUND_COMPLETED',
                actorType: 'system',
                actorId: 'stripe',
                previousState: {
                  paymentStatus: booking.paymentStatus,
                },
                newState: {
                  paymentStatus: 'refunded',
                },
                metadata: {
                  bookingReference: booking.bookingReference,
                  amountRefunded: charge.amount_refunded
                    ? charge.amount_refunded / 100
                    : 0,
                },
              })
            })
          }
        }

        break
      }

      default:
        logger.info(`Unhandled event type ${event.type}`)
    }

    return sendResponse(c, { message: 'Webhook processed' })
  } catch (error) {
    logger.error('Error processing webhook', { error })
    throw new AppError({
      statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
      message: 'Internal Server Error',
      code: 'INTERNAL_ERROR',
    })
  }
}
