import { createBrowserRouter, Navigate } from 'react-router-dom';
import App, { User } from './App';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LandingPage } from './components/LandingPage';
import { LandownerDashboard } from './components/LandownerDashboard';
import { OperatorDashboard } from './components/OperatorDashboard';
import { AdminDashboard } from './components/AdminDashboard';

// Wrapper component to handle role-based routing within App
const AppWrapper = () => {
    return <App />;
};

// Create the router with all routes
export const createAppRouter = (
    currentUser: User | null,
    allSites: any[],
    allBookings: any[],
    pendingVerifications: any[],
    siteApprovalNotifications: any[],
    handleLogin: (user: User) => void,
    handleLogout: () => void,
    handleUpdateUser: (user: User) => void,
    handleAddSite: (site: any) => void,
    handleUpdateSite: (site: any) => void,
    handleAddPendingVerification: (v: any) => void,
    handleRemovePendingVerification: (id: string) => void,
    handleUpdateVerificationStatus: (id: string, status: 'APPROVED' | 'REJECTED') => void,
    handleUpdateBookingStatus: (id: string, status: any) => void,
    handleClearSiteNotification: (id: string) => void
) => {
    return createBrowserRouter([
        {
            path: '/',
            element: currentUser ? (
                <Navigate to={`/dashboard/${currentUser.role}`} replace />
            ) : (
                <LandingPage onLoginSuccess={() => {}} />
            ),
        },
        {
            path: '/dashboard/landowner',
            element: (
                <ProtectedRoute user={currentUser} allowedRoles={['landowner']}>
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
                    />
                </ProtectedRoute>
            ),
        },
        {
            path: '/dashboard/operator',
            element: (
                <ProtectedRoute user={currentUser} allowedRoles={['operator']}>
                    <OperatorDashboard
                        user={currentUser!}
                        onLogout={handleLogout}
                        onUpdateUser={handleUpdateUser}
                        sites={allSites}
                    />
                </ProtectedRoute>
            ),
        },
        {
            path: '/dashboard/admin',
            element: (
                <ProtectedRoute user={currentUser} allowedRoles={['admin']}>
                    <AdminDashboard
                        user={currentUser!}
                        onLogout={handleLogout}
                        pendingVerifications={pendingVerifications}
                        onRemovePendingVerification={handleRemovePendingVerification}
                        onUpdateVerificationStatus={handleUpdateVerificationStatus}
                        onUpdateSite={handleUpdateSite}
                        onUpdateUser={handleUpdateUser}
                        allSites={allSites}
                        allBookings={allBookings}
                        onUpdateBookingStatus={handleUpdateBookingStatus}
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
            element: <Navigate to="/" replace />,
        },
    ]);
};
