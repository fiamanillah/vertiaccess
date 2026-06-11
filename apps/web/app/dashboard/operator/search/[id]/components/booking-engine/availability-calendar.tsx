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
import { toast } from 'sonner'
import type {
  AvailabilityResponse,
  AvailabilitySlotRaw,
} from '@/services/booking.types'

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

/** Build the list of hourly slots between activationStart and activationEnd */
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

  for (let mins = startMins; mins <= endMins; mins += 60) {
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

export function AvailabilityCalendar({
  siteId,
  onSelect,
}: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    undefined,
  )
  const [startTime, setStartTime] = React.useState<string | null>(null)
  const [endTime, setEndTime] = React.useState<string | null>(null)
  const [hoveredTime, setHoveredTime] = React.useState<string | null>(null)
  const [availability, setAvailability] =
    React.useState<AvailabilityResponse | null>(null)
  const [isLoading, setIsLoading] = React.useState(false)
  const [fetchError, setFetchError] = React.useState<string | null>(null)
  const [validationError, setValidationError] = React.useState<string | null>(null)

  const today = startOfToday()

  const handleDateSelect = async (date: Date | undefined) => {
    setSelectedDate(date)
    setStartTime(null)
    setEndTime(null)
    setValidationError(null)
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
      '00:00',
      '24:00',
      availability.existingBookings ?? [],
      selectedDate,
    )
  }, [selectedDate, availability])

  const isRangeConflicted = (start: string, end: string) => {
    return availableTimes.some((slot) => {
      return (
        slot.time >= start &&
        slot.time < end &&
        (slot.status === 'booked' || slot.status === 'emergency')
      )
    })
  }

  const isHoveredRangeConflicted = React.useMemo(() => {
    if (!startTime || endTime || !hoveredTime || hoveredTime <= startTime) return false
    return isRangeConflicted(startTime, hoveredTime)
  }, [startTime, endTime, hoveredTime, availableTimes])

  const handleTimeClick = (time: string, status: SlotStatus) => {
    if (status === 'booked' || status === 'emergency') return

    if (!startTime || (startTime && endTime)) {
      if (time === '24:00') return
      setStartTime(time)
      setEndTime(null)
      setValidationError(null)
      onSelect(selectedDate, time, undefined)
    } else {
      if (time < startTime) {
        if (time === '24:00') return
        setStartTime(time)
        setEndTime(null)
        setValidationError(null)
        onSelect(selectedDate, time, undefined)
      } else if (time === startTime) {
        setStartTime(null)
        setEndTime(null)
        setValidationError(null)
        onSelect(selectedDate, undefined, undefined)
      } else {
        if (isRangeConflicted(startTime, time)) {
          toast.error(
            'Conflict detected: The selected time range overlaps with a booked slot.'
          )
          setValidationError(
            'The selected range overlaps with an existing booking. Please select a different end time.'
          )
          return
        }
        setEndTime(time)
        setValidationError(null)
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
    let diffMins = endH! * 60 + endM! - (startH! * 60 + startM!)
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
        return 'bg-indigo-50/40 text-indigo-700 border-indigo-200 dark:bg-indigo-950/20 dark:text-indigo-400 dark:border-indigo-900/60 cursor-not-allowed opacity-60 bg-[linear-gradient(45deg,rgba(99,102,241,0.05)_25%,transparent_25%,transparent_50%,rgba(99,102,241,0.05)_50%,rgba(99,102,241,0.05)_75%,transparent_75%,transparent)] bg-[size:12px_12px]'
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/10 dark:text-amber-400 dark:border-amber-900/60 hover:bg-amber-100/50'
      case 'emergency':
        return 'bg-rose-50/40 text-rose-700 border-rose-200 dark:bg-rose-950/20 dark:text-rose-400 dark:border-rose-900/60 cursor-not-allowed opacity-60 bg-[linear-gradient(45deg,rgba(244,63,94,0.05)_25%,transparent_25%,transparent_50%,rgba(244,63,94,0.05)_50%,rgba(244,63,94,0.05)_75%,transparent_75%,transparent)] bg-[size:12px_12px]'
      default:
        return 'bg-background hover:bg-muted border-border/80'
    }
  }

  const getStatusBadge = (status: SlotStatus) => {
    switch (status) {
      case 'booked':
        return (
          <Badge
            variant="outline"
            className="text-[9px] h-4 px-1 bg-indigo-100 dark:bg-indigo-950/40 border-indigo-300 dark:border-indigo-900 text-indigo-700 dark:text-indigo-400 font-bold"
          >
            TOAL
          </Badge>
        )
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="text-[9px] h-4 px-1 bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-400 font-bold"
          >
            Pending
          </Badge>
        )
      case 'emergency':
        return (
          <Badge
            variant="outline"
            className="text-[9px] h-4 px-1 bg-rose-100 dark:bg-rose-950/40 border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-400 font-bold"
          >
            Emerg
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
        <div className="relative flex-1 bg-background min-h-[300px]">
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
                <p className="text-sm font-semibold text-foreground">
                  Time Slots
                </p>
                {availability && (
                  <p className="text-xs text-muted-foreground font-medium">
                    {availability.activationStartTime} —{' '}
                    {availability.activationEndTime}
                  </p>
                )}
              </div>

              {isLoading ? (
                <div className="flex-1 p-3 grid grid-cols-4 gap-2 overflow-hidden">
                  {Array.from({ length: 12 }).map((_, i) => (
                    <Skeleton key={i} className="h-14 w-full rounded-xl" />
                  ))}
                </div>
              ) : fetchError ? (
                <div className="flex flex-1 items-center justify-center p-4 text-center">
                  <p className="text-xs text-destructive font-medium">
                    {fetchError}
                  </p>
                </div>
              ) : availableTimes.length === 0 ? (
                <div className="flex flex-1 items-center justify-center p-4 text-center">
                  <p className="text-xs text-muted-foreground">
                    No slots available for this date.
                  </p>
                </div>
              ) : (
                <>
                  {validationError && (
                    <div className="mx-3 mt-3 p-2 rounded-lg border border-rose-500/20 bg-rose-500/5 text-rose-700 dark:text-rose-400 flex items-start gap-2 text-xs font-semibold animate-in fade-in slide-in-from-top-1">
                      <Clock className="h-4 w-4 shrink-0 mt-0.5 text-rose-600 dark:text-rose-400" />
                      <div>
                        <p className="font-bold text-[11px] leading-tight">Selection Conflict</p>
                        <p className="text-[10px] font-medium leading-normal mt-0.5">{validationError}</p>
                      </div>
                    </div>
                  )}

                  <ScrollArea className="flex-1 px-3 py-3 h-[240px]">
                    <div className="grid grid-cols-4 gap-2 pb-3">
                      {availableTimes.map((slot) => {
                        const selected = isSlotSelected(slot.time)
                        const isInRange =
                          startTime &&
                          endTime &&
                          slot.time > startTime &&
                          slot.time < endTime

                        const isHovered = slot.time === hoveredTime
                        const isInHoverRange =
                          startTime &&
                          !endTime &&
                          hoveredTime &&
                          hoveredTime > startTime &&
                          slot.time > startTime &&
                          slot.time < hoveredTime

                        const isHoverTarget =
                          startTime &&
                          !endTime &&
                          hoveredTime &&
                          hoveredTime > startTime &&
                          slot.time === hoveredTime

                        const getSelectionBadge = () => {
                          if (selected) {
                            if (slot.time === startTime) {
                              return (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] h-4 px-1 bg-primary/10 border-primary text-primary font-bold"
                                >
                                  Start
                                </Badge>
                              )
                            }
                            if (slot.time === endTime) {
                              return (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] h-4 px-1 bg-primary/10 border-primary text-primary font-bold"
                                >
                                  End
                                </Badge>
                              )
                            }
                          }
                          if (isInRange) {
                            return (
                              <span className="text-[9px] font-bold text-primary/70">
                                Range
                              </span>
                            )
                          }
                          if (isHoverTarget) {
                            if (isHoveredRangeConflicted) {
                              return (
                                <Badge
                                  variant="outline"
                                  className="text-[9px] h-4 px-1 bg-rose-100 dark:bg-rose-950 border-rose-300 dark:border-rose-900 text-rose-700 dark:text-rose-400 font-bold animate-pulse"
                                >
                                  Conflict
                                </Badge>
                              )
                            }
                            return (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1 bg-primary/15 border-primary/80 text-primary font-bold"
                              >
                                Set End
                              </Badge>
                            )
                          }
                          if (isInHoverRange) {
                            if (isHoveredRangeConflicted) {
                              return (
                                <span className="text-[9px] font-bold text-rose-600 dark:text-rose-400 italic">
                                  Overlap
                                </span>
                              )
                            }
                            return (
                              <span className="text-[9px] font-semibold text-primary/60 italic">
                                Preview
                              </span>
                            )
                          }
                          if (
                            !startTime &&
                            isHovered &&
                            slot.status !== 'booked' &&
                            slot.status !== 'emergency'
                          ) {
                            if (slot.time === '24:00') return null
                            return (
                              <Badge
                                variant="outline"
                                className="text-[9px] h-4 px-1 bg-primary/5 border-primary/45 text-primary/80 font-bold"
                              >
                                Set Start
                              </Badge>
                            )
                          }
                          return getStatusBadge(slot.status)
                        }

                        return (
                          <Button
                            key={slot.time}
                            onClick={() =>
                              handleTimeClick(slot.time, slot.status)
                            }
                            onMouseEnter={() => {
                              if (
                                slot.status !== 'booked' &&
                                slot.status !== 'emergency'
                              ) {
                                setHoveredTime(slot.time)
                              }
                            }}
                            onMouseLeave={() => setHoveredTime(null)}
                            variant="outline"
                            className={cn(
                              'w-full flex flex-col items-center justify-center p-2.5 h-14 transition-all border rounded-xl select-none relative',
                              !selected &&
                                !isInRange &&
                                !isInHoverRange &&
                                !isHoverTarget &&
                                (!isHovered || startTime)
                                ? getStatusStyles(slot.status)
                                : slot.status === 'pending'
                                  ? 'bg-amber-50/50'
                                  : 'bg-background border-border/80',
                              selected &&
                                'text-primary border-2 border-primary bg-primary/5 hover:bg-primary/20',
                              !selected &&
                                isInRange &&
                                'bg-primary/5 border-primary/40 text-foreground',
                              !selected &&
                                isInHoverRange &&
                                (isHoveredRangeConflicted
                                  ? 'bg-rose-500/5 dark:bg-rose-950/10 border-dashed border-rose-400 text-rose-700 dark:text-rose-400'
                                  : 'bg-primary/5 border-dashed border-primary/30 text-foreground/80'),
                              !selected &&
                                isHoverTarget &&
                                (isHoveredRangeConflicted
                                  ? 'border-rose-500 bg-rose-50 dark:bg-rose-950/30 text-rose-700 dark:text-rose-400'
                                  : 'border-primary/60 bg-primary/10 text-primary'),
                              !selected &&
                                !startTime &&
                                isHovered &&
                                slot.time !== '24:00' &&
                                'border-primary/40 bg-primary/5 text-primary',
                              slot.time === '24:00' &&
                                !startTime &&
                                'cursor-not-allowed opacity-60 bg-muted/20 border-border/50 text-muted-foreground',
                            )}
                            disabled={
                              slot.status === 'booked' ||
                              slot.status === 'emergency'
                            }
                          >
                            <span
                              className={cn(
                                'font-bold text-xs font-mono tracking-tight leading-none',
                                selected ? 'text-primary' : 'text-foreground',
                              )}
                            >
                              {slot.time}
                            </span>
                            <div className="mt-1 flex items-center justify-center h-4">
                              {getSelectionBadge()}
                            </div>
                          </Button>
                        )
                      })}
                    </div>
                  </ScrollArea>
                </>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Legend */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-2 px-1 text-xs font-semibold text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-indigo-100 border border-indigo-300 dark:bg-indigo-950/40 dark:border-indigo-900" />{' '}
          Allocated (TOAL)
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-amber-100 border border-amber-300 dark:bg-amber-950/40 dark:border-amber-900" />{' '}
          Pending
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-rose-100 border border-rose-300 dark:bg-rose-950/40 dark:border-rose-900" />{' '}
          Emergency Standby
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-background border border-border" />{' '}
          Available
        </div>
      </div>

      {/* Selected window summary */}
      {(startTime || endTime) && selectedDate && (
        <div
          className={cn(
            'mt-4 p-4 rounded-xl border flex items-center justify-between transition-all duration-300 animate-in fade-in zoom-in-95',
            endTime
              ? 'border-primary/20 bg-primary/5'
              : 'border-amber-500/30 bg-amber-500/5',
          )}
        >
          <div className="space-y-1">
            <p
              className={cn(
                'text-xs font-semibold uppercase tracking-wider',
                endTime
                  ? 'text-primary/70'
                  : 'text-amber-600 dark:text-amber-500',
              )}
            >
              {endTime ? 'Selected Window' : 'Select End Time'}
            </p>
            <p className="text-sm font-bold text-foreground">
              {format(selectedDate, 'MMM dd')} • {startTime}{' '}
              {endTime ? `— ${endTime}` : '→ ??:??'}
            </p>
          </div>
          {endTime ? (
            <div className="text-right space-y-1">
              <p className="text-xs font-semibold text-muted-foreground">
                Duration
              </p>
              <Badge
                variant="secondary"
                className="bg-background font-mono text-xs shadow-sm border-primary/10"
              >
                {calculateDuration()}
              </Badge>
            </div>
          ) : (
            <div className="text-right">
              <Badge
                variant="outline"
                className="bg-amber-100 dark:bg-amber-950/40 border-amber-300 dark:border-amber-900 text-amber-700 dark:text-amber-400 font-bold text-xs py-1 px-2.5"
              >
                End time required
              </Badge>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
