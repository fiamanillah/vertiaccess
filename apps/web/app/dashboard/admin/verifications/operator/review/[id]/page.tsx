'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ReviewHeader } from './components/review-header';
import { OperatorContextColumn } from './components/operator-context-column';
import { EvidenceColumn } from './components/evidence-column';
import { RejectionModal } from './components/rejection-modal';

import { adminService, type VerificationRequest } from '@/services/admin.service';
import { Loader2 } from 'lucide-react';

export default function OperatorReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const [verification, setVerification] = React.useState<VerificationRequest | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isActionLoading, setIsActionLoading] = React.useState(false);
    const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false);
    const fetchedIdRef = React.useRef<string | null>(null);

    const fetchVerification = React.useCallback(async () => {
        // Prevent double fetching the same ID
        if (fetchedIdRef.current === id) return;
        
        setIsLoading(true);
        try {
            const response = await adminService.getVerificationById(id);
            if (response.success && response.data) {
                setVerification(response.data);
                fetchedIdRef.current = id;
            } else {
                toast.error('Verification request not found');
                router.push('/dashboard/admin/verifications/operator');
            }
        } catch (error) {
            console.error('Failed to fetch verification:', error);
            toast.error('Failed to load verification details');
        } finally {
            setIsLoading(false);
        }
    }, [id, router]);

    React.useEffect(() => {
        fetchVerification();
    }, [fetchVerification]);

    const handleApprove = async () => {
        if (!verification) return;
        setIsActionLoading(true);
        try {
            const response = await adminService.updateVerification(verification.id, 'APPROVED');
            if (response.success) {
                toast.success('Operator Verified', {
                    description: `${verification.userName} is now cleared for flight operations.`
                });
                router.push('/dashboard/admin/verifications/operator');
            }
        } catch (error) {
            toast.error('Failed to approve operator');
        } finally {
            setIsActionLoading(false);
        }
    };

    const handleRejectConfirm = async (reasons: string[], customNote: string) => {
        if (!verification) return;
        setIsActionLoading(true);
        try {
            const adminNote = customNote || reasons.join(', ');
            const response = await adminService.updateVerification(verification.id, 'REJECTED', adminNote);
            if (response.success) {
                toast.error('Verification Rejected', {
                    description: 'Feedback has been sent to the operator.'
                });
                setIsRejectionModalOpen(false);
                router.push('/dashboard/admin/verifications/operator');
            }
        } catch (error) {
            toast.error('Failed to reject operator');
        } finally {
            setIsActionLoading(false);
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
            </div>
        );
    }

    if (!verification) return null;

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <ReviewHeader name={verification.userName} />

            <div className="flex-1 flex overflow-hidden">
                <OperatorContextColumn verification={verification} />
                <EvidenceColumn 
                    verification={verification} 
                    onApprove={handleApprove} 
                    onReject={() => setIsRejectionModalOpen(true)} 
                    isLoading={isActionLoading}
                />
            </div>

            <RejectionModal 
                isOpen={isRejectionModalOpen} 
                onClose={() => setIsRejectionModalOpen(false)} 
                onConfirm={handleRejectConfirm} 
                isLoading={isActionLoading}
            />
        </div>
    );
}
