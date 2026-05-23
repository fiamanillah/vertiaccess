'use server'

import Stripe from 'stripe'

let stripeClient: Stripe | null = null

function getStripeClient(): Stripe {
  if (stripeClient) return stripeClient

  const apiKey = process.env.STRIPE_SECRET_KEY?.trim()
  if (!apiKey) {
    throw new Error(
      'STRIPE_SECRET_KEY is not configured for the web app runtime',
    )
  }

  stripeClient = new Stripe(apiKey, {
    apiVersion: '2026-04-22.dahlia' as any,
  })

  return stripeClient
}

export async function createSetupIntent() {
  try {
    const stripe = getStripeClient()
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
    })
    return { clientSecret: setupIntent.client_secret }
  } catch (error) {
    console.error('Error creating setup intent:', error)
    return { error: 'Failed to create setup intent' }
  }
}

export async function getPaymentMethodDetails(paymentMethodId: string) {
  try {
    const stripe = getStripeClient()
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
    return {
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4,
      exp_month: paymentMethod.card?.exp_month,
      exp_year: paymentMethod.card?.exp_year,
    }
  } catch (error) {
    console.error('Error retrieving payment method:', error)
    return { error: 'Failed to retrieve payment method details' }
  }
}
