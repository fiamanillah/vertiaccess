'use server';

import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, {
  apiVersion: '2026-04-22.dahlia' as any,
});

export async function createSetupIntent() {
  try {
    const setupIntent = await stripe.setupIntents.create({
      payment_method_types: ['card'],
    });
    return { clientSecret: setupIntent.client_secret };
  } catch (error) {
    console.error('Error creating setup intent:', error);
    return { error: 'Failed to create setup intent' };
  }
}

export async function getPaymentMethodDetails(paymentMethodId: string) {
  try {
    const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
    return { 
      brand: paymentMethod.card?.brand,
      last4: paymentMethod.card?.last4,
      exp_month: paymentMethod.card?.exp_month,
      exp_year: paymentMethod.card?.exp_year,
    };
  } catch (error) {
    console.error('Error retrieving payment method:', error);
    return { error: 'Failed to retrieve payment method details' };
  }
}
