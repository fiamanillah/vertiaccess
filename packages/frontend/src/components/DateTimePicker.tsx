import * as React from 'react';
import { format, parseISO, startOfDay } from 'date-fns';
import { Calendar as CalendarIcon, Clock } from 'lucide-react';
import { cn } from './ui/utils';
import { Button } from './ui/button';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';

interface DateTimePickerProps {
    dateValue: string;
    timeValue: string;
    onDateChange: (date: string) => void;
    onTimeChange: (time: string) => void;
    label?: string;
    required?: boolean;
    disablePastDates?: boolean;
    minimumDate?: string | undefined;
}

export function DateTimePicker({
    dateValue,
    timeValue,
    onDateChange,
    onTimeChange,
    label,
    required = false,
    disablePastDates = false,
    minimumDate,
}: DateTimePickerProps) {
    // Generate time options in 24-hour format (hourly intervals)
    const timeOptions = React.useMemo(() => {
        const options = [];
        for (let hour = 0; hour < 24; hour++) {
            options.push(`${hour.toString().padStart(2, '0')}:00`);
        }
        return options;
    }, []);

    const minDate = React.useMemo(() => {
        if (minimumDate) return startOfDay(parseISO(minimumDate));
        if (disablePastDates) return startOfDay(new Date());
        return undefined;
    }, [minimumDate, disablePastDates]);

    return (
        <div className="space-y-2.5">
            {label && (
                <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] ml-1">
                    {label} {required && <span className="text-red-500">*</span>}
                </label>
            )}
            <div className="flex flex-col sm:flex-row gap-3">
                {/* Date Picker */}
                <Popover>
                    <PopoverTrigger asChild>
                        <Button
                            variant="outline"
                            className={cn(
                                'flex-1 h-14 justify-start text-left font-bold rounded-2xl border-slate-200 bg-white hover:bg-slate-50 shadow-sm transition-all hover:border-blue-300',
                                !dateValue && 'text-slate-400'
                            )}
                        >
                            <CalendarIcon className="mr-3 h-4 w-4 text-blue-500" />
                            {dateValue ? (
                                format(parseISO(dateValue), 'PPP')
                            ) : (
                                <span>Pick a date</span>
                            )}
                        </Button>
                    </PopoverTrigger>
                    <PopoverContent
                        className="w-auto p-0 rounded-3xl overflow-hidden shadow-2xl border-slate-100 ring-1 ring-slate-200/50"
                        align="start"
                    >
                        <Calendar
                            mode="single"
                            selected={dateValue ? parseISO(dateValue) : undefined}
                            onSelect={(d: Date | undefined) =>
                                d && onDateChange(format(d, 'yyyy-MM-dd'))
                            }
                            disabled={(date: Date) => !!minDate && date < minDate}
                            initialFocus
                            className="p-4"
                        />
                    </PopoverContent>
                </Popover>

                {/* Time Picker */}
                <Select value={timeValue} onValueChange={onTimeChange}>
                    <SelectTrigger className="w-full sm:w-36 h-14 bg-white border-slate-200 rounded-2xl font-black shadow-sm transition-all hover:border-blue-300 focus:ring-4 focus:ring-blue-600/5">
                        <div className="flex items-center gap-2">
                            <Clock className="size-4 text-slate-400" />
                            <SelectValue placeholder="Select time" />
                        </div>
                    </SelectTrigger>
                    <SelectContent
                        side="bottom"
                        align="start"
                        sideOffset={8}
                        className="rounded-2xl border-slate-100 shadow-3xl bg-white"
                    >
                        {timeOptions.map(time => (
                            <SelectItem
                                key={time}
                                value={time}
                                className="rounded-lg font-bold py-2.5 px-3 cursor-pointer text-sm m-1"
                            >
                                {time}
                            </SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>
        </div>
    );
}
