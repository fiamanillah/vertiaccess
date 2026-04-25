import { useState, useEffect, useCallback } from 'react';
import type { User } from '../App';
import type {
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
import { RotateCcw } from 'lucide-react';
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
import {
    apiGetAdminStats,
    apiGetUsers,
    apiGetVerifications,
    apiUpdateVerification,
} from '../lib/auth';
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
    type AdminView =
        | 'overview'
        | 'landowners'
        | 'operators'
        | 'sites'
        | 'subscription-plans'
        | 'user-mgmt'
        | 'incidents'
        | 'analytics';

    const { idToken } = useAuth();
    const [view, setView] = useState<AdminView>('overview');
    const [selectedVerification, setSelectedVerification] = useState<PendingVerification | null>(
        null
    );
    const [managedUsers, setManagedUsers] = useState<ManagedUser[]>([]);
    const [dbVerifications, setDbVerifications] = useState<PendingVerification[]>([]);
    const [incidentReports, setIncidentReports] = useState<IncidentReport[]>([]);
    const [stats, setStats] = useState<any>(null);
    const [loadingState, setLoadingState] = useState({
        stats: false,
        verifications: false,
        users: false,
        incidents: false,
    });
    const [loadedState, setLoadedState] = useState({
        stats: false,
        verifications: false,
        users: false,
        incidents: false,
    });

    const loadStats = useCallback(
        async (force = false) => {
            if (!idToken) return;

            setLoadingState(prev => ({ ...prev, stats: true }));
            try {
                const data = await apiGetAdminStats(idToken);
                setStats(data);
                setLoadedState(prev => ({ ...prev, stats: true }));
            } catch (error) {
                toast.error('Failed to fetch admin stats.');
            } finally {
                setLoadingState(prev => ({ ...prev, stats: false }));
            }
        },
        [idToken]
    );

    const loadVerifications = useCallback(
        async (force = false) => {
            if (!idToken) return;

            setLoadingState(prev => ({ ...prev, verifications: true }));
            try {
                const verifications = await apiGetVerifications(idToken);
                setDbVerifications(verifications);
                setLoadedState(prev => ({ ...prev, verifications: true }));
            } catch (error) {
                toast.error('Failed to fetch verifications from backend.');
            } finally {
                setLoadingState(prev => ({ ...prev, verifications: false }));
            }
        },
        [idToken]
    );

    const loadUsers = useCallback(
        async (force = false) => {
            if (!idToken) return;

            setLoadingState(prev => ({ ...prev, users: true }));
            try {
                const users = await apiGetUsers(idToken);
                setManagedUsers(users);
                setLoadedState(prev => ({ ...prev, users: true }));
            } catch (error) {
                toast.error('Failed to fetch users from backend.');
            } finally {
                setLoadingState(prev => ({ ...prev, users: false }));
            }
        },
        [idToken]
    );

    const loadIncidents = useCallback(
        async (force = false): Promise<IncidentReport[]> => {
            if (!idToken) return [];

            setLoadingState(prev => ({ ...prev, incidents: true }));
            try {
                const apiIncidents = await apiFetchIncidents(idToken);
                const mappedIncidents = apiIncidents.map(apiIncidentToFrontendIncident);
                setIncidentReports(mappedIncidents);
                setLoadedState(prev => ({ ...prev, incidents: true }));
                return mappedIncidents;
            } catch (error) {
                toast.error('Failed to fetch incidents from backend.');
                return [];
            } finally {
                setLoadingState(prev => ({ ...prev, incidents: false }));
            }
        },
        [idToken]
    );

    const ensureDataForView = useCallback(
        async (targetView: AdminView, force = false) => {
            if (!idToken) return;

            if (targetView === 'overview') {
                await Promise.all([
                    !force && (loadedState.stats || loadingState.stats)
                        ? Promise.resolve()
                        : loadStats(force),
                    !force && (loadedState.verifications || loadingState.verifications)
                        ? Promise.resolve()
                        : loadVerifications(force),
                ]);
                return;
            }

            if (
                targetView === 'landowners' ||
                targetView === 'operators' ||
                targetView === 'sites'
            ) {
                if (!force && (loadedState.verifications || loadingState.verifications)) return;
                await loadVerifications(force);
                return;
            }

            if (targetView === 'user-mgmt') {
                if (!force && (loadedState.users || loadingState.users)) return;
                await loadUsers(force);
                return;
            }

            if (targetView === 'incidents') {
                if (!force && (loadedState.incidents || loadingState.incidents)) return;
                await loadIncidents(force);
                return;
            }

            if (targetView === 'subscription-plans' || targetView === 'analytics') {
                if (!force && (loadedState.stats || loadingState.stats)) return;
                await loadStats(force);
            }
        },
        [
            idToken,
            loadedState.incidents,
            loadedState.stats,
            loadedState.users,
            loadedState.verifications,
            loadingState.incidents,
            loadingState.stats,
            loadingState.users,
            loadingState.verifications,
            loadIncidents,
            loadStats,
            loadUsers,
            loadVerifications,
        ]
    );

    useEffect(() => {
        if (!idToken) {
            setStats(null);
            setManagedUsers([]);
            setDbVerifications([]);
            setIncidentReports([]);
            setLoadingState({ stats: false, verifications: false, users: false, incidents: false });
            setLoadedState({ stats: false, verifications: false, users: false, incidents: false });
            return;
        }

        setLoadingState({ stats: false, verifications: false, users: false, incidents: false });
        setLoadedState({ stats: false, verifications: false, users: false, incidents: false });
        setManagedUsers([]);
        setDbVerifications([]);
        setIncidentReports([]);
        void loadStats(true);
    }, [idToken, loadStats]);

    useEffect(() => {
        void ensureDataForView(view);
    }, [view, ensureDataForView]);

    // Use DB verifications if fetched, fallback to initial props
    const pendingVerifications = idToken ? dbVerifications : initialPendingVerifications;
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

    const [selectedUserForDetail, setSelectedUserForDetail] = useState<ManagedUser | null>(null);
    const [isProfileOpen, setIsProfileOpen] = useState(false);
    const [selectedIncidentDetail, setSelectedIncidentDetail] = useState<IncidentReport | null>(
        null
    );
    const [isActionLoading, setIsActionLoading] = useState(false);

    const verificationCounts = {
        pending: pendingVerifications.filter(v => v.status === 'PENDING').length,
        landowners: pendingVerifications.filter(
            v =>
                (v.type === 'landowner' ||
                    (v.type === 'identity' && (v as any).userRole !== 'operator')) &&
                v.status === 'PENDING'
        ).length,
        operators: pendingVerifications.filter(
            v =>
                (v.type === 'operator' ||
                    (v.type === 'identity' && (v as any).userRole === 'operator')) &&
                v.status === 'PENDING'
        ).length,
        sites: pendingVerifications.filter(v => v.type === 'site' && v.status === 'PENDING').length,
    };

    const tabBadgeCounts = {
        landowners: loadedState.verifications ? verificationCounts.landowners : undefined,
        operators: loadedState.verifications ? verificationCounts.operators : undefined,
        sites: loadedState.verifications ? verificationCounts.sites : undefined,
        incidents: loadedState.stats ? (stats?.openIncidents ?? 0) : undefined,
    };

    const tabBadgeLoading = {
        landowners: !loadedState.verifications && loadingState.verifications,
        operators: !loadedState.verifications && loadingState.verifications,
        sites: !loadedState.verifications && loadingState.verifications,
        incidents: !loadedState.stats && loadingState.stats,
    };

    const getTabReloadLabel = (activeTab: AdminView) => {
        switch (activeTab) {
            case 'overview':
                return 'Reload Overview';
            case 'landowners':
                return 'Reload Landowner Verifications';
            case 'operators':
                return 'Reload Operator Verifications';
            case 'sites':
                return 'Reload Site Verifications';
            case 'user-mgmt':
                return 'Reload Users';
            case 'incidents':
                return 'Reload Incidents';
            case 'subscription-plans':
                return 'Reload Stats';
            default:
                return 'Reload';
        }
    };

    const isActiveTabReloading =
        view === 'overview'
            ? loadingState.stats || loadingState.verifications
            : view === 'landowners' || view === 'operators' || view === 'sites'
              ? loadingState.verifications
              : view === 'user-mgmt'
                ? loadingState.users
                : view === 'incidents'
                  ? loadingState.incidents
                  : view === 'subscription-plans'
                    ? loadingState.stats
                    : false;

    const handleReloadActiveTab = () => {
        void ensureDataForView(view, true);
    };

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

                await loadVerifications(true);
                if (loadedState.users || view === 'user-mgmt') {
                    await loadUsers(true);
                }
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

                await loadVerifications(true);
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
            void loadIncidents(true);
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
            void loadIncidents(true);
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
            void loadIncidents(true);
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
        <div className="min-h-screen bg-white">
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
                        verificationCounts={
                            loadedState.verifications ? verificationCounts : undefined
                        }
                        onViewChange={setView}
                        isLoading={
                            Boolean(isLoading) || loadingState.stats || loadingState.verifications
                        }
                    />
                )}

                {/* Tabs Navigation - Flags & Issues removed */}
                <TabNavigation
                    activeView={view}
                    onViewChange={setView}
                    badgeCounts={tabBadgeCounts}
                    badgeLoading={tabBadgeLoading}
                />

                {view !== 'analytics' && (
                    <div className="flex justify-end mb-6">
                        <button
                            onClick={handleReloadActiveTab}
                            disabled={isActiveTabReloading}
                            className="inline-flex h-10 items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 text-xs font-black uppercase tracking-wider text-slate-600 hover:bg-slate-50 disabled:opacity-60"
                        >
                            <RotateCcw
                                className={`size-3.5 ${isActiveTabReloading ? 'animate-spin' : ''}`}
                            />
                            {getTabReloadLabel(view)}
                        </button>
                    </div>
                )}

                {view === 'overview' && (
                    <PendingVerificationsQueue
                        pendingVerifications={pendingVerifications}
                        onReviewVerification={setSelectedVerification}
                        isLoading={Boolean(isLoading) || loadingState.verifications}
                        onRefresh={() => {
                            void ensureDataForView('overview', true);
                        }}
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
                            isLoading={Boolean(isLoading) || loadingState.verifications}
                        />
                    )}

                    {view === 'operators' && (
                        <OperatorVerifications
                            pendingVerifications={operatorVerifications}
                            onReviewVerification={setSelectedVerification}
                            isLoading={Boolean(isLoading) || loadingState.verifications}
                        />
                    )}

                    {view === 'sites' && (
                        <SiteVerifications
                            pendingVerifications={pendingVerifications}
                            allSites={allSites}
                            managedUsers={managedUsers}
                            onReviewVerification={setSelectedVerification}
                            isLoading={Boolean(isLoading) || loadingState.verifications}
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
