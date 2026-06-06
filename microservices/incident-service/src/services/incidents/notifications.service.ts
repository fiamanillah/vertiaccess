import { db } from '@vertiaccess/database';

export async function resolveNotificationRecipients(incident: any, senderId: string) {
    const recipientIds = new Set<string>();
    recipientIds.add(incident.reporterId);
    if (incident.site?.assetManagerId) {
        recipientIds.add(incident.site.assetManagerId);
    }
    if (incident.booking?.operatorId) {
        recipientIds.add(incident.booking.operatorId);
    }
    const adminUsers = await db.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, role: true },
    });
    adminUsers.forEach((admin) => recipientIds.add(admin.id));
    recipientIds.delete(senderId);

    return db.user.findMany({
        where: { id: { in: [...recipientIds] } },
        select: { id: true, role: true },
    });
}

export async function createIncidentNotifications(
    incident: any,
    senderId: string,
    title: string,
    message: string,
) {
    const recipients = await resolveNotificationRecipients(incident, senderId);

    await Promise.all(
        recipients.map((recipient) =>
            db.notification.create({
                data: {
                    userId: recipient.id,
                    type: recipient.role === 'ADMIN' ? 'warning' : 'info',
                    title,
                    message,
                    actionUrl:
                        recipient.role === 'ADMIN'
                            ? `/dashboard/admin/incident-report/${incident.id}`
                            : recipient.role === 'ASSETMANAGER'
                              ? `/dashboard/assetmanager/incident-report/${incident.id}`
                              : `/dashboard/operator/incident-report/${incident.id}`,
                    relatedEntityId: incident.id,
                },
            }),
        ),
    );
}

export async function resolveMessageNotificationRecipients(incident: any, senderId: string, visibility: string) {
    const recipientIds = new Set<string>();

    if (visibility === 'reporter' || visibility === 'target') {
        const reporterId = incident.reporterId;
        const reporterRole = incident.reporter?.role;
        let targetId: string | null = null;
        if (reporterRole === 'OPERATOR') {
            targetId = incident.site?.assetManagerId ?? null;
        } else if (reporterRole === 'ASSETMANAGER') {
            targetId = incident.booking?.operatorId ?? null;
        }

        if (visibility === 'reporter' && reporterId) {
            recipientIds.add(reporterId);
        } else if (visibility === 'target' && targetId) {
            recipientIds.add(targetId);
        }
    }

    // Always notify admins
    const adminUsers = await db.user.findMany({
        where: { role: 'ADMIN' },
        select: { id: true, role: true },
    });
    adminUsers.forEach((admin) => recipientIds.add(admin.id));

    recipientIds.delete(senderId);

    return db.user.findMany({
        where: { id: { in: [...recipientIds] } },
        select: { id: true, role: true },
    });
}

export async function createMessageNotifications(
    incident: any,
    senderId: string,
    visibility: string,
    title: string,
    message: string,
) {
    const recipients = await resolveMessageNotificationRecipients(incident, senderId, visibility);

    await Promise.all(
        recipients.map((recipient) =>
            db.notification.create({
                data: {
                    userId: recipient.id,
                    type: recipient.role === 'ADMIN' ? 'warning' : 'info',
                    title,
                    message,
                    actionUrl:
                        recipient.role === 'ADMIN'
                            ? `/dashboard/admin/incident-report/${incident.id}`
                            : recipient.role === 'ASSETMANAGER'
                              ? `/dashboard/assetmanager/incident-report/${incident.id}`
                              : `/dashboard/operator/incident-report/${incident.id}`,
                    relatedEntityId: incident.id,
                },
            }),
        ),
    );
}
