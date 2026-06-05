'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

import { adminService } from '@/services/admin.service';
import { ReviewHeader } from './components/review-header';
import { SiteContextColumn } from './components/site-context-column';
import { RejectionModal } from './components/rejection-modal';
import dynamic from 'next/dynamic';

const InfrastructureDetailMap = dynamic(
    () => import('@/app/dashboard/assetowner/infrastructure/components/infrastructure-detail-map').then(m => m.InfrastructureDetailMap),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full bg-muted/30 animate-pulse" />
        ),
    }
);

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
        <div className="flex flex-col h-[calc(100vh-60px)] md:h-screen w-full bg-background overflow-hidden">
            <ReviewHeader siteName={site.name} createdAt={site.createdAt} />

            {/* Style overrides for Leaflet nesting - square corners, no border */}
            <style>{`
                .review-map-container .leaflet-container {
                    height: 100% !important;
                    min-height: 100% !important;
                    border-radius: 0px !important;
                }
                .review-map-container > div {
                    height: 100% !important;
                    min-height: 100% !important;
                    border: none !important;
                    border-radius: 0px !important;
                    box-shadow: none !important;
                }
            `}</style>

            {/* Main Content — 60/40 split */}
            <div className="flex flex-col lg:flex-row flex-1 overflow-hidden min-h-0 w-full">
                {/* Left Side — Map (60%) */}
                <div className="w-full lg:w-[60%] h-[350px] lg:h-full relative review-map-container shrink-0 bg-muted/20">
                    <InfrastructureDetailMap
                        sites={[site]}
                        activeSiteId={site.id}
                        onSiteSelect={() => {}}
                        className="h-full"
                    />
                </div>

                {/* Right Side — Info Column (40%) */}
                <div className="w-full lg:w-[40%] h-full flex flex-col border-t lg:border-t-0 lg:border-l border-border/40 bg-background min-h-0 shrink-0 lg:shrink overflow-hidden">
                    <SiteContextColumn 
                        site={site} 
                        onApprove={handleApprove} 
                        onReject={() => setIsRejectionModalOpen(true)} 
                    />
                </div>
            </div>

            <RejectionModal 
                isOpen={isRejectionModalOpen} 
                onClose={() => setIsRejectionModalOpen(false)} 
                onConfirm={handleRejectConfirm} 
            />
        </div>
    );
}
