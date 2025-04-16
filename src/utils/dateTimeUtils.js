/**
 * Formats a date object or ISO string for display in the user's timezone
 * @param {Date|string} date - Date object or ISO string to format
 * @param {string} timezone - Target timezone
 * @param {object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDateInTimezone(date, timezone = 'UTC', options = {}) {
  const dateObj = typeof date === 'string' ? new Date(date) : date;
  
  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: timezone,
  };
  
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(dateObj);
}

/**
 * Creates a Date object for a specific date and time in a given timezone
 * @param {number} year - Year
 * @param {number} month - Month (0-11)
 * @param {number} day - Day of the month
 * @param {number} hour - Hour (0-23)
 * @param {number} minute - Minute
 * @param {string} timezone - Timezone identifier
 * @returns {Date} Date object
 */
export function createDateInTimezone(year, month, day, hour = 0, minute = 0, timezone = 'UTC') {
  // Create a date string in ISO format
  const dateString = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}T${String(hour).padStart(2, '0')}:${String(minute).padStart(2, '0')}:00`;
  
  // Create a formatter in the target timezone
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false,
  });
  
  // Parse the date in the target timezone
  return new Date(dateString);
}
