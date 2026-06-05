'use client'

import * as React from 'react'
import { Calendar } from '@workspace/ui/components/calendar'
import { Button } from '@workspace/ui/components/button'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { Badge } from '@workspace/ui/components/badge'
import { cn } from '@workspace/ui/lib/utils'
import { format, isBefore, startOfToday } from 'date-fns'
import { Clock } from 'lucide-react'
import { Skeleton } from '@workspace/ui/components/skeleton'
import { bookingService } from '@/services/booking.service'
import type { AvailabilityResponse, AvailabilitySlotRaw } from '@/services/booking.types'

interface AvailabilityCalendarProps {
    siteId: string
    onSelect: (
        date: Date | undefined,
        startTime: string | undefined,
        endTime: string | undefined,
    ) => void
}

type SlotStatus = 'available' | 'booked' | 'pending' | 'emergency'

interface TimeSlot {
    time: string
    status: SlotStatus
}

/** Parse "HH:mm" into total minutes since midnight */
function parseTime(t: string): number {
    const [h, m] = t.split(':').map(Number)
    return (h ?? 0) * 60 + (m ?? 0)
}

/** Build the list of 30-min slots between activationStart and activationEnd */
function buildSlots(
    activationStart: string,
    activationEnd: string,
    existingBookings: AvailabilitySlotRaw[],
    selectedDate: Date,
): TimeSlot[] {
    const startMins = parseTime(activationStart)
    const endMins = parseTime(activationEnd)
    const slots: TimeSlot[] = []

    const dateStr = format(selectedDate, 'yyyy-MM-dd')

    for (let mins = startMins; mins < endMins; mins += 30) {
        const h = Math.floor(mins / 60)
        const m = mins % 60
        const timeStr = `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`

        // Full ISO time for this slot on the selected date
        const slotISO = `${dateStr}T${timeStr}:00.000Z`

        let status: SlotStatus = 'available'

        for (const b of existingBookings) {
            const bStart = new Date(b.startTime).toISOString()
            const bEnd = new Date(b.endTime).toISOString()
            if (slotISO >= bStart && slotISO < bEnd) {
                if (b.useCategory === 'emergency_recovery') {
                    status = 'emergency'
                } else if (b.status === 'PENDING') {
                    status = 'pending'
                } else {
                    status = 'booked'
                }
                break
            }
        }

        slots.push({ time: timeStr, status })
    }
    return slots
}

export function AvailabilityCalendar({ siteId, onSelect }: AvailabilityCalendarProps) {
    const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(undefined)
    const [startTime, setStartTime] = React.useState<string | null>(null)
    const [endTime, setEndTime] = React.useState<string | null>(null)
    const [availability, setAvailability] = React.useState<AvailabilityResponse | null>(null)
    const [isLoading, setIsLoading] = React.useState(false)
    const [fetchError, setFetchError] = React.useState<string | null>(null)

    const today = startOfToday()

    const handleDateSelect = async (date: Date | undefined) => {
        setSelectedDate(date)
        setStartTime(null)
        setEndTime(null)
        onSelect(date, undefined, undefined)

        if (!date) {
            setAvailability(null)
            return
        }

        setIsLoading(true)
        setFetchError(null)
        try {
            const result = await bookingService.getAvailability(
                siteId,
                format(date, 'yyyy-MM-dd'),
            )
            setAvailability(result)
        } catch (err: any) {
            setFetchError(err?.message ?? 'Failed to load availability')
            setAvailability(null)
        } finally {
            setIsLoading(false)
        }
    }

    const availableTimes = React.useMemo<TimeSlot[]>(() => {
        if (!selectedDate || !availability) return []
        return buildSlots(
            availability.activationStartTime ?? '08:00',
            availability.activationEndTime ?? '20:00',
            availability.existingBookings ?? [],
            selectedDate,
        )
    }, [selectedDate, availability])

    const handleTimeClick = (time: string, status: SlotStatus) => {
        if (status === 'booked' || status === 'emergency') return

        if (!startTime || (startTime && endTime)) {
            setStartTime(time)
            setEndTime(null)
            onSelect(selectedDate, time, undefined)
        } else {
            if (time < startTime) {
                setStartTime(time)
                setEndTime(null)
                onSelect(selectedDate, time, undefined)
            } else if (time === startTime) {
                setStartTime(null)
                setEndTime(null)
                onSelect(selectedDate, undefined, undefined)
            } else {
                setEndTime(time)
                onSelect(selectedDate, startTime, time)
            }
        }
    }

    const isSlotSelected = (time: string) => {
        if (startTime && !endTime) return time === startTime
        if (startTime && endTime) return time >= startTime && time <= endTime
        return false
    }

    const calculateDuration = () => {
        if (!startTime || !endTime) return null
        const [startH, startM] = startTime.split(':').map(Number)
        const [endH, endM] = endTime.split(':').map(Number)
        let diffMins = (endH! * 60 + endM!) - (startH! * 60 + startM!)
        if (diffMins < 0) diffMins += 24 * 60
        const hours = Math.floor(diffMins / 60)
        const mins = diffMins % 60
        if (hours === 0) return `${mins}m`
        if (mins === 0) return `${hours}h`
        return `${hours}h ${mins}m`
    }

    const getStatusStyles = (status: SlotStatus) => {
        switch (status) {
            case 'booked':
                return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50 cursor-not-allowed opacity-60'
            case 'pending':
                return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
            case 'emergency':
                return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50 cursor-not-allowed opacity-60'
            default:
                return 'bg-background hover:bg-muted'
        }
    }

    const getStatusBadge = (status: SlotStatus) => {
        switch (status) {
            case 'booked':
                return (
                    <Badge variant="outline" className="text-[9px] bg-indigo-100 border-indigo-300 text-indigo-700 px-1 py-0 h-4">
                        TOAL
                    </Badge>
                )
            case 'pending':
                return (
                    <Badge variant="outline" className="text-[9px] bg-amber-100 border-amber-300 text-amber-700 px-1 py-0 h-4">
                        Pending
                    </Badge>
                )
            case 'emergency':
                return (
                    <Badge variant="outline" className="text-[9px] bg-rose-100 border-rose-300 text-rose-700 px-1 py-0 h-4">
                        Emergency
                    </Badge>
                )
            default:
                return null
        }
    }

    return (
        <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300 w-full">
            <div className="flex flex-col sm:flex-row divide-y sm:divide-y-0 sm:divide-x overflow-hidden rounded-2xl border bg-background shadow-sm w-full">
                {/* Calendar Side */}
                <div className="p-2 sm:p-3 flex justify-center bg-muted/10 w-full sm:w-auto shrink-0">
                    <Calendar
                        mode="single"
                        onSelect={handleDateSelect}
                        selected={selectedDate}
                        disabled={(date) => isBefore(date, today)}
                        className="p-0 border-none bg-transparent"
                    />
                </div>

                {/* Time Slots Side */}
                <div className="relative flex-1 bg-background">
                    {!selectedDate ? (
                        <div className="flex h-full flex-col items-center justify-center p-6 text-center space-y-3 bg-muted/5">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                <Clock className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                                <p className="text-sm font-bold">Select a Date</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Choose a date to view available operational windows.
                                </p>
                            </div>
                        </div>
                    ) : (
                        <div className="absolute inset-0 flex flex-col">
                            <div className="p-3 border-b bg-muted/20 flex items-center justify-between shadow-sm z-10">
                                <p className="text-xs font-black uppercase tracking-wider text-foreground">
                                    Time Slots
                                </p>
                                {availability && (
                                    <p className="text-[10px] text-muted-foreground font-medium">
                                        {availability.activationStartTime} — {availability.activationEndTime}
                                    </p>
                                )}
                            </div>

                            {isLoading ? (
                                <div className="flex-1 p-3 space-y-2 overflow-hidden">
                                    <Skeleton className="h-9 w-full rounded-md" />
                                    <Skeleton className="h-9 w-full rounded-md" />
                                    <Skeleton className="h-9 w-full rounded-md" />
                                    <Skeleton className="h-9 w-full rounded-md" />
                                    <Skeleton className="h-9 w-full rounded-md" />
                                </div>
                            ) : fetchError ? (
                                <div className="flex flex-1 items-center justify-center p-4 text-center">
                                    <p className="text-xs text-destructive font-medium">{fetchError}</p>
                                </div>
                            ) : availableTimes.length === 0 ? (
                                <div className="flex flex-1 items-center justify-center p-4 text-center">
                                    <p className="text-xs text-muted-foreground">No slots available for this date.</p>
                                </div>
                            ) : (
                                <ScrollArea className="flex-1 px-1 py-1 h-[220px]">
                                    <div className="grid grid-cols-1 gap-2 pb-2">
                                        {availableTimes.map((slot) => {
                                            const selected = isSlotSelected(slot.time)
                                            const isInRange =
                                                startTime &&
                                                endTime &&
                                                slot.time > startTime &&
                                                slot.time < endTime

                                            return (
                                                <Button
                                                    key={slot.time}
                                                    onClick={() => handleTimeClick(slot.time, slot.status)}
                                                    variant="outline"
                                                    className={cn(
                                                        'w-full justify-between h-auto py-2 transition-all border',
                                                        getStatusStyles(slot.status),
                                                        selected && 'text-primary border-2 border-primary hover:bg-primary/20',
                                                        !selected && isInRange && 'bg-primary/5 border-primary/40 text-foreground',
                                                    )}
                                                    disabled={slot.status === 'booked' || slot.status === 'emergency'}
                                                >
                                                    <span className={cn(
                                                        'font-bold text-sm font-mono',
                                                        selected ? 'text-primary' : 'text-foreground',
                                                    )}>
                                                        {slot.time}
                                                    </span>
                                                    <div className="flex items-center gap-1.5">
                                                        {!selected && !isInRange && getStatusBadge(slot.status)}
                                                        {!selected && isInRange && (
                                                            <span className="text-[10px] font-bold uppercase tracking-wider text-primary/70">
                                                                Range
                                                            </span>
                                                        )}
                                                    </div>
                                                </Button>
                                            )
                                        })}
                                    </div>
                                </ScrollArea>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Legend */}
            <div className="grid grid-cols-2 gap-x-2 gap-y-2 px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-indigo-100 border border-indigo-300" /> Allocated
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-amber-100 border border-amber-300" /> Pending
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-rose-100 border border-rose-300" /> Emergency
                </div>
                <div className="flex items-center gap-1.5">
                    <div className="size-2.5 rounded-full bg-background border border-border" /> Available
                </div>
            </div>

            {/* Selected window summary */}
            {(startTime || endTime) && selectedDate && (
                <div className="mt-4 p-4 rounded-xl border border-primary/20 bg-primary/5 flex items-center justify-between animate-in fade-in zoom-in-95 duration-300">
                    <div className="space-y-1">
                        <p className="text-[10px] font-black uppercase tracking-widest text-primary/70">Selected Window</p>
                        <p className="text-sm font-bold text-foreground">
                            {format(selectedDate, 'MMM dd')} • {startTime} {endTime ? `— ${endTime}` : ''}
                        </p>
                    </div>
                    {endTime && (
                        <div className="text-right space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-muted-foreground">Duration</p>
                            <Badge variant="secondary" className="bg-background font-mono text-xs shadow-sm border-primary/10">
                                {calculateDuration()}
                            </Badge>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
