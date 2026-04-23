import { useState, useRef, useEffect } from 'react';
import { Calendar, Clock, ChevronLeft, ChevronRight } from 'lucide-react';

interface DateTimePickerProps {
  dateValue: string;
  timeValue: string;
  onDateChange: (date: string) => void;
  onTimeChange: (time: string) => void;
  label?: string;
  required?: boolean;
  disablePastDates?: boolean;
  minimumDate?: string; // YYYY-MM-DD — disables all dates before this (takes precedence over disablePastDates)
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
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const calendarRef = useRef<HTMLDivElement>(null);
  const timeRef = useRef<HTMLDivElement>(null);

  // Generate time options in 24-hour format (30-minute intervals)
  const timeOptions = [];
  for (let hour = 0; hour < 24; hour++) {
    for (let minute = 0; minute < 60; minute += 30) {
      const timeStr = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      timeOptions.push(timeStr);
    }
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(event.target as Node)) {
        setShowCalendar(false);
      }
      if (timeRef.current && !timeRef.current.contains(event.target as Node)) {
        setShowTimeDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleDateSelect = (date: Date) => {
    const dateStr = date.toISOString().split('T')[0];
    onDateChange(dateStr);
    setShowCalendar(false);
  };

  const handleTimeSelect = (time: string) => {
    onTimeChange(time);
    setShowTimeDropdown(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDayOfWeek = firstDay.getDay();

    const days = [];
    
    // Add empty cells for days before the first day of the month
    for (let i = 0; i < startingDayOfWeek; i++) {
      days.push(null);
    }
    
    // Add all days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(new Date(year, month, day));
    }
    
    return days;
  };

  const isToday = (date: Date | null) => {
    if (!date) return false;
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const isPastDate = (date: Date | null) => {
    if (!date) return false;
    // If a specific minimumDate is provided, use that as the threshold
    if (minimumDate) {
      const minDate = new Date(minimumDate + 'T00:00:00');
      const checkDate = new Date(date);
      checkDate.setHours(0, 0, 0, 0);
      return checkDate < minDate;
    }
    if (!disablePastDates) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < today;
  };

  const isSelected = (date: Date | null) => {
    if (!date || !dateValue) return false;
    const selected = new Date(dateValue);
    return (
      date.getDate() === selected.getDate() &&
      date.getMonth() === selected.getMonth() &&
      date.getFullYear() === selected.getFullYear()
    );
  };

  const formatDisplayDate = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-GB', { 
      weekday: 'short', 
      day: 'numeric',
      month: 'short'
    });
  };

  const previousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1));
  };

  const monthYear = currentMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const days = getDaysInMonth(currentMonth);

  return (
    <div>
      {label && (
        <label className="block mb-2 text-sm">
          {label} {required && <span className="text-red-600">*</span>}
        </label>
      )}
      <div className="grid grid-cols-2 gap-3">
        {/* Date Picker */}
        <div className="relative" ref={calendarRef}>
          <button
            type="button"
            onClick={() => setShowCalendar(!showCalendar)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
          >
            <span className={dateValue ? 'text-gray-900' : 'text-gray-400'}>
              {dateValue ? formatDisplayDate(dateValue) : 'Select Date'}
            </span>
            <Calendar className="size-4 text-gray-500" />
          </button>

          {showCalendar && (
            <div className="absolute top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 p-4 w-80">
              {/* Calendar Header */}
              <div className="flex items-center justify-between mb-4">
                <button
                  type="button"
                  onClick={previousMonth}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <ChevronLeft className="size-5 text-gray-600" />
                </button>
                <span className="text-gray-900">{monthYear}</span>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1 hover:bg-gray-100 rounded transition-colors"
                >
                  <ChevronRight className="size-5 text-gray-600" />
                </button>
              </div>

              {/* Day Headers */}
              <div className="grid grid-cols-7 gap-1 mb-2">
                {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, i) => (
                  <div key={i} className="text-center text-xs text-gray-500 py-1">
                    {day}
                  </div>
                ))}
              </div>

              {/* Calendar Days */}
              <div className="grid grid-cols-7 gap-1">
                {days.map((date, index) => {
                  const isPast = (disablePastDates || !!minimumDate) && date && isPastDate(date);
                  const isDisabled = !date || isPast;
                  
                  return (
                    <button
                      key={index}
                      type="button"
                      onClick={() => date && !isPast && handleDateSelect(date)}
                      disabled={isDisabled}
                      className={`
                        p-2 text-sm rounded-full transition-colors
                        ${!date ? 'invisible' : ''}
                        ${isPast ? 'text-gray-300 cursor-not-allowed' : ''}
                        ${isSelected(date) && !isPast ? 'bg-indigo-600 text-white hover:bg-indigo-700' : ''}
                        ${isToday(date) && !isSelected(date) && !isPast ? 'bg-indigo-100 text-indigo-900 hover:bg-indigo-200' : ''}
                        ${!isSelected(date) && !isToday(date) && !isPast ? 'hover:bg-gray-100 text-gray-700' : ''}
                      `}
                    >
                      {date?.getDate()}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Time Picker */}
        <div className="relative" ref={timeRef}>
          <button
            type="button"
            onClick={() => setShowTimeDropdown(!showTimeDropdown)}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-600 focus:border-transparent flex items-center justify-between bg-white hover:bg-gray-50 transition-colors"
          >
            <span className={timeValue ? 'text-gray-900' : 'text-gray-400'}>
              {timeValue || 'Select Time'}
            </span>
            <Clock className="size-4 text-gray-500" />
          </button>

          {showTimeDropdown && (
            <div className="absolute top-full mt-2 bg-white border border-gray-300 rounded-lg shadow-lg z-50 max-h-64 overflow-y-auto w-full">
              {timeOptions.map((time) => (
                <button
                  key={time}
                  type="button"
                  onClick={() => handleTimeSelect(time)}
                  className={`
                    w-full px-4 py-2 text-left text-sm transition-colors
                    ${timeValue === time ? 'bg-indigo-600 text-white' : 'hover:bg-gray-100 text-gray-700'}
                  `}
                >
                  {time}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}