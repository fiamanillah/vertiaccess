import { db } from '@vertiaccess/database';
import type { Context } from 'hono';
import { sendResponse, HTTPStatusCode, AppError } from '@vertiaccess/core';

export async function getAdminAnalyticsHandler(c: Context): Promise<Response> {
    try {
        const now = new Date();
        const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

        // 1. TOAL Activity Metrics
        const totalBookings = await db.booking.count();
        const bookingsLast7Days = await db.booking.count({ where: { createdAt: { gte: sevenDaysAgo } } });
        const bookingsLast30Days = await db.booking.count({ where: { createdAt: { gte: thirtyDaysAgo } } });
        const bookingsLast90Days = await db.booking.count({ where: { createdAt: { gte: ninetyDaysAgo } } });

        const approvedToals = await db.booking.count({ where: { status: 'APPROVED' } });
        const rejectedToals = await db.booking.count({ where: { status: 'REJECTED' } });
        const cancelledBlockedToals = await db.booking.count({ where: { status: { in: ['CANCELLED', 'EXPIRED'] } } });

        const totalOperators = await db.operatorProfile.count();
        const avgToalsPerOperator = totalOperators > 0 ? Number((totalBookings / totalOperators).toFixed(1)) : 0;

        // Top Operators
        const bookingsByOperator = await db.booking.groupBy({
            by: ['operatorId'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        });

        const topOperators = await Promise.all(
            bookingsByOperator.map(async (op) => {
                const profile = await db.operatorProfile.findUnique({ where: { userId: op.operatorId } });
                return {
                    name: profile?.organisation || profile?.fullName || 'Unknown Operator',
                    bookings: op._count.id,
                };
            })
        );

        // Top Sites
        const bookingsBySite = await db.booking.groupBy({
            by: ['siteId'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        });

        const topSites = await Promise.all(
            bookingsBySite.map(async (st) => {
                const site = await db.site.findUnique({ where: { id: st.siteId } });
                return {
                    name: site?.name || 'Unknown Site',
                    usage: st._count.id,
                };
            })
        );

        // 2. Emergency & Recovery (CLZ) Metrics
        const clzSelections = await db.booking.count({ where: { useCategory: 'emergency_recovery' } });
        
        const clzSitesQuery = await db.booking.findMany({
            where: { useCategory: 'emergency_recovery' },
            select: { siteId: true },
            distinct: ['siteId'],
        });
        const uniqueSitesSelected = clzSitesQuery.length;

        const clzEmergencyLandings = await db.booking.count({ where: { clzUsed: true } });
        const clzSelectedNotUsed = Math.max(0, clzSelections - clzEmergencyLandings);
        const clzUsageRate = clzSelections > 0 ? Number(((clzEmergencyLandings / clzSelections) * 100).toFixed(1)) : 0;

        const mostFrequentClzSitesQuery = await db.booking.groupBy({
            by: ['siteId'],
            where: { useCategory: 'emergency_recovery' },
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        });

        const mostFrequentClzSites = await Promise.all(
            mostFrequentClzSitesQuery.map(async (st) => {
                const site = await db.site.findUnique({ where: { id: st.siteId } });
                return {
                    name: site?.name || 'Unknown Site',
                    selections: st._count.id,
                };
            })
        );

        // 3. Revenue & Payments
        const successfulCharges = await db.transaction.aggregate({
            where: { status: 'charged' },
            _sum: { amount: true },
        });

        const revenueFromToal = await db.transaction.aggregate({
            where: { status: 'charged', booking: { useCategory: 'planned_toal' } },
            _sum: { amount: true },
        });

        const revenueFromEmergencyUse = await db.transaction.aggregate({
            where: { status: 'charged', booking: { useCategory: 'emergency_recovery' } },
            _sum: { amount: true },
        });

        const platformFees = await db.booking.aggregate({
            where: { paymentStatus: 'charged' },
            _sum: { platformFee: true },
        });

        const assetManagerPayouts = await db.transaction.aggregate({
            where: { transactionType: 'PAYOUT', status: 'charged' },
            _sum: { amount: true },
        });

        const refundsIssued = await db.transaction.aggregate({
            where: { transactionType: 'REFUND', status: 'refunded' },
            _sum: { amount: true },
        });

        // 4. Certificate & Compliance (Removed)
        const certificatesIssued = 0;
        const certificatesWithdrawn = 0;
        const certificatesVerified = 0;
        const avgCertPerOperator = 0;

        // 5. User Growth & Behaviour
        const newUsersThisWeek = await db.user.count({ where: { createdAt: { gte: sevenDaysAgo } } });
        const newUsersThisMonth = await db.user.count({ where: { createdAt: { gte: thirtyDaysAgo } } });

        const operatorsWithRepeatBookingsQuery = await db.booking.groupBy({
            by: ['operatorId'],
            _count: { id: true },
            having: { id: { _count: { gt: 1 } } },
        });
        const operatorsWithRepeatBookings = operatorsWithRepeatBookingsQuery.length;

        // Growth rate: (Current Month / Previous Month) - 1
        const sixtyDaysAgo = new Date(now.getTime() - 60 * 24 * 60 * 60 * 1000);
        
        const assetManagersThisMonth = await db.user.count({ where: { role: 'ASSETMANAGER', createdAt: { gte: thirtyDaysAgo } } });
        const assetManagersLastMonth = await db.user.count({ where: { role: 'ASSETMANAGER', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } });
        const assetManagersGrowthRate = assetManagersLastMonth > 0 
            ? Number((((assetManagersThisMonth - assetManagersLastMonth) / assetManagersLastMonth) * 100).toFixed(1))
            : assetManagersThisMonth > 0 ? 100 : 0;

        const operatorsThisMonth = await db.user.count({ where: { role: 'OPERATOR', createdAt: { gte: thirtyDaysAgo } } });
        const operatorsLastMonth = await db.user.count({ where: { role: 'OPERATOR', createdAt: { gte: sixtyDaysAgo, lt: thirtyDaysAgo } } });
        const operatorsGrowthRate = operatorsLastMonth > 0
            ? Number((((operatorsThisMonth - operatorsLastMonth) / operatorsLastMonth) * 100).toFixed(1))
            : operatorsThisMonth > 0 ? 100 : 0;

        const assetManagersWithMultipleSitesQuery = await db.site.groupBy({
            by: ['assetManagerId'],
            _count: { id: true },
            having: { id: { _count: { gt: 1 } } },
        });
        const assetManagersWithMultipleSites = assetManagersWithMultipleSitesQuery.length;

        // Compile Final Result
        const analyticsData = {
            toalActivity: {
                totalBookings,
                bookingsLast7Days,
                bookingsLast30Days,
                bookingsLast90Days,
                approvedToals,
                rejectedToals,
                cancelledBlockedToals,
                avgToalsPerOperator,
                topOperators,
                topSites,
            },
            clzMetrics: {
                clzSelections,
                uniqueSitesSelected,
                clzEmergencyLandings,
                clzSelectedNotUsed,
                clzUsageRate,
                mostFrequentClzSites,
            },
            revenue: {
                totalRevenue: Number(successfulCharges._sum.amount || 0),
                revenueFromToal: Number(revenueFromToal._sum.amount || 0),
                revenueFromEmergencyUse: Number(revenueFromEmergencyUse._sum.amount || 0),
                platformFeesCollected: Number(platformFees._sum.platformFee || 0),
                assetManagerPayouts: Number(assetManagerPayouts._sum.amount || 0),
                refundsIssued: Number(refundsIssued._sum.amount || 0),
                netPlatformRevenue: Number(platformFees._sum.platformFee || 0), // Assuming net platform revenue comes from fees
            },
            certificates: {
                certificatesIssued,
                certificatesWithdrawn,
                certificatesVerified,
                avgPerOperator: avgCertPerOperator,
            },
            userGrowth: {
                newUsersThisWeek,
                newUsersThisMonth,
                operatorsWithRepeatBookings,
                assetManagersGrowthRate,
                operatorsGrowthRate,
                assetManagersWithMultipleSites,
            },
        };

        return sendResponse(c, {
            data: analyticsData,
            message: 'Analytics retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching admin analytics:', error);
        throw new AppError({
            statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
            message: 'Failed to fetch admin analytics',
            code: 'ANALYTICS_FETCH_ERROR',
        });
    }
}
