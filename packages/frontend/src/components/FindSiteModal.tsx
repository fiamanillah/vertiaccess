import { useEffect, useState, useCallback } from 'react';
import type { Site, BookingRequest, CLZSelection, PaymentCard } from '../types';
import {
    X,
    MapPin,
    Bell,
    Search,
    Shield,
    CheckCircle2,
    Plane,
    ChevronRight,
    CheckCircle,
    Layers,
    Map as MapIcon,
    ChevronLeft,
    Loader2,
} from 'lucide-react';
import { SitesDiscoveryMap } from './SitesDiscoveryMap';
import { motion, AnimatePresence } from 'motion/react';
import { generateGeoJSON, downloadGeoJSON } from '../utils/geojson';
import { normalizeSiteStatus } from '../lib/site-status';
import { fetchPublicPlans, type BillingPlan } from '../lib/billing';
import { toast } from 'sonner';
import { Step1BookingDetails } from './FindSiteModal/Step1BookingDetails';
import { Step2PolicyEvidence } from './FindSiteModal/Step2PolicyEvidence';
import { Step3ReviewSubmit } from './FindSiteModal/Step3ReviewSubmit';
import { SiteDetailsPanel } from './FindSiteModal/SiteDetailsPanel';
import {
    apiCreateBooking,
    apiFetchSiteBookings,
    apiCheckSubscriptionStatus,
    apiCreateBookingPaymentIntent,
    apiBookingToFrontend,
    type SubscriptionStatus,
} from '../lib/bookings';
import { useAuth } from '../context/AuthContext';

interface FindSiteModalProps {
    operatorId: string;
    operatorEmail: string;
    operatorOrganisation?: string;
    flyerId?: string;
    isPAYG?: boolean;
    hasPaymentCard?: boolean;
    isPaymentCardLoading?: boolean;
    paymentCard?: PaymentCard | null;
    onRequestPaymentSetup?: () => void;
    onClose: () => void;
    onBookSite: (booking: BookingRequest) => void;
    onSelectCLZ: (selection: CLZSelection) => void;
    sites: Site[];
}

export function FindSiteModal({
    operatorId,
    operatorEmail,
    operatorOrganisation,
    flyerId,
    isPaymentCardLoading = false,
    paymentCard,
    onRequestPaymentSetup,
    onClose,
    onBookSite,
    onSelectCLZ,
    sites,
}: FindSiteModalProps) {
    const { idToken } = useAuth();

    // ── Discovery state ─────────────────────────────────────────────────────
    const [view, setView] = useState<'list' | 'map' | 'details'>('list');
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const [filterAutoApprove, setFilterAutoApprove] = useState(false);
    const [filterCLZ, setFilterCLZ] = useState(false);
    const [activeWorkflow, setActiveWorkflow] = useState<'toal' | 'clz' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');

    // ── Step state ───────────────────────────────────────────────────────────
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [policyAcknowledged, setPolicyAcknowledged] = useState(false);
    const [conflictAcknowledged, setConflictAcknowledged] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string }[]>([]);

    // ── LIFTED form state (fixes Step3 mock data bug) ────────────────────────
    const [startDate, setStartDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endDate, setEndDate] = useState('');
    const [endTime, setEndTime] = useState('');
    const [operationReference, setOperationReference] = useState('');
    const [droneModel, setDroneModel] = useState('');
    const [missionIntent, setMissionIntent] = useState('');

    // ── Subscription / billing state ─────────────────────────────────────────
    const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null);
    const [isCheckingSub, setIsCheckingSub] = useState(false);
    const [isLoadingBookings, setIsLoadingBookings] = useState(false);
    const [billingMode, setBillingMode] = useState<'payg' | 'subscription'>('subscription');
    const [availablePlans, setAvailablePlans] = useState<BillingPlan[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [siteBookings, setSiteBookings] = useState<BookingRequest[]>([]);

    // ── PAYG payment state ───────────────────────────────────────────────────
    const [paygClientSecret, setPaygClientSecret] = useState<string | null>(null);
    const [paygPaymentIntentId, setPaygPaymentIntentId] = useState<string | null>(null);
    const [isCreatingIntent, setIsCreatingIntent] = useState(false);

    // ── Submission state ─────────────────────────────────────────────────────
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [paymentCompleted, setPaymentCompleted] = useState(false);
    const [calendarAnchor, setCalendarAnchor] = useState<Date | null>(null);

    // ── Derived ───────────────────────────────────────────────────────────────
    const subscriptionPlans = availablePlans.filter(p => p.billingType === 'subscription');
    const paygPlans = availablePlans.filter(p => p.billingType === 'payg');
    const selectedSubscriptionPlan = subscriptionPlans.find(p => p.id === selectedPlanId);
    const selectedPaygPlan = paygPlans[0];

    const getSelectedStart = useCallback(() => {
        if (!startDate || !startTime) return null;
        const value = new Date(`${startDate}T${startTime}:00`);
        return Number.isNaN(value.getTime()) ? null : value;
    }, [startDate, startTime]);

    const getSelectedEnd = useCallback(() => {
        if (!endDate || !endTime) return null;
        const value = new Date(`${endDate}T${endTime}:00`);
        return Number.isNaN(value.getTime()) ? null : value;
    }, [endDate, endTime]);

    const getSelectedSlotCount = useCallback(() => {
        const selectedStart = getSelectedStart();
        const selectedEnd = getSelectedEnd();
        if (!selectedStart || !selectedEnd || selectedEnd <= selectedStart) {
            return 1;
        }
        return Math.max(
            1,
            Math.ceil((selectedEnd.getTime() - selectedStart.getTime()) / (1000 * 60 * 60))
        );
    }, [getSelectedStart, getSelectedEnd]);

    const getSlotUnitPrice = useCallback(() => {
        return (
            selectedSite?.toalAccessFee ??
            selectedSite?.pricing?.hourlyRate ??
            selectedPaygPlan?.platformFee ??
            selectedPaygPlan?.monthlyPrice ??
            0
        );
    }, [selectedSite, selectedPaygPlan]);

    const getBookingTotal = useCallback(() => {
        const slotUnitPrice = getSlotUnitPrice();
        const accessCharge = slotUnitPrice;
        const platformCharge = subscriptionStatus?.hasActiveSubscription
            ? 0
            : (selectedPaygPlan?.platformFee ?? selectedPaygPlan?.monthlyPrice ?? 0);
        return accessCharge + platformCharge;
    }, [
        getSelectedSlotCount,
        getSlotUnitPrice,
        subscriptionStatus?.hasActiveSubscription,
        selectedPaygPlan,
    ]);

    const getEndFromAnchor = useCallback((anchor: Date, selected: Date) => {
        const start = anchor < selected ? anchor : selected;
        const end = anchor < selected ? selected : anchor;
        const slotEnd = new Date(end);
        slotEnd.setHours(slotEnd.getHours() + 1, 0, 0, 0);
        return { start, end: slotEnd };
    }, []);

    // ── Load plans ────────────────────────────────────────────────────────────
    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setIsLoadingPlans(true);
            try {
                const plans = await fetchPublicPlans();
                if (cancelled) return;
                const active = plans.filter(p => p.isActive);
                setAvailablePlans(active);
                if (!selectedPlanId) {
                    const first = active.find(p => p.billingType === 'subscription');
                    if (first) setSelectedPlanId(first.id);
                }
            } catch {
                if (!cancelled) setAvailablePlans([]);
            } finally {
                if (!cancelled) setIsLoadingPlans(false);
            }
        };
        void load();
        return () => {
            cancelled = true;
        };
    }, []);

    // ── Load subscription status when operator selects a site ─────────────────
    const loadSubscriptionStatus = useCallback(async () => {
        if (!idToken) return;
        setIsCheckingSub(true);
        try {
            const status = await apiCheckSubscriptionStatus(idToken);
            setSubscriptionStatus(status);
            // Automatically set billing mode based on actual subscription status
            setBillingMode(status.hasActiveSubscription ? 'subscription' : 'payg');
        } catch {
            setSubscriptionStatus(null);
        } finally {
            setIsCheckingSub(false);
        }
    }, [idToken]);

    const loadSiteBookings = useCallback(
        async (siteId: string) => {
            if (!idToken) return;
            setIsLoadingBookings(true);
            try {
                const bookings = await apiFetchSiteBookings(idToken, siteId);
                setSiteBookings(bookings.map(apiBookingToFrontend));
            } catch {
                setSiteBookings([]);
                toast.error(
                    'Unable to load site availability. You can still enter times manually.'
                );
            } finally {
                setIsLoadingBookings(false);
            }
        },
        [idToken]
    );

    // ── Auto default plan ─────────────────────────────────────────────────────
    useEffect(() => {
        if (billingMode === 'subscription' && !selectedPlanId && subscriptionPlans.length > 0) {
            setSelectedPlanId(subscriptionPlans[0].id);
        }
    }, [billingMode, subscriptionPlans, selectedPlanId]);

    // ── Site filtering ────────────────────────────────────────────────────────
    const filteredSites = sites.filter(site => {
        if (normalizeSiteStatus(site.status) !== 'ACTIVE') return false;
        if (filterAutoApprove && !site.autoApprove) return false;
        if (filterCLZ && !site.clzEnabled) return false;
        if (searchQuery.trim()) {
            const q = searchQuery.toLowerCase();
            return (
                site.name.toLowerCase().includes(q) ||
                site.address.toLowerCase().includes(q) ||
                (site.postcode && site.postcode.toLowerCase().includes(q))
            );
        }
        return true;
    });

    // ── Handlers ──────────────────────────────────────────────────────────────

    const resetForm = () => {
        setStartDate('');
        setStartTime('');
        setEndDate('');
        setEndTime('');
        setOperationReference('');
        setDroneModel('');
        setMissionIntent('');
        setPolicyAcknowledged(false);
        setConflictAcknowledged(false);
        setAttachedFiles([]);
        setPaygClientSecret(null);
        setPaygPaymentIntentId(null);
        setPaymentCompleted(false);
        setCalendarAnchor(null);
    };

    const handleViewDetails = (site: Site) => {
        setSelectedSite(site);
        setView('details');
        setActiveWorkflow(null);
        setStep(1);
        resetForm();
        // Reset billing mode when entering a new site
        setBillingMode('subscription');
        setSiteBookings([]);
        void loadSubscriptionStatus();
        void loadSiteBookings(site.id);
    };

    const handleDownloadGeoJSON = (mode: 'TOAL' | 'EMERGENCY' | 'CLZ') => {
        if (!selectedSite) return;
        const geojson = generateGeoJSON({
            siteId: selectedSite.id,
            geometryType: selectedSite.geometry.type,
            center: selectedSite.geometry.center || { lat: 0, lng: 0 },
            radius: selectedSite.geometry.radius || 0,
            polygonPoints: selectedSite.geometry.points || [],
            clzEnabled: selectedSite.clzEnabled,
            clzCenter: selectedSite.clzGeometry?.center,
            clzRadius: selectedSite.clzGeometry?.radius,
            clzPolygonPoints: selectedSite.clzGeometry?.points || [],
            exportMode: mode === 'CLZ' ? 'EMERGENCY' : mode,
        });
        downloadGeoJSON(geojson, `${selectedSite.name.replace(/\s+/g, '_')}_${mode}.geojson`);
    };

    /** Create a Stripe PaymentIntent for PAYG bookings (called when operator has no subscription) */
    const handleCreatePaygIntent = async () => {
        if (!selectedSite || !idToken) return;
        const fee = getBookingTotal();
        if (!fee) {
            toast.error('Could not determine booking fee. Contact support.');
            return;
        }
        setIsCreatingIntent(true);
        try {
            const intent = await apiCreateBookingPaymentIntent(idToken, selectedSite.id, fee);
            setPaygClientSecret(intent.clientSecret);
            setPaygPaymentIntentId(intent.paymentIntentId);
            toast.success('Payment ready. Enter your card details below.');
        } catch (err: any) {
            toast.error(err?.message || 'Failed to create payment. Please try again.');
        } finally {
            setIsCreatingIntent(false);
        }
    };

    const handleCalendarSlotSelect = useCallback(
        (slotStart: Date) => {
            const selectedHour = String(slotStart.getHours()).padStart(2, '0');
            const selectedMinute = String(slotStart.getMinutes()).padStart(2, '0');
            const formatLocalDate = (date: Date) => {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            };

            if (!calendarAnchor || slotStart < calendarAnchor) {
                setCalendarAnchor(slotStart);
                setStartDate(formatLocalDate(slotStart));
                setStartTime(`${selectedHour}:${selectedMinute}`);
                const singleSlotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);
                setEndDate(formatLocalDate(singleSlotEnd));
                setEndTime(
                    `${String(singleSlotEnd.getHours()).padStart(2, '0')}:${String(singleSlotEnd.getMinutes()).padStart(2, '0')}`
                );
                return;
            }

            const { start, end } = getEndFromAnchor(calendarAnchor, slotStart);
            setStartDate(formatLocalDate(start));
            setStartTime(
                `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
            );
            setEndDate(formatLocalDate(end));
            setEndTime(
                `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
            );
            setCalendarAnchor(null);
        },
        [calendarAnchor, getEndFromAnchor]
    );

    /** Main booking submission handler */
    const handleSubmit = async () => {
        if (!selectedSite || !activeWorkflow || !idToken) return;
        if (isSubmitting) return;

        const needsPayment = !subscriptionStatus?.hasActiveSubscription;

        if (!paymentCard && needsPayment) {
            toast.error('Add a payment card before submitting your booking.');
            return;
        }

        if (!startDate || !startTime || !endDate || !endTime) {
            toast.error('Missing booking dates. Go back to Step 1.');
            return;
        }

        if (startDate !== endDate) {
            toast.error(
                'Bookings must stay within a single date. Please choose times on the same day.'
            );
            return;
        }

        if (!droneModel || !missionIntent) {
            toast.error('Missing drone model or mission intent. Go back to Step 1.');
            return;
        }

        setIsSubmitting(true);

        try {
            const useCategory = activeWorkflow === 'toal' ? 'planned_toal' : 'emergency_recovery';

            const apiBooking = await apiCreateBooking(idToken, {
                siteId: selectedSite.id,
                startTime: `${startDate}T${startTime}:00`,
                endTime: `${endDate}T${endTime}:00`,
                droneModel,
                missionIntent,
                useCategory,
                operationReference: operationReference || undefined,
                flyerId: flyerId || undefined,
                billingMode: needsPayment ? 'payg' : 'subscription',
            });

            const frontendBooking = apiBookingToFrontend(apiBooking);

            if (activeWorkflow === 'toal') {
                onBookSite(frontendBooking);
                setSiteBookings(prev => [...prev, frontendBooking]);
                toast.success(
                    selectedSite.autoApprove
                        ? needsPayment
                            ? '✅ Booking auto-approved. Payment is scheduled for the booking start date.'
                            : '✅ Booking auto-approved! Your consent certificate is ready.'
                        : '📋 Booking request submitted. Awaiting landowner approval.'
                );
            } else {
                const selection: CLZSelection = {
                    id: apiBooking.bookingReference,
                    bookingDbId: apiBooking.id,
                    operatorId,
                    siteId: selectedSite.id,
                    siteName: selectedSite.name,
                    operationStartDate: startDate,
                    operationStartTime: startTime,
                    operationEndDate: endDate,
                    operationEndTime: endTime,
                    droneModel,
                    flyerId: flyerId || '',
                    missionIntent,
                    createdAt: apiBooking.createdAt,
                    clzUsed: apiBooking.clzUsed,
                    clzConfirmedAt: apiBooking.clzConfirmedAt || undefined,
                    isPAYG: apiBooking.isPayg,
                    paymentStatus: frontendBooking.paymentStatus,
                    totalCost: (frontendBooking.toalCost || 0) + (frontendBooking.platformFee || 0),
                };
                onBookSite(frontendBooking);
                onSelectCLZ(selection);
                setSiteBookings(prev => [...prev, frontendBooking]);
                toast.success(
                    selectedSite.autoApprove
                        ? needsPayment
                            ? 'Emergency & Recovery booking approved. If you use the site, confirm usage after the window to process payment.'
                            : 'Emergency & Recovery booking approved successfully.'
                        : 'Emergency & Recovery registration submitted. Awaiting landowner approval.'
                );
            }

            setPaymentCompleted(true);
        } catch (err: any) {
            const msg = err?.message || 'Failed to submit booking. Please try again.';
            toast.error(msg);
            // If payment issue, clear the intent so they can retry
            if (msg.includes('Payment') || msg.includes('payment')) {
                setPaygPaymentIntentId(null);
                setPaygClientSecret(null);
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    const toalFee = selectedSite?.toalAccessFee ?? 0;
    const slotCount = getSelectedSlotCount();
    const slotFee = getSlotUnitPrice();
    const platformFee = !subscriptionStatus?.hasActiveSubscription
        ? (selectedPaygPlan?.platformFee ?? selectedPaygPlan?.monthlyPrice ?? 0)
        : 0;
    const bookingTotal = getBookingTotal();

    return (
        <div className="fixed inset-0 bg-[#0F172A]/60 backdrop-blur-md flex items-center justify-center p-4 z-50">
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-3xl shadow-2xl max-w-7xl w-full max-h-[95vh] overflow-hidden flex flex-col border border-white/20"
            >
                {/* Main Header */}
                <div className="px-10 py-8 border-b border-slate-100 flex items-center justify-between shrink-0 bg-white">
                    <div className="flex items-center gap-5">
                        <div className="size-14 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20">
                            <Search className="size-7 text-white" />
                        </div>
                        <div>
                            <h2 className="text-[28px] font-extrabold text-slate-800 tracking-tight">
                                Find Infrastructure
                            </h2>
                            <p className="text-sm text-slate-500 font-medium">
                                Coordinate your uncrewed aircraft operations with precision.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-12 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all border border-transparent hover:border-slate-100"
                    >
                        <X className="size-6" />
                    </button>
                </div>

                {/* Unified Content */}
                <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50">
                    {view !== 'details' && (
                        <div className="px-10 py-8 space-y-8">
                            {/* Search + View toggle */}
                            <div className="grid lg:grid-cols-[1fr,auto] gap-6 items-end">
                                <div className="space-y-3">
                                    <label className="text-xs font-bold text-slate-500 uppercase tracking-[0.15em] ml-1">
                                        Search UK Infrastructure Network
                                    </label>
                                    <div className="relative group">
                                        <Search className="absolute left-5 top-1/2 -translate-y-1/2 size-5 text-slate-400 group-focus-within:text-blue-600 transition-colors" />
                                        <input
                                            type="text"
                                            value={searchQuery}
                                            onChange={e => setSearchQuery(e.target.value)}
                                            placeholder="Enter site name, postcode, or address..."
                                            className="w-full pl-14 pr-6 h-16 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none shadow-sm transition-all text-base font-medium"
                                        />
                                    </div>
                                </div>
                                <div className="flex gap-2 p-1.5 bg-white border border-slate-200 rounded-[22px] shadow-sm">
                                    <button
                                        onClick={() => setView('list')}
                                        className={`h-12 px-8 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${view === 'list' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <Layers className="size-4" />
                                        List View
                                    </button>
                                    <button
                                        onClick={() => setView('map')}
                                        className={`h-12 px-8 rounded-xl text-sm font-bold flex items-center gap-2 transition-all ${view === 'map' ? 'bg-slate-800 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}
                                    >
                                        <MapIcon className="size-4" />
                                        Map Discovery
                                    </button>
                                </div>
                            </div>

                            {/* Filter chips */}
                            <div className="flex flex-wrap gap-4">
                                <button
                                    onClick={() => setFilterAutoApprove(!filterAutoApprove)}
                                    className={`px-6 py-3 rounded-full text-sm font-bold border transition-all flex items-center gap-2 ${filterAutoApprove ? 'bg-[#EAF2FF] border-blue-600 text-blue-600 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    <CheckCircle2 className="size-4" />
                                    Auto-Approval Only
                                </button>
                                <button
                                    onClick={() => setFilterCLZ(!filterCLZ)}
                                    className={`px-6 py-3 rounded-full text-sm font-bold border transition-all flex items-center gap-2 ${filterCLZ ? 'bg-[#FFF7ED] border-[#EA580C] text-[#EA580C] shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                >
                                    <Shield className="size-4" />
                                    Emergency &amp; Recovery
                                </button>
                            </div>

                            {/* List view */}
                            {view === 'list' && (
                                <div className="grid lg:grid-cols-2 gap-8 pb-10">
                                    {filteredSites.map(site => (
                                        <motion.div
                                            key={site.id}
                                            whileHover={{ y: -6, scale: 1.01 }}
                                            onClick={() => handleViewDetails(site)}
                                            className="bg-white border border-slate-200 rounded-[28px] p-8 cursor-pointer hover:border-blue-600/40 transition-all group shadow-sm hover:shadow-xl hover:shadow-blue-500/5 relative overflow-hidden"
                                        >
                                            <div className="absolute top-0 left-0 w-2 h-full bg-slate-100 group-hover:bg-blue-600 transition-colors" />
                                            <div className="flex items-start gap-6 mb-8">
                                                <div className="size-16 bg-slate-50 border border-slate-100 rounded-3xl flex items-center justify-center shrink-0 group-hover:bg-blue-600/5 group-hover:border-blue-600/20 transition-all">
                                                    <MapPin className="size-8 text-slate-400 group-hover:text-blue-600 transition-colors" />
                                                </div>
                                                <div className="flex-1 min-w-0">
                                                    <h3 className="text-xl font-bold text-slate-800 truncate mb-1 leading-tight">
                                                        {site.name}
                                                    </h3>
                                                    <p className="text-sm text-slate-500 font-medium truncate">
                                                        {site.address}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-wrap gap-3">
                                                <span className="px-3.5 py-1.5 bg-green-50 text-green-700 text-xs font-bold uppercase tracking-wider rounded-lg border border-green-100">
                                                    Active
                                                </span>
                                                {site.autoApprove && (
                                                    <span className="px-3.5 py-1.5 bg-[#EAF2FF] text-blue-600 text-xs font-bold uppercase tracking-wider rounded-lg border border-[#D6E4FF]">
                                                        Auto-Approve
                                                    </span>
                                                )}
                                                {site.clzEnabled && (
                                                    <span className="px-3.5 py-1.5 bg-[#FFF7ED] text-[#EA580C] text-xs font-bold uppercase tracking-wider rounded-lg border border-[#FFEDD5]">
                                                        Emergency Ready
                                                    </span>
                                                )}
                                                {site.toalAccessFee != null && (
                                                    <span className="px-3.5 py-1.5 bg-slate-50 text-slate-600 text-xs font-bold rounded-lg border border-slate-200">
                                                        £{site.toalAccessFee} access fee
                                                    </span>
                                                )}
                                            </div>
                                            <div className="mt-8 pt-6 border-t border-slate-50 flex items-center justify-between text-blue-600">
                                                <span className="text-sm font-bold">
                                                    View Requirements &amp; Book
                                                </span>
                                                <ChevronRight className="size-5 group-hover:translate-x-1 transition-transform" />
                                            </div>
                                        </motion.div>
                                    ))}
                                    {filteredSites.length === 0 && (
                                        <div className="lg:col-span-2 py-32 text-center bg-white rounded-3xl border border-slate-200 border-dashed">
                                            <div className="size-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                                <Search className="size-10 text-slate-300" />
                                            </div>
                                            <h4 className="text-lg font-bold text-slate-800">
                                                No Infrastructure Found
                                            </h4>
                                            <p className="text-slate-500 mt-2 font-medium">
                                                Try adjusting your filters or search query.
                                            </p>
                                            <button
                                                onClick={() => {
                                                    setSearchQuery('');
                                                    setFilterAutoApprove(false);
                                                    setFilterCLZ(false);
                                                }}
                                                className="mt-6 text-blue-600 font-bold hover:underline underline-offset-4"
                                            >
                                                Clear all filters
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* Map view */}
                            {view === 'map' && (
                                <div className="h-150 relative rounded-3xl overflow-hidden border border-slate-200">
                                    <SitesDiscoveryMap
                                        sites={filteredSites}
                                        onSiteClick={handleViewDetails}
                                    />
                                    <button
                                        onClick={() => setView('list')}
                                        className="absolute top-8 left-8 bg-white/90 backdrop-blur-md px-6 py-3 rounded-2xl shadow-2xl font-bold text-sm text-slate-800 border border-slate-200 hover:bg-white transition-all flex items-center gap-2"
                                    >
                                        <ChevronLeft className="size-4" />
                                        Back to List
                                    </button>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Details + Booking flow ─────────────────────────────── */}
                    {view === 'details' && selectedSite && (
                        <div className="flex flex-col lg:flex-row bg-white min-h-full">
                            {/* Left: Site Info Panel */}
                            <div className="lg:w-120 border-r border-slate-100 bg-white shrink-0 p-10 space-y-10">
                                <button
                                    onClick={() => setView('list')}
                                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
                                >
                                    <ChevronLeft className="size-4" />
                                    Back to Network Search
                                </button>

                                <SiteDetailsPanel
                                    site={selectedSite}
                                    activeWorkflow={activeWorkflow}
                                    paymentCompleted={paymentCompleted}
                                    onDownloadTOAL={() => handleDownloadGeoJSON('TOAL')}
                                    onDownloadEmergency={() => handleDownloadGeoJSON('EMERGENCY')}
                                />
                            </div>

                            {/* Right: Workflow Panel */}
                            <div className="flex-1 bg-white">
                                <div className="max-w-3xl mx-auto p-12">
                                    {!activeWorkflow ? (
                                        // ── Workflow selector ─────────────────────────────
                                        <div className="space-y-12 py-12">
                                            <div className="text-center space-y-4">
                                                <h3 className="text-[28px] font-black text-slate-800 tracking-tight">
                                                    Initiate Operational Access
                                                </h3>
                                                <p className="text-slate-500 font-medium max-w-md mx-auto">
                                                    Select the type of infrastructure access
                                                    required for your mission.
                                                </p>
                                            </div>

                                            {/* Subscription context banner */}
                                            {isCheckingSub ? (
                                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                                    <Loader2 className="size-4 text-slate-400 animate-spin" />
                                                    <span className="text-sm text-slate-500 font-medium">
                                                        Checking subscription status…
                                                    </span>
                                                </div>
                                            ) : subscriptionStatus?.hasActiveSubscription ? (
                                                <div className="flex items-center gap-3 p-4 bg-green-50 rounded-2xl border border-green-200">
                                                    <CheckCircle className="size-5 text-green-600 shrink-0" />
                                                    <div>
                                                        <p className="text-sm font-bold text-green-800">
                                                            {subscriptionStatus.planName} — Active
                                                            Subscription
                                                        </p>
                                                        <p className="text-xs text-green-700 mt-0.5">
                                                            Booking fee covered by your plan. No
                                                            per-booking charge.
                                                        </p>
                                                    </div>
                                                </div>
                                            ) : (
                                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                                                    <p className="text-sm font-bold text-amber-800">
                                                        No active subscription
                                                    </p>
                                                    <p className="text-xs text-amber-700 mt-0.5">
                                                        A per-booking fee will apply. You'll be
                                                        prompted to pay before submitting.
                                                    </p>
                                                </div>
                                            )}

                                            {/* Mission type buttons */}
                                            <div className="grid md:grid-cols-2 gap-8">
                                                <motion.button
                                                    whileHover={{
                                                        y: -8,
                                                        boxShadow:
                                                            '0 25px 50px -12px rgba(0, 71, 255, 0.15)',
                                                    }}
                                                    whileTap={{ scale: 0.98 }}
                                                    onClick={() => setActiveWorkflow('toal')}
                                                    className="aspect-square bg-white border-2 border-slate-100 hover:border-blue-600 rounded-[40px] p-8 flex flex-col items-center justify-center gap-6 group transition-all"
                                                >
                                                    <div className="size-20 bg-blue-50 rounded-[28px] flex items-center justify-center text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all duration-500">
                                                        <Plane className="size-10" />
                                                    </div>
                                                    <div className="text-center">
                                                        <p className="text-lg font-black text-slate-800">
                                                            Planned TOAL
                                                        </p>
                                                        <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-wider">
                                                            Authorised Intent
                                                        </p>
                                                        {toalFee > 0 && (
                                                            <p className="text-xs text-blue-600 font-bold mt-2">
                                                                £{toalFee} access fee
                                                            </p>
                                                        )}
                                                    </div>
                                                </motion.button>

                                                {selectedSite.clzEnabled ? (
                                                    <motion.button
                                                        whileHover={{
                                                            y: -8,
                                                            boxShadow:
                                                                '0 25px 50px -12px rgba(234, 88, 12, 0.15)',
                                                        }}
                                                        whileTap={{ scale: 0.98 }}
                                                        onClick={() => setActiveWorkflow('clz')}
                                                        className="aspect-square bg-white border-2 border-slate-100 hover:border-[#EA580C] rounded-[40px] p-8 flex flex-col items-center justify-center gap-6 group transition-all"
                                                    >
                                                        <div className="size-20 bg-orange-50 rounded-[28px] flex items-center justify-center text-[#EA580C] group-hover:bg-[#EA580C] group-hover:text-white transition-all duration-500">
                                                            <Bell className="size-10" />
                                                        </div>
                                                        <div className="text-center">
                                                            <p className="text-lg font-black text-slate-800">
                                                                Emergency &amp; Recovery
                                                            </p>
                                                            <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-wider">
                                                                Recovery Planning
                                                            </p>
                                                        </div>
                                                    </motion.button>
                                                ) : (
                                                    <div className="aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-[40px] p-8 flex flex-col items-center justify-center gap-4 opacity-50 grayscale">
                                                        <Shield className="size-10 text-slate-400" />
                                                        <p className="text-sm font-bold text-slate-400 text-center">
                                                            Emergency &amp; Recovery Unavailable for
                                                            this Site
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ) : (
                                        // ── Multi-step booking flow ────────────────────────
                                        <div className="space-y-12">
                                            {/* Progress stepper */}
                                            <div className="space-y-10">
                                                <div className="flex items-center justify-between">
                                                    <h3 className="text-2xl font-black text-slate-800 tracking-tight">
                                                        Step {step}:{' '}
                                                        {step === 1
                                                            ? 'Booking Details'
                                                            : step === 2
                                                              ? 'Policy & Evidence'
                                                              : 'Review & Submit'}
                                                    </h3>
                                                    <button
                                                        onClick={() => setActiveWorkflow(null)}
                                                        className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1.5"
                                                    >
                                                        <X className="size-4" />
                                                        Discard Request
                                                    </button>
                                                </div>

                                                <div className="flex items-center gap-4">
                                                    {[1, 2, 3].map(s => (
                                                        <div
                                                            key={s}
                                                            className="flex-1 flex flex-col gap-3"
                                                        >
                                                            <div
                                                                className={`h-1.5 rounded-full transition-all duration-700 ${step >= s ? (activeWorkflow === 'toal' ? 'bg-blue-600' : 'bg-[#EA580C]') : 'bg-slate-100'}`}
                                                            />
                                                            <div className="flex items-center gap-2">
                                                                <span
                                                                    className={`text-[10px] font-bold uppercase tracking-widest ${step === s ? (activeWorkflow === 'toal' ? 'text-blue-600' : 'text-[#EA580C]') : 'text-slate-400'}`}
                                                                >
                                                                    Step 0{s}
                                                                </span>
                                                                {step > s && (
                                                                    <CheckCircle className="size-3 text-green-500" />
                                                                )}
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Step content */}
                                            <AnimatePresence mode="wait">
                                                {step === 1 && (
                                                    <Step1BookingDetails
                                                        site={selectedSite}
                                                        existingBookings={siteBookings}
                                                        isLoadingAvailability={isLoadingBookings}
                                                        onCalendarSlotSelect={
                                                            handleCalendarSlotSelect
                                                        }
                                                        // Lifted state
                                                        startDate={startDate}
                                                        startTime={startTime}
                                                        endDate={endDate}
                                                        endTime={endTime}
                                                        operationReference={operationReference}
                                                        droneModel={droneModel}
                                                        missionIntent={missionIntent}
                                                        onStartDateChange={setStartDate}
                                                        onStartTimeChange={setStartTime}
                                                        onEndDateChange={setEndDate}
                                                        onEndTimeChange={setEndTime}
                                                        onOperationReferenceChange={
                                                            setOperationReference
                                                        }
                                                        onDroneModelChange={setDroneModel}
                                                        onMissionIntentChange={setMissionIntent}
                                                        onStepChange={setStep}
                                                    />
                                                )}

                                                {step === 2 && (
                                                    <Step2PolicyEvidence
                                                        site={selectedSite}
                                                        policyAcknowledged={policyAcknowledged}
                                                        onPolicyAcknowledgedChange={
                                                            setPolicyAcknowledged
                                                        }
                                                        attachedFiles={attachedFiles}
                                                        onAttachedFilesChange={setAttachedFiles}
                                                        onStepChange={setStep}
                                                    />
                                                )}

                                                {step === 3 && (
                                                    <Step3ReviewSubmit
                                                        site={selectedSite}
                                                        activeWorkflow={activeWorkflow}
                                                        // Real form data
                                                        startDate={startDate}
                                                        startTime={startTime}
                                                        endDate={endDate}
                                                        endTime={endTime}
                                                        operationReference={operationReference}
                                                        droneModel={droneModel}
                                                        missionIntent={missionIntent}
                                                        // Billing
                                                        hasActiveSubscription={
                                                            subscriptionStatus?.hasActiveSubscription ??
                                                            false
                                                        }
                                                        subscriptionPlanName={
                                                            subscriptionStatus?.planName ?? null
                                                        }
                                                        slotCount={slotCount}
                                                        slotFee={slotFee}
                                                        platformFee={platformFee}
                                                        totalCost={bookingTotal}
                                                        // Payment card on file (for masked display)
                                                        paymentCard={paymentCard ?? null}
                                                        isPaymentCardLoading={isPaymentCardLoading}
                                                        onRequestPaymentSetup={
                                                            onRequestPaymentSetup
                                                        }
                                                        // PAYG payment
                                                        paygClientSecret={paygClientSecret}
                                                        paygPaymentIntentId={paygPaymentIntentId}
                                                        isCreatingIntent={isCreatingIntent}
                                                        onCreatePaygIntent={handleCreatePaygIntent}
                                                        // Submit
                                                        conflictAcknowledged={conflictAcknowledged}
                                                        onConflictAcknowledgedChange={
                                                            setConflictAcknowledged
                                                        }
                                                        isSubmitting={isSubmitting}
                                                        onStepChange={setStep}
                                                        onSubmit={handleSubmit}
                                                    />
                                                )}
                                            </AnimatePresence>
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>
        </div>
    );
}
