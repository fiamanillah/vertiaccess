'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ReviewHeader } from './components/review-header';
import { LandownerContextColumn } from './components/landowner-context-column';
import { EvidenceColumn } from './components/evidence-column';
import { RejectionModal } from './components/rejection-modal';

import { adminService, type VerificationRequest } from '@/services/admin.service';
import { Loader2 } from 'lucide-react';

export default function LandownerReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = React.use(params);
    const router = useRouter();
    const [verification, setVerification] = React.useState<VerificationRequest | null>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false);
    const [isProcessing, setIsProcessing] = React.useState(false);
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
                router.push('/dashboard/admin/verifications/landowner');
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
        setIsProcessing(true);
        try {
            const response = await adminService.updateVerification(verification.id, 'APPROVED');
            if (response.success) {
                toast.success('Landowner Verified', {
                    description: `${verification.userName} now has full access to the platform.`
                });
                router.push('/dashboard/admin/verifications/landowner');
            }
        } catch (error) {
            console.error('Approval failed:', error);
            toast.error('Failed to approve verification');
        } finally {
            setIsProcessing(false);
        }
    };

    const handleRejectConfirm = async (reasons: string[], customNote: string) => {
        if (!verification) return;
        setIsProcessing(true);
        try {
            const adminNote = `${reasons.join(', ')}. ${customNote}`.trim();
            const response = await adminService.updateVerification(verification.id, 'REJECTED', adminNote);
            if (response.success) {
                toast.error('Verification Rejected', {
                    description: 'Feedback has been sent to the landowner.'
                });
                setIsRejectionModalOpen(false);
                router.push('/dashboard/admin/verifications/landowner');
            }
        } catch (error) {
            console.error('Rejection failed:', error);
            toast.error('Failed to reject verification');
        } finally {
            setIsProcessing(false);
        }
    };

    if (isLoading) {
        return (
            <div className="h-screen flex flex-col items-center justify-center gap-4 bg-background">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
                <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Loading dossier...</p>
            </div>
        );
    }

    if (!verification) return null;

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <ReviewHeader name={verification.userName} />

            <div className="flex-1 flex overflow-hidden relative">
                {isProcessing && (
                    <div className="absolute inset-0 z-50 bg-background/40 backdrop-blur-[2px] flex items-center justify-center">
                        <div className="bg-background border p-4 rounded-xl shadow-xl flex items-center gap-3">
                            <Loader2 className="h-5 w-5 text-primary animate-spin" />
                            <span className="text-sm font-bold uppercase tracking-tight">Processing decision...</span>
                        </div>
                    </div>
                )}
                
                <LandownerContextColumn verification={verification} />
                <EvidenceColumn 
                    verification={verification} 
                    onApprove={handleApprove} 
                    onReject={() => setIsRejectionModalOpen(true)} 
                />
            </div>

            <RejectionModal 
                isOpen={isRejectionModalOpen} 
                onClose={() => setIsRejectionModalOpen(false)} 
                onConfirm={handleRejectConfirm} 
            />
        </div>
    );
}
