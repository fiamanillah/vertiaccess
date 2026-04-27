import { AnimatePresence, motion } from 'motion/react';
import { Bell, CheckCircle, Loader2, Plane, Shield, X, ChevronLeft } from 'lucide-react';
import type { PaymentCard, Site } from '../../types';
import type { PublicAvailabilitySlot, SubscriptionStatus } from '../../lib/bookings';
import { SiteDetailsPanel } from './SiteDetailsPanel';
import { Step1BookingDetails } from './Step1BookingDetails';
import { Step2PolicyEvidence } from './Step2PolicyEvidence';
import { Step3ReviewSubmit } from './Step3ReviewSubmit';

interface DetailsBookingViewProps {
    site: Site;
    activeWorkflow: 'toal' | 'clz' | null;
    paymentCompleted: boolean;
    step: 1 | 2 | 3;
    availabilitySlots: PublicAvailabilitySlot[];
    isLoadingAvailability: boolean;
    onCalendarSlotSelect: (slotStart: Date) => void;
    startDate: string;
    startTime: string;
    endDate: string;
    endTime: string;
    operationReference: string;
    droneModel: string;
    missionIntent: string;
    onStartDateChange: (v: string) => void;
    onStartTimeChange: (v: string) => void;
    onEndDateChange: (v: string) => void;
    onEndTimeChange: (v: string) => void;
    onOperationReferenceChange: (v: string) => void;
    onDroneModelChange: (v: string) => void;
    onMissionIntentChange: (v: string) => void;
    onStepChange: (step: 1 | 2 | 3) => void;
    policyAcknowledged: boolean;
    onPolicyAcknowledgedChange: (v: boolean) => void;
    attachedFiles: { name: string; size: string }[];
    onAttachedFilesChange: (files: { name: string; size: string }[]) => void;
    conflictAcknowledged: boolean;
    onConflictAcknowledgedChange: (v: boolean) => void;
    isSubmitting: boolean;
    paymentCard: PaymentCard | null;
    isPaymentCardLoading: boolean;
    onRequestPaymentSetup?: () => void;
    hasActiveSubscription: boolean;
    subscriptionPlanName: string | null;
    subscriptionStatus: SubscriptionStatus | null;
    slotCount: number;
    slotFee: number;
    platformFee: number;
    totalCost: number;
    paygClientSecret: string | null;
    paygPaymentIntentId: string | null;
    isCreatingIntent: boolean;
    onCreatePaygIntent: () => void;
    onSubmit: () => void;
    onBackToList: () => void;
    onDiscardRequest: () => void;
    onSelectWorkflow: (workflow: 'toal' | 'clz') => void;
    onDownloadTOAL: () => void;
    onDownloadEmergency: () => void;
    isCheckingSub: boolean;
}

function WorkflowCard({
    title,
    subtitle,
    tone,
    icon: Icon,
    onClick,
}: {
    title: string;
    subtitle: string;
    tone: 'blue' | 'orange';
    icon: typeof Plane;
    onClick: () => void;
}) {
    return (
        <motion.button
            type="button"
            whileHover={{ y: -8 }}
            whileTap={{ scale: 0.98 }}
            onClick={onClick}
            className={`min-h-55 sm:aspect-square bg-white border-2 border-slate-100 rounded-4xl p-6 sm:p-8 flex flex-col items-center justify-center gap-6 group transition-all ${tone === 'blue' ? 'hover:border-blue-600' : 'hover:border-[#EA580C]'}`}
        >
            <div
                className={`size-20 rounded-3xl flex items-center justify-center transition-all duration-500 ${tone === 'blue' ? 'bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white' : 'bg-orange-50 text-[#EA580C] group-hover:bg-[#EA580C] group-hover:text-white'}`}
            >
                <Icon className="size-10" />
            </div>
            <div className="text-center">
                <p className="text-lg font-black text-slate-800">{title}</p>
                <p className="text-sm text-slate-500 font-bold mt-1 uppercase tracking-wider">
                    {subtitle}
                </p>
            </div>
        </motion.button>
    );
}

function BookingStepper({
    step,
    activeWorkflow,
    onDiscardRequest,
}: {
    step: 1 | 2 | 3;
    activeWorkflow: 'toal' | 'clz';
    onDiscardRequest: () => void;
}) {
    return (
        <div className="space-y-8">
            <div className="flex items-start sm:items-center justify-between gap-3">
                <h3 className="text-xl sm:text-2xl font-black text-slate-800 tracking-tight">
                    Step {step}:{' '}
                    {step === 1
                        ? 'Booking Details'
                        : step === 2
                          ? 'Policy & Evidence'
                          : 'Review & Submit'}
                </h3>
                <button
                    type="button"
                    onClick={onDiscardRequest}
                    className="text-sm font-bold text-slate-400 hover:text-red-500 transition-colors flex items-center gap-1.5 shrink-0"
                >
                    <X className="size-4" />
                    Discard Request
                </button>
            </div>

            <div className="flex items-center gap-3 sm:gap-4">
                {[1, 2, 3].map(currentStep => (
                    <div key={currentStep} className="flex-1 flex flex-col gap-3">
                        <div
                            className={`h-1.5 rounded-full transition-all duration-700 ${step >= currentStep ? (activeWorkflow === 'toal' ? 'bg-blue-600' : 'bg-[#EA580C]') : 'bg-slate-100'}`}
                        />
                        <div className="flex items-center gap-2">
                            <span
                                className={`text-[10px] font-bold uppercase tracking-widest ${step === currentStep ? (activeWorkflow === 'toal' ? 'text-blue-600' : 'text-[#EA580C]') : 'text-slate-400'}`}
                            >
                                Step 0{currentStep}
                            </span>
                            {step > currentStep && (
                                <CheckCircle className="size-3 text-green-500" />
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function DetailsBookingView({
    site,
    activeWorkflow,
    paymentCompleted,
    step,
    availabilitySlots,
    isLoadingAvailability,
    onCalendarSlotSelect,
    startDate,
    startTime,
    endDate,
    endTime,
    operationReference,
    droneModel,
    missionIntent,
    onStartDateChange,
    onStartTimeChange,
    onEndDateChange,
    onEndTimeChange,
    onOperationReferenceChange,
    onDroneModelChange,
    onMissionIntentChange,
    onStepChange,
    policyAcknowledged,
    onPolicyAcknowledgedChange,
    attachedFiles,
    onAttachedFilesChange,
    conflictAcknowledged,
    onConflictAcknowledgedChange,
    isSubmitting,
    paymentCard,
    isPaymentCardLoading,
    onRequestPaymentSetup,
    hasActiveSubscription,
    subscriptionPlanName,
    subscriptionStatus,
    slotCount,
    slotFee,
    platformFee,
    totalCost,
    paygClientSecret,
    paygPaymentIntentId,
    isCreatingIntent,
    onCreatePaygIntent,
    onSubmit,
    onBackToList,
    onDiscardRequest,
    onSelectWorkflow,
    onDownloadTOAL,
    onDownloadEmergency,
    isCheckingSub,
}: DetailsBookingViewProps) {
    const activePlanName = subscriptionStatus?.planName ?? subscriptionPlanName;

    return (
        <div className="flex flex-col lg:flex-row bg-white h-full min-h-0 overflow-hidden">
            <div className="w-full lg:w-105 xl:w-1/3 border-b lg:border-b-0 lg:border-r border-slate-200 bg-white shrink-0 overflow-y-auto p-4 sm:p-5 xl:p-6 space-y-4 min-h-0">
                <button
                    type="button"
                    onClick={onBackToList}
                    className="flex items-center gap-2 text-slate-500 hover:text-slate-800 font-bold text-sm transition-colors"
                >
                    <ChevronLeft className="size-4" />
                    Back to Network Search
                </button>

                <SiteDetailsPanel
                    site={site}
                    activeWorkflow={activeWorkflow}
                    paymentCompleted={paymentCompleted}
                    onDownloadTOAL={onDownloadTOAL}
                    onDownloadEmergency={onDownloadEmergency}
                />
            </div>

            <div className="flex-1 min-w-0 overflow-y-auto bg-slate-50/40">
                <div className="max-w-3xl mx-auto p-4 sm:p-6 xl:p-10">
                    {!activeWorkflow ? (
                        <div className="space-y-10 sm:space-y-12 py-6 sm:py-12">
                            <div className="text-center space-y-4">
                                <h3 className="text-[24px] sm:text-[28px] font-black text-slate-800 tracking-tight">
                                    Initiate Operational Access
                                </h3>
                                <p className="text-slate-500 font-medium max-w-md mx-auto text-sm sm:text-base px-2">
                                    Select the type of infrastructure access required for your
                                    mission.
                                </p>
                            </div>

                            {isCheckingSub ? (
                                <div className="flex items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <Loader2 className="size-4 text-slate-400 animate-spin" />
                                    <span className="text-sm text-slate-500 font-medium">
                                        Checking subscription status…
                                    </span>
                                </div>
                            ) : hasActiveSubscription ? (
                                <div className="flex items-start gap-3 p-4 bg-green-50 rounded-2xl border border-green-200">
                                    <CheckCircle className="size-5 text-green-600 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-sm font-bold text-green-800">
                                            {activePlanName || 'Subscription'} — Active Subscription
                                        </p>
                                        <p className="text-xs text-green-700 mt-0.5">
                                            Booking fee covered by your plan. No per-booking charge.
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <div className="p-4 bg-amber-50 rounded-2xl border border-amber-200">
                                    <p className="text-sm font-bold text-amber-800">
                                        No active subscription
                                    </p>
                                    <p className="text-xs text-amber-700 mt-0.5">
                                        A per-booking fee will apply. You&apos;ll be prompted to pay
                                        before submitting.
                                    </p>
                                </div>
                            )}

                            <div className="grid sm:grid-cols-2 gap-4 sm:gap-8">
                                <WorkflowCard
                                    title="Planned TOAL"
                                    subtitle="Authorised Intent"
                                    tone="blue"
                                    icon={Plane}
                                    onClick={() => onSelectWorkflow('toal')}
                                />

                                {site.clzEnabled ? (
                                    <WorkflowCard
                                        title="Emergency & Recovery"
                                        subtitle="Recovery Planning"
                                        tone="orange"
                                        icon={Bell}
                                        onClick={() => onSelectWorkflow('clz')}
                                    />
                                ) : (
                                    <div className="min-h-55 sm:aspect-square bg-slate-50 border-2 border-dashed border-slate-200 rounded-4xl p-6 sm:p-8 flex flex-col items-center justify-center gap-4 opacity-50 grayscale">
                                        <Shield className="size-10 text-slate-400" />
                                        <p className="text-sm font-bold text-slate-400 text-center">
                                            Emergency &amp; Recovery Unavailable for this Site
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    ) : (
                        <div className="space-y-8 sm:space-y-12">
                            <BookingStepper
                                step={step}
                                activeWorkflow={activeWorkflow}
                                onDiscardRequest={onDiscardRequest}
                            />

                            <AnimatePresence mode="wait">
                                {step === 1 && (
                                    <Step1BookingDetails
                                        site={site}
                                        availabilitySlots={availabilitySlots}
                                        isLoadingAvailability={isLoadingAvailability}
                                        onCalendarSlotSelect={onCalendarSlotSelect}
                                        startDate={startDate}
                                        startTime={startTime}
                                        endDate={endDate}
                                        endTime={endTime}
                                        operationReference={operationReference}
                                        droneModel={droneModel}
                                        missionIntent={missionIntent}
                                        onStartDateChange={onStartDateChange}
                                        onStartTimeChange={onStartTimeChange}
                                        onEndDateChange={onEndDateChange}
                                        onEndTimeChange={onEndTimeChange}
                                        onOperationReferenceChange={onOperationReferenceChange}
                                        onDroneModelChange={onDroneModelChange}
                                        onMissionIntentChange={onMissionIntentChange}
                                        onStepChange={onStepChange}
                                    />
                                )}

                                {step === 2 && (
                                    <Step2PolicyEvidence
                                        site={site}
                                        policyAcknowledged={policyAcknowledged}
                                        onPolicyAcknowledgedChange={onPolicyAcknowledgedChange}
                                        attachedFiles={attachedFiles}
                                        onAttachedFilesChange={onAttachedFilesChange}
                                        onStepChange={onStepChange}
                                    />
                                )}

                                {step === 3 && (
                                    <Step3ReviewSubmit
                                        site={site}
                                        activeWorkflow={activeWorkflow}
                                        startDate={startDate}
                                        startTime={startTime}
                                        endDate={endDate}
                                        endTime={endTime}
                                        operationReference={operationReference}
                                        droneModel={droneModel}
                                        missionIntent={missionIntent}
                                        hasActiveSubscription={hasActiveSubscription}
                                        subscriptionPlanName={activePlanName}
                                        slotCount={slotCount}
                                        slotFee={slotFee}
                                        platformFee={platformFee}
                                        totalCost={totalCost}
                                        paymentCard={paymentCard}
                                        isPaymentCardLoading={isPaymentCardLoading}
                                        onRequestPaymentSetup={onRequestPaymentSetup}
                                        paygClientSecret={paygClientSecret}
                                        paygPaymentIntentId={paygPaymentIntentId}
                                        isCreatingIntent={isCreatingIntent}
                                        onCreatePaygIntent={onCreatePaygIntent}
                                        conflictAcknowledged={conflictAcknowledged}
                                        onConflictAcknowledgedChange={onConflictAcknowledgedChange}
                                        isSubmitting={isSubmitting}
                                        onStepChange={onStepChange}
                                        onSubmit={onSubmit}
                                    />
                                )}
                            </AnimatePresence>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
