'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { ReviewHeader } from './components/review-header';
import { SiteContextColumn } from './components/site-context-column';
import { EvidenceColumn } from './components/evidence-column';
import { RejectionModal } from './components/rejection-modal';

// Dummy data for the review desk
const mockSite = {
    id: '1',
    name: 'Canary Wharf North Pad',
    category: 'Commercial Rooftop',
    siteType: 'toal',
    address: '1 Canada Square, London',
    postcode: 'E14 5AB',
    latitude: 51.5054,
    longitude: -0.0185,
    toalRadius: 50,
    toalGeometryMode: 'circle',
    allowEmergencyLanding: true,
    emergencyRadius: 100,
    emergencyGeometryMode: 'circle',
    toalFee: 125.0,
    emergencyFee: 45.0,
    isPermanentActivation: true,
    activationStartTime: '08:00',
    activationEndTime: '20:00',
    bookingApprovalModel: 'auto',
    description: 'Premier landing site atop the iconic One Canada Square. Optimized for heavy-lift drones and VTOL operations with clear flight paths and zero ground interference.',
    photoUrls: [
        'https://images.unsplash.com/photo-1541888941255-081d746fedff?q=80&w=2070&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?q=80&w=2070&auto=format&fit=crop'
    ],
    landowner: {
        name: 'Alex Rivera',
        email: 'alex@canarywharf.com',
        phone: '+44 20 7418 2000'
    },
    policyDocuments: [
        { name: 'Site Rules & Safety.pdf', size: '1.2 MB' }
    ],
    ownershipDocuments: [
        { name: 'Title_Deed_Canary_Wharf.pdf', size: '2.4 MB' }
    ]
};

export default function SiteReviewPage({ params }: { params: { id: string } }) {
    const router = useRouter();
    const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false);

    const handleApprove = () => {
        toast.success('Site Approved', {
            description: `${mockSite.name} is now live on the platform.`
        });
        router.push('/dashboard/admin/verifications/sites');
    };

    const handleRejectConfirm = (reasons: string[], customNote: string) => {
        toast.error('Application Rejected', {
            description: 'Feedback has been sent to the landowner.'
        });
        setIsRejectionModalOpen(false);
        router.push('/dashboard/admin/verifications/sites');
    };

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <ReviewHeader siteName={mockSite.name} />

            <div className="flex-1 flex overflow-hidden">
                <SiteContextColumn site={mockSite} />
                <EvidenceColumn 
                    site={mockSite} 
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
