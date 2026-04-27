import type { Site } from '../../types';
import type { PublicAvailabilitySlot } from '../../lib/bookings';
import { Clock, Info, ArrowRight, AlertTriangle, Calendar as CalendarIcon } from 'lucide-react';
import { motion } from 'motion/react';
import { getMinimumAllowedDate, validateOperationDate } from '../../utils/dateValidation';
import { DateTimePicker } from '../DateTimePicker';
import { useState, useMemo } from 'react';

import { format, parseISO, startOfDay } from 'date-fns';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '../ui/select';
import { DeconflictionCalendar } from '../DeconflictionCalendar';


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

    const toMinutes = (time: string) => {
        if (!time) return null;
        const parts = time.split(':');
        if (parts.length < 2) return null;
        const h = Number(parts[0]);
        const m = Number(parts[1]);
        if (Number.isNaN(h) || Number.isNaN(m)) return null;

        return h * 60 + m;
    };

    const minutesToTime = (minutes: number) => {
        const safeMinutes = Math.max(0, Math.min(minutes, 23 * 60 + 59));
        const h = Math.floor(safeMinutes / 60);
        const m = safeMinutes % 60;
        return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
    };

    const handleStartDateChange = (value: string) => {
        onStartDateChange(value);
        if (!endDate || endDate < value) onEndDateChange(value);
        const validation = validateOperationDate(value);
        setStartDateError(validation.isValid ? '' : validation.errorMessage || '');
    };

    const handleEndDateChange = (value: string) => {
        const normalizedValue = startDate && value < startDate ? startDate : value;
        onEndDateChange(normalizedValue);
        const validation = validateOperationDate(value);
        setEndDateError(validation.isValid ? '' : validation.errorMessage || '');
    };

    const handleStartTimeChange = (value: string) => {
        onStartTimeChange(value);

        const startMinutes = toMinutes(value);
        const endMinutes = toMinutes(endTime);
        if (startMinutes == null) return;

        if (!endDate && startDate) {
            onEndDateChange(startDate);
        }

        if (!endTime) {
            onEndTimeChange(minutesToTime(startMinutes + 60));
            return;
        }

        if (
            startDate &&
            endDate &&
            startDate === endDate &&
            endMinutes != null &&
            endMinutes <= startMinutes
        ) {
            onEndTimeChange(minutesToTime(startMinutes + 60));
        }
    };

    const handleEndTimeChange = (value: string) => {
        const endMinutes = toMinutes(value);
        const startMinutes = toMinutes(startTime);

        if (
            startDate &&
            endDate &&
            startDate === endDate &&
            endMinutes != null &&
            startMinutes != null &&
            endMinutes <= startMinutes
        ) {
            onEndTimeChange(minutesToTime(startMinutes + 60));
            return;
        }

        onEndTimeChange(value);
    };

    const timeOptions = useMemo(() => {
        const options = [];
        for (let h = 0; h < 24; h++) {
            for (let m = 0; m < 60; m += 30) {
                const hh = String(h).padStart(2, '0');
                const mm = String(m).padStart(2, '0');
                options.push(`${hh}:${mm}`);
            }
        }
        // Ensure current values are in options if they aren't multiples of 30
        if (startTime && !options.includes(startTime)) options.push(startTime);
        if (endTime && !options.includes(endTime)) options.push(endTime);
        return options.sort();
    }, [startTime, endTime]);


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
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-12 px-4 sm:px-8 pb-10"
        >
            {/* Deconfliction Calendar */}
            <div className="space-y-4">
                <div className="flex items-center gap-3">
                    <div className="size-8 bg-blue-100 rounded-xl flex items-center justify-center">
                        <Clock className="size-4 text-blue-600" />
                    </div>
                    <h4 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">
                        Site Availability Matrix
                    </h4>
                    {isLoadingAvailability && (
                        <div className="flex items-center gap-2 ml-auto">
                            <span className="size-3 border-2 border-blue-600/20 border-t-blue-600 rounded-full animate-spin" />
                            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Syncing…</span>
                        </div>
                    )}
                </div>
                <div className="rounded-3xl overflow-hidden shadow-2xl shadow-slate-200/50 border border-slate-100">
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
            <div className="grid md:grid-cols-2 gap-8">
                <DateTimePicker
                    label="Operational Window Start"
                    dateValue={startDate}
                    timeValue={startTime}
                    onDateChange={handleStartDateChange}
                    onTimeChange={handleStartTimeChange}
                    minimumDate={minAllowedDate}
                    required
                />
                <DateTimePicker
                    label="Operational Window End"
                    dateValue={endDate}
                    timeValue={endTime}
                    onDateChange={handleEndDateChange}
                    onTimeChange={handleEndTimeChange}
                    minimumDate={startDate || minAllowedDate}
                    required
                />
            </div>
            {(startDateError || endDateError) && (
                <div className="space-y-1 ml-1">
                    {startDateError && (
                        <p className="text-red-500 text-[11px] font-bold flex items-center gap-1.5">
                            <AlertTriangle className="size-3" />
                            Start: {startDateError}
                        </p>
                    )}
                    {endDateError && (
                        <p className="text-red-500 text-[11px] font-bold flex items-center gap-1.5">
                            <AlertTriangle className="size-3" />
                            End: {endDateError}
                        </p>
                    )}
                </div>
            )}

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
            <div className="grid md:grid-cols-2 gap-8">
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                        Operation Reference
                    </label>
                    <input
                        type="text"
                        value={operationReference}
                        onChange={e => onOperationReferenceChange(e.target.value)}
                        placeholder="e.g., OP-SURVEY-001"
                        className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold transition-all text-sm shadow-sm"
                    />
                </div>
                <div className="space-y-3">
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                        Aircraft Model <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={droneModel}
                        onChange={e => onDroneModelChange(e.target.value)}
                        placeholder="e.g., DJI Mavic 3 Enterprise"
                        className="w-full h-14 px-5 bg-white border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold transition-all text-sm shadow-sm"
                    />
                </div>
            </div>

            <div className="space-y-3">
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    Mission Intent & Flight Objectives <span className="text-red-500">*</span>
                </label>
                <textarea
                    value={missionIntent}
                    onChange={e => onMissionIntentChange(e.target.value)}
                    placeholder="Provide a detailed description of your mission objectives, flight plan, and any specific operational requirements…"
                    rows={5}
                    className="w-full px-5 py-4 bg-white border border-slate-200 rounded-3xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-bold transition-all resize-none text-sm shadow-sm leading-relaxed"
                />
            </div>

            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 sm:gap-4 pt-4 border-t border-slate-100">
                <button
                    onClick={() => onStepChange(2)}
                    disabled={!isStep1Valid}
                    className={`w-full sm:w-auto h-12 sm:h-13 px-8 sm:px-10 rounded-2xl font-black text-sm transition-all flex items-center justify-center gap-2 ${isStep1Valid
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
