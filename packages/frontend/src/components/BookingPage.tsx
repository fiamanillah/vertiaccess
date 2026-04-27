import { useEffect, useState, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import type { Site } from '../types';
import { generateGeoJSON, downloadGeoJSON } from '../utils/geojson';
import { normalizeSiteStatus } from '../lib/site-status';
import { fetchPublicPlans, type BillingPlan } from '../lib/billing';
import { fetchPublicSites, apiSiteToFrontendSite } from '../lib/sites';
import { toast } from 'sonner';
import { DiscoveryView } from './FindSiteModal/DiscoveryView';
import { DetailsBookingView } from './FindSiteModal/DetailsBookingView';
import { PaymentSettings } from './PaymentSettings';
import {
    apiCreateBooking,
    apiFetchPublicSiteAvailability,
    apiCheckSubscriptionStatus,
    apiCreateBookingPaymentIntent,
    type SubscriptionStatus,
    type PublicAvailabilitySlot,
} from '../lib/bookings';
import { useAuth } from '../context/AuthContext';
import { Header } from './Header';
import type { User } from '../App';

interface BookingPageProps {
    user: User;
    sites: Site[];
    onLogout: () => void;
    onUpdateUser: (user: User) => void;
}

export function BookingPage({ user, sites, onLogout, onUpdateUser }: BookingPageProps) {
    const { siteId, step: stepParam } = useParams<{ siteId?: string; step?: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { idToken } = useAuth();
    const workflowParam = searchParams.get('workflow');
    const routeWorkflow: 'toal' | 'clz' | null =
        workflowParam === 'toal' || workflowParam === 'clz' ? workflowParam : null;
    const parsedStep = Number(stepParam);
    const routeStep: 1 | 2 | 3 | null =
        stepParam && [1, 2, 3].includes(parsedStep) ? (parsedStep as 1 | 2 | 3) : null;
    const currentStep: 1 | 2 | 3 = routeStep ?? 1;

    // ── Discovery state ─────────────────────────────────────────────────────
    const [view, setView] = useState<'list' | 'map' | 'details'>(siteId ? 'details' : 'list');
    const [selectedSite, setSelectedSite] = useState<Site | null>(null);
    const [filterAutoApprove, setFilterAutoApprove] = useState(false);
    const [filterCLZ, setFilterCLZ] = useState(false);
    const [activeWorkflow, setActiveWorkflow] = useState<'toal' | 'clz' | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchResults, setSearchResults] = useState<Site[]>([]);
    const [hasSearched, setHasSearched] = useState(false);
    const [isSearchingSites, setIsSearchingSites] = useState(false);

    // ── Step state ───────────────────────────────────────────────────────────
    const [policyAcknowledged, setPolicyAcknowledged] = useState(false);
    const [conflictAcknowledged, setConflictAcknowledged] = useState(false);
    const [attachedFiles, setAttachedFiles] = useState<{ name: string; size: string }[]>([]);

    // ── Form state ───────────────────────────────────────────────────────────
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
    const [showPaymentSettings, setShowPaymentSettings] = useState(false);

    const resetForm = useCallback(() => {
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
    }, []);

    // ── Load subscription status ──────────────────────────────────────────────
    const loadSubscriptionStatus = useCallback(async () => {
        if (!idToken) return;
        setIsCheckingSub(true);
        try {
            const status = await apiCheckSubscriptionStatus(idToken);
            setSubscriptionStatus(status);
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

    // ── URL validation for explicit step routes ───────────────────────────────
    useEffect(() => {
        if (!stepParam) return;

        if (!siteId) {
            navigate('/dashboard/operator/book', { replace: true });
            return;
        }

        if (!routeStep) {
            navigate(`/dashboard/operator/book/${siteId}/step/1`, { replace: true });
        }
    }, [stepParam, siteId, routeStep, navigate]);

    // Keep step deep-links predictable by restoring workflow context from URL.
    useEffect(() => {
        if (!siteId || !routeStep) return;
        setActiveWorkflow(routeWorkflow ?? 'toal');
    }, [siteId, routeStep, routeWorkflow]);

    // ── Load specific site if siteId is present ──────────────────────────────
    useEffect(() => {
        if (siteId) {
            const site = sites.find(s => s.id === siteId);
            if (site) {
                const isDifferentSite = selectedSite?.id !== site.id;
                setSelectedSite(site);
                setView('details');
                if (isDifferentSite) {
                    setActiveWorkflow(null);
                    resetForm();
                }
                void loadSubscriptionStatus();
                void loadPublicAvailability(site.id);
            } else {
                // If site not found in props, maybe it's a direct link to a site we haven't loaded
                // For now, just go back to list
                navigate('/dashboard/operator/book');
            }
        } else {
            setSelectedSite(null);
            setView('list');
            setActiveWorkflow(null);
        }
    }, [
        siteId,
        sites,
        navigate,
        selectedSite?.id,
        resetForm,
        loadSubscriptionStatus,
        loadPublicAvailability,
    ]);

    // ── Derived ──────────────────────────────────────────────────────────────
    const subscriptionPlans = availablePlans.filter(p => p.billingType === 'subscription');
    const paygPlans = availablePlans.filter(p => p.billingType === 'payg');
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
    }, [getSlotUnitPrice, subscriptionStatus?.hasActiveSubscription, selectedPaygPlan]);

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
    }, [selectedPlanId]);

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
        navigate(`/dashboard/operator/book/${site.id}`);
    };

    const handleStepChange = useCallback(
        (nextStep: 1 | 2 | 3) => {
            if (!selectedSite) return;
            const workflow = activeWorkflow ?? 'toal';
            navigate(
                `/dashboard/operator/book/${selectedSite.id}/step/${nextStep}?workflow=${workflow}`
            );
        },
        [navigate, selectedSite, activeWorkflow]
    );

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

    const handleRequestPaymentSetup = useCallback(() => {
        setShowPaymentSettings(true);
    }, []);

    const handleUpdateCard = (card: any | undefined) => {
        onUpdateUser({ ...user, paymentCard: card });
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
                const startDateStr = formatLocalDate(slotStart);
                const endDateStr = formatLocalDate(singleSlotEnd);
                if (endDateStr !== startDateStr) {
                    setEndDate(startDateStr);
                    setEndTime('23:59');
                } else {
                    setEndDate(endDateStr);
                    setEndTime(
                        `${String(singleSlotEnd.getHours()).padStart(2, '0')}:${String(singleSlotEnd.getMinutes()).padStart(2, '0')}`
                    );
                }
                return;
            }

            const { start, end } = getEndFromAnchor(calendarAnchor, slotStart);
            const startDateStr = formatLocalDate(start);
            const endDateStr = formatLocalDate(end);
            setStartDate(startDateStr);
            setStartTime(
                `${String(start.getHours()).padStart(2, '0')}:${String(start.getMinutes()).padStart(2, '0')}`
            );
            if (endDateStr !== startDateStr) {
                setEndDate(startDateStr);
                setEndTime('23:59');
            } else {
                setEndDate(endDateStr);
                setEndTime(
                    `${String(end.getHours()).padStart(2, '0')}:${String(end.getMinutes()).padStart(2, '0')}`
                );
            }
            setCalendarAnchor(null);
        },
        [calendarAnchor, getEndFromAnchor]
    );

    const handleSubmit = async () => {
        if (!selectedSite || !activeWorkflow || !idToken) return;
        if (isSubmitting) return;

        const needsPayment = !subscriptionStatus?.hasActiveSubscription;

        if (!user.paymentCard) {
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

            await apiCreateBooking(idToken, {
                siteId: selectedSite.id,
                startTime: `${startDate}T${startTime}:00`,
                endTime: `${endDate}T${endTime}:00`,
                droneModel,
                missionIntent,
                useCategory,
                operationReference: operationReference || undefined,
                flyerId: user.flyerId || undefined,
                billingMode: needsPayment ? 'payg' : 'subscription',
            });

            toast.success('Booking created successfully!');
            navigate('/dashboard/operator');
        } catch (err: any) {
            const msg = err?.message || 'Failed to submit booking. Please try again.';
            toast.error(msg);
        } finally {
            setIsSubmitting(false);
        }
    };

    const discoverySites = hasSearched ? searchResults : sites;
    const filteredSites = discoverySites.filter(site => {
        if (normalizeSiteStatus(site.status) !== 'ACTIVE') return false;
        if (filterAutoApprove && !site.autoApprove) return false;
        if (filterCLZ && !site.clzEnabled) return false;
        return true;
    });

    const slotCount = getSelectedSlotCount();
    const slotFee = getSlotUnitPrice();
    const platformFee = !subscriptionStatus?.hasActiveSubscription
        ? (selectedPaygPlan?.platformFee ?? selectedPaygPlan?.monthlyPrice ?? 0)
        : 0;
    const bookingTotal = getBookingTotal();

    return (
        <div className="min-h-screen bg-slate-50">
            <Header
                user={user}
                onLogout={onLogout}
                onOpenProfile={() => navigate('/dashboard/operator?profile=true')}
                notificationCount={0}
                notifications={[]}
                onMarkAsRead={() => { }}
                onMarkAllAsRead={() => { }}
                onPrevPage={() => { }}
                onNextPage={() => { }}
                notificationsLoading={false}
            />

            <div className="w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6">
                <div className="bg-white rounded-3xl sm:rounded-4xl shadow-xl overflow-hidden border border-slate-200 min-h-[calc(100dvh-7.5rem)] flex flex-col">
                    <div className="px-6 sm:px-8 py-6 sm:py-7 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-linear-to-b from-white to-slate-50/30 shrink-0 relative overflow-hidden">
                        {/* Decorative glass element */}
                        <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/5 blur-3xl rounded-full -mr-20 -mt-20 pointer-events-none" />
                        
                        <div className="flex items-center gap-4 sm:gap-6 min-w-0 relative z-10">
                            <div className="size-12 sm:size-14 bg-linear-to-br from-blue-600 to-indigo-700 rounded-2xl flex items-center justify-center shadow-xl shadow-blue-500/30 ring-4 ring-white">
                                <div className="size-6 sm:size-7 rounded-full border-2 border-white/90 relative">
                                    <div className="absolute inset-1 bg-white/20 rounded-full animate-pulse" />
                                </div>
                            </div>
                            <div className="min-w-0">
                                <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight truncate leading-tight">
                                    {view === 'details'
                                        ? selectedSite?.name
                                        : 'Find Infrastructure'}
                                </h2>
                                <div className="flex items-center gap-2 mt-1">
                                    <p className="text-xs sm:text-sm text-slate-500 font-bold tracking-tight">
                                        {view === 'details'
                                            ? selectedSite?.address
                                            : 'Coordinate your uncrewed aircraft operations with precision.'}
                                    </p>
                                    {view === 'details' && selectedSite?.vtId && (
                                        <span className="text-[10px] font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md border border-blue-100 uppercase tracking-widest">
                                            {selectedSite.vtId}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-3 relative z-10">
                            {view === 'details' && (
                                <button
                                    onClick={() => navigate('/dashboard/operator/book')}
                                    className="h-10 px-5 text-sm font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-all flex items-center gap-2"
                                >
                                    Change Site
                                </button>
                            )}
                            <button
                                onClick={() => navigate('/dashboard/operator')}
                                className="h-11 px-6 text-sm font-black text-white bg-slate-900 hover:bg-black rounded-xl shadow-lg shadow-slate-200 transition-all flex items-center justify-center active:scale-95"
                            >
                                Exit Booking
                            </button>
                        </div>
                    </div>

                    <div className=" ">
                        {view !== 'details' ? (
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
                        ) : selectedSite ? (
                            <DetailsBookingView
                                site={selectedSite}
                                activeWorkflow={activeWorkflow}
                                paymentCompleted={paymentCompleted}
                                step={currentStep}
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
                                onStepChange={handleStepChange}
                                policyAcknowledged={policyAcknowledged}
                                onPolicyAcknowledgedChange={setPolicyAcknowledged}
                                attachedFiles={attachedFiles}
                                onAttachedFilesChange={setAttachedFiles}
                                conflictAcknowledged={conflictAcknowledged}
                                onConflictAcknowledgedChange={setConflictAcknowledged}
                                isSubmitting={isSubmitting}
                                paymentCard={user.paymentCard ?? null}
                                isPaymentCardLoading={false}
                                onRequestPaymentSetup={handleRequestPaymentSetup}
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
                                onBackToList={() => navigate('/dashboard/operator/book')}
                                onDiscardRequest={() => {
                                    setActiveWorkflow(null);
                                    navigate(`/dashboard/operator/book/${selectedSite.id}`);
                                }}
                                onSelectWorkflow={workflow => {
                                    setActiveWorkflow(workflow);
                                    navigate(
                                        `/dashboard/operator/book/${selectedSite.id}/step/1?workflow=${workflow}`
                                    );
                                }}
                                onDownloadTOAL={() => handleDownloadGeoJSON('TOAL')}
                                onDownloadEmergency={() => handleDownloadGeoJSON('EMERGENCY')}
                                isCheckingSub={isCheckingSub}
                            />
                        ) : null}
                    </div>
                </div>
            </div>
        {showPaymentSettings && (
            <PaymentSettings
                user={user}
                onUpdateCard={handleUpdateCard}
                onClose={() => setShowPaymentSettings(false)}
            />
        )}
        </div>
    );
}
