/**
 * Time-of-day greeting and localized date utilities.
 * Automatically aligns with the user's browser/system timezone or a specified IANA timezone.
 */

/**
 * Returns a time-of-day greeting ('Good morning', 'Good afternoon', or 'Good evening')
 * aligned with the user's local timezone or an optional target timezone.
 *
 * Time ranges:
 * - 04:00 - 11:59: Good morning
 * - 12:00 - 16:59: Good afternoon
 * - 17:00 - 03:59: Good evening
 *
 * @param date - Date object (defaults to new Date())
 * @param timeZone - Optional IANA timezone string (e.g. 'Asia/Kolkata', 'America/New_York')
 */
export function getTimeGreeting(date: Date = new Date(), timeZone?: string): string {
  let hour = date.getHours();

  if (timeZone) {
    try {
      const formatter = new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        hour12: false,
        timeZone,
      });
      const parts = formatter.formatToParts(date);
      const hourPart = parts.find((p) => p.type === 'hour');
      if (hourPart) {
        hour = parseInt(hourPart.value, 10) % 24;
      }
    } catch {
      // Fallback to local getHours() if invalid timezone passed
      hour = date.getHours();
    }
  }

  if (hour >= 4 && hour < 12) {
    return 'Good morning';
  }
  if (hour >= 12 && hour < 17) {
    return 'Good afternoon';
  }
  return 'Good evening';
}

/**
 * Returns the formatted date string (e.g., 'Thursday, Oct 8')
 * aligned with the user's local timezone or an optional target timezone.
 *
 * @param date - Date object (defaults to new Date())
 * @param timeZone - Optional IANA timezone string
 */
export function getFormattedCurrentDate(date: Date = new Date(), timeZone?: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
      ...(timeZone ? { timeZone } : {}),
    }).format(date);
  } catch {
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'short',
      day: 'numeric',
    });
  }
}
