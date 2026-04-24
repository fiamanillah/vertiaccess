import type { Context } from 'hono';
import {
    sendResponse,
    sendCreatedResponse,
    type CognitoUser,
} from '@vertiaccess/core';
import { db } from '@vertiaccess/database';

/**
 * POST /auth/v1/users/me/identity
 * Landowners submit a national ID or passport for identity verification.
 */
export async function submitIdentityHandler(c: Context) {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const body = await c.req.json();
    const { documentType, fileKey } = body;


    const verification = await db.verification.create({
        data: {
            type: 'identity',
            status: 'PENDING',
            userId: cognitoUser.sub,
            submittedDocuments: [
                {
                    documentType,
                    fileKey,
                    uploadedAt: new Date().toISOString(),
                },
            ],
        },
    });

    await db.notification.create({
        data: {
            userId: cognitoUser.sub,
            type: 'info',
            title: 'Identity Verification Submitted',
            message: 'Your identity document has been submitted and is now under admin review.',
            actionUrl: '/dashboard/landowner',
            relatedEntityId: verification.id,
        },
    });

    return sendCreatedResponse(c, {
        data: verification,
        message: 'Identity document submitted for verification',
    });
}

/**
 * POST /auth/v1/users/me/operator-verification
 * Operators submit their registered credentials (flyerId, operatorReference)
 * for admin verification. No file upload required — data is pulled from
 * the existing OperatorProfile record.
 */
export async function submitOperatorVerificationHandler(c: Context) {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const body = await c.req.json().catch(() => ({}));
    const supportingDocuments = Array.isArray(body?.supportingDocuments)
        ? body.supportingDocuments
        : [];
    const identityDocument = body?.identityDocument;

    // Strict check: Operator must provide Identity Document
    if (!identityDocument || !identityDocument.documentType || !identityDocument.fileKey) {
        return c.json({ success: false, message: 'Identity document (National ID or Passport) is strictly required.' }, 400);
    }

    // Strict check: Operator must provide a Drone Operator License (Supporting Document)
    if (supportingDocuments.length === 0) {
        return c.json({ success: false, message: 'A Drone Operator License (Supporting Document) is strictly required.' }, 400);
    }


    // Fetch the operator's registered profile data
    const operatorProfile = await db.operatorProfile.findUnique({
        where: { userId: cognitoUser.sub },
    });

    if (!operatorProfile) {
        return c.json({ success: false, message: 'Operator profile not found' }, 404);
    }

    // Check for an existing pending verification to avoid duplicates
    const existing = await db.verification.findFirst({
        where: {
            userId: cognitoUser.sub,
            type: 'operator',
            status: 'PENDING',
        },
    });

    if (existing) {
        return c.json(
            {
                success: false,
                message: 'You already have a pending operator verification request',
                data: existing,
            },
            409
        );
    }

    const verification = await db.verification.create({
        data: {
            type: 'operator',
            status: 'PENDING',
            userId: cognitoUser.sub,
            submittedDocuments: [
                {
                    documentType: 'operator_credentials',
                    flyerId: operatorProfile.flyerId,
                    operatorReference: operatorProfile.operatorReference ?? null,
                    fullName: operatorProfile.fullName,
                    organisation: operatorProfile.organisation ?? null,
                    contactPhone: operatorProfile.contactPhone,
                    submittedAt: new Date().toISOString(),
                },
                {
                    documentType: identityDocument.documentType,
                    fileKey: identityDocument.fileKey,
                    uploadedAt: new Date().toISOString(),
                },
                ...supportingDocuments.map((doc: { fileKey: string; fileName?: string }) => ({
                    documentType: 'operator_supporting_document',
                    fileKey: doc.fileKey,
                    fileName: doc.fileName ?? null,
                    uploadedAt: new Date().toISOString(),
                })),
            ],
        },
    });

    await db.notification.create({
        data: {
            userId: cognitoUser.sub,
            type: 'info',
            title: 'Operator Verification Submitted',
            message:
                'Your operator credentials have been submitted and are now under admin review. You will be notified once reviewed.',
            actionUrl: '/dashboard/operator',
            relatedEntityId: verification.id,
        },
    });

    return sendCreatedResponse(c, {
        data: verification,
        message: 'Operator credentials submitted for verification',
    });
}
