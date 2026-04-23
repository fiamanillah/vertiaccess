import React from 'react';
import { useAuth } from '../context/AuthContext';

interface PaymentGuardProps {
    children: React.ReactNode;
}

export function PaymentGuard({ children }: PaymentGuardProps) {
    useAuth();
    return <>{children}</>;
}
