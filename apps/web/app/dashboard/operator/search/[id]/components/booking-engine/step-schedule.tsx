'use client';

import { Calendar } from 'lucide-react';
import { AvailabilityCalendar } from './availability-calendar';

interface StepScheduleProps {
    onSelect: (date: Date | undefined, startTime: string | undefined, endTime: string | undefined) => void;
}

export function StepSchedule({ onSelect }: StepScheduleProps) {
    return (
        <div className="space-y-4">
            <p className="text-sm font-bold flex items-center gap-2">
                <Calendar className="h-4 w-4 text-primary" />
                Schedule Flight
            </p>
            <div className="p-1">
                <AvailabilityCalendar onSelect={onSelect} />
            </div>
        </div>
    );
}
