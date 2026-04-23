import type { BookingRequest } from '../types';
import { useMemo, useState } from 'react';
import { Clock, AlertTriangle, User, ChevronLeft, ChevronRight } from 'lucide-react';

interface DeconflictionCalendarProps {
    siteId: string;
    siteName: string;
    existingBookings: BookingRequest[];
    pendingStartDate: string;
    pendingStartTime: string;
    pendingEndDate: string;
    pendingEndTime: string;
    isLoading?: boolean;
    onSlotClick?: (slotStart: Date) => void;
}

export function DeconflictionCalendar({
    siteId,
    siteName,
    existingBookings,
    pendingStartDate,
    pendingStartTime,
    pendingEndDate,
    pendingEndTime,
    isLoading = false,
    onSlotClick,
}: DeconflictionCalendarProps) {
    const [weekOffset, setWeekOffset] = useState(0);

    const relevantBookings = useMemo(
        () =>
            existingBookings.filter(booking => {
                const status = String(booking.status || '').toUpperCase();
                return status !== 'CANCELLED' && status !== 'REJECTED';
            }),
        [existingBookings]
    );

    const weekStart = useMemo(() => {
        const date = new Date();
        const day = date.getDay();
        const diffToMonday = (day + 6) % 7;
        date.setDate(date.getDate() - diffToMonday + weekOffset * 7);
        date.setHours(0, 0, 0, 0);
        return date;
    }, [weekOffset]);

    const days = useMemo(() => {
        const nextDays: Date[] = [];
        for (let i = 0; i < 7; i++) {
            const date = new Date(weekStart);
            date.setDate(weekStart.getDate() + i);
            nextDays.push(date);
        }
        return nextDays;
    }, [weekStart]);

    const getHourSlots = () => {
        const slots = [];
        for (let hour = 6; hour <= 20; hour++) {
            slots.push(hour);
        }
        return slots;
    };

    const isTimeSlotBooked = (date: Date, hour: number) => {
        const slotStart = new Date(date);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(slotStart);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        return relevantBookings.filter(booking => {
            const bookingStart = new Date(booking.startTime);
            const bookingEnd = new Date(booking.endTime);
            return bookingStart < slotEnd && bookingEnd > slotStart;
        });
    };

    const isPendingSlot = (date: Date, hour: number) => {
        if (!pendingStartDate || !pendingStartTime || !pendingEndDate || !pendingEndTime) {
            return false;
        }

        const pendingStart = new Date(`${pendingStartDate}T${pendingStartTime}:00`);
        const pendingEnd = new Date(`${pendingEndDate}T${pendingEndTime}:00`);

        const slotDate = new Date(date);
        slotDate.setHours(hour, 0, 0, 0);

        // Check if this slot falls within the pending booking period
        return slotDate >= pendingStart && slotDate < pendingEnd;
    };

    const hasConflict = (date: Date, hour: number) => {
        return isTimeSlotBooked(date, hour).length > 0 && isPendingSlot(date, hour);
    };

    const isSlotInPast = (date: Date, hour: number) => {
        const slot = new Date(date);
        slot.setHours(hour, 0, 0, 0);
        return slot < new Date();
    };

    const bookedDateLabels = useMemo(() => {
        const unique = new Set(
            relevantBookings.map(booking => new Date(booking.startTime).toDateString())
        );

        return Array.from(unique)
            .map(dateStr => new Date(dateStr))
            .sort((a, b) => a.getTime() - b.getTime())
            .map(date =>
                date.toLocaleDateString('en-GB', {
                    weekday: 'short',
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                })
            );
    }, [relevantBookings]);

    // Check if there's any conflict in the entire booking period
    const checkForAnyConflict = () => {
        if (!pendingStartDate || !pendingStartTime || !pendingEndDate || !pendingEndTime) {
            return false;
        }

        for (const day of days) {
            for (let hour = 6; hour <= 20; hour++) {
                if (hasConflict(day, hour)) {
                    return true;
                }
            }
        }
        return false;
    };

    const hasAnyConflict = checkForAnyConflict();

    return (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
            <div className="bg-indigo-50 p-4 border-b border-indigo-200">
                <div className="flex items-center gap-2 mb-2">
                    <Clock className="size-5 text-indigo-700" />
                    <h3 className="text-indigo-900">Site Availability Calendar</h3>
                </div>
                <p className="text-sm text-indigo-800">
                    {siteName} ({siteId.slice(0, 8)}) availability. View existing bookings to plan
                    your operation and coordinate with other operators.
                </p>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setWeekOffset(prev => prev - 1)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50"
                    >
                        <ChevronLeft className="size-3.5" />
                        Previous Week
                    </button>
                    <button
                        type="button"
                        onClick={() => setWeekOffset(prev => prev + 1)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium rounded-md border border-indigo-200 text-indigo-700 bg-white hover:bg-indigo-50"
                    >
                        Next Week
                        <ChevronRight className="size-3.5" />
                    </button>
                </div>
            </div>

            {isLoading && (
                <div className="bg-slate-50 border-b border-slate-200 p-3">
                    <p className="text-sm text-slate-600">
                        Loading existing bookings for this site...
                    </p>
                </div>
            )}

            {!isLoading && (
                <div className="bg-slate-50 border-b border-slate-200 p-3">
                    <p className="text-xs text-slate-700">
                        {bookedDateLabels.length > 0
                            ? `Booked dates (${bookedDateLabels.length}): ${bookedDateLabels.join(' | ')}`
                            : 'No booked dates found for this site yet.'}
                    </p>
                </div>
            )}

            {hasAnyConflict && (
                <div className="bg-orange-50 border-b border-orange-200 p-3">
                    <div className="flex items-start gap-2">
                        <AlertTriangle className="size-4 text-orange-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-orange-900">
                                <span className="font-medium">⚠️ BOOKING CONFLICT DETECTED!</span>
                            </p>
                            <p className="text-xs text-orange-800 mt-1">
                                Your selected time overlaps with existing bookings. Please choose a
                                different time slot or contact the site owner for coordination.
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {pendingStartDate && pendingStartTime && pendingEndDate && pendingEndTime && (
                <div className="bg-blue-50 border-b border-blue-200 p-3">
                    <div className="flex items-start gap-2">
                        <User className="size-4 text-blue-600 shrink-0 mt-0.5" />
                        <div>
                            <p className="text-sm text-blue-900">
                                <span className="font-medium">Your booking preview</span> is shown
                                in blue below.
                            </p>
                            <p className="text-xs text-blue-800 mt-1">
                                {new Date(`${pendingStartDate}T${pendingStartTime}`).toLocaleString(
                                    'en-GB',
                                    {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    }
                                )}{' '}
                                -{' '}
                                {new Date(`${pendingEndDate}T${pendingEndTime}`).toLocaleString(
                                    'en-GB',
                                    {
                                        weekday: 'short',
                                        day: 'numeric',
                                        month: 'short',
                                        hour: '2-digit',
                                        minute: '2-digit',
                                    }
                                )}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            <div className="overflow-x-auto">
                <div className="min-w-175">
                    {/* Calendar Header */}
                    <div className="grid grid-cols-8 border-b border-gray-200 bg-gray-50">
                        <div className="p-2 text-center text-sm text-gray-600">Time</div>
                        {days.map((day, index) => (
                            <div key={index} className="p-2 text-center border-l border-gray-200">
                                <p className="text-xs text-gray-600">
                                    {day.toLocaleDateString('en-US', { weekday: 'short' })}
                                </p>
                                <p className="text-sm">
                                    {day.toLocaleDateString('en-US', {
                                        month: 'short',
                                        day: 'numeric',
                                    })}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Calendar Grid */}
                    {getHourSlots().map(hour => (
                        <div key={hour} className="grid grid-cols-8 border-b border-gray-200">
                            <div className="p-2 text-center text-sm text-gray-600 bg-gray-50">
                                {hour.toString().padStart(2, '0')}:00
                            </div>
                            {days.map((day, dayIndex) => {
                                const bookings = isTimeSlotBooked(day, hour);
                                const hasBooking = bookings.length > 0;
                                const isPending = isPendingSlot(day, hour);
                                const conflict = hasConflict(day, hour);
                                const isPast = isSlotInPast(day, hour);
                                const slotStart = new Date(day);
                                slotStart.setHours(hour, 0, 0, 0);
                                const canSelect = !hasBooking && !isPast && !!onSlotClick;

                                return (
                                    <div
                                        key={dayIndex}
                                        onClick={() => {
                                            if (canSelect) {
                                                onSlotClick?.(slotStart);
                                            }
                                        }}
                                        className={`p-2 border-l border-gray-200 min-h-12.5 ${
                                            conflict
                                                ? 'bg-orange-100'
                                                : hasBooking
                                                  ? 'bg-red-50'
                                                  : isPast
                                                    ? 'bg-slate-50'
                                                    : isPending
                                                      ? 'bg-blue-100'
                                                      : 'bg-white hover:bg-blue-50'
                                        } ${canSelect ? 'cursor-pointer' : 'cursor-default'} transition-colors`}
                                    >
                                        {hasBooking && (
                                            <div className="space-y-1 mb-1">
                                                {bookings.map((booking, i) => (
                                                    <div
                                                        key={i}
                                                        className={`rounded px-2 py-1 text-xs border ${
                                                            booking.useCategory === 'emergency_recovery' ||
                                                            (booking.useCategory as string) === 'emergency_clz'
                                                                ? 'bg-amber-200 border-amber-400'
                                                                : 'bg-red-200 border-red-400'
                                                        }`}
                                                    >
                                                        <p
                                                            className={`truncate flex items-center gap-1 ${
                                                                booking.useCategory === 'emergency_recovery' ||
                                                                (booking.useCategory as string) === 'emergency_clz'
                                                                    ? 'text-amber-900'
                                                                    : 'text-red-900'
                                                            }`}
                                                        >
                                                            {(booking.useCategory === 'emergency_recovery' ||
                                                                (booking.useCategory as string) === 'emergency_clz') && (
                                                                <span className="inline-block px-1 bg-amber-600 text-white rounded text-[8px] font-bold">
                                                                    ERS
                                                                </span>
                                                            )}
                                                            Operator{' '}
                                                            {booking.operatorId.substring(0, 4)}
                                                        </p>
                                                        <p
                                                            className={`text-xs ${
                                                                booking.useCategory === 'emergency_recovery' ||
                                                                (booking.useCategory as string) === 'emergency_clz'
                                                                    ? 'text-amber-700'
                                                                    : 'text-red-700'
                                                            }`}
                                                        >
                                                            {new Date(booking.startTime).getHours()}
                                                            :00 -{' '}
                                                            {new Date(booking.endTime).getHours()}
                                                            :00
                                                        </p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                        {isPending && (
                                            <div
                                                className={`${conflict ? 'bg-orange-200 border-orange-400' : 'bg-blue-200 border-blue-400'} border rounded px-2 py-1 text-xs`}
                                            >
                                                <p
                                                    className={`${conflict ? 'text-orange-900' : 'text-blue-900'} truncate`}
                                                >
                                                    {conflict ? '⚠️ CONFLICT' : 'Your Booking'}
                                                </p>
                                            </div>
                                        )}
                                        {!hasBooking && !isPending && !isPast && onSlotClick && (
                                            <p className="text-[10px] text-slate-400">
                                                Click to select
                                            </p>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    ))}
                </div>
            </div>

            {/* Legend */}
            <div className="bg-gray-50 p-4 border-t border-gray-200">
                <h4 className="text-sm mb-2">Legend:</h4>
                <div className="flex flex-wrap gap-4 text-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-white border border-gray-300 rounded"></div>
                        <span className="text-gray-700">Available</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-red-200 border border-red-400 rounded"></div>
                        <span className="text-gray-700">Booked</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-blue-200 border border-blue-400 rounded"></div>
                        <span className="text-gray-700">Your Booking</span>
                    </div>
                    <div className="flex items-center gap-2">
                        <div className="w-4 h-4 bg-orange-200 border border-orange-400 rounded"></div>
                        <span className="text-gray-700">Conflict</span>
                    </div>
                </div>
                <p className="text-xs text-gray-600 mt-3">
                    Note: Operator identities are anonymized. Click an available slot to auto-fill
                    booking times.
                </p>
            </div>
        </div>
    );
}
