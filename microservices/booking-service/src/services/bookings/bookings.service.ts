// microservices/booking-service/src/services/bookings/bookings.service.ts
import { db } from '@vertiaccess/database';
import {
    AppError,
    HTTPStatusCode,
    generateVAID,
    type CognitoUser,
} from '@vertiaccess/core';

export class BookingsService {
    static async listBookings(cognitoUser: CognitoUser) {
        const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
        const role = (cognitoUser.role || '').toLowerCase();

        let where = {};
        if (!isAdmin) {
            if (role === 'landowner') {
                where = { site: { landownerId: cognitoUser.sub } };
            } else {
                where = { operatorId: cognitoUser.sub };
            }
        }

        return db.booking.findMany({
            where,
            include: {
                site: true,
                operator: {
                    include: {
                        operatorProfile: true,
                    }
                },
                transactions: true,
            },
            orderBy: { createdAt: 'desc' },
        });
    }

    static async getBooking(cognitoUser: CognitoUser, bookingId: string) {
        const booking = await db.booking.findUnique({
            where: { id: bookingId },
            include: {
                site: {
                    include: {
                        landowner: {
                            include: {
                                landownerProfile: true,
                            }
                        }
                    }
                },
                operator: {
                    include: {
                        operatorProfile: true,
                    }
                },
                transactions: true,
            },
        });

        if (!booking) {
            throw new AppError({
                statusCode: HTTPStatusCode.NOT_FOUND,
                message: 'Booking not found',
                code: 'NOT_FOUND',
            });
        }

        const isAdmin = (cognitoUser.role || '').toLowerCase() === 'admin';
        if (!isAdmin && booking.operatorId !== cognitoUser.sub && (booking as any).site?.landownerId !== cognitoUser.sub) {
            throw new AppError({
                statusCode: HTTPStatusCode.FORBIDDEN,
                message: 'You do not have permission to view this booking',
                code: 'FORBIDDEN',
            });
        }

        return booking;
    }

    static async createBooking(cognitoUser: CognitoUser, body: any) {
        // Logic moved from controller
        const site = await db.site.findUnique({ where: { id: body.siteId } });
        if (!site) {
            throw new AppError({
                statusCode: HTTPStatusCode.NOT_FOUND,
                message: 'Site not found',
                code: 'NOT_FOUND',
            });
        }

        return db.booking.create({
            data: {
                ...body,
                operatorId: cognitoUser.sub,
                vaId: generateVAID('va-bkg'),
                status: 'PENDING',
            },
        });
    }

    static async updateBookingStatus(cognitoUser: CognitoUser, bookingId: string, status: string) {
        const booking = await this.getBooking(cognitoUser, bookingId);
        
        // Add status transition logic here if needed
        
        return db.booking.update({
            where: { id: bookingId },
            data: { status: status as any },
        });
    }
}
