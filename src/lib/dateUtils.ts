
// src/lib/dateUtils.ts

/**
 * Formats a Date object or a date string into 'YYYY-MM-DD' format,
 * suitable for HTML date input fields.
 * Returns an empty string if the date is invalid or null/undefined.
 */
export const formatInputDate = (date?: Date | string | null): string => {
  if (!date) return '';
  try {
    const d = new Date(date);
    // Check if date is valid after parsing
    if (isNaN(d.getTime())) {
      return '';
    }
    // Ensure we use UTC parts to avoid timezone shifts when formatting to YYYY-MM-DD
    const year = d.getUTCFullYear();
    const month = (d.getUTCMonth() + 1).toString().padStart(2, '0');
    const day = d.getUTCDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    console.error("Error formatting input date:", e);
    return '';
  }
};

/**
 * Formats a date string (expected to be 'YYYY-MM-DD' or ISO string)
 * into a more readable format (e.g., "Month D, YYYY").
 * Returns 'N/A' or 'Invalid Date' if the input is invalid.
 */
export const formatDisplayDate = (dateString?: string | null): string => {
  if (!dateString) return 'N/A';
  try {
    // When parsing YYYY-MM-DD, it's treated as UTC. If it's already an ISO string, it's fine.
    // To be safe, especially if time component is missing, explicitly handle as UTC.
    const dateParts = dateString.split('-').map(Number);
    let dateObj;
    if (dateParts.length === 3) {
        dateObj = new Date(Date.UTC(dateParts[0], dateParts[1] - 1, dateParts[2]));
    } else {
        dateObj = new Date(dateString); // Try parsing as ISO string
    }

    if (isNaN(dateObj.getTime())) {
      return 'Invalid Date';
    }
    return dateObj.toLocaleDateString(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      timeZone: 'UTC', // Display in UTC to match input assumption
    });
  } catch (e) {
    console.error("Error formatting display date:", e);
    return 'Invalid Date';
  }
};

    