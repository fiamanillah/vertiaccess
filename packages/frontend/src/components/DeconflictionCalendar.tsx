import { useMemo, useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, CalendarDays, AlertTriangle, Clock } from 'lucide-react';
import type { PublicAvailabilitySlot } from '../lib/bookings';

interface DeconflictionCalendarProps {
    siteId: string;
    siteName: string;
    /** Availability slots from public API — anonymized { startTime, endTime, status, useCategory } */
    availabilitySlots: PublicAvailabilitySlot[];
    pendingStartDate: string;
    pendingStartTime: string;
    pendingEndDate: string;
    pendingEndTime: string;
    isLoading?: boolean;
    /** Called when user clicks a free slot — provides slot start Date */
    onSlotClick?: (slotStart: Date) => void;
}

const HOUR_START = 0;
const HOUR_END = 24; // 00:00 – 24:00 (slot starts 00-23)

function getWeekStartFromDate(date: Date, offset = 0): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diffToMonday = (day + 6) % 7;
    d.setDate(d.getDate() - diffToMonday + offset * 7);
    d.setHours(0, 0, 0, 0);
    return d;
}

export function DeconflictionCalendar({
    siteId: _siteId,
    siteName,
    availabilitySlots,
    pendingStartDate,
    pendingStartTime,
    pendingEndDate,
    pendingEndTime,
    isLoading = false,
    onSlotClick,
}: DeconflictionCalendarProps) {
    const [weekOffset, setWeekOffset] = useState(0);

    // When a pending start date is set, auto-navigate to show that week
    useEffect(() => {
        if (!pendingStartDate) return;
        const parsed = new Date(pendingStartDate + 'T00:00:00');
        if (Number.isNaN(parsed.getTime())) return;
        const todayWeekStart = getWeekStartFromDate(new Date(), 0);
        const targetWeekStart = getWeekStartFromDate(parsed, 0);
        const diffWeeks = Math.round(
            (targetWeekStart.getTime() - todayWeekStart.getTime()) / (7 * 24 * 60 * 60 * 1000)
        );
        setWeekOffset(diffWeeks);
    }, [pendingStartDate]);

    const weekStart = useMemo(() => getWeekStartFromDate(new Date(), weekOffset), [weekOffset]);

    const days = useMemo(() => {
        return Array.from({ length: 7 }, (_, i) => {
            const d = new Date(weekStart);
            d.setDate(weekStart.getDate() + i);
            return d;
        });
    }, [weekStart]);

    const hours = useMemo(
        () => Array.from({ length: HOUR_END - HOUR_START }, (_, i) => HOUR_START + i),
        []
    );

    // Pending booking range as Date objects (null if incomplete)
    const pendingRange = useMemo(() => {
        if (!pendingStartDate || !pendingStartTime || !pendingEndDate || !pendingEndTime)
            return null;
        const start = new Date(`${pendingStartDate}T${pendingStartTime}:00`);
        const end = new Date(`${pendingEndDate}T${pendingEndTime}:00`);
        if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return null;
        return { start, end };
    }, [pendingStartDate, pendingStartTime, pendingEndDate, pendingEndTime]);

    // Compute slot states
    function getSlotState(day: Date, hour: number) {
        const slotStart = new Date(day);
        slotStart.setHours(hour, 0, 0, 0);
        const slotEnd = new Date(day);
        slotEnd.setHours(hour + 1, 0, 0, 0);

        const isPast = slotStart < new Date();

        const bookedSlots = availabilitySlots.filter(s => {
            const bs = new Date(s.startTime);
            const be = new Date(s.endTime);
            return bs < slotEnd && be > slotStart;
        });

        const hasApproved = bookedSlots.some(s => s.status === 'APPROVED');
        const hasPending = bookedSlots.some(s => s.status === 'PENDING');
        const hasEmergency = bookedSlots.some(
            s =>
                s.useCategory === 'emergency_recovery' ||
                (s.useCategory as string) === 'emergency_clz'
        );

        let isPending = false;
        let isConflict = false;
        if (pendingRange) {
            isPending = slotStart >= pendingRange.start && slotStart < pendingRange.end;
            isConflict = isPending && bookedSlots.length > 0;
        }

        return {
            isPast,
            hasBooking: bookedSlots.length > 0,
            hasApproved,
            hasPending,
            hasEmergency,
            isPending,
            isConflict,
            bookedSlots,
        };
    }

    // Check for any conflict across entire pending window
    const hasAnyConflict = useMemo(() => {
        if (!pendingRange) return false;
        return availabilitySlots.some(s => {
            const bs = new Date(s.startTime);
            const be = new Date(s.endTime);
            return bs < pendingRange.end && be > pendingRange.start;
        });
    }, [availabilitySlots, pendingRange]);

    const totalBookedDates = useMemo(() => {
        const unique = new Set(availabilitySlots.map(s => new Date(s.startTime).toDateString()));
        return unique.size;
    }, [availabilitySlots]);

    const weekStartDay = days[0] ?? weekStart;
    const weekEndDay = days[6] ?? weekStart;
    const weekLabel = `${weekStartDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })} – ${weekEndDay.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })}`;

    const isToday = (d: Date) => {
        const now = new Date();
        return (
            d.getDate() === now.getDate() &&
            d.getMonth() === now.getMonth() &&
            d.getFullYear() === now.getFullYear()
        );
    };

    return (
        <div className="bg-white rounded-3xl border border-slate-200 overflow-hidden shadow-sm">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-linear-to-r from-slate-50 to-white">
                <div className="flex items-center gap-3">
                    <div className="size-9 bg-blue-600 rounded-xl flex items-center justify-center shadow-sm shadow-blue-500/30">
                        <CalendarDays className="size-4 text-white" />
                    </div>
                    <div>
                        <p className="text-xs font-black text-slate-800 uppercase tracking-widest">
                            Availability Matrix
                        </p>
                        <p className="text-[11px] text-slate-500 font-medium mt-0.5">{siteName}</p>
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <button
                        type="button"
                        onClick={() => setWeekOffset(0)}
                        className="h-8 px-3 text-[11px] font-bold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-all"
                    >
                        Today
                    </button>
                    <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-white shadow-sm">
                        <button
                            type="button"
                            onClick={() => setWeekOffset(p => p - 1)}
                            className="size-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all border-r border-slate-200"
                        >
                            <ChevronLeft className="size-4" />
                        </button>
                        <span className="px-3 text-[11px] font-bold text-slate-700 min-w-37 text-center">
                            {weekLabel}
                        </span>
                        <button
                            type="button"
                            onClick={() => setWeekOffset(p => p + 1)}
                            className="size-8 flex items-center justify-center text-slate-500 hover:text-slate-900 hover:bg-slate-50 transition-all border-l border-slate-200"
                        >
                            <ChevronRight className="size-4" />
                        </button>
                    </div>
                </div>
            </div>

            {/* Status bar */}
            {isLoading ? (
                <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-100 flex items-center gap-2">
                    <div className="size-3.5 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-xs text-slate-500 font-medium">
                        Loading availability…
                    </span>
                </div>
            ) : (
                <div className="px-5 py-2.5 bg-slate-50/60 border-b border-slate-100 flex items-center justify-between gap-3">
                    <p className="text-[11px] text-slate-500 font-medium">
                        {totalBookedDates > 0
                            ? `${availabilitySlots.length} booked slot${availabilitySlots.length !== 1 ? 's' : ''} across ${totalBookedDates} date${totalBookedDates !== 1 ? 's' : ''}`
                            : 'No existing bookings — this site is wide open'}
                    </p>
                    {pendingRange && (
                        <div className="flex items-center gap-1.5">
                            <Clock className="size-3 text-blue-600" />
                            <span className="text-[11px] text-blue-700 font-bold">
                                {pendingRange.start.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}{' '}
                                –{' '}
                                {pendingRange.end.toLocaleTimeString([], {
                                    hour: '2-digit',
                                    minute: '2-digit',
                                })}{' '}
                                selected
                            </span>
                        </div>
                    )}
                </div>
            )}

            {/* Conflict warning */}
            {hasAnyConflict && (
                <div className="px-5 py-3 bg-orange-50 border-b border-orange-200 flex items-start gap-2.5">
                    <AlertTriangle className="size-4 text-orange-600 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-xs font-bold text-orange-900">
                            Booking Conflict Detected
                        </p>
                        <p className="text-[11px] text-orange-700 mt-0.5">
                            Your selected window overlaps with an existing booking. Choose a
                            different time or proceed knowing there may be coordination needed.
                        </p>
                    </div>
                </div>
            )}

            {/* Grid */}
            <div className="overflow-x-auto">
                <div style={{ minWidth: 700 }}>
                    {/* Day headers */}
                    <div className="grid grid-cols-8 border-b border-slate-100 bg-slate-50/40">
                        <div className="px-2 py-2.5 text-center">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                                Time
                            </span>
                        </div>
                        {days.map((day, i) => (
                            <div
                                key={i}
                                className={`px-2 py-2.5 text-center border-l border-slate-100 ${isToday(day) ? 'bg-blue-50' : ''}`}
                            >
                                <p
                                    className={`text-[10px] font-bold uppercase tracking-widest ${isToday(day) ? 'text-blue-600' : 'text-slate-400'}`}
                                >
                                    {day.toLocaleDateString('en-GB', { weekday: 'short' })}
                                </p>
                                <p
                                    className={`text-sm font-black mt-0.5 ${isToday(day) ? 'text-blue-700' : 'text-slate-700'}`}
                                >
                                    {day.getDate()}
                                </p>
                                <p className="text-[9px] text-slate-400 font-medium">
                                    {day.toLocaleDateString('en-GB', { month: 'short' })}
                                </p>
                            </div>
                        ))}
                    </div>

                    {/* Hour rows */}
                    <div className="max-h-120 overflow-y-auto custom-scrollbar">
                        {isLoading
                            ? hours.map(hour => (
                                  <div
                                      key={hour}
                                      className="grid grid-cols-8 border-b border-slate-50"
                                  >
                                      <div className="px-3 py-2 text-right bg-slate-50/50">
                                          <span className="text-[11px] text-slate-300 font-bold">
                                              {String(hour).padStart(2, '0')}:00
                                          </span>
                                      </div>
                                      {Array.from({ length: 7 }, (_, i) => (
                                          <div
                                              key={i}
                                              className="border-l border-slate-50 h-9 px-1 py-1"
                                          >
                                              <div className="h-full rounded bg-slate-100 animate-pulse" />
                                          </div>
                                      ))}
                                  </div>
                              ))
                            : hours.map(hour => (
                                  <div
                                      key={hour}
                                      className="grid grid-cols-8 border-b border-slate-50 hover:bg-slate-50/30 transition-colors group"
                                  >
                                      <div className="px-3 py-2 text-right bg-slate-50/50 border-r border-slate-100">
                                          <span className="text-[11px] text-slate-400 font-bold tabular-nums">
                                              {String(hour).padStart(2, '0')}:00
                                          </span>
                                      </div>
                                      {days.map((day, dayIdx) => {
                                          const state = getSlotState(day, hour);
                                          const slotStart = new Date(day);
                                          slotStart.setHours(hour, 0, 0, 0);
                                          const canSelect =
                                              !state.hasBooking && !state.isPast && !!onSlotClick;

                                          let cellBg = '';
                                          let cellBorder = '';
                                          if (state.isConflict) {
                                              cellBg = 'bg-orange-100';
                                              cellBorder = 'border-l-2 border-orange-400';
                                          } else if (state.isPending) {
                                              cellBg = 'bg-blue-100';
                                              cellBorder = 'border-l-2 border-blue-400';
                                          } else if (state.hasApproved && state.hasEmergency) {
                                              cellBg = 'bg-amber-50';
                                              cellBorder = 'border-l border-amber-200';
                                          } else if (state.hasApproved) {
                                              cellBg = 'bg-red-50';
                                              cellBorder = 'border-l border-red-200';
                                          } else if (state.hasPending) {
                                              cellBg = 'bg-yellow-50';
                                              cellBorder = 'border-l border-yellow-200';
                                          } else if (state.isPast) {
                                              cellBg = 'bg-slate-50/60';
                                              cellBorder = 'border-l border-slate-100';
                                          } else if (canSelect) {
                                              cellBg =
                                                  'bg-white hover:bg-emerald-50 cursor-pointer';
                                              cellBorder =
                                                  'border-l border-slate-100 hover:border-emerald-300';
                                          } else {
                                              cellBorder = 'border-l border-slate-100';
                                          }

                                          return (
                                              <div
                                                  key={dayIdx}
                                                  onClick={() =>
                                                      canSelect && onSlotClick?.(slotStart)
                                                  }
                                                  className={`px-1 py-1 min-h-9 transition-all ${cellBg} ${cellBorder} ${isToday(day) && !state.hasBooking && !state.isPending ? 'bg-blue-50/30' : ''}`}
                                              >
                                                  {state.hasBooking && (
                                                      <div className="space-y-0.5">
                                                          {state.bookedSlots.map((slot, si) => (
                                                              <div
                                                                  key={si}
                                                                  className={`rounded px-1.5 py-0.5 text-[9px] font-bold leading-tight ${
                                                                      slot.useCategory ===
                                                                          'emergency_recovery' ||
                                                                      slot.useCategory ===
                                                                          'emergency_clz'
                                                                          ? 'bg-amber-200 text-amber-900'
                                                                          : slot.status ===
                                                                              'PENDING'
                                                                            ? 'bg-yellow-200 text-yellow-900'
                                                                            : 'bg-red-200 text-red-900'
                                                                  }`}
                                                              >
                                                                  {slot.useCategory ===
                                                                      'emergency_recovery' ||
                                                                  slot.useCategory ===
                                                                      'emergency_clz'
                                                                      ? '⚡ ERS'
                                                                      : slot.status === 'PENDING'
                                                                        ? '⏳ Pending'
                                                                        : '✓ Booked'}
                                                              </div>
                                                          ))}
                                                      </div>
                                                  )}
                                                  {state.isPending && !state.isConflict && (
                                                      <div className="rounded px-1.5 py-0.5 text-[9px] font-black bg-blue-300 text-blue-900 leading-tight">
                                                          ◆ Yours
                                                      </div>
                                                  )}
                                                  {state.isConflict && (
                                                      <div className="rounded px-1.5 py-0.5 text-[9px] font-black bg-orange-300 text-orange-900 leading-tight">
                                                          ⚠ Conflict
                                                      </div>
                                                  )}
                                                  {!state.hasBooking &&
                                                      !state.isPending &&
                                                      !state.isPast &&
                                                      canSelect && (
                                                          <div className="opacity-0 group-hover:opacity-100 text-[9px] text-emerald-600 font-bold transition-opacity">
                                                              + Select
                                                          </div>
                                                      )}
                                              </div>
                                          );
                                      })}
                                  </div>
                              ))}
                    </div>
                </div>
            </div>

            {/* Legend */}
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/40">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <LegendItem color="bg-white border border-slate-200" label="Available" />
                    <LegendItem color="bg-red-200 border border-red-300" label="Booked (TOAL)" />
                    <LegendItem
                        color="bg-yellow-200 border border-yellow-300"
                        label="Pending approval"
                    />
                    <LegendItem
                        color="bg-amber-200 border border-amber-300"
                        label="Emergency/Recovery"
                    />
                    <LegendItem color="bg-blue-300 border border-blue-400" label="Your selection" />
                    <LegendItem color="bg-orange-300 border border-orange-400" label="Conflict" />
                    <LegendItem color="bg-slate-100 border border-slate-200" label="Past" />
                </div>
                <p className="text-[10px] text-slate-400 font-medium mt-2">
                    Click any available slot to auto-fill booking times. Operator identities are
                    never shown.
                </p>
            </div>
        </div>
    );
}

function LegendItem({ color, label }: { color: string; label: string }) {
    return (
        <div className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded-sm ${color}`} />
            <span className="text-[10px] text-slate-500 font-semibold">{label}</span>
        </div>
    );
}
