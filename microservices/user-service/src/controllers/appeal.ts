import type { Context } from 'hono';
import { sendResponse, type CognitoUser } from '@vertiaccess/core';
import { db } from '@vertiaccess/database';

/**
 * Handler: POST /users/v1/appeal
 * Allows a suspended user to submit an appeal.
 */
export async function submitAppealHandler(c: Context): Promise<Response> {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    
    let body;
    try {
        body = await c.req.json();
    } catch {
        return sendResponse(c, { message: 'Invalid request body', statusCode: 400 });
    }
    
    if (!body.reason || typeof body.reason !== 'string' || body.reason.trim() === '') {
        return sendResponse(c, { message: 'Appeal reason is required', statusCode: 400 });
    }

    // Verify user status is SUSPENDED before accepting appeal
    const userRecord = await db.user.findUnique({
        where: { id: cognitoUser.sub }
    });

    if (!userRecord || userRecord.status !== 'SUSPENDED') {
        return sendResponse(c, { message: 'You are not eligible to submit an appeal at this time.', statusCode: 403 });
    }

    // Mock the submission delay
    await new Promise(resolve => setTimeout(resolve, 800));

    return sendResponse(c, {
        message: 'Your appeal has been submitted successfully and will be reviewed by an administrator.',
    });
}
