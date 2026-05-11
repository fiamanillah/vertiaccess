'use client'

import * as React from 'react'
import { Calendar } from '@workspace/ui/components/calendar'
import { Button } from '@workspace/ui/components/button'
import { ScrollArea } from '@workspace/ui/components/scroll-area'
import { Badge } from '@workspace/ui/components/badge'
import { cn } from '@workspace/ui/lib/utils'
import { isBefore, startOfToday } from 'date-fns'
import { Clock } from 'lucide-react'

interface AvailabilityCalendarProps {
  onSelect: (
    date: Date | undefined,
    startTime: string | undefined,
    endTime: string | undefined,
  ) => void
}

type SlotStatus = 'available' | 'booked' | 'pending' | 'emergency' | 'conflict'

interface TimeSlot {
  time: string
  status: SlotStatus
}

export function AvailabilityCalendar({ onSelect }: AvailabilityCalendarProps) {
  const [selectedDate, setSelectedDate] = React.useState<Date | undefined>(
    undefined,
  )
  const [startTime, setStartTime] = React.useState<string | null>(null)
  const [endTime, setEndTime] = React.useState<string | null>(null)

  const today = startOfToday()

  // Mock dynamic generation of time slots with statuses
  const availableTimes = React.useMemo<TimeSlot[]>(() => {
    if (!selectedDate) return []
    const times: TimeSlot[] = []
    const startHour = 9
    const endHour = 18

    for (let i = startHour; i <= endHour; i++) {
      for (const mins of ['00', '30']) {
        if (i === endHour && mins === '30') continue

        const timeString = `${i.toString().padStart(2, '0')}:${mins}`

        // Randomize statuses for mockup purposes based on date and time
        let status: SlotStatus = 'available'
        const rand = (selectedDate.getDate() + i + parseInt(mins)) % 15

        if (rand === 1 || rand === 2) status = 'booked'
        else if (rand === 3) status = 'pending'
        else if (rand === 4) status = 'emergency'
        else if (rand === 5) status = 'conflict'

        times.push({ time: timeString, status })
      }
    }
    return times
  }, [selectedDate])

  const handleDateSelect = (date: Date | undefined) => {
    setSelectedDate(date)
    setStartTime(null)
    setEndTime(null)
    onSelect(date, undefined, undefined)
  }

  const handleTimeClick = (time: string, status: SlotStatus) => {
    if (status === 'booked' || status === 'emergency') return // Cannot select fully booked or emergency

    if (!startTime || (startTime && endTime)) {
      // First click or reset
      setStartTime(time)
      setEndTime(null)
      onSelect(selectedDate, time, undefined)
    } else {
      // Second click: determine end time (must be after start time)
      if (time < startTime) {
        setStartTime(time)
        setEndTime(null)
        onSelect(selectedDate, time, undefined)
      } else if (time === startTime) {
        // Deselect if clicking the same time
        setStartTime(null)
        setEndTime(null)
        onSelect(selectedDate, undefined, undefined)
      } else {
        setEndTime(time)
        onSelect(selectedDate, startTime, time)
      }
    }
  }

  // Helper to determine if a slot is within the selected range
  const isSlotSelected = (time: string) => {
    if (startTime && !endTime) return time === startTime
    if (startTime && endTime) {
      return time >= startTime && time <= endTime
    }
    return false
  }

  const getStatusStyles = (status: SlotStatus) => {
    switch (status) {
      case 'booked':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-50 cursor-not-allowed opacity-60'
      case 'pending':
        return 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100'
      case 'emergency':
        return 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-50 cursor-not-allowed opacity-60'
      case 'conflict':
        return 'border-dashed border-rose-400 bg-background hover:bg-rose-50'
      default:
        return 'bg-background hover:bg-muted'
    }
  }

  const getStatusBadge = (status: SlotStatus) => {
    switch (status) {
      case 'booked':
        return (
          <Badge
            variant="outline"
            className="text-[9px] bg-indigo-100 border-indigo-300 text-indigo-700 px-1 py-0 h-4"
          >
            TOAL
          </Badge>
        )
      case 'pending':
        return (
          <Badge
            variant="outline"
            className="text-[9px] bg-amber-100 border-amber-300 text-amber-700 px-1 py-0 h-4"
          >
            Pending
          </Badge>
        )
      case 'emergency':
        return (
          <Badge
            variant="outline"
            className="text-[9px] bg-rose-100 border-rose-300 text-rose-700 px-1 py-0 h-4"
          >
            Emergency
          </Badge>
        )
      case 'conflict':
        return (
          <Badge
            variant="outline"
            className="text-[9px] bg-background border-rose-400 text-rose-600 px-1 py-0 h-4"
          >
            Conflict
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

        {/* Time Selection Side */}
        <div className="relative flex-1 bg-background">
          {!selectedDate ? (
            <div className="flex h-full flex-col items-center justify-center p-6 text-center space-y-3 bg-muted/5">
              <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-sm font-bold">Select a Date</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Choose a date on the calendar to view available operational
                  windows.
                </p>
              </div>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col">
              <div className="p-3 border-b bg-muted/20 flex items-center justify-between shadow-sm z-10">
                <p className="text-xs font-black uppercase tracking-wider text-foreground">
                  Time Slots
                </p>
                {(startTime || endTime) && (
                  <Badge className="text-[9px] px-1.5 py-0">
                    {startTime} {endTime ? `- ${endTime}` : ''}
                  </Badge>
                )}
              </div>
              <ScrollArea className="flex-1 px-3 py-3 h-[220px]">
                <div className="grid grid-cols-1 gap-2 pb-2">
                  {availableTimes.map((slot) => {
                    const selected = isSlotSelected(slot.time)
                    const isEndpoint =
                      slot.time === startTime || slot.time === endTime
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
                          selected &&
                            ' text-primary border-2 border-primary hover:bg-primary/20',
                          !selected &&
                            isInRange &&
                            'bg-primary/5 border-primary/40 text-foreground     ',
                        )}
                        disabled={
                          slot.status === 'booked' ||
                          slot.status === 'emergency'
                        }
                      >
                        <span
                          className={cn(
                            'font-bold text-sm font-mono',
                            selected ? 'text-primary' : 'text-foreground',
                          )}
                        >
                          {slot.time}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {!selected &&
                            !isInRange &&
                            getStatusBadge(slot.status)}

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
            </div>
          )}
        </div>
      </div>

      {/* Legend Below */}
      <div className="grid grid-cols-2 gap-x-2 gap-y-2 px-1 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-indigo-100 border border-indigo-300" />{' '}
          Booked
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-amber-100 border border-amber-300" />{' '}
          Pending
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 rounded-full bg-rose-100 border border-rose-300" />{' '}
          Emergency
        </div>
        <div className="flex items-center gap-1.5">
          <div className="size-2.5 border border-dashed border-rose-400 bg-background" />{' '}
          Conflict
        </div>
      </div>
    </div>
  )
}
