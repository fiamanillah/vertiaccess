'use client';

import * as React from 'react';
import { useParams, useRouter } from 'next/navigation';
import { mockSites } from '../data/mock-sites';
import { SiteDetailsContext } from '../components/site-details-context';
import { BookingEngineCard } from '../components/booking-engine-card';
import { Button } from '@workspace/ui/components/button';
import { ChevronLeft } from 'lucide-react';

export default function SiteDetailsPage() {
    const params = useParams();
    const router = useRouter();
    const siteId = params.id as string;

    const site = React.useMemo(() => {
        return mockSites.find((s) => s.id === siteId);
    }, [siteId]);

    if (!site) {
        return (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
                <h2 className="text-2xl font-bold">Site not found</h2>
                <Button onClick={() => router.push('/dashboard/operator/search')}>
                    Back to Search
                </Button>
            </div>
        );
    }

    return (
        <div className="flex flex-col space-y-6 max-w-7xl mx-auto w-full pb-20">
            {/* Breadcrumb/Back link */}
            <div className="flex items-center gap-2">
                <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-muted-foreground hover:text-foreground"
                    onClick={() => router.push('/dashboard/operator/search')}
                >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Back to Sites
                </Button>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                {/* Left Side: Context (Scrolls normally) */}
                <div className="lg:col-span-8">
                    <SiteDetailsContext site={site} />
                </div>

                {/* Right Side: Booking Engine (Sticky) */}
                <div className="lg:col-span-4 lg:sticky lg:top-24">
                    <BookingEngineCard site={site} />
                </div>
            </div>
        </div>
    );
}
