'use client';

import * as React from 'react';
import {
    Tabs,
    TabsContent,
    TabsList,
    TabsTrigger,
} from '@workspace/ui/components/tabs';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@workspace/ui/components/select';
import { Badge } from '@workspace/ui/components/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@workspace/ui/components/card';
import { CalendarClock, CheckCircle2, Clock, Wallet, Filter, AlertCircle } from 'lucide-react';
import { BookingList } from './components/booking-list';
import { BookingReviewDrawer } from './components/booking-review-drawer';
import { RejectionModal } from './components/rejection-modal';
import { Booking } from './types';
import { toast } from 'sonner';

const mockBookings: Booking[] = [
    {
        id: '1',
        vtId: 'vt-bkg-123',
        bookingReference: 'VA-BKG-X87K2P19',
        operatorId: 'op-1',
        siteId: 'site-1',
        siteName: 'Canary Wharf Helipad',
        siteAddress: 'South Quay, London',
        landownerId: 'lo-1',
        siteType: 'toal',
        siteCategory: 'Urban Operations',
        sitePhotoUrl: null,
        startTime: new Date(Date.now() + 86400000).toISOString(),
        endTime: new Date(Date.now() + 90000000).toISOString(),
        operationReference: 'OPS-2024-001',
        droneModel: 'DJI Matrice 350 RTK',
        missionIntent: 'Critical structural inspection of helipad infrastructure and surrounding area.',
        useCategory: 'planned_toal',
        flyerId: 'GBR-RP-123456',
        isPayg: true,
        platformFee: 5.0,
        toalCost: 125.0,
        cancellationFee: null,
        paymentMethodLast4: '4242',
        paymentMethodBrand: 'Visa',
        status: 'PENDING',
        paymentStatus: 'pending',
        createdAt: new Date().toISOString(),
        respondedAt: null,
        cancelledAt: null,
        operatorEmail: 'ops@skyline.co.uk',
        operatorName: 'David Chen',
        operatorOrganisation: 'Skyline Inspections Ltd',
        operatorFlyerId: 'GBR-RP-123456',
        isAutoApproved: false,
        certificateVtId: null,
        certificateId: null,
    },
    {
        id: '2',
        vtId: 'vt-bkg-124',
        bookingReference: 'VA-BKG-J92L5Q08',
        operatorId: 'op-2',
        siteId: 'site-1',
        siteName: 'Canary Wharf Helipad',
        siteAddress: 'South Quay, London',
        landownerId: 'lo-1',
        siteType: 'toal',
        siteCategory: 'Urban Operations',
        sitePhotoUrl: null,
        startTime: new Date(Date.now() + 172800000).toISOString(),
        endTime: new Date(Date.now() + 176400000).toISOString(),
        operationReference: 'OPS-2024-002',
        droneModel: 'Autel EVO II Pro',
        missionIntent: 'Aerial cinematography for real estate promotional video.',
        useCategory: 'planned_toal',
        flyerId: 'GBR-RP-987654',
        isPayg: true,
        platformFee: 5.0,
        toalCost: 125.0,
        cancellationFee: null,
        paymentMethodLast4: '5555',
        paymentMethodBrand: 'MasterCard',
        status: 'APPROVED',
        paymentStatus: 'pending',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        respondedAt: new Date().toISOString(),
        cancelledAt: null,
        operatorEmail: 'media@visuals.com',
        operatorName: 'Sarah Jenkins',
        operatorOrganisation: 'Jenkins Media',
        operatorFlyerId: 'GBR-RP-987654',
        isAutoApproved: true,
        certificateVtId: 'vt-cert-999',
        certificateId: 'cert-1',
    },
    {
        id: '3',
        vtId: 'vt-bkg-125',
        bookingReference: 'VA-BKG-K33P1A22',
        operatorId: 'op-3',
        siteId: 'site-2',
        siteName: 'Manchester City Vertiport',
        siteAddress: 'Deansgate, Manchester',
        landownerId: 'lo-1',
        siteType: 'toal',
        siteCategory: 'Urban Operations',
        sitePhotoUrl: null,
        startTime: new Date(Date.now() - 86400000).toISOString(),
        endTime: new Date(Date.now() - 82800000).toISOString(),
        operationReference: 'OPS-2024-003',
        droneModel: 'DJI Mavic 3 Enterprise',
        missionIntent: 'Emergency technical survey following power outage reported in the area.',
        useCategory: 'emergency_recovery',
        flyerId: 'GBR-RP-112233',
        isPayg: false,
        platformFee: 0,
        toalCost: 85.0,
        cancellationFee: null,
        paymentMethodLast4: '1111',
        paymentMethodBrand: 'Amex',
        status: 'APPROVED',
        paymentStatus: 'paid',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        respondedAt: new Date(Date.now() - 170000000).toISOString(),
        cancelledAt: null,
        operatorEmail: 'grid@national.com',
        operatorName: 'Mark Thompson',
        operatorOrganisation: 'National Grid Drone Team',
        operatorFlyerId: 'GBR-RP-112233',
        isAutoApproved: true,
        certificateVtId: 'vt-cert-888',
        certificateId: 'cert-2',
    },
    {
        id: '4',
        vtId: 'vt-bkg-126',
        bookingReference: 'VA-BKG-E44R9B11',
        operatorId: 'op-4',
        siteId: 'site-2',
        siteName: 'Manchester City Vertiport',
        siteAddress: 'Deansgate, Manchester',
        landownerId: 'lo-1',
        siteType: 'emergency',
        siteCategory: 'Urban Operations',
        sitePhotoUrl: null,
        startTime: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
        endTime: new Date(Date.now() - 1800000).toISOString(),  // 30 mins ago
        operationReference: 'OPS-2024-004',
        droneModel: 'DJI Inspire 3',
        missionIntent: 'Asset inspection during storm event.',
        useCategory: 'emergency_recovery',
        flyerId: 'GBR-RP-778899',
        isPayg: true,
        platformFee: 5.0,
        toalCost: 150.0,
        cancellationFee: null,
        paymentMethodLast4: '9999',
        paymentMethodBrand: 'Visa',
        status: 'APPROVED',
        paymentStatus: 'pending',
        createdAt: new Date(Date.now() - 7200000).toISOString(),
        respondedAt: new Date(Date.now() - 7000000).toISOString(),
        cancelledAt: null,
        operatorEmail: 'emergency@skyline.com',
        operatorName: 'Alice Green',
        operatorOrganisation: 'Skyline Inspections Ltd',
        operatorFlyerId: 'GBR-RP-778899',
        isAutoApproved: false,
        certificateVtId: 'vt-cert-777',
        certificateId: 'cert-4',
    }
];

export default function LandownerBookingsPage() {
    const [isLoading, setIsLoading] = React.useState(true);
    const [selectedSiteId, setSelectedSiteId] = React.useState<string>('all');
    const [selectedBooking, setSelectedBooking] = React.useState<Booking | null>(null);
    const [isDrawerOpen, setIsDrawerOpen] = React.useState(false);
    const [isRejectionModalOpen, setIsRejectionModalOpen] = React.useState(false);
    const [isActionSubmitting, setIsActionSubmitting] = React.useState(false);

    React.useEffect(() => {
        const timer = setTimeout(() => setIsLoading(false), 1200);
        return () => clearTimeout(timer);
    }, []);

    const filteredBookings = React.useMemo(() => {
        let bookings = selectedSiteId === 'all' ? mockBookings : mockBookings.filter(b => b.siteId === selectedSiteId);
        // Sort by startTime (closest first)
        return [...bookings].sort((a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime());
    }, [selectedSiteId]);

    const pendingBookings = filteredBookings.filter(b => b.status === 'PENDING');
    const upcomingBookings = filteredBookings.filter(b => b.status === 'APPROVED' && new Date(b.startTime) > new Date());
    const historyBookings = filteredBookings.filter(b =>
        b.status === 'REJECTED' ||
        b.status === 'CANCELLED' ||
        (b.status === 'APPROVED' && new Date(b.startTime) <= new Date())
    );

    const handleReview = (booking: Booking) => {
        setSelectedBooking(booking);
        setIsDrawerOpen(true);
    };

    const handleApprove = (id: string) => {
        setIsActionSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            toast.success(`Booking ${id} approved successfully`);
            setIsActionSubmitting(false);
            setIsDrawerOpen(false);
            setSelectedBooking(null);
        }, 1000);
    };

    const handleRejectClick = () => {
        setIsRejectionModalOpen(true);
    };

    const handleConfirmReject = (reason: string) => {
        setIsActionSubmitting(true);
        // Simulate API call
        setTimeout(() => {
            toast.info(`Booking ${selectedBooking?.id} rejected. Reason: ${reason}`);
            setIsActionSubmitting(false);
            setIsRejectionModalOpen(false);
            setIsDrawerOpen(false);
            setSelectedBooking(null);
        }, 1000);
    };

    return (
        <div className="flex flex-1 flex-col gap-6 p-4 md:p-8 max-w-7xl mx-auto">
            {/* Header Area */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold tracking-tight">Access Control Center</h1>
                    <p className="text-muted-foreground text-xs uppercase font-bold tracking-widest mt-1">Inbox & Ledger Management</p>
                </div>

                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 bg-muted/40 p-1.5 px-3 rounded-lg border border-border/50">
                        <Filter className="h-3.5 w-3.5 text-muted-foreground" />
                        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mr-1">Site:</span>
                        <Select value={selectedSiteId} onValueChange={setSelectedSiteId}>
                            <SelectTrigger className="h-7 w-[180px] bg-transparent border-none focus:ring-0 text-xs font-semibold">
                                <SelectValue placeholder="All Sites" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Sites</SelectItem>
                                <SelectItem value="site-1">Canary Wharf Helipad</SelectItem>
                                <SelectItem value="site-2">Manchester City Vertiport</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                </div>
            </div>

            {/* Quick Stats */}
            <div className="grid gap-4 md:grid-cols-3">
                <Card className="bg-amber-50/30 border-amber-100 shadow-sm overflow-hidden relative group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-200/20 rounded-full blur-2xl -mr-8 -mt-8" />
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-amber-700/70 flex items-center gap-1.5">
                            <AlertCircle className="h-3 w-3" /> Action Required
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold tracking-tight text-amber-900">{pendingBookings.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-[10px] text-amber-700/70 font-medium">Pending requests awaiting review</div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm overflow-hidden relative group">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
                            <CalendarClock className="h-3 w-3" /> Upcoming Flights
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold tracking-tight text-foreground/80">{upcomingBookings.length}</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                            <CheckCircle2 className="h-3 w-3 text-emerald-500" />
                            Approved missions on your land
                        </div>
                    </CardContent>
                </Card>

                <Card className="shadow-sm overflow-hidden relative group">
                    <CardHeader className="pb-2">
                        <CardDescription className="text-[10px] uppercase tracking-widest font-bold text-muted-foreground flex items-center gap-1.5">
                            <Wallet className="h-3 w-3" /> Est. Revenue
                        </CardDescription>
                        <CardTitle className="text-3xl font-bold tracking-tight text-foreground/80">£335.00</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="text-[10px] text-muted-foreground font-medium flex items-center gap-1">
                            <Badge className="bg-emerald-100 text-emerald-700 border-none text-[8px] h-4 px-1.5 font-bold">+8%</Badge>
                            Gross from selected sites
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Workflow Tabs */}
            <Tabs defaultValue="pending" className="w-full">
                <TabsList className="bg-muted/30 p-1 mb-6 border border-border/40 inline-flex w-auto">
                    <TabsTrigger value="pending" className="relative  px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        Needs Review
                        {pendingBookings.length > 0 && (
                            <Badge className="ml-2 bg-red-500 hover:bg-red-600 text-white border-none h-5 min-w-5 p-0 flex items-center justify-center rounded-full text-[10px] font-bold animate-pulse">
                                {pendingBookings.length}
                            </Badge>
                        )}
                    </TabsTrigger>
                    <TabsTrigger value="upcoming" className=" px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        Upcoming Access
                    </TabsTrigger>
                    <TabsTrigger value="history" className=" px-6 font-bold text-xs uppercase tracking-wider data-[state=active]:bg-background data-[state=active]:shadow-sm">
                        History & Earnings
                    </TabsTrigger>
                </TabsList>

                <TabsContent value="pending" className="">

                    <BookingList
                        data={pendingBookings}
                        isLoading={isLoading}
                        onReview={handleReview}
                        showReviewButton
                    />

                </TabsContent>

                <TabsContent value="upcoming" className="">

                    <BookingList
                        data={upcomingBookings}
                        isLoading={isLoading}
                        onReview={handleReview}
                    />
                </TabsContent>

                <TabsContent value="history" className="mt-0">

                    <BookingList
                        data={historyBookings}
                        isLoading={isLoading}
                        onReview={handleReview}
                    />
                </TabsContent>
            </Tabs>

            {/* Slide-over Drawer */}
            <BookingReviewDrawer
                booking={selectedBooking}
                isOpen={isDrawerOpen}
                onClose={() => setIsDrawerOpen(false)}
                onApprove={handleApprove}
                onReject={handleRejectClick}
            />

            {/* Rejection Reason Modal */}
            <RejectionModal
                isOpen={isRejectionModalOpen}
                onClose={() => setIsRejectionModalOpen(false)}
                onConfirm={handleConfirmReject}
                isSubmitting={isActionSubmitting}
            />
        </div>
    );
}
