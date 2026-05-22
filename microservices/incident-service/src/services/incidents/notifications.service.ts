import { db } from '@vertiaccess/database';

export async function resolveNotificationRecipients(incident: any, senderId: string) {
    const recipientIds = new Set<string>();
    recipientIds.add(incident.reporterId);
    if (incident.site?.landownerId) {
        recipientIds.add(incident.site.landownerId);
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
                            ? '/dashboard/admin'
                            : recipient.role === 'LANDOWNER'
                              ? '/dashboard/landowner'
                              : '/dashboard/operator',
                    relatedEntityId: incident.id,
                },
            }),
        ),
    );
}
