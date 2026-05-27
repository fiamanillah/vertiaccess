import type { Context } from 'hono';
import { db } from '@vertiaccess/database';
import { sendResponse, type CognitoUser } from '@vertiaccess/core';

/**
 * Handler: GET /payments/v1/transactions
 * List all transactions for the authenticated operator with pagination, filtering, and sorting
 */
export async function listTransactionsHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;

    const page = parseInt(c.req.query('page') || '1', 10);
    const limit = parseInt(c.req.query('limit') || '10', 10);
    const status = c.req.query('status');
    const type = c.req.query('type');
    const sort = c.req.query('sort') || 'desc';

    const skip = (page - 1) * limit;

    // Filter by the operator's userId
    const where: any = {
        userId: cognitoUser.sub,
    };

    if (status && status !== 'all') {
        where.status = status;
    }

    if (type && type !== 'all') {
        where.transactionType = type;
    }

    const [transactions, totalCount] = await Promise.all([
        db.transaction.findMany({
            where,
            include: {
                booking: {
                    select: {
                        bookingReference: true,
                        paymentMethodLast4: true,
                        paymentMethodBrand: true,
                        site: {
                            select: {
                                name: true,
                            },
                        },
                    },
                },
            },
            orderBy: {
                createdAt: sort === 'asc' ? 'asc' : 'desc',
            },
            skip,
            take: limit,
        }),
        db.transaction.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    return sendResponse(c, {
        data: {
            transactions: transactions.map(t => {
                // Card info is stored directly on the booking record after a charge.
                // As a fallback, we also check pricingBreakdown JSON (populated for all
                // new transactions) to handle edge cases where the booking field is null.
                const breakdown = (t.pricingBreakdown ?? {}) as Record<string, any>
                const cardLast4 = t.booking?.paymentMethodLast4 || breakdown.cardLast4 || null
                const cardBrand = t.booking?.paymentMethodBrand || breakdown.cardBrand || null

                return {
                    id: t.id,
                    amount: Number(t.amount), // Convert Decimal to number
                    currency: t.currency,
                    transactionType: t.transactionType,
                    status: t.status,
                    receiptUrl: t.receiptUrl,
                    stripeChargeId: t.stripeChargeId || null,
                    createdAt: t.createdAt.toISOString(),
                    bookingReference: t.booking?.bookingReference || null,
                    cardLast4,
                    cardBrand,
                    siteName: t.booking?.site?.name || null,
                }
            }),
            pagination: {
                totalCount,
                totalPages,
                currentPage: page,
                limit,
            },
        },
        message: 'Transactions retrieved successfully',
    });
}
