import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '@vertiaccess/database';
import {
    AppError,
    HTTPStatusCode,
    sendResponse,
    sendCreatedResponse,
    type CognitoUser,
} from '@vertiaccess/core';
import { stripe } from '../services/billing.service.ts';
import { createPlanSchema, updatePlanSchema } from '../schemas/plans.schema.ts';

type BillingType = 'subscription' | 'payg';

type PlanFeatureMap = {
    billingType?: BillingType;
    description?: string;
    unitLabel?: string;
    platformFee?: number;
    includedBookings?: number;
    stripeMonthlyPriceId?: string;
    stripeAnnualPriceId?: string;
    stripePaygPriceId?: string;
    customFeatures?: Array<{ id?: string; name: string; included: boolean }>;
    limits?: { maxSites?: number; monthlyBookings?: number };
};

function parseFeatures(features: unknown): PlanFeatureMap {
    if (!features || typeof features !== 'object' || Array.isArray(features)) {
        return {};
    }
    return features as PlanFeatureMap;
}

function toMinorUnit(amount: number): number {
    return Math.round(amount * 100);
}

function requireAdmin(c: Context) {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    if ((cognitoUser?.role || '').toLowerCase() !== 'admin') {
        throw new AppError({
            statusCode: HTTPStatusCode.FORBIDDEN,
            message: 'Admin role required',
            code: 'FORBIDDEN',
        });
    }
}

function serializePlan(plan: {
    id: string;
    name: string;
    monthlyPrice: unknown;
    annualPrice: unknown;
    currency: string;
    isActive: boolean;
    stripeProductId: string | null;
    features: unknown;
}) {
    const features = parseFeatures(plan.features);
    return {
        id: plan.id,
        name: plan.name,
        billingType: features.billingType || 'subscription',
        monthlyPrice: Number(plan.monthlyPrice?.toString() || 0),
        annualPrice: Number(plan.annualPrice?.toString() || 0),
        platformFee:
            typeof features.platformFee === 'number'
                ? features.platformFee
                : Number(plan.monthlyPrice?.toString() || 0),
        includedBookings:
            typeof features.includedBookings === 'number' ? features.includedBookings : null,
        currency: plan.currency,
        description: features.description || '',
        unitLabel: features.unitLabel || (features.billingType === 'payg' ? '/booking' : '/mo'),
        stripeProductId: plan.stripeProductId,
        stripeMonthlyPriceId: features.stripeMonthlyPriceId || null,
        stripeAnnualPriceId: features.stripeAnnualPriceId || null,
        stripePaygPriceId: features.stripePaygPriceId || null,
        isActive: plan.isActive,
        customFeatures: features.customFeatures || [],
        limits: features.limits || { maxSites: undefined, monthlyBookings: undefined },
    };
}

export async function listPlansHandler(c: Context): Promise<Response> {
    const includeInactive = c.req.query('includeInactive') === 'true';
    const plans = await db.subscriptionPlan.findMany({
        where: includeInactive ? undefined : { isActive: true },
        orderBy: { monthlyPrice: 'asc' },
    });

    return sendResponse(c, {
        message: 'Plans fetched',
        data: plans.map(serializePlan),
    });
}

export async function createPlanHandler(c: Context): Promise<Response> {
    requireAdmin(c);

    const body = (c.req as any).valid('json') as z.infer<typeof createPlanSchema>;
    const billingType = body.billingType;
    const currency = body.currency.toLowerCase();
    const effectiveMonthlyPrice =
        billingType === 'payg' ? Number(body.platformFee || 0) : Number(body.monthlyPrice || 0);

    if (billingType === 'payg') {
        const activePlans = await db.subscriptionPlan.findMany({ where: { isActive: true } });
        const hasPayg = activePlans.some(p => (p.features as any)?.billingType === 'payg');
        if (hasPayg) {
            throw new AppError({
                statusCode: HTTPStatusCode.BAD_REQUEST,
                message: 'Only one active Pay-As-You-Go (PAYG) plan is allowed in the system.',
                code: 'BAD_REQUEST',
            });
        }
    }

    const stripeProduct = await stripe.products.create({
        name: body.name,
        active: body.isActive ?? true,
        description: body.description,
        metadata: { billingType },
    });

    const features: PlanFeatureMap = {
        billingType,
        description: body.description,
        unitLabel: body.unitLabel,
        platformFee: billingType === 'payg' ? Number(body.platformFee || 0) : undefined,
        includedBookings:
            billingType === 'subscription' ? Number(body.includedBookings || 0) : undefined,
        customFeatures: body.customFeatures,
        limits: body.limits,
    };

    if (billingType === 'subscription') {
        const monthlyPrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: toMinorUnit(effectiveMonthlyPrice),
            currency,
            recurring: { interval: 'month' },
        });
        features.stripeMonthlyPriceId = monthlyPrice.id;

        if ((body.annualPrice ?? 0) > 0) {
            const annualPrice = await stripe.prices.create({
                product: stripeProduct.id,
                unit_amount: toMinorUnit(body.annualPrice ?? 0),
                currency,
                recurring: { interval: 'year' },
            });
            features.stripeAnnualPriceId = annualPrice.id;
        }
    } else {
        const paygPrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: toMinorUnit(effectiveMonthlyPrice),
            currency,
        });
        features.stripePaygPriceId = paygPrice.id;
    }

    const plan = await db.subscriptionPlan.create({
        data: {
            name: body.name,
            monthlyPrice: effectiveMonthlyPrice,
            annualPrice: body.annualPrice ?? 0,
            currency: body.currency.toUpperCase(),
            stripeProductId: stripeProduct.id,
            isActive: body.isActive ?? true,
            features: features as unknown as object,
        },
    });

    return sendCreatedResponse(c, serializePlan(plan), 'Plan created');
}

export async function updatePlanHandler(c: Context): Promise<Response> {
    requireAdmin(c);

    const planId = c.req.param('planId');
    const body = (c.req as any).valid('json') as z.infer<typeof updatePlanSchema>;

    const existing = await db.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!existing) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Plan not found',
            code: 'NOT_FOUND',
        });
    }

    const features = parseFeatures(existing.features);
    const billingType = features.billingType || 'subscription';
    const currency = (body.currency || existing.currency).toLowerCase();
    const nextMonthlyPrice =
        billingType === 'payg'
            ? typeof body.platformFee === 'number'
                ? body.platformFee
                : body.monthlyPrice
            : body.monthlyPrice;

    if (existing.stripeProductId) {
        await stripe.products.update(existing.stripeProductId, {
            name: body.name || existing.name,
            active: body.isActive ?? existing.isActive,
            description: body.description ?? features.description,
        });
    }

    const nextFeatures: PlanFeatureMap = {
        ...features,
        description: body.description ?? features.description,
        unitLabel: body.unitLabel ?? features.unitLabel,
        billingType,
        platformFee:
            billingType === 'payg'
                ? typeof body.platformFee === 'number'
                    ? body.platformFee
                    : features.platformFee
                : undefined,
        includedBookings:
            billingType === 'subscription'
                ? typeof body.includedBookings === 'number'
                    ? body.includedBookings
                    : features.includedBookings
                : undefined,
        customFeatures: body.customFeatures !== undefined ? body.customFeatures : features.customFeatures,
        limits: body.limits !== undefined ? body.limits : features.limits,
    };

    if (billingType === 'payg' && body.isActive !== false) {
        const activePlans = await db.subscriptionPlan.findMany({ where: { isActive: true } });
        const otherPayg = activePlans.find(
            p => p.id !== planId && (p.features as any)?.billingType === 'payg'
        );
        if (otherPayg) {
            throw new AppError({
                statusCode: HTTPStatusCode.BAD_REQUEST,
                message: 'Cannot activate this plan. Another Pay-As-You-Go plan is already active.',
                code: 'BAD_REQUEST',
            });
        }
    }

    if (existing.stripeProductId && typeof nextMonthlyPrice === 'number') {
        if (billingType === 'subscription') {
            const monthlyPrice = await stripe.prices.create({
                product: existing.stripeProductId,
                unit_amount: toMinorUnit(nextMonthlyPrice),
                currency,
                recurring: { interval: 'month' },
            });
            nextFeatures.stripeMonthlyPriceId = monthlyPrice.id;
        } else {
            const paygPrice = await stripe.prices.create({
                product: existing.stripeProductId,
                unit_amount: toMinorUnit(nextMonthlyPrice),
                currency,
            });
            nextFeatures.stripePaygPriceId = paygPrice.id;
        }
    }

    if (
        existing.stripeProductId &&
        billingType === 'subscription' &&
        typeof body.annualPrice === 'number' &&
        body.annualPrice > 0
    ) {
        const annualPrice = await stripe.prices.create({
            product: existing.stripeProductId,
            unit_amount: toMinorUnit(body.annualPrice),
            currency,
            recurring: { interval: 'year' },
        });
        nextFeatures.stripeAnnualPriceId = annualPrice.id;
    }

    const plan = await db.subscriptionPlan.update({
        where: { id: planId },
        data: {
            name: body.name,
            monthlyPrice: nextMonthlyPrice,
            annualPrice: body.annualPrice,
            currency: body.currency?.toUpperCase(),
            isActive: body.isActive,
            features: nextFeatures as unknown as object,
        },
    });

    return sendResponse(c, { message: 'Plan updated', data: serializePlan(plan) });
}

export async function deletePlanHandler(c: Context): Promise<Response> {
    requireAdmin(c);

    const planId = c.req.param('planId');
    const existing = await db.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!existing) {
        throw new AppError({
            statusCode: HTTPStatusCode.NOT_FOUND,
            message: 'Plan not found',
            code: 'NOT_FOUND',
        });
    }

    if (existing.stripeProductId) {
        await stripe.products.update(existing.stripeProductId, { active: false });
    }

    await db.subscriptionPlan.update({
        where: { id: planId },
        data: { isActive: false },
    });

    return sendResponse(c, { message: 'Plan deactivated' });
}
