import { useState, useEffect, useCallback } from 'react';
import type { User } from '../App';
import {
    PendingVerification,
    Site,
    IncidentReport,
    IncidentStatus,
    ManagedUser,
    BookingRequest,
} from '../types';
import { Header } from './Header';
import { VerificationModal } from './VerificationModal';
import { ProfilePage } from './ProfilePage';
import { IncidentDetailModal } from './IncidentDetailModal';
import { UserDetailModal } from './UserDetailModal';
import { AnimatePresence, motion } from 'motion/react';
import { toast } from 'sonner';
import { Overview } from './AdminDashboard/Overview';
import { PendingVerificationsQueue } from './AdminDashboard/PendingVerificationsQueue';
import { UserManagementSection } from './AdminDashboard/UserManagementSection';
import { AnalyticsSection } from './AdminDashboard/AnalyticsSection';
import { TabNavigation } from './AdminDashboard/TabNavigation';
import { LandownerVerifications } from './AdminDashboard/LandownerVerifications';
import { OperatorVerifications } from './AdminDashboard/OperatorVerifications';
import { SiteVerifications } from './AdminDashboard/SiteVerifications';
import { SafetyIncidentResponse } from './AdminDashboard/SafetyIncidentResponse';
import { SubscriptionPlanManagement } from './AdminDashboard/SubscriptionPlanManagement';
import { Skeleton } from './ui/skeleton';
import { useAuth } from '../context/AuthContext';
import { apiGetUsers, apiGetVerifications, apiUpdateVerification } from '../lib/auth';
import { updateSiteStatus } from '../lib/sites';
import {
    apiAddIncidentDocument,
    apiAddIncidentMessage,
    apiFetchIncidents,
    apiIncidentToFrontendIncident,
    apiUpdateIncidentStatus,
} from '../lib/incidents';

interface AdminDashboardProps {
    user: User;
    onLogout: () => void;
    pendingVerifications: PendingVerification[];
    onRemovePendingVerification: (verificationId: string) => void;
    onUpdateVerificationStatus: (verificationId: string, status: 'APPROVED' | 'REJECTED') => void;
    onUpdateSite: (site: Site) => void;
    onUpdateUser?: (user: User) => void;
    allSites?: Site[];
    allBookings?: BookingRequest[];
    onUpdateBookingStatus?: (bookingId: string, status: any) => void;
    isLoading?: boolean;
}
export function AdminDashboard({
    user,
    onLogout,
    pendingVerifications: initialPendingVerifications,
    onRemovePendingVerification,
    onUpdateVerificationStatus,
    onUpdateSite,
    onUpdateUser,
    allSites = [],
    allBookings = [],
    onUpdateBookingStatus,
    isLoading,
}: AdminDashboardProps) {
    const { idToken } = useAuth();
    const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(
        null
    );
    const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
    const [dbVerifications, setDbVerifications] = useState<PendingVerification[]>([]);
    const [incidentReports, setIncidentReports] = useState<IncidentReport[]>([]);
    const [isDataLoading, setIsDataLoading] = useState(true);

    const loadIncidents = useCallback(
        async (shouldUpdateState = true): Promise<IncidentReport[]> => {
            if (!idToken) return [];

            try {
                const apiIncidents = await apiFetchIncidents(idToken);
                const mappedIncidents = apiIncidents.map(apiIncidentToFrontendIncident);

                if (shouldUpdateState) {
                    setIncidentReports(mappedIncidents);
                }

                return mappedIncidents;
            } catch (error) {
                toast.error('Failed to fetch incidents from backend.');
                return [];
            }
        },
        [idToken]
    );

    useEffect(() => {
        if (!idToken) {
            setIsDataLoading(false);
            return;
        }

        let isActive = true;

        const loadAdminData = async () => {
            setIsDataLoading(true);

            try {
                const [users, verifications, incidents] = await Promise.all([
                    apiGetUsers(idToken),
                    apiGetVerifications(idToken),
                    loadIncidents(false),
                ]);

                if (!isActive) return;

                setManagedUsers(users);
                setDbVerifications(verifications);
                setIncidentReports(incidents);
            } catch (error) {
                if (isActive) {
                    toast.error('Failed to fetch admin data from backend.');
                }
            } finally {
                if (isActive) {
                    setIsDataLoading(false);
                }
            }
        };

        void loadAdminData();

        return () => {
            isActive = false;
        };
    }, [idToken, loadIncidents]);

    // Use DB verifications if fetched, fallback to initial props
    const pendingVerifications =
        dbVerifications.length > 0 ? dbVerifications : initialPendingVerifications;
    const isDashboardLoading = Boolean(isLoading) || isDataLoading;
    const isOperatorVerification = (verification: PendingVerification): boolean => {
        if (verification.type === 'operator') return true;
        if (verification.type === 'identity' && (verification as any).userRole === 'operator') {
            return true;
        }
        return false;
    };

    const operatorVerifications = pendingVerifications.filter(isOperatorVerification);
    const landownerVerifications = pendingVerifications.filter(
        verification =>
            !isOperatorVerification(verification) &&
            ((verification as any).type === 'identity' ||
                (verification as any).type === 'landowner')
    );

    const [view, setView] = useState<
        | 'overview'
        | 'landowners'
        | 'operators'
        | 'sites'
        | 'subscription-plans'
        | 'user-mgmt'
        | 'incidents'
        | 'analytics'
    >('overview');
    const [selectedUserForDetail, setSelectedUserForDetail] = useState<ManagedUser | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<IncidentReport | null>(
        null
    );
    const [isActionLoading, setIsActionLoading] = useState(false);

    const handleApprove = async (verification: PendingVerification, adminNote?: string) => {
        setIsActionLoading(true);
        try {
            if (verification.type === 'site') {
                if (!idToken || !verification.siteId) throw new Error('Authentication missing');
                await updateSiteStatus(idToken, verification.siteId, 'ACTIVE', adminNote);
                onUpdateSite({ id: verification.siteId, status: 'ACTIVE', adminNote } as any);
                onRemovePendingVerification(verification.id);
            } else {
                if (!idToken) throw new Error('Authentication missing');
                await apiUpdateVerification(idToken, verification.id, 'APPROVED', adminNote);

                // Refresh DB models
                const freshVerifications = await apiGetVerifications(idToken);
                setDbVerifications(freshVerifications);
                const freshUsers = await apiGetUsers(idToken);
                setManagedUsers(freshUsers);
            }

            toast.success('Verification approved successfully');
            setSelectedVerification(null);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to approve verification');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleReject = async (verification: PendingVerification, adminNote?: string) => {
        setIsActionLoading(true);
        try {
            if (verification.type === 'site') {
                if (!idToken || !verification.siteId) throw new Error('Authentication missing');
                await updateSiteStatus(idToken, verification.siteId, 'REJECTED', adminNote);
                onUpdateSite({ id: verification.siteId, status: 'REJECTED', adminNote } as any);
                onRemovePendingVerification(verification.id);
            } else {
                if (!idToken) throw new Error('Authentication missing');
                await apiUpdateVerification(idToken, verification.id, 'REJECTED', adminNote);

                // Refresh DB
                const freshVerifications = await apiGetVerifications(idToken);
                setDbVerifications(freshVerifications);
            }

            toast.error('Verification rejected');
            setSelectedVerification(null);
        } catch (error: any) {
            toast.error(error?.message || 'Failed to reject verification');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleSuspendManagedUser = (user: ManagedUser, reason: string) => {
        setManagedUsers(prev =>
            prev.map(u =>
                u.id === user.id
                    ? {
                          ...u,
                          verificationStatus: 'SUSPENDED',
                          suspendedDate: new Date().toISOString(),
                          suspendedReason: reason,
                          activeSites: 0,
                      }
                    : u
            )
        );
    };

    const handleReinstateManagedUser = (user: ManagedUser) => {
        setManagedUsers(prev =>
            prev.map(u =>
                u.id === user.id
                    ? {
                          ...u,
                          verificationStatus: 'VERIFIED',
                          suspendedDate: undefined,
                          suspendedReason: undefined,
                          activeSites: u.totalSites,
                      }
                    : u
            )
        );
    };

    const handleUpdateManagedUser = (userId: string, updates: Partial<ManagedUser>) => {
        setManagedUsers(prev => prev.map(u => (u.id === userId ? { ...u, ...updates } : u)));
        if (selectedUserForDetail?.id === userId) {
            setSelectedUserForDetail(prev => (prev ? { ...prev, ...updates } : null));
        }
    };

    const handleUpdateIncidentStatus = async (incidentId: string, status: IncidentStatus) => {
        if (!idToken) return;

        try {
            const updatedIncident = await apiUpdateIncidentStatus(idToken, incidentId, status);
            const mappedIncident = apiIncidentToFrontendIncident(updatedIncident);
            setIncidentReports(prev =>
                prev.map(incident => (incident.id === incidentId ? mappedIncident : incident))
            );
            setSelectedIncidentDetail(prev =>
                prev && prev.id === incidentId ? mappedIncident : prev
            );
            void loadIncidents();
            toast.success('Incident status updated');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to update incident status');
        }
    };

    const handleAddIncidentMessage = async (incidentId: string, text: string) => {
        if (!idToken) return;

        try {
            const updatedIncident = await apiAddIncidentMessage(idToken, incidentId, text);
            const mappedIncident = apiIncidentToFrontendIncident(updatedIncident);
            setIncidentReports(prev =>
                prev.map(incident => (incident.id === incidentId ? mappedIncident : incident))
            );
            setSelectedIncidentDetail(prev =>
                prev && prev.id === incidentId ? mappedIncident : prev
            );
            void loadIncidents();
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
            setSelectedIncidentDetail(prev =>
                prev && prev.id === incidentId ? mappedIncident : prev
            );
            void loadIncidents();
        } catch (error: any) {
            toast.error(error?.message || 'Failed to add incident document');
        }
    };

    const handleBlockSiteForIncident = async (siteId: string) => {
        if (!idToken) return;

        try {
            await updateSiteStatus(idToken, siteId, 'TEMPORARY_RESTRICTED');
            onUpdateSite({ id: siteId, status: 'TEMPORARY_RESTRICTED' } as Site);
            toast.success('Site access restricted');
        } catch (error: any) {
            toast.error(error?.message || 'Failed to restrict site access');
        }
    };

    return (
        <div className="min-h-screen bg-slate-50">
            <Header user={user} onLogout={onLogout} onOpenProfile={() => setIsProfileOpen(true)} />

            <div className="max-w-350 mx-auto px-8 py-12">
                <div className="mb-12">
                    <p className="text-sm font-bold text-slate-500 uppercase tracking-widest mb-2">
                        Welcome, {user.fullName || 'Admin'}
                    </p>
                    <div className="flex items-center justify-between">
                        <h1 className="text-[40px] font-black text-slate-800 tracking-tight">
                            Admin Dashboard
                        </h1>
                    </div>
                </div>

                {/* Overview Stats Grid - Updated from second image */}
                {view === 'overview' && (
                    <Overview
                        pendingVerifications={pendingVerifications}
                        onViewChange={setView}
                        isLoading={isDashboardLoading}
                    />
                )}

                {/* Tabs Navigation - Flags & Issues removed */}
                <TabNavigation
                    activeView={view}
                    onViewChange={setView}
                    pendingVerifications={pendingVerifications}
                    incidentReports={incidentReports}
                    isLoading={isDashboardLoading}
                />

                {view === 'overview' && (
                    <PendingVerificationsQueue
                        pendingVerifications={pendingVerifications}
                        onReviewVerification={setSelectedVerification}
                        isLoading={isDashboardLoading}
                    />
                )}

                {selectedUserForDetail && (
                    <UserDetailModal
                        user={selectedUserForDetail}
                        onClose={() => setSelectedUserForDetail(null)}
                        sites={allSites}
                        bookings={allBookings}
                        incidents={incidentReports}
                        allUsers={managedUsers}
                        onUpdateUser={handleUpdateManagedUser}
                        onUpdateSite={(siteId, status) =>
                            onUpdateSite({ id: siteId, status } as any)
                        }
                        onUpdateBooking={(bookingId, status) =>
                            onUpdateBookingStatus?.(bookingId, status)
                        }
                        onRefund={(id, type) => alert(`Refund initiated for ${type}: ${id}`)}
                        onRaiseIncident={siteId =>
                            alert(`Direct incident reporting for site ${siteId} initiated.`)
                        }
                        onUpdateIncidentStatus={(incidentId, status) =>
                            void handleUpdateIncidentStatus(incidentId, status)
                        }
                        onAddIncidentNote={(incidentId, note) =>
                            void handleAddIncidentMessage(incidentId, note)
                        }
                        onAddIncidentDocument={(incidentId, doc) =>
                            void handleAddIncidentDocument(incidentId, doc)
                        }
                        onBlockIncidentSite={siteId => void handleBlockSiteForIncident(siteId)}
                    />
                )}

                {/* Content Views */}
                <AnimatePresence mode="wait">
                    {view === 'landowners' && (
                        <LandownerVerifications
                            pendingVerifications={landownerVerifications}
                            onReviewVerification={setSelectedVerification}
                            isLoading={isDashboardLoading}
                        />
                    )}

                    {view === 'operators' && (
                        <OperatorVerifications
                            pendingVerifications={operatorVerifications}
                            onReviewVerification={setSelectedVerification}
                            isLoading={isDashboardLoading}
                        />
                    )}

                    {view === 'sites' && (
                        <SiteVerifications
                            pendingVerifications={pendingVerifications}
                            allSites={allSites}
                            managedUsers={managedUsers}
                            onReviewVerification={setSelectedVerification}
                            isLoading={isDashboardLoading}
                        />
                    )}

                    {view === 'subscription-plans' && (
                        <motion.div
                            key="subscription-plans"
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                        >
                            {idToken ? (
                                <SubscriptionPlanManagement idToken={idToken} />
                            ) : (
                                <div className="bg-white rounded-3xl border border-slate-100 p-8 shadow-sm text-slate-500">
                                    Admin authentication is required to manage subscription plans.
                                </div>
                            )}
                        </motion.div>
                    )}

                    {view === 'user-mgmt' && (
                        <UserManagementSection
                            users={managedUsers}
                            onViewUser={setSelectedUserForDetail}
                            onSuspendUser={handleSuspendManagedUser}
                            onReinstateUser={handleReinstateManagedUser}
                        />
                    )}

                    {view === 'analytics' && <AnalyticsSection />}

                    {view === 'incidents' && (
                        <SafetyIncidentResponse
                            incidentReports={incidentReports}
                            onViewIncident={setSelectedIncidentDetail}
                            onUpdateIncidentStatus={(incidentId, status) =>
                                void handleUpdateIncidentStatus(incidentId, status)
                            }
                            onAddIncidentNote={(incidentId, note) =>
                                void handleAddIncidentMessage(incidentId, note)
                            }
                            onBlockSite={siteId => void handleBlockSiteForIncident(siteId)}
                        />
                    )}
                </AnimatePresence>
            </div>

            {/* Verification Modal Overlay */}
            <AnimatePresence>
                {selectedVerification && (
                    <VerificationModal
                        verification={selectedVerification}
                        loading={isActionLoading}
                        onApprove={(adminNote?: string) =>
                            handleApprove(selectedVerification, adminNote)
                        }
                        onReject={(adminNote?: string) =>
                            handleReject(selectedVerification, adminNote)
                        }
                        onClose={() => setSelectedVerification(null)}
                    />
                )}
            </AnimatePresence>

            {/* Profile Overlay */}
            <AnimatePresence>
                {isProfileOpen && (
                    <ProfilePage
                        user={user}
                        onClose={() => setIsProfileOpen(false)}
                        onOpenPaymentSettings={() => {}}
                        onUpdateUser={onUpdateUser || (() => {})}
                        onLogout={onLogout}
                    />
                )}
            </AnimatePresence>

            <AnimatePresence>
                {selectedIncidentDetail && (
                    <IncidentDetailModal
                        incident={selectedIncidentDetail}
                        userRole="admin"
                        userName={user.fullName || 'Admin'}
                        onClose={() => setSelectedIncidentDetail(null)}
                        onUpdateStatus={status =>
                            void handleUpdateIncidentStatus(selectedIncidentDetail.id, status)
                        }
                        onAddNote={text =>
                            void handleAddIncidentMessage(selectedIncidentDetail.id, text)
                        }
                        onAddDocument={doc =>
                            void handleAddIncidentDocument(selectedIncidentDetail.id, doc)
                        }
                        onBlockSite={siteId => {
                            void handleBlockSiteForIncident(siteId);
                        }}
                    />
                )}
            </AnimatePresence>
        </div>
    );
}
