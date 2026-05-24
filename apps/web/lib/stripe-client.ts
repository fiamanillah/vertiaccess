import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null
let stripeKey: string | null = null

function normalizePublishableKey(rawKey?: string | null): string | null {
  const trimmed = rawKey?.trim()
  if (!trimmed) return null

  const match = trimmed.match(/pk_(?:test|live)_[A-Za-z0-9]+/)
  return match ? match[0] : null
}

export const getStripe = (overrideKey?: string | null) => {
  const key =
    normalizePublishableKey(overrideKey) ||
    normalizePublishableKey(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY) ||
    normalizePublishableKey(process.env.VITE_STRIPE_PUBLISHABLE_KEY) ||
    normalizePublishableKey(process.env.STRIPE_PUBLISHABLE_KEY)

  if (!key) {
    console.error('Stripe publishable key is missing')
    return Promise.resolve(null)
  }

  if (!stripePromise || stripeKey !== key) {
    stripeKey = key
    stripePromise = loadStripe(key)
  }
  return stripePromise
}
