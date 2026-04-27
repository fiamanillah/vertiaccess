import type { Site } from '../../types';
import type { PublicAvailabilitySlot } from '../../lib/bookings';
import { Clock, Info, ArrowRight, AlertTriangle } from 'lucide-react';
import { motion } from 'motion/react';
import { DeconflictionCalendar } from '../DeconflictionCalendar';
import { getMinimumAllowedDate, validateOperationDate } from '../../utils/dateValidation';
import { useState, useMemo } from 'react';

interface Step1BookingDetailsProps {
    site: Site;
    /** Public availability slots from no-auth API */
    availabilitySlots: PublicAvailabilitySlot[];
    isLoadingAvailability?: boolean;
    onCalendarSlotSelect: (slotStart: Date) => void;
    // Lifted state from parent
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
    onStepChange: (step: 2 | 3) => void;
}

export function Step1BookingDetails({
    site,
    availabilitySlots,
    isLoadingAvailability = false,
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
}: Step1BookingDetailsProps) {
    const [startDateError, setStartDateError] = useState('');
    const [endDateError, setEndDateError] = useState('');

    const minAllowedDate = getMinimumAllowedDate();

    const handleStartDateChange = (value: string) => {
        onStartDateChange(value);
        if (!endDate) onEndDateChange(value);
        const validation = validateOperationDate(value);
        setStartDateError(validation.isValid ? '' : validation.errorMessage || '');
    };

    const handleEndDateChange = (value: string) => {
        onEndDateChange(value);
        const validation = validateOperationDate(value);
        setEndDateError(validation.isValid ? '' : validation.errorMessage || '');
    };

    // Check if current selection has a conflict
    const hasConflict = useMemo(() => {
        if (!startDate || !startTime || !endDate || !endTime) return false;
        const ps = new Date(`${startDate}T${startTime}:00`);
        const pe = new Date(`${endDate}T${endTime}:00`);
        if (Number.isNaN(ps.getTime()) || Number.isNaN(pe.getTime())) return false;
        return availabilitySlots.some(s => {
            const bs = new Date(s.startTime);
            const be = new Date(s.endTime);
            return bs < pe && be > ps;
        });
    }, [availabilitySlots, startDate, startTime, endDate, endTime]);

    // Same-day validation
    const crossesMidnight = startDate && endDate && startDate !== endDate;

    const isStep1Valid =
        startDate &&
        startTime &&
        endDate &&
        endTime &&
        droneModel &&
        missionIntent &&
        !crossesMidnight &&
        !startDateError &&
        !endDateError;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-8"
        >
            {/* Deconfliction Calendar */}
            <div className="space-y-3">
                <div className="flex items-center gap-2">
                    <Clock className="size-4 text-blue-600" />
                    <h4 className="text-sm font-bold text-slate-700 uppercase tracking-widest">
                        Site Availability
                    </h4>
                    {isLoadingAvailability && (
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                            <span className="size-2.5 border border-blue-400 border-t-transparent rounded-full animate-spin inline-block" />
                            Loading…
                        </span>
                    )}
                </div>
                <DeconflictionCalendar
                    siteId={site.id}
                    siteName={site.name}
                    availabilitySlots={availabilitySlots}
                    pendingStartDate={startDate}
                    pendingStartTime={startTime}
                    pendingEndDate={endDate}
                    pendingEndTime={endTime}
                    isLoading={isLoadingAvailability}
                    onSlotClick={onCalendarSlotSelect}
                />
            </div>

            {/* Conflict warning */}
            {hasConflict && (
                <div className="flex items-start gap-3 p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                    <AlertTriangle className="size-4 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-orange-900">Booking Conflict</p>
                        <p className="text-xs text-orange-700 mt-0.5">
                            Your selected time overlaps with an existing booking. You can still
                            proceed — but please coordinate with the site if needed.
                        </p>
                    </div>
                </div>
            )}

            {/* Cross-midnight error */}
            {crossesMidnight && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-200 rounded-2xl">
                    <AlertTriangle className="size-4 text-red-600 shrink-0 mt-0.5" />
                    <p className="text-sm font-bold text-red-800">
                        Bookings must be within a single calendar day (no crossing midnight).
                    </p>
                </div>
            )}

            {/* Date/time inputs */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Access Start <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="date"
                            value={startDate}
                            onChange={e => handleStartDateChange(e.target.value)}
                            min={minAllowedDate}
                            className="flex-1 min-w-0 h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none font-medium transition-all text-sm"
                        />
                        <input
                            type="time"
                            value={startTime}
                            onChange={e => onStartTimeChange(e.target.value)}
                            className="w-full sm:w-27.5 h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none font-medium transition-all text-sm"
                        />
                    </div>
                    {startDateError && (
                        <p className="text-red-500 text-xs mt-1">{startDateError}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Access End <span className="text-red-500">*</span>
                    </label>
                    <div className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="date"
                            value={endDate}
                            onChange={e => handleEndDateChange(e.target.value)}
                            min={startDate || minAllowedDate}
                            className="flex-1 min-w-0 h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none font-medium transition-all text-sm"
                        />
                        <input
                            type="time"
                            value={endTime}
                            onChange={e => onEndTimeChange(e.target.value)}
                            className="w-full sm:w-27.5 h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none font-medium transition-all text-sm"
                        />
                    </div>
                    {endDateError && <p className="text-red-500 text-xs mt-1">{endDateError}</p>}
                </div>
            </div>

            {/* 5-day notice */}
            <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex gap-3">
                <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-800 leading-relaxed font-medium">
                    <span className="font-bold">5 Working Day Notice:</span> All operations must be
                    scheduled with at least 5 working days' notice to ensure proper coordination and
                    safety compliance.
                </p>
            </div>

            {/* Operation metadata */}
            <div className="grid md:grid-cols-2 gap-6">
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Operation Reference
                    </label>
                    <input
                        type="text"
                        value={operationReference}
                        onChange={e => onOperationReferenceChange(e.target.value)}
                        placeholder="e.g., OP-SURVEY-001"
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none font-medium transition-all text-sm"
                    />
                </div>
                <div className="space-y-2">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                        Drone Model <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={droneModel}
                        onChange={e => onDroneModelChange(e.target.value)}
                        placeholder="e.g., DJI Mavic 3"
                        className="w-full h-12 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none font-medium transition-all text-sm"
                    />
                </div>
            </div>

            <div className="space-y-2">
                <label className="text-xs font-bold text-slate-500 uppercase tracking-widest">
                    Mission Intent <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={missionIntent}
                    onChange={e => onMissionIntentChange(e.target.value)}
                    placeholder="Describe your mission objectives and operational requirements…"
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/10 focus:border-blue-600 outline-none font-medium transition-all resize-none text-sm"
                />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 pt-2">
                <button
                    onClick={() => onStepChange(2)}
                    disabled={!isStep1Valid}
                    className={`w-full sm:w-auto px-8 py-3.5 rounded-2xl font-bold text-sm transition-all flex items-center justify-center gap-2 ${
                        isStep1Valid
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg shadow-blue-500/20 active:scale-[0.98]'
                            : 'bg-slate-100 text-slate-400 cursor-not-allowed'
                    }`}
                >
                    Continue to Policy Review
                    <ArrowRight className="size-4" />
                </button>
            </div>
        </motion.div>
    );
}
