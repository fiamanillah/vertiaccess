import type { BookingRequest, Site } from '../../types';
import { Clock, Info, ArrowRight } from 'lucide-react';
import { motion } from 'motion/react';
import { DeconflictionCalendar } from '../DeconflictionCalendar';
import { getMinimumAllowedDate, validateOperationDate } from '../../utils/dateValidation';
import { useState } from 'react';

interface Step1BookingDetailsProps {
    site: Site;
    existingBookings: BookingRequest[];
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
    existingBookings,
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
    // Local validation error state (doesn't need to be lifted)
    const [startDateError, setStartDateError] = useState<string>('');
    const [endDateError, setEndDateError] = useState<string>('');

    const minAllowedDate = getMinimumAllowedDate();

    const formatLocalDate = (date: Date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    };

    const handleStartDateChange = (value: string) => {
        onStartDateChange(value);
        // Auto-set end date if not already set
        if (!endDate) onEndDateChange(value);

        const validation = validateOperationDate(value);
        setStartDateError(validation.isValid ? '' : validation.errorMessage || '');
    };

    const handleEndDateChange = (value: string) => {
        onEndDateChange(value);
        const validation = validateOperationDate(value);
        setEndDateError(validation.isValid ? '' : validation.errorMessage || '');
    };

    const isStep1Valid =
        startDate && startTime && endDate && endTime && droneModel && missionIntent;

    return (
        <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-10"
        >
            <div className="space-y-6">
                {/* Deconfliction calendar */}
                <div className="space-y-4">
                    <div className="flex items-center gap-2 text-blue-600">
                        <Clock className="size-4" />
                        <h4 className="text-sm font-bold uppercase tracking-widest">
                            Site Availability Matrix
                        </h4>
                    </div>
                    <div className="rounded-[28px] overflow-hidden border border-slate-100 shadow-sm">
                        <DeconflictionCalendar
                            siteId={site.id}
                            siteName={site.name}
                            existingBookings={existingBookings}
                            pendingStartDate={startDate}
                            pendingStartTime={startTime}
                            pendingEndDate={endDate}
                            pendingEndTime={endTime}
                            isLoading={isLoadingAvailability}
                            onSlotClick={onCalendarSlotSelect}
                        />
                    </div>
                </div>

                {/* Date/time inputs */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                            Access Start
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={startDate}
                                onChange={e => handleStartDateChange(e.target.value)}
                                min={minAllowedDate}
                                className="flex-1 h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-medium transition-all"
                            />
                            <input
                                type="time"
                                value={startTime}
                                onChange={e => onStartTimeChange(e.target.value)}
                                className="w-27.5 h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-medium transition-all"
                            />
                        </div>
                        {startDateError && (
                            <p className="text-red-500 text-xs mt-1">{startDateError}</p>
                        )}
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                            Access End
                        </label>
                        <div className="flex gap-2">
                            <input
                                type="date"
                                value={endDate}
                                onChange={e => handleEndDateChange(e.target.value)}
                                min={startDate || minAllowedDate}
                                className="flex-1 h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-medium transition-all"
                            />
                            <input
                                type="time"
                                value={endTime}
                                onChange={e => onEndTimeChange(e.target.value)}
                                className="w-27.5 h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-medium transition-all"
                            />
                        </div>
                        {endDateError && (
                            <p className="text-red-500 text-xs mt-1">{endDateError}</p>
                        )}
                    </div>
                </div>

                {/* 5-day notice banner */}
                <div className="p-4 bg-blue-50 border border-blue-100 rounded-xl flex gap-3">
                    <Info className="size-4 text-blue-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-blue-800 leading-relaxed font-medium">
                        <span className="font-bold">5 Working Day Notice:</span> All operations must
                        be scheduled with at least 5 working days' notice to ensure proper
                        coordination and safety compliance.
                    </p>
                </div>

                {/* Operation metadata */}
                <div className="grid md:grid-cols-2 gap-8">
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                            Operation Reference
                        </label>
                        <input
                            type="text"
                            value={operationReference}
                            onChange={e => onOperationReferenceChange(e.target.value)}
                            placeholder="e.g., OP-SURVEY-001"
                            className="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-medium transition-all"
                        />
                    </div>
                    <div className="space-y-3">
                        <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                            Drone Model <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={droneModel}
                            onChange={e => onDroneModelChange(e.target.value)}
                            placeholder="e.g., DJI Mavic 3"
                            className="w-full h-14 px-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-medium transition-all"
                        />
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-widest ml-1">
                        Mission Intent <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={missionIntent}
                        onChange={e => onMissionIntentChange(e.target.value)}
                        placeholder="Describe your mission objectives and operational requirements..."
                        rows={4}
                        className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-blue-600/5 focus:border-blue-600 outline-none font-medium transition-all resize-none"
                    />
                </div>
            </div>

            <div className="flex justify-end">
                <button
                    onClick={() => onStepChange(2)}
                    disabled={!isStep1Valid}
                    className={`px-8 py-4 rounded-2xl font-bold text-sm transition-all flex items-center gap-2 ${
                        isStep1Valid
                            ? 'bg-blue-600 text-white hover:bg-blue-700 shadow-lg'
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
