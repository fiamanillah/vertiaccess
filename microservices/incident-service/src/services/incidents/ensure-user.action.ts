import { db } from '@vertiaccess/database';
import { generateVAID, type CognitoUser } from '@vertiaccess/core';
import { mapRoleToDbRole } from './helpers';

export async function ensureAuthenticatedUserExists(cognitoUser: CognitoUser): Promise<string> {
    const dbRole = mapRoleToDbRole(cognitoUser.role);

    const userById = await db.user.findUnique({
        where: { id: cognitoUser.sub },
        select: { id: true, email: true, role: true },
    });

    let effectiveUserId = cognitoUser.sub;

    if (userById) {
        effectiveUserId = userById.id;
        if (userById.role !== dbRole) {
            await db.user.update({
                where: { id: userById.id },
                data: { role: dbRole },
            });
        }
    } else {
        const userByEmail = await db.user.findUnique({
            where: { email: cognitoUser.email },
            select: { id: true, role: true },
        });

        if (userByEmail) {
            effectiveUserId = userByEmail.id;
            if (userByEmail.role !== dbRole) {
                await db.user.update({
                    where: { id: userByEmail.id },
                    data: { role: dbRole },
                });
            }
        } else {
            await db.user.create({
                data: {
                    id: cognitoUser.sub,
                    email: cognitoUser.email,
                    role: dbRole,
                },
            });
        }
    }

    if (dbRole === 'LANDOWNER') {
        const fullName = `${cognitoUser.firstName || ''} ${cognitoUser.lastName || ''}`.trim();
        await db.landownerProfile.upsert({
            where: { userId: effectiveUserId },
            create: {
                userId: effectiveUserId,
                vaId: generateVAID('va-lo'),
                fullName: fullName || cognitoUser.email,
                contactPhone: (cognitoUser as any).phone_number || (cognitoUser as any).phoneNumber || '',
            },
            update: {},
        });
    }

    if (dbRole === 'OPERATOR') {
        const fullName = `${cognitoUser.firstName || ''} ${cognitoUser.lastName || ''}`.trim();
        await db.operatorProfile.upsert({
            where: { userId: effectiveUserId },
            create: {
                userId: effectiveUserId,
                vaId: generateVAID('va-op'),
                fullName: fullName || cognitoUser.email,
                contactPhone: (cognitoUser as any).phone_number || (cognitoUser as any).phoneNumber || '',
                flyerId: (cognitoUser as any).flyerId || `${effectiveUserId.slice(0, 8).toUpperCase()}`,
            },
            update: {},
        });
    }

    return effectiveUserId;
}
