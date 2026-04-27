import { useCallback, useEffect, useState } from 'react';
import type { User } from '../../App';
import type { BookingRequest, CLZSelection, ConsentCertificate, IncidentReport } from '../../types';
import type { Notification } from '../NotificationsDropdown';
import { useAuth } from '../../context/AuthContext';
import { apiGetMe } from '../../lib/auth';
import { fetchPaymentMethods } from '../../lib/billing';
import { fetchNotificationsPage, fetchUnreadNotificationCount } from '../../lib/notifications';
import {
    apiFetchIncidents,
    apiIncidentToFrontendIncident,
    apiCreateIncident,
    apiUpdateIncidentStatus,
    apiAddIncidentMessage,
    apiAddIncidentDocument,
    frontendIncidentToCreatePayload,
} from '../../lib/incidents';
import {
    apiFetchMyBookings,
    apiBookingToFrontend,
    apiUpdateBookingStatus,
    apiPayLandownerBooking,
    apiConfirmEmergencyUsage,
    apiGetBookingCertificate,
} from '../../lib/bookings';
import { extractErrorMessage } from './errorHandler';

interface UseDashboardStateReturn {
    // Data
    bookings: BookingRequest[];
    clzSelections: CLZSelection[];
    certificates: ConsentCertificate[];
    incidentReports: IncidentReport[];
    notifications: Notification[];
    notificationPagination: any;

    // Loading states
    bookingsLoading: boolean;
    certificatesLoading: boolean;
    incidentsLoading: boolean;
    notificationsLoading: boolean;
    isPaymentCardLoading: boolean;

    // Action loading states
    isBookingActionLoading: Record<string, boolean>;
    isCancellingLoading: boolean;
    isPayingBooking: boolean;
    isPayingClz: Record<string, boolean>;
    isIncidentLoading: boolean;

    // Counts
    unreadNotificationCount: number;
    activeBookings: number;
    pendingBookings: number;

    // Actions
    loadBookings: () => Promise<void>;
    loadIncidents: () => Promise<void>;
    loadNotifications: (page: number) => Promise<void>;
    syncPaymentCardState: () => Promise<void>;
    syncUserVerificationState: (onUpdate: (data: any) => void) => Promise<void>;

    cancelBooking: (
        bookingId: string,
        cancellationFee: number,
        paymentStatus: string
    ) => Promise<void>;
    payBooking: (booking: BookingRequest) => Promise<void>;
    confirmClzUsage: (selection: CLZSelection, used: boolean, onDone: () => void) => Promise<void>;

    reportIncident: (report: IncidentReport, photos: any[]) => Promise<string>;
    resolveIncident: (incidentId: string) => Promise<void>;
    addIncidentMessage: (incidentId: string, text: string) => Promise<void>;
    addIncidentDocument: (incidentId: string, doc: any) => Promise<void>;

    markNotificationRead: (id: string) => Promise<void>;
    markAllNotificationsRead: () => Promise<void>;

    // State setters
    setClzSelections: (
        selections: CLZSelection[] | ((prev: CLZSelection[]) => CLZSelection[])
    ) => void;
    setNotifications: (
        notifications: Notification[] | ((prev: Notification[]) => Notification[])
    ) => void;
}

const notificationPageSize = 6;

export function useOperatorDashboardState(
    user: User,
    onUpdateUser: (user: User) => void
): UseDashboardStateReturn {
    const { idToken, updateUser } = useAuth();

    // Data states
    const [bookings, setBookings] = useState<BookingRequest[]>([]);
    const [clzSelections, setClzSelections] = useState<CLZSelection[]>([]);
    const [certificates, setCertificates] = useState<ConsentCertificate[]>([]);
    const [incidentReports, setIncidentReports] = useState<IncidentReport[]>([]);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationPagination, setNotificationPagination] = useState<any>(null);

    // Loading states
    const [bookingsLoading, setBookingsLoading] = useState(true);
    const [certificatesLoading, setCertificatesLoading] = useState(true);
    const [incidentsLoading, setIncidentsLoading] = useState(true);
    const [notificationsLoading, setNotificationsLoading] = useState(true);
    const [isPaymentCardLoading, setIsPaymentCardLoading] = useState(true);

    // Action loading states
    const [isBookingActionLoading, setIsBookingActionLoading] = useState<Record<string, boolean>>(
        {}
    );
    const [isCancellingLoading, setIsCancellingLoading] = useState(false);
    const [isPayingBooking, setIsPayingBooking] = useState(false);
    const [isPayingClz, setIsPayingClz] = useState<Record<string, boolean>>({});
    const [isIncidentLoading, setIsIncidentLoading] = useState(false);

    // Computed states
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [backendUnreadNotificationCount, setBackendUnreadNotificationCount] = useState(0);

    const isLocalNotificationId = (id: string) => id.startsWith('n-') || !id.includes('-');

    const activeBookings = bookings.filter(b => b.status === 'APPROVED').length;
    const pendingBookings = bookings.filter(b => b.status === 'PENDING').length;

    // Load bookings
    const loadBookings = useCallback(async () => {
        if (!idToken) return;
        try {
            setBookingsLoading(true);
            setCertificatesLoading(true);
            const apiBookings = await apiFetchMyBookings(idToken);
            const mappedBookings = apiBookings.map(apiBookingToFrontend);
            setBookings(mappedBookings);

            const approvedBookingsWithCertificate = mappedBookings.filter(booking => {
                const bookingWithDbId = booking as BookingRequest & { _dbId?: string };
                return (
                    booking.status === 'APPROVED' &&
                    Boolean(bookingWithDbId._dbId) &&
                    Boolean(booking.certificateId || booking.certificateVtId)
                );
            });

            if (approvedBookingsWithCertificate.length > 0) {
                const certificateResults = await Promise.allSettled(
                    approvedBookingsWithCertificate.map(booking => {
                        const bookingWithDbId = booking as BookingRequest & { _dbId?: string };
                        return apiGetBookingCertificate(idToken, bookingWithDbId._dbId!);
                    })
                );

                const fetchedCertificates = certificateResults
                    .filter(
                        (result): result is PromiseFulfilledResult<ConsentCertificate> =>
                            result.status === 'fulfilled'
                    )
                    .map(result => result.value)
                    .sort(
                        (a, b) => new Date(b.issueDate).getTime() - new Date(a.issueDate).getTime()
                    );

                setCertificates(fetchedCertificates);
            } else {
                setCertificates([]);
            }

            const toLocalDate = (iso: string) => {
                const d = new Date(iso);
                const y = d.getFullYear();
                const m = String(d.getMonth() + 1).padStart(2, '0');
                const day = String(d.getDate()).padStart(2, '0');
                return `${y}-${m}-${day}`;
            };

            const toLocalTime = (iso: string) => {
                const d = new Date(iso);
                const h = String(d.getHours()).padStart(2, '0');
                const min = String(d.getMinutes()).padStart(2, '0');
                return `${h}:${min}`;
            };

            setClzSelections(
                mappedBookings
                    .filter(booking => booking.useCategory === 'emergency_recovery')
                    .map(booking => ({
                        id: booking.id,
                        bookingDbId: (booking as any)._dbId || booking.id,
                        operatorId: booking.operatorId,
                        siteId: booking.siteId,
                        siteName: booking.siteName,
                        operationStartDate: toLocalDate(booking.startTime),
                        operationStartTime: toLocalTime(booking.startTime),
                        operationEndDate: toLocalDate(booking.endTime),
                        operationEndTime: toLocalTime(booking.endTime),
                        droneModel: booking.droneModel,
                        flyerId: booking.flyerId,
                        missionIntent: booking.missionIntent,
                        createdAt: booking.createdAt,
                        clzUsed: typeof booking.clzUsed === 'boolean' ? booking.clzUsed : null,
                        clzConfirmedAt: booking.clzConfirmedAt,
                        isPAYG: booking.isPAYG,
                        paymentStatus: booking.paymentStatus,
                        totalCost: (booking.toalCost || 0) + (booking.platformFee || 0),
                    }))
            );
        } catch (err) {
            console.error('Failed to load bookings:', err);
            setCertificates([]);
        } finally {
            setBookingsLoading(false);
            setCertificatesLoading(false);
        }
    }, [idToken]);

    // Load incidents
    const loadIncidents = useCallback(async () => {
        if (!idToken) return;

        try {
            setIncidentsLoading(true);
            const apiIncidents = await apiFetchIncidents(idToken);
            setIncidentReports(apiIncidents.map(apiIncidentToFrontendIncident));
        } catch (error) {
            console.error('Failed to load incidents:', error);
        } finally {
            setIncidentsLoading(false);
        }
    }, [idToken]);

    // Load notifications
    const loadNotifications = useCallback(
        async (page = 1) => {
            if (!idToken) return;
            try {
                setNotificationsLoading(true);
                const [pageResult, unreadCount] = await Promise.all([
                    fetchNotificationsPage(idToken, { limit: notificationPageSize, page }),
                    fetchUnreadNotificationCount(idToken),
                ]);
                setNotifications(prev => {
                    const localNotifications = prev.filter(notification =>
                        isLocalNotificationId(notification.id)
                    );
                    return [...localNotifications, ...pageResult.notifications];
                });
                setNotificationPagination(pageResult.pagination);
                setBackendUnreadNotificationCount(unreadCount);
            } catch (error) {
                console.error('Failed to load notifications:', error);
            } finally {
                setNotificationsLoading(false);
            }
        },
        [idToken]
    );

    // Update unread count
    useEffect(() => {
        const localUnreadCount = notifications.filter(
            notification => isLocalNotificationId(notification.id) && !notification.read
        ).length;
        setUnreadNotificationCount(backendUnreadNotificationCount + localUnreadCount);
    }, [backendUnreadNotificationCount, notifications]);

    // Initial loads
    useEffect(() => {
        void loadBookings();
    }, [loadBookings]);

    useEffect(() => {
        void loadIncidents();
    }, [loadIncidents]);

    useEffect(() => {
        void loadNotifications(1);
    }, [loadNotifications]);

    // Sync verification state
    const syncUserVerificationState = useCallback(
        async (onUpdate: (data: any) => void) => {
            if (!idToken) return;
            try {
                const me = await apiGetMe(idToken);
                onUpdate({
                    verified: Boolean(me?.verified || me?.verificationStatus === 'VERIFIED'),
                    verificationStatus: me?.verificationStatus,
                    hasPendingVerification: Boolean(me?.hasPendingVerification),
                });
            } catch (error) {
                console.error('Failed to refresh user verification state:', error);
            }
        },
        [idToken]
    );

    // Sync payment card state
    const syncPaymentCardState = useCallback(async () => {
        if (!idToken) return;
        setIsPaymentCardLoading(true);
        try {
            const cards = await fetchPaymentMethods(idToken);
            const defaultCard = cards.find(card => card.isDefault) || cards[0];
            if (defaultCard && (!user.paymentCard || user.paymentCard.id !== defaultCard.id)) {
                onUpdateUser({
                    ...user,
                    paymentCard: {
                        ...defaultCard,
                        expiryMonth: String(defaultCard.expiryMonth).padStart(2, '0'),
                        expiryYear: String(defaultCard.expiryYear),
                    },
                });
            }
        } catch (error) {
            console.error('Failed to refresh payment card state:', error);
        } finally {
            setIsPaymentCardLoading(false);
        }
    }, [idToken, user, onUpdateUser]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void syncPaymentCardState();
        }, 0);
        return () => clearTimeout(timer);
    }, [syncPaymentCardState]);

    // Action handlers
    const cancelBooking = useCallback(
        async (bookingId: string, cancellationFee: number, paymentStatus: string) => {
            setIsCancellingLoading(true);
            try {
                if (!idToken) throw new Error('Not authenticated');
                const booking = bookings.find(b => b.id === bookingId);
                const dbId = (booking as any)?._dbId || bookingId;
                await apiUpdateBookingStatus(idToken, dbId, 'CANCELLED');
                await loadBookings();
            } catch (error: any) {
                const message = extractErrorMessage(error, 'Failed to cancel booking');
                throw new Error(message);
            } finally {
                setIsCancellingLoading(false);
            }
        },
        [idToken, bookings, loadBookings]
    );

    const payBooking = useCallback(
        async (booking: BookingRequest) => {
            if (!idToken) return;
            setIsPayingBooking(true);
            try {
                const dbId = (booking as any)?._dbId || booking.id;
                await apiPayLandownerBooking(idToken, dbId);
                await loadBookings();
            } catch (error: any) {
                const message = extractErrorMessage(error, 'Failed to process payment');
                throw new Error(message);
            } finally {
                setIsPayingBooking(false);
            }
        },
        [idToken, loadBookings]
    );

    const confirmClzUsage = useCallback(
        async (selection: CLZSelection, used: boolean, onDone: () => void) => {
            if (!idToken) return;
            if (!selection.bookingDbId) {
                throw new Error('Unable to confirm usage. Missing booking reference.');
            }

            setIsPayingClz(prev => ({ ...prev, [selection.id]: true }));

            try {
                await apiConfirmEmergencyUsage(idToken, selection.bookingDbId, used);

                if (used && selection.isPAYG && selection.paymentStatus === 'pending') {
                    await apiPayLandownerBooking(idToken, selection.bookingDbId);
                }

                await loadBookings();
                onDone();
            } catch (error: any) {
                const message = extractErrorMessage(error, 'Failed to confirm emergency usage');
                throw new Error(message);
            } finally {
                setIsPayingClz(prev => {
                    const newState = { ...prev };
                    delete newState[selection.id];
                    return newState;
                });
            }
        },
        [idToken, loadBookings]
    );

    const reportIncident = useCallback(
        async (
            report: IncidentReport,
            photoEvidence: { name: string; type: string; size: string }[] = []
        ) => {
            if (!idToken) {
                throw new Error('You must be signed in to report an incident');
            }

            setIsIncidentLoading(true);
            try {
                const createdIncident = await apiCreateIncident(
                    idToken,
                    frontendIncidentToCreatePayload(report)
                );

                const failedPhotoUploads: string[] = [];
                for (const photo of photoEvidence) {
                    try {
                        await apiAddIncidentDocument(idToken, createdIncident.id, {
                            fileName: photo.name,
                            documentType: 'PHOTO_EVIDENCE',
                            fileSize: photo.size,
                        });
                    } catch {
                        failedPhotoUploads.push(photo.name);
                    }
                }

                const mappedIncident = apiIncidentToFrontendIncident(createdIncident);
                setIncidentReports(prev => [
                    mappedIncident,
                    ...prev.filter(r => r.id !== mappedIncident.id),
                ]);

                if (failedPhotoUploads.length > 0) {
                    throw new Error(
                        `Incident reported, but ${failedPhotoUploads.length} photo evidence item(s) failed to attach`
                    );
                }

                return mappedIncident.id;
            } catch (error: any) {
                const message = extractErrorMessage(error, 'Failed to report incident');
                throw new Error(message);
            } finally {
                setIsIncidentLoading(false);
            }
        },
        [idToken]
    );

    const resolveIncident = useCallback(
        async (incidentId: string) => {
            if (!idToken) return;

            try {
                await apiUpdateIncidentStatus(idToken, incidentId, 'CLOSED');
                await loadIncidents();
            } catch (error: any) {
                const message = extractErrorMessage(error, 'Failed to close incident');
                throw new Error(message);
            }
        },
        [idToken, loadIncidents]
    );

    const addIncidentMessage = useCallback(
        async (incidentId: string, text: string) => {
            if (!idToken) return;

            try {
                await apiAddIncidentMessage(idToken, incidentId, text);
                await loadIncidents();
            } catch (error: any) {
                const message = extractErrorMessage(error, 'Failed to add incident message');
                throw new Error(message);
            }
        },
        [idToken, loadIncidents]
    );

    const addIncidentDocument = useCallback(
        async (incidentId: string, doc: { name: string; type: string; size: string }) => {
            if (!idToken) return;

            try {
                await apiAddIncidentDocument(idToken, incidentId, {
                    fileName: doc.name,
                    documentType: doc.type,
                    fileSize: doc.size,
                });
                await loadIncidents();
            } catch (error: any) {
                const message = extractErrorMessage(error, 'Failed to add document');
                throw new Error(message);
            }
        },
        [idToken, loadIncidents]
    );

    const markNotificationRead = useCallback(
        async (notificationId: string) => {
            const response = await fetch(
                `${(import.meta as any).env.VITE_API_URL}/notifications/v1/${notificationId}/read`,
                {
                    method: 'PATCH',
                    headers: {
                        Authorization: `Bearer ${idToken}`,
                        'Content-Type': 'application/json',
                    },
                }
            );

            const json = await response.json().catch(() => ({}));
            if (!response.ok) {
                throw new Error(extractErrorMessage(json, 'Failed to mark notification as read'));
            }
        },
        [idToken]
    );

    const markAllNotificationsRead = useCallback(async () => {
        const response = await fetch(
            `${(import.meta as any).env.VITE_API_URL}/notifications/v1/read-all`,
            {
                method: 'PATCH',
                headers: {
                    Authorization: `Bearer ${idToken}`,
                    'Content-Type': 'application/json',
                },
            }
        );

        const json = await response.json().catch(() => ({}));
        if (!response.ok) {
            throw new Error(extractErrorMessage(json, 'Failed to mark all notifications as read'));
        }
    }, [idToken]);

    return {
        // Data
        bookings,
        clzSelections,
        certificates,
        incidentReports,
        notifications,
        notificationPagination,

        // Loading states
        bookingsLoading,
        certificatesLoading,
        incidentsLoading,
        notificationsLoading,
        isPaymentCardLoading,

        // Action loading states
        isBookingActionLoading,
        isCancellingLoading,
        isPayingBooking,
        isPayingClz,
        isIncidentLoading,

        // Counts
        unreadNotificationCount,
        activeBookings,
        pendingBookings,

        // Actions
        loadBookings,
        loadIncidents,
        loadNotifications,
        syncPaymentCardState,
        syncUserVerificationState,

        cancelBooking,
        payBooking,
        confirmClzUsage,

        reportIncident,
        resolveIncident,
        addIncidentMessage,
        addIncidentDocument,

        markNotificationRead,
        markAllNotificationsRead,

        // State setters
        setClzSelections,
        setNotifications,
    };
}
