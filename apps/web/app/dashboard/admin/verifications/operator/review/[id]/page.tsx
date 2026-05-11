'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ReviewHeader } from './components/review-header';
import { OperatorContextColumn } from './components/operator-context-column';
import { EvidenceColumn } from './components/evidence-column';
import { RejectionModal } from './components/rejection-modal';

// Dummy data for operator review
const mockOperator = {
    id: '1',
    name: 'Capt. James Hook',
    email: 'j.hook@skypirates.com',
    licenseId: 'UK-CAA-99231',
    operatorType: 'Commercial',
    status: 'pending'
};

export default function OperatorReviewPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false);

    const handleApprove = () => {
        toast.success('Operator Verified', {
            description: `${mockOperator.name} is now cleared for flight operations.`
        });
        router.push('/dashboard/admin/verifications/operator');
    };

    const handleRejectConfirm = (reasons: string[], customNote: string) => {
        toast.error('Verification Rejected', {
            description: 'Feedback has been sent to the operator.'
        });
        setIsRejectionModalOpen(false);
        router.push('/dashboard/admin/verifications/operator');
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <ReviewHeader name={mockOperator.name} />

            <div className="flex-1 flex overflow-hidden">
                <OperatorContextColumn operator={mockOperator} />
                <EvidenceColumn 
                    operator={mockOperator} 
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
