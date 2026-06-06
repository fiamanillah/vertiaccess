import { db } from '@vertiaccess/database';
import type { Context } from 'hono';
import { sendResponse, HTTPStatusCode, AppError } from '@vertiaccess/core';

export interface AdminStatsResponse {
    totalUsers: number;
    totalAssetManagers: number;
    totalOperators: number;
    verifiedAssetManagers: number;
    verifiedOperators: number;
    totalSites: number;
    activeSitesTotal: number;
    sitesWithClz: number;
    emergencyRecoveryEnabledSites: number;
    activeUsersLast30Days: number;
    pendingVerifications: number;
    openIncidents: number;
    criticalIncidents: number;
}

export async function getAdminStatsHandler(c: Context): Promise<Response> {
    try {
        // Get user statistics
        const totalUsers = await db.user.count();

        const usersByRole = await db.user.groupBy({
            by: ['role'],
            _count: true,
        });

        const assetManagers = usersByRole.find(u => u.role === 'ASSETMANAGER')?._count || 0;
        const operators = usersByRole.find(u => u.role === 'OPERATOR')?._count || 0;

        // Get verified users
        const verifiedAssetManagers = await db.assetManagerProfile.count({
            where: {
                user: {
                    verifications: {
                        some: {
                            status: 'APPROVED',
                        },
                    },
                },
            },
        });

        const verifiedOperators = await db.operatorProfile.count({
            where: {
                user: {
                    verifications: {
                        some: {
                            status: 'APPROVED',
                        },
                    },
                },
            },
        });

        // Get site statistics
        const totalSites = await db.site.count();

        const sitesByStatus = await db.site.groupBy({
            by: ['status'],
            _count: true,
        });

        const activeSites = sitesByStatus.find(s => s.status === 'ACTIVE')?._count || 0;

        // Get sites with specific features
        const sitesWithClz = await db.site.count({
            where: {
                clzEnabled: true,
            },
        });

        const sitesWithEmergencyRecovery = await db.site.count({
            where: {
                emergencyRecoveryEnabled: true,
            },
        });

        // Active users in last 30 days
        const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

        const activeUsersLast30Days = await db.user.count({
            where: {
                OR: [
                    {
                        bookings: {
                            some: {
                                createdAt: {
                                    gte: thirtyDaysAgo,
                                },
                            },
                        },
                    },
                    {
                        incidentsReported: {
                            some: {
                                createdAt: {
                                    gte: thirtyDaysAgo,
                                },
                            },
                        },
                    },
                    {
                        incidentMessages: {
                            some: {
                                createdAt: {
                                    gte: thirtyDaysAgo,
                                },
                            },
                        },
                    },
                ],
            },
        });

        // Pending verifications
        const pendingVerifications = await db.verification.count({
            where: {
                status: 'PENDING',
            },
        });

        // Incident statistics
        const openIncidents = await db.incident.count({
            where: {
                status: 'OPEN',
            },
        });

        const criticalIncidents = await db.incident.count({
            where: {
                urgency: 'critical',
            },
        });

        const stats: AdminStatsResponse = {
            totalUsers,
            totalAssetManagers: assetManagers,
            totalOperators: operators,
            verifiedAssetManagers,
            verifiedOperators,
            totalSites,
            activeSitesTotal: activeSites,
            sitesWithClz,
            emergencyRecoveryEnabledSites: sitesWithEmergencyRecovery,
            activeUsersLast30Days,
            pendingVerifications,
            openIncidents,
            criticalIncidents,
        };

        return sendResponse(c, {
            data: stats,
            message: 'Admin stats retrieved successfully',
        });
    } catch (error) {
        console.error('Error fetching admin stats:', error);
        throw new AppError({
            statusCode: HTTPStatusCode.INTERNAL_SERVER_ERROR,
            message: 'Failed to fetch admin statistics',
            code: 'STATS_FETCH_ERROR',
        });
    }
}
