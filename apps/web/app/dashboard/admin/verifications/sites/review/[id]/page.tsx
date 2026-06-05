'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { adminService } from '@/services/admin.service';
import { ReviewHeader } from './components/review-header';
import { SiteContextColumn } from './components/site-context-column';
import { EvidenceColumn } from './components/evidence-column';
import { RejectionModal } from './components/rejection-modal';

export default function SiteReviewPage({ params }: { params: Promise<{ id: string }> }) {
    const router = useRouter();
    const unwrappedParams = React.use(params);
    const id = unwrappedParams.id;
    const [site, setSite] = React.useState<any>(null);
    const [isLoading, setIsLoading] = React.useState(true);
    const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false);

    React.useEffect(() => {
        async function loadSiteDetails() {
            try {
                setIsLoading(true);
                const res = await adminService.getVerificationById(id);
                if (res.success && res.data) {
                    setSite((res.data as any).siteDetails);
                } else {
                    toast.error('Site details not found');
                }
            } catch (err: any) {
                toast.error('Failed to load site review details', {
                    description: err.message || 'An error occurred while fetching data.'
                });
            } finally {
                setIsLoading(false);
            }
        }
        loadSiteDetails();
    }, [id]);

    const handleApprove = async () => {
        if (!site) return;
        try {
            const res = await adminService.updateVerification(id, 'APPROVED');
            if (res.success) {
                toast.success('Site Approved', {
                    description: `${site.name} is now live on the platform.`
                });
                router.push('/dashboard/admin/verifications/sites');
            }
        } catch (err: any) {
            toast.error('Failed to approve site', {
                description: err.message || 'An error occurred.'
            });
        }
    };

    const handleRejectConfirm = async (reasons: string[], customNote: string) => {
        if (!site) return;
        const adminNote = customNote || reasons.join(', ');
        try {
            const res = await adminService.updateVerification(id, 'REJECTED', adminNote);
            if (res.success) {
                toast.error('Application Rejected', {
                    description: 'Feedback has been sent to the asset owner.'
                });
                setIsRejectionModalOpen(false);
                router.push('/dashboard/admin/verifications/sites');
            }
        } catch (err: any) {
            toast.error('Failed to reject site', {
                description: err.message || 'An error occurred.'
            });
        }
    };

    if (isLoading) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="flex flex-col items-center gap-4">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                    <p className="text-sm text-muted-foreground animate-pulse font-medium">Loading verification dossier...</p>
                </div>
            </div>
        );
    }

    if (!site) {
        return (
            <div className="flex h-screen items-center justify-center bg-background">
                <div className="text-center">
                    <h3 className="text-lg font-bold">Site Not Found</h3>
                    <p className="text-sm text-muted-foreground">The site verification record could not be loaded.</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-screen overflow-hidden bg-background">
            <ReviewHeader siteName={site.name} createdAt={site.createdAt} />

            <div className="flex-1 flex overflow-hidden">
                <SiteContextColumn site={site} />
                <EvidenceColumn 
                    site={site} 
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
