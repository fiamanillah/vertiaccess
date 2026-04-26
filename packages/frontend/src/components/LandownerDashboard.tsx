import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import type { User, SiteApprovalNotification } from '../App';
import type { Site, BookingRequest, PaymentCard, SiteStatus, PendingVerification } from '../types';
import { Header } from './Header';
import { AddSiteWizard } from './AddSiteWizard';
import { BookingRequestModal } from './BookingRequestModal';
import { PaymentSettings } from './PaymentSettings';
import { SiteStatusModal } from './SiteStatusModal';
import { SiteDetailsModal } from './SiteDetailsModal';
import { IncidentReportForm } from './IncidentReportForm';
import { IncidentDetailModal } from './IncidentDetailModal';
import { BalanceCard } from './LandownerDashboard/BalanceCard';
import { WithdrawalModal } from './LandownerDashboard/WithdrawalModal';
import { WithdrawalHistory } from './LandownerDashboard/WithdrawalHistory';
import type { Notification } from './NotificationsDropdown';
import { CheckCircle, AlertCircle, Plus, ChevronRight, ShieldAlert } from 'lucide-react';

import type { IncidentReport } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { SitesTable } from '../components/LandownerDashboard/SitesTable';
import { useAuth } from '../context/AuthContext';
import { normalizeSiteStatus } from '../lib/site-status';
import {
    fetchMySites,
    createSite as apiCreateSite,
    updateSiteStatus as apiUpdateSiteStatus,
    updateSite as apiUpdateSiteApi,
    uploadAndRegisterFile,
    apiSiteToFrontendSite,
    type CreateSitePayload,
} from '../lib/sites';
import { fetchPaymentMethods } from '../lib/billing';
import {
    fetchNotificationsPage,
    fetchUnreadNotificationCount,
    markAllNotificationsAsRead,
    markNotificationAsRead,
} from '../lib/notifications';
import {
    apiFetchLandownerBookings,
    apiUpdateBookingStatus,
    apiBookingToFrontend,
} from '../lib/bookings';
import {
    apiAddIncidentDocument,
    apiAddIncidentMessage,
    apiCreateIncident,
    apiFetchIncidents,
    apiIncidentToFrontendIncident,
    apiUpdateIncidentStatus,
    frontendIncidentToCreatePayload,
} from '../lib/incidents';
import {
    connectStripeAccount,
    getLandownerBalance,
    type LandownerBalance,
} from '../lib/withdrawals';
import { DashboardMetricCards } from './LandownerDashboard/DashboardMetricCards';
import { LandownerTabs, type LandownerView } from './LandownerDashboard/LandownerTabs';
import { BookingRequestsTab } from './LandownerDashboard/BookingRequestsTab';
import { IncidentReportsTab } from './LandownerDashboard/IncidentReportsTab';
import { Spinner } from './ui/spinner';
import { ProfilePage } from './ProfilePage';

interface LandownerDashboardProps {
    user: User;
    onLogout: () => void;
    onUpdateUser: (user: User) => void;
    sites: Site[];
    onAddSite: (site: Site) => void;
    onUpdateSite: (site: Site) => void;
    onAddPendingVerification: (verification: PendingVerification) => void;
    siteApprovalNotifications: SiteApprovalNotification[];
    onClearSiteNotification: (siteId: string) => void;
    sitesLoading?: boolean;
}

type RevenueTrendBooking = {
    status: string;
    toalCost?: number | null;
    createdAt?: string;
};

function computeRevenueTrendPercent(bookings: RevenueTrendBooking[]): number {
    const periodMs = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const currentPeriodStart = now - periodMs;
    const previousPeriodStart = now - periodMs * 2;

    let currentRevenue = 0;
    let previousRevenue = 0;

    for (const booking of bookings) {
        if (booking.status !== 'APPROVED') continue;

        const createdAtMs = new Date(booking.createdAt || '').getTime();
        if (!Number.isFinite(createdAtMs)) continue;

        const amount = Number(booking.toalCost) || 0;
        if (createdAtMs >= currentPeriodStart && createdAtMs <= now) {
            currentRevenue += amount;
            continue;
        }

        if (createdAtMs >= previousPeriodStart && createdAtMs < currentPeriodStart) {
            previousRevenue += amount;
        }
    }

    if (previousRevenue <= 0) {
        return currentRevenue > 0 ? 100 : 0;
    }

    return ((currentRevenue - previousRevenue) / previousRevenue) * 100;
}

export function LandownerDashboard({
    user,
    onLogout,
    onUpdateUser,
    sites,
    onAddSite,
    onUpdateSite,
    onAddPendingVerification,
    siteApprovalNotifications,
    onClearSiteNotification,
    sitesLoading: initialSitesLoading,
}: LandownerDashboardProps) {
    const { idToken } = useAuth();
    const isLandownerVerified = user.verified || user.verificationStatus === 'VERIFIED';
    const canCreateSites = isLandownerVerified;
    const [apiSites, setApiSites] = useState<Site[]>([]);
    const [sitesLoading, setSitesLoading] = useState(initialSitesLoading ?? true);
    const [isCreatingSite, setIsCreatingSite] = useState(false);
    const isSubmittingRef = useRef(false);

    // Fetch sites from API on mount
    const loadSites = useCallback(async () => {
        if (!idToken) return;
        try {
            setSitesLoading(true);
            const apiData = await fetchMySites(idToken);
            setApiSites(apiData.map(apiSiteToFrontendSite));
        } catch (err) {
            console.error('Failed to fetch sites from API:', err);
            setApiSites([]);
        } finally {
            setSitesLoading(false);
        }
    }, [idToken]);

    useEffect(() => {
        loadSites();
    }, [loadSites]);

    const activeSiteList = apiSites;

    const [showAddSite, setShowAddSite] = useState(false);
    const [bookingRequests, setBookingRequests] = useState<BookingRequest[]>([]);
    const [selectedRequest, setSelectedRequest] = useState<BookingRequest | null>(null);
    const [selectedSiteForStatus, setSelectedSiteForStatus] = useState<Site | null>(null);
    const [selectedSiteForDetails, setSelectedSiteForDetails] = useState<Site | null>(null);
    const [selectedBookingForIncident, setSelectedBookingForIncident] =
        useState<BookingRequest | null>(null);
    const [selectedIncidentDetails, setSelectedIncidentDetails] = useState<IncidentReport | null>(
        null
    );
    const [bookingActionState, setBookingActionState] = useState<{
        requestId: string | null;
        action: 'APPROVE' | 'REJECT' | null;
    }>({
        requestId: null,
        action: null,
    });
    const [incidentReports, setIncidentReports] = useState<IncidentReport[]>([]);
    const [view, setView] = useState<LandownerView>('sites');
    const [statusFilter, setStatusFilter] = useState<'all' | 'PENDING' | 'APPROVED' | 'REJECTED'>(
        'all'
    );
    const [showPaymentSettings, setShowPaymentSettings] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [openProfileForVerification, setOpenProfileForVerification] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [showWithdrawalModal, setShowWithdrawalModal] = useState(false);
    const [landownerBalance, setLandownerBalance] = useState<LandownerBalance | null>(null);
    const [balanceLoading, setBalanceLoading] = useState(false);
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [notificationPagination, setNotificationPagination] = useState<{
        page: number;
        limit: number;
        total: number;
        totalPages: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
    } | null>(null);
    const [backendUnreadNotificationCount, setBackendUnreadNotificationCount] = useState(0);
    const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);
    const [notificationsLoading, setNotificationsLoading] = useState(true);
    const [notificationPage, setNotificationPage] = useState(1);
    const notificationPageSize = 6;
    const [tabLoading, setTabLoading] = useState({
        requests: false,
        incidents: false,
        balance: false,
    });
    const [tabLoaded, setTabLoaded] = useState({
        requests: false,
        incidents: false,
        balance: false,
    });
    const [summaryStats, setSummaryStats] = useState({
        pendingRequestsCount: 0,
        totalRevenue: 0,
        openIncidentsCount: 0,
        revenueTrendPercent: 0,
    });
    const [summaryLoading, setSummaryLoading] = useState({
        requests: true,
        incidents: true,
        earnings: true,
    });

    const isLocalNotificationId = (id: string) => id.startsWith('n-') || !id.includes('-');

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
                setNotificationPage(pageResult.pagination.page);
            } catch (err) {
                console.error('Failed to fetch notifications from API:', err);
            } finally {
                setNotificationsLoading(false);
            }
        },
        [idToken, notificationPageSize]
    );

    useEffect(() => {
        const localUnreadCount = notifications.filter(
            notification => isLocalNotificationId(notification.id) && !notification.read
        ).length;
        setUnreadNotificationCount(backendUnreadNotificationCount + localUnreadCount);
    }, [backendUnreadNotificationCount, notifications]);

    const latestVerificationActionNotification = notifications.find(
        n =>
            /verification\s+requires\s+action/i.test(n.title) ||
            /verification\s+was\s+rejected/i.test(n.message)
    );
    const rejectionMessage = latestVerificationActionNotification?.message;
    const landownerRejectionNote = rejectionMessage?.includes(':')
        ? rejectionMessage.split(':').slice(1).join(':').trim()
        : (rejectionMessage ?? null);

    const loadBookingRequests = useCallback(async () => {
        if (!idToken) return;
        try {
            setTabLoading(prev => ({ ...prev, requests: true }));
            const apiBookings = await apiFetchLandownerBookings(idToken);
            setBookingRequests(apiBookings.map(apiBookingToFrontend));
        } catch (err) {
            console.error('Failed to fetch landowner bookings:', err);
        } finally {
            setTabLoading(prev => ({ ...prev, requests: false }));
            setTabLoaded(prev => ({ ...prev, requests: true }));
        }
    }, [idToken]);

    const loadIncidents = useCallback(async () => {
        if (!idToken) return;

        try {
            setTabLoading(prev => ({ ...prev, incidents: true }));
            const apiIncidents = await apiFetchIncidents(idToken);
            setIncidentReports(apiIncidents.map(apiIncidentToFrontendIncident));
        } catch (err) {
            console.error('Failed to fetch landowner incidents:', err);
        } finally {
            setTabLoading(prev => ({ ...prev, incidents: false }));
            setTabLoaded(prev => ({ ...prev, incidents: true }));
        }
    }, [idToken]);

    useEffect(() => {
        void loadNotifications(1);
    }, [loadNotifications]);

    useEffect(() => {
        if (!idToken) return;

        let isCancelled = false;

        const preloadDashboardStats = async () => {
            setSummaryLoading({ requests: true, incidents: true, earnings: true });

            const [bookingsResult, incidentsResult, balanceResult] = await Promise.allSettled([
                apiFetchLandownerBookings(idToken),
                apiFetchIncidents(idToken),
                getLandownerBalance(idToken),
            ]);

            if (isCancelled) return;

            if (bookingsResult.status === 'fulfilled') {
                const bookings = bookingsResult.value;
                const pendingCount = bookings.filter(
                    booking => booking.status === 'PENDING'
                ).length;
                const revenue = bookings
                    .filter(booking => booking.status === 'APPROVED')
                    .reduce((sum, booking) => sum + (Number(booking.toalCost) || 0), 0);
                const revenueTrendPercent = computeRevenueTrendPercent(bookings);

                setSummaryStats(prev => ({
                    ...prev,
                    pendingRequestsCount: pendingCount,
                    totalRevenue: revenue,
                    revenueTrendPercent,
                }));
            }

            if (incidentsResult.status === 'fulfilled') {
                const incidents = incidentsResult.value;
                const openCount = incidents.filter(incident => incident.status === 'OPEN').length;

                setSummaryStats(prev => ({
                    ...prev,
                    openIncidentsCount: openCount,
                }));
            }

            if (balanceResult.status === 'fulfilled') {
                const balance = balanceResult.value;
                setLandownerBalance(balance);
                setSummaryStats(prev => ({
                    ...prev,
                    totalRevenue: Number(balance.totalEarned) || 0,
                }));
            }

            setSummaryLoading({ requests: false, incidents: false, earnings: false });
        };

        void preloadDashboardStats();

        return () => {
            isCancelled = true;
        };
    }, [idToken]);

    const loadLandownerBalance = useCallback(async () => {
        if (!idToken) return;
        try {
            setTabLoading(prev => ({ ...prev, balance: true }));
            setBalanceLoading(true);
            const balance = await getLandownerBalance(idToken);
            setLandownerBalance(balance);
            setSummaryStats(prev => ({
                ...prev,
                totalRevenue: Number(balance.totalEarned) || 0,
            }));
        } catch (err) {
            console.error('Failed to fetch landowner balance:', err);
        } finally {
            setBalanceLoading(false);
            setTabLoading(prev => ({ ...prev, balance: false }));
            setTabLoaded(prev => ({ ...prev, balance: true }));
        }
    }, [idToken]);

    useEffect(() => {
        if (view === 'requests' && !tabLoaded.requests && !tabLoading.requests) {
            void loadBookingRequests();
        }

        if (view === 'incidents' && !tabLoaded.incidents && !tabLoading.incidents) {
            void loadIncidents();
        }

        if (view === 'balance' && !tabLoaded.balance && !tabLoading.balance) {
            void loadLandownerBalance();
        }
    }, [view, tabLoaded, tabLoading, loadBookingRequests, loadIncidents, loadLandownerBalance]);

    const syncPaymentCardState = useCallback(async () => {
        if (!idToken) return;
        try {
            const cards = await fetchPaymentMethods(idToken);
            const defaultCard = cards.find(card => card.isDefault) || cards[0];
            // Only update if card exists and is different from current
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
        }
    }, [idToken, user, onUpdateUser]);

    useEffect(() => {
        const timer = setTimeout(() => {
            void syncPaymentCardState();
        }, 0);
        return () => clearTimeout(timer);
    }, [idToken]);

    // Total earnings from backend-calculated landowner balance
    const totalRevenue = useMemo(() => {
        if (landownerBalance) {
            return Number(landownerBalance.totalEarned) || 0;
        }

        return summaryStats.totalRevenue;
    }, [landownerBalance, summaryStats.totalRevenue]);

    const revenueTrendPercent = useMemo(() => {
        if (tabLoaded.requests) {
            return computeRevenueTrendPercent(bookingRequests);
        }

        return summaryStats.revenueTrendPercent;
    }, [bookingRequests, summaryStats.revenueTrendPercent, tabLoaded.requests]);

    useEffect(() => {
        siteApprovalNotifications.forEach(approval => {
            const existingNotification = notifications.find(
                n => n.message.includes(approval.siteName) && n.timestamp === approval.timestamp
            );

            if (!existingNotification) {
                const newNotification: Notification = {
                    id: Math.random().toString(36).substr(2, 9),
                    type: approval.approved ? 'success' : 'error',
                    title: approval.approved ? 'Site Approved!' : 'Site Rejected',
                    message: `${
                        approval.approved
                            ? `Your site "${approval.siteName}" has been approved by admin and is now active!`
                            : `Your site "${approval.siteName}" was rejected by admin. Please review details.`
                    }${approval.adminNote ? ` Admin note: ${approval.adminNote}` : ''}`,
                    timestamp: approval.timestamp,
                    read: false,
                };
                setNotifications(prev => [newNotification, ...prev]);
                onClearSiteNotification(approval.siteId);
            }
        });
    }, [siteApprovalNotifications]);

    const handleAddSite = async (
        site: Site,
        verification: PendingVerification,
        uploadedFiles: {
            policyFiles: File[];
            authorityFiles: File[];
            photoFiles: File[];
        }
    ) => {
        if (isSubmittingRef.current) return;

        if (!canCreateSites) {
            toast.error('Verify your landowner profile before creating a site');
            setShowProfile(true);
            setOpenProfileForVerification(true);
            return;
        }

        isSubmittingRef.current = true;
        setIsCreatingSite(true);
        let siteCreated = false;

        // Try to create via API first
        if (idToken) {
            try {
                const filesToUpload = [
                    ...uploadedFiles.policyFiles.map(file => ({
                        file,
                        documentType: 'policy' as const,
                    })),
                    ...uploadedFiles.authorityFiles.map(file => ({
                        file,
                        documentType: 'ownership' as const,
                    })),
                    ...uploadedFiles.photoFiles.map(file => ({
                        file,
                        documentType: 'photo' as const,
                    })),
                ];

                const uploadedDocuments = await Promise.all(
                    filesToUpload.map(async ({ file, documentType }) => {
                        const uploaded = await uploadAndRegisterFile(
                            idToken,
                            file,
                            undefined,
                            documentType
                        );

                        return {
                            fileKey: uploaded.fileKey,
                            fileName: uploaded.fileName,
                            fileSize: uploaded.fileSize,
                            documentType,
                        };
                    })
                );

                const payload: CreateSitePayload = {
                    name: site.name,
                    description: site.description,
                    siteType: site.siteType,
                    siteCategory: site.siteCategory,
                    address: site.address,
                    postcode: site.postcode || '',
                    contactEmail: site.contactEmail,
                    contactPhone: site.contactPhone,
                    geometry: site.geometry,
                    clzGeometry: site.clzGeometry,
                    validityStart: site.validityStart,
                    validityEnd: site.validityEnd || null,
                    autoApprove: site.autoApprove,
                    exclusiveUse: site.exclusiveUse,
                    emergencyRecoveryEnabled: site.emergencyRecoveryEnabled,
                    clzEnabled: site.clzEnabled,
                    toalAccessFee: site.toalAccessFee,
                    clzAccessFee: site.clzAccessFee,
                    siteInformation: site.siteInformation,
                    authorizedToGrantAccess: verification.authorizedToGrantAccess,
                    acceptedLandownerDeclaration: verification.acceptedLandownerDeclaration,
                    documents: uploadedDocuments,
                };
                const createdApiSite = await apiCreateSite(idToken, payload);
                await loadSites(); // Refresh from API

                const createdSite = apiSiteToFrontendSite(createdApiSite);
                onAddPendingVerification({
                    ...verification,
                    id: `site-${createdSite.id}`,
                    siteId: createdSite.id,
                    siteName: createdSite.name,
                });

                siteCreated = true;
            } finally {
                setIsCreatingSite(false);
                isSubmittingRef.current = false;
            }
        } else {
            toast.error('You must be logged in to submit a site');
            setIsCreatingSite(false);
            isSubmittingRef.current = false;
            return;
        }

        if (!siteCreated) return;
        setShowAddSite(false);
        void loadNotifications();
    };

    const handleApproveRequest = async (requestId: string) => {
        const booking = bookingRequests.find(b => b.id === requestId);
        const dbId = (booking as any)?._dbId || requestId;
        try {
            setBookingActionState({ requestId, action: 'APPROVE' });
            await apiUpdateBookingStatus(idToken!, dbId, 'APPROVED');
            await loadBookingRequests();
            setSelectedRequest(null);
            toast.success('Booking approved — consent certificate generated.');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to approve booking');
        } finally {
            setBookingActionState({ requestId: null, action: null });
        }
    };

    const handleRejectRequest = async (requestId: string) => {
        const booking = bookingRequests.find(b => b.id === requestId);
        const dbId = (booking as any)?._dbId || requestId;
        try {
            setBookingActionState({ requestId, action: 'REJECT' });
            await apiUpdateBookingStatus(idToken!, dbId, 'REJECTED');
            await loadBookingRequests();
            setSelectedRequest(null);
            toast.error('Booking rejected. Operator has been notified.');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to reject booking');
        } finally {
            setBookingActionState({ requestId: null, action: null });
        }
    };

    const handleUpdateSiteStatus = async (siteId: string, newStatus: SiteStatus) => {
        // Try API first
        if (idToken) {
            try {
                await apiUpdateSiteStatus(idToken, siteId, newStatus);
                await loadSites(); // Refresh from API
            } catch (err) {
                console.error('API status update failed:', err);
                return;
            }
        } else {
            return;
        }

        if (newStatus === 'TEMPORARY_RESTRICTED') {
            const currentDate = new Date();
            setBookingRequests(
                bookingRequests.map(req => {
                    if (req.siteId === siteId && req.status === 'APPROVED') {
                        const startTime = new Date(req.startTime);
                        const endTime = new Date(req.endTime);
                        if (startTime > currentDate || endTime > currentDate) {
                            return {
                                ...req,
                                status: 'CANCELLED',
                                paymentStatus: 'refunded',
                            };
                        }
                    }
                    return req;
                })
            );
        }
        setSelectedSiteForStatus(null);
    };

    const handleUpdateCard = (card: PaymentCard | undefined) => {
        const updatedUser = { ...user, paymentCard: card };
        onUpdateUser(updatedUser);
    };

    const handleSaveSiteDetails = async (updatedSite: Site) => {
        if (!idToken) return;

        try {
            await apiUpdateSiteApi(idToken, updatedSite.id, {
                name: updatedSite.name,
                address: updatedSite.address,
                contactEmail: updatedSite.contactEmail,
                contactPhone: updatedSite.contactPhone,
                toalAccessFee: updatedSite.toalAccessFee,
                clzAccessFee: updatedSite.clzAccessFee,
                autoApprove: updatedSite.autoApprove,
                exclusiveUse: updatedSite.exclusiveUse,
                clzEnabled: updatedSite.clzEnabled,
                geometry: updatedSite.geometry,
                clzGeometry: updatedSite.clzGeometry,
            });
            await loadSites();
            setSelectedSiteForDetails(null);
        } catch (err) {
            console.error('API update site failed:', err);
            toast.error('Failed to save site updates');
            throw err;
        }
    };

    const handleReportIncident = async (
        report: IncidentReport,
        photoEvidence: { name: string; type: string; size: string }[] = []
    ) => {
        if (!idToken) {
            toast.error('You must be signed in to report an incident');
            return;
        }

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
            setSelectedBookingForIncident(null);
            setSelectedIncidentDetails(mappedIncident);
            void loadNotifications(notificationPage);

            if (failedPhotoUploads.length > 0) {
                toast.error(
                    `Incident reported, but ${failedPhotoUploads.length} photo evidence item(s) failed to attach`
                );
            } else {
                toast.success('Incident reported successfully');
            }
            return mappedIncident.id;
        } catch (error: any) {
            toast.error(error?.message || 'Failed to report incident');
            throw error;
        }
    };

    const handleCloseIncident = (incidentId: string) => {
        setIncidentReports(prev =>
            prev.map(inc => (inc.id === incidentId ? { ...inc, status: 'RESOLVED' } : inc))
        );
        setSelectedIncidentDetails(null);
    };

    const handleAddIncidentMessage = async (incidentId: string, text: string) => {
        if (!idToken) return;

        try {
            const updatedIncident = await apiAddIncidentMessage(idToken, incidentId, text);
            const mappedIncident = apiIncidentToFrontendIncident(updatedIncident);
            setIncidentReports(prev =>
                prev.map(incident => (incident.id === incidentId ? mappedIncident : incident))
            );
            setSelectedIncidentDetails(prev =>
                prev && prev.id === incidentId ? mappedIncident : prev
            );
            void loadNotifications(notificationPage);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to add incident message');
        }
    };

    const handleAddIncidentDocument = async (
        incidentId: string,
        doc: { name: string; type: string; size: string }
    ) => {
        if (!idToken) return;

        try {
            const updatedIncident = await apiAddIncidentDocument(idToken, incidentId, {
                fileName: doc.name,
                documentType: doc.type,
                fileSize: doc.size,
            });
            const mappedIncident = apiIncidentToFrontendIncident(updatedIncident);
            setIncidentReports(prev =>
                prev.map(incident => (incident.id === incidentId ? mappedIncident : incident))
            );
            setSelectedIncidentDetails(prev =>
                prev && prev.id === incidentId ? mappedIncident : prev
            );
            void loadNotifications(notificationPage);
            toast.success('Document added');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to add document');
        }
    };

    const handleWithdrawSite = async (siteId: string) => {
        const siteToWithdraw = activeSiteList.find(s => s.id === siteId);
        if (!siteToWithdraw) return;

        if (idToken) {
            try {
                await apiUpdateSiteStatus(idToken, siteId, 'WITHDRAWN');
                await loadSites();
            } catch (err) {
                console.error('API withdraw failed:', err);
                return;
            }
        } else {
            return;
        }

        setSelectedSiteForDetails(null);
        void loadNotifications();
    };

    const handleConnectBankAccount = async () => {
        if (!idToken) return;
        const onboardingWindow = window.open('', '_blank', 'noopener,noreferrer');

        try {
            setBalanceLoading(true);
            const data = await connectStripeAccount(idToken, 'GB');
            if (!data?.onboardingUrl) {
                throw new Error('Stripe onboarding URL was not returned');
            }

            if (onboardingWindow) {
                onboardingWindow.location.href = data.onboardingUrl;
            } else {
                window.location.assign(data.onboardingUrl);
            }
            toast.success('Continue Stripe onboarding to finish connecting your bank account.');
            await loadLandownerBalance();
        } catch (error: any) {
            if (onboardingWindow && !onboardingWindow.closed) {
                onboardingWindow.close();
            }
            toast.error(error?.message || 'Failed to start Stripe onboarding');
        } finally {
            setBalanceLoading(false);
        }
    };

    if (showAddSite) {
        if (!canCreateSites) {
            return (
                <div className="min-h-screen bg-white">
                    <Header user={user} onLogout={onLogout} />
                    <div className="max-w-3xl mx-auto px-4 py-10">
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-6 shadow-sm">
                            <div className="flex items-start gap-4">
                                <div className="size-12 rounded-full bg-amber-100 flex items-center justify-center shrink-0">
                                    <ShieldAlert className="size-6 text-amber-700" />
                                </div>
                                <div className="flex-1">
                                    <h2 className="text-xl font-bold text-amber-950">
                                        Verification required
                                    </h2>
                                    <p className="mt-2 text-sm text-amber-900">
                                        You need a verified landowner profile before you can create
                                        a site. Complete identity verification from your profile,
                                        then try again.
                                    </p>
                                </div>
                            </div>
                            <div className="mt-6 flex flex-wrap gap-3">
                                <button
                                    onClick={() => {
                                        setShowAddSite(false);
                                    }}
                                    className="rounded-lg border border-amber-300 bg-white px-4 py-2 text-sm font-semibold text-amber-950 hover:bg-amber-100 transition-colors"
                                >
                                    Go back
                                </button>
                                <button
                                    onClick={() => {
                                        setShowAddSite(false);
                                        setShowProfile(true);
                                        setOpenProfileForVerification(true);
                                    }}
                                    className="rounded-lg bg-amber-700 px-4 py-2 text-sm font-semibold text-white hover:bg-amber-800 transition-colors"
                                >
                                    Complete verification
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        return (
            <div className="min-h-screen bg-white">
                <Header user={user} onLogout={onLogout} />
                <div className="max-w-4xl mx-auto px-4 py-8">
                    <AddSiteWizard
                        landownerId={user.id}
                        loading={isCreatingSite}
                        onComplete={handleAddSite}
                        onCancel={() => setShowAddSite(false)}
                    />
                </div>
            </div>
        );
    }

    const activeSites = activeSiteList.filter(
        s => normalizeSiteStatus(s.status) === 'ACTIVE'
    ).length;
    const clzEnabledSites = activeSiteList.filter(s => s.emergencyRecoveryEnabled).length;
    const pendingRequestsCount = tabLoaded.requests
        ? bookingRequests.filter(r => r.status === 'PENDING').length
        : summaryStats.pendingRequestsCount;
    const openIncidentsCount = tabLoaded.incidents
        ? incidentReports.filter(r => r.status === 'OPEN').length
        : summaryStats.openIncidentsCount;
    const bookingMetricsLoading = !tabLoaded.requests && summaryLoading.requests;
    const revenueMetricLoading = !landownerBalance && summaryLoading.earnings;
    const pendingRequestsBadgeLoading = !tabLoaded.requests && summaryLoading.requests;
    const incidentsBadgeLoading = !tabLoaded.incidents && summaryLoading.incidents;
    const unreadNotifications = unreadNotificationCount;

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <Header
                user={user}
                onLogout={onLogout}
                onOpenProfile={() => setShowProfile(true)}
                showNotifications={showNotifications}
                onToggleNotifications={() => setShowNotifications(!showNotifications)}
                notificationCount={unreadNotifications}
                notifications={notifications}
                onMarkAsRead={async id => {
                    const isLocal = isLocalNotificationId(id);
                    setNotifications(prev =>
                        prev.map(n => (n.id === id ? { ...n, read: true } : n))
                    );
                    if (isLocal) return;
                    if (!idToken) return;
                    try {
                        await markNotificationAsRead(idToken, id);
                        await loadNotifications(notificationPage);
                    } catch (err) {
                        console.error('Failed to mark notification as read:', err);
                        await loadNotifications(notificationPage);
                    }
                }}
                onMarkAllAsRead={async () => {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    if (!idToken) return;
                    try {
                        await markAllNotificationsAsRead(idToken);
                        await loadNotifications(notificationPage);
                    } catch (err) {
                        console.error('Failed to mark all notifications as read:', err);
                        await loadNotifications(notificationPage);
                    }
                }}
                onPrevPage={async () => {
                    if (!notificationPagination?.hasPrevPage) return;
                    await loadNotifications(notificationPagination.page - 1);
                }}
                onNextPage={async () => {
                    if (!notificationPagination?.hasNextPage) return;
                    await loadNotifications(notificationPagination.page + 1);
                }}
                pagination={notificationPagination || undefined}
                notificationsLoading={notificationsLoading}
            />

            <div className="max-w-7xl mx-auto px-6 py-12">
                {/* Verification Status Banner */}
                <div className="mb-12">
                    {user.verificationStatus === 'VERIFIED' ? (
                        // ✅ STATE 3: Account Verified
                        <div className="bg-[#EAF2FF] border border-[#D6E4FF] rounded-xl p-5 flex items-start gap-4 shadow-sm relative overflow-hidden">
                            <div className="absolute top-0 left-0 w-1 h-full bg-blue-600" />
                            <div className="size-10 bg-white rounded-full flex items-center justify-center shrink-0 shadow-sm border border-[#D6E4FF]">
                                <CheckCircle className="size-6 text-blue-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-slate-900">Account Verified</p>
                                <p className="text-sm text-slate-600 mt-1">
                                    Your identity has been verified. You have full access to all
                                    platform features.
                                </p>
                            </div>
                        </div>
                    ) : user.hasPendingVerification ? (
                        // 🟡 STATE 2: Document submitted, awaiting admin review
                        <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
                            <div className="size-10 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
                                <AlertCircle className="size-6 text-amber-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-amber-900">
                                    Verification Pending Review
                                </p>
                                <p className="text-sm text-amber-700 mt-1">
                                    Your identity document has been submitted and is under review by
                                    our aviation safety team. You can register sites, but they will
                                    require individual verification before becoming discoverable.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setOpenProfileForVerification(true);
                                    setShowProfile(true);
                                }}
                                className="text-amber-800 text-sm font-semibold hover:underline flex items-center gap-1 shrink-0"
                            >
                                View status <ChevronRight className="size-4" />
                            </button>
                        </div>
                    ) : (
                        // 🔴 STATE 1: No document submitted — new landowner
                        <div className="bg-red-50 border border-red-200 rounded-xl p-5 flex items-start gap-4 shadow-sm">
                            <div className="size-10 bg-red-100 rounded-full flex items-center justify-center shrink-0">
                                <ShieldAlert className="size-6 text-red-600" />
                            </div>
                            <div className="flex-1">
                                <p className="font-bold text-red-900">Document Unverified</p>
                                <p className="text-sm text-red-700 mt-1">
                                    Your account is not yet verified. Please upload your identity
                                    document to gain full access and allow your sites to be
                                    discoverable by operators.
                                </p>
                            </div>
                            <button
                                onClick={() => {
                                    setOpenProfileForVerification(true);
                                    setShowProfile(true);
                                }}
                                className="shrink-0 bg-red-600 text-white text-sm font-bold px-4 py-2 rounded-lg hover:bg-red-700 transition-colors flex items-center gap-2"
                            >
                                <ShieldAlert className="size-4" />
                                Complete Verification
                            </button>
                        </div>
                    )}
                </div>

                {/* Page Header Hierarchy */}
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12">
                    <div>
                        <h1 className="text-3xl font-bold text-slate-900 tracking-tight">
                            Welcome, {user.fullName || user.email.split('@')[0]}
                        </h1>
                        <p className="text-slate-500 mt-2 text-lg">
                            Manage your TOAL and Emergency and Recovery Site infrastructure.
                        </p>
                    </div>
                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => {
                            if (!canCreateSites) {
                                toast.error('Complete landowner verification before adding a site');
                                setShowProfile(true);
                                setOpenProfileForVerification(true);
                                return;
                            }

                            setShowAddSite(true);
                        }}
                        disabled={!canCreateSites}
                        title={
                            canCreateSites
                                ? 'Add a new site'
                                : 'Complete verification before creating a site'
                        }
                        className="bg-blue-600 text-white px-8 py-4 rounded-xl hover:bg-blue-700 transition-all shadow-xl shadow-blue-500/20 flex items-center gap-2 font-bold disabled:opacity-60 disabled:cursor-not-allowed"
                    >
                        <Plus className="size-5" />
                        Add Site
                    </motion.button>
                </div>

                {!canCreateSites && (
                    <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 p-4 text-amber-900">
                        <p className="font-semibold">
                            Site creation is locked until verification is complete.
                        </p>
                        <p className="mt-1 text-sm text-amber-800">
                            Submit your verification token from your profile. Once approved, you can
                            add and manage sites.
                        </p>
                    </div>
                )}

                <DashboardMetricCards
                    sitesLoading={sitesLoading}
                    bookingMetricsLoading={bookingMetricsLoading}
                    revenueLoading={revenueMetricLoading}
                    totalSites={activeSiteList.length}
                    activeSites={activeSites}
                    pendingRequestsCount={pendingRequestsCount}
                    totalRevenue={totalRevenue}
                    revenueTrendPercent={revenueTrendPercent}
                />

                <LandownerTabs
                    view={view}
                    onViewChange={setView}
                    pendingRequestsCount={pendingRequestsCount}
                    pendingRequestsLoading={pendingRequestsBadgeLoading}
                    openIncidentsCount={openIncidentsCount}
                    incidentsLoading={incidentsBadgeLoading}
                />

                {/* Main Content Area */}
                <div className="min-h-100">
                    {view === 'sites' && (
                        <SitesTable
                            sites={activeSiteList}
                            loading={sitesLoading}
                            onSiteStatusChange={setSelectedSiteForStatus}
                            onSiteDetails={setSelectedSiteForDetails}
                            onAddSite={() => setShowAddSite(true)}
                        />
                    )}

                    {view === 'requests' && (
                        <BookingRequestsTab
                            bookingRequests={bookingRequests}
                            statusFilter={statusFilter}
                            onStatusFilterChange={setStatusFilter}
                            onSelectRequest={setSelectedRequest}
                            onReportIncident={setSelectedBookingForIncident}
                            onApproveRequest={handleApproveRequest}
                            onRejectRequest={handleRejectRequest}
                            pendingRequestId={bookingActionState.requestId}
                            pendingAction={bookingActionState.action}
                            loading={!tabLoaded.requests || tabLoading.requests}
                        />
                    )}

                    {view === 'incidents' && (
                        <IncidentReportsTab
                            incidentReports={incidentReports}
                            onSelectIncident={setSelectedIncidentDetails}
                            loading={!tabLoaded.incidents || tabLoading.incidents}
                        />
                    )}

                    {view === 'balance' &&
                        (!tabLoaded.balance || tabLoading.balance ? (
                            <div className="bg-white rounded-xl shadow-sm border border-slate-200 p-12">
                                <div className="flex flex-col items-center justify-center gap-3 text-slate-500">
                                    <Spinner
                                        size="lg"
                                        className="text-emerald-500"
                                        aria-label="Loading balance"
                                    />
                                    <p className="text-sm font-medium">Loading balance...</p>
                                </div>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                <div className="lg:col-span-1">
                                    <BalanceCard
                                        availableBalance={landownerBalance?.availableBalance || 0}
                                        pendingBalance={landownerBalance?.pendingBalance || 0}
                                        totalEarned={landownerBalance?.totalEarned || 0}
                                        loading={balanceLoading}
                                        onWithdraw={() => {
                                            if (landownerBalance?.stripeConnected) {
                                                setShowWithdrawalModal(true);
                                                return;
                                            }
                                            void handleConnectBankAccount();
                                        }}
                                        onConnectBank={() => void handleConnectBankAccount()}
                                        stripeConnected={Boolean(landownerBalance?.stripeConnected)}
                                    />
                                </div>
                                <div className="lg:col-span-2">
                                    <WithdrawalHistory
                                        idToken={idToken!}
                                        loading={balanceLoading}
                                    />
                                </div>
                            </div>
                        ))}
                </div>
            </div>

            {/* Modals */}
            {selectedRequest && (
                <BookingRequestModal
                    request={selectedRequest}
                    onApprove={() => handleApproveRequest(selectedRequest.id)}
                    onReject={() => handleRejectRequest(selectedRequest.id)}
                    isSubmitting={bookingActionState.requestId === selectedRequest.id}
                    submittingAction={bookingActionState.action}
                    onClose={() => setSelectedRequest(null)}
                />
            )}

            {showPaymentSettings && (
                <PaymentSettings
                    user={user}
                    onUpdateCard={handleUpdateCard}
                    onClose={() => setShowPaymentSettings(false)}
                />
            )}

            {showWithdrawalModal && landownerBalance && (
                <WithdrawalModal
                    onClose={() => setShowWithdrawalModal(false)}
                    balance={landownerBalance}
                    idToken={idToken!}
                    onWithdrawalSuccess={() => {
                        setShowWithdrawalModal(false);
                        loadLandownerBalance();
                    }}
                />
            )}

            {showProfile && (
                <ProfilePage
                    user={user}
                    totalRevenue={totalRevenue}
                    onClose={() => {
                        setShowProfile(false);
                        setOpenProfileForVerification(false);
                    }}
                    onOpenPaymentSettings={() => {
                        setShowProfile(false);
                        setOpenProfileForVerification(false);
                        setShowPaymentSettings(true);
                    }}
                    onUpdateUser={onUpdateUser}
                    onLogout={onLogout}
                    scrollToVerification={openProfileForVerification}
                    rejectionNote={landownerRejectionNote}
                />
            )}

            {selectedSiteForStatus && (
                <SiteStatusModal
                    site={selectedSiteForStatus}
                    onUpdateStatus={handleUpdateSiteStatus}
                    onClose={() => setSelectedSiteForStatus(null)}
                />
            )}

            {selectedSiteForDetails && (
                <SiteDetailsModal
                    site={selectedSiteForDetails}
                    onSave={handleSaveSiteDetails}
                    onClose={() => setSelectedSiteForDetails(null)}
                    onWithdraw={
                        selectedSiteForDetails.status === 'UNDER_REVIEW'
                            ? handleWithdrawSite
                            : undefined
                    }
                />
            )}

            {selectedBookingForIncident && (
                <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-60">
                    <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                        <IncidentReportForm
                            sites={sites}
                            preselectedBooking={selectedBookingForIncident}
                            userRole="landowner"
                            onClose={() => setSelectedBookingForIncident(null)}
                            onSubmit={handleReportIncident}
                        />
                    </div>
                </div>
            )}

            <AnimatePresence>
                {selectedIncidentDetails && (
                    <IncidentDetailModal
                        incident={selectedIncidentDetails}
                        userRole="landowner"
                        userName={user.fullName || 'Landowner'}
                        onClose={() => setSelectedIncidentDetails(null)}
                        onUpdateStatus={status => {
                            if (status === 'CLOSED') {
                                void handleCloseIncident(selectedIncidentDetails.id);
                            }
                        }}
                        onAddNote={text =>
                            void handleAddIncidentMessage(selectedIncidentDetails.id, text)
                        }
                        onAddDocument={doc =>
                            void handleAddIncidentDocument(selectedIncidentDetails.id, doc)
                        }
                        onBlockSite={() => {}}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
