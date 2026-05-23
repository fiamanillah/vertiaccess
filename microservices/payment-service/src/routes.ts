import { Hono } from 'hono'
import { zValidator } from '@hono/zod-validator'
import { cognitoAuth } from '@vertiaccess/core'
import { checkoutHandler } from './controllers/checkout.ts'
import { checkoutSchema } from './schemas/checkout.schema.ts'
import { webhookHandler } from './controllers/webhook.ts'
import {
  savePaymentMethodHandler,
  listPaymentMethodsHandler,
  deletePaymentMethodHandler,
  setDefaultPaymentMethodHandler,
  createPaymentMethodSetupIntentHandler,
  updatePaymentMethodHandler,
} from './controllers/payment-methods.ts'
import {
  savePaymentMethodSchema,
  updatePaymentMethodSchema,
} from './schemas/payment-methods.schema.ts'
import { listTransactionsHandler } from './controllers/transaction.ts'
import {
  createBookingPaymentIntentHandler,
  payBookingHandler,
  processDueBookingPaymentsHandler,
} from './controllers/booking-payment.ts'
import { bookingPaymentSchema } from './schemas/booking-payment.schema.ts'
import {
  chargeEmergencyHandler,
  adminDisputeChargeHandler,
  retryOverduePaymentHandler,
} from './controllers/emergency-payment.ts'
import {
  connectStripeAccountHandler,
  getLandownerBalanceHandler,
  createWithdrawalRequestHandler,
  listWithdrawalsHandler,
  getWithdrawalDetailsHandler,
  cancelWithdrawalHandler,
} from './controllers/withdrawal.ts'
import {
  connectStripeAccountSchema,
  createWithdrawalRequestSchema,
} from './schemas/withdrawal.schema.ts'

export const paymentRoutes = new Hono()

// Generate checkout session (Requires auth)
paymentRoutes.post(
  '/checkout',
  cognitoAuth(),
  zValidator('json', checkoutSchema.body),
  checkoutHandler,
)

// Stripe Webhook (No auth, validated via stripe-signature)
paymentRoutes.post('/webhook', webhookHandler)

// Payment Methods Management
paymentRoutes.post(
  '/payment-methods/setup-intent',
  cognitoAuth(),
  createPaymentMethodSetupIntentHandler,
)

paymentRoutes.post(
  '/payment-methods',
  cognitoAuth(),
  zValidator('json', savePaymentMethodSchema),
  savePaymentMethodHandler,
)

paymentRoutes.get('/payment-methods', cognitoAuth(), listPaymentMethodsHandler)

paymentRoutes.delete(
  '/payment-methods/:paymentMethodId',
  cognitoAuth(),
  deletePaymentMethodHandler,
)

paymentRoutes.patch(
  '/payment-methods/:paymentMethodId/set-default',
  cognitoAuth(),
  setDefaultPaymentMethodHandler,
)

paymentRoutes.patch(
  '/payment-methods/:paymentMethodId',
  cognitoAuth(),
  zValidator('json', updatePaymentMethodSchema),
  updatePaymentMethodHandler,
)

// Transaction History
paymentRoutes.get('/transactions', cognitoAuth(), listTransactionsHandler)

// Create a Stripe PaymentIntent for a per-booking PAYG fee (no active subscription)
paymentRoutes.post(
  '/booking-payment-intent',
  cognitoAuth(),
  zValidator('json', bookingPaymentSchema),
  createBookingPaymentIntentHandler,
)

// Pay landowner for an approved booking using default card
paymentRoutes.post('/bookings/:bookingId/pay', cognitoAuth(), payBookingHandler)

// Internal: charge emergency booking after operator confirms usage
paymentRoutes.post(
  '/bookings/:bookingId/charge-emergency',
  chargeEmergencyHandler,
)

// Admin: force-charge an emergency booking (dispute resolution)
paymentRoutes.post(
  '/bookings/:bookingId/admin-dispute-charge',
  cognitoAuth(),
  adminDisputeChargeHandler,
)

// Operator: retry overdue emergency charge after updating card (unlocks account on success)
paymentRoutes.post(
  '/payment-methods/retry-overdue',
  cognitoAuth(),
  retryOverduePaymentHandler,
)

// Internal scheduler endpoint for charging approved PAYG bookings on booking date
paymentRoutes.post(
  '/bookings/process-due-payments',
  processDueBookingPaymentsHandler,
)

// ==========================================
// Landowner Withdrawal Operations
// ==========================================

// Connect Stripe account for payouts
paymentRoutes.post(
  '/landowner/stripe-connect',
  cognitoAuth(),
  zValidator('json', connectStripeAccountSchema),
  connectStripeAccountHandler,
)

// Get landowner balance
paymentRoutes.get(
  '/landowner/balance',
  cognitoAuth(),
  getLandownerBalanceHandler,
)

// Create withdrawal request
paymentRoutes.post(
  '/landowner/withdrawals',
  cognitoAuth(),
  zValidator('json', createWithdrawalRequestSchema),
  createWithdrawalRequestHandler,
)

// List all withdrawals
paymentRoutes.get(
  '/landowner/withdrawals',
  cognitoAuth(),
  listWithdrawalsHandler,
)

// Get specific withdrawal details
paymentRoutes.get(
  '/landowner/withdrawals/:withdrawalId',
  cognitoAuth(),
  getWithdrawalDetailsHandler,
)

// Cancel withdrawal
paymentRoutes.post(
  '/landowner/withdrawals/:withdrawalId/cancel',
  cognitoAuth(),
  cancelWithdrawalHandler,
)
