/**
 * Date validation utilities for UK UTM system
 * Implements aviation-grade date validation with working day calculations
 */

// UK Bank Holidays 2026 (can be expanded as needed)
const UK_BANK_HOLIDAYS_2026 = [
  "2026-01-01", // New Year's Day
  "2026-04-03", // Good Friday
  "2026-04-06", // Easter Monday
  "2026-05-04", // Early May Bank Holiday
  "2026-05-25", // Spring Bank Holiday
  "2026-08-31", // Summer Bank Holiday
  "2026-12-25", // Christmas Day
  "2026-12-28", // Boxing Day (substitute)
];

/**
 * Checks if a date is a weekend (Saturday or Sunday)
 *
 * @param date - Date to check
 * @returns true if weekend, false otherwise
 */
export function isWeekend(date: Date): boolean {
  const dayOfWeek = date.getDay();
  return dayOfWeek === 0 || dayOfWeek === 6; // 0 = Sunday, 6 = Saturday
}

/**
 * Checks if a date is a UK bank holiday
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns true if bank holiday, false otherwise
 */
export function isBankHoliday(dateString: string): boolean {
  return UK_BANK_HOLIDAYS_2026.includes(dateString);
}

/**
 * Checks if a date is a working day (not weekend, not bank holiday)
 *
 * @param date - Date to check
 * @returns true if working day, false otherwise
 */
export function isWorkingDay(date: Date): boolean {
  const dateString = formatDateForInput(date);
  return !isWeekend(date) && !isBankHoliday(dateString);
}

/**
 * Calculates the minimum allowed date, which is 5 working days from today
 * Working days exclude weekends (Saturday and Sunday) and UK bank holidays
 *
 * @returns ISO date string (YYYY-MM-DD format) for the minimum allowed date
 */
export function getMinimumAllowedDate(): string {
  const today = new Date();
  let workingDaysAdded = 0;
  let currentDate = new Date(today);

  // Keep adding days until we've counted 5 working days
  while (workingDaysAdded < 5) {
    currentDate.setDate(currentDate.getDate() + 1);

    if (isWorkingDay(currentDate)) {
      workingDaysAdded++;
    }
  }

  // If the calculated date falls on a weekend or holiday, move to next working day
  while (!isWorkingDay(currentDate)) {
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return formatDateForInput(currentDate);
}

/**
 * Gets today's date in YYYY-MM-DD format
 * Used for disabling past dates
 *
 * @returns ISO date string (YYYY-MM-DD format) for today
 */
export function getTodayDate(): string {
  return formatDateForInput(new Date());
}

/**
 * Formats a Date object to YYYY-MM-DD string for HTML date inputs
 *
 * @param date - Date object to format
 * @returns Formatted date string (YYYY-MM-DD)
 */
export function formatDateForInput(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

/**
 * Validates if a given date meets all requirements:
 * 1. Is at least 5 working days in the future
 * 2. Is itself a working day (not weekend or bank holiday)
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns Object with validation result and error message if invalid
 */
export function validateOperationDate(dateString: string): {
  isValid: boolean;
  errorMessage?: string;
  errorType?: "weekend" | "holiday" | "too-soon" | "past";
} {
  if (!dateString) {
    return {
      isValid: false,
      errorMessage: "Please select a date",
      errorType: "past",
    };
  }

  const selectedDate = new Date(dateString + "T00:00:00");
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Check if date is in the past
  if (selectedDate < today) {
    return {
      isValid: false,
      errorMessage: "Cannot select a date in the past",
      errorType: "past",
    };
  }

  // Weekend validation removed - operations can now be scheduled on weekends
  // if (isWeekend(selectedDate)) {
  //   return {
  //     isValid: false,
  //     errorMessage: 'Operations cannot be scheduled on weekends. Please select a weekday.',
  //     errorType: 'weekend'
  //   };
  // }

  // Check if selected date is a bank holiday
  if (isBankHoliday(dateString)) {
    return {
      isValid: false,
      errorMessage:
        "Operations cannot be scheduled on UK bank holidays. Please select another date.",
      errorType: "holiday",
    };
  }

  // Check if date is at least 5 working days from today
  const minDate = new Date(getMinimumAllowedDate() + "T00:00:00");
  if (selectedDate < minDate) {
    return {
      isValid: false,
      errorMessage:
        "Operations must be booked at least 5 working days in advance.",
      errorType: "too-soon",
    };
  }

  return { isValid: true };
}

/**
 * Checks if a given date is valid (simplified version for min attribute)
 *
 * @param dateString - Date string in YYYY-MM-DD format
 * @returns true if date is valid, false otherwise
 */
export function isDateValid(dateString: string): boolean {
  if (!dateString) return false;

  const selectedDate = new Date(dateString + "T00:00:00");
  const minDate = new Date(getMinimumAllowedDate() + "T00:00:00");

  // Only check if date is after minimum date and not a bank holiday (weekends now allowed)
  return selectedDate >= minDate && !isBankHoliday(dateString);
}

/**
 * Calculates the number of working days between two dates
 *
 * @param startDate - Start date
 * @param endDate - End date
 * @returns Number of working days between the dates
 */
export function calculateWorkingDays(startDate: Date, endDate: Date): number {
  let count = 0;
  const currentDate = new Date(startDate);

  while (currentDate <= endDate) {
    if (isWorkingDay(currentDate)) {
      count++;
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return count;
}

/**
 * Finds the next working day from a given date
 *
 * @param date - Starting date
 * @returns Next working day as Date object
 */
export function getNextWorkingDay(date: Date): Date {
  const nextDay = new Date(date);
  nextDay.setDate(nextDay.getDate() + 1);

  while (!isWorkingDay(nextDay)) {
    nextDay.setDate(nextDay.getDate() + 1);
  }

  return nextDay;
}
