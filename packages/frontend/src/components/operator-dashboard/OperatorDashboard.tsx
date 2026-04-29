import { useCallback, useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import type { User } from '../../App';
import type { Site, BookingRequest, IncidentReport } from '../../types';
import { Header } from '../Header';
import { ConsentCertificateView } from '../ConsentCertificateView';
import { PaymentSettings } from '../PaymentSettings';
import { ProfilePage } from '../ProfilePage';
import { ReceiptModal } from '../ReceiptModal';
import { BookingDetailsModal } from '../BookingDetailsModal';
import { CancelBookingModal } from '../CancelBookingModal';
import { IncidentReportForm } from '../IncidentReportForm';
import { IncidentDetailModal } from '../IncidentDetailModal';
import { AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useOperatorDashboardState } from './useOperatorDashboardState';
import { extractErrorMessage } from './errorHandler';
import { VerificationStatusBanner } from './VerificationStatusBanner';
import { MetricsCards } from './MetricsCards';
import { NavigationTabs } from './NavigationTabs';
import type { ViewType } from './NavigationTabs';
import { OperatorBookingsSection } from './OperatorBookingsSection';
import { OperatorCLZSection } from './OperatorCLZSection';
import { OperatorCertificatesSection } from './OperatorCertificatesSection';
import { OperatorIncidentsSection } from './OperatorIncidentsSection';

interface OperatorDashboardProps {
    user: User;
    onLogout: () => void;
    onUpdateUser: (user: User) => void;
    sites: Site[];
    isLoading?: boolean;
}

export function OperatorDashboard({
    user,
    onLogout,
    onUpdateUser,
    sites,
    isLoading = false,
}: OperatorDashboardProps) {
    const navigate = useNavigate();
    const [view, setView] = useState<ViewType>('bookings');
    const [showPaymentSettings, setShowPaymentSettings] = useState(false);
    const [showProfile, setShowProfile] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);
    const [selectedCertificate, setSelectedCertificate] = useState<any>(null);
    const [selectedBookingDetails, setSelectedBookingDetails] = useState<BookingRequest | null>(
        null
    );
    const [selectedReceipt, setSelectedReceipt] = useState<BookingRequest | null>(null);
    const [bookingToCancel, setBookingToCancel] = useState<BookingRequest | null>(null);
    const [selectedBookingForIncident, setSelectedBookingForIncident] =
        useState<BookingRequest | null>(null);
    const [selectedIncidentDetails, setSelectedIncidentDetails] = useState<IncidentReport | null>(
        null
    );

    const dashboardState = useOperatorDashboardState(user, onUpdateUser);

    const {
        bookings,
        clzSelections,
        certificates,
        incidentReports,
        notifications,
        notificationPagination,
        bookingsLoading,
        certificatesLoading,
        incidentsLoading,
        notificationsLoading,
        isPaymentCardLoading,
        isCancellingLoading,
        isPayingBooking,
        isPayingClz,
        isIncidentLoading,
        unreadNotificationCount,
        activeBookings,
        pendingBookings,
        cancelBooking,
        payBooking,
        confirmClzUsage,
        reportIncident,
        resolveIncident,
        addIncidentMessage,
        addIncidentDocument,
        markNotificationRead,
        markAllNotificationsRead,
        loadBookings,
        loadIncidents,
        loadNotifications,
        syncUserVerificationState,
        setClzSelections,
        setNotifications,
    } = dashboardState;

    // Verification states
    const isVerified = Boolean(user.verified || user.verificationStatus === 'VERIFIED');
    const isVerificationUnderReview = Boolean(user.hasPendingVerification) && !isVerified;
    const requiresVerificationSubmission = !isVerified && !isVerificationUnderReview;
    const latestVerificationActionNotification = notifications.find(
        n =>
            /verification\s+requires\s+action/i.test(n.title) ||
            /verification\s+was\s+rejected/i.test(n.message)
    );
    const rejectionMessage = latestVerificationActionNotification?.message;
    const rejectionNote = rejectionMessage?.includes(':')
        ? rejectionMessage.split(':').slice(1).join(':').trim()
        : (rejectionMessage ?? null);
    const hasLoadedBookingsData = useRef(false);
    const hasLoadedIncidentsData = useRef(false);

    // Sync verification on mount
    useEffect(() => {
        void syncUserVerificationState(onUpdateUser);
    }, [syncUserVerificationState, onUpdateUser]);

    useEffect(() => {
        if (showPaymentSettings) {
            void dashboardState.syncPaymentCardState();
        }
    }, [showPaymentSettings, dashboardState]);

    // Load data for the active tab only, and only once per tab group unless actions refresh it.
    useEffect(() => {
        if (view === 'bookings' || view === 'clz' || view === 'certificates') {
            if (!hasLoadedBookingsData.current) {
                hasLoadedBookingsData.current = true;
                void loadBookings();
            }
            return;
        }

        if (view === 'incidents' && !hasLoadedIncidentsData.current) {
            hasLoadedIncidentsData.current = true;
            void loadIncidents();
        }
    }, [view, loadBookings, loadIncidents]);

    // Local notification management
    const isLocalNotificationId = (id: string) => id.startsWith('n-') || !id.includes('-');
    const handleOpenBookingFlow = () => {
        navigate('/dashboard/operator/book');
    };

    const handleCancelBooking = async (
        bookingId: string,
        cancellationFee: number,
        paymentStatus: string
    ) => {
        try {
            await cancelBooking(bookingId, cancellationFee, paymentStatus);
            setBookingToCancel(null);
            setSelectedBookingDetails(null);
            toast.success('Booking cancelled');
        } catch (error: any) {
            const message = extractErrorMessage(error, 'Failed to cancel booking');
            toast.error(message);
        }
    };

    const handleBookingRowClick = (booking: BookingRequest) => {
        navigate(`/dashboard/operator/bookings/${booking.id}`);
    };

    const handlePayBooking = async (booking: BookingRequest) => {
        try {
            await payBooking(booking);
            toast.success('Payment successful. Booking complete.');
            setSelectedBookingDetails(null);
        } catch (error: any) {
            const message = extractErrorMessage(error, 'Failed to process payment');
            toast.error(message);

            if (message.toLowerCase().includes('payment method')) {
                setShowPaymentSettings(true);
            }
        }
    };

    const handleRemoveCLZSelection = (id: string) => {
        setClzSelections(prev => prev.filter(clz => clz.id !== id));
        toast.info('Emergency & Recovery zone removed');
    };

    const handleConfirmCLZUsage = async (selection: any, used: boolean) => {
        try {
            await confirmClzUsage(selection, used, () => {
                toast.success(
                    used
                        ? 'Emergency usage confirmed and payment processed.'
                        : 'Emergency booking marked as not used. No charge applied.'
                );
            });
        } catch (error: any) {
            const message = extractErrorMessage(error, 'Failed to confirm usage');
            toast.error(message);
        }
    };

    const handleReportIncident = async (
        report: IncidentReport,
        photoEvidence: { name: string; type: string; size: string }[] = []
    ) => {
        try {
            await reportIncident(report, photoEvidence);
            setSelectedBookingForIncident(null);
            toast.success('Incident reported successfully');
        } catch (error: any) {
            const message = extractErrorMessage(error, 'Failed to report incident');
            toast.error(message);
        }
    };

    const handleResolveIncident = async (incidentId: string) => {
        try {
            await resolveIncident(incidentId);
            setSelectedIncidentDetails(null);
            toast.success('Incident marked as closed');
        } catch (error: any) {
            const message = extractErrorMessage(error, 'Failed to close incident');
            toast.error(message);
        }
    };

    const handleAddIncidentMessage = async (incidentId: string, text: string) => {
        try {
            await addIncidentMessage(incidentId, text);
            toast.success('Message added');
        } catch (error: any) {
            const message = extractErrorMessage(error, 'Failed to add message');
            toast.error(message);
        }
    };

    const handleAddIncidentDocument = async (
        incidentId: string,
        doc: { name: string; type: string; size: string }
    ) => {
        try {
            await addIncidentDocument(incidentId, doc);
            toast.success('Document added');
        } catch (error: any) {
            const message = extractErrorMessage(error, 'Failed to add document');
            toast.error(message);
        }
    };

    const handleUpdateCard = (card: any | undefined) => {
        onUpdateUser({ ...user, paymentCard: card });
    };

    const activeIncidents = incidentReports.filter(
        r => r.status === 'UNDER_REVIEW' || r.status === 'OPEN'
    ).length;

    return (
        <div className="min-h-screen bg-white text-slate-900">
            <Header
                user={user}
                onLogout={onLogout}
                onOpenProfile={() => setShowProfile(true)}
                showNotifications={showNotifications}
                onToggleNotifications={() => setShowNotifications(!showNotifications)}
                notificationCount={unreadNotificationCount}
                notifications={notifications}
                onMarkAsRead={async id => {
                    const isLocal = isLocalNotificationId(id);
                    setNotifications(prev =>
                        prev.map(n => (n.id === id ? { ...n, read: true } : n))
                    );
                    if (isLocal) return;
                    try {
                        await markNotificationRead(id);
                    } catch (error) {
                        console.error('Failed to mark notification as read:', error);
                    }
                }}
                onMarkAllAsRead={async () => {
                    setNotifications(prev => prev.map(n => ({ ...n, read: true })));
                    try {
                        await markAllNotificationsRead();
                    } catch (error) {
                        console.error('Failed to mark all notifications as read:', error);
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
                    <VerificationStatusBanner
                        isVerified={isVerified}
                        isVerificationUnderReview={isVerificationUnderReview}
                        requiresVerificationSubmission={requiresVerificationSubmission}
                        flyerId={user.flyerId || 'GBR-RPAS-20241'}
                        rejectionNote={rejectionNote}
                        onOpenProfile={() => setShowProfile(true)}
                    />
                </div>

                {/* Metrics and Header */}
                <MetricsCards
                    activeBookings={activeBookings}
                    pendingBookings={pendingBookings}
                    clzCount={clzSelections.length}
                    certificatesCount={certificates.length}
                    totalSpend={bookings
                        .filter(b => b.status === 'APPROVED' || b.status === 'PENDING')
                        .reduce((sum, b) => sum + (b.toalCost || 0) + (b.platformFee || 0), 0)}
                    userName={user.organisation || (user.email.split('@')[0] as string) || ''}
                    isVerified={isVerified}
                    bookingsLoading={bookingsLoading}
                    certificatesLoading={certificatesLoading}
                    onOpenBookingFlow={handleOpenBookingFlow}
                />

                {/* Navigation Tabs */}
                <NavigationTabs currentView={view} onViewChange={setView} />

                {/* Main Content */}
                <div className="min-h-100">
                    {view === 'bookings' && (
                        <OperatorBookingsSection
                            bookings={bookings}
                            isLoading={bookingsLoading || isLoading}
                            isCancellingLoading={isCancellingLoading}
                            isPayingBooking={isPayingBooking}
                            onSelectBookingDetails={setSelectedBookingDetails}
                            onSelectReceipt={setSelectedReceipt}
                            onSetBookingToCancel={setBookingToCancel}
                            onReportIncident={setSelectedBookingForIncident}
                        />
                    )}

                    {view === 'clz' && (
                        <OperatorCLZSection
                            clzSelections={clzSelections}
                            isLoading={bookingsLoading}
                            isPayingClz={isPayingClz}
                            onConfirmUsage={handleConfirmCLZUsage}
                            onRemove={handleRemoveCLZSelection}
                        />
                    )}

                    {view === 'certificates' && (
                        <OperatorCertificatesSection
                            certificates={certificates}
                            isLoading={certificatesLoading}
                            onSelectCertificate={setSelectedCertificate}
                        />
                    )}

                    {view === 'incidents' && (
                        <OperatorIncidentsSection
                            incidents={incidentReports}
                            isLoading={incidentsLoading}
                            onSelectIncident={setSelectedIncidentDetails}
                        />
                    )}
                </div>
            </div>

            {/* Modals */}
            <AnimatePresence>
                {selectedCertificate && (
                    <ConsentCertificateView
                        certificate={selectedCertificate}
                        onClose={() => setSelectedCertificate(null)}
                    />
                )}

                {selectedReceipt && (
                    <ReceiptModal
                        booking={selectedReceipt}
                        onClose={() => setSelectedReceipt(null)}
                    />
                )}

                {bookingToCancel && (
                    <CancelBookingModal
                        booking={bookingToCancel}
                        isLoading={isCancellingLoading}
                        onConfirm={handleCancelBooking}
                        onClose={() => setBookingToCancel(null)}
                    />
                )}

                {showPaymentSettings && (
                    <PaymentSettings
                        user={user}
                        onUpdateCard={handleUpdateCard}
                        onClose={() => setShowPaymentSettings(false)}
                    />
                )}

                {showProfile && (
                    <ProfilePage
                        user={user}
                        totalRevenue={bookings
                            .filter(b => b.status === 'APPROVED' || b.status === 'PENDING')
                            .reduce((sum, b) => sum + (b.toalCost || 0) + (b.platformFee || 0), 0)}
                        onClose={() => setShowProfile(false)}
                        onOpenPaymentSettings={() => {
                            setShowProfile(false);
                            setShowPaymentSettings(true);
                        }}
                        onUpdateUser={onUpdateUser}
                        onLogout={onLogout}
                        rejectionNote={rejectionNote}
                    />
                )}

                {selectedBookingForIncident && (
                    <div className="fixed inset-0 bg-slate-900/40 backdrop-blur-sm flex items-center justify-center p-4 z-60">
                        <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                            <IncidentReportForm
                                sites={sites}
                                preselectedBooking={selectedBookingForIncident}
                                userRole="operator"
                                onClose={() => setSelectedBookingForIncident(null)}
                                onSubmit={handleReportIncident}
                            />
                        </div>
                    </div>
                )}

                {selectedIncidentDetails && (
                    <IncidentDetailModal
                        incident={selectedIncidentDetails}
                        userRole="operator"
                        userName={user.organisation || user.fullName || 'Operator'}
                        onClose={() => setSelectedIncidentDetails(null)}
                        onUpdateStatus={status => {
                            if (status === 'CLOSED') {
                                void handleResolveIncident(selectedIncidentDetails.id);
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
