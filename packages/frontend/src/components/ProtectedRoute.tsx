import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, type AuthUser } from '../context/AuthContext';
import type { UserRole } from '../App';
import { LoadingScreen } from './LoadingScreen';

interface ProtectedRouteProps {
    children: React.ReactNode;
    allowedRoles: UserRole[];
    // Legacy prop support — ignored if AuthContext is available
    user?: any;
}

export function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
    const { user, isAuthenticated, isLoading } = useAuth();
    const location = useLocation();

    if (isLoading) {
        return <LoadingScreen />;
    }

    if (!isAuthenticated || !user) {
        return <Navigate to="/login" state={{ from: location }} replace />;
    }

    if (!allowedRoles.includes(user.role)) {
        return <Navigate to="/dashboard" replace />;
    }

    return <>{children}</>;
}
