'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ReviewHeader } from './components/review-header';
import { LandownerContextColumn } from './components/landowner-context-column';
import { EvidenceColumn } from './components/evidence-column';
import { RejectionModal } from './components/rejection-modal';

// Dummy data for landowner review
const mockLandowner = {
    id: '1',
    name: 'Jonathan Miller',
    email: 'jonathan@estatemanagement.co.uk',
    phone: '+44 7700 900000',
    company: 'Miller & Sons Estates',
    documentType: 'Business License',
    status: 'pending'
};

export default function LandownerReviewPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false);

    const handleApprove = () => {
        toast.success('Landowner Verified', {
            description: `${mockLandowner.name} now has full access to the platform.`
        });
        router.push('/dashboard/admin/verifications/landowner');
    };

    const handleRejectConfirm = (reasons: string[], customNote: string) => {
        toast.error('Verification Rejected', {
            description: 'Feedback has been sent to the landowner.'
        });
        setIsRejectionModalOpen(false);
        router.push('/dashboard/admin/verifications/landowner');
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <ReviewHeader name={mockLandowner.name} />

            <div className="flex-1 flex overflow-hidden">
                <LandownerContextColumn landowner={mockLandowner} />
                <EvidenceColumn 
                    landowner={mockLandowner} 
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
