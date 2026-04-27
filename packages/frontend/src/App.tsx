import { useState, useEffect, useMemo } from 'react';
import { createBrowserRouter, RouterProvider, Navigate } from 'react-router-dom';
import { LandingPage } from './components/LandingPage';
import { LandownerDashboard } from './components/LandownerDashboard';
import { OperatorDashboard } from './components/OperatorDashboard';
import { AdminDashboard } from './components/AdminDashboard';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PaymentGuard } from './components/PaymentGuard';
import { LoadingScreen } from './components/LoadingScreen';
import { BookingPage } from './components/BookingPage';
import { BookingDetailsPage } from './components/BookingDetailsPage';
import { AuthProvider, useAuth, type AuthUser } from './context/AuthContext';
import type {
    PaymentCard,
    Site,
    PendingVerification,
    BookingRequest,
    AccountStatus,
} from './types';
import * as turf from '@turf/turf';
import { apiSiteToFrontendSite, fetchMySites, fetchPublicSites } from './lib/sites';
import { normalizeSiteStatus } from './lib/site-status';
import {
    mockSites,
    mockUsers,
    mockPendingVerifications,
    mockBookingRequests,
} from './data/mockData';
import { toast } from 'sonner';

export type UserRole = 'landowner' | 'operator' | 'admin' | null;

export interface User {
    id: string;
    email: string;
    role: UserRole;
    fullName?: string;
    organisation?: string;
    verified?: boolean;
    verificationStatus?: AccountStatus;
    hasPendingVerification?: boolean;
    paymentCard?: PaymentCard;
    flyerId?: string;
    operatorId?: string;
    planTier?: 'Professional' | 'Growth' | 'Enterprise' | 'Standard' | 'Advanced';
    isPAYG?: boolean;
    subscriptionStatus?: string;
    passwordChangedAt?: string;
    deactivationDate?: string;
    subscriptionStartDate?: string;
    internalNotes?: string[];
    identificationDocument?: {
        type: 'national_id' | 'passport';
        fileName: string;
        fileUrl: string;
        uploadedAt: string;
    };
}

export interface SiteApprovalNotification {
    siteId: string;
    siteName: string;
    approved: boolean;
    timestamp: string;
    adminNote?: string;
}

function AppContent() {
    const { user: authUser, idToken, isAuthenticated, isLoading, logout, updateUser } = useAuth();

    // Convert AuthUser to the legacy User type used by dashboards
    const currentUser: User | null = authUser
        ? {
              id: authUser.id,
              email: authUser.email,
              role: authUser.role,
              fullName: (
                  authUser.fullName || `${authUser.firstName || ''} ${authUser.lastName || ''}`
              )
                  .replace(/\s*\(*multi-user\)*\s*/i, '')
                  .trim(),
              organisation:
                  authUser.organisation ||
                  (authUser as any).organization ||
                  (authUser as any).organizationName,
              verified: authUser.verified,
              verificationStatus: authUser.verificationStatus as AccountStatus,
              hasPendingVerification: authUser.hasPendingVerification,
              paymentCard: authUser.paymentCard,
              planTier: authUser.planTier as User['planTier'],
              isPAYG: authUser.isPAYG,
              subscriptionStatus: authUser.subscriptionStatus,
              flyerId: authUser.flyerId,
              operatorId: authUser.operatorId,
              passwordChangedAt: authUser.passwordChangedAt,
          }
        : null;

    const [allSites, setAllSites] = useState<Site[]>([]);
    const [allBookings, setAllBookings] = useState<BookingRequest[]>(mockBookingRequests);
    const [pendingVerifications, setPendingVerifications] = useState<PendingVerification[]>([]);
    const [siteApprovalNotifications, setSiteApprovalNotifications] = useState<
        SiteApprovalNotification[]
    >([]);
    const [isVerificationsLoading, setIsVerificationsLoading] = useState(true);
    const [isBookingsLoading, setIsBookingsLoading] = useState(true);
    const [isSitesLoading, setIsSitesLoading] = useState(true);

    const siteVerificationFromSite = (site: Site): PendingVerification | null => {
        if (normalizeSiteStatus(site.status) !== 'UNDER_REVIEW') return null;

        const geometrySummary =
            site.geometry.type === 'circle'
                ? site.geometry.radius
                    ? `${site.geometry.radius}m radius`
                    : 'Circle geometry'
                : site.geometry.points?.length
                  ? `Polygon with ${site.geometry.points.length} points`
                  : 'Polygon geometry';

        return {
            id: `site-${site.id}`,
            type: 'site',
            status: 'PENDING',
            userId: site.landownerId,
            userName: site.landownerName,
            siteId: site.id,
            siteName: site.name,
            siteType: site.siteType,
            siteAddress: site.address,
            sitePostcode: site.postcode,
            contactEmail: site.contactEmail,
            contactPhone: site.contactPhone,
            siteGeometry: site.geometry,
            clzGeometry: site.clzGeometry,
            siteCoordinates: geometrySummary,
            siteGeometrySize: geometrySummary,
            validityStart: site.validityStart,
            validityEnd: site.validityEnd,
            siteInformation: site.siteInformation,
            toalOnly: !site.clzEnabled,
            exclusiveUse: site.exclusiveUse,
            autoApprove: site.autoApprove,
            toalAccessFee: site.toalAccessFee,
            clzAccessFee: site.clzAccessFee,
            policyDocuments: site.policyDocuments || [],
            ownershipDocuments: site.ownershipDocuments || [],
            sitePhotos: site.sitePhotos || [],
            submittedDocuments:
                site.documentDetails?.map(doc => ({
                    fileName: doc.fileName,
                    fileKey: doc.fileKey,
                    documentType: doc.documentType,
                    downloadUrl: doc.downloadUrl,
                    uploadedAt: doc.uploadedAt,
                })) || [],
            documents: site.documents,
            createdAt: site.createdAt,
        };
    };

    // Load data from localStorage on mount
    useEffect(() => {
        const CURRENT_DATA_VERSION = 24;
        const savedVersion = localStorage.getItem('vertiAccessDataVersion');

        const savedSites = localStorage.getItem('vertiAccessSites');
        const savedVerifications = localStorage.getItem('vertiAccessVerifications');
        const savedNotifications = localStorage.getItem('vertiAccessNotifications');

        // Force reload if version mismatch
        if (savedVersion !== String(CURRENT_DATA_VERSION)) {
            setAllSites([]);
            setPendingVerifications([]);
            localStorage.setItem('vertiAccessDataVersion', String(CURRENT_DATA_VERSION));
            return;
        }

        if (savedSites) {
            try {
                setAllSites(JSON.parse(savedSites));
            } catch (e) {
                console.error('Failed to parse saved sites:', e);
            }
        } else {
            setAllSites([]);
            setPendingVerifications([]);
            localStorage.setItem('vertiAccessDataVersion', String(CURRENT_DATA_VERSION));
        }

        if (savedVerifications) {
            try {
                setPendingVerifications(JSON.parse(savedVerifications));
            } catch (e) {
                console.error('Failed to parse saved verifications:', e);
            }
        }

        if (savedNotifications) {
            try {
                setSiteApprovalNotifications(JSON.parse(savedNotifications));
            } catch (e) {
                console.error('Failed to parse saved notifications:', e);
            }
        }

        // Simulate initial fetch delay for verifications and bookings
        const timer = setTimeout(() => {
            setIsVerificationsLoading(false);
            setIsBookingsLoading(false);
            setIsSitesLoading(false);
        }, 1500);

        return () => clearTimeout(timer);
    }, []);

    useEffect(() => {
        if (!authUser || !idToken) return;

        let cancelled = false;

        const loadAuthenticatedSites = async () => {
            if (authUser.role !== 'admin' && authUser.role !== 'landowner') return;

            try {
                const apiSites = await fetchMySites(idToken);

                if (cancelled) return;

                setAllSites(currentSites => {
                    const mergedSites = new Map(currentSites.map(site => [site.id, site]));
                    apiSites.map(apiSiteToFrontendSite).forEach(site => {
                        mergedSites.set(site.id, {
                            ...site,
                            status: normalizeSiteStatus(site.status),
                        });
                    });
                    return Array.from(mergedSites.values());
                });
            } catch (error) {
                console.warn('Failed to load authenticated sites from API:', error);
            }
        };

        void loadAuthenticatedSites();

        return () => {
            cancelled = true;
        };
    }, [authUser, idToken]);

    useEffect(() => {
        let cancelled = false;

        const loadPublicSites = async () => {
            try {
                const publicSites = await fetchPublicSites();

                if (cancelled) return;

                setAllSites(currentSites => {
                    const mergedSites = new Map(currentSites.map(site => [site.id, site]));
                    publicSites.map(apiSiteToFrontendSite).forEach(site => {
                        mergedSites.set(site.id, {
                            ...site,
                            status: normalizeSiteStatus(site.status),
                        });
                    });
                    return Array.from(mergedSites.values());
                });
            } catch (error) {
                console.warn(
                    'Failed to load public sites from API, falling back to local data:',
                    error
                );
            }
        };

        void loadPublicSites();

        return () => {
            cancelled = true;
        };
    }, []);

    // Save to localStorage whenever data changes
    useEffect(() => {
        localStorage.setItem('vertiAccessSites', JSON.stringify(allSites));
    }, [allSites]);

    useEffect(() => {
        localStorage.setItem('vertiAccessVerifications', JSON.stringify(pendingVerifications));
    }, [pendingVerifications]);

    useEffect(() => {
        localStorage.setItem('vertiAccessNotifications', JSON.stringify(siteApprovalNotifications));
    }, [siteApprovalNotifications]);

    const handleLogout = () => {
        logout();
    };

    const handleUpdateUser = (updatedUser: User) => {
        if (currentUser?.id === updatedUser.id) {
            updateUser({
                fullName: updatedUser.fullName,
                organisation: updatedUser.organisation,
                flyerId: updatedUser.flyerId,
                operatorId: updatedUser.operatorId,
                paymentCard: updatedUser.paymentCard,
                planTier: updatedUser.planTier,
                isPAYG: updatedUser.isPAYG,
                subscriptionStatus: updatedUser.subscriptionStatus,
                passwordChangedAt: updatedUser.passwordChangedAt,
                // Pass verification-related fields through so dashboard state updates immediately
                hasPendingVerification: updatedUser.hasPendingVerification,
                verified: updatedUser.verified,
                verificationStatus: updatedUser.verificationStatus,
            });
        }
    };

    const handleAddSite = (site: Site) => {
        setAllSites([...allSites, site]);
    };

    const handleUpdateSite = (updatedSite: Site) => {
        setAllSites(prevSites =>
            prevSites.map(site => {
                if (site.id === updatedSite.id) {
                    const updateKeys = Object.keys(updatedSite);
                    const isStatusOnlyUpdate =
                        updateKeys.every(key => ['id', 'status', 'adminNote'].includes(key)) &&
                        updatedSite.id &&
                        updatedSite.status;

                    if (isStatusOnlyUpdate) {
                        const updated = { ...site, status: updatedSite.status };
                        const adminNote = (updatedSite as any).adminNote;

                        if (updatedSite.status === 'ACTIVE') {
                            setSiteApprovalNotifications(prev => [
                                ...prev,
                                {
                                    siteId: site.id,
                                    siteName: site.name,
                                    approved: true,
                                    timestamp: new Date().toISOString(),
                                    adminNote,
                                },
                            ]);
                        } else if (
                            normalizeSiteStatus(updatedSite.status) === 'DISABLE' ||
                            normalizeSiteStatus(updatedSite.status) === 'REJECTED'
                        ) {
                            setSiteApprovalNotifications(prev => [
                                ...prev,
                                {
                                    siteId: site.id,
                                    siteName: site.name,
                                    approved: false,
                                    timestamp: new Date().toISOString(),
                                    adminNote,
                                },
                            ]);
                        }

                        return updated;
                    }
                    return updatedSite;
                }
                return site;
            })
        );
    };

    const handleAddPendingVerification = (verification: PendingVerification) => {
        setPendingVerifications([...pendingVerifications, verification]);
    };

    const handleRemovePendingVerification = (verificationId: string) => {
        setPendingVerifications(pendingVerifications.filter(v => v.id !== verificationId));
    };

    const handleUpdateVerificationStatus = (
        verificationId: string,
        status: 'APPROVED' | 'REJECTED'
    ) => {
        const verification = pendingVerifications.find(v => v.id === verificationId);

        if (verification?.type === 'site' && verification.siteId) {
            handleUpdateSite({
                id: verification.siteId,
                status: status === 'APPROVED' ? 'ACTIVE' : 'REJECTED',
            } as Site);

            setPendingVerifications(prev => prev.filter(v => v.id !== verificationId));
            return;
        }

        setPendingVerifications(prev =>
            prev.map(v => (v.id === verificationId ? { ...v, status } : v))
        );
    };

    const combinedPendingVerifications = useMemo(() => {
        const merged = [...pendingVerifications];
        const siteVerificationIds = new Set(
            pendingVerifications
                .filter(verification => verification.type === 'site' && verification.siteId)
                .map(verification => verification.siteId as string)
        );

        allSites
            .map(siteVerificationFromSite)
            .filter((verification): verification is PendingVerification => Boolean(verification))
            .forEach(verification => {
                if (!siteVerificationIds.has(verification.siteId as string)) {
                    merged.push(verification);
                }
            });

        return merged;
    }, [allSites, pendingVerifications]);

    const handleUpdateBookingStatus = (bookingId: string, status: BookingRequest['status']) => {
        setAllBookings(prev => prev.map(b => (b.id === bookingId ? { ...b, status } : b)));
    };

    const handleClearSiteNotification = (siteId: string) => {
        setSiteApprovalNotifications(prev => prev.filter(n => n.siteId !== siteId));
    };

    const dashboardPath = currentUser?.role ? `/dashboard/${currentUser.role}` : '/';
    const publicMarketingRoutes = ['/', '/about', '/request-demo'];
    const unauthenticatedOnlyRoutes = [
        '/login',
        '/register',
        '/confirm-email',
        '/forgot-password',
        '/reset-password',
    ];

    // Create router — re-created when auth state changes
    const router = createBrowserRouter([
        ...publicMarketingRoutes.map(path => ({
            path,
            element: <LandingPage onLoginSuccess={() => {}} />,
        })),
        ...unauthenticatedOnlyRoutes.map(path => ({
            path,
            element:
                isAuthenticated && currentUser ? (
                    <Navigate to={dashboardPath} replace />
                ) : (
                    <LandingPage onLoginSuccess={() => {}} />
                ),
        })),
        {
            path: '/dashboard',
            element: (
                <ProtectedRoute allowedRoles={['landowner', 'operator', 'admin']}>
                    <Navigate to={dashboardPath} replace />
                </ProtectedRoute>
            ),
        },
        {
            path: '/dashboard/landowner',
            element: (
                <ProtectedRoute allowedRoles={['landowner']}>
                    <LandownerDashboard
                        user={currentUser!}
                        onLogout={handleLogout}
                        onUpdateUser={handleUpdateUser}
                        sites={allSites.filter(
                            s =>
                                s.landownerId === currentUser?.id ||
                                s.landownerId === 'VA-LO-PRITH882'
                        )}
                        onAddSite={handleAddSite}
                        onUpdateSite={handleUpdateSite}
                        onAddPendingVerification={handleAddPendingVerification}
                        siteApprovalNotifications={siteApprovalNotifications.filter(n => {
                            const site = allSites.find(s => s.id === n.siteId);
                            return (
                                site &&
                                (site.landownerId === currentUser?.id ||
                                    site.landownerId === 'VA-LO-PRITH882')
                            );
                        })}
                        onClearSiteNotification={handleClearSiteNotification}
                        sitesLoading={isSitesLoading}
                    />
                </ProtectedRoute>
            ),
        },
        {
            path: '/dashboard/operator',
            element: (
                <ProtectedRoute allowedRoles={['operator']}>
                    <PaymentGuard>
                        <OperatorDashboard
                            user={currentUser!}
                            onLogout={handleLogout}
                            onUpdateUser={handleUpdateUser}
                            sites={allSites}
                            isLoading={isBookingsLoading}
                        />
                    </PaymentGuard>
                </ProtectedRoute>
            ),
        },
        {
            path: '/dashboard/operator/book',
            element: (
                <ProtectedRoute allowedRoles={['operator']}>
                    <BookingPage
                        user={currentUser!}
                        sites={allSites}
                        onLogout={handleLogout}
                        onUpdateUser={handleUpdateUser}
                    />
                </ProtectedRoute>
            ),
        },
        {
            path: '/dashboard/operator/book/:siteId',
            element: (
                <ProtectedRoute allowedRoles={['operator']}>
                    <BookingPage
                        user={currentUser!}
                        sites={allSites}
                        onLogout={handleLogout}
                        onUpdateUser={handleUpdateUser}
                    />
                </ProtectedRoute>
            ),
        },
        {
            path: '/dashboard/operator/book/:siteId/step/:step',
            element: (
                <ProtectedRoute allowedRoles={['operator']}>
                    <BookingPage
                        user={currentUser!}
                        sites={allSites}
                        onLogout={handleLogout}
                        onUpdateUser={handleUpdateUser}
                    />
                </ProtectedRoute>
            ),
        },
        {
            path: '/dashboard/operator/bookings/:bookingId',
            element: (
                <ProtectedRoute allowedRoles={['operator']}>
                    <BookingDetailsPage
                        user={currentUser!}
                        bookings={allBookings}
                        onLogout={handleLogout}
                        onCancelBooking={b => {
                            handleUpdateBookingStatus(b.id, 'CANCELLED');
                            toast.success('Booking cancelled successfully.');
                        }}
                    />
                </ProtectedRoute>
            ),
        },
        {
            path: '/dashboard/admin',
            element: (
                <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard
                        user={currentUser!}
                        onLogout={handleLogout}
                        pendingVerifications={combinedPendingVerifications}
                        onRemovePendingVerification={handleRemovePendingVerification}
                        onUpdateVerificationStatus={handleUpdateVerificationStatus}
                        onUpdateSite={handleUpdateSite}
                        onUpdateUser={handleUpdateUser}
                        allSites={allSites}
                        allBookings={allBookings}
                        onUpdateBookingStatus={handleUpdateBookingStatus}
                        isLoading={isVerificationsLoading}
                    />
                </ProtectedRoute>
            ),
        },
        {
            path: '/landowner',
            element: <Navigate to="/dashboard/landowner" replace />,
        },
        {
            path: '/operator',
            element: <Navigate to="/dashboard/operator" replace />,
        },
        {
            path: '/admin',
            element: <Navigate to="/dashboard/admin" replace />,
        },
        {
            path: '*',
            element: <Navigate to={isAuthenticated && currentUser ? dashboardPath : '/'} replace />,
        },
    ]);

    if (isLoading) {
        return <LoadingScreen />;
    }

    return <RouterProvider router={router} />;
}

function App() {
    return (
        <AuthProvider>
            <AppContent />
        </AuthProvider>
    );
}

export default App;
