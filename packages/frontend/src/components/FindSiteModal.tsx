import { useEffect, useState, useCallback } from 'react';
import type { Site, BookingRequest, CLZSelection, PaymentCard } from '../types';
import { motion } from 'motion/react';
import { generateGeoJSON, downloadGeoJSON } from '../utils/geojson';
import { normalizeSiteStatus } from '../lib/site-status';
import { fetchPublicPlans, type BillingPlan } from '../lib/billing';
import { fetchPublicSites, apiSiteToFrontendSite } from '../lib/sites';
import { toast } from 'sonner';
import { DiscoveryView } from './FindSiteModal/DiscoveryView';
import { DetailsBookingView } from './FindSiteModal/DetailsBookingView';
import {
    apiCreateBooking,
    apiFetchPublicSiteAvailability,
    apiCheckSubscriptionStatus,
    apiCreateBookingPaymentIntent,
    apiBookingToFrontend,
    type SubscriptionStatus,
    type PublicAvailabilitySlot,
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
    const [searchResults, setSearchResults] = useState<Site[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isSearchingSites, setIsSearchingSites] = useState(false);

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
    const [isLoadingAvailability, setIsLoadingAvailability] = useState(false);
    const [billingMode, setBillingMode] = useState<'payg' | 'subscription'>('subscription');
    const [availablePlans, setAvailablePlans] = useState<BillingPlan[]>([]);
    const [isLoadingPlans, setIsLoadingPlans] = useState(false);
    const [selectedPlanId, setSelectedPlanId] = useState('');
    const [availabilitySlots, setAvailabilitySlots] = useState<PublicAvailabilitySlot[]>([]);

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

    const loadPublicAvailability = useCallback(async (siteId: string) => {
        setIsLoadingAvailability(true);
        try {
            const slots = await apiFetchPublicSiteAvailability(siteId);
            setAvailabilitySlots(slots);
        } catch {
            setAvailabilitySlots([]);
        } finally {
            setIsLoadingAvailability(false);
        }
    }, []);

    // ── Auto default plan ─────────────────────────────────────────────────────
    useEffect(() => {
        if (billingMode === 'subscription' && !selectedPlanId && subscriptionPlans.length > 0) {
            setSelectedPlanId(subscriptionPlans[0]?.id ?? '');
        }
    }, [billingMode, subscriptionPlans, selectedPlanId]);

    const discoverySites = hasSearched ? searchResults : sites;

    // ── Site filtering ────────────────────────────────────────────────────────
    const filteredSites = discoverySites.filter(site => {
        if (normalizeSiteStatus(site.status) !== 'ACTIVE') return false;
        if (filterAutoApprove && !site.autoApprove) return false;
        if (filterCLZ && !site.clzEnabled) return false;
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
        setAvailabilitySlots([]);
    };

    const handleSearchSites = async () => {
        const q = searchQuery.trim();
        setIsSearchingSites(true);
        try {
            const apiSites = await fetchPublicSites({ query: q });
            setSearchResults(apiSites.map(apiSiteToFrontendSite));
            setHasSearched(true);
        } catch (err: any) {
            toast.error(err?.message || 'Unable to search sites right now. Please try again.');
        } finally {
            setIsSearchingSites(false);
        }
    };

    const handleViewDetails = (site: Site) => {
        setSelectedSite(site);
        setView('details');
        setActiveWorkflow(null);
        setStep(1);
        resetForm();
        setBillingMode('subscription');
        void loadSubscriptionStatus();
        void loadPublicAvailability(site.id);
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

        if (!paymentCard) {
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
                toast.success(
                    selectedSite.autoApprove
                        ? needsPayment
                            ? 'Emergency & Recovery booking approved. If you use the site, confirm usage after the window to process payment.'
                            : 'Emergency & Recovery booking approved successfully.'
                        : 'Emergency & Recovery registration submitted. Awaiting landowner approval.'
                );
            }

            setPaymentCompleted(true);
            // Refresh availability so calendar reflects the new booking
            if (selectedSite) void loadPublicAvailability(selectedSite.id);
        } catch (err: any) {
            const msg = err?.message || 'Failed to submit booking. Please try again.';
            toast.error(msg);
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
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-md flex items-center justify-center p-0 sm:p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.98, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                className="bg-white rounded-none sm:rounded-4xl shadow-2xl w-full max-w-[100vw] sm:max-w-[92vw] max-h-dvh overflow-hidden flex flex-col border border-white/20 isolation-isolate"
            >
                <div className="px-4 sm:px-6 py-4 sm:py-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 shrink-0 bg-white">
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="size-11 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/20 shrink-0">
                            <div className="size-5 rounded-full border-2 border-white/90" />
                        </div>
                        <div className="min-w-0">
                            <h2 className="text-2xl font-extrabold text-slate-800 tracking-tight">
                                Find Infrastructure
                            </h2>
                            <p className="text-xs text-slate-500 font-medium">
                                Coordinate your uncrewed aircraft operations with precision.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="size-10 flex items-center justify-center text-slate-400 hover:text-slate-800 hover:bg-slate-50 rounded-full transition-all border border-transparent hover:border-slate-100 self-end sm:self-auto"
                    >
                        <span className="text-2xl leading-none">×</span>
                    </button>
                </div>

                <div
                    className={`flex-1 min-h-0 ${view === 'details' ? 'overflow-hidden' : 'overflow-y-auto custom-scrollbar bg-slate-50'}`}
                >
                    {view !== 'details' && (
                        <DiscoveryView
                            view={view}
                            searchQuery={searchQuery}
                            isSearchingSites={isSearchingSites}
                            hasSearched={hasSearched}
                            filteredSites={filteredSites}
                            onViewChange={setView}
                            onSearchQueryChange={setSearchQuery}
                            onSearchSites={handleSearchSites}
                            onResetSearch={() => {
                                setHasSearched(false);
                                setSearchResults([]);
                                setSearchQuery('');
                                setFilterAutoApprove(false);
                                setFilterCLZ(false);
                            }}
                            onToggleAutoApprove={() => setFilterAutoApprove(!filterAutoApprove)}
                            onToggleCLZ={() => setFilterCLZ(!filterCLZ)}
                            filterAutoApprove={filterAutoApprove}
                            filterCLZ={filterCLZ}
                            onSiteClick={handleViewDetails}
                        />
                    )}

                    {view === 'details' && selectedSite && (
                        <DetailsBookingView
                            site={selectedSite}
                            activeWorkflow={activeWorkflow}
                            paymentCompleted={paymentCompleted}
                            step={step}
                            availabilitySlots={availabilitySlots}
                            isLoadingAvailability={isLoadingAvailability}
                            onCalendarSlotSelect={handleCalendarSlotSelect}
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
                            onOperationReferenceChange={setOperationReference}
                            onDroneModelChange={setDroneModel}
                            onMissionIntentChange={setMissionIntent}
                            onStepChange={setStep}
                            policyAcknowledged={policyAcknowledged}
                            onPolicyAcknowledgedChange={setPolicyAcknowledged}
                            attachedFiles={attachedFiles}
                            onAttachedFilesChange={setAttachedFiles}
                            conflictAcknowledged={conflictAcknowledged}
                            onConflictAcknowledgedChange={setConflictAcknowledged}
                            isSubmitting={isSubmitting}
                            paymentCard={paymentCard ?? null}
                            isPaymentCardLoading={isPaymentCardLoading}
                            onRequestPaymentSetup={onRequestPaymentSetup}
                            hasActiveSubscription={
                                subscriptionStatus?.hasActiveSubscription ?? false
                            }
                            subscriptionPlanName={subscriptionStatus?.planName ?? null}
                            subscriptionStatus={subscriptionStatus}
                            slotCount={slotCount}
                            slotFee={slotFee}
                            platformFee={platformFee}
                            totalCost={bookingTotal}
                            paygClientSecret={paygClientSecret}
                            paygPaymentIntentId={paygPaymentIntentId}
                            isCreatingIntent={isCreatingIntent}
                            onCreatePaygIntent={handleCreatePaygIntent}
                            onSubmit={handleSubmit}
                            onBackToList={() => setView('list')}
                            onDiscardRequest={() => setActiveWorkflow(null)}
                            onSelectWorkflow={setActiveWorkflow}
                            onDownloadTOAL={() => handleDownloadGeoJSON('TOAL')}
                            onDownloadEmergency={() => handleDownloadGeoJSON('EMERGENCY')}
                            isCheckingSub={isCheckingSub}
                        />
                    )}
                </div>
            </motion.div>
        </div>
    );
}
