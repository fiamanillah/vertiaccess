import type { Context } from 'hono';
import { sendResponse, sendCreatedResponse, type CognitoUser } from '@vertiaccess/core';
import { db } from '@vertiaccess/database';

/**
 * GET /users/v1/me/aircrafts
 * Get all aircraft owned by the currently authenticated operator user.
 */
export async function listAircraftHandler(c: Context) {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;

    const aircrafts = await db.aircraft.findMany({
        where: { userId: cognitoUser.sub },
        orderBy: { createdAt: 'desc' },
    });

    return sendResponse(c, {
        data: aircrafts,
        message: 'Aircrafts retrieved successfully',
    });
}

/**
 * GET /users/v1/me/aircrafts/:id
 * Get details of a specific aircraft.
 */
export async function getAircraftHandler(c: Context) {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const aircraftId = c.req.param('id');

    const aircraft = await db.aircraft.findFirst({
        where: {
            id: aircraftId,
            userId: cognitoUser.sub,
        },
    });

    if (!aircraft) {
        return c.json({ success: false, message: 'Aircraft not found' }, 404);
    }

    return sendResponse(c, {
        data: aircraft,
        message: 'Aircraft retrieved successfully',
    });
}

/**
 * POST /users/v1/me/aircrafts
 * Create a new aircraft.
 */
export async function createAircraftHandler(c: Context) {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const body = await c.req.json();

    const aircraft = await db.aircraft.create({
        data: {
            userId: cognitoUser.sub,
            name: body.name,
            droneModel: body.droneModel,
            manufacturer: body.manufacturer,
            airframe: body.airframe,
            mtow: body.mtow,
            serialNumber: body.serialNumber ?? null,
            registrationNumber: body.registrationNumber ?? null,
        },
    });

    return sendCreatedResponse(c, {
        data: aircraft,
        message: 'Aircraft created successfully',
    });
}

/**
 * PATCH /users/v1/me/aircrafts/:id
 * Update an existing aircraft.
 */
export async function updateAircraftHandler(c: Context) {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const aircraftId = c.req.param('id');
    const body = await c.req.json();

    const existingAircraft = await db.aircraft.findFirst({
        where: {
            id: aircraftId,
            userId: cognitoUser.sub,
        },
    });

    if (!existingAircraft) {
        return c.json({ success: false, message: 'Aircraft not found' }, 404);
    }

    const updatedAircraft = await db.aircraft.update({
        where: { id: aircraftId },
        data: {
            name: body.name,
            droneModel: body.droneModel,
            manufacturer: body.manufacturer,
            airframe: body.airframe,
            mtow: body.mtow,
            serialNumber: body.serialNumber !== undefined ? body.serialNumber : undefined,
            registrationNumber: body.registrationNumber !== undefined ? body.registrationNumber : undefined,
        },
    });

    return sendResponse(c, {
        data: updatedAircraft,
        message: 'Aircraft updated successfully',
    });
}

/**
 * DELETE /users/v1/me/aircrafts/:id
 * Delete an aircraft.
 */
export async function deleteAircraftHandler(c: Context) {
    const cognitoUser = c.get('cognitoUser') as CognitoUser;
    const aircraftId = c.req.param('id');

    const existingAircraft = await db.aircraft.findFirst({
        where: {
            id: aircraftId,
            userId: cognitoUser.sub,
        },
    });

    if (!existingAircraft) {
        return c.json({ success: false, message: 'Aircraft not found' }, 404);
    }

    await db.aircraft.delete({
        where: { id: aircraftId },
    });

    return sendResponse(c, {
        message: 'Aircraft deleted successfully',
    });
}
