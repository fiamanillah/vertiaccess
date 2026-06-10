// microservices/site-service/src/services/sites/sites.service.ts
import { db } from '@vertiaccess/database';
import {
    AppError,
    HTTPStatusCode,
    generateVAID,
    type CognitoUser,
} from '@vertiaccess/core';

export class SitesService {
    static async listSites(cognitoUser: CognitoUser) {
        const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
        const role = (cognitoUser.role || '').toLowerCase();

        let where: any = { deletedAt: null };
        if (!isAdmin) {
            if (role === 'assetmanager') {
                where.assetManagerId = cognitoUser.sub;
            } else {
                where.status = 'ACTIVE'; // Operators only see active sites
            }
        }

        return db.site.findMany({
            where,
            include: {
                assetManager: {
                    include: {
                        assetManagerProfile: true,
                    }
                },
                documents: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async getSite(cognitoUser: CognitoUser, siteId: string) {
        const site = await db.site.findUnique({
            where: { id: siteId },
            include: {
                assetManager: {
                    include: {
                        assetManagerProfile: true,
                    }
                },
                documents: true,
            },
        });

        if (!site || site.deletedAt) {
            throw new AppError({
                statusCode: HTTPStatusCode.NOT_FOUND,
                message: 'Site not found',
                code: 'NOT_FOUND',
            });
        }

        return site;
    }

    static async createSite(cognitoUser: CognitoUser, body: any) {
        const profile = await db.assetManagerProfile.findUnique({
            where: { userId: cognitoUser.sub },
        });

        if (!profile || !profile.stripeAccountId) {
            throw new AppError({
                statusCode: HTTPStatusCode.BAD_REQUEST,
                message: 'Stripe Connect routing setup is incomplete. You must link your bank account via Stripe Connect in Billing settings before listing or creating public assets.',
                code: 'STRIPE_CONNECT_INCOMPLETE',
            });
        }

        return db.site.create({
            data: {
                ...body,
                assetManagerId: cognitoUser.sub,
                vaId: generateVAID('va-site'),
                status: 'PENDING_VERIFICATION',
            },
        });
    }

    static async updateSite(cognitoUser: CognitoUser, siteId: string, body: any) {
        const site = await this.getSite(cognitoUser, siteId);
        
        if (site.assetManagerId !== cognitoUser.sub && (cognitoUser.role || '').toLowerCase() !== 'admin') {
            throw new AppError({
                statusCode: HTTPStatusCode.FORBIDDEN,
                message: 'You do not have permission to update this site',
                code: 'FORBIDDEN',
            });
        }

        return db.site.update({
            where: { id: siteId },
            data: body,
        });
    }
}
