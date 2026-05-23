import { loadStripe, Stripe } from '@stripe/stripe-js'

let stripePromise: Promise<Stripe | null> | null = null
let stripeKey: string | null = null

export const getStripe = (overrideKey?: string | null) => {
  const key =
    overrideKey?.trim() ||
    process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.VITE_STRIPE_PUBLISHABLE_KEY?.trim() ||
    process.env.STRIPE_PUBLISHABLE_KEY?.trim()

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
