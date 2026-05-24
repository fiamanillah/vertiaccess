import { db } from '@vertiaccess/database';
import { getBillingBreakdown } from './src/services/bookings/billing-helpers.js';

async function test() {
  const booking = await db.booking.findUnique({
    where: { id: '4dd218b1-39a8-485c-982e-8db23d9bc343' },
    include: { site: true, operator: { include: { subscription: true } } }
  });

  const hasActiveSubscription =
    !!booking.operator.subscription &&
    booking.operator.subscription.status === 'ACTIVE' &&
    (!booking.operator.subscription.currentPeriodEnd ||
      booking.operator.subscription.currentPeriodEnd > new Date());

  const billing = getBillingBreakdown(booking.site, booking.useCategory, hasActiveSubscription);

  const shouldChargeImmediately =
    booking.status === 'APPROVED' &&
    booking.useCategory === 'planned_toal' &&
    (billing.totalDueNow ?? 0) > 0;

  console.log('hasActiveSubscription:', hasActiveSubscription);
  console.log('billing:', billing);
  console.log('shouldChargeImmediately:', shouldChargeImmediately);
}

test().catch(console.error).finally(() => db.$disconnect());
