import type { Context } from 'hono';
import { z } from 'zod';
import { db } from '@serverless-backend-starter/database';
import { AppError, HTTPStatusCode, sendResponse, sendCreatedResponse, type CognitoUser } from '@serverless-backend-starter/core';
import { stripe } from '../services/billing.service.ts';
import { createPlanSchema, updatePlanSchema } from '../schemas/plans.schema.ts';

type BillingType = 'subscription' | 'payg';

type PlanFeatureMap = {
    billingType?: BillingType;
    description?: string;
    unitLabel?: string;
    stripeMonthlyPriceId?: string;
    stripeAnnualPriceId?: string;
    stripePaygPriceId?: string;
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
        throw new AppError({ statusCode: HTTPStatusCode.FORBIDDEN, message: "Admin role required", code: "FORBIDDEN" });
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
        currency: plan.currency,
        description: features.description || '',
        unitLabel: features.unitLabel || (features.billingType === 'payg' ? '/request' : '/mo'),
        stripeProductId: plan.stripeProductId,
        stripeMonthlyPriceId: features.stripeMonthlyPriceId || null,
        stripeAnnualPriceId: features.stripeAnnualPriceId || null,
        stripePaygPriceId: features.stripePaygPriceId || null,
        isActive: plan.isActive,
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

    const body = c.get('validatedBody') as z.infer<typeof createPlanSchema>;
    const billingType = body.billingType;
    const currency = body.currency.toLowerCase();

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
    };

    if (billingType === 'subscription') {
        const monthlyPrice = await stripe.prices.create({
            product: stripeProduct.id,
            unit_amount: toMinorUnit(body.monthlyPrice),
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
            unit_amount: toMinorUnit(body.monthlyPrice),
            currency,
        });
        features.stripePaygPriceId = paygPrice.id;
    }

    const plan = await db.subscriptionPlan.create({
        data: {
            name: body.name,
            monthlyPrice: body.monthlyPrice,
            annualPrice: body.annualPrice ?? 0,
            currency: body.currency.toUpperCase(),
            stripeProductId: stripeProduct.id,
            isActive: body.isActive ?? true,
            features: features as unknown as object,
        },
    });

    return sendCreatedResponse(
        c,
        serializePlan(plan),
        'Plan created'
    );
}

export async function updatePlanHandler(c: Context): Promise<Response> {
    requireAdmin(c);

    const planId = c.req.param('planId');
    const body = c.get('validatedBody') as z.infer<typeof updatePlanSchema>;

    const existing = await db.subscriptionPlan.findUnique({ where: { id: planId } });
    if (!existing) {
        throw new AppError({ statusCode: HTTPStatusCode.NOT_FOUND, message: "Plan not found", code: "NOT_FOUND" });
    }

    const features = parseFeatures(existing.features);
    const billingType = features.billingType || 'subscription';
    const currency = (body.currency || existing.currency).toLowerCase();

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
    };

    if (existing.stripeProductId && typeof body.monthlyPrice === 'number') {
        if (billingType === 'subscription') {
            const monthlyPrice = await stripe.prices.create({
                product: existing.stripeProductId,
                unit_amount: toMinorUnit(body.monthlyPrice),
                currency,
                recurring: { interval: 'month' },
            });
            nextFeatures.stripeMonthlyPriceId = monthlyPrice.id;
        } else {
            const paygPrice = await stripe.prices.create({
                product: existing.stripeProductId,
                unit_amount: toMinorUnit(body.monthlyPrice),
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
            monthlyPrice: body.monthlyPrice,
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
        throw new AppError({ statusCode: HTTPStatusCode.NOT_FOUND, message: "Plan not found", code: "NOT_FOUND" });
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
