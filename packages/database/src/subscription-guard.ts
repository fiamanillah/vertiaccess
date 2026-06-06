import { db } from "../index.js";

// Helper structure for limits fallback
export const PLAN_LIMITS_FALLBACK = {
    maxSites: 0, 
    monthlyBookings: 0
};

export type SubscriptionAction = "CREATE_SITE" | "CREATE_BOOKING";

export class SubscriptionError extends Error {
    constructor(message: string) {
        super(message);
        this.name = "SubscriptionError";
    }
}

/**
 * Validates whether a user's current subscription allows a specific action.
 * Throws a SubscriptionError if the limit has been reached or access is denied.
 */
export async function verifySubscriptionAction(
    userId: string,
    action: SubscriptionAction,
    organizationId?: string // Future-proof if needed
) {
    // 1. Fetch user's active subscription
    const subscription = await db.userSubscription.findUnique({
        where: { userId },
        include: { plan: true },
    });

    const isSubscriptionActive =
        subscription &&
        ["active", "trialing"].includes(subscription.status) &&
        (!subscription.currentPeriodEnd || subscription.currentPeriodEnd > new Date());

    // 2. Resolve active limits or apply Grace Period fallback
    let limits = PLAN_LIMITS_FALLBACK;
    let allowPAYG = false;

    if (isSubscriptionActive && subscription.plan?.features) {
        const features = subscription.plan.features as any;
        if (features.billingType === "payg") {
             // PAYG bypasses subscription specific limits for bookings usually, as you pay per booking.
             // But maxSites might still be capped.
             allowPAYG = true;
        }
        
        limits = {
            maxSites: features.limits?.maxSites ?? (allowPAYG ? 1 : PLAN_LIMITS_FALLBACK.maxSites),
            monthlyBookings: features.limits?.monthlyBookings ?? (allowPAYG ? 9999 : PLAN_LIMITS_FALLBACK.monthlyBookings),
        };
    }

    // 3. Evaluate limits based on action
    if (action === "CREATE_SITE") {
        if (!allowPAYG && !isSubscriptionActive) {
            throw new SubscriptionError("Your subscription is inactive. Cannot create new sites.");
        }
        const siteCount = await db.site.count({
            where: { assetManagerId: userId, deletedAt: null },
        });

        if (siteCount >= limits.maxSites && limits.maxSites !== -1) { // -1 could mean unlimited
            throw new SubscriptionError(`Subscription limit reached: You can only have up to ${limits.maxSites} active sites.`);
        }
    } else if (action === "CREATE_BOOKING") {
        if (!allowPAYG && !isSubscriptionActive) {
             throw new SubscriptionError("Your subscription is inactive. Cannot create new bookings.");
        }
        // In PAYG, operators pay directly, but asset owners might be creating blocks/invites.
        // If this is operator usage, 'operatorId' is used.
        // Assuming this checks operator's plan or asset owner's included bookings for the month.
        const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
        
        const bookingCount = await db.booking.count({
             where: { 
                 operatorId: userId,
                 createdAt: { gte: currentMonthStart },
                 status: { notIn: ["CANCELLED", "REJECTED"] }
             }
        });

        if (bookingCount >= limits.monthlyBookings && limits.monthlyBookings !== -1) {
             throw new SubscriptionError(`Subscription limit reached: You are allowed ${limits.monthlyBookings} bookings per month.`);
        }
    }
}
