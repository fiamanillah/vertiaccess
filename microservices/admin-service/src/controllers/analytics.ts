import { db } from '@vertiaccess/database';
import type { Context } from 'hono';
import { sendResponse, HTTPStatusCode, AppError, autoUpdateBookingStatuses } from '@vertiaccess/core';

export async function getAdminAnalyticsHandler(c: Context): Promise<Response> {
    try {
        await autoUpdateBookingStatuses();
        const now = new Date();

        // 1. Platform Overview Metrics
        const totalAssets = await db.site.count({ where: { deletedAt: null } });
        const totalAssetManagers = await db.user.count({ where: { role: 'ASSETMANAGER' } });
        const totalOperators = await db.user.count({ where: { role: 'OPERATOR' } });
        const totalRequests = await db.booking.count();
        const totalApprovedRequests = await db.booking.count({ where: { status: 'APPROVED' } });
        const totalRejectedRequests = await db.booking.count({ where: { status: 'REJECTED' } });
        const totalCancelledRequests = await db.booking.count({ where: { status: 'CANCELLED' } });
        const totalExpiredRequests = await db.booking.count({ where: { status: 'EXPIRED' } });
        
        const activeSubscriptions = await db.userSubscription.count({
            where: {
                status: { in: ['active', 'trialing'] },
                OR: [
                    { currentPeriodEnd: null },
                    { currentPeriodEnd: { gt: now } }
                ]
            }
        });

        const platformOverview = {
            totalAssets,
            totalAssetManagers,
            totalOperators,
            totalRequests,
            totalApprovedRequests,
            totalRejectedRequests,
            totalCancelledRequests,
            totalExpiredRequests,
            activeSubscriptions
        };

        // 2. Trends (Last 6 Months)
        const trends = [];
        for (let i = 5; i >= 0; i--) {
            const start = new Date(now.getFullYear(), now.getMonth() - i, 1);
            const end = new Date(now.getFullYear(), now.getMonth() - i + 1, 0, 23, 59, 59, 999);
            const monthName = start.toLocaleString('en-US', { month: 'short', year: 'numeric' });

            const assetsAdded = await db.site.count({
                where: {
                    createdAt: { gte: start, lte: end },
                    deletedAt: null
                }
            });

            const operatorsOnboarded = await db.user.count({
                where: {
                    role: 'OPERATOR',
                    createdAt: { gte: start, lte: end }
                }
            });

            const requestsSubmitted = await db.booking.count({
                where: {
                    createdAt: { gte: start, lte: end }
                }
            });

            trends.push({
                month: monthName,
                assetsAdded,
                operatorsOnboarded,
                requestsSubmitted
            });
        }

        // 3. Asset Network Analytics
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
        const uniqueSitesUsedThisMonth = await db.booking.groupBy({
            by: ['siteId'],
            where: {
                createdAt: { gte: startOfMonth }
            }
        });
        const assetsUsedThisMonth = uniqueSitesUsedThisMonth.length;
        const utilisationRate = totalAssets > 0 ? Number(((assetsUsedThisMonth / totalAssets) * 100).toFixed(1)) : 0;

        const assetNetwork = {
            totalAssets,
            assetsUsedThisMonth,
            utilisationRate
        };

        // 3b. Asset Capability Analytics
        const toalRequests = await db.booking.count({
            where: { useCategory: 'planned_toal' }
        });
        const emergencyRecoveryRequests = await db.booking.count({
            where: { useCategory: 'emergency_recovery' }
        });
        const assetCapability = {
            toal: toalRequests,
            emergencyAndRecovery: emergencyRecoveryRequests
        };

        // 3c. Asset Type Analytics (Top 10 Best Assets)
        const bookingsBySite = await db.booking.groupBy({
            by: ['siteId'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 10,
        });

        const topAssets = await Promise.all(
            bookingsBySite.map(async (st) => {
                const site = await db.site.findUnique({ where: { id: st.siteId } });
                return {
                    name: site?.name || 'Unknown Asset',
                    requests: st._count.id,
                };
            })
        );

        // 4. Operator Analytics
        const bookingsByOperator = await db.booking.groupBy({
            by: ['operatorId'],
            _count: { id: true },
            orderBy: { _count: { id: 'desc' } },
            take: 5,
        });

        const topOperators = await Promise.all(
            bookingsByOperator.map(async (op) => {
                const profile = await db.operatorProfile.findUnique({ where: { userId: op.operatorId } });
                const userId = op.operatorId;
                
                const requestsPerDay = await db.booking.count({
                    where: {
                        operatorId: userId,
                        createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) }
                    }
                });

                const requestsPerWeek = await db.booking.count({
                    where: {
                        operatorId: userId,
                        createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) }
                    }
                });

                const requestsPerMonth = await db.booking.count({
                    where: {
                        operatorId: userId,
                        createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) }
                    }
                });

                return {
                    operator: profile?.organisation || profile?.fullName || 'Unknown Operator',
                    requests: op._count.id,
                    requestsPerDay,
                    requestsPerWeek,
                    requestsPerMonth
                };
            })
        );

        // 4b. Mission Intent Usage
        const missionIntentRaw = await db.booking.groupBy({
            by: ['missionIntent'],
            _count: { id: true }
        });
        const missionIntentUsage = missionIntentRaw.map(item => ({
            intent: item.missionIntent || 'Not Specified',
            count: item._count.id
        }));

        // 4c. Mission Requested
        const missionRequested = {
            perDay: await db.booking.count({
                where: { createdAt: { gte: new Date(now.getTime() - 24 * 60 * 60 * 1000) } }
            }),
            perWeek: await db.booking.count({
                where: { createdAt: { gte: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) } }
            }),
            perMonth: await db.booking.count({
                where: { createdAt: { gte: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000) } }
            })
        };

        // 5. Operations Analytics (Approval Performance)
        const bookingsWithResponse = await db.booking.findMany({
            where: { respondedAt: { not: null } },
            select: { createdAt: true, respondedAt: true }
        });
        let totalResponseTimeMs = 0;
        let respondedCount = 0;
        for (const b of bookingsWithResponse) {
            if (b.respondedAt) {
                totalResponseTimeMs += (b.respondedAt.getTime() - b.createdAt.getTime());
                respondedCount++;
            }
        }
        const avgApprovalTimeHours = respondedCount > 0 ? Number((totalResponseTimeMs / (1000 * 60 * 60 * respondedCount)).toFixed(1)) : 0;
        const avgApprovalTime = avgApprovalTimeHours > 0 ? `${avgApprovalTimeHours}h` : 'N/A';

        const totalApproved = await db.booking.count({
            where: { status: { in: ['APPROVED', 'ACTIVATED', 'COMPLETED'] as any } }
        });
        const totalRejected = await db.booking.count({
            where: { status: 'REJECTED' }
        });
        const totalResponded = totalApproved + totalRejected;
        const approvalRate = totalResponded > 0 ? Number(((totalApproved / totalResponded) * 100).toFixed(0)) : 0;
        const rejectionRate = totalResponded > 0 ? Number(((totalRejected / totalResponded) * 100).toFixed(0)) : 0;

        const approvalPerformance = {
            avgApprovalTime,
            approvalRate,
            rejectionRate
        };

        // 5b. Approval Mode Usage
        const autoApprovedBookings = await db.booking.count({
            where: {
                status: { in: ['APPROVED', 'ACTIVATED', 'COMPLETED'] as any },
                site: { autoApprove: true }
            }
        });
        const manualApprovedBookings = await db.booking.count({
            where: {
                status: { in: ['APPROVED', 'ACTIVATED', 'COMPLETED'] as any },
                site: { autoApprove: false }
            }
        });
        const totalApprovedModeStats = autoApprovedBookings + manualApprovedBookings;
        const autoApprovalRate = totalApprovedModeStats > 0 ? Number(((autoApprovedBookings / totalApprovedModeStats) * 100).toFixed(0)) : 0;
        const manualApprovalRate = totalApprovedModeStats > 0 ? Number(((manualApprovedBookings / totalApprovedModeStats) * 100).toFixed(0)) : 0;

        const approvalModeUsage = {
            autoApproval: autoApprovalRate,
            manualApproval: manualApprovalRate
        };

        // 6. Incident & Safety Analytics
        const incidentSafety = {
            low: await db.incident.count({ where: { urgency: 'low' } }),
            medium: await db.incident.count({ where: { urgency: 'medium' } }),
            high: await db.incident.count({ where: { urgency: 'high' } }),
            critical: await db.incident.count({ where: { urgency: 'critical' } })
        };

        const analyticsData = {
            platformOverview,
            trends,
            assetNetwork,
            assetCapability,
            topAssets,
            operatorAnalytics: {
                topOperators,
                missionIntentUsage,
                missionRequested
            },
            operationsAnalytics: {
                approvalPerformance,
                approvalModeUsage
            },
            incidentSafety
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

